import InvoiceService from "../../../../services/invoice"
import { IsOptional, IsString, IsNumber } from "class-validator"
import { Transform, Type } from "class-transformer"
import { DateComparisonOperator } from "@medusajs/medusa/dist/types/common"

export default async (req, res) => {
    const { skip, take } = req.listConfig

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const [invoices, count] = await invoiceService.list(req.filterableFields, req.listConfig)
    
    res.status(200).json({
        invoices,
        count,
        limit: take,
        offset: skip
    })
}

export class AdminGetInvoicesParams {
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