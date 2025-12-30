import logging
import json
import os
from datetime import datetime
from uuid import uuid4
from flask import Blueprint, request, jsonify
from bson import ObjectId
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
    # 1. Auth Headers Handling
    auth_header = request.headers.get("Authorization", "")
    raw_token = auth_header.replace("Bearer ", "").strip()
    try:
        data = json.loads(raw_token)
        # Handle cases where the token might be double-encoded as a string
        if isinstance(data, str): data = json.loads(data)
        
        # Use email as the primary unique identifier for MongoDB queries
        user_id =data.get("userId")
        
        if not user_id: 
            return jsonify({"error": "Token missing email identifier"}), 401
    except Exception:
        return jsonify({"error": "Invalid token format"}), 401

    # 2. File Check
    if 'file' not in request.files: return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No file selected"}), 400

    # 3. Size Check
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > Config.MAX_FILE_SIZE:
        return jsonify({"error": f"File too large ({file_length} bytes)"}), 413

    # 4. Quality Check (Non-PDFs)
    file_ext = os.path.splitext(file.filename)[1].lower()
    file_bytes = file.read()
    file.seek(0)
    if file_ext != '.pdf':
        is_bad, reason, score = check_image_quality(file_bytes, blur_threshold=450.0, contrast_threshold=35.0)
        if is_bad:
            return jsonify({
                "success": False,
                "error": f"Quality Check Failed: {reason}",
                "quality_score": round(score, 2)
            }), 400

    # 5. Extraction Logic
    try:
        image_base64 = groq_extractor.encode_image(file)
        raw_response = groq_extractor.extract(image_base64)

        if "error" in raw_response:
            return jsonify({"success": False, "error": raw_response['error']}), 500

        usage_stats = raw_response.pop("_usage", {})
        extracted_data = raw_response

        # Canonicalize & Validate content
        canonical_data = canonicalizer.canonicalize_invoice(extracted_data)
        is_valid_content, val_error = InvoiceValidator.validate_invoice(canonical_data)
        confidence_scores = confidence_scorer.calculate_confidence(canonical_data)
        
        # Get status (approved, rejected, or needs_review)
        status = confidence_scores.get('status', 'needs_review')

        # Save to DB
        invoice_id = None
        if invoice_model:
            # IMPORTANT: pass user_id explicitly to match retrieval query key 'userId'
            invoice_id = invoice_model.save_extraction(
                extracted_data=extracted_data,
                canonical_data=canonical_data,
                confidence_scores=confidence_scores,
                status=status,
                original_filename=file.filename,
                metadata={"usage": usage_stats},
                user_id=user_id 
            )

        return jsonify({
            "success": True,
            "invoice_id": str(invoice_id),
            "user_id": user_id,
            "extracted_data": extracted_data,
            "canonical_data": canonical_data,
            "confidence": confidence_scores,
            "status": status,
            "valid": is_valid_content,
            "error": val_error,
            "usage_stats": usage_stats,
            "timestamp": datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@extract_bp.route('/invoices/<invoice_id>/status', methods=['PUT', 'OPTIONS'])
def update_invoice_status(invoice_id):
    """Updates the status (approved/rejected) and logs the approver."""
    if request.method == 'OPTIONS':
        return '', 200

    if not invoice_model:
        return jsonify({"error": "Database not initialized"}), 500

    try:
        data = request.json
        new_status = data.get('status')
        approver = data.get('approved_by')

        if new_status not in ['approved', 'rejected']:
            return jsonify({"error": "Invalid status value"}), 400

        update_fields = {
            "confidence_scores.status": new_status, 
            "status": new_status,
            "approved_by": approver,
            "approved_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = invoice_model.db.invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Invoice not found"}), 404

        return jsonify({
            "success": True, 
            "message": f"Invoice marked as {new_status}",
            "id": invoice_id
        }), 200

    except Exception as e:
        logger.error(f"Status update failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@extract_bp.route('/review-queue', methods=['GET'])
def get_review_queue():
    if not invoice_model: return jsonify({"error": "Database error"}), 500
    invoices = invoice_model.get_review_queue(limit=20)
    return jsonify({"invoices": invoices, "count": len(invoices)}), 200


@extract_bp.route('/analytics', methods=['GET'])
def get_analytics():
    if not invoice_model: return jsonify({"error": "Database error"}), 500
    analytics = invoice_model.get_analytics()
    return jsonify(analytics), 200


@extract_bp.route('/invoices', methods=['GET'])
def get_invoices():
    """Fetch all invoices for the specific user's Activity Feed."""
    if not invoice_model: return jsonify({"error": "Database error"}), 500

    auth_header = request.headers.get("Authorization", "")
    raw_token = auth_header.replace("Bearer ", "").strip()

    try:
        data = json.loads(raw_token)
        if isinstance(data, str): data = json.loads(data)
        # Identify user by email from the token
        user_id = data.get("email")
    except Exception:
        return jsonify({"error": "Invalid token"}), 401

    limit = int(request.args.get('limit', 50))
    
    try:
        # Search MongoDB using 'userId' field
        query = {"userId": user_id}
        cursor = invoice_model.db.invoices.find(query).sort("created_at", -1).limit(limit)
        invoices = list(cursor)

        for inv in invoices:
            inv["_id"] = str(inv["_id"])

        return jsonify({
            "success": True,
            "count": len(invoices),
            "invoices": invoices 
        }), 200

    except Exception as e:
        logger.error(f"Error fetching invoices: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500