# whrt_whitelabel/www/producte/product.py

import frappe
import urllib.parse

no_cache = 1 

def get_context(context):
    frappe.local.response.no_cache = True

    # Get product code from query string
    item_code = frappe.form_dict.get("name")
    if not item_code:
        frappe.throw("No product specified", frappe.DoesNotExistError)

    decoded_code = urllib.parse.unquote(item_code)

    # Get item by item_code (unique identifier)
    item = frappe.get_doc("Item", {"name": decoded_code})

    # Attach price info
    item.price = frappe.db.get_value(
        "Item Price",
        {"item_code": item.name, "price_list": "Standard Selling"},
        "price_list_rate"
    ) or 0.0

    context.item = item

    # Related items by item_group
    related = frappe.get_all(
        "Item",
        filters={
            "disabled": 0,
            "published_in_website": 1,
            "item_group": item.item_group,
            "name": ["!=", item.name]
        },
        fields=["name", "item_name", "image"],
        limit=6
    )

    for r in related:
        r.price = frappe.db.get_value(
            "Item Price",
            {"item_code": r.name, "price_list": "Standard Selling"},
            "price_list_rate"
        ) or 0.0

    context.related_items = related
    return context
