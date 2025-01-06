from __future__ import unicode_literals
from . import __version__ as app_version
from . import __logo__ as app_logo
import frappe
from frappe.utils import now
import subprocess
import sys
import os
from whrt_whitelabel.clone_erpnext import clone_erpnext

app_name = "whrt_whitelabel"
app_title = "Whrt Whitelabel"
app_publisher = "WhiteRaysTechnology"
app_description = "Whrt Whitelabel"
app_email = "akshaymaske517@gmail.com"
app_license = "mit"
app_logo_url = '/assets/whrt_whitelabel/images/login_logo.jpg'


entry_points={
        'bench.commands': [
            'get-app = whrt_whitelabel.commands.get_app:get_app',
        ],
    },

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "whrt_whitelabel",
# 		"logo": "/assets/whrt_whitelabel/logo.png",
# 		"title": "Whrt Whitelabel",
# 		"route": "/whrt_whitelabel",
# 		"has_permission": "whrt_whitelabel.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/whrt_whitelabel/css/whrt_whitelabel.css"
app_include_js = "/assets/whrt_whitelabel/js/whrt_whitelabel.js"
     # Corrected to include both JS files



# include js, css files in header of web template
# web_include_css = "/assets/whrt_whitelabel/css/whrt_whitelabel.css"
# web_include_js = "/assets/whrt_whitelabel/js/whrt_whitelabel.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "whrt_whitelabel/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "whrt_whitelabel/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"


# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }
website_context = {
    "favicon": frappe.db.get_single_value('Navbar Settings', 'app_logo') or "/assets/whrt_whitelabel/images/login_logo.jpg",
    "splash_image": frappe.db.get_single_value('Navbar Settings', 'app_logo') or "/assets/whrt_whitelabel/images/login_logo.jpg"
}


after_migrate = ['whrt_whitelabel.api.whitelabel_patch',
				'whrt_whitelabel.create_pos_profile_patch.execute']


on_session_creation = "whrt_whitelabel.api.custom_on_session_creation"

# your_custom_app_name/hooks.py
'''scheduler_events = {
    "all": [
        "whrt_whitelabel.tasks.check_if_setup_completed"
    ]
}'''
setup_wizard_complete = "whrt_whitelabel.tasks.check_if_setup_completed"



# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]
#override_whitelisted_methods = {
    #"frappe.desk.page.setup_wizard.setup_wizard.setup_demo": "whrt_whitelabel.whrt_whitelabel.demo_data.generate_demo_data"
#}

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "whrt_whitelabel.utils.jinja_methods",
# 	"filters": "whrt_whitelabel.utils.jinja_filters"
# }

# Installation
# ------------
# Ensure `tqdm` is installed before installation



'''def install_erpnext():
    site = frappe.local.site

    # Get the bench root directory dynamically (assuming the script is run from within the bench environment)
    bench_root = os.getenv("BENCH_REPO")
    if not bench_root:
        print("Warning: BENCH_REPO environment variable is not set, falling back to parent directory.")
        bench_root = os.path.abspath(os.path.join(os.getcwd(), ".."))  # Fallback to parent directory if BENCH_REPO is not set
    
    if not bench_root:
        raise ValueError("Could not determine the bench root directory.")

    site_path = frappe.get_site_path()  # This is the path for the current site
    if not site_path:
        raise ValueError("Failed to get site path. Ensure the frappe site is correctly set up.")
    
    lock_path = os.path.join(site_path, "locks", "install_app.lock")
    erpnext_repo_url = "https://github.com/frappe/erpnext.git"

    # Check if ERPNext is already installed
    if "erpnext" in frappe.get_installed_apps():
        print("ERPNext is already installed for this site.")
    else:
        print("ERPNext is not installed for this site. Installing ERPNext...")

        # Remove the lock file if it exists
        if os.path.exists(lock_path):
            print(f"Lock file found at {lock_path}, removing it...")
            os.remove(lock_path)

        # Check if ERPNext is in the apps directory (dynamic path)
        erpnext_path = os.path.join(bench_root, "apps", "erpnext")
        if not os.path.exists(erpnext_path):
            print("ERPNext not found in bench apps. Cloning ERPNext from GitHub...")

            try:
                # Clone ERPNext repository from GitHub
                subprocess.check_call(
                    ['git', 'clone', erpnext_repo_url, erpnext_path],
                    env=os.environ
                )
                print("ERPNext cloned successfully from GitHub.")
            except subprocess.CalledProcessError as e:
                print(f"Error while cloning ERPNext: {e}")
                return

            # Install ERPNext dependencies
            try:
                print("Installing ERPNext dependencies...")
                requirements_path = os.path.join(erpnext_path, "requirements.txt")
                print(f"Installing from {requirements_path}")
                subprocess.check_call(
                    [os.path.join(erpnext_path), "install", "-r", requirements_path],
                    env=os.environ
                )
                print("ERPNext dependencies installed successfully.")
            except subprocess.CalledProcessError as e:
                print(f"Error while installing ERPNext dependencies: {e}")
                return

        # Install ERPNext for the site (dynamic path for bench executable)
        try:
            print(f"Running bench install-app for site: {site}...")
            subprocess.check_call(
                ['bench', '--site', site, 'install-app', 'erpnext'],
                env=os.environ  # Pass the environment to the subprocess
            )
            print("ERPNext installed successfully via bench.")
        except subprocess.CalledProcessError as e:
            print(f"Error while installing ERPNext via bench: {e}")
            return

    print("ERPNext installation process complete.")'''

