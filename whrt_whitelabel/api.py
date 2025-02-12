from __future__ import unicode_literals
import frappe
import json
from frappe.utils import floor, flt, today, cint
from frappe import _
from frappe.model.document import Document
from frappe.utils.background_jobs import enqueue
from erpnext.setup import setup_wizard
from frappe.utils import nowdate
 



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
    
    

def update_logo(doc, method):
    """Update the app logo dynamically based on the Whitelabel Setting."""
    app_logo = doc.app_logo or "/assets/whrt_whitelabel/images/logo.jpg"

    # Update Website Settings
    if frappe.db.exists("Website Settings"):
        frappe.db.set_value("Website Settings", "Website Settings", "app_logo", app_logo)
        frappe.db.set_value("Website Settings", "Website Settings", "favicon", app_logo)

    # Update Navbar Settings (if used)
    if frappe.db.exists("Navbar Settings"):
        frappe.db.set_value("Navbar Settings", "Navbar Settings", "app_logo", app_logo)

    # Update POS Settings (if used)
    if frappe.db.exists("POS Setting"):
        pos_settings = frappe.get_all("POS Setting", filters={}, fields=["name"])
        for pos_setting in pos_settings:
            frappe.db.set_value("POS Setting", pos_setting.name, "logo", app_logo)

    frappe.db.commit()

# Hook to update logo on save of Whitelabel Setting
frappe.get_doc("Whitelabel Setting", "Whitelabel Setting").on_update = update_logo
    
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
def verify_pos_login(user, pin):
    # Verify user has POS role
    # Check PIN against user document
    if valid:
        return "Success"
    return "Failed"
    
@frappe.whitelist()
def get_pos_users(allow_guest=True):
    return frappe.get_all('User', 
        filters={'enabled': 1, 'roles': ['like', '%POS User%']},
        fields=['name', 'full_name']
    )


@frappe.whitelist(allow_guest=True)
def get_pos_profiles():
    """Fetch POS Profile for the logged-in user."""
    user = frappe.session.user
    pos_profile = frappe.db.get_value("POS Profile", {"user": user}, "name")
    
    if pos_profile:
        return {"pos_profile": pos_profile}
    else:
        return {"pos_profile": None}

@frappe.whitelist(allow_guest=True)
def get_pos_profile_details(pos_profile):
    """Get payment methods, warehouse, tax template from POS Profile"""
    try:
        pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
        return {
            "payment_methods": [m.mode_of_payment for m in pos_profile_doc.payments],
            "warehouse": pos_profile_doc.warehouse,
            "tax_template": pos_profile_doc.tax_category,
            "item_groups": [ig.item_group for ig in pos_profile_doc.item_groups]
        }
    except Exception as e:
        frappe.logger().error(f"Error fetching POS Profile: {str(e)}")
        return {"error": str(e)}


    
@frappe.whitelist(allow_guest=True)
def get_products(category_name=None, page=1, limit=20):
    

    try:
        # Parse page and limit parameters
        page = int(page)
        limit = int(limit)
        offset = (page - 1) * limit

        # Add filters if category_name is provided
        filters = {}
        if category_name:
            filters["item_group"] = category_name

        # Fetch products with pagination
        products = frappe.get_all(
            "Item",
            fields=["name", "item_name", "image", "valuation_rate", "opening_stock"],
            filters=filters,
            limit_start=offset,
            limit_page_length=limit
        )

        # Count total products for the category
        total_count = frappe.db.count("Item", filters=filters)

        # Prepare product list
        product_list = [
            {
                'name': product['name'],
                'item_name': product['item_name'],
                'image': product['image'],
                'valuation_rate': product['valuation_rate'],
                'opening_stock': product['opening_stock']
            }
            for product in products
        ]

        return {"products": product_list, "total_count": total_count}

    except Exception as e:
        frappe.logger().error(f"Error in get_products: {str(e)}")
        return {"error": str(e)}

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

@frappe.whitelist()
def search_products(search_term):
    """Search products by name, barcode, or item code."""
    frappe.logger().info(f"Search Term Received: {search_term}")  # Debugging: Log the search term
    return frappe.get_all("Item", filters={"item_name": ["like", f"%{search_term}%"]}, fields=["name", "item_name", "image", "valuation_rate"])

