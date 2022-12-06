import puppeteer from "puppeteer";
import * as fs from 'fs';
import * as path from 'path';

const _generateHtmlLineItemRow = (c1, c2, c3, c4, c5) => {

  return `<tr>
    <td>${c1}</td>
    <td>${c2}</td>
    <td>${c3}</td>
    <td>${c4}</td>
    <td>${c5}</td>
  </tr>`

}

const _generateHtmlFooterBlock = (content) => {
  return `<div class="col">
         <p class="mb-0">${content}</p>
       </div>`
}

const _generateLineItems = async (lineItems, type = 'invoice', orderTax, moneyFormatOptions) => {

  let htmlLineItems = ``;

  for (let lineItemIndex = 0; lineItemIndex < lineItems.length; lineItemIndex++) {

    const lineItem = lineItems[lineItemIndex];
    const {title, unit_price, quantity, description } = lineItem;

    const propertyList = [];

    let netPrice = unit_price
    let lineTotal = quantity * unit_price;

    let _title = `<span>${title}</span>`
    for (const {text} of propertyList) {
      _title += `<p style="font-size: 9px; font-weight: bold"> ${text} </p>`
    }

    const htmlRow = _generateHtmlLineItemRow(
      _title,
      quantity,
      `${orderTax} %`,
      `${_moneyFormat(netPrice, moneyFormatOptions)}`,
      `${_moneyFormat(lineTotal, moneyFormatOptions)}`
    );
    htmlLineItems += htmlRow;

  }

  return htmlLineItems;
}

const _generateFooter = async (invoice) => {
  const { order } = invoice;
  const {
    orderNotes,
  } = order;

  let htmlFooter = `<div class="tw-grid tw-grid-cols-2 tw-gap-2" style="width: 100%">`;

  if (!!orderNotes) {

    const noteBlock = `<p>
      <b>Order Notes</b>
      </p>
      Order Notes Here.....
    `

    htmlFooter += _generateHtmlFooterBlock(noteBlock)
  }

  // if (paymentKey === 'transfer') {
  //   const paymentText = _generateHtmlFooterBlock(`
  //   <ul style="list-style-type: none;">
  //   <li><b>Payment Target </b>: Manual</li>
  //   <br/>
  //   <li><b>Bank Details</b></li>
  //   <li><b>Bank</b>: Manual</li>
  //   <li><b>Account Number</b>: 0</li>
  //   <li><b>IBAN</b>: 0</li>
  //   <li><b>BIC</b>: 0</li>
  //   <li><b>Purpose</b>: ${invoiceNumber}</li>
  //   </ul>
  //   `)
  //   htmlFooter += paymentText;
  // }

  htmlFooter += `</div>`

  return htmlFooter;

}

const _moneyFormat = (num, options) => {
  return new Intl.NumberFormat(options.country_code, {
      currency: options.currency_code,
      style: 'currency',
  }).format(num/100);
}

