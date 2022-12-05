import InvoiceSettingsService from "../../../../services/invoice-settings"

export default async (req, res) => {
    const invoiceSettingsService: InvoiceSettingsService = req.scope.resolve("invoiceSettingsService")
    const invoiceSettings = await invoiceSettingsService.all()

    res.status(200).json({ invoiceSettings })
}