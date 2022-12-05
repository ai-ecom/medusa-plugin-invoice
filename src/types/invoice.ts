import { InvoiceStatus, InvoicePaidStatus } from "../models/invoice"

export type CreateInvoiceInput = {
    order_id: string
    number: string
    status: InvoiceStatus
    paid_status: InvoicePaidStatus
    file_url: string
    notified_via_email_at?: Date | null
    overdue_notified_at?: Date | null
    overdue_at?: Date | null
    is_reverse_charge?: boolean
    is_intra_community?: boolean
    metadata?: Record<string, unknown>
}

export type UpdateInvoiceInput = {
    order_id?: string
    number?: string
    status?: InvoiceStatus
    paid_status?: InvoicePaidStatus
    file_url?: string
    notified_via_email_at?: Date | null
    overdue_notified_at?: Date | null
    overdue_at?: Date | null
    is_reverse_charge?: boolean
    is_intra_community?: boolean
    metadata?: Record<string, unknown>
};

export type selector = {
    number?: string
}