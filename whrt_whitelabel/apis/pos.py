import frappe
import json
from frappe import _
from frappe.utils import nowdate, now_datetime
from frappe.utils.pdf import get_pdf



def get_context(context):
    # Required for Frappe to treat this as a valid page controller
    return {}

# -------------------------------
# POS PROFILE UTILITIES
# -------------------------------

@frappe.whitelist()
def get_pos_profiles():
	user = frappe.session.user
	pos_profile = frappe.db.get_value("POS Profile", {"owner": user}, "name")
	return {"name": pos_profile} if pos_profile else []

@frappe.whitelist()
def get_pos_profiles_for_company(company):
	return frappe.get_all("POS Profile", filters={"company": company}, fields=["name"])

# Ensure your get_pos_profile_details method returns proper payment methods
@frappe.whitelist()
def get_pos_profile_details(pos_profile):
    profile = frappe.get_doc("POS Profile", pos_profile)

    payment_methods = []
    for method in profile.payments:
        payment_methods.append({
            "mode_of_payment": method.mode_of_payment,
            "default": method.default
        })

    if not payment_methods:
        frappe.throw("No payment methods configured for this POS Profile")

    # ✅ Handle item groups fallback
    item_groups = [{"name": ig.item_group} for ig in profile.item_groups]
    if not item_groups:
        # Get all non-group item groups
        item_groups = [{"name": name} for name in frappe.get_all(
            "Item Group",
            #filters={"is_group": 0},
            pluck="name"
        )]

    return {
        "payment_methods": payment_methods,
        "tax_template": profile.taxes_and_charges or "",
        "warehouse": profile.warehouse or "",
        "item_groups": item_groups,
        "currency": profile.currency or frappe.defaults.get_global_default("currency")
    }
@frappe.whitelist()
def validate_pos_profile(profile_name):
    """Check if the POS profile is still valid for the user"""
    if not profile_name:
        return {"valid": False}
    
    try:
        # Check if profile exists
        if not frappe.db.exists("POS Profile", profile_name):
            return {"valid": False}
            
        profile = frappe.get_doc("POS Profile", profile_name)
        companies = get_user_companies()  # Use your existing get_user_companies method
        
        # Check if profile belongs to one of user's companies
        valid = any(c['name'] == profile.company for c in companies)
        return {"valid": valid}
    except Exception:
        return {"valid": False}

@frappe.whitelist()
def get_user_companies():
	return frappe.get_all("Company", fields=["name"])

@frappe.whitelist()
def get_item_groups(search_term=""):
	try:
		filters = {"name": ["like", f"%{search_term}%"]} if search_term else {}
		return {"item_groups": frappe.get_all("Item Group", fields=["name", "parent_item_group", "is_group"], filters=filters)}
	except Exception as e:
		frappe.log_error(f"Item Group Error: {str(e)}")
		return {"error": str(e)}

@frappe.whitelist()
def get_item_groups_for_pos_profile(pos_profile):
	try:
		rows = frappe.get_all("POS Item Group", filters={"parent": pos_profile}, fields=["item_group"])
		return {"item_groups": [r.item_group for r in rows]}
	except Exception as e:
		frappe.log_error(f"POS Item Group Error: {str(e)}")
		return {"error": str(e)}

# -------------------------------
# ITEM SEARCH & PRICE UTILITIES
# -------------------------------

import frappe
from frappe.utils import flt
from frappe import _
from frappe.model.document import Document


@frappe.whitelist(allow_guest=True)
def get_items(start=0, page_length=30, pos_profile=None, item_group="", search_term=""):
    try:
        # Validate POS Profile
        if not pos_profile or not frappe.db.exists("POS Profile", pos_profile):
            frappe.throw("POS Profile is required and must be valid")

        # Get POS Profile details
        pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
        warehouse = pos_profile_doc.warehouse
        price_list = pos_profile_doc.selling_price_list or "Standard Selling"

        filters = {"disabled": 0}
        if item_group:
            filters["item_group"] = item_group
        if search_term:
            filters["item_name"] = ["like", f"%{search_term}%"]

        items = frappe.get_all(
            "Item",
            fields=[
                "item_code",
                "item_name",
                "image",
                "stock_uom",
                "valuation_rate",
                "is_stock_item"
            ],
            filters=filters,
            limit_start=start,
            limit_page_length=page_length
        )

        # Prepare availability dictionary
        item_availability = {}

        for item in items:
            if item.is_stock_item:
                available_qty = _get_stock_availability(item.item_code, warehouse)
                item_availability[item.item_code] = available_qty
            elif frappe.db.exists("Product Bundle", {"name": item.item_code, "disabled": 0}):
                available_qty = get_bundle_availability(item.item_code, warehouse)
                item_availability[item.item_code] = available_qty
            else:
                item_availability[item.item_code] = None

        total_count = frappe.db.count("Item", filters=filters)

        return {
            "items": [
                {
                    "item_code": i.item_code,
                    "item_name": i.item_name,
                    "image": i.image or "/assets/frappe/images/defaults/item.png",
                    "stock_uom": i.stock_uom,
                    "valuation_rate": i.valuation_rate,
                    "actual_qty": item_availability.get(i.item_code),
                    "is_stock_item": i.is_stock_item
                }
                for i in items
            ],
            "total_count": total_count,
            "has_more": len(items) == page_length
        }
    except Exception as e:
        frappe.log_error(f"Item Fetch Error: {str(e)}")
        return {"error": str(e)}

