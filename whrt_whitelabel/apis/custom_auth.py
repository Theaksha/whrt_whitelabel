import frappe
from frappe.utils import random_string
from frappe.utils.password import update_password as _update_password

@frappe.whitelist(allow_guest=True)
def send_verification_email(email):
    """Send a verification link with a token"""
    if not frappe.db.exists("User", email):
        frappe.throw("Email not registered.")

    user = frappe.get_doc("User", email)
    token = random_string(32)
    frappe.cache().set_value(f"verification_token:{token}", email, expires_in_sec=3600)

    link = f"{frappe.utils.get_url()}/verify?token={token}"

    frappe.sendmail(
        recipients=[email],
        subject="Verify your account",
        message=f"Hi {user.first_name},<br><br>Click the link below to verify and set your password:<br><br><a href='{link}'>Complete Verification</a>"
    )

    return "Verification email sent."


@frappe.whitelist(allow_guest=True)
def verify_and_set_password(token, password):
    """Verify token and set password"""
    email = frappe.cache().get_value(f"verification_token:{token}")
    if not email:
        frappe.throw("Invalid or expired token.")

    if not frappe.db.exists("User", email):
        frappe.throw("User not found.")

    _update_password(email, password)

    user = frappe.get_doc("User", email)
    user.enabled = 1
    user.flags.ignore_permissions = True
    user.save()
    frappe.cache().delete_value(f"verification_token:{token}")

    # Login the user
    frappe.local.login_manager.login_as(email)
    frappe.db.commit()

    return {"message": "Verification complete", "redirect": "/app/all-products"}
