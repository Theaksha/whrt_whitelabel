# whrt_whitelabel/www/checkout/index.py
import frappe

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.local.response['type'] = 'redirect'
        frappe.local.response['location'] = '/login?redirect-to=/checkout'
        return

    context.csrf_token = frappe.session.csrf_token
    context.user = frappe.session.user
    return context
