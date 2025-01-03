import frappe

def execute():
    # Ensure that the ERPNext setup has been completed by checking if any company exists
    company_name, company_abbr = create_or_get_company("White Rays Technology")  # Using full name
    
    if company_name:
        # The ERPNext setup has been completed, so we can create the POS Profile
        create_pos_profile(company_name, company_abbr)

def generate_abbr(company_name):
    """Generate abbreviation from the company name."""
    # Take the first letter of each word in the company name to form the abbreviation
    abbr = ''.join(word[0].upper() for word in company_name.split() if word)
    return abbr

def create_or_get_company(company_name="White Rays Technology"):
    """Create or fetch the company"""
    
    # Check if any company exists in the system
    existing_companies = frappe.get_all("Company", fields=["name", "abbr"], limit=1)
    
    if existing_companies:
        # If any company exists, use the first existing company's name and abbreviation
        company_name = existing_companies[0]["name"]
        company_abbr = existing_companies[0]["abbr"]
        print(f"Using existing company: {company_name} with abbreviation: {company_abbr}")
    else:
        # If no company exists, create a new company with the default name and abbreviation
        company_abbr = generate_abbr(company_name)  # Generate abbreviation dynamically from the company name
        
        company = frappe.get_doc({
            "doctype": "Company",
            "company_name": company_name,
            "abbr": company_abbr,  # Use dynamically generated abbreviation
            "country": "India",
            "currency": "INR",
            "default_currency": "INR",
            "fiscal_year_start_date": "2024-04-01",
        })
        company.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"Created Company: {company_name} with abbreviation: {company_abbr}")
    
    return company_name, company_abbr  # Return both name and abbreviation

def create_pos_profile(company_name, company_abbr):
    """Function to create POS Profile if it doesn't exist."""
    formatted_company_name = company_name.replace(" ", "")
    warehouse_name = f"Stores - {company_abbr}"
    pos_profile_name = f"{company_abbr} POS Profile"
    
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
