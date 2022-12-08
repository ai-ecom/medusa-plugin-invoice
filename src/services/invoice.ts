import { EventBusService, TransactionBaseService, OrderService, TotalsService, IFileService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';
import { generateInvoicePDF } from "../utils/invoice-pdf"
import { CreateInvoiceInput, UpdateInvoiceInput } from '../types/invoice';
import { Invoice, InvoicePaidStatus, InvoiceStatus } from '../models/invoice';
import { InvoiceRepository } from "../repositories/invoice"
import InvoiceSettingsService from './invoice-settings';
import { addDays } from "date-fns"
import { setMetadata } from '@medusajs/medusa/dist/utils/set-metadata';
import * as fs from "fs"
import { buildQuery } from '@medusajs/medusa/dist/utils';

type InjectedDependencies = {
    manager: EntityManager
    eventBusService: EventBusService
    orderService: OrderService
    totalsService: TotalsService
    fileService: IFileService
    invoiceSettingsService: InvoiceSettingsService
    invoiceRepository_: typeof InvoiceRepository
}

class InvoiceService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly invoiceRepository_: typeof InvoiceRepository
    protected readonly eventBus_: EventBusService
    protected readonly totalsService_: TotalsService
    protected readonly orderService_: OrderService
    protected readonly file_: IFileService
    protected readonly invoiceSettings_: InvoiceSettingsService

    static readonly IndexName = `invoices`
    static readonly Events = {
        UPDATED: "invoice.updated",
        CREATED: "invoice.created",
        DELETED: "invoice.deleted",
    }

    constructor({ manager, eventBusService, orderService, totalsService, invoiceSettingsService, fileService }: InjectedDependencies) {
        super(arguments[0])

        this.manager_ = manager
        this.eventBus_ = eventBusService
        this.invoiceRepository_ = InvoiceRepository
        this.totalsService_ = totalsService
        this.orderService_ = orderService
        this.invoiceSettings_ = invoiceSettingsService
        this.file_ = fileService
    }

    async list(
        selector: Selector<Invoice>,
        config: FindConfig<Invoice> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<[Invoice[], number]> {
        const invoiceRepo = this.manager_.getCustomRepository(this.invoiceRepository_)
    
        const query = buildQuery(selector, config)
    
        return invoiceRepo.findAndCount(query)
    }

    async retrieve(invoiceId: string, config: FindConfig<Invoice>) {
        const manager = this.manager_
        const invoiceRepo = manager.getCustomRepository(this.invoiceRepository_)

        const invoice = await invoiceRepo.findOne(invoiceId, config)

        if (!invoice) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Invoice was ${invoiceId} not found`
            )
        }

        return invoice
    }

    async retrieveByOrderId(orderId: string, config: FindConfig<Invoice>): Promise<Invoice> {
        const manager = this.manager_
        const invoiceRepo = manager.getCustomRepository(this.invoiceRepository_)

        const invoice = await invoiceRepo.findOne({ order_id: orderId }, config)

        if (!invoice) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Invoice with OrderId ${orderId} was not found`
            )
        }

        return invoice
    }

    async create(invoiceObject: CreateInvoiceInput): Promise<Invoice> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceRepo = manager.getCustomRepository(this.invoiceRepository_)

            const {
                ...rest
            } = invoiceObject

            try {
                let invoice: any = invoiceRepo.create(rest)
                invoice = await invoiceRepo.save(invoice)

                const result = await this.retrieve(invoice.id, {
                    relations: ["order"],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(InvoiceService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async convertOrderIntoInvoiceDataWithReturnOrderAndCreateInvoice(orderId: string) {
        // retrive order with total
        const order = await this.orderService_.retrieveWithTotals(orderId, { 
            relations: [
              "customer",
              "billing_address",
              "shipping_address",
              "region",
              "items",
              "discounts",
              "shipping_address.country",
              "billing_address.country",
              "payments"
            ]
        })

        const invoiceSetting = await this.invoiceSettings_.all()
        const setting = []
        invoiceSetting.map((x) => {
            if (x.option == 'number_counter' || x.option == 'overdue_days') {
                setting[x.option] = parseInt(x.value) || 0
            } else {
                setting[x.option] = x.value
            }
        })
        
        const getInvoiceNumberFormat = setting['invoice_number_format']
        const getCurrentNumber = setting['number_counter']
        const getOverdueDays = setting['overdue_days']

        await this.invoiceSettings_.set('number_counter', (getCurrentNumber + 1).toString())

        // create invoice
        const invoiceCreate: CreateInvoiceInput = {
            order_id: order.id,
            file_url: "no_url",
            number: getCurrentNumber.toString(),
            status: InvoiceStatus.DRAFT,
            paid_status: InvoicePaidStatus.UNPAID,
            overdue_at: addDays(new Date(), getOverdueDays)
        }

        const invoice = await this.create(invoiceCreate)
        
        // inject order and setting data into invoice
        invoice.order = order
        // @ts-ignore
        invoice.setting = setting
        // @ts-ignore
        invoice.type = "default"

        return invoice
    }

    async update(
        invoiceId: string,
        update: UpdateInvoiceInput
    ): Promise<Invoice> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceRepo = manager.getCustomRepository(this.invoiceRepository_)
            const relations = ["order"]

            const invoice = await this.retrieve(invoiceId, {
                relations,
            })

            const {
                metadata,
                ...rest
            } = update


            if (metadata) {
                invoice.metadata = setMetadata(invoice, metadata)
            }

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    invoice[key] = value
                }
            }

            const result = await invoiceRepo.save(invoice)

            await this.eventBus_
                .withTransaction(manager)
                .emit(InvoiceService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }

    async createAndGeneratePDFInvoice(orderId: string): Promise<any> {
        const invoice = await this.convertOrderIntoInvoiceDataWithReturnOrderAndCreateInvoice(orderId)
        const generatePDF = await generateInvoicePDF(invoice)
        
        // code for upload file into cloud service
        const uploadFile = await this.file_.uploadProtected({
            path: generatePDF.path,
            originalname: generatePDF.title
        })

        // delete after finished upload
        fs.unlink(generatePDF.path, (err) => {
            if (err) throw err;
        });

        // update url
        return await this.update(invoice.id, { file_url: uploadFile.url })
    }
}

export default InvoiceService;