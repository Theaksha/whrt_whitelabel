from __future__ import unicode_literals
import frappe
import json
from frappe.utils import floor, flt, today, cint, nowdate
from frappe import _
from frappe.model.document import Document
from frappe.utils.background_jobs import enqueue
from erpnext.setup import setup_wizard
from frappe.query_builder.functions import Sum, IfNull  # Required for reserved stock calculations
import logging
from urllib.parse import urlparse
import requests
logger = logging.getLogger(__name__)


def whitelabel_patch():
    frappe.delete_doc_if_exists('Page', 'welcome-to-erpnext', force=1)
    if frappe.db.exists("Blog Post", "Welcome"):
        frappe.db.set_value("Blog Post", "Welcome", "content", "")
    update_field_label()
    if cint(get_frappe_version()) >= 13 and not frappe.db.get_single_value('Whitelabel Setting', 'ignore_onboard_whitelabel'):
        update_onboard_details()

def update_field_label():
    frappe.db.sql("""Update `tabDocField` set label='ERP' where fieldname='erpnext_user' and parent='Employee'""")

def get_frappe_version():
    return frappe.db.get_value("Installed Application", {"app_name": "frappe"}, "app_version").split('.')[0]

def update_onboard_details():
    update_onboard_module()
    update_onborad_steps()

def update_onboard_module():
    onboard_module_details = frappe.get_all("Module Onboarding", filters={}, fields=["name"])
    for row in onboard_module_details:
        doc = frappe.get_doc("Module Onboarding", row.name)
        doc.documentation_url = ""
        doc.flags.ignore_mandatory = True
        doc.save(ignore_permissions=True)

def update_onborad_steps():
    onboard_steps_details = frappe.get_all("Onboarding Step", filters={}, fields=["name"])
    for row in onboard_steps_details:
        doc = frappe.get_doc("Onboarding Step", row.name)
        doc.intro_video_url = ""
        doc.description = ""
        doc.flags.ignore_mandatory = True
        doc.save(ignore_permissions=True)

def boot_session(bootinfo):
    if frappe.session['user'] != 'Guest':
        bootinfo.whitelabel_setting = frappe.get_doc("Whitelabel Setting", "Whitelabel Setting")

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
    update_message = ""
    if cache.sismember("update-user-set", user):
        for update_type in updates:
            release_links = ""
            for app in updates[update_type]:
                app = frappe._dict(app)
                release_links += "<b>{title}</b>: <a href='https://github.com/{org_name}/{app_name}/releases/tag/v{available_version}'>v{available_version}</a><br>".format(
                    available_version=app.available_version,
                    org_name=app.org_name,
                    app_name=app.app_name,
                    title=app.title
                )
            if release_links:
                message = _("New {} releases for the following apps are available").format(_(update_type))
                update_message += "<div class='new-version-log'>{0}<div class='new-version-links'>{1}</div></div>".format(message, release_links)
    if update_message:
        frappe.msgprint(update_message, title=_("New updates are available"), indicator='green')
        cache.srem("update-user-set", user)

def custom_on_session_creation(login_manager):
    user = frappe.session.user
    pos_page_url = "/app/point-of-sale"
    frappe.local.response["home_page"] = pos_page_url

# --- POS-Frontend APIs ---



@frappe.whitelist()
def get_pos_page():
    """Fetch the WHRT POS page's stored HTML content from the file system"""
    try:
        # Ensure the correct file path
        html_path = frappe.get_app_path("whrt_whitelabel", "public", "whrt_pos_template.html")

        # Read and return the HTML content
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read().strip()  # Trim unwanted characters
            if not html_content:
                return "<h2>Error: HTML file is empty.</h2>"
            return html_content

    except Exception as e:
        return f"<h2>Error Loading POS Page: {str(e)}</h2>"

@frappe.whitelist(allow_guest=True)
def get_site_url():
    frappe.local.response["headers"] = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    return frappe.local.site

