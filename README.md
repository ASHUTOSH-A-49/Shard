# 💎 Shard | AI-Driven Invoice Intelligence

Shard is a high-performance, "Database-First" invoice processing engine that transforms unstructured documents into structured, actionable financial data. Built for speed and reliability, Shard solves the "Trust Gap" in AI by combining **LLM-based semantic extraction** with an **Intelligent Review Queue** and **Computer Vision pre-validation**.


DEPLOY LINK - https://shard-9qyi.onrender.com/
## 🚀 Key Features

- **Semantic AI Extraction:** Powered by Groq/Grok, Shard understands the *context* of financial documents, making it layout-agnostic.
- **Image Quality Guardrail:** Uses Laplacian variance and histogram analysis to detect blur or low-contrast uploads before they hit the AI.
- **Human-in-the-Loop (HITL):** A dedicated Review Queue for low-confidence extractions ensures 100% data integrity.
- **Database-First Architecture:** Strict synchronization between React/Zustand and MongoDB, moving away from stale local caching.
- **Real-Time Analytics:** Visualize spend trends, vendor distributions, and AI accuracy metrics instantly.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Flask (Python), OpenCV (Image Processing)
- **AI/LLM:** Groq LPU™ Inference / Grok 
- **Database:** MongoDB
- **Cloud Readiness:** Architected via **Kiro** for AWS (S3, DocumentDB, Cognito)

## 🏗️ Architecture



1. **Ingestion:** User uploads PDF/Image.
2. **Validation:** Backend performs blur/contrast checks.
3. **Extraction:** AI identifies vendor, line items, taxes, and totals.
4. **Persistence:** Data is saved to MongoDB with a unique `userId` identity token.
5. **Review:** Low-confidence scores (< 85%) are quarantined for manual approval.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB instance

### Installation

1. **Clone the Repo**
   ```bash
   git clone [https://github.com/ASHUTOSH-A-49/Shard.git](https://github.com/ASHUTOSH-A-49/Shard.git)
   cd Shard
   ```
2. ***Backend Setup***
   ```bash
   cd backend
   pip install -r requirements.txt
   Create a .env file with your MONGO_URI and GROQ_API_KEY
   python app.py
  ``
3. ***Frontend Setup***
```bash
cd frontend
npm install
npm run dev
```
***Identity & Security***
A great README.md is often the difference between a project that gets ignored and one that wins a hackathon. Since you are positioning this as an innovative, production-ready AI tool, the README needs to be clean, technical, and visually organized.

Create a file named README.md in your root directory and paste the following:

Markdown

# 💎 Shard | AI-Driven Invoice Intelligence

Shard is a high-performance, "Database-First" invoice processing engine that transforms unstructured documents into structured, actionable financial data. Built for speed and reliability, Shard solves the "Trust Gap" in AI by combining **LLM-based semantic extraction** with an **Intelligent Review Queue** and **Computer Vision pre-validation**.



## 🚀 Key Features

- **Semantic AI Extraction:** Powered by Groq/Grok, Shard understands the *context* of financial documents, making it layout-agnostic.
- **Image Quality Guardrail:** Uses Laplacian variance and histogram analysis to detect blur or low-contrast uploads before they hit the AI.
- **Human-in-the-Loop (HITL):** A dedicated Review Queue for low-confidence extractions ensures 100% data integrity.
- **Database-First Architecture:** Strict synchronization between React/Zustand and MongoDB, moving away from stale local caching.
- **Real-Time Analytics:** Visualize spend trends, vendor distributions, and AI accuracy metrics instantly.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Flask (Python), OpenCV (Image Processing)
- **AI/LLM:** Groq LPU™ Inference / Grok 
- **Database:** MongoDB
- **Cloud Readiness:** Architected via **Kiro** for AWS (S3, DocumentDB, Cognito)

## 🏗️ Architecture



1. **Ingestion:** User uploads PDF/Image.
2. **Validation:** Backend performs blur/contrast checks.
3. **Extraction:** AI identifies vendor, line items, taxes, and totals.
4. **Persistence:** Data is saved to MongoDB with a unique `userId` identity token.
5. **Review:** Low-confidence scores (< 85%) are quarantined for manual approval.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB instance

### Installation

1. **Clone the Repo**
   ```bash
   git clone [https://github.com/ASHUTOSH-A-49/Shard.git](https://github.com/ASHUTOSH-A-49/Shard.git)
   cd Shard
Backend Setup

Bash

cd backend
pip install -r requirements.txt
# Create a .env file with your MONGO_URI and GROQ_API_KEY
python app.py
Frontend Setup

Bash

cd frontend
npm install
npm run dev
🛡️ Identity & Security
Shard uses a standardized JWT Identity Payload stringified into the Authorization header. This ensures that every API request is partitioned by user identity, preventing data leaks in a multi-tenant environment.

***Future Roadmap***
- Direct AWS S3 integration for document archiving.
- Export to QuickBooks/Xero API.
- Multi-currency conversion via real-time exchange rate APIs.
Built with ❤️ by team Hackxios for Hackxios

  

