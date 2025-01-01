import frappe
import csv
import os




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






    
   


def load_demo_data():
    """Load demo data from CSV file"""
    print("Loading demo data...")

    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    # Explicitly call the function to create or fetch the company
    
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

                BATCH_SIZE = 500  # Commit after every 100 items (adjust as necessary)
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
                        if index % 100 == 0:
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
