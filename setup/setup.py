import frappe
import json
import os


def create_or_get(name, doctype, filters=None):
    """Utility function to create or fetch a document."""
    if not filters:
        filters = {"name": name}
    if not frappe.db.exists(doctype, filters):
        doc = frappe.get_doc({"doctype": doctype, **filters})
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created {doctype}: {name}")
    else:
        print(f"{doctype} {name} already exists")

def create_demo_items():
    """Load and insert demo data from demo/demo_data.json."""
    app_path = frappe.get_app_path('whrt_whitelabel')
    demo_data_file = os.path.join(app_path, "demo", "demo_data.json")
    
    # List of Item Groups to ensure they exist
    item_groups = [
        "Fruits & Vegetables",
        "Eggs, Meat & Fish",
        "Foodgrains, Oil & Masala",
        "Cleaning & Household",
        "Beverages",
        "Bakery, Cakes & Dairy",
        "Snacks & Branded Foods",
        "Beauty & Hygiene",
        "Gourmet & World Food",
        "Kitchen, Garden & Pets",
        "Baby Care"
    ]
    
    if os.path.exists(demo_data_file):
        with open(demo_data_file, "r") as f:
            demo_data = json.load(f)
        
        # Ensure all item groups exist
        for item_group in item_groups:
            create_or_get(item_group, "Item Group", {"item_group_name": item_group})
        
        # Ensure UOM "kg" exists
        create_or_get("kg", "UOM", {"uom_name": "kg"})

        # Insert items
        for data in demo_data:
            try:
                doc = frappe.get_doc(data)
                doc.insert(ignore_permissions=True)
                frappe.db.commit()
                print(f"Inserted: {doc.name}")
            except Exception as e:
                print(f"Failed to insert {data.get('item_code')}: {e}")
    else:
        print("demo_data.json not found in demo folder")