def _get_stock_availability(item_code, warehouse):
    """Internal helper: Get available stock quantity for an item in warehouse."""
    if frappe.db.get_value("Item", item_code, "is_stock_item"):
        bin_qty = get_bin_qty(item_code, warehouse)
        pos_sales_qty = get_pos_reserved_qty(item_code, warehouse)
        return bin_qty - pos_sales_qty
    elif frappe.db.exists("Product Bundle", {"name": item_code, "disabled": 0}):
        return get_bundle_availability(item_code, warehouse)
    else:
        return None

def get_bundle_availability(bundle_item_code, warehouse):
    """Calculate availability for a product bundle based on components."""
    product_bundle = frappe.get_doc("Product Bundle", bundle_item_code)
    bundle_bin_qty = 1000000  # arbitrarily large number to find min availability
    
    for item in product_bundle.items:
        item_bin_qty = get_bin_qty(item.item_code, warehouse)
        item_pos_reserved_qty = get_pos_reserved_qty(item.item_code, warehouse)
        available_qty = item_bin_qty - item_pos_reserved_qty

        max_available_bundles = available_qty / item.qty if item.qty else 0
        if max_available_bundles < bundle_bin_qty and frappe.db.get_value("Item", item.item_code, "is_stock_item"):
            bundle_bin_qty = max_available_bundles

    pos_sales_qty = get_pos_reserved_qty(bundle_item_code, warehouse)
    return bundle_bin_qty - pos_sales_qty

def get_bin_qty(item_code, warehouse):
    """Get actual quantity from Bin table."""
    bin_qty = frappe.db.sql(
        """select actual_qty from `tabBin`
        where item_code = %s and warehouse = %s
        limit 1""",
        (item_code, warehouse),
        as_dict=1,
    )
    return bin_qty[0].actual_qty or 0 if bin_qty else 0

def get_pos_reserved_qty(item_code, warehouse):
    query = """
        SELECT SUM(pii.stock_qty) as stock_qty
        FROM `tabPOS Invoice` pi
        JOIN `tabPOS Invoice Item` pii ON pi.name = pii.parent
        WHERE (IFNULL(pi.consolidated_invoice, '') = '')
        AND pii.docstatus = 1
        AND pii.item_code = %s
        AND pii.warehouse = %s
    """
    result = frappe.db.sql(query, (item_code, warehouse), as_dict=True)
    if result and result[0].stock_qty:
        return flt(result[0].stock_qty)
    return 0



@frappe.whitelist()
def search_item_by_term(search_term, warehouse=None, price_list="Standard Selling"):
    try:
        result = frappe.call("erpnext.stock.doctype.batch.batch.scan_barcode", search_term) or {}
        item_code = result.get("item_code", search_term)
        item_doc = frappe.get_doc("Item", item_code)

        # Get warehouse from POS Profile if not provided
        if not warehouse and price_list:
            warehouse = frappe.db.get_value("POS Profile", price_list, "warehouse")

        item = {
            "item_code": item_doc.name,
            "item_name": item_doc.item_name,
            "description": item_doc.description,
            "is_stock_item": item_doc.is_stock_item,
            "item_group": item_doc.item_group,
            "stock_uom": item_doc.stock_uom,
            "uom": item_doc.stock_uom,
            "image": item_doc.image or "/assets/frappe/images/defaults/item.png",
            "serial_no": result.get("serial_no"),
            "batch_no": result.get("batch_no"),
            "barcode": result.get("barcode")
        }

        if warehouse and item_doc.is_stock_item:
            actual_qty = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty") or 0
            item["actual_qty"] = actual_qty

        price_filters = {"price_list": price_list, "item_code": item_code}
        if item["batch_no"]:
            price_filters["batch_no"] = ["in", [item["batch_no"], ""]]

        prices = frappe.get_all("Item Price", filters=price_filters, fields=["uom", "currency", "price_list_rate"])
        if prices:
            p = prices[0]
            item.update({"price_list_rate": p.price_list_rate, "currency": p.currency})

        return {"item": item}
    except Exception as e:
        frappe.log_error(f"Search Item Error: {str(e)}")
        return {"error": str(e)}


