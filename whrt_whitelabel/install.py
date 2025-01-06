import frappe
import csv
import os
from tqdm import tqdm  # Import tqdm for progress bar
import subprocess
import json  # Im


def install_erpnext():
site = frappe.local.site

    # Get the bench root directory dynamically
    bench_root = os.getenv("BENCH_REPO")
    if not bench_root:
        print("Warning: BENCH_REPO environment variable is not set, falling back to parent directory.")
        bench_root = os.path.abspath(os.path.join(os.getcwd(), ".."))  # Fallback to parent directory if BENCH_REPO is not set
    
    if not bench_root:
        raise ValueError("Could not determine the bench root directory.")

    site_path = frappe.get_site_path()  # Path for the current site
    if not site_path:
        raise ValueError("Failed to get site path. Ensure the frappe site is correctly set up.")
    
    lock_path = os.path.join(site_path, "locks", "install_app.lock")
    apps_json_path = os.path.join(bench_root, "sites", "apps.json")

    # Check if ERPNext is already installed
    if "erpnext" in frappe.get_installed_apps():
        print("ERPNext is already installed for this site.")
    else:
        print("ERPNext is not installed for this site. Installing ERPNext...")

        # Remove the lock file if it exists
        if os.path.exists(lock_path):
            print(f"Lock file found at {lock_path}, removing it...")
            os.remove(lock_path)

        # Update apps.json
        try:
            print(f"Updating {apps_json_path} to include ERPNext...")
            with open(apps_json_path, "r+") as f:
                apps = json.load(f)

                # Check if apps.json contains a list or a dictionary
                if isinstance(apps, list):
                    if "erpnext" not in apps:
                        apps.append("erpnext")
                elif isinstance(apps, dict):
                    if "erpnext" not in apps.values():
                        apps["erpnext"] = "erpnext"
                else:
                    raise ValueError(f"Unexpected apps.json format: {type(apps)}")

                f.seek(0)
                f.truncate()
                json.dump(apps, f, indent=4)
                print("ERPNext added to apps.json successfully.")

            print(f"Running bench install-app for site: {site}...")
            subprocess.check_call(
                ['bench', '--site', site, 'install-app', 'erpnext', '--force'],
                env=os.environ  # Pass the environment to the subprocess
            )
            print("ERPNext installed successfully via bench.")
        except subprocess.CalledProcessError as e:
            print(f"Error while installing ERPNext via bench: {e}")
            return
        except FileNotFoundError:
            print(f"apps.json not found at {apps_json_path}. Ensure the bench environment is set up properly.")
            return
        except ValueError as e:
            print(f"Error updating apps.json: {e}")
            return

    print("ERPNext installation process complete.") 


def setup_login_page():
    frappe.db.set_value("Website Settings", "Website Settings", "login_page", "pos")
    
def create_or_get_item_group(item_group_name):
    if not frappe.db.exists("Item Group", item_group_name):
        item_group = frappe.get_doc({
            "doctype": "Item Group",
            "item_group_name": item_group_name,
            "is_group": 1
        })
        item_group.insert(ignore_permissions=True)
        frappe.db.commit()
        
def create_or_get_uom(uom_name):
    if not frappe.db.exists("UOM", uom_name):
        uom = frappe.get_doc({
            "doctype": "UOM",
            "uom_name": uom_name
        })
        uom.insert(ignore_permissions=True)
        frappe.db.commit()
        
def create_or_get_price_list(price_list_name):
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
        
def create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image, items_list):
    try:
        existing_item = frappe.db.exists("Item", {"item_code": item_code})
        if existing_item:
            return existing_item

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
        
        items_list.append(item)
        return item
    except Exception:
        return None

def load_demo_data():
    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    if demo_data_file and os.path.exists(demo_data_file):
        try:
            item_groups_in_csv = set()
            with open(demo_data_file, 'r') as csvfile:
                reader = csv.DictReader(csvfile)
                items_list = []

                total_items = sum(1 for row in reader)
                csvfile.seek(0)
                reader = csv.DictReader(csvfile)

                BATCH_SIZE = 100
                items_batch = []

                for index, row in enumerate(tqdm(reader, total=total_items, desc="Processing items"), start=1):
                    try:
                        item_code = row['item_code']
                        item_name = row['item_name']
                        item_group = row['item_group']
                        stock_uom = row['stock_uom']
                        standard_rate = float(row['standard_rate'])
                        valuation_rate = float(row['valuation_rate'])
                        image = row['image'] if row['image'] else None

                        create_or_get_item_group(item_group)
                        create_or_get_uom(stock_uom)
                        create_or_get_price_list("Standard Selling")

                        item = create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image, items_list)

                        if item:
                            item_groups_in_csv.add(item_group)
                        
                        if item:
                            items_batch.append(item)

                        if len(items_batch) >= BATCH_SIZE:
                            for item in items_batch:
                                item.insert(ignore_permissions=True)
                            frappe.db.commit()
                            items_batch = []

                    except Exception as e:
                        with open("error_log.txt", "a") as log_file:
                            log_file.write(f"Error processing row {index}: {e}\n")
                            log_file.write(f"Row Data: {row}\n\n")

                if items_batch:
                    for item in items_batch:
                        item.insert(ignore_permissions=True)
                    frappe.db.commit()
        except Exception:
            pass
