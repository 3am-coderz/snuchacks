import pytesseract
import cv2
import re

# Windows only
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 🔹 Load image (USE SIMPLE PATH like C:\temp\test.png)
img = cv2.imread(r"C:\Users\anish\Downloads\random.png")

if img is None:
    print("❌ Image not loaded. Check path.")
    exit()

# 🔹 Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 🔹 Extract text
text = pytesseract.image_to_string(gray)

print("\n📄 RAW OCR TEXT:\n")
print(text)

# =========================
# 🔥 ADD PARSING HERE
# =========================

def extract_amount(text):
    match = re.search(r'\d+', text)
    return int(match.group()) if match else None

def extract_vendor(text):
    lines = text.split("\n")
    return lines[0].strip()

# 🔹 Parse structured data
amount = extract_amount(text)
vendor = extract_vendor(text)

print("\n📊 PARSED DATA:\n")
print({
    "vendor": vendor,
    "amount": amount
})