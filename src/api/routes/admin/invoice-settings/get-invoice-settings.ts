import InvoiceSettingsService from "../../../../services/invoice-settings"

export default async (req, res) => {
    const { option } = req.params

    const invoiceSettingsService: InvoiceSettingsService = req.scope.resolve("invoiceSettingsService")
    const invoiceSettings = await invoiceSettingsService.get(option)

    res.status(200).json({ invoiceSettings })
}
