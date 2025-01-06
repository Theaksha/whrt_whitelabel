# whrt_whitelabel/commands/get_app.py

import click
from whrt_whitelabel.custom_bench import custom_get_app

@click.command('get-app')
@click.argument('app_name')
def get_app(app_name):
    """Custom get-app command that clones ERPNext if not already cloned."""
    custom_get_app()
    print(f"Finished getting the app: {app_name}")
