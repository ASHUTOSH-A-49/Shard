from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("MONGODB_DB_NAME")]

# Specify your collection
collection = db["invoices"]

# Delete all documents using an empty filter {}
result = collection.delete_many({})

print(f"🗑️ Cleared {result.deleted_count} documents from 'invoices' collection.")



# -----------------USE THIS CODE ONLY TO CLEAR THE COLLECTION (WARNING!!!!!) USE ONLY WHEN TESTING -----------------