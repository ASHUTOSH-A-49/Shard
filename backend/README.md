# Invoice Extractor & AI Processor

An AI-powered system designed to extract structured data from invoices and receipts using **Groq (Llama 3 Vision)**. This project is built to handle the complexities of modern document processing, including multilingual support (Hindi, Marathi, Gujarati), image quality guardrails, and token-aware batch processing.

## 🚀 Key Features

* **AI Extraction**: High-fidelity structured JSON extraction powered by Groq Llama 3 Vision models.
* **Multilingual Support**: Automatically detects, extracts, and translates regional Indian languages like Hindi, Marathi, and Gujarati.
* **Image Quality Guard**: OpenCV-based extremity checks (Blur, Contrast, Brightness, and Resolution) to ensure only readable images are processed.
* **Token-Aware Throttling**: Intelligent batch processing script that monitors TPM (Tokens Per Minute) usage to prevent API rate-limiting.
* **Persistent Storage**: Automatically saves extraction JSON results to `static/uploads` and maintains a complete audit trail in MongoDB.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
* Python 3.9 or higher
* MongoDB (Local instance or Atlas URI)
* Groq API Key (Get it from [console.groq.com](https://console.groq.com/))

## 📦 Installation

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/ASHUTOSH-A-49/model-inv.git](https://github.com/ASHUTOSH-A-49/model-inv.git)
    cd model-inv
    ```

2.  **Create a Virtual Environment**
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

## ⚙️ Configuration

Create a `.env` file in the root directory and add your credentials:

```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=invoice_db
UPLOAD_FOLDER=static/uploads
```

## 🏃 Running the Application

### 1. Start the Flask Server
The server handles the API requests, image quality checks, and database operations.
```bash
python app.py
```
* The API will be available at http://127.0.0.1:5000/api.

2. Run Batch Processing
To process a multi-page PDF batch from the assets folder:
```bash
python batch_processor.py
```
Note: This script converts PDF pages to images using PyMuPDF and monitors token usage to avoid hitting the 1,000 TPM (Tokens Per Minute) limit.

🧪 API Usage
Extract Invoice
Endpoint: POST /api/extract

* Payload: multipart/form-data with a file field.

* Response Example:
```JSON
{
  "success": true,
  "invoice_id": "unique-uuid",
  "extracted_data": { 
      "invoice_metadata": { 
          "company_name": { 
              "original": "मेरी कंपनी", 
              "translated": "My Company" 
          } 
      },
      "...": "..." 
  },
  "usage_stats": {
    "total_tokens": 2428
  },
  "status": "auto_approved"
}
```

📂 Project Structure
* /routes: Flask blueprints for API endpoints (extract, analytics, review).

* /services: Core AI logic including Groq API wrapper, Canonicalizer, and Confidence Scorer.

* /utils: Image quality extremity checks (Blur/Contrast) and invoice validators.

* /models: MongoDB schema definition and CRUD operations for persistence.

* /static/uploads: Local storage for generated extraction JSON files.

⚖️ Quality Thresholds
The system performs pre-extraction checks based on the following defaults (Tweak in `extract_routes.py`):
* Blur: Laplacian Variance (Threshold: 160.0)

* Contrast: Standard Deviation (Threshold: 45.0)

* Resolution: Min 400x800px


