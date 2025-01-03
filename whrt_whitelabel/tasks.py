import frappe
from frappe.utils.background_jobs import enqueue

def check_if_setup_completed(arg=None):
    """Check if the ERPNext setup wizard is completed."""
    print(f"Argument received: {arg}")
    # Check if the admin user exists (or some other indicator)
    admin_user = frappe.db.get_value('User', {'email': 'admin@example.com'}, 'name')
    
    if admin_user:
        enqueue(run_post_setup_tasks)  # Trigger your post-setup tasks


def run_post_setup_tasks():
    """Custom tasks to run after ERPNext setup wizard is completed."""
    print("Running custom post-setup tasks...")

    company_name, company_abbr = create_or_get_company("White Rays Technology")
    
    if company_name:
        create_pos_profile(company_name, company_abbr)

def generate_abbr(company_name):
    """Generate abbreviation from the company name."""
    abbr = ''.join(word[0].upper() for word in company_name.split() if word)
    return abbr

def create_or_get_company(company_name="White Rays Technology"):
    """Create or fetch the company"""
    existing_companies = frappe.get_all("Company", fields=["name", "abbr"], limit=1)
    
    if existing_companies:
        company_name = existing_companies[0]["name"]
        company_abbr = existing_companies[0]["abbr"]
        print(f"Using existing company: {company_name} with abbreviation: {company_abbr}")
    else:
        company_abbr = generate_abbr(company_name)
        company = frappe.get_doc({
            "doctype": "Company",
            "company_name": company_name,
            "abbr": company_abbr,
            "country": "India",
            "currency": "INR",
            "default_currency": "INR",
            "fiscal_year_start_date": "2024-04-01",
        })
        company.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Company: {company_name} with abbreviation: {company_abbr}")
    
    return company_name, company_abbr

def create_pos_profile(company_name, company_abbr):
    """Function to create POS Profile if it doesn't exist."""
    formatted_company_name = company_name.replace(" ", "")
    warehouse_name = f"Stores - {company_abbr}"
    pos_profile_name = f"{company_abbr} POS Profile"
    
    if not frappe.db.exists("POS Profile", pos_profile_name):
        try:
            pos_profile = frappe.get_doc({
                "doctype": "POS Profile",
                "company": company_name,
                "warehouse": warehouse_name,
                "name": pos_profile_name,
                "currency": "INR",
                "selling_price_list": "Standard Selling",
                "default_branch": "Main",
                "write_off_account": f"Cost of Goods Sold - {company_abbr}",
                "write_off_cost_center": f"Main - {company_abbr}",
                "payments": [
                    {
                        'mode_of_payment': 'Cash',
                        'default': 1,
                        'account': f"Cash - {company_abbr}"
                    }
                ]
            })
            pos_profile.insert()
            frappe.db.commit()
            print(f"Created POS Profile: {pos_profile_name}")
        except Exception as e:
            print(f"Error creating POS Profile {pos_profile_name}: {e}")
