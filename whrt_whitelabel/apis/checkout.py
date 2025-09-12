import frappe
from frappe import _
from frappe.utils import nowdate, flt

@frappe.whitelist(allow_guest=False)
def place_order():
    # Ensure user is logged in (Guest check already covered by allow_guest=False)
    
    # Initialize variables to avoid UnboundLocalError if exception thrown early
    billing = {}
    shipping = {}
    cart = []
    data = {}

    try:
        # Force POST request only (avoid GET calls which cause errors)
        if frappe.local.request.method != "POST":
            frappe.throw(_("Invalid request method. Please use POST."))

        # Check if request body is empty
        if not frappe.request.data:
            frappe.throw(_("Request body is empty."))

        data = frappe.request.get_json(force=True)

        billing = frappe._dict(data.get("billing") or {})
        shipping = frappe._dict(data.get("shipping") or {})
        cart = data.get("cart") or []

        # Required billing fields validation
        required_fields = ['fname', 'lname', 'email', 'address1', 'city', 'country']
        missing_fields = [field for field in required_fields if not billing.get(field)]
        if missing_fields:
            frappe.throw(_("Missing required billing fields: {0}").format(", ".join(missing_fields)))

        customer_name = f"{billing.fname} {billing.lname}".strip()
        email = billing.email.strip()

        customer = frappe.db.get_value("Customer", {"email_id": email}, "name")
        if not customer:
            customer_doc = frappe.get_doc({
                "doctype": "Customer",
                "customer_name": customer_name,
                "customer_type": "Individual",
                "email_id": email,
                "mobile_no": billing.get("phone", "")
            })
            customer_doc.insert(ignore_permissions=True)
            customer = customer_doc.name

        company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value("Global Defaults", "default_company")
        warehouse = frappe.db.get_value("Warehouse", {"company": company}, "name")

        same_address = data.get("same_address", True)
        shipping_address_data = billing if same_address else shipping

        billing_address_name = create_address(billing, customer)
        shipping_address_name = create_shipping_address(shipping_address_data, customer)

        if not shipping_address_name:
            frappe.throw(_("Shipping address could not be created."))

        sales_order = frappe.get_doc({
            "doctype": "Sales Order",
            "customer": customer,
            "company": company,
            "delivery_date": nowdate(),
            "transaction_date": nowdate(),
            "items": get_invoice_items(cart, warehouse),
            "taxes": get_taxes(data, company),
            "remarks": shipping.get("notes", ""),
            "customer_address": billing_address_name,
            "shipping_address_name": shipping_address_name,
            "contact_email": email,
            "contact_mobile": billing.get("phone", "")
        })

        # Calculate taxes and totals explicitly to avoid None grand_total
        sales_order.calculate_taxes_and_totals()

        sales_order.insert(ignore_permissions=True)
        sales_order.submit()

        payment_request = frappe.get_doc({
            "doctype": "Payment Request",
            "payment_request_type": "Sale",
            "party_type": "Customer",
            "party": customer,
            "transaction_date": nowdate(),
            "reference_doctype": "Sales Order",
            "reference_name": sales_order.name,
            "currency": "INR",
            "grand_total": sales_order.grand_total,
            "message": "Please complete the payment for your order.",
            "email_to": email,
            "mode_of_payment": "Razorpay"
        })
        payment_request.insert(ignore_permissions=True)
        payment_request.submit()

        return {
            "status": "success",
            "order": sales_order.name,
            "payment_request": payment_request.name,
            "payment_url": payment_request.payment_url
        }

    except Exception:
        frappe.log_error(f"""
Error in place_order()

Billing: {frappe.as_json(billing, indent=2)}
Shipping: {frappe.as_json(shipping, indent=2)}
Cart: {frappe.as_json(cart, indent=2)}
Raw Data: {frappe.request.data}
Traceback:
{frappe.get_traceback()}
""", "Checkout Error")
        frappe.throw(_("Order could not be placed. Please try again."))


def get_invoice_items(cart, warehouse):
    items = []
    for item in cart:
        if not item or not isinstance(item, dict):
            continue
        # Your cart item uses 'code' for item_code
        if not all(k in item for k in ["code", "qty"]):
            continue
        price = frappe.db.get_value("Item Price", {"item_code": item["code"], "selling": 1}, "price_list_rate") or 0
        items.append({
            "item_code": item["code"],
            "qty": flt(item["qty"]),
            "rate": flt(price),
            "warehouse": warehouse
        })
    return items


def get_taxes(data, company):
    taxes = []
    gst_account = frappe.db.get_value("Account", {"account_type": "Tax", "company": company, "is_group": 0}, "name")
    shipping_account = frappe.db.get_value("Account", {"account_name": "Shipping", "company": company, "is_group": 0}, "name")

    if flt(data.get("tax", 0)) > 0 and gst_account:
        taxes.append({
            "charge_type": "Actual",
            "account_head": gst_account,
            "description": "GST",
            "tax_amount": flt(data["tax"])
        })
    if flt(data.get("shipping_cost", 0)) > 0 and shipping_account:
        taxes.append({
            "charge_type": "Actual",
            "account_head": shipping_account,
            "description": "Shipping",
            "tax_amount": flt(data["shipping_cost"])
        })
    return taxes


def create_address(billing, customer):
    address_title = f"{billing.fname} {billing.lname}"
    matches = frappe.get_all("Address", filters={
        "address_line1": billing.address1,
        "email_id": billing.email
    }, fields=["name"])

    for match in matches:
        addr = frappe.get_doc("Address", match.name)
        if any(link.link_doctype == "Customer" and link.link_name == customer for link in addr.links):
            return addr.name

    address = frappe.get_doc({
        "doctype": "Address",
        "address_title": address_title,
        "address_type": "Billing",
        "address_line1": billing.address1,
        "address_line2": billing.get("address2", ""),
        "city": billing.city,
        "state": billing.get("state", ""),
        "country": billing.country,
        "pincode": billing.get("postcode", ""),
        "email_id": billing.email,
        "phone": billing.get("phone", ""),
        "links": [{"link_doctype": "Customer", "link_name": customer}]
    })
    try:
        address.insert(ignore_permissions=True)
        return address.name
    except Exception:
        frappe.log_error(
            f"{frappe.as_json(address.as_dict(), indent=2)}\n\n{frappe.get_traceback()}",
            "Billing Address Creation Failed"
        )
        return None


def create_shipping_address(shipping, customer):
    address_title = f"{shipping.fname} {shipping.lname}"
    matches = frappe.get_all("Address", filters={
        "address_line1": shipping.address1,
        "email_id": shipping.email,
        "address_type": "Shipping"
    }, fields=["name"])

    for match in matches:
        addr = frappe.get_doc("Address", match.name)
        if any(link.link_doctype == "Customer" and link.link_name == customer for link in addr.links):
            return addr.name

    address = frappe.get_doc({
        "doctype": "Address",
        "address_title": address_title,
        "address_type": "Shipping",
        "address_line1": shipping.address1,
        "address_line2": shipping.get("address2", ""),
        "city": shipping.city,
        "state": shipping.get("state", ""),
        "country": shipping.country,
        "pincode": shipping.get("postcode", ""),
        "email_id": shipping.email,
        "phone": shipping.get("phone", ""),
        "links": [{"link_doctype": "Customer", "link_name": customer}]
    })
    try:
        address.insert(ignore_permissions=True)
        return address.name
    except Exception:
        frappe.log_error(
            f"{frappe.as_json(address.as_dict(), indent=2)}\n\n{frappe.get_traceback()}",
            "Shipping Address Creation Failed"
        )
        return None
