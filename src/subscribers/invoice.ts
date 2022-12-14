import { EventBusService } from "@medusajs/medusa";
import { InvoicePaidStatus, InvoiceStatus } from "../models/invoice";
import InvoiceService from "../services/invoice";
import InvoiceCancellationService from "../services/invoice-cancellation";

class InvoiceSubscriber {
    protected readonly eventBus_: EventBusService
    protected readonly invoice_: InvoiceService
    protected readonly invoiceCancellation_: InvoiceCancellationService
    protected readonly sendgrid_: any

    constructor({ eventBusService, invoiceService, invoiceCancellationService, sendgridService }, options) {
      this.eventBus_ = eventBusService
      this.invoice_ = invoiceService
      this.invoiceCancellation_ = invoiceCancellationService
      this.sendgrid_ = sendgridService
      
      const create_when = options.create_when || "order.payment_captured"

      // Create Invoice when create_when
      this.eventBus_.subscribe(create_when, async (order: any) => {
        const invoice = await this.invoice_.createAndGeneratePDFInvoice(order.id)
        await this.invoice_.sendEmailToCustomer(invoice.id)
        if (create_when == "order.payment_captured") {
          this.invoice_.update(invoice.id, { paid_status: InvoicePaidStatus.PAID })
        }
      });

      // Todo Create Invoice Cancelation For Item Return
      this.eventBus_.subscribe("order.items_returned", async (data: any) => {
        const invoice = await this.invoiceCancellation_.createAndGeneratePDFInvoice(data)
        await this.invoiceCancellation_.sendEmailToCustomer(invoice.id)
      });

      // Todo Create Invoice Cancelation For Refund created
      // this.eventBus_.subscribe("order.refund_created", async (returnData: any) => {
      //   console.log(returnData)
      //   // await this.invoice_.createAndGeneratePDFInvoice(order.id)
      // });
    }
}
  
export default InvoiceSubscriber;


// Todo Using NotificationService instead eventBus_ part of invoice-sender.ts
// class NotificationSubscriber {
//   constructor({ notificationService }, options) {
//     const create_when = options.create_when || "order.payment_captured"

//     notificationService.subscribe(create_when, 'invoice-sender')
//     notificationService.subscribe("order.items_returned", 'invoice-sender')
//     notificationService.subscribe("order.refund_created", 'invoice-sender')
//   }
// }

// export default NotificationSubscriber;