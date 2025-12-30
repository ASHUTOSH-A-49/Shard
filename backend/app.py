import logging
import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from routes.extract_routes import extract_bp, set_invoice_model
from models.invoices import InvoiceModel
from routes.auth_routes import auth_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_name: str = 'development') -> Flask:
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # ------------------------------------------------------------
    # 👇 FIXED CORS SECTION
    # This explicitly allows PUT requests and Authorization headers
    # ------------------------------------------------------------
    CORS(app, resources={r"/*": {"origins": "*"}}, 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"])
    # ------------------------------------------------------------

    # Initialize MongoDB
    try:
        invoice_model = InvoiceModel(
            mongodb_uri=app.config['MONGODB_URI'],
            db_name=app.config['MONGODB_DB_NAME']
        )
        set_invoice_model(invoice_model)
        logger.info("MongoDB initialized successfully")
    except Exception as e:
        logger.warning(f"MongoDB initialization failed: {str(e)} - Running without database")

    # Register blueprints
    app.register_blueprint(extract_bp)
    app.register_blueprint(auth_bp)

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {str(error)}")
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method not allowed"}), 405

    # Root endpoint
    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            "service": "Invoice Extraction API",
            "version": "1.0.0",
            "description": "HackXios 2K25 - Invoice Automation System",
            "endpoints": {
                "health": "GET /api/health",
                "extract": "POST /api/extract",
                "review_queue": "GET /api/review-queue",
                "approve": "PUT /api/invoices/<invoice_id>/status",
                "analytics": "GET /api/analytics"
            }
        }), 200

    logger.info(f"App created with config: {config_name}")
    return app

if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'development')
    app = create_app(env)
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('API_PORT', 5000)),
        debug=app.config['DEBUG']
    )