@frappe.whitelist(allow_guest=True)
def create_order(order_data):
    order = frappe.new_doc("POS Transaction")
    order.update(order_data)
    order.insert()
    return order.name

@frappe.whitelist(allow_guest=True)
def get_order_details(order_id):
    return frappe.get_doc("POS Transaction", order_id)
    
@frappe.whitelist(allow_guest=True)
def get_customers():
    try:
        # Fetch customers
        customers = frappe.get_all(
            "Customer",
            fields=["name", "customer_name"]
        )
        return customers
    except Exception as e:
        frappe.logger().error(f"Error in get_customers: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def search_customers(search_term=None):
        """
        API to search for customers by name.
        """
        if not search_term:  # Ensure `search_term` is optional and defaults to None
            return []

        customers = frappe.get_all(
            "Customer",
            filters={"customer_name": ["like", f"%{search_term}%"]},
            fields=["name", "customer_name","mobile_no"],
            limit_page_length=10,
        )
        return customers



        
@frappe.whitelist(allow_guest=True)
def add_customer(customer_name):
    try:
        customer = frappe.new_doc("Customer")
        customer.customer_name = customer_name
        customer.insert()
        return customer.name
    except Exception as e:
        frappe.logger().error(f"Error in add_customer: {str(e)}")
        return {"error": str(e)}
        
'''frappe.whitelist(allow_guest=True)
def update_loyalty_points(customer, points):
    try:
        customer_doc = frappe.get_doc("Customer", customer)
        if not customer_doc.loyalty_points:
            customer_doc.loyalty_points = 0
        customer_doc.loyalty_points += points
        customer_doc.save()
        return {"message": f"Loyalty points updated for {customer_doc.customer_name}"}
    except Exception as e:
        frappe.logger().error(f"Error updating loyalty points: {str(e)}")
        return {"error": str(e)}'''

@frappe.whitelist(allow_guest=True)
def create_invoice(cart, customer, pos_profile, payments):
    """
    Create a Sales Invoice for POS.
    """
    try:
        frappe.logger().info(f"Received cart data: {cart}")
        frappe.logger().info(f"Customer: {customer}")
        frappe.logger().info(f"POS Profile: {pos_profile}")
        frappe.logger().info(f"Payments: {payments}")

        if not cart:
            frappe.throw("Cart is empty. Cannot create an invoice.")

        if not customer:
            frappe.throw("Customer is not selected. Cannot create an invoice.")

        if not pos_profile:
            frappe.throw("POS Profile is required for invoice creation.")

        # Convert cart JSON string to Python list
        cart = json.loads(cart)
        if not isinstance(cart, list) or len(cart) == 0:
            frappe.throw("Cart must be a non-empty list.")

        # Convert payments JSON string to Python list
        payments = json.loads(payments)
        if not isinstance(payments, list) or len(payments) == 0:
            frappe.throw("At least one mode of payment is required for POS invoice.")

        # Fetch default warehouse from POS Profile
        default_warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")

        if not default_warehouse:
            frappe.throw(f"No warehouse found for POS Profile: {pos_profile}")

        invoice = frappe.new_doc("Sales Invoice")
        invoice.customer = customer
        invoice.posting_date = frappe.utils.nowdate()
        invoice.set_posting_time = 1
        invoice.is_pos = 1
        invoice.pos_profile = pos_profile

        for item in cart:
            frappe.logger().info(f"Processing item: {json.dumps(item)}")

            if not all(k in item for k in ["name", "quantity", "valuation_rate"]):
                frappe.throw(f"Invalid item data: {item}")

            invoice.append("items", {
                "item_code": item.get("name"),
                "qty": item.get("quantity", 1),
                "rate": item.get("valuation_rate"),
                "amount": item.get("valuation_rate") * item.get("quantity", 1),
                "warehouse": default_warehouse,
                "uom": frappe.db.get_value("Item", item.get("name"), "stock_uom")
            })

        # ✅ Process Payments
        for payment in payments:
            frappe.logger().info(f"Processing payment: {payment}")
            invoice.append("payments", {
                "mode_of_payment": payment["mode_of_payment"],
                "amount": payment["amount"]
            })

        invoice.insert()
        invoice.submit()
        frappe.db.commit()

        frappe.logger().info(f"Invoice created successfully: {invoice.name}")

        return {"invoice_id": invoice.name}

    except Exception as e:
        frappe.logger().error(f"Error creating Sales Invoice: {str(e)}")
        return {"error": str(e)}




# Backend Method (Python)
@frappe.whitelist(allow_guest=True)
def create_payment_entry(invoice_id, payment_entries):
    """
    Create Payment Entry for Sales Invoice.
    """
    try:
        if not invoice_id or not payment_entries:
            return {"error": "Missing required parameters"}

        invoice = frappe.get_doc("Sales Invoice", invoice_id)

        for entry in json.loads(payment_entries):
            payment_entry = frappe.new_doc("Payment Entry")
            payment_entry.payment_type = "Receive"
            payment_entry.party_type = "Customer"
            payment_entry.party = invoice.customer
            payment_entry.paid_amount = entry.get("amount")
            payment_entry.received_amount = entry.get("amount")
            payment_entry.mode_of_payment = entry.get("method")
            payment_entry.reference_no = invoice.name
            payment_entry.reference_date = nowdate()
            payment_entry.insert()
            payment_entry.submit()

        return {"message": "Payment processed successfully!"}

    except Exception as e:
        frappe.logger().error(f"Error in creating payment entry: {str(e)}")
        return {"error": str(e)}


@frappe.whitelist(allow_guest=True)
def update_invoice_status(invoice_id=None, status=None):
    try:
        if not invoice_id:
            frappe.throw("Missing invoice_id.")
        if not status:
            frappe.throw("Missing status.")
        
        invoice = frappe.get_doc("POS Invoice", invoice_id)
        invoice.status = status
        invoice.save()
        frappe.db.commit()
        
        return f"Invoice {invoice_id} status updated to {status}"

    except Exception as e:
        frappe.log_error(f"Error updating invoice status: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def email_invoice(invoice_id):
    """
    Email the invoice to the customer.
    :param invoice_id: The ID of the Sales Invoice.
    :return: Success message or error.
    """
    try:
        # Fetch the Sales Invoice
        invoice = frappe.get_doc("Sales Invoice", invoice_id)

        # Get customer email
        customer_email = frappe.get_value("Customer", invoice.customer, "email_id")
        if not customer_email:
            return {"error": "Customer email not found."}

        # Send email with invoice attachment
        frappe.sendmail(
            recipients=[customer_email],
            subject=f"Invoice {invoice.name}",
            message="Dear Customer, please find attached your invoice.",
            attachments=[{
                'file': frappe.utils.get_pdf(invoice),
                'filename': f"Invoice_{invoice.name}.pdf"
            }]
        )

        return {"message": "Invoice emailed successfully."}

    except Exception as e:
        frappe.logger().error(f"Error in emailing invoice: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def reduce_stock(item_code, quantity):
    """
    Reduce the stock of an item.
    :param item_code: The code of the item.
    :param quantity: The quantity to reduce.
    :return: Success message or error.
    """
    try:
        # Fetch the Item
        item = frappe.get_doc("Item", item_code)

        # Reduce the stock
        item.qty_in_stock -= quantity
        item.save()

        return {"message": f"Stock reduced for {item.item_name}."}

    except Exception as e:
        frappe.logger().error(f"Error reducing stock: {str(e)}")
        return {"error": str(e)}
        
@frappe.whitelist()
def set_customer_info(doc):
    """Create a new customer."""
    customer = frappe.get_doc(doc)
    customer.insert()
    return customer

@frappe.whitelist()
def update_loyalty_points(customer, points):
    """Update loyalty points for a customer."""
    customer_doc = frappe.get_doc("Customer", customer)
    customer_doc.loyalty_points = (customer_doc.loyalty_points or 0) + points
    customer_doc.save()
    return f"Added {points} loyalty points to {customer_doc.customer_name}."
