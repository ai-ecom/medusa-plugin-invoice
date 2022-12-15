# medusa-service-invoice

Invoice for your medusa

## medusa-config.js
```
{
    resolve: `@ai-ecom/medusa-plugin-invoice`,
    options: {
        settings: { // default settings for invoice if there no setting in the database
            invoice_number_format:  "{{}}",
            overdue_days: 7,
            number_counter: 1,
            invoice_title: "INVOICE",
            invoice_logo_url: "<LOGO_URL>",
            invoice_company_name: "Ai-Ecom",
            invoice_address_line_1: "Line 1",
            invoice_address_line_2: "Line 2",
            invoice_address_line_3: "Line 3",
            footer_html: "<FOOTER_HTML>"
        },
        create_when: "order.payment_captured",
        payments: {
            manual: "Manual Payment"
        },
        email: {
            template: {
                invoice_cancellation: "<SENDGRID_TEMPLATE_ID>",
                invoice: "<SENDGRID_TEMPLATE_ID>"
            }
        }
    }
}
```