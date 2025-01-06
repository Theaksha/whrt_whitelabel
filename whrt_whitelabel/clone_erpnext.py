# whrt_whitelabel/clone_erpnext.py

import subprocess
import os

def clone_erpnext():
    bench_root = os.getenv("BENCH_REPO")
    if not bench_root:
        print("Warning: BENCH_REPO environment variable is not set, falling back to parent directory.")
        bench_root = os.path.abspath(os.path.join(os.getcwd(), ".."))  # Fallback to parent directory if BENCH_REPO is not set

    if not bench_root:
        raise ValueError("Could not determine the bench root directory.")
    
    erpnext_repo_url = "https://github.com/frappe/erpnext.git"
    erpnext_path = os.path.join(bench_root, "apps", "erpnext")
    
    if not os.path.exists(erpnext_path):
        print("ERPNext not found in bench apps. Cloning ERPNext from GitHub...")
        
        try:
            subprocess.check_call(
                ['git', 'clone', erpnext_repo_url, erpnext_path],
                env=os.environ
            )
            print("ERPNext cloned successfully from GitHub.")
        except subprocess.CalledProcessError as e:
            print(f"Error while cloning ERPNext: {e}")
            return
    else:
        print("ERPNext is already present.")