@frappe.whitelist(allow_guest=True)
def verify_pos_login(user, pin):
    if valid:
        return "Success"
    return "Failed"

@frappe.whitelist()
def get_pos_users(allow_guest=True):
    return frappe.get_all('User', filters={'enabled': 1, 'roles': ['like', '%POS User%']}, fields=['name', 'full_name'])

@frappe.whitelist(allow_guest=True)
def get_pos_profiles():
    user = frappe.session.user
    pos_profile = frappe.db.get_value("POS Profile", {"owner": user}, "name")
    if pos_profile:
        return {"name": pos_profile}
    else:
        return []

@frappe.whitelist(allow_guest=True)
def get_pos_profile_details(pos_profile):
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
def get_pos_profiles_for_company(company):
    profiles = frappe.get_all("POS Profile", filters={"company": company}, fields=["name"])
    return profiles

@frappe.whitelist(allow_guest=True)
def get_products(category_name=None, page=1, limit=20):
    try:
        page = int(page)
        limit = int(limit)
        offset = (page - 1) * limit
        filters = {}
        if category_name:
            filters["item_group"] = category_name
        products = frappe.get_all("Item", fields=["name", "item_name", "image", "valuation_rate"],
                                  filters=filters, limit_start=offset, limit_page_length=limit)
        total_count = frappe.db.count("Item", filters=filters)
        product_list = []
        for product in products:
            actual_qty = frappe.db.get_value("Bin", {"item_code": product["name"], "warehouse": "Main Warehouse"}, "actual_qty") or 0
            product_list.append({
                'name': product['name'],
                'item_name': product['item_name'],
                'image': product['image'],
                'valuation_rate': product['valuation_rate'],
                'actual_qty': actual_qty
            })
        return {"products": product_list, "total_count": total_count}
    except Exception as e:
        frappe.logger().error(f"Error in get_products: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def get_item_groups():
    try:
        frappe.local.response["headers"] = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
        item_groups = frappe.get_all("Item Group", fields=["item_group_name", "parent_item_group", "is_group"])
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
    frappe.logger().info(f"Search Term Received: {search_term}")
    return frappe.get_all("Item", filters={"item_name": ["like", f"%{search_term}%"]},
                            fields=["name", "item_name", "image", "valuation_rate"])

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
        customers = frappe.get_all("Customer", fields=["name", "customer_name"])
        return customers
    except Exception as e:
        frappe.logger().error(f"Error in get_customers: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def search_customers(search_term=None):
    if not search_term:
        return []
    customers = frappe.get_all("Customer", filters={"customer_name": ["like", f"%{search_term}%"]},
                                 fields=["name", "customer_name", "mobile_no"], limit_page_length=10)
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

# --------------------------------------------------------------------------
# POS Invoice & Payment Related Functions
# --------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def create_invoice(cart, customer, pos_profile, payments, taxes_and_charges=None):
    try:
        cart = json.loads(cart)
        payments = json.loads(payments)
        if not cart:
            frappe.throw("Cart is empty. Cannot create an invoice.")
        if not customer:
            frappe.throw("Customer is not selected. Cannot create an invoice.")
        if not pos_profile:
            frappe.throw("POS Profile is required for invoice creation.")
        default_warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
        if not default_warehouse:
            frappe.throw(f"No warehouse found for POS Profile: {pos_profile}")
        invoice = frappe.new_doc("POS Invoice")
        invoice.customer = customer
        invoice.posting_date = frappe.utils.nowdate()
        invoice.set_posting_time = 1
        invoice.is_pos = 1
        invoice.pos_profile = pos_profile
        invoice.update_stock = 1
        if taxes_and_charges:
            invoice.taxes_and_charges = taxes_and_charges
        for item in cart:
            if not all(k in item for k in ["name", "quantity", "valuation_rate"]):
                frappe.throw(f"Invalid item data: {item}")
            invoice.append("items", {
                "item_code": item["name"],
                "qty": item["quantity"],
                "rate": item["valuation_rate"],
                "amount": item["valuation_rate"] * item["quantity"],
                "warehouse": default_warehouse,
                "uom": frappe.db.get_value("Item", item["name"], "stock_uom")
            })
        for pay in payments:
            invoice.append("payments", {
                "mode_of_payment": pay["mode_of_payment"],
                "amount": pay["amount"]
            })
        invoice.run_method("set_missing_values")
        invoice.run_method("calculate_taxes_and_totals")
        invoice.insert()
        invoice.submit()
        # Build a response with the invoice totals and items
        items_list = []
        for it in invoice.items:
            items_list.append({
                "item_name": it.item_name,
                "actual_qty": it.qty,
                "rate": it.rate
            })

        payments_list = []
        for p in invoice.payments:
            payments_list.append({
                "mode_of_payment": p.mode_of_payment,
                "amount": p.amount
            })

        return {
            "invoice_id": invoice.name,
            "customer_name": invoice.customer,
            "net_total": invoice.net_total,
            "total_taxes_and_charges": invoice.total_taxes_and_charges,
            "grand_total": invoice.grand_total,
            "items": items_list,
            "payments": payments_list
        }

    except Exception as e:
        frappe.log_error(f"Error creating POS Invoice: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def create_payment_entry(invoice_id, payment_entries):
    try:
        if not invoice_id or not payment_entries:
            return {"error": "Missing required parameters"}
        invoice = frappe.get_doc("POS Invoice", invoice_id)
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
    try:
        invoice = frappe.get_doc("POS Invoice", invoice_id)
        customer_email = frappe.get_value("Customer", invoice.customer, "email_id")
        if not customer_email:
            return {"error": "Customer email not found."}
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

@frappe.whitelist()
def reduce_stock(item_code=None, quantity=None, **kwargs):
    if item_code is None or quantity is None:
        frappe.throw("Both item_code and quantity are required.")
    try:
        qty = cint(quantity)
        bin_list = frappe.get_all("Bin", filters={"item_code": item_code}, fields=["warehouse"], limit=1)
        if not bin_list:
            frappe.throw(f"No Bin record found for item {item_code}")
        warehouse = bin_list[0].warehouse
        bin_doc = frappe.get_doc("Bin", {"item_code": item_code, "warehouse": warehouse}, ignore_permissions=True)
        logger.debug(f"Reducing stock for item {item_code} in warehouse {warehouse} by {qty}")
        bin_doc.actual_qty = (bin_doc.actual_qty or 0) - qty
        bin_doc.save(ignore_permissions=True)
        return {"message": f"Stock reduced for item {item_code} in warehouse {warehouse}."}
    except Exception as e:
        logger.error(f"Error reducing stock: {str(e)}", exc_info=True)
        return {"error": str(e)}

@frappe.whitelist()
def set_customer_info(doc):
    if isinstance(doc, str):
        doc = json.loads(doc)
    new_doc = frappe.get_doc(doc)
    new_doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return new_doc.as_dict()

@frappe.whitelist()
def update_loyalty_points(customer, points):
    customer_doc = frappe.get_doc("Customer", customer)
    customer_doc.loyalty_points = (customer_doc.loyalty_points or 0) + points
    customer_doc.save()
    return f"Added {points} loyalty points to {customer_doc.customer_name}."

@frappe.whitelist(allow_guest=True)
def calculate_taxes_for_pos_invoice(cart, company, customer, taxes_and_charges=None):
    cart_data = json.loads(cart) if cart else []
    if not cart_data:
        return {
            "net_total": 0,
            "total_taxes_and_charges": 0,
            "grand_total": 0,
            "taxes": []
        }
    fallback_price_list = "Standard Selling"
    fallback_customer_group = "Commercial"
    fallback_currency = "USD"
    original_get_value = frappe.db.get_value
    if customer == "Walk-in Customer":
        def fallback_get_value(doctype, name, fieldnames, *args, **kwargs):
            if doctype == "Customer" and name == "Walk-in Customer" and fieldnames == ["default_price_list", "customer_group", "customer_currency"]:
                return (fallback_price_list, fallback_customer_group, fallback_currency)
            return original_get_value(doctype, name, fieldnames, *args, **kwargs)
        frappe.db.get_value = fallback_get_value
    try:
        pos_invoice_doc = frappe.get_doc({
            "doctype": "POS Invoice",
            "company": company,
            "customer": customer,
            "taxes_and_charges": taxes_and_charges
        })
        for item in cart_data:
            pos_invoice_doc.append("items", {
                "item_code": item.get("name"),
                "item_name": item.get("item_name"),
                "qty": item.get("quantity", 1),
                "rate": item.get("valuation_rate", 0),
                "uom": "Nos"
            })
        pos_invoice_doc.run_method("set_missing_values")
        pos_invoice_doc.run_method("calculate_taxes_and_totals")
        result = {
            "net_total": pos_invoice_doc.net_total,
            "total_taxes_and_charges": pos_invoice_doc.total_taxes_and_charges,
            "grand_total": pos_invoice_doc.grand_total,
            "taxes": [
                {
                    "description": tax.description or tax.account_head,
                    "tax_amount": tax.tax_amount
                }
                for tax in pos_invoice_doc.get("taxes", [])
            ]
        }
    finally:
        frappe.db.get_value = original_get_value
    return result

@frappe.whitelist(allow_guest=True)
def create_pos_opening_entry(company, pos_profile, period_start_date, period_end_date, opening_balance_details):
    try:
        details = json.loads(opening_balance_details)
        entry = frappe.new_doc("POS Opening Entry")
        entry.period_start_date = period_start_date
        entry.posting_date = period_start_date
        entry.company = company
        entry.pos_profile = pos_profile
        entry.user = frappe.session.user
        if details:
            for d in details:
                entry.append("balance_details", d)
        entry.insert()
        entry.submit()
        frappe.db.commit()
        frappe.logger().info(f"POS Opening Entry created: {entry.name}")
        return {"opening_entry": entry.name}
    except Exception as e:
        frappe.logger().error("Error creating POS Opening Entry: " + str(e), exc_info=True)
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def get_pos_invoices_for_closing(pos_opening_entry, period_end_date):
    """
    Fetch POS Invoices for the closing period:
      - Invoices must belong to the same user and POS profile as the opening entry.
      - Only submitted invoices (docstatus=1) that have not been consolidated.
      - Filter by posting timestamp between the opening entry's period_start_date and period_end_date.
    """
    opening = frappe.get_doc("POS Opening Entry", pos_opening_entry)
    start = opening.period_start_date
    end = period_end_date
    user = opening.user
    pos_profile = opening.pos_profile
    invoices = frappe.db.sql(
        """
        SELECT name, posting_date, posting_time, grand_total, net_total, total_qty
        FROM `tabPOS Invoice`
        WHERE owner=%s AND docstatus=1 AND pos_profile=%s AND IFNULL(consolidated_invoice,'') = ''
        """,
        (user, pos_profile),
        as_dict=1
    )
    filtered = []
    for inv in invoices:
        # Convert posting_date to string
        posting_date_str = inv.posting_date if isinstance(inv.posting_date, str) else str(inv.posting_date)
        # Convert posting_time to string. If it is a timedelta, format it as HH:MM:SS.
        if isinstance(inv.posting_time, str):
            posting_time_str = inv.posting_time
        else:
            # Assuming posting_time is a timedelta
            total_seconds = int(inv.posting_time.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            posting_time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        ts = frappe.utils.get_datetime(posting_date_str + " " + posting_time_str)
        if frappe.utils.get_datetime(start) <= ts <= frappe.utils.get_datetime(end):
            try:
                inv_doc = frappe.get_doc("POS Invoice", inv["name"], ignore_permissions=True)
                filtered.append(inv_doc)
            except Exception as e:
                logger.debug(f"Failed to fetch POS Invoice {inv['name']} with ignore_permissions: {str(e)}")
    logger.debug(f"get_pos_invoices_for_closing: Found {len(filtered)} invoices between {start} and {end}")
    return filtered


@frappe.whitelist(allow_guest=True)
def create_pos_closing_entry(pos_opening_entry, period_end_date, posting_date, posting_time,
                             pos_transactions, payment_reconciliation, taxes, grand_total, net_total, total_quantity):
    """
    Create a POS Closing Entry by fetching all relevant POS invoices between the opening entry's start date
    and the given period_end_date. Aggregated values are computed on the server.
    """
    try:
        logger.debug("Starting create_pos_closing_entry")
        opening = frappe.get_doc("POS Opening Entry", pos_opening_entry, ignore_permissions=True)
        closing = frappe.new_doc("POS Closing Entry")
        closing.period_start_date = opening.period_start_date
        closing.period_end_date = period_end_date
        closing.posting_date = posting_date
        closing.posting_time = posting_time
        closing.company = opening.company
        closing.pos_profile = opening.pos_profile
        closing.user = opening.user
        closing.pos_opening_entry = pos_opening_entry

        # Fetch relevant POS Invoices
        invoices = get_pos_invoices_for_closing(pos_opening_entry, period_end_date)
        logger.debug(f"Fetched {len(invoices)} invoices for closing entry {pos_opening_entry}")
        
        pos_transactions_list = []
        taxes_list = []
        payments_list = []
        closing.grand_total = 0
        closing.net_total = 0
        closing.total_quantity = 0

        # Aggregate details from each invoice
        for inv in invoices:
            pos_transactions_list.append({
                "pos_invoice": inv.name,
                "posting_date": inv.posting_date,
                "grand_total": inv.grand_total,
                "customer": inv.customer
            })
            closing.grand_total += flt(inv.grand_total)
            closing.net_total += flt(inv.net_total)
            closing.total_quantity += flt(inv.get("total_qty") or 0)

            # Aggregate tax details
            for t in inv.get("taxes", []):
                found = False
                for tax in taxes_list:
                    if tax.get("account_head") == t.get("account_head") and tax.get("rate") == t.get("rate"):
                        tax["amount"] += flt(t.get("tax_amount"))
                        found = True
                        break
                if not found:
                    taxes_list.append({
                        "account_head": t.get("account_head"),
                        "rate": t.get("rate"),
                        "amount": flt(t.get("tax_amount"))
                    })

            # Aggregate payment details
            for p in inv.get("payments", []):
                found = False
                for pay in payments_list:
                    if pay.get("mode_of_payment") == p.get("mode_of_payment"):
                        pay["expected_amount"] += flt(p.get("amount"))
                        found = True
                        break
                if not found:
                    payments_list.append({
                        "mode_of_payment": p.get("mode_of_payment"),
                        "opening_amount": 0,
                        "expected_amount": flt(p.get("amount"))
                    })

        closing.set("pos_transactions", pos_transactions_list)
        closing.set("payment_reconciliation", payments_list)
        closing.set("taxes", taxes_list)

        closing.insert(ignore_permissions=True)
        closing.submit()
        frappe.db.commit()
        logger.debug(f"POS Closing Entry created successfully: {closing.name}")
        return {"closing_entry": closing.name}
    except Exception as e:
        logger.error("Error creating POS Closing Entry: " + str(e), exc_info=True)
        return {"error": str(e)}
# --------------------------------------------------------------------------
# Helpers for Accurate Stock Calculation
# --------------------------------------------------------------------------

@frappe.whitelist()
def get_bin_qty(item_code, warehouse):
    bin_qty = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty")
    return flt(bin_qty) if bin_qty else 0

@frappe.whitelist()
def get_pos_reserved_qty(item_code, warehouse):
    p_inv = frappe.qb.DocType("POS Invoice")
    p_item = frappe.qb.DocType("POS Invoice Item")
    query = (
        frappe.qb.from_(p_inv)
        .join(p_item)
        .on(p_inv.name == p_item.parent)
        .select(Sum(p_item.stock_qty).as_("reserved_qty"))
        .where(
            (p_inv.docstatus == 1)
            & (IfNull(p_inv.consolidated_invoice, "") == "")
            & (p_item.item_code == item_code)
            & (p_item.warehouse == warehouse)
        )
    )
    result = query.run(as_dict=True)
    return flt(result[0].reserved_qty) if result and result[0].reserved_qty else 0

@frappe.whitelist()
def get_bundle_availability(bundle_item_code, warehouse):
    if not frappe.db.exists("Product Bundle", {"name": bundle_item_code, "disabled": 0}):
        return 0
    product_bundle = frappe.get_doc("Product Bundle", bundle_item_code)
    bundle_bin_qty = 9999999999
    for component in product_bundle.items:
        component_bin_qty = get_bin_qty(component.item_code, warehouse)
        component_reserved_qty = get_pos_reserved_qty(component.item_code, warehouse)
        component_available = component_bin_qty - component_reserved_qty
        possible_bundles = flt(component_available / component.qty)
        if possible_bundles < bundle_bin_qty:
            bundle_bin_qty = possible_bundles
    bundle_reserved_qty = get_pos_reserved_qty(bundle_item_code, warehouse)
    final_bundle_availability = bundle_bin_qty - bundle_reserved_qty
    return final_bundle_availability if final_bundle_availability > 0 else 0

@frappe.whitelist()
def get_stock_availability(item_code, warehouse):
    is_stock_item = frappe.db.get_value("Item", item_code, "is_stock_item") or 0
    if not is_stock_item:
        return (0, False)
    if frappe.db.exists("Product Bundle", {"name": item_code, "disabled": 0}):
        return (get_bundle_availability(item_code, warehouse), True)
    bin_qty = get_bin_qty(item_code, warehouse)
    reserved_qty = get_pos_reserved_qty(item_code, warehouse)
    available = bin_qty - reserved_qty
    return (available, True)

@frappe.whitelist()
def get_accurate_stock(warehouse):
    bins = frappe.get_all("Bin", filters={"warehouse": warehouse}, fields=["item_code", "actual_qty"])
    stock_map = {}
    for bin_doc in bins:
        item_code = bin_doc.item_code
        available_stock, _ = get_stock_availability(item_code, warehouse)
        stock_map[item_code] = available_stock
    return stock_map
    
@frappe.whitelist()
def get_sales_taxes_and_charges_details(template_name):
    """
    Returns a list of dicts with {type, account_head, tax_rate} 
    from the Sales Taxes and Charges child table of the given template.
    """
    if not template_name:
        return []

    doc = frappe.get_doc("Sales Taxes and Charges Template", template_name)
    # doc.taxes is the child table "Sales Taxes and Charges"
    tax_rules = []
    for row in doc.taxes:
        tax_rules.append({
            "type": row.get("charge_type"),
            "account_head": row.get("account_head"),
            "tax_rate": row.get("rate"),
            "description": row.get("description") or row.get("account_head")
        })

    return tax_rules
    
    
import frappe
import requests
import os
from urllib.parse import urlparse

@frappe.whitelist(allow_guest=True)
def proxy_image(url):
    """
    Fetch an image from a URL and return it directly to the browser.
    """
    import mimetypes
    from werkzeug.wrappers import Response

    allowed_domains = ['bigbasket.com','images.pexels.com']
    parsed = urlparse(url)

    if not any(domain in parsed.netloc for domain in allowed_domains):
        frappe.throw("Domain not allowed")

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, stream=True, headers=headers)

        if response.status_code != 200:
            frappe.throw(f"Image not found. Status Code: {response.status_code}")

        content_type = response.headers.get('Content-Type', mimetypes.guess_type(url)[0])
        return Response(response.content, content_type=content_type)

    except Exception as e:
        frappe.logger().error(f"Error proxying image: {str(e)}")
        frappe.throw(str(e))
