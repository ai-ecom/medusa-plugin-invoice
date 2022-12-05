import { IsString, IsObject, IsHexColor, IsOptional } from "class-validator"
import InvoiceService from "../../../../services/invoice";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const validated = await validator(AdminPostCalendarsReq, req.body)

    const invoiceService: InvoiceService = req.scope.resolve("calendarService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await invoiceService.withTransaction(transactionManager).createAndGeneratePDFInvoice(validated.order_id);
    })

    res.status(200).json({ invoice: result })
}

export class AdminPostCalendarsReq {
    @IsString()
    order_id: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}
