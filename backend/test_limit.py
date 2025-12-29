import os
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_LIMIT_KEY = os.getenv("GROQ_API_LIMIT") # Your testing key
URL = "http://127.0.0.1:5000/api/extract"
SAMPLE_DIR = "./assets/sample_invoices"

def test_groq_limit():
    # Get list of invoice files
    try:
        invoices = [f for f in os.listdir(SAMPLE_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        if not invoices:
            print(f"❌ No invoice images found in {SAMPLE_DIR}")
            return
    except FileNotFoundError:
        print(f"❌ Directory {SAMPLE_DIR} not found.")
        return

    print(f"🚀 Starting limit test with {len(invoices)} samples. Frequency: 1 every 5s.")
    request_count = 0
    
    while True:
        for invoice_name in invoices:
            request_count += 1
            file_path = os.path.join(SAMPLE_DIR, invoice_name)
            
            try:
                with open(file_path, 'rb') as f:
                    # Note: We send to the local API which uses the key configured there
                    # If you want the local API to use the test key, ensure app.py loads it
                    files = {'file': f}
                    response = requests.post(URL, files=files)
                    
                    if response.status_code == 200:
                        print(f"[{request_count}] ✅ Success: {invoice_name}")
                    elif response.status_code == 429:
                        print(f"\n🛑 LIMIT REACHED at request #{request_count}")
                        print(f"Response: {response.text}")
                        # Optional: Check 'retry-after' header if available
                        retry_after = response.headers.get("retry-after", "unknown")
                        print(f"Retry after: {retry_after} seconds")
                        return # Exit the test
                    else:
                        print(f"[{request_count}] ⚠️ Error {response.status_code}: {response.text}")

            except Exception as e:
                print(f"❌ Connection error: {str(e)}")
                return

            # Wait 10 seconds as requested
            time.sleep(10)

if __name__ == "__main__":
    test_groq_limit()