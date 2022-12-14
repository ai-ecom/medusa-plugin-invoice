import InvoiceCancellationService from "../../../../services/invoice-cancellation"

export default async (req, res) => {
    const { id } = req.params

    const invoiceCancellationService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")
    const invoiceSend = await invoiceCancellationService.sendEmailToCustomer(id)

    res.status(200).json({ invoiceSend })
}