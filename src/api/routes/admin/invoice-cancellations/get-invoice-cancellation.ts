import InvoiceCancellationService from "../../../../services/invoice-cancellation"

export default async (req, res) => {
    const { id } = req.params

    const invoiceCancellationService: InvoiceCancellationService = req.scope.resolve("invoiceCancellationService")
    const invoiceCancellation = await invoiceCancellationService.retrieve(id, { relations: ["refund", "refund.order"] })

    res.status(200).json({ invoiceCancellation })
}