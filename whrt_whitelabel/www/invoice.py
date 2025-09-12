# whrt_whitelabel/www/invoice/invoice.py
import frappe

def get_context(context):
    invoice_name = frappe.form_dict.get("name")
    if not invoice_name:
        frappe.throw("Invoice name not provided")

    # Fetch the Sales Invoice document
    invoice = frappe.get_doc("Sales Invoice", invoice_name)

    context.invoice = invoice
    context.items = invoice.items
    context.taxes = invoice.taxes
    context.customer = frappe.get_doc("Customer", invoice.customer)
    return context
