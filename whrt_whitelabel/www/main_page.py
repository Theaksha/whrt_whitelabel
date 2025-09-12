import frappe
from frappe.utils import now_datetime

def get_context(context):
    # Featured Items
    context["items"] = frappe.get_all(
        "Item",
        fields=["name", "item_name", "image"],
        filters={"disabled": 0, "published_in_website": 1},
        limit=6
    )

    for item in context["items"]:
        item["price"] = frappe.db.get_value(
            "Item Price",
            {
                "item_code": item["name"],
                "price_list": "Standard Selling"
            },
            "price_list_rate"
        ) or 0.0

    # ✅ Fetch Item Groups (not parent groups)
    item_groups = frappe.get_all(
        "Item Group",
        filters={"show_in_website": 1, "is_group": 0},
        fields=["name"]
    )

    context["item_groups"] = item_groups
    context["timestamp"] = int(now_datetime().timestamp())
    return context
