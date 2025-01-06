# whrt_whitelabel/custom_bench.py

import subprocess
import sys
import os
from whrt_whitelabel.clone_erpnext import clone_erpnext

def custom_get_app():
    # First, clone ERPNext if it isn't already cloned
    clone_erpnext()

    # Now run the normal `get-app` process
    if len(sys.argv) < 2:
        print("Usage: bench get-app <app-name>")
        sys.exit(1)

    app_name = sys.argv[1]

    bench_root = os.getenv("BENCH_REPO")
    if not bench_root:
        print("Error: BENCH_REPO environment variable not set.")
        sys.exit(1)

    app_path = os.path.join(bench_root, "apps", app_name)

    if not os.path.exists(app_path):
        print(f"Cloning app {app_name}...")
        subprocess.check_call(["git", "clone", f"https://github.com/{app_name}/{app_name}.git", app_path])
    else:
        print(f"App {app_name} is already cloned.")
