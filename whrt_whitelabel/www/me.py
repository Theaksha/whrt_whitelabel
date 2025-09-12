import frappe

def get_context(context):
    user = frappe.get_doc("User", frappe.session.user)
    context.current_user = user
    context.user = frappe.session.user  # This adds {{ user }} too
    return context
