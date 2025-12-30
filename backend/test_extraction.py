import requests
import json

# API endpoint configuration
URL = "http://127.0.0.1:5000/api/extract"
FILE_PATH = "./assets/sample_invoices/rahul_inv_1.jpeg"

def run_test():
    try:
        # Create the dummy token structure your backend expects
        dummy_token = json.dumps({"userId": "test-user-123"})
        
        # Add the Authorization header
        headers = {
            "Authorization": f"Bearer {dummy_token}"
        }

        with open(FILE_PATH, 'rb') as f:
            files = {'file': f}
            
            print(f"🚀 Sending {FILE_PATH} with Auth Token...")
            
            # Pass the headers argument here
            response = requests.post(URL, files=files, headers=headers)
            
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