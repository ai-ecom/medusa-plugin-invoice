import { validator } from "../../../../utils/validator"
import InvoiceCancellationService from "../../../../services/invoice-cancellation"
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

    const invoiceCancellationService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")
    const [invoiceCancellations, count] = await invoiceCancellationService.list(selector, {
        relations: ["refund"],
        skip: validated.offset,
        take: validated.limit
    })

    res.status(200).json({
        invoiceCancellations,
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