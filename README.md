# medusa-service-invoice

Invoice for your medusa

## medusa-config.js
```
{
    resolve: `@ai-ecom/medusa-plugin-invoice`,
    options: {
        settings: { // default settings for invoice if there no data
            invoice_number_format:  "{{}}",
            overdue_days: 7,
            number_counter: 0,
            invoice_logo_url: ""
        }
    }
}
```