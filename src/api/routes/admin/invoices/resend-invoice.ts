import InvoiceService from "../../../../services/invoice"

export default async (req, res) => {
    const { id } = req.params

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const invoiceSend = await invoiceService.sendEmailToCustomer(id)

    res.status(200).json({ invoiceSend })
}