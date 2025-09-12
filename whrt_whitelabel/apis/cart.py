# whrt_whitelabel/api/cart.py
import frappe

@frappe.whitelist(allow_guest=True)
def add_to_cart(item):
    cart = frappe.local.session.get('cart', [])
    cart.append(item)
    frappe.local.session['cart'] = cart
    return {"success": True, "cart_count": len(cart)}

@frappe.whitelist(allow_guest=True)
def get_cart_count():
    cart = frappe.local.session.get('cart', [])
    return {"cart_count": len(cart)}

@frappe.whitelist(allow_guest=True)
def get_cart_items():
    cart = frappe.local.session.get('cart', [])
    if not cart:
        return []

    return frappe.get_all("Item", filters={"name": ["in", cart]}, fields=["name", "item_name", "image", "standard_rate"])
