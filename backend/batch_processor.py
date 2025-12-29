import os
import time
import requests
import fitz  # PyMuPDF
import io

# Config
API_URL = "http://127.0.0.1:5000/api/extract"
BATCH_FILE = "./assets/batch_upload.pdf"

def split_and_process_pdf(pdf_path):
    # Open the PDF with PyMuPDF
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"📄 Found {total_pages} pages. Converting pages to images for Groq...")

    tokens_consumed_in_window = 0
    window_start_time = time.time()

    for i in range(total_pages):
        print(f"\n🔄 Processing Page {i+1}/{total_pages}...")
        
        # --- CONVERT PDF PAGE TO IMAGE ---
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for better OCR quality
        img_bytes = pix.tobytes("png")
        
        # Wrap in BytesIO for requests
        img_file = io.BytesIO(img_bytes)
        img_file.name = f"page_{i+1}.png"

        # --- SEND TO FLASK ---
        try:
            files = {'file': (img_file.name, img_file, 'image/png')}
            response = requests.post(API_URL, files=files)
            
            if response.status_code == 200:
                result = response.json()
                usage = result.get('usage_stats', {})
                last_tokens = usage.get('total_tokens', 0)
                tokens_consumed_in_window += last_tokens
                
                print(f"✅ Success! Invoice ID: {result['invoice_id']}")
                print(f"📊 Tokens used: {last_tokens} | Window: {tokens_consumed_in_window}/1000")

                # Throttle logic
                if tokens_consumed_in_window > 800:
                    # wait = max(0, 60 - (time.time() - window_start_time))
                    wait=40
                    print(f"⏳ Threshold reached. Sleeping {int(wait)}s...")
                    time.sleep(wait)
                    tokens_consumed_in_window = 0
                    window_start_time = time.time()
                else:
                    time.sleep(5) 

            else:
                print(f"❌ Error {response.status_code}: {response.text}")

        except Exception as e:
            print(f"❌ Connection Error: {str(e)}")

    doc.close()

if __name__ == "__main__":
    split_and_process_pdf(BATCH_FILE)