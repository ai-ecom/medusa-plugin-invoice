import { validator } from "../../../../utils/validator"
import InvoiceService from "../../../../services/invoice"
import { selector } from "../../../../types/invoice"
import { IsOptional, IsString } from "class-validator"

export default async (req, res) => {
    const validated = await validator(AdminGetCalendarsParams, req.query)

    const selector: selector = {}

    if (validated.number) {
        selector.number = validated.number
    }

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const [invoices, count] = await invoiceService.list(selector, {
        relations: ["order"],
    })

    res.status(200).json({
        invoices,
        count: count,
    })
}

export class AdminGetCalendarsParams {
    @IsString()
    @IsOptional()
    number?: string
}