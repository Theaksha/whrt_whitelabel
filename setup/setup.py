import frappe
import csv
import os

def create_or_get_company(company_name="My Company"):
    """Utility function to create or fetch a company."""
    if not frappe.db.exists("Company", company_name):
        company = frappe.get_doc({
            "doctype": "Company",
            "company_name": company_name,
            "abbr": company_name[:3],
            "country": "India",  # Set your country
            "currency": "INR",  # Set your default currency
            "default_currency": "INR",
            "fiscal_year_start_date": "2024-04-01",  # Set your fiscal year start date
        })
        company.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Company: {company_name}")
    else:
        print(f"Company '{company_name}' already exists.")

def create_or_get_item_group(item_group_name):
    """Ensure that an Item Group exists."""
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
    """Ensure that a UOM exists."""
    if not frappe.db.exists("UOM", uom_name):
        uom = frappe.get_doc({
            "doctype": "UOM",
            "uom_name": uom_name
        })
        uom.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created UOM: {uom_name}")

def create_or_get_price_list(price_list_name):
    """Ensure that a Price List exists."""
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

def create_or_get_warehouse(warehouse_name, company):
    """Ensure that a Warehouse exists and is linked to the company."""
    # Check if the warehouse already exists
    existing_warehouse = frappe.db.exists("Warehouse", warehouse_name)
    if existing_warehouse:
        print(f"Warehouse '{warehouse_name}' already exists.")
    else:
        warehouse = frappe.get_doc({
            "doctype": "Warehouse",
            "warehouse_name": warehouse_name,
            "company": company  # Link warehouse to company
        })
        warehouse.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Warehouse: {warehouse_name}")

def load_demo_data():
    """Load demo data from CSV file during installation."""
    print("Loading demo data...")

    # Path to the demo data CSV file
    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    if demo_data_file and os.path.exists(demo_data_file):
        print(f"Found demo data file: {demo_data_file}")
        try:
            # Read and parse the CSV file
            with open(demo_data_file, 'r') as file:
                reader = csv.DictReader(file)

                # Ensure required references are set up
                create_or_get_item_group("Fruits & Vegetables")
                create_or_get_item_group("Eggs, Meat & Fish")
                create_or_get_uom("kg")
                create_or_get_price_list("Standard Selling")
                
                # Ensure Company is created
                create_or_get_company("My Company")
                
                # Fetch the company object after it is created
                company = frappe.get_doc("Company", "My Company")

                # Ensure the warehouse is created and linked to the company
                create_or_get_warehouse("Stores-WH", company.name)

                # Loop through CSV rows and create records in ERPNext
                for row in reader:
                    item_code = row['item_code']
                    item_name = row['item_name']
                    valuation_rate = row['valuation_rate']
					image = image['image']
                    item_group = row['item_group']
                    stock_uom = row['stock_uom']
                    standard_rate = row['standard_rate']
                    opening_stock = row['opening_stock']
                    

                    # Create Item record
                    item = frappe.get_doc({
                        "doctype": "Item",
                        "item_code": item_code,
                        "item_name": item_name,
                        "item_group": item_group,
                        "stock_uom": stock_uom,
                        "standard_rate": standard_rate,
                        "valuation_rate": valuation_rate,
                    })
                    item.insert(ignore_permissions=True)
                    frappe.db.commit()
                    print(f"Created Item: {item_code}")

                    # Create Stock Entry if opening stock is provided
                    if opening_stock:
                        create_stock_entry(item_code, opening_stock, warehouse)

                    # Create Item Price record
                    create_item_price(item_code, valuation_rate)

        except Exception as e:
            print(f"Error while importing demo data: {e}")
    else:
        print(f"Demo data file not found: {demo_data_file}")

def create_stock_entry(item_code, quantity, warehouse):
    """Create a Stock Entry for the initial stock."""
    stock_entry = frappe.get_doc({
        "doctype": "Stock Entry",
        "stock_entry_type": "Material Receipt",
        "items": [
            {
                "item_code": item_code,
                "qty": quantity,
                "t_warehouse": warehouse
            }
        ]
    })
    stock_entry.insert(ignore_permissions=True)
    stock_entry.submit()
    frappe.db.commit()
    print(f"Created Stock Entry for {item_code} with {quantity} qty in {warehouse}")

def create_item_price(item_code, price):
    """Create Item Price record."""
    price_list = "Standard Selling"
    if not frappe.db.exists("Item Price", {"item_code": item_code, "price_list": price_list}):
        item_price = frappe.get_doc({
            "doctype": "Item Price",
            "price_list": price_list,
            "item_code": item_code,
            "price_list_rate": price
        })
        item_price.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Item Price for {item_code}")

# Call the function to load demo data during app installation
load_demo_data()
