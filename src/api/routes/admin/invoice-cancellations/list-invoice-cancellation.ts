import InvoiceCancellationService from "../../../../services/invoice-cancellation"
import { IsOptional, IsString, IsNumber } from "class-validator"
import { Transform, Type } from "class-transformer"
import { DateComparisonOperator } from "@medusajs/medusa/dist/types/common"

export default async (req, res) => {
    const { skip, take } = req.listConfig

    const invoiceCancellationService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")
    const [invoiceCancellations, count] = await invoiceCancellationService.list(req.filterableFields, req.listConfig)
    
    res.status(200).json({
        invoiceCancellations,
        count: count,
        limit: take,
        offset: skip
    })
}

export class AdminGetInvoiceCancellationsParams {
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset?: number = 0
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 50
  
    @IsString()
    @IsOptional()
    expand?: string
  
    @IsString()
    @IsOptional()
    fields?: string

    @IsString()
    @IsOptional()
    number?: string

    @IsOptional()
    @Transform(({ value }) => {
        return value === "null" ? null : value
    })
    @Type(() => DateComparisonOperator)
    created_at?: DateComparisonOperator | null
}