import { validator } from "../../../../utils/validator"
import { IsString, IsOptional } from "class-validator"
import InvoiceSettingsService from "../../../../services/invoice-settings"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const { option } = req.params

    const invoiceSettingsService: InvoiceSettingsService = req.scope.resolve("invoiceSettingsService")
    const validated = await validator(AdminPostInvoiceSettingsReq, req.body)

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await invoiceSettingsService
        .withTransaction(transactionManager)
        .set(option, validated.value)
    })

    const invoiceSettings = await invoiceSettingsService.get(option)

    res.json({ invoiceSettings })
}

export class AdminPostInvoiceSettingsReq {
    @IsString()
    @IsOptional()
    value: string
}