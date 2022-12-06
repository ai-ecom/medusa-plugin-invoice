import { EventBusService } from "@medusajs/medusa";
import InvoiceService from "../services/invoice";


class InvoiceSubscriber {
    protected readonly eventBus_: EventBusService
    protected readonly invoice_: InvoiceService

    constructor({ eventBusService, invoiceService }, options) {
      this.invoice_ = invoiceService
      this.eventBus_ = eventBusService
      
      const create_when = options.create_when || "order.payment_captured"

      this.eventBus_.subscribe(create_when, async (order: any) => {
        await this.invoice_.createAndGeneratePDFInvoice(order.id)
      });
    }
}
  
export default InvoiceSubscriber;