@frappe.whitelist()
def get_stock_info(item_code, warehouse):
    """Whitelisted API: Return stock info for item and warehouse."""
    try:
        qty = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty") or 0
        return {"item_code": item_code, "warehouse": warehouse, "actual_qty": qty}
    except Exception as e:
        frappe.log_error(f"Stock Check Error: {str(e)}")
        return {"error": str(e)}


@frappe.whitelist()
def get_item_price(item_code, price_list="Standard Selling", uom=None):
    try:
        filters = {"item_code": item_code, "price_list": price_list}
        if uom:
            filters["uom"] = uom
        price = frappe.get_all("Item Price", filters=filters, fields=["price_list_rate", "currency"], limit=1)
        return price[0] if price else {"message": "No price found"}
    except Exception as e:
        frappe.log_error(f"Price Fetch Error: {str(e)}")
        return {"error": str(e)}

# -------------------------------
# POS INVOICE & PAYMENT
# -------------------------------

@frappe.whitelist()
def create_invoice(cart, customer, pos_profile, payments, taxes_and_charges=None):
	try:
		cart = json.loads(cart)
		payments = json.loads(payments)

		if not cart: frappe.throw("Cart is empty.")
		if not customer: frappe.throw("Customer is required.")
		if not pos_profile: frappe.throw("POS Profile is required.")

		warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
		if not warehouse: frappe.throw("No warehouse linked to POS Profile.")

		doc = frappe.new_doc("POS Invoice")
		doc.customer = customer
		doc.posting_date = nowdate()
		doc.set_posting_time = 1
		doc.is_pos = 1
		doc.pos_profile = pos_profile
		doc.update_stock = 1
		if taxes_and_charges:
			doc.taxes_and_charges = taxes_and_charges

		for i in cart:
			doc.append("items", {
				"item_code": i["name"],
				"qty": i["quantity"],
				"rate": i["valuation_rate"],
				"amount": i["quantity"] * i["valuation_rate"],
				"warehouse": warehouse,
				"uom": frappe.db.get_value("Item", i["name"], "stock_uom")
			})

		for p in payments:
			doc.append("payments", {
				"mode_of_payment": p["mode_of_payment"],
				"amount": p["amount"]
			})

		doc.run_method("set_missing_values")
		doc.run_method("calculate_taxes_and_totals")
		doc.insert()
		doc.submit()

		return {
			"invoice_id": doc.name,
			"customer": doc.customer,
			"net_total": doc.net_total,
			"grand_total": doc.grand_total,
			"items": [{"item_name": x.item_name, "qty": x.qty, "rate": x.rate} for x in doc.items],
			"payments": [{"mode_of_payment": p.mode_of_payment, "amount": p.amount} for p in doc.payments]
		}
	except Exception as e:
		frappe.log_error(f"Create Invoice Error: {str(e)}")
		return {"error": str(e)}

@frappe.whitelist()
def create_payment_entry(invoice_id, payment_entries):
	try:
		invoice = frappe.get_doc("POS Invoice", invoice_id)
		for entry in json.loads(payment_entries):
			doc = frappe.new_doc("Payment Entry")
			doc.payment_type = "Receive"
			doc.party_type = "Customer"
			doc.party = invoice.customer
			doc.paid_amount = entry["amount"]
			doc.received_amount = entry["amount"]
			doc.mode_of_payment = entry["method"]
			doc.reference_no = invoice.name
			doc.reference_date = nowdate()
			doc.insert()
			doc.submit()
		return {"message": "Payment processed successfully"}
	except Exception as e:
		frappe.log_error(f"Create Payment Entry Error: {str(e)}")
		return {"error": str(e)}

@frappe.whitelist()
def update_invoice_status(invoice_id=None, status=None):
	try:
		if not invoice_id or not status:
			frappe.throw("Missing invoice_id or status")
		doc = frappe.get_doc("POS Invoice", invoice_id)
		doc.status = status
		doc.save()
		frappe.db.commit()
		return {"message": f"Invoice {invoice_id} updated to {status}"}
	except Exception as e:
		frappe.log_error(f"Update Invoice Status Error: {str(e)}")
		return {"error": str(e)}

