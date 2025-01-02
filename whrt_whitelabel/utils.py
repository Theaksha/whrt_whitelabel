import frappe

def apply_whitelabel_settings():
    # Assuming there's only one settings record
    whitelabel_settings = frappe.get_doc("Whitelabel Settings", 1)

    # Apply logos, favicon, and splash image
    frappe.local.site_config.update({
        "brand_logo": whitelabel_settings.logo,
        "favicon": whitelabel_settings.favicon,
        "splash_image": whitelabel_settings.splash_image
    })

    # Set navbar color and title
    if whitelabel_settings.navbar_color:
        frappe.local.site_config["navbar_color"] = whitelabel_settings.navbar_color
    if whitelabel_settings.navbar_title:
        frappe.local.site_config["navbar_title"] = whitelabel_settings.navbar_title

    # Hide help menu and remove "Powered By"
    if whitelabel_settings.hide_help_menu:
        frappe.local.site_config["hide_help_menu"] = True
    if whitelabel_settings.remove_powered_by:
        frappe.local.site_config["remove_powered_by"] = True

    # Disable onboarding and update popups
    if whitelabel_settings.disable_onboarding:
        frappe.local.site_config["disable_onboarding"] = True
    if whitelabel_settings.disable_update_popup:
        frappe.local.site_config["disable_update_popup"] = True
