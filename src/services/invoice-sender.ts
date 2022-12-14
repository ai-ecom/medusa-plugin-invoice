// NOT USED, but this will be good idea for sending email via notification service

import { AbstractNotificationService, OrderService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { InvoicePaidStatus, InvoiceStatus } from "../models/invoice";
import InvoiceService from "./invoice";
import InvoiceCancellationService from "./invoice-cancellation";

class InvoiceSenderService extends AbstractNotificationService {
  static identifier = "invoice-sender";

  protected manager_: EntityManager;
  protected transactionManager_: EntityManager;
  protected orderService: OrderService;
  protected readonly invoice_: InvoiceService
  protected readonly invoiceCancellation_: InvoiceCancellationService
  protected readonly sendgrid_: any
  protected options_: any;

  constructor(container, options) {
    super(container);
    this.options_ = options
    this.orderService = container.orderService
    this.invoice_ = container.invoiceService
    this.invoiceCancellation_ = container.invoiceCancellationService
    this.sendgrid_ = container.sendgridService
  }

  async fetchAttachments(event, data, attachmentGenerator) {
    switch (event) {
      case "order.items_returned": {
        let attachments = []
        const pdfFile = await this.invoiceCancellation_.viewPDF(data.id)
    
        var chunks = [];
        pdfFile.on('data', function(chunk) { chunks.push(chunk); });
        let base64PDF = ""
      
        await pdfFile.on('end', () => {
          base64PDF = Buffer.concat(chunks).toString('base64')
        });

        attachments.push({
          name: 'invoice-cancellation',
          base64: base64PDF,
          type: "application/pdf",
        })

        return attachments
      }
      case this.options_.create_when:
      case "order.payment_captured": {
        let attachments = []
        
        const pdfFile = await this.invoice_.viewPDF(data.id)
    
        var chunks = [];
        pdfFile.on('data', function(chunk) { chunks.push(chunk); });
        let base64PDF = ""
      
        await pdfFile.on('end', () => {
          base64PDF = Buffer.concat(chunks).toString('base64')
        });

        attachments.push({
          name: 'invoice',
          base64: base64PDF,
          type: "application/pdf",
        })

        return attachments
      }
      default:
        return []
    }
  }

  async sendNotification(event: string, data: unknown, attachmentGenerator: unknown): Promise<{ to: string; status: string; data: Record<string, unknown>; }> {
    const create_when = this.options_.create_when || "order.payment_captured"
    let sendOptions;

    if (event === 'order.items_returned') {
      const invoice = await this.invoiceCancellation_.createAndGeneratePDFInvoice(data)
      const pdfFile = await this.invoiceCancellation_.viewPDF(invoice.id)
  
      var chunks = [];
      pdfFile.on('data', function(chunk) { chunks.push(chunk); });
      let base64PDF = ""
      
      await pdfFile.on('end', () => {
        base64PDF = Buffer.concat(chunks).toString('base64')
      });
      sendOptions = {
        to: invoice.order.email,
        from: process.env.EMAIL_DEFAULT_FROM,
        dynamic_template_data: invoice,
        template_id: this.options_.email.template.order_items_returned,
        attachments: [
          {
              content: base64PDF,
              filename: 'invoice-cancellation.pdf',
              type: 'application/pdf',
              disposition: 'attachment',
              content_id: 'mytext',
          },
        ],
      }
    } else if (event === 'order.refund_created') {
      // Todo create invoice cancellation when refund money created
    } else if (event == create_when) {
      const invoice = await this.invoice_.createAndGeneratePDFInvoice(data.id)
      const pdfFile = await this.invoice_.viewPDF(invoice.id)
  
      var chunks = [];
      pdfFile.on('data', function(chunk) { chunks.push(chunk); });
      
      let base64PDF = ""
      
      await pdfFile.on('end', () => {
        base64PDF = Buffer.concat(chunks).toString('base64')
      });

      sendOptions = {
          to: invoice.order.email,
          from: process.env.EMAIL_DEFAULT_FROM,
          dynamic_template_data: invoice,
          template_id: this.options_.email.template.order_completed,
          attachments: [
            {
                content: base64PDF,
                filename: 'invoice.pdf',
                type: 'application/pdf',
                disposition: 'attachment',
                content_id: 'mytext',
            },
          ],
      };

      this.invoice_.update(invoice.id, { status: InvoiceStatus.SENT, notified_via_email_at: invoice.create_at })
      
      if (event == "order.payment_captured") {
        this.invoice_.update(invoice.id, { paid_status: InvoicePaidStatus.PAID })
      }
    }

    const status = await this.sendgrid_.sendEmail(sendOptions).then(() => "sent").catch(() => "failed")

    // don't store attachments into db since we already have file_url
    delete sendOptions.attachments;
    
    return { to: sendOptions.to, status, data: sendOptions }
  }

  async resendNotification(notification: unknown, config: unknown, attachmentGenerator: unknown): Promise<{ to: string; status: string; data: Record<string, unknown>; }> {
    const sendOptions = {
      ...notification.data,
      to: config.to || notification.to,
    }

    if (notification.event_name == this.options_.create_when || "order.payment_captured") {
      const pdfFile = await this.invoice_.viewPDF(notification.data.dynamic_template_data.id)
  
      var chunks = [];
      pdfFile.on('data', function(chunk) { chunks.push(chunk); });
      
      await pdfFile.on('end', async () => {
        const base64PDF = Buffer.concat(chunks).toString('base64')

        sendOptions.attachments = [
            {
            content: base64PDF,
            filename: 'invoice',
            type: 'application/pdf',
            disposition: "attachment",
            contentId: 'invoice'
          }
        ]

        const status = await this.sendgrid_.sendEmail(sendOptions).then(() => "sent").catch((err) => {
          console.log(err.message)
          return "failed"
        })
        
        // don't store attachments into db since we already have file_url
        //delete sendOptions.attachments;

        //return { to: sendOptions.to, status, data: sendOptions }
      });
      console.log(sendOptions)
    }
  }
}

export default InvoiceSenderService;