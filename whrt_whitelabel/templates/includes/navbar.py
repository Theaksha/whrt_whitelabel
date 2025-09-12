import frappe

def get_context(context):
    if frappe.session.user != "Guest":
        user = frappe.get_doc("User", frappe.session.user)
        context.user_full_name = user.full_name
        context.user_email = user.email
        context.user_image = user.user_image or "/assets/frappe/images/avatar.png"

    # ✅ Add cart count from session cart
    cart = frappe.session.get("user_cart", {})
    context.cart_count = sum(cart.values()) if cart else 0

    return context
