import requests
import json

# API endpoint configuration
# Ensure your Flask server is running on this port
URL = "http://127.0.0.1:5000/api/extract"

# Path to a real invoice image on your machine for testing
# Example: "sample_invoice.jpg" or "data/invoice_test.png"
FILE_PATH = "./assets/sample_invoices/rahul_inv_1.jpeg"

def run_test():
    try:
        # Open the file in binary read mode ('rb')
        with open(FILE_PATH, 'rb') as f:
            # Map the file to the key 'file' (matching your Flask request.files['file'])
            files = {'file': f}
            
            print(f"🚀 Sending {FILE_PATH} to extraction API...")
            
            # Send the POST request
            response = requests.post(URL, files=files)
            
            # Check for success
            if response.status_code == 200:
                print("✅ Success! Response received:")
                print(json.dumps(response.json(), indent=2))
            else:
                print(f"❌ Error {response.status_code}:")
                print(response.text)
                
    except FileNotFoundError:
        print(f"❌ Error: Could not find the test file at {FILE_PATH}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    run_test()