import frappe

def execute():
    # Ensure that the ERPNext setup has been completed by checking if a company exists
    
    company_name = create_or_get_company("WHRT")
    
    
    if company_name:
        # The ERPNext setup has been completed, so we can create the POS Profile
        create_pos_profile(company_name)
        
        
def create_or_get_company(default_company_name="WHRT"):
    """Create or fetch the company"""
    
    formatted_company_name = default_company_name.replace(" ", "")  # Removes spaces
    existing_companies = frappe.get_all("Company", fields=["name"], limit=1)
    
    if existing_companies:
        company_name = existing_companies[0]["name"]
        
        
    else:
        company = frappe.get_doc({
            "doctype": "Company",
            "company_name": formatted_company_name,
            "abbr": formatted_company_name[:3],
            "country": "India",
            "currency": "INR",
            "default_currency": "INR",
            "fiscal_year_start_date": "2024-04-01",
        })
        company.insert(ignore_permissions=True)
        frappe.db.commit()
        company_name = company.name
        print(f"Created Company: {company_name}")
    
    return company_name

def create_pos_profile(company_name):
    """Function to create POS Profile if it doesn't exist."""
        
    formatted_company_name = company_name.replace(" ", "")
    warehouse_name = f"Stores - {formatted_company_name}"
    pos_profile_name = f"{formatted_company_name} POS Profile"

    

    # Ensure POS Profile exists
    if not frappe.db.exists("POS Profile", pos_profile_name):
        try:
            pos_profile = frappe.get_doc({
                "doctype": "POS Profile",
                "company": company_name,
                "warehouse": warehouse_name,
                "name": pos_profile_name,
                "currency": "INR",  # Adjust this as per your needs
                "selling_price_list": "Standard Selling",  # Adjust as per your needs
                "default_branch": "Main",  # Adjust as per your needs
                "write_off_account": f"Cost of Goods Sold - {formatted_company_name}",
                "write_off_cost_center": f"Main - {formatted_company_name}",
                "payments": [
                    {
                        'mode_of_payment': 'Cash',
                        'default': 1,
                        'account': f"Cash - {formatted_company_name}"
                    }
                ]
            })
            pos_profile.insert()
            frappe.db.commit()
            print(f"Created POS Profile: {pos_profile_name}")
        except Exception as e:
            print(f"Error creating POS Profile {pos_profile_name}: {e}")

