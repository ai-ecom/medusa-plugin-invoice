import InvoiceService from "../../../../services/invoice"

export default async (req, res) => {
    const { id } = req.params

    const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
    const invoice = await invoiceService.retrieve(id, { relations: ["order"] })

    res.status(200).json({ invoice })
}