# Copyright (c) 2024, WhiteRaysTechnology and contributors
# For license information, please see license.txt

# import frappe
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.installer import update_site_config

class WhitelabelSetting(Document):
    def validate(self):
        system_settings_doc = frappe.get_doc("System Settings", "System Settings")
        navbar_settings_doc = frappe.get_doc("Navbar Settings", "Navbar Settings")
        website_doc = frappe.get_doc("Website Settings", "Website Settings")
        
        self.set_app_name(system_settings_doc)
        self.set_theme_attr(navbar_settings_doc, website_doc)
        self.disable_onboarding(system_settings_doc)
        self.set_log_notification(system_settings_doc)
        self.set_footer(system_settings_doc)
        
        system_settings_doc.save(ignore_permissions=True)
        navbar_settings_doc.save(ignore_permissions=True)
        website_doc.save(ignore_permissions=True)

    def set_app_name(self, system_settings_doc):    
        if self.whitelabel_app_name:
            system_settings_doc.app_name = self.whitelabel_app_name
        else:
            if "erpnext" in frappe.get_installed_apps():
                system_settings_doc.app_name = "ERPNext"
            else:
                system_settings_doc.app_name = "Frappe"

    def set_theme_attr(self, navbar_settings_doc, website_doc):
        if self.application_logo:
            # Set the logo for both Navbar and Website
            navbar_settings_doc.app_logo = self.application_logo
            website_doc.app_logo = self.application_logo
            website_doc.splash_image = self.application_logo
            
            # Update the site configuration
            update_site_config("app_logo_url", self.application_logo)

            # Clear cache to ensure the new logo is reflected
            frappe.local.conf.whitelabel_logo = self.application_logo
            frappe.clear_cache()

            # Reload Website Settings to ensure changes are applied
            frappe.local.flags.in_test = True  # Avoid some cache-related issues
            frappe.reload_doc("Website", "settings", "Website Settings")
            
            # Ensure the logo is available on the login page
            frappe.local.conf.whitelabel_logo = self.application_logo
        else:
            # Remove logos if no logo is set
            navbar_settings_doc.app_logo = ""
            website_doc.app_logo = ""
            website_doc.splash_image = ""
            update_site_config("app_logo_url", False)

            # Clear cache
            frappe.clear_cache()

    def disable_onboarding(self, system_settings_doc):
        # Disable the onboarding process if the flag is set
        if self.ignore_onboard_whitelabel == 1:
            system_settings_doc.enable_onboarding = 0
        else:
            system_settings_doc.enable_onboarding = 1

    def set_log_notification(self, system_settings_doc):
        # Disable system update notifications if the flag is set
        system_settings_doc.disable_system_update_notification = self.disable_new_update_popup
        system_settings_doc.disable_change_log_notification = self.disable_new_update_popup

    def set_footer(self, system_settings_doc):
        # Set the email footer settings based on the configuration
        system_settings_doc.email_footer_address = self.email_footer_address
        system_settings_doc.disable_standard_email_footer = self.disable_standard_footer
        system_settings_doc.hide_footer_in_auto_email_reports = self.disable_standard_footer
