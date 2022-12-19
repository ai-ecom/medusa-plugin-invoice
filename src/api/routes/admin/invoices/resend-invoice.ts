import { IsEmail, IsOptional } from "class-validator"
import InvoiceService from "../../../../services/invoice"
import { validator } from "@medusajs/medusa/dist/utils/validator"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostInvoiceResendReq, req.body)

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const invoiceSend = await invoiceService.sendEmailToCustomer(id, validated.to)

    res.status(200).json({ invoiceSend })
}

export class AdminPostInvoiceResendReq {
    @IsEmail()
    @IsOptional()
    to?: string
}