@frappe.whitelist()
def get_past_orders(search_term="", status="Paid", limit=20):
	try:
		filters = {"status": status}
		if search_term:
			filters["customer"] = ["like", f"%{search_term}%"]
		return {"invoices": frappe.get_all("POS Invoice", filters=filters, fields=["name", "grand_total", "currency", "customer", "posting_date"], limit=limit)}
	except Exception as e:
		frappe.log_error(f"Fetch Past Orders Error: {str(e)}")
		return {"error": str(e)}

# -------------------------------
# CUSTOMER UTILITIES
# -------------------------------

@frappe.whitelist()
def get_customers(search_term=""):
    filters = {"customer_name": ["like", f"%{search_term}%"]} if search_term else {}
    return {
        "customers": frappe.get_all(
            "Customer",
            fields=["name", "customer_name", "mobile_no", "email_id"],
            filters=filters,
            limit=20
        )
    }

@frappe.whitelist()
def create_customer(customer_name, mobile_no=None, email_id=None):
    try:
        doc = frappe.new_doc("Customer")
        doc.customer_name = customer_name
        doc.mobile_no = mobile_no
        doc.email_id = email_id
        doc.customer_group = "Commercial"
        doc.territory = "India"
        doc.insert(ignore_permissions=True)
        return {"name": doc.name, "customer_name": doc.customer_name}
    except Exception as e:
        frappe.log_error(f"Customer Create Error: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist()
def set_customer_field(customer, fieldname, value):
    try:
        if fieldname not in ["mobile_no", "email_id", "loyalty_program"]:
            frappe.throw("Invalid field")
        frappe.db.set_value("Customer", customer, fieldname, value)
        return {"message": f"{fieldname} updated for {customer}"}
    except Exception as e:
        frappe.log_error(f"Set Customer Field Error: {str(e)}")
        return {"error": str(e)}
# -------------------------------
# OPENING ENTRY UTILITIES
# -------------------------------

@frappe.whitelist()
def check_opening_entry(user=None):
	try:
		user = user or frappe.session.user
		return frappe.get_all("POS Opening Entry", filters={"user": user, "pos_closing_entry": ["in", ["", None]], "docstatus": 1}, fields=["name", "company", "pos_profile", "period_start_date"], order_by="period_start_date desc")
	except Exception as e:
		frappe.log_error(f"Check Opening Entry Error: {str(e)}")
		return {"error": str(e)}

@frappe.whitelist()
def create_opening_entry(pos_profile, company, balance_details):
	try:
		balance_details = json.loads(balance_details)
		doc = frappe.get_doc({
			"doctype": "POS Opening Entry",
			"user": frappe.session.user,
			"pos_profile": pos_profile,
			"company": company,
			"period_start_date": now_datetime(),
			"posting_date": nowdate(),
			"balance_details": balance_details
		})
		doc.insert()
		doc.submit()
		return doc.as_dict()
	except Exception as e:
		frappe.log_error(f"Create Opening Entry Error: {str(e)}")
		return {"error": str(e)}


@frappe.whitelist()
def print_receipt(invoice_id):
    if not invoice_id:
        return "Missing invoice ID"

    try:
        # Fetch the POS Invoice
        doc = frappe.get_doc("POS Invoice", invoice_id)

        # Render HTML using a specific print format or default
        html = frappe.get_print(
            "POS Invoice",
            invoice_id,
            print_format="POS Invoice" if frappe.db.exists("Print Format", "POS Invoice") else "Standard",
            as_pdf=False,
        )
        return html
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "print_receipt error")
        return f"<pre>{str(e)}</pre>"


@frappe.whitelist()
def get_customer_summary(customer_id):
    if not customer_id:
        return {"error": "Missing customer ID"}

    try:
        customer = frappe.get_doc("Customer", customer_id)

        invoices = frappe.get_all("POS Invoice",
            filters={"customer": customer.name, "docstatus": 1},
            fields=["name", "posting_date", "grand_total", "outstanding_amount"],
            order_by="posting_date desc",
            limit=5
        )

        total_orders = frappe.db.count("POS Invoice", {"customer": customer.name, "docstatus": 1})
        total_spent = sum(inv.grand_total for inv in invoices)
        last_invoice = invoices[0] if invoices else {}

        return {
            "name": customer.name,
            "customer_name": customer.customer_name,
            "total_orders": total_orders,
            "last_invoice": last_invoice,
            "recent_invoices": invoices,
            "outstanding_balance": sum(inv.outstanding_amount for inv in invoices),
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "POS Customer Summary Error")
        return {"error": str(e)}