export async function generateInvoicePDF(invoice) {
    try {
      const { order, number: invNumber, setting } = invoice
      const { discount_total, shipping_total, subtotal, tax_total, total, billing_address, region, shipping_address } = order
      const pathFile = path.resolve(__dirname, "../invoices")

      const {
        first_name: invoiceFirstName,
        last_name: invoiceLastName,
        address_1: invoiceStreet,
        address_2: invoiceAddress2,
        city: invoiceCity,
        company: invoiceCompanyName,
        country: invoiceCountry,
        province: invoiceProvince,
        postal_code: invoicePostalCode,
        phone: invoicePhone
      } = billing_address
      
      const {
        first_name: shippingFirstName,
        last_name: shippingLastName,
        address_1: shippingStreet,
        address_2: shippingAddress2,
        city: shippingCity,
        company: shippingCompanyName,
        country: shippingCountry,
        province: shippingProvince,
        postal_code: shippingPostalCode,
        phone: shippingPhone
      } = shipping_address

      const moneyFormatOptions = {
        country_code: invoiceCountry ? invoiceCountry.iso_2 : shippingCountry.iso_2,
        currency_code: region.currency_code
      }

      const invoiceDate = new Date(order.created_at)
      const invoiceName = `${!!invoiceFirstName ? invoiceFirstName : ''} ${!!invoiceLastName ? invoiceLastName : ''}`
      const shippingName = `${!!shippingFirstName ? shippingFirstName : ''} ${!!shippingLastName ? shippingLastName : ''}`

      const nameOnFile = invoiceLastName || invoiceFirstName
      const targetDir = `${pathFile}/temp`;
      const pdfTitle = `INV-${invoiceDate.getFullYear()}-${invoiceDate.getMonth()}-${invoiceDate.getDate()}-${invNumber}-${nameOnFile}`;
      const targetPath = `${targetDir}/${pdfTitle}.pdf`;

      // Puppeteer
      const browser = await puppeteer.launch({
        args: ["--no-sandbox"], headless: true,
      });
      const page = await browser.newPage();
      console.log(pathFile)
      let html = fs.readFileSync(`${pathFile}/templates/index.html`, 'utf-8');

      // Show discount row only if the value exists and > 0
      let discountReplaceValue = '';
      if (discount_total > 0) {
        discountReplaceValue = `<tr id="discount-row" class="">
            <td colspan="3" class="invoice-right"><b>{{discount_title}}:</b></td>
            <td colspan="2">{{discount}}</td>
          </tr>`;
      }
      html = html.replace('{{discount_html}}', discountReplaceValue)


      const replaceVariablesList = [
        {key: '{{document_logo}}', value: setting.invoice_logo_url},
        {key: '{{document_title}}', value: setting.invoice_title || "INVOICE"},
        {key: '{{date_title}}', value: "Order Date"},
        {key: '{{date}}', value: invoiceDate.toLocaleDateString('de-DE')},

        {key: '{{invoice_title}}', value: "Invoice Number"},
        {key: '{{invoice_number}}', value: pdfTitle},
        {key: '{{order_title}}', value: "Order Number"},
        {key: '{{order_number}}', value: `${order.display_id}`},
        
        {key: '{{payment_title}}', value: "Payment Method"},
        {key: '{{payment_method}}', value: "Cash On Delivery"},

        {key: '{{company_name}}', value: setting.invoice_company_name},
        {key: '{{address_line_1}}', value: setting.invoice_address_line_1},
        {key: '{{address_line_2}}', value: setting.invoice_address_line_2},
        {key: '{{address_line_3}}', value: setting.invoice_address_line_3},

        {key: '{{invoice_address_title}}', value: "Address"},
        {key: '{{invoice_name}}', value: invoiceName},
        {key: '{{invoice_company}}', value: invoiceCompanyName},
        {key: '{{invoice_address_line_1}}', value: invoiceStreet},
        {key: '{{invoice_address_line_2}}', value: `${invoicePostalCode}, ${invoiceCity}`},
        {key: '{{invoice_address_line_3}}', value: `${invoiceCountry.display_name}`},

        {key: '{{shipping_address_title}}', value: "Shipping Address"},
        {key: '{{shipping_name}}', value: shippingName},
        {key: '{{shipping_company}}', value: shippingCompanyName},
        {key: '{{shipping_address_line_1}}', value: shippingStreet},
        {key: '{{shipping_address_line_2}}', value: `${shippingPostalCode}, ${shippingCity}`},
        {key: '{{shipping_address_line_3}}', value: `${shippingCountry.display_name}`},

        {key: '{{description_h}}', value: "Description"},
        {key: '{{amount_h}}', value: "Amount"},
        {key: '{{tax_h}}', value: "Tax"},
        {key: '{{price_h}}', value: "Price"},
        {key: '{{sum_price_h}}', value: "Total"},

        {key: '{{subtotal_title}}', value: "Subtotal"},
        {key: '{{sub_total}}', value: `${_moneyFormat(subtotal, moneyFormatOptions)}`},

        {key: '{{discount_title}}', value: "Discount"},
        {key: '{{discount}}', value: `- ${_moneyFormat(discount_total, moneyFormatOptions)}`},

        {key: '{{shipping_title}}', value: "Shipping"},
        {key: '{{shipping}}', value: `${_moneyFormat(shipping_total, moneyFormatOptions)}`},

        {key: '{{tax_title}}', value: "Tax"},
        {key: '{{tax}}', value: `${_moneyFormat(tax_total, moneyFormatOptions)}`},

        {key: '{{total_title}}', value: "Total"},
        {key: '{{total_sum}}', value: `${_moneyFormat(total, moneyFormatOptions)}`}
      ];

      let i = 0;
      while (i < replaceVariablesList.length) {
        const replaceAttribute = replaceVariablesList[i];
        html = html.replace(replaceAttribute.key, replaceAttribute.value);
        i++;
      }

      // Add dynamic values
      const lineItemsRows = await _generateLineItems(order.items, 'invoice', order.region.tax_rate, moneyFormatOptions);
      html = html.replace('{{line_items_rows}}', lineItemsRows);

      const footer = await _generateFooter(invoice);
      html = html.replace('{{footer}}', footer);

      await page.setContent(html, {waitUntil: 'networkidle0'});

      await page.addStyleTag({path: `${pathFile}/assets/css/bootstrap.min.css`});
      await page.addStyleTag({path: `${pathFile}/assets/css/style.css`});
      await page.addStyleTag({url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"});

      await page.emulateMediaType('screen');

      const headerTemplate = '<p> </p>'
      const footerTemplate = `
        <div style='width: 100%; display: flex; flex-direction: column; text-align: center; padding: 13px 30px;font-size: 8px; color: #535b61; font-family: Arial'>
          ${setting.footer_html}
        </div>
      `
      await page.pdf({
        path: targetPath,
        margin: {top: '50px', right: '50px', left: '50px', bottom: '100px'},
        printBackground: true,
        displayHeaderFooter: true,
        footerTemplate,
        headerTemplate,
        format: 'A4'
      });

      await browser.close();

      return {
        path: targetPath,
        title: pdfTitle,
      };
    } catch (e) {
      console.error(e)
    }
}