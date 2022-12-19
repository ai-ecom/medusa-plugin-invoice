import { IsEmail, IsOptional } from "class-validator"
import InvoiceCancellationService from "../../../../services/invoice-cancellation"
import { validator } from "@medusajs/medusa/dist/utils/validator"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostInvoiceResendReq, req.body)

    const invoiceCancellationService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")
    const invoiceSend = await invoiceCancellationService.sendEmailToCustomer(id, validated.to)

    res.status(200).json({ invoiceSend })
}

export class AdminPostInvoiceResendReq {
    @IsEmail()
    @IsOptional()
    to?: string
}