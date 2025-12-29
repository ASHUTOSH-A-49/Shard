from datetime import datetime
from typing import Optional, List, Dict, Any
from pymongo import MongoClient
from bson import ObjectId
import os
import logging

logger = logging.getLogger(__name__)

class InvoiceModel:
    """MongoDB invoice model and CRUD operations"""

    def __init__(self, mongodb_uri: str, db_name: str):
        """Initialize MongoDB connection"""
        try:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client[db_name]

            # Create indexes for performance
            self._create_indexes()
            logger.info("MongoDB connection established")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            raise

    def _create_indexes(self):
        """Create MongoDB indexes for performance"""
        # Invoices collection
        self.db.invoices.create_index([("created_at", -1)])
        self.db.invoices.create_index([("status", 1)])
        self.db.invoices.create_index([("extracted_data.invoice_metadata.date", 1)])
        self.db.invoices.create_index([("canonical_data.vendor_name_canonical.canonical_id", 1)])

        # Vendor master collection
        self.db.vendor_master.create_index([("canonical_id", 1)], unique=True)
        self.db.vendor_master.create_index([("vendor_name_variations", 1)])

        # Audit log collection
        self.db.audit_log.create_index([("invoice_id", 1)])
        self.db.audit_log.create_index([("timestamp", -1)])

    def save_extraction(
        self,
        user_id: str,                          # 👈 FIXED NAME
        extracted_data: Dict[str, Any],
        canonical_data: Dict[str, Any],
        confidence_scores: Dict[str, Any],
        status: str,
        original_filename: str = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """
        Save extraction result to MongoDB
        Returns: invoice_id (ObjectId as string)
        """
        try:
            invoice_doc = {
                "userId": user_id,                # 👈 NOW IT MATCHES THE ARG
                "extracted_data": extracted_data,
                "canonical_data": canonical_data,
                "confidence_scores": confidence_scores,
                "status": status,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "original_filename": original_filename,
                "approved_by": None,
                "approved_at": None,
                "notes": "",
                "corrections": {},
                "api_metadata": metadata or {}
            }

            result = self.db.invoices.insert_one(invoice_doc)
            invoice_id = str(result.inserted_id)

            # Audit log
            self.db.audit_log.insert_one({
                "invoice_id": ObjectId(invoice_id),
                "userId": user_id,                # 👈 ADD USER IN AUDIT LOG
                "action": "extracted",
                "timestamp": datetime.utcnow(),
                "changes": {
                    "status": status,
                    "confidence": confidence_scores.get('overall_confidence'),
                    "tokens_used": (metadata or {}).get("usage", {}).get("total_tokens")
                }
            })

            logger.info(f"Invoice saved for user {user_id}: {invoice_id}")
            return invoice_id

        except Exception as e:
            logger.error(f"Failed to save extraction: {str(e)}")
            raise


    def get_invoice(self, invoice_id: str) -> Optional[Dict[str, Any]]:
        """Fetch single invoice by ID"""
        try:
            invoice = self.db.invoices.find_one({"_id": ObjectId(invoice_id)})
            if invoice:
                invoice["_id"] = str(invoice["_id"])
                return invoice
        except Exception as e:
            logger.error(f"Failed to get invoice: {str(e)}")
            return None

    def get_all_invoices(self, status: Optional[str] = None, limit: int = 10, skip: int = 0) -> List[Dict[str, Any]]:
        """Fetch invoices with optional filtering"""
        try:
            query = {}
            if status:
                query["status"] = status

            invoices = list(
                self.db.invoices.find(query)
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )

            # Convert ObjectId to string
            for inv in invoices:
                inv["_id"] = str(inv["_id"])

            return invoices
        except Exception as e:
            logger.error(f"Failed to get invoices: {str(e)}")
            return []

    def get_review_queue(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get invoices needing human review"""
        return self.get_all_invoices(status="needs_review", limit=limit)

    def update_status(self, invoice_id: str, new_status: str, notes: str = "", approved_by: str = None) -> bool:
        """Update invoice approval status"""
        try:
            result = self.db.invoices.update_one(
                {"_id": ObjectId(invoice_id)},
                {
                    "$set": {
                        "status": new_status,
                        "updated_at": datetime.utcnow(),
                        "notes": notes,
                        "approved_by": approved_by,
                        "approved_at": datetime.utcnow() if new_status == "approved" else None
                    }
                }
            )

            # Log to audit trail
            self.db.audit_log.insert_one({
                "invoice_id": ObjectId(invoice_id),
                "action": "status_updated",
                "new_status": new_status,
                "timestamp": datetime.utcnow(),
                "approved_by": approved_by
            })

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Failed to update status: {str(e)}")
            return False

    def save_corrections(self, invoice_id: str, corrections: Dict[str, Any]) -> bool:
        """Save manual corrections to invoice"""
        try:
            result = self.db.invoices.update_one(
                {"_id": ObjectId(invoice_id)},
                {
                    "$set": {
                        "corrections": corrections,
                        "status": "approved",
                        "updated_at": datetime.utcnow(),
                        "notes": "Manually corrected"
                    }
                }
            )

            # Log corrections to audit trail
            self.db.audit_log.insert_one({
                "invoice_id": ObjectId(invoice_id),
                "action": "corrected",
                "timestamp": datetime.utcnow(),
                "changes": corrections
            })

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Failed to save corrections: {str(e)}")
            return False

    def get_analytics(self) -> Dict[str, Any]:
        """Get dashboard analytics"""
        try:
            total = self.db.invoices.count_documents({})
            auto_approved = self.db.invoices.count_documents({"status": "auto_approved"})
            needs_review = self.db.invoices.count_documents({"status": "needs_review"})
            approved = self.db.invoices.count_documents({"status": "approved"})
            rejected = self.db.invoices.count_documents({"status": "rejected"})

            # Calculate average confidence
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "avg_confidence": {"$avg": "$confidence_scores.overall_confidence"}
                    }
                }
            ]
            avg_conf_result = list(self.db.invoices.aggregate(pipeline))
            avg_confidence = avg_conf_result[0]["avg_confidence"] if avg_conf_result else 0

            return {
                "total_invoices": total,
                "auto_approved": auto_approved,
                "needs_review": needs_review,
                "approved": approved,
                "rejected": rejected,
                "approval_rate": ((approved + auto_approved) / total * 100) if total > 0 else 0,
                "average_confidence": round(avg_confidence, 2)
            }

        except Exception as e:
            logger.error(f"Failed to get analytics: {str(e)}")
            return {}

    def export_to_csv_format(self, status: Optional[str] = None, limit: int = 1000) -> List[Dict]:
        """Export invoices in CSV-compatible format"""
        invoices = self.get_all_invoices(status=status, limit=limit)

        csv_data = []
        for inv in invoices:
            canonical = inv.get("canonical_data", {})
            csv_data.append({
                "invoice_id": canonical.get("invoice_metadata", {}).get("invoice_number"),
                "vendor_name": canonical.get("vendor_info", {}).get("vendor_name_canonical", {}).get("normalized_name"),
                "vendor_id": canonical.get("vendor_info", {}).get("vendor_name_canonical", {}).get("canonical_id"),
                "amount": canonical.get("pricing_summary", {}).get("total_amount"),
                "currency": canonical.get("pricing_summary", {}).get("currency"),
                "date": canonical.get("invoice_metadata", {}).get("date"),
                "tax_amount": canonical.get("pricing_summary", {}).get("tax", {}).get("tax_amount"),
                "status": inv.get("status"),
                "confidence": inv.get("confidence_scores", {}).get("overall_confidence")
            })

        return csv_data