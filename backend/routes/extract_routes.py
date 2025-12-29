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
    Extract invoice data from uploaded image/PDF
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Get file size safely
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)

    if file_length > Config.MAX_FILE_SIZE:
        return jsonify({"error": f"File too large ({file_length} bytes)"}), 413

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.pdf'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # ========== EXTREMITY CHECK (QUALITY) ==========
    file_bytes = file.read()
    file.seek(0) # IMPORTANT: Reset for Groq encoding

    # Only check quality for actual image uploads, not PDF pages from batch
    if file_ext != '.pdf':
        logger.info("Performing comprehensive image quality check...")
        #tune these thresholds for strictness control
        is_bad, reason, score = check_image_quality(file_bytes, blur_threshold=450.0, contrast_threshold=35.0)
        
        if is_bad:
            logger.warning(f"Image rejected: {reason} (Score/Value: {score})")
            return jsonify({
                "success": False,
                "error": f"Quality Check Failed: {reason}",
                "quality_score": round(score, 2),
                "timestamp": datetime.utcnow().isoformat()
            }), 400

    # ========== EXTRACTION ==========
    try:
        logger.info(f"Processing file: {file.filename}")
        
        # Step 1: Encode image for Groq
        # Ensure your encode_image method uses file.read() or handles the pointer
        image_base64 = groq_extractor.encode_image(file)

        # Step 2: Extract with Groq API
        logger.info("Calling Groq API for extraction...")
        raw_response = groq_extractor.extract(image_base64)

        if "error" in raw_response:
            return jsonify({"success": False, "error": raw_response['error']}), 500

        # Handle usage data separately
        usage_data = raw_response.pop("_usage", {})
        extracted_data = raw_response 

        # Step 3: Validate structure
        is_valid_struct, error_msg = groq_extractor.validate_response_structure(extracted_data)
        if not is_valid_struct:
            return jsonify({"success": False, "error": f"Structure: {error_msg}"}), 500

        # Step 4-6: Processing Pipeline
        canonical_data = canonicalizer.canonicalize_invoice(extracted_data)
        is_valid_content, val_error = InvoiceValidator.validate_invoice(canonical_data)
        confidence_scores = confidence_scorer.calculate_confidence(canonical_data)
        status = confidence_scores.get('status', 'needs_review')

        # Step 7: ID generation and MongoDB save
        invoice_id = str(uuid4())
        if invoice_model:
            invoice_id = invoice_model.save_extraction(
                extracted_data=extracted_data,
                canonical_data=canonical_data,
                confidence_scores=confidence_scores,
                status=status,
                original_filename=file.filename,
                metadata={"usage": usage_data}
            )

        # Ensure upload directory exists
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

        # --- MODIFICATION: SAVE ONLY JSON OUTPUT TO DISK ---
        json_save_path = os.path.join(Config.UPLOAD_FOLDER, f"{invoice_id}.json")
        
        output_data = {
            "success": True,
            "invoice_id": invoice_id,
            "extracted_data": extracted_data,
            "canonical_data": canonical_data,
            "confidence": confidence_scores,
            "usage_stats": usage_data,
            "validation": {
                "valid": is_valid_content,
                "error": val_error
            },
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }

        with open(json_save_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        logger.info(f"JSON data saved to: {json_save_path}")

        # Step 9: Return JSON response
        return jsonify(output_data), 200

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
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