import os

images_dir = r'd:\My-Projects\Bill App\billing_app_frontend\assets\images'
renames = {
    'Bottle Gourd.png': 'Bottle_Gourd.png',
    'Snake Gourd.png': 'Snake_Gourd.png',
    'Taro Root.png': 'Taro_Root.png',
    "Lady's Finger.png": "Ladys_Finger.png",
    'Logo_bill.png': 'mylogo.png'
}

print(f"Scanning directory: {images_dir}")
for old, new in renames.items():
    old_path = os.path.join(images_dir, old)
    new_path = os.path.join(images_dir, new)
    if os.path.exists(old_path):
        print(f"Found: {old}")
        try:
            os.rename(old_path, new_path)
            print(f"SUCCESS: Renamed {old} to {new}")
        except Exception as e:
            print(f"FAILED: Error renaming {old}: {e}")
    else:
        print(f"MISSING: {old}")
