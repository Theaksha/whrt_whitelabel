import frappe
import csv
import os

def create_or_get_company(default_company_name="WHRT"):
    """Create or fetch the company"""
    formatted_company_name = default_company_name.replace(" ", "")  # Remove spaces

    existing_companies = frappe.get_all("Company", fields=["name"], limit=1)
    if existing_companies:
        company_name = existing_companies[0]["name"]
        print(f"Using existing company: {company_name}")
    else:
        company = frappe.get_doc({
            "doctype": "Company",
            "company_name": formatted_company_name,
            "abbr": formatted_company_name[:3],  # First 3 letters as abbreviation
            "country": "India",
            "currency": "INR",
            "default_currency": "INR",
            "fiscal_year_start_date": "2024-04-01",
        })
        company.insert(ignore_permissions=True)
        frappe.db.commit()
        company_name = company.name  # Use the newly created company name
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
        
        return item  # Return the newly created item for further reference
    except Exception as e:
        print(f"Error processing item '{item_code}': {e}")
        return None


def create_or_get_warehouse(warehouse_name, warehouse_type="Stores"):
    """Check if warehouse exists, and create if not"""
    if not frappe.db.exists("Warehouse", warehouse_name):
        warehouse = frappe.get_doc({
            "doctype": "Warehouse",
            "warehouse_name": warehouse_name,
            "warehouse_type": warehouse_type  # Ensure this is set correctly
        })
        warehouse.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Warehouse: {warehouse_name}")
    else:
        print(f"Warehouse '{warehouse_name}' already exists.")


def create_pos_profile():
    """Create POS Profile if it doesn't exist"""
    company_name = create_or_get_company("WHRT")  # Dynamically get the company
    formatted_company_name = company_name.replace(" ", "")  # Remove spaces from the company name

    # Dynamically create write-off account and parent account
    write_off_account = f"Cost of Goods Sold - {formatted_company_name}"  # Default write-off account name
    parent_account = f"Stock Expenses - {formatted_company_name}"  # Default parent account name
    
    # Check and create write-off account if it doesn't exist
    if not frappe.db.exists("Account", write_off_account):
        frappe.get_doc({
            "doctype": "Account",
            "account_name": write_off_account,
            "account_type": "Cost of Goods Sold",
            "company": company_name,  # Use the correct company name
            "parent_account": parent_account,  # Use the dynamically generated parent account
            "is_group": 0,
            "currency": "INR"
        }).insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Write-Off Account: {write_off_account}")
    
    # Check and create write-off cost center if it doesn't exist
    write_off_cost_center = f"Main - {formatted_company_name}"  # Default write-off cost center name
    if not frappe.db.exists("Cost Center", write_off_cost_center):
        frappe.get_doc({
            "doctype": "Cost Center",
            "cost_center_name": write_off_cost_center,
            "company": company_name,  # Use the correct company name
            "is_group": 0
        }).insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Write-Off Cost Center: {write_off_cost_center}")
    
    # Get the POS Profile name
    pos_profile_name = f"{formatted_company_name} POS Profile"

    # Check if the POS Profile already exists to avoid duplicates
    pos_profile = frappe.get_all('POS Profile', filters={'name': pos_profile_name})
    if not pos_profile:
        # Create the POS Profile for the company
        pos_profile = frappe.get_doc({
            'doctype': 'POS Profile',
            'company': company_name,  # Use the correct company name
            'warehouse': f"Stores - {formatted_company_name}",
            'name': pos_profile_name,
            'currency': 'INR',  # Adjust this based on your requirements
            'selling_price_list': 'Standard Selling',  # Adjust the price list if needed
            'default_branch': 'Main',  # Define the default branch if required
            'write_off_account': write_off_account,  # Dynamically assigned write-off account
            'write_off_cost_center': write_off_cost_center,  # Dynamically assigned write-off cost center
            'payments': [  # Add at least one payment method
                {
                    'mode_of_payment': 'Cash',  # Default payment mode
                    'default': 1,
                    'account': f"Cash - {formatted_company_name}"  # Default cash account
                }
            ]
        })
        pos_profile.insert()
        frappe.db.commit()
        print(f"Created POS Profile for company {company_name}")
    else:
        print(f"POS Profile for company {company_name} already exists.")


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
            with open(demo_data_file, 'r') as csvfile:
                reader = csv.DictReader(csvfile)
                items_list = []

                # Count the total number of rows
                total_items = sum(1 for row in reader)
                csvfile.seek(0)  # Reset file pointer to the start of the file
                reader = csv.DictReader(csvfile)  # Re-create the reader to start from the beginning

                BATCH_SIZE = 100  # Commit after every 100 items (adjust as necessary)
                items_batch = []

                for index, row in enumerate(reader, start=1):
                    try:
                        item_code = row['item_code']
                        item_name = row['item_name']
                        item_group = row['item_group']
                        stock_uom = row['stock_uom']
                        standard_rate = float(row['standard_rate'])
                        valuation_rate = float(row['valuation_rate'])
                        image = row['image'] if row['image'] else None

                        # Ensure item group and UOM exist
                        create_or_get_item_group(item_group)
                        create_or_get_uom(stock_uom)

                        # Ensure price list exists
                        create_or_get_price_list("Standard Selling")

                        # Create or fetch the item
                        item = create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image, items_list)

                        # Add item group to list for further use
                        if item:
                            item_groups_in_csv.add(item_group)

                        # Print progress for every 10 items (or change this number as needed)
                        if index % 10 == 0:
                            print(f"Processed {index} out of {total_items} items...")

                        # Add item to batch for later bulk insert
                        if item:
                            items_batch.append(item)

                        # Commit in batches
                        if len(items_batch) >= BATCH_SIZE:
                            for item in items_batch:
                                item.insert(ignore_permissions=True)
                            frappe.db.commit()
                            items_batch = []  # Clear the batch after commit

                    except Exception as e:
                        print(f"Error processing row {index}: {e}")
                        with open("error_log.txt", "a") as log_file:
                            log_file.write(f"Error processing row {index}: {e}\n")
                            log_file.write(f"Row Data: {row}\n\n")

                # Insert any remaining items in the batch
                if items_batch:
                    for item in items_batch:
                        item.insert(ignore_permissions=True)
                    frappe.db.commit()

                print("Bulk insertion of items completed.")

        except Exception as e:
            print(f"Error loading demo data from CSV: {e}")
    else:
        print("Demo data file not found.")
