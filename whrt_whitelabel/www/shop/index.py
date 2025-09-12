import frappe
from frappe.utils import cint

def get_context(context):
    filters = {"disabled": 0, "published_in_website": 1}
    item_group = frappe.form_dict.get("item_group")
    brand = frappe.form_dict.get("brand")
    search = frappe.form_dict.get("search")
    page = cint(frappe.form_dict.get("page")) or 1
    per_page = 12  # Items per page

    if item_group:
        filters["item_group"] = item_group
    if brand:
        filters["brand"] = brand
        
    # Enhanced search functionality
    or_filters = None
    if search:
        # Search across multiple fields
        or_filters = {
            "item_name": ["like", f"%{search}%"],
            "description": ["like", f"%{search}%"],
            "item_code": ["like", f"%{search}%"]
        }

    # Get total count for pagination
    total_items = frappe.db.count("Item", filters=filters, or_filters=or_filters)
    
    # Calculate pagination
    total_pages = (total_items + per_page - 1) // per_page if total_items > 0 else 1
    start = (page - 1) * per_page
    
    # Get items with pagination
    items = frappe.get_all("Item", 
        fields=["name", "item_name", "image", "description", "item_group", "brand"],
        filters=filters,
        or_filters=or_filters,
        limit_start=start,
        limit_page_length=per_page
    )

    for item in items:
        item["price"] = frappe.db.get_value("Item Price", {
            "item_code": item.name,
            "price_list": "Standard Selling"
        }, "price_list_rate") or 0.0
        
        # Highlight search terms in results
        if search:
            item["highlighted_name"] = highlight_search_terms(item["item_name"], search)
            if item.get("description"):
                item["highlighted_description"] = highlight_search_terms(item["description"][:100] + "...", search)
        else:
            item["highlighted_name"] = item["item_name"]
            if item.get("description"):
                item["highlighted_description"] = item["description"][:100] + "..."

    context.items = items
    context.item_groups = frappe.get_all("Item Group", filters={"is_group": 0}, fields=["name"])
    context.brands = frappe.get_all("Brand", fields=["name"])
    context.selected_item_group = item_group
    context.selected_brand = brand
    context.search_term = search
    context.current_page = page
    context.total_pages = total_pages
    context.total_items = total_items

    return context

def highlight_search_terms(text, search_terms):
    """Highlight search terms in text"""
    if not search_terms or not text:
        return text
        
    for term in search_terms.split():
        if term.lower() in text.lower():
            # Case insensitive replacement
            import re
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            text = pattern.sub(f'<span class="highlight">{term}</span>', text)
    
    return text