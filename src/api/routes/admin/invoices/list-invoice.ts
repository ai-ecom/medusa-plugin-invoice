import { validator } from "../../../../utils/validator"
import InvoiceService from "../../../../services/invoice"
import { selector } from "../../../../types/invoice"
import { IsDate, IsOptional, IsString, IsNumber } from "class-validator"
import { Type } from "class-transformer"

export default async (req, res) => {
    const validated = await validator(AdminGetInvoicesParams, req.query)

    const selector: selector = {}

    if (validated.number) {
        selector.number = validated.number
    }

    // add "from" and "to" selector

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const [invoices, count] = await invoiceService.list(selector, {
        relations: ["order"],
        skip: validated.offset,
        take: validated.limit
    })

    res.status(200).json({
        invoices,
        count: count,
        limit: validated.limit,
        offset: validated.offset
    })
}

export class AdminGetInvoicesParams {
    @IsString()
    @IsOptional()
    number?: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from: Date
  
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to: Date

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit = 50
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset = 0
}