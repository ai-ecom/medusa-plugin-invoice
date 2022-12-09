import InvoiceService from "../../../../services/invoice"

export default async (req, res) => {
    const { id } = req.params

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const invoice = await invoiceService.viewPDF(id)

    res.contentType("application/pdf");
    invoice.pipe(res)
}