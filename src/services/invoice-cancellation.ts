import { EventBusService, TransactionBaseService, OrderService, TotalsService, IFileService, LineItemService, LineItem, NoteService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';
import { generateInvoicePDF } from "../utils/invoice-pdf"
import { CreateInvoiceCancellationInput, UpdateInvoiceCancellationInput } from '../types/invoice-cancellation';
import { InvoiceCancellationRepository } from "../repositories/invoice-cancellation"
import InvoiceSettingsService from './invoice-settings';
import { addDays } from "date-fns"
import { setMetadata } from '@medusajs/medusa/dist/utils/set-metadata';
import * as fs from "fs"
import { buildQuery } from '@medusajs/medusa/dist/utils';
import { InvoiceCancellation } from '../models/invoice-cancellation';
import { Invoice } from '../models/invoice';
import InvoiceService from './invoice';

type InjectedDependencies = {
    manager: EntityManager
    eventBusService: EventBusService
    orderService: OrderService
    totalsService: TotalsService
    fileService: IFileService
    lineItemService: LineItemService
    invoiceSettingsService: InvoiceSettingsService
    invoiceService: InvoiceService
    invoiceRepository_: typeof InvoiceCancellationRepository
    noteService: NoteService
    sendgridService: any
}

class InvoiceCancellationService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly invoiceCancellationRepository_: typeof InvoiceCancellationRepository
    protected readonly eventBus_: EventBusService
    protected readonly totalsService_: TotalsService
    protected readonly orderService_: OrderService
    protected readonly file_: IFileService
    protected readonly invoiceSettings_: InvoiceSettingsService
    protected readonly lineItem_: LineItemService
    protected readonly invoice_: InvoiceService
    protected readonly options_: any
    protected readonly note_: NoteService
    protected readonly sendgrid_: any

    static readonly IndexName = `invoice-cancellations`
    static readonly Events = {
        UPDATED: "invoice_cancellation.updated",
        CREATED: "invoice_cancellation.created",
        DELETED: "invoice_cancellation.deleted",
        PDF_CREATED: "invoice.pdf_created"
    }

    constructor({ manager, eventBusService, orderService, totalsService, invoiceSettingsService, fileService, lineItemService, invoiceService, noteService, sendgridService }: InjectedDependencies, options) {
        super(arguments[0])

        this.options_ = options
        this.manager_ = manager
        this.eventBus_ = eventBusService
        this.invoiceCancellationRepository_ = InvoiceCancellationRepository
        this.totalsService_ = totalsService
        this.orderService_ = orderService
        this.invoiceSettings_ = invoiceSettingsService
        this.file_ = fileService
        this.lineItem_ = lineItemService
        this.invoice_ = invoiceService
        this.note_ = noteService
        this.sendgrid_ = sendgridService
    }

    async list(
        selector: Selector<InvoiceCancellation>,
        config: FindConfig<InvoiceCancellation> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<[InvoiceCancellation[], number]> {
        const invoiceCancellationRepo = this.manager_.getCustomRepository(this.invoiceCancellationRepository_)
    
        const query = buildQuery(selector, config)
    
        return invoiceCancellationRepo.findAndCount(query)
    }

    async retrieve(invoiceId: string, config: FindConfig<InvoiceCancellation>) {
        const manager = this.manager_
        const invoiceCancellationRepo = manager.getCustomRepository(this.invoiceCancellationRepository_)

        const invoice = await invoiceCancellationRepo.findOne(invoiceId, config)

        if (!invoice) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Invoice Cancellation was ${invoiceId} not found`
            )
        }

        return invoice
    }

    async create(invoiceObject: CreateInvoiceCancellationInput): Promise<InvoiceCancellation> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceRepo = manager.getCustomRepository(this.invoiceCancellationRepository_)

            const {
                ...rest
            } = invoiceObject

            try {
                let invoice: any = invoiceRepo.create(rest)
                invoice = await invoiceRepo.save(invoice)

                const result = await this.retrieve(invoice.id, {
                    relations: ["refund"],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(InvoiceCancellationService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async convertOrderIntoInvoiceDataWithReturnOrderAndCreateInvoice(data: any) {
        const { id: orderId, return_id: returnId } = data

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
              "payments",
              "refunds",
              "returns",
              "returns.items"
            ]
        })

        const refund: any = order.refunds[order.refunds.length-1] || [] // getting refund data by last added data
        const allReturns = order.returns
        const returnData: any = allReturns.filter((x) => x.id == returnId)[0]
        const invoiceData: Invoice = await this.invoice_.retrieveByOrderId(orderId, {})
        
        // getting list item with LineItem/more detail
        const listItemReturned = []
        for (const x of returnData.items) {
          const getLineItem = await this.lineItem_.retrieve(x.item_id)
          listItemReturned.push(getLineItem)
        }

        const invoiceSetting = await this.invoiceSettings_.all()
        const setting = []
        invoiceSetting.map((x) => {
            if (x.option == 'number_counter' || x.option == 'overdue_days') {
                setting[x.option] = parseInt(x.value) || 0
            } else {
                setting[x.option] = x.value
            }
        })
        
        const getCurrentNumber = setting['number_counter']

        await this.invoiceSettings_.set('number_counter', (getCurrentNumber + 1).toString())

        // create invoice
        const invoiceCancellationCreate: CreateInvoiceCancellationInput = {
            refund_id: refund.id,
            file_url: "no_url",
            number: getCurrentNumber
        }

        const invoiceCancellation = await this.create(invoiceCancellationCreate)
        
        await this.note_.create({
            resource_type: "order",
            resource_id: order.id,
            value: "invoice_cancellation.pdf_created"
        },
        {
            metadata: {
                invoice_id: invoiceCancellation.id,
                type: "invoice-cancellation"
            }
        })

        // inject order and setting data into invoice
        // @ts-ignore
        invoiceCancellation.invoice = invoiceData

        // @ts-ignore
        invoiceCancellation.order = order
        
        // @ts-ignore
        invoiceCancellation.returnedItems = listItemReturned

        // @ts-ignore
        invoiceCancellation.setting = setting

        // @ts-ignore
        invoiceCancellation.payment_display = this.options_.payments[order.payments[0].provider_id]

        // @ts-ignore
        invoiceCancellation.type = "cancellation"

        return invoiceCancellation
    }

    async update(
        invoiceId: string,
        update: UpdateInvoiceCancellationInput
    ): Promise<InvoiceCancellation> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceCancellationRepo = manager.getCustomRepository(this.invoiceCancellationRepository_)
            const relations = []

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

            const result = await invoiceCancellationRepo.save(invoice)

            await this.eventBus_
                .withTransaction(manager)
                .emit(InvoiceCancellationService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }

    async viewPDF(invoiceId: string): Promise<any> {
        const invoice = await this.retrieve(invoiceId, {})
        const regex = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.\/]{2,6})([\/\w \.-]*)/gm; // split all file_url

        if (!invoice.file_url || invoice.file_url == "no_url") {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Invoice with Id ${invoiceId} was not found, Pls regenerate invoice!`
            )
        }

        const getKey = regex.exec(invoice.file_url) // remove url and get the key!
        return await this.file_.getDownloadStream({
            fileKey: getKey[4]
        })
    }

    async createAndGeneratePDFInvoice(data): Promise<any> {
        const invoiceCancellation = await this.convertOrderIntoInvoiceDataWithReturnOrderAndCreateInvoice(data)
        const generatePDF = await generateInvoicePDF(invoiceCancellation)
        
        // code for upload file into cloud service
        const uploadFile = await this.file_.uploadProtected({
            path: generatePDF.path,
            originalname: `${generatePDF.title}.pdf`
        })

        // delete after finished upload
        fs.unlink(generatePDF.path, (err) => {
            if (err) throw err;
        });

        // update url
        return this.update(invoiceCancellation.id, { file_url: uploadFile.url })
    }

    async sendEmailToCustomer(invoiceId: string, to: string = null) {
        const invoice = await this.retrieve(invoiceId, { relations: ["refund", "refund.order", "refund.order.items"] })
        const pdfFile = await this.viewPDF(invoiceId)
    
        var chunks = [];

        pdfFile.on('data', function(chunk) {
            chunks.push(chunk);
        });

        pdfFile.on('end', () => {
            const base64PDF = Buffer.concat(chunks).toString('base64')
            
            const sendOptions = {
                to: to || invoice.refund.order.email,
                from: process.env.EMAIL_DEFAULT_FROM,
                dynamic_template_data: invoice,
                custom_args: {
                    medusa: {
                        type: "invoice_cancellation",
                        invoice_id: invoice.id
                    }
                },
                template_id: this.options_.email.template.invoice_cancellation,
                attachments: [
                    {
                        content: base64PDF,
                        filename: 'invoice-cancellation.pdf',
                        type: 'application/pdf',
                        disposition: 'attachment',
                        content_id: 'invoice-cancellation',
                    },
                ],
            }

            this.sendgrid_.sendEmail(sendOptions)
            const dateNow = new Date()
            this.update(invoice.id, { notified_via_email_at: dateNow })
        });

        return invoice
    }
}

export default InvoiceCancellationService;