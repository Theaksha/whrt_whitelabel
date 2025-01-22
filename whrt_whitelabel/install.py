import frappe
import csv
import os
from tqdm import tqdm  # Import tqdm for progress bar
import subprocess
import json  # Im


def install_erpnext():
    site = frappe.local.site
    bench_root = os.getenv("BENCH_REPO")

    if not bench_root:
        
        bench_root = os.path.abspath(os.path.join(os.getcwd(), ".."))

    if not bench_root:
        raise ValueError("Could not determine the bench root directory.")

    # Check if ERPNext is already installed or not in the apps directory
    erpnext_path = os.path.join(bench_root, 'apps', 'erpnext')

    if not os.path.exists(erpnext_path):
       
        try:
            subprocess.check_call(
                ['bench', 'get-app', 'erpnext', 'https://github.com/frappe/erpnext.git'],
                cwd=bench_root,
                env=os.environ
            )
            
        except subprocess.CalledProcessError as e:
            
            return False
    else:
        print("ERPNext already exists in the apps directory.")

    

    

    # Check if ERPNext is already installed on the site
    lock_path = os.path.join(site, "locks", "install_app.lock")

    if "erpnext" in frappe.get_installed_apps():
        print("ERPNext is already installed for this site.")
    else:
        print("ERPNext is not installed for this site. Installing ERPNext...")

        # Remove the lock file if it exists
        if os.path.exists(lock_path):
            
            os.remove(lock_path)

        # Install ERPNext using bench
        try:
            
            subprocess.check_call(
                ['bench', '--site', site, 'install-app', 'erpnext','--force'],
                env=os.environ  # Pass the environment to the subprocess
            )
            
        except subprocess.CalledProcessError as e:
            
            return




def setup_login_page():
	navbar_settings = frappe.get_single("Navbar Settings")
    navbar_settings.app_logo = "https://i0.wp.com/profitking.in/wp-content/uploads/2024/05/profitking_logo-removebg-preview-transformed.png?w=2000&ssl=1"
    navbar_settings.save()
    frappe.db.set_value("Website Settings", "Website Settings", "login_page", "pos")
    frappe.db.commit()
    print("Login page set to 'pos'.")


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
        print(f"Created UOM: {uom_name}")


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
        print(f"Created Price List: {price_list_name}")


def create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image):
    if not frappe.db.exists("Item", {"item_code": item_code}):
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
        item.insert(ignore_permissions=True)
        frappe.db.commit()
        
        return item
    else:
       
        return None


def load_demo_data():
    demo_data_file = frappe.get_app_path('whrt_whitelabel', 'fixtures', 'demo_data.csv')

    if not os.path.exists(demo_data_file):
        frappe.log_error(message="Demo data file not found. Skipping demo data loading.", title="Demo Data Error")
        return

    try:
        with open(demo_data_file, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            required_columns = {'item_code', 'item_name', 'item_group', 'stock_uom', 'standard_rate', 'valuation_rate'}

            if not required_columns.issubset(reader.fieldnames):
                frappe.log_error(message="Missing required columns in demo_data.csv", title="Demo Data Error")
                return

            # Display progress bar
            for row in tqdm(reader, desc="Loading demo data", unit="item"):
                try:
                    item_code = row['item_code']
                    item_name = row['item_name']
                    item_group = row['item_group']
                    stock_uom = row['stock_uom']
                    standard_rate = float(row['standard_rate'])
                    valuation_rate = float(row['valuation_rate'])
                    image = row.get('image')

                    create_or_get_item_group(item_group)
                    create_or_get_uom(stock_uom)
                    create_or_get_price_list("Standard Selling")
                    create_or_get_item(item_code, item_name, item_group, stock_uom, standard_rate, valuation_rate, image)
                except Exception as e:
                    frappe.log_error(message=f"Error processing item {row.get('item_code')}: {e}", title="Demo Data Item Error")
    except Exception as e:
        frappe.log_error(message=f"Error loading demo data: {e}", title="Demo Data Loading Error")



if __name__ == "__main__":
    install_erpnext()
    setup_login_page()
    load_demo_data()
