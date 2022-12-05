import { EventBusService } from "@medusajs/medusa";
import InvoiceService from "../services/invoice";


class InvoiceNinjaSubscriber {
    protected readonly eventBus_: EventBusService
    protected readonly invoice_: InvoiceService

    constructor({ eventBusService, invoiceService }) {
      this.invoice_ = invoiceService
      this.eventBus_ = eventBusService

      this.eventBus_.subscribe("order.placed", async (order: any) => {
        await this.invoice_.createAndGeneratePDFInvoice(order.id)
      });
    }
}
  
export default InvoiceNinjaSubscriber;