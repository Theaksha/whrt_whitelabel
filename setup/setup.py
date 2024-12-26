# setup.py
import frappe

def load_demo_data():
    """Load demo data after the app installation."""
    print("Loading demo data...")

    # Import demo data (if needed, you can also use `frappe.get_doc` to do it manually here)
    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    if demo_data_file:
        print(f"Found demo data file: {demo_data_file}")
        try:
            with open(demo_data_file, 'r') as file:
                # Example of reading and processing CSV file
                import csv
                reader = csv.DictReader(file)
                for row in reader:
                    item = frappe.get_doc({
                        "doctype": "Item",
                        "item_code": row["item_code"],
                        "item_name": row["item_name"],
                        "item_group": row["item_group"],
                        "stock_uom": row["stock_uom"],
                        "standard_rate": row["standard_rate"],
                        "image":row["image"],
                        "valuation_rate": row["valuation_rate"],
                        "opening_stock": row["opening_stock"],
                        "warehouse": row["warehouse"]
                    })
                    item.insert(ignore_permissions=True)
                    frappe.db.commit()
                    print(f"Inserted Item: {item.item_code}")

            print("Demo data imported successfully.")
        except Exception as e:
            print(f"Error while importing demo data: {e}")
    else:
        print("No demo data file found.")
