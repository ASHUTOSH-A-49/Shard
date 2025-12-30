import logging
import json
import os
from datetime import datetime
from uuid import uuid4
from flask import Blueprint, request, jsonify
from config import Config
from services.groq_extractor import GroqExtractor
from services.canonicalizer import DataCanonicalizer
from services.confidence_scorer import ConfidenceScorer
from utils.validators import InvoiceValidator
from models.invoices import InvoiceModel
from utils.image_quality import check_image_quality

logger = logging.getLogger(__name__)

# This prefix means all routes here start with /api
extract_bp = Blueprint('extract', __name__, url_prefix='/api')

# Initialize services
groq_extractor = GroqExtractor()
canonicalizer = DataCanonicalizer()
confidence_scorer = ConfidenceScorer()
invoice_model = None  # Initialized in app.py

def set_invoice_model(model: InvoiceModel):
    """Set the invoice model instance"""
    global invoice_model
    invoice_model = model

@extract_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "invoice-extractor",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }), 200

@extract_bp.route('/extract', methods=['POST'])
def extract_invoice():
    """
    Extract invoice data AND store with User Email (from token)
    """

    # ==========================================================
    # 1️⃣ GET AND VERIFY USER FROM TOKEN
    # ==========================================================
    auth_header = request.headers.get("Authorization", "")
    raw_token = auth_header.replace("Bearer ", "").strip()

    try:
        # Using dummy JSON token for Hackathon/Dev
        data = json.loads(raw_token)
        
        # 👇 CHANGE: Prioritize 'email' as the ID, fallback to 'userId'
        user_id = data.get("email") or data.get("userId")
        
        if not user_id:
            return jsonify({"error": "Token missing email or userId"}), 401
    except:
        return jsonify({"error": "Invalid token format"}), 401

    # ==========================================================
    # 2️⃣ SAFETY CHECK: FILE VALIDATION
    # ==========================================================
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)

    if file_length > Config.MAX_FILE_SIZE:
        return jsonify({"error": f"File too large ({file_length} bytes)"}), 413

    file_ext = os.path.splitext(file.filename)[1].lower()
    file_bytes = file.read()
    file.seek(0)

    # Only check quality for non-PDF
    if file_ext != '.pdf':
        is_bad, reason, score = check_image_quality(file_bytes, blur_threshold=450.0, contrast_threshold=35.0)
        if is_bad:
            return jsonify({
                "success": False,
                "error": f"Quality Check Failed: {reason}",
                "quality_score": round(score, 2)
            }), 400

    # ==========================================================
    # 3️⃣ EXTRACT USING GROQ API
    # ==========================================================
    try:
        image_base64 = groq_extractor.encode_image(file)
        raw_response = groq_extractor.extract(image_base64)

        if "error" in raw_response:
            return jsonify({"success": False, "error": raw_response['error']}), 500

        usage_data = raw_response.pop("_usage", {})
        extracted_data = raw_response

        is_valid_struct, error_msg = groq_extractor.validate_response_structure(extracted_data)
        if not is_valid_struct:
            return jsonify({"success": False, "error": f"Structure: {error_msg}"}), 500

        canonical_data = canonicalizer.canonicalize_invoice(extracted_data)
        is_valid_content, val_error = InvoiceValidator.validate_invoice(canonical_data)
        confidence_scores = confidence_scorer.calculate_confidence(canonical_data)
        status = confidence_scores.get('status', 'needs_review')

        # ==========================================================
        # 4️⃣ SAVE INVOICE WITH userId (EMAIL) TO MONGODB
        # ==========================================================
        invoice_id = str(uuid4())
        if invoice_model:
            invoice_id = invoice_model.save_extraction(
                extracted_data=extracted_data,
                canonical_data=canonical_data,
                confidence_scores=confidence_scores,
                status=status,
                original_filename=file.filename,
                metadata={"usage": usage_data},
                user_id=user_id  # 👈 Saves the email
            )

        # ==========================================================
        # 5️⃣ RETURN FULL RESPONSE
        # ==========================================================
        return jsonify({
            "success": True,
            "invoice_id": invoice_id,
            "user_id": user_id,
            "extracted_data": extracted_data,
            "canonical_data": canonical_data,
            "confidence": confidence_scores,
            "status": status,
            "valid": is_valid_content,
            "error": val_error,
            "usage_stats": usage_data,
            "timestamp": datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# ========== DASHBOARD & REVIEW ROUTES ==========

@extract_bp.route('/review-queue', methods=['GET'])
def get_review_queue():
    if not invoice_model:
        return jsonify({"error": "Database not initialized"}), 500
    invoices = invoice_model.get_review_queue(limit=20)
    return jsonify({"invoices": invoices, "count": len(invoices)}), 200

@extract_bp.route('/review/<invoice_id>/approve', methods=['POST'])
def approve_invoice(invoice_id):
    if not invoice_model:
        return jsonify({"error": "Database not initialized"}), 500
    success = invoice_model.update_status(
        invoice_id,
        "approved",
        "Auto-approved by system"
    )
    if success:
        return jsonify({"status": "approved", "invoice_id": invoice_id}), 200
    return jsonify({"error": "Failed to approve"}), 500

@extract_bp.route('/analytics', methods=['GET'])
def get_analytics():
    if not invoice_model:
        return jsonify({"error": "Database not initialized"}), 500
    analytics = invoice_model.get_analytics()
    return jsonify(analytics), 200

# ========== ACTIVITY LOG ROUTE ==========

@extract_bp.route('/invoices', methods=['GET'])
def get_invoices():
    """
    Get all invoices for the Activity Feed.
    Filters by the logged-in user email (or userId).
    """
    if not invoice_model:
        return jsonify({"error": "Database not initialized"}), 500

    # 1. Auth Check (Get User Email)
    auth_header = request.headers.get("Authorization", "")
    raw_token = auth_header.replace("Bearer ", "").strip()

    try:
        data = json.loads(raw_token)
        # 👇 CHANGE: Match the extract logic (use email)
        user_id = data.get("email") or data.get("userId")
    except:
        return jsonify({"error": "Invalid token"}), 401

    # 2. Query Parameters
    limit = int(request.args.get('limit', 50))
    
    try:
        # 3. Direct DB Query (filters by "userId" field in DB, which now holds the email)
        query = {"userId": user_id}
        
        cursor = invoice_model.db.invoices.find(query).sort("created_at", -1).limit(limit)
        invoices = list(cursor)

        # 4. Serialize ObjectId
        for inv in invoices:
            inv["_id"] = str(inv["_id"])

        # 5. Return in format expected by frontend
        return jsonify({
            "success": True,
            "count": len(invoices),
            "invoices": invoices 
        }), 200

    except Exception as e:
        logger.error(f"Error fetching invoices: {str(e)}")
        return jsonify({
            "success": False, 
            "error": str(e)
        }), 500