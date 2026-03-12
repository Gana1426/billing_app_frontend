import os
import shutil
import re

ROOT_DIR = r"c:\yoburaj\billing_app_frontend"
SRC_DIR = os.path.join(ROOT_DIR, "src")

# Create directories
dirs_to_make = [
    "components", "screens", "navigation", "database", "services", "hooks", "utils", "constants", "context"
]

if not os.path.exists(SRC_DIR):
    os.makedirs(SRC_DIR)

for d in dirs_to_make:
    p = os.path.join(SRC_DIR, d)
    if not os.path.exists(p):
        os.makedirs(p)

move_mappings = {
    "components": "components",
    "constants": "constants",
    "context": "context",
    "db": "database",
    "hooks": "hooks",
    "services": "services",
    "utils": "utils"
}

for old, new_dir in move_mappings.items():
    old_path = os.path.join(ROOT_DIR, old)
    new_path = os.path.join(SRC_DIR, new_dir)
    if os.path.exists(old_path):
        if os.path.exists(new_path) and len(os.listdir(new_path)) == 0:
            os.rmdir(new_path)
        print(f"Moving {old_path} to {new_path}")
        shutil.move(old_path, new_path)

# Ensure app directory is using src imports
# Since we moved db->database, we need to fix relative imports.
# In a large codebase, using absolute imports mapped to src (e.g. `@/src/`) is the best way.

# First update tsconfig.json
tsconfig_path = os.path.join(ROOT_DIR, "tsconfig.json")
with open(tsconfig_path, "r") as f:
    ts_content = f.read()

ts_content = ts_content.replace('"@/*": [\n        "./*"\n      ]', '"@/*": [\n        "./src/*"\n      ]')
with open(tsconfig_path, "w") as f:
    f.write(ts_content)

print("Structure reorganized successfully.")
