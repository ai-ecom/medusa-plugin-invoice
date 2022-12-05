import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { InvoiceSettingsRepository } from "../repositories/invoice-settings";
import { InvoiceSettings } from '../models/invoice-settings';

type InjectedDependencies = {
    manager: EntityManager
    invoiceSettingsRepository: typeof InvoiceSettingsRepository
    eventBusService: EventBusService
}

class InvoiceSettingsService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly invoiceSettingsRepository_: typeof InvoiceSettingsRepository
    protected readonly eventBus_: EventBusService
    protected readonly options: any

    static readonly IndexName = `invoices`
    static readonly Events = {
        UPDATED: "invoice_settings.updated",
        CREATED: "invoice_settings.created",
        DELETED: "invoice_settings.deleted",
    }

    constructor({ manager, invoiceSettingsRepository, eventBusService }: InjectedDependencies, options) {
        super(arguments[0]);

        this.manager_ = manager;
        this.invoiceSettingsRepository_ = invoiceSettingsRepository;
        this.eventBus_ = eventBusService;
        this.options = options
    }

    async all(): Promise<InvoiceSettings[]> {
        const invoiceSettingsRepo = this.manager_.getCustomRepository(this.invoiceSettingsRepository_)
        return invoiceSettingsRepo.find()
    }

    async get(option: string) {
        await this.settingSync()
        const manager = this.manager_
        const invoiceSettingsRepo = manager.getCustomRepository(this.invoiceSettingsRepository_)

        const invoiceSettings = await invoiceSettingsRepo.findOne({ option: option }, {})

        if (!invoiceSettings) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `InvoiceSettings with ${option} was not found`
            )
        }

        return invoiceSettings
    }

    async create(option: string, value: string): Promise<InvoiceSettings> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceSettingsRepo = manager.getCustomRepository(this.invoiceSettingsRepository_)

            try {
                let invoiceSettings: any = invoiceSettingsRepo.create({ option: option, value: value })
                invoiceSettings = await invoiceSettingsRepo.save(invoiceSettings)
                const result = await this.get(option)

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(InvoiceSettingsService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(option: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceSettingsRepo = manager.getCustomRepository(this.invoiceSettingsRepository_)

            const invoiceSettings = await invoiceSettingsRepo.findOne( { option: option }, {} )

            if (!invoiceSettings) {
                return
            }

            await invoiceSettingsRepo.softRemove(invoiceSettings)

            await this.eventBus_
                .withTransaction(manager)
                .emit(InvoiceSettingsService.Events.DELETED, {
                    option: option,
                })

            return Promise.resolve()
        })
    }

    async set(option: string, value: string): Promise<InvoiceSettings> {
        return await this.atomicPhase_(async (manager) => {
            const invoiceSettingsRepo = manager.getCustomRepository(this.invoiceSettingsRepository_)

            let invoiceSettings = await invoiceSettingsRepo.findOne({ where: { option: option } })
            let result

            // if option is not found, then we create new one
            if (!invoiceSettings) {
                invoiceSettings = await this.create(option, value)
                result = await invoiceSettingsRepo.findOne({ where: { option: option } })
            } else {
                invoiceSettings["value"] = value
                result = await invoiceSettingsRepo.save(invoiceSettings)
            }

            await this.eventBus_
                .withTransaction(manager)
                .emit(InvoiceSettingsService.Events.UPDATED, {
                    option: result.option,
                    value: result.value,
            })
            return result
        })
    }

    // To do sync default setting from plugin options, if there not created one
    async settingSync() {
        const settingList = this.options.settings
        const allSetting = await this.all()

        for (const x in settingList) {
            if (!allSetting.find((d) => d.option == x)) {
                await this.set(x, settingList[x])
            }
        }
    }
}

export default InvoiceSettingsService;