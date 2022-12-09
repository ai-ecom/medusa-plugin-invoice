import { EventBusService } from "@medusajs/medusa";
import { InvoicePaidStatus } from "../models/invoice";
import InvoiceService from "../services/invoice";
import InvoiceCancellationService from "../services/invoice-cancellation";

class InvoiceSubscriber {
    protected readonly eventBus_: EventBusService
    protected readonly invoice_: InvoiceService
    protected readonly invoiceCancellation_: InvoiceCancellationService

    constructor({ eventBusService, invoiceService, invoiceCancellationService }, options) {
      this.eventBus_ = eventBusService
      this.invoice_ = invoiceService
      this.invoiceCancellation_ = invoiceCancellationService
      
      const create_when = options.create_when || "order.payment_captured"

      // Create Invoice when create_when
      this.eventBus_.subscribe(create_when, async (order: any) => {
        const invoice = await this.invoice_.createAndGeneratePDFInvoice(order.id)
        
        if (create_when == "order.payment_captured") {
          this.invoice_.update(invoice.id, { paid_status: InvoicePaidStatus.PAID })
        }
      });

      // Todo Create Invoice Cancelation For Item Return
      this.eventBus_.subscribe("order.items_returned", async (data: any) => {
        await this.invoiceCancellation_.createAndGeneratePDFInvoice(data)
      });

      // Todo Create Invoice Cancelation For Refund created
      // this.eventBus_.subscribe("order.refund_created", async (returnData: any) => {
      //   console.log(returnData)
      //   // await this.invoice_.createAndGeneratePDFInvoice(order.id)
      // });
    }
}
  
export default InvoiceSubscriber;