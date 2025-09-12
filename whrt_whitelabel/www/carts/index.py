# whrt_whitelabel/www/carts/index.py
import frappe

def get_context(context):
    # Get all published items (used by JS to filter from localStorage)
    items = frappe.get_all(
        "Item",
        filters={"disabled": 0, "published_in_website": 1},
        fields=["name", "item_name", "image", "standard_rate"]
    )
    context.items = items
    return context
