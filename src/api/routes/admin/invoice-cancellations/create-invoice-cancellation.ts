import { IsString, IsObject, IsOptional } from "class-validator"
import InvoiceCancellationService from "../../../../services/invoice-cancellation";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const validated = await validator(AdminPostInvoiceCancellationsReq, req.body)

    const invoiceService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await invoiceService.withTransaction(transactionManager).createAndGeneratePDFInvoice({ id: validated.order_id, return_id: validated.refund_id });
    })

    res.status(200).json({ invoice: result })
}

export class AdminPostInvoiceCancellationsReq {
    @IsString()
    order_id: string
    
    @IsString()
    refund_id: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}
