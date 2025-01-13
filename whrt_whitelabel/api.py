from __future__ import unicode_literals
import frappe
import json
from frappe.utils import floor, flt, today, cint
from frappe import _
from frappe.model.document import Document
from frappe.utils.background_jobs import enqueue
from erpnext.setup import setup_wizard
 


def whitelabel_patch():
	#delete erpnext welcome page 
	frappe.delete_doc_if_exists('Page', 'welcome-to-erpnext', force=1)
	#update Welcome Blog Post
	if frappe.db.exists("Blog Post", "Welcome"):
		frappe.db.set_value("Blog Post","Welcome","content","")
	update_field_label()
	if cint(get_frappe_version()) >= 13 and not frappe.db.get_single_value('Whitelabel Setting', 'ignore_onboard_whitelabel'):
		update_onboard_details()


def update_field_label():
	"""Update label of section break in employee doctype"""
	frappe.db.sql("""Update `tabDocField` set label='ERP' where fieldname='erpnext_user' and parent='Employee'""")

def get_frappe_version():
	return frappe.db.get_value("Installed Application",{"app_name":"frappe"},"app_version").split('.')[0]

def update_onboard_details():
	update_onboard_module()
	update_onborad_steps()

def update_onboard_module():
	onboard_module_details = frappe.get_all("Module Onboarding",filters={},fields=["name"])
	for row in onboard_module_details:
		doc = frappe.get_doc("Module Onboarding",row.name)
		doc.documentation_url = ""
		doc.flags.ignore_mandatory = True
		doc.save(ignore_permissions = True)

def update_onborad_steps():
	onboard_steps_details = frappe.get_all("Onboarding Step",filters={},fields=["name"])
	for row in onboard_steps_details:
		doc = frappe.get_doc("Onboarding Step",row.name)
		doc.intro_video_url = ""
		doc.description = ""
		doc.flags.ignore_mandatory = True
		doc.save(ignore_permissions = True)

def boot_session(bootinfo):
	"""boot session - send website info if guest"""
	if frappe.session['user']!='Guest':

		bootinfo.whitelabel_setting = frappe.get_doc("Whitelabel Setting","Whitelabel Setting")

@frappe.whitelist()
def ignore_update_popup():
	if not frappe.db.get_single_value('Whitelabel Setting', 'disable_new_update_popup'):
		show_update_popup_update()

@frappe.whitelist()
def show_update_popup_update():
	cache = frappe.cache()
	user  = frappe.session.user
	update_info = cache.get_value("update-info")
	if not update_info:
		return

	updates = json.loads(update_info)

	# Check if user is int the set of users to send update message to
	update_message = ""
	if cache.sismember("update-user-set", user):
		for update_type in updates:
			release_links = ""
			for app in updates[update_type]:
				app = frappe._dict(app)
				release_links += "<b>{title}</b>: <a href='https://github.com/{org_name}/{app_name}/releases/tag/v{available_version}'>v{available_version}</a><br>".format(
					available_version = app.available_version,
					org_name          = app.org_name,
					app_name          = app.app_name,
					title             = app.title
				)
			if release_links:
				message = _("New {} releases for the following apps are available").format(_(update_type))
				update_message += "<div class='new-version-log'>{0}<div class='new-version-links'>{1}</div></div>".format(message, release_links)

	if update_message:
		frappe.msgprint(update_message, title=_("New updates are available"), indicator='green')
		cache.srem("update-user-set", user)
        
 

def custom_on_session_creation(login_manager):
    """
    Redirect user to the POS page after login
    """
    user = frappe.session.user

    # Specify the path to the POS page
    pos_page_url = "/app/point-of-sale"  # Change this to the actual URL of your POS page

    # Redirect to the POS page after login
    frappe.local.response["home_page"] = pos_page_url
    
    
'''def update_logo(doc, method):
    """Update the app logo dynamically based on the Whitelabel Setting."""
    app_logo = doc.app_logo or "/assets/whrt_whitelabel/images/login_logo.jpg"

    # Update Website Settings
    if frappe.db.exists("Website Settings"):
        frappe.db.set_value("Website Settings", "Website Settings", "app_logo", app_logo)
        frappe.db.set_value("Website Settings", "Website Settings", "favicon", app_logo)

    # Update Navbar Settings (if used)
    if frappe.db.exists("Navbar Settings"):
        frappe.db.set_value("Navbar Settings", "Navbar Settings", "app_logo", app_logo)

    frappe.db.commit()'''
    
#for pos-frontend 


# For POS-Frontend 
# frappeAPI.py (Frappe method for handling CORS)
@frappe.whitelist(allow_guest=True)
def get_site_url():
    # Allow CORS for your React app domain
    frappe.local.response["headers"] = {
        "Access-Control-Allow-Origin": "*",  # You can replace "*" with your React app's domain for more security
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    site_url = frappe.local.site
    return site_url


    
@frappe.whitelist(allow_guest=True)
def get_products():
    # Allow Cross-Origin requests
    frappe.local.response["headers"] = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }

    products = frappe.get_all("Item", fields=["name", "item_name", "image", "valuation_rate", "opening_stock"])

    # If needed, map the results to your desired structure (e.g., for better frontend handling)
    product_list = []
    for product in products:
        product_list.append({
            'name': product['name'],
            'item_name': product['item_name'],
            'image': product['image'],
            'valuation_rate': product['valuation_rate'],
            'opening_stock': product['opening_stock']
        })

    return product_list
    
@frappe.whitelist(allow_guest=True)
def get_item_groups():
    try:
        # Allow Cross-Origin requests
        frappe.local.response["headers"] = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }

        # Fetch Item Groups
        item_groups = frappe.get_all(
            "Item Group",
            fields=["item_group_name", "parent_item_group", "is_group"],
            filters={"is_group": 1}  # Optional: Only fetch groups if needed
        )

        # Prepare response
        item_group_list = []
        for group in item_groups:
            item_group_list.append({
                "item_group_name": group.get("item_group_name"),
                "parent_item_group": group.get("parent_item_group"),
                "is_group": group.get("is_group")
            })

        return item_group_list

    except Exception as e:
        frappe.logger().error(f"Error in get_item_groups: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def create_order(order_data):
    order = frappe.new_doc("POS Transaction")
    order.update(order_data)
    order.insert()
    return order.name

@frappe.whitelist(allow_guest=True)
def get_order_details(order_id):
    return frappe.get_doc("POS Transaction", order_id)
