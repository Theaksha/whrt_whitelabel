import frappe
import csv
import os

def create_or_get_company(default_company_name="WHRT"):
    """Create or fetch the company"""
    existing_companies = frappe.get_all("Company", fields=["name"], limit=1)
    if existing_companies:
        return existing_companies[0]["name"]
    else:
        try:
            company = frappe.get_doc({
                "doctype": "Company",
                "company_name": default_company_name,
                "abbr": default_company_name[:3],
                "country": "India",
                "currency": "INR",
                "default_currency": "INR",
                "fiscal_year_start_date": "2024-04-01",
            })
            company.insert(ignore_permissions=True)
            frappe.db.commit()
            return company.name
        except Exception as e:
            frappe.log_error(message=str(e), title="Error creating or fetching company")
            return None


def create_or_get_item_group(item_group_name):
    """Check if item group exists and create if not"""
    try:
        if not frappe.db.exists("Item Group", item_group_name):
            item_group = frappe.get_doc({
                "doctype": "Item Group",
                "item_group_name": item_group_name,
                "is_group": 1
            })
            item_group.insert(ignore_permissions=True)
            frappe.db.commit()
    except Exception as e:
        frappe.log_error(message=str(e), title=f"Error creating item group: {item_group_name}")


def create_or_get_uom(uom_name):
    """Check if UOM exists and create if not"""
    try:
        if not frappe.db.exists("UOM", uom_name):
            uom = frappe.get_doc({
                "doctype": "UOM",
                "uom_name": uom_name
            })
            uom.insert(ignore_permissions=True)
            frappe.db.commit()
    except Exception as e:
        frappe.log_error(message=str(e), title=f"Error creating UOM: {uom_name}")


def create_or_get_price_list(price_list_name):
    """Check if price list exists and create if not"""
    try:
        if not frappe.db.exists("Price List", price_list_name):
            price_list = frappe.get_doc({
                "doctype": "Price List",
                "price_list_name": price_list_name,
                "selling": 1,
                "buying": 0,
                "is_active": 1
            })
            price_list.insert(ignore_permissions=True)
            frappe.db.commit()
    except Exception as e:
        frappe.log_error(message=str(e), title=f"Error creating price list: {price_list_name}")


def create_or_get_warehouse(company_name):
    """Check if warehouse exists for the company and create if not"""
    try:
        sanitized_company_name = company_name.strip().replace(" ", "").replace("-", "")
        warehouse_name = f"Stores - {sanitized_company_name[:3]}_{company_name}"

        existing_warehouse = frappe.db.exists("Warehouse", {"warehouse_name": warehouse_name, "company": company_name})
        if existing_warehouse:
            return warehouse_name

        warehouse_type = "Stores"
        if not frappe.db.exists("Warehouse Type", warehouse_type):
            warehouse_type_doc = frappe.get_doc({
                "doctype": "Warehouse Type",
                "warehouse_type": warehouse_type,
                "name": warehouse_type
            })
            warehouse_type_doc.insert(ignore_permissions=True)
            frappe.db.commit()

        warehouse = frappe.get_doc({
            "doctype": "Warehouse",
            "warehouse_name": warehouse_name,
            "company": company_name,
            "warehouse_type": warehouse_type,
            "name": warehouse_name
        })
        warehouse.insert(ignore_permissions=True)
        frappe.db.commit()
        return warehouse_name
    except Exception as e:
        frappe.log_error(message=str(e), title=f"Error creating warehouse for company: {company_name}")
        return None


def create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image, items_list):
    """Check if an item exists and create it if not"""
    try:
        # Check if the item already exists by Item Code
        existing_item = frappe.db.exists("Item", {"item_code": item_code})
        if existing_item:
            return existing_item  # Return the existing item

        # If the item doesn't exist, create it
        item = frappe.get_doc({
            "doctype": "Item",
            "item_code": item_code,
            "item_name": item_name,
            "item_group": item_group,
            "stock_uom": stock_uom,
            "standard_rate": standard_rate,
            "valuation_rate": valuation_rate,
            "image": image,
        })
        
        # Add the new item to the list for bulk insertion
        items_list.append(item)
        return item  # Return the newly created item for further reference
    except Exception as e:
        frappe.log_error(message=str(e), title=f"Error creating item: {item_code}")
        return None


def create_stock_entry_type():
    """Create a Stock Entry Type 'Stock Receipt' if it doesn't exist"""
    try:
        stock_entry_type = "Stock Receipt"
        if not frappe.db.exists("Stock Entry Type", stock_entry_type):
            stock_entry_type_doc = frappe.get_doc({
                "doctype": "Stock Entry Type",
                "stock_entry_type": stock_entry_type,
                "name": stock_entry_type
            })
            stock_entry_type_doc.insert(ignore_permissions=True)
            frappe.db.commit()
    except Exception as e:
        frappe.log_error(message=str(e), title="Error creating stock entry type")


def load_demo_data():
    """Load demo data from CSV file"""
    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    # Explicitly call the function to create or fetch the company
    company_name = create_or_get_company("WHRT")  # Ensure 'WHRT' company is created or fetched

    if demo_data_file and os.path.exists(demo_data_file):
        try:
            # Read all item groups from the CSV file and create them
            item_groups_in_csv = set()  # Use a set to ensure unique item groups
            with open(demo_data_file, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    item_groups_in_csv.add(row['item_group'])
            
            # Create item groups from CSV data
            for item_group in item_groups_in_csv:
                create_or_get_item_group(item_group)
            
            create_or_get_uom("kg")
            create_or_get_price_list("Standard Selling")

            # Ensure Stock Entry Type exists
            create_stock_entry_type()  # Create Stock Entry Type if needed

            create_or_get_warehouse(company_name)  # This will now work specifically for 'WHRT'

            items_list = []

            with open(demo_data_file, 'r') as file:
                reader = csv.DictReader(file)

                for row in reader:
                    try:
                        item_code = row['item_code']
                        item_name = row['item_name']
                        valuation_rate = row['valuation_rate']
                        image = row['image']
                        item_group = row['item_group']
                        stock_uom = row['stock_uom']
                        standard_rate = row['standard_rate']
                        opening_stock = row['opening_stock']  # Opening stock from the CSV

                        # Ensure the item group exists before proceeding
                        create_or_get_item_group(item_group)

                        # Ensure item is created and exists
                        item = create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image, items_list)

                        if item:
                            # Simulate stock for POS (without creating stock entries)
                            item.demo_stock = float(opening_stock)  # Use demo stock as POS stock
                            item.save(ignore_permissions=True)

                    except Exception as e:
                        frappe.log_error(message=str(e), title=f"Error processing row: {row}")

            # Insert the items in bulk (one by one in Frappe)
            for item in items_list:
                try:
                    item.insert(ignore_permissions=True)
                    frappe.db.commit()
                except Exception as e:
                    frappe.log_error(message=str(e), title=f"Error inserting item: {item.item_code}")

        except Exception as e:
            frappe.log_error(message=str(e), title="Demo Data Import Error")
    else:
        frappe.log_error(message=f"Demo data file not found: {demo_data_file}", title="Demo Data Error")
