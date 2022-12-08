import { validator } from "../../../../utils/validator"
import { IsObject, IsOptional, IsEnum, NotEquals, ValidateIf } from "class-validator"
import InvoiceService from "../../../../services/invoice"
import { EntityManager } from "typeorm"
import { defaultAdminInvoiceFields, defaultAdminInvoiceRelations } from "."
import { InvoiceStatus, InvoicePaidStatus } from "../../../../models/invoice"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostInvoicesInvoiceReq, req.body)

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await invoiceService
        .withTransaction(transactionManager)
        .update(id, validated)
    })

    const invoice = await invoiceService.retrieve(id, {
        select: defaultAdminInvoiceFields,
        relations: defaultAdminInvoiceRelations,
    })

    res.json({ invoice })
}

export class AdminPostInvoicesInvoiceReq {
    @IsOptional()
    @IsEnum(InvoiceStatus)
    @NotEquals(null)
    @ValidateIf((object, value) => value !== undefined)
    status?: InvoiceStatus

    @IsOptional()
    @IsEnum(InvoicePaidStatus)
    @NotEquals(null)
    @ValidateIf((object, value) => value !== undefined)
    paid_status?: InvoicePaidStatus

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}

