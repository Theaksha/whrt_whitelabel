import frappe

def setup_login_page():
    # Set custom login page as default
    frappe.db.set_value("Website Settings", "Website Settings", "login_page", "login")
