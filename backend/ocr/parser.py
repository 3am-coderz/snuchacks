import pytesseract
import cv2
import re

# 🔹 Windows only (set path)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 🔹 Load image (USE SIMPLE PATH)
img = cv2.imread(r"C:\Users\anish\Downloads\random.png")

if img is None:
    print("❌ Image not loaded. Check path.")
    exit()

# 🔹 Preprocessing
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.GaussianBlur(gray, (5,5), 0)
gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

# 🔹 OCR
text = pytesseract.image_to_string(gray)

print("\n📄 RAW OCR TEXT:\n")
print(text)

# =========================
# 🔥 PARSER FUNCTIONS
# =========================

def extract_amount(text):
    # Find all numbers
    numbers = re.findall(r'\d+', text)
    
    if not numbers:
        return None
    
    # Convert to int and take largest (likely total)
    numbers = [int(n) for n in numbers]
    return max(numbers)


def extract_vendor(text):
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    for line in lines:
        # Skip lines with numbers
        if not any(char.isdigit() for char in line):
            return line
    
    return "Unknown"


def extract_date(text):
    # Simple patterns (can extend later)
    patterns = [
        r'\d{2}/\d{2}/\d{4}',
        r'\d{2}-\d{2}-\d{2024}',
        r'\d{2}\.\d{2}\.\d{2024}'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group()
    
    if "today" in text.lower():
        return "today"
    if "tomorrow" in text.lower():
        return "tomorrow"
    
    return "Unknown"


def extract_currency(text):
    if "₹" in text:
        return "INR"
    elif "$" in text:
        return "USD"
    return "Unknown"


def categorize_expense(vendor):
    vendor = vendor.lower()
    
    if any(word in vendor for word in ["food", "restaurant", "cafe"]):
        return "Food"
    elif any(word in vendor for word in ["rent", "landlord"]):
        return "Rent"
    elif any(word in vendor for word in ["electric", "power"]):
        return "Utilities"
    elif any(word in vendor for word in ["supplier", "wholesale"]):
        return "Supplier"
    
    return "Other"

# =========================
# 🔹 PARSE DATA
# =========================

vendor = extract_vendor(text)
amount = extract_amount(text)
date = extract_date(text)
currency = extract_currency(text)
category = categorize_expense(vendor)

# 🔹 Final structured output
result = {
    "vendor": vendor.title(),
    "amount": amount,
    "currency": currency,
    "date": date,
    "category": category
}

print("\n📊 PARSED DATA:\n")
print(result)