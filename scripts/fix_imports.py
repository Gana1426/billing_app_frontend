import os
import re

ROOT_DIR = r"c:\yoburaj\billing_app_frontend"
APP_DIR = os.path.join(ROOT_DIR, "app")
SRC_DIR = os.path.join(ROOT_DIR, "src")

# The root level folders in src/
known_folders = ["components", "constants", "context", "database", "hooks", "services", "utils", "screens", "navigation"]

def update_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to catch common relative up-path imports pointing to our root folders, including db
    # We replace from '../db/' to '@/database/', '../../components/' to '@/components/', etc.
    # We'll use a regex that looks for from ['"](\.\./)+([^/'"]+)
    
    def repl(match):
        prefix = match.group(1)
        folder = match.group(3)
        rest = match.group(4)
        
        # map old 'db' to 'database'
        if folder == 'db':
            folder = 'database'
            
        if folder in known_folders:
            return f"{prefix}@/{folder}{rest}"
        else:
            # return original if not matched
            return match.group(0)
            
    # Matches: import ... from '../../constants/Vegetables';
    # Group 1: string prefix (" or ')
    # Group 2: (../) repeated
    # Group 3: first folder after ../ (e.g., constants)
    # Group 4: rest of the path until quote
    # group 5: closing quote
    new_content = re.sub(r'([\'"])((?:\.\./)+)([^/\'"]+)(/[^\'"]*)[\'"]', repl, content)
    
    # What about sibling imports in src? like in src/components/A.tsx importing src/utils/B.ts
    # It might be `import B from '../utils/B'` which is already matched.
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated imports in {file_path}")

for walk_dir in [APP_DIR, SRC_DIR]:
    if not os.path.exists(walk_dir):
        continue
    for root, dirs, files in os.walk(walk_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                update_imports(os.path.join(root, file))

print("Import references fixed!")
