# whrt_whitelabel/commands/get_app.py

import click
import os
import subprocess

@click.command('get-app')
@click.argument('app_name')
def get_app(app_name):
    """Clones ERPNext along with the app if not already present."""
    print(f"Cloning app: {app_name}")
    
    # Clone the main app first
    subprocess.run(["git", "clone", app_name])
    
    # Now check if ERPNext is already present
    if not os.path.exists('apps/erpnext'):
        print("Cloning ERPNext...")
        subprocess.run(["git", "clone", "https://github.com/frappe/erpnext", "apps/erpnext"])
    else:
        print("ERPNext already cloned.")
