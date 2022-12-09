import InvoiceCancellationService from "../../../../services/invoice-cancellation"

export default async (req, res) => {
    const { id } = req.params

    const invoiceCancellationService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")
    const invoiceCancellation = await invoiceCancellationService.viewPDF(id)

    res.contentType("application/pdf");
    invoiceCancellation.pipe(res)
}