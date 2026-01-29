import pypdf
import sys
import os

def extract_text(pdf_path):
    print(f"--- {os.path.basename(pdf_path)} ---")
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            print(page.extract_text())
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    print("\n")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        extract_text(arg)
