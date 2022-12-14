import { InvoiceStatus } from "../../../../models/invoice"
import InvoiceService from "../../../../services/invoice"

export default async (req, res) => {
    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    
    const dataEvent = req.body || []

    for (const x of dataEvent) {
        if (x.event == "open") {
            if (x.medusa && x.medusa.type == "invoice") {
                invoiceService.update(x.medusa.invoice_id, { status: InvoiceStatus.VIEWED })
            }
        }
    }

    res.status(200).json({ status: 'ok' })
}