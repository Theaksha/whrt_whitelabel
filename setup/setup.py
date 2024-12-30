import frappe
import csv
import os

def create_or_get_company(default_company_name="WHRT"):
    """Create or fetch the company"""
    existing_companies = frappe.get_all("Company", fields=["name"], limit=1)
    if existing_companies:
        company_name = existing_companies[0]["name"]
        print(f"Using existing company: {company_name}")
    else:
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
        company_name = company.name
        print(f"Created Company: {company_name}")
    return company_name


def create_or_get_item_group(item_group_name):
    """Check if item group exists and create if not"""
    if not frappe.db.exists("Item Group", item_group_name):
        item_group = frappe.get_doc({
            "doctype": "Item Group",
            "item_group_name": item_group_name,
            "is_group": 1
        })
        item_group.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Item Group: {item_group_name}")

def create_or_get_uom(uom_name):
    """Check if UOM exists and create if not"""
    if not frappe.db.exists("UOM", uom_name):
        uom = frappe.get_doc({
            "doctype": "UOM",
            "uom_name": uom_name
        })
        uom.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created UOM: {uom_name}")

def create_or_get_price_list(price_list_name):
    """Check if price list exists and create if not"""
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
        print(f"Created Price List: {price_list_name}")

def create_or_get_warehouse(company_name):
    """Check if warehouse exists for the company and create if not"""
    sanitized_company_name = company_name.strip().replace(" ", "").replace("-", "")
    warehouse_name = f"Stores - {sanitized_company_name[:3]}_{company_name}"

    existing_warehouse = frappe.db.exists("Warehouse", {"warehouse_name": warehouse_name, "company": company_name})
    if existing_warehouse:
        print(f"Warehouse '{warehouse_name}' already exists. Skipping creation.")
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
    print(f"Created Warehouse: {warehouse_name}")
    return warehouse_name

def create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image, items_list):
    """Check if an item exists and create it if not"""
    try:
        # Check if the item already exists by Item Code
        existing_item = frappe.db.exists("Item", {"item_code": item_code})
        if existing_item:
            print(f"Item '{item_code}' already exists. Skipping creation.")
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
        print(f"Prepared Item: {item_code}")
        return item  # Return the newly created item for further reference
    except Exception as e:
        print(f"Error processing item '{item_code}': {e}")
        return None

def create_stock_entry(item_code, opening_stock, company_name):
    """Create a stock entry for the given item and opening stock"""
    warehouse_name = f"Stores - {company_name[:3]}"  # Adjust warehouse naming convention if needed

    # Check if warehouse exists
    if not frappe.db.exists("Warehouse", warehouse_name):
        print(f"Error: Warehouse '{warehouse_name}' not found for the company '{company_name}'")
        return

    # Create a stock entry (Stock Receipt)
    stock_entry = frappe.get_doc({
        "doctype": "Stock Entry",
        "stock_entry_type": "Material Receipt",  # Correct stock entry type
        "company": company_name,
        "items": [{
            "item_code": item_code,
            "qty": float(opening_stock),
            "uom": "kg",  # Use appropriate UOM
            "t_warehouse": warehouse_name,  # Warehouse where stock is stored
        }]
    })

    # Submit the stock entry to update stock levels
    try:
        stock_entry.insert(ignore_permissions=True)  # Insert into DB
        stock_entry.submit()  # Submit the stock entry to make it effective
        frappe.db.commit()
        print(f"Created Stock Entry for Item: {item_code}, Warehouse: {warehouse_name}, Quantity: {opening_stock}")
    except Exception as e:
        print(f"Error submitting stock entry for Item: {item_code}: {e}")


def create_stock_entry_type():
    """Create a Stock Entry Type 'Stock Receipt' if it doesn't exist"""
    stock_entry_type = "Stock Receipt"
    if not frappe.db.exists("Stock Entry Type", stock_entry_type):
        stock_entry_type_doc = frappe.get_doc({
            "doctype": "Stock Entry Type",
            "stock_entry_type": stock_entry_type,
            "name": stock_entry_type
        })
        stock_entry_type_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Stock Entry Type: {stock_entry_type}")

def load_demo_data():
    """Load demo data from CSV file"""
    print("Loading demo data...")

    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    # Explicitly call the function to create or fetch the company
    company_name = create_or_get_company("WHRT")  # Ensure 'WHRT' company is created or fetched

    if demo_data_file and os.path.exists(demo_data_file):
        print(f"Found demo data file: {demo_data_file}")
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
                            print(f"Set demo stock for item: {item_code}, Stock: {opening_stock}")

                    except Exception as e:
                        print(f"Error processing row {row}: {e}")

            # Insert the items in bulk (one by one in Frappe)
            for item in items_list:
                item.insert(ignore_permissions=True)
                frappe.db.commit()

            print(f"Bulk Insert Complete: {len(items_list)} items inserted.")

        except Exception as e:
            frappe.log_error(message=str(e), title="Demo Data Import Error")
            print(f"Error while importing demo data: {e}")
    else:
        print(f"Demo data file not found: {demo_data_file}") 
