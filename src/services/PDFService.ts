import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { Platform } from "react-native"
import { format } from "date-fns"
import { supabase } from "../utils/supabase"

/**
 * Generate HTML content for an invoice
 */
export function generateInvoiceHTML(sale: any, items: any[], customer: any, company: any) {
  const date = format(new Date(sale.sale_date), "MMMM d, yyyy")

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const tax = sale.tax_amount || 0
  const discount = sale.discount_amount || 0
  const total = subtotal + tax - discount

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${sale.invoice_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          font-size: 14px;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #3B82F6;
        }
        .company-details {
          text-align: right;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .customer-details {
          width: 50%;
        }
        .invoice-details {
          width: 50%;
          text-align: right;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #f2f2f2;
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .amount-column {
          text-align: right;
        }
        .total-section {
          margin-top: 20px;
          text-align: right;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5px;
        }
        .total-label {
          width: 150px;
          text-align: right;
          margin-right: 20px;
        }
        .total-amount {
          width: 100px;
          text-align: right;
        }
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #3B82F6;
        }
        .notes {
          margin-top: 30px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            ${company.logo ? `<img src="${company.logo}" alt="${company.name}" style="max-height: 80px;">` : `<h2>${company.name}</h2>`}
          </div>
          <div class="company-details">
            <p><strong>${company.name}</strong></p>
            <p>${company.address || ""}</p>
            <p>${company.phone || ""}</p>
            <p>${company.email || ""}</p>
          </div>
        </div>
        
        <div class="invoice-info">
          <div class="customer-details">
            <div class="section-title">Bill To:</div>
            <p><strong>${customer.name}</strong></p>
            <p>${customer.address || ""}</p>
            <p>${customer.phone || ""}</p>
            <p>${customer.email || ""}</p>
          </div>
          <div class="invoice-details">
            <div class="section-title">Invoice Details:</div>
            <p><strong>Invoice Number:</strong> ${sale.invoice_number}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Payment Status:</strong> ${sale.payment_status}</p>
            <p><strong>Payment Method:</strong> ${sale.payment_method}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th class="amount-column">Unit Price</th>
              <th class="amount-column">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit || ""}</td>
                <td class="amount-column">$${item.unit_price.toFixed(2)}</td>
                <td class="amount-column">$${item.total_price.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div class="total-amount">$${subtotal.toFixed(2)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Tax:</div>
            <div class="total-amount">$${tax.toFixed(2)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Discount:</div>
            <div class="total-amount">$${discount.toFixed(2)}</div>
          </div>
          <div class="total-row grand-total">
            <div class="total-label">Total:</div>
            <div class="total-amount">$${total.toFixed(2)}</div>
          </div>
        </div>
        
        ${
          sale.notes
            ? `
          <div class="notes">
            <div class="section-title">Notes:</div>
            <p>${sale.notes}</p>
          </div>
        `
            : ""
        }
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated by TradeTrack Pro</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate and save an invoice PDF
 */
export async function generateInvoicePDF(saleId: string, teamId: string): Promise<string> {
  try {
    // Fetch sale data
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .eq("team_id", teamId)
      .single()

    if (saleError || !sale) {
      throw new Error("Sale not found")
    }

    // Fetch sale items with product details
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select(`
        *,
        products:product_id (name, unit)
      `)
      .eq("sale_id", saleId)
      .eq("team_id", teamId)

    if (itemsError || !items) {
      throw new Error("Sale items not found")
    }

    // Format items for the invoice
    const formattedItems = items.map((item) => ({
      ...item,
      product_name: item.products.name,
      unit: item.products.unit,
    }))

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", sale.customer_id)
      .eq("team_id", teamId)
      .single()

    if (customerError || !customer) {
      throw new Error("Customer not found")
    }

    // Fetch company data (from the team)
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select(`
        *,
        users:owner_id (company_name, company_logo)
      `)
      .eq("id", teamId)
      .single()

    if (teamError || !team) {
      throw new Error("Team not found")
    }

    const company = {
      name: team.users.company_name || team.name,
      logo: team.users.company_logo,
      // Other company details would be added here
    }

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(sale, formattedItems, customer, company)

    // In a real implementation, we would convert HTML to PDF
    // For this demo, we'll save the HTML file

    const fileName = `invoice_${sale.invoice_number.replace(/\s+/g, "_")}.html`
    const filePath = `${FileSystem.documentDirectory}${fileName}`

    await FileSystem.writeAsStringAsync(filePath, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    // In a real implementation, we would upload the PDF to Supabase Storage
    // For this demo, we'll just return the local file path

    return filePath
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    throw error
  }
}

/**
 * Share an invoice
 */
export async function shareInvoice(filePath: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Web platform doesn't support sharing files directly
      // We would typically open the file in a new tab
      window.open(filePath, "_blank")
      return
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync()

    if (!isAvailable) {
      throw new Error("Sharing is not available on this device")
    }

    // Share the file
    await Sharing.shareAsync(filePath)
  } catch (error) {
    console.error("Error sharing invoice:", error)
    throw error
  }
}