def before_get_app():
    clone_erpnext()
    print("ERPNext clone check completed.")

def ensure_tqdm_installed():
    print("Ensuring tqdm is installed...")
    try:
        import tqdm  # noqa
    except ImportError:
        print("tqdm not found. Installing tqdm...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tqdm"])
        print("Installed `tqdm` successfully.")
    else:
        print("tqdm is already installed.")

# Installation
# Runs before the app is installed
before_install = [
    "whrt_whitelabel.hooks.ensure_tqdm_installed",
    #"whrt_whitelabel.hooks.install_erpnext",
]


# before_install = "whrt_whitelabel.install.before_install"
# after_install = "whrt_whitelabel.install.after_install"
after_install = [
    "whrt_whitelabel.install.setup_login_page",  # First function    
    "whrt_whitelabel.install.load_demo_data",
    
	
    
    
        # Second function
]

# Uninstallation
# ------------

# before_uninstall = "whrt_whitelabel.uninstall.before_uninstall"
# after_uninstall = "whrt_whitelabel.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "whrt_whitelabel.utils.before_app_install"
# after_app_install = "whrt_whitelabel.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "whrt_whitelabel.utils.before_app_uninstall"
# after_app_uninstall = "whrt_whitelabel.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "whrt_whitelabel.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }
override_whitelisted_methods = {
    "erpnext.setup.setup_wizard.get_setup_stages": "whrt_whitelabel.api.get_custom_setup_stages"
}
# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }
doc_events = {
    "Whitelabel Settings": {
        "on_update": "whrt_whitelabel.utils.apply_whitelabel_settings"
    },
    
}


# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"whrt_whitelabel.tasks.all"
# 	],
# 	"daily": [
# 		"whrt_whitelabel.tasks.daily"
# 	],
# 	"hourly": [
# 		"whrt_whitelabel.tasks.hourly"
# 	],
# 	"weekly": [
# 		"whrt_whitelabel.tasks.weekly"
# 	],
# 	"monthly": [
# 		"whrt_whitelabel.tasks.monthly"
# 	],
# }
boot_session = "whrt_whitelabel.api.boot_session"
# Testing
# -------

# before_tests = "whrt_whitelabel.install.before_tests"
fixtures = [
    {"dt": "Custom Field", "filters": [["Translation", "source_text", "like", "%ERPNext%"]]},
    "whrt_whitelabel.fixtures.demo_data.csv"  # This points to the fixture files
]

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "whrt_whitelabel.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "whrt_whitelabel.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["whrt_whitelabel.utils.before_request"]
# after_request = ["whrt_whitelabel.utils.after_request"]

# Job Events
# ----------
# before_job = ["whrt_whitelabel.utils.before_job"]
# after_job = ["whrt_whitelabel.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"whrt_whitelabel.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

