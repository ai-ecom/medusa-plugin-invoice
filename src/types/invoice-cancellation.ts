import { InvoiceStatus, InvoicePaidStatus } from "../models/invoice"

export type CreateInvoiceCancellationInput = {
    refund_id: string
    number: string
    file_url: string
    notified_via_email_at?: Date | null
    metadata?: Record<string, unknown>
}

export type UpdateInvoiceCancellationInput = {
    refund_id?: string
    number?: string
    file_url?: string
    notified_via_email_at?: Date | null
    metadata?: Record<string, unknown>
};

export type selector = {
    number?: string
}