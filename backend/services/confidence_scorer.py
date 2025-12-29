import logging
import re
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class ConfidenceScorer:
    """
    Calculates confidence scores for extracted fields
    Scores range 0-100:
    - 90-100: High confidence (auto-approve)
    - 70-89: Medium confidence (needs review)
    - 50-69: Low confidence (manual review required)
    - 0-49: Very low (likely errors)
    """

    # Field importance weights
    FIELD_WEIGHTS = {
        'company_name': 10,
        'invoice_number': 8,
        'date': 12,
        'time': 3,
        'vendor_name': 10,
        'items': 25,
        'subtotal': 10,
        'tax': 12,
        'total_amount': 14,
    }

    # Confidence thresholds
    CONFIDENCE_THRESHOLDS = {
        'auto_approve': 0.85,  # ≥85% = auto approve
        'needs_review': 0.60,  # 60-84% = needs human review
        'low_confidence': 0.50, # <50% = likely errors
    }

    @staticmethod
    def score_company_name(company_name: Optional[str]) -> float:
        """Score company name presence and format"""
        if not company_name or len(company_name.strip()) == 0:
            return 0.0

        # Longer names get higher confidence
        length_score = min(len(company_name) / 50, 1.0) * 100

        # Business indicators increase confidence
        business_indicators = ['company', 'corp', 'inc', 'ltd', 'llc', 'pvt', 'gmbh', 'ag', 'industries', 'solutions']
        has_indicator = any(indicator in company_name.lower() for indicator in business_indicators)

        return (length_score + (50 if has_indicator else 30))

    @staticmethod
    def score_invoice_number(invoice_number: Optional[str]) -> float:
        """Score invoice number format"""
        if not invoice_number:
            return 0.0

        inv_num = str(invoice_number).strip()

        # Check for common patterns
        has_alphanumeric = any(c.isalnum() for c in inv_num)
        has_digits = any(c.isdigit() for c in inv_num)

        if not has_alphanumeric or not has_digits:
            return 30.0

        # Length check
        if 5 <= len(inv_num) <= 20:
            return 100.0

        return 70.0

    @staticmethod
    def score_date(date_str: Optional[str]) -> float:
        """Score date format and validity"""
        if not date_str:
            return 0.0

        # Check YYYY-MM-DD format
        date_pattern = r'^\d{4}-\d{2}-\d{2}$'
        if re.match(date_pattern, date_str):
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
                return 100.0  # Perfect format and valid
            except ValueError:
                return 50.0

        return 60.0  # Other formats get partial credit

    @staticmethod
    def score_time(time_str: Optional[str]) -> float:
        """Score time format and validity"""
        if not time_str:
            return 100.0  # Time is optional, full credit if N/A

        time_pattern = r'^\d{2}:\d{2}:\d{2}$'
        if re.match(time_pattern, time_str):
            try:
                datetime.strptime(time_str, '%H:%M:%S')
                return 100.0
            except ValueError:
                return 50.0

        return 60.0

    @staticmethod
    def score_vendor_name(vendor_name: Optional[str]) -> float:
        """Score vendor name presence and format"""
        if not vendor_name or len(vendor_name.strip()) == 0:
            return 0.0

        length_score = min(len(vendor_name) / 40, 1.0) * 100

        # Check for valid characters
        has_letters = any(c.isalpha() for c in vendor_name)

        if not has_letters:
            return 20.0

        return length_score + 20

    @staticmethod
    def score_items(items: Optional[list]) -> float:
        """Score items list completeness"""
        if not items or not isinstance(items, list):
            return 0.0

        if len(items) == 0:
            return 0.0

        total_item_score = 0.0

        for item in items:
            item_score = 0.0
            required_fields = ['item_name', 'quantity', 'unit_price', 'line_total']

            # Check each required field
            for field in required_fields:
                if field in item and item[field] is not None:
                    item_score += 25.0

            # Bonus for discount information
            if item.get('discount', {}).get('has_discount'):
                if item['discount'].get('actual_price') and item['discount'].get('discounted_price'):
                    item_score += 10.0

            total_item_score += item_score

        avg_item_score = total_item_score / len(items)
        return min(avg_item_score, 100.0)

    @staticmethod
    def score_pricing(pricing_summary: Optional[Dict]) -> float:
        """Score pricing information completeness"""
        if not pricing_summary or not isinstance(pricing_summary, dict):
            return 0.0

        score = 0.0
        total_possible = 0.0

        # Subtotal (30 points)
        if pricing_summary.get('subtotal') is not None:
            score += 30.0
            total_possible += 30.0

        # Tax information (30 points)
        tax_info = pricing_summary.get('tax', {})
        if isinstance(tax_info, dict):
            if tax_info.get('has_tax'):
                if tax_info.get('tax_amount') is not None and tax_info.get('tax_percent') is not None:
                    score += 30.0
                total_possible += 30.0
            else:
                score += 20.0  # Partial for noting no tax
                total_possible += 30.0

        # Total amount (40 points)
        if pricing_summary.get('total_amount') is not None:
            score += 40.0
            total_possible += 40.0

        return (score / total_possible * 100) if total_possible > 0 else 0.0

    @classmethod
    def calculate_confidence(cls, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate overall and field-level confidence scores

        Returns:
        {
            "overall_confidence": 0-100,
            "field_confidence": { field: score, ... },
            "confidence_level": "high|medium|low|very_low",
            "status": "auto_approved|needs_review|low_confidence"
        }
        """

        try:
            total_weighted_score = 0.0
            total_weight = 0.0

            meta = invoice_data.get('invoice_metadata', {})
            vendor = invoice_data.get('vendor_info', {})
            pricing = invoice_data.get('pricing_summary', {})
            items = invoice_data.get('items', [])

            # Score each field
            field_scores = {
                'company_name': cls.score_company_name(meta.get('company_name')),
                'invoice_number': cls.score_invoice_number(meta.get('invoice_number')),
                'date': cls.score_date(meta.get('date')),
                'time': cls.score_time(meta.get('time')),
                'vendor_name': cls.score_vendor_name(vendor.get('vendor_name')),
                'items': cls.score_items(items),
                'pricing': cls.score_pricing(pricing),
            }

            # Calculate weighted average
            for field, score in field_scores.items():
                weight = cls.FIELD_WEIGHTS.get(field, 10)
                total_weighted_score += score * weight
                total_weight += weight

            overall_confidence = (total_weighted_score / total_weight) if total_weight > 0 else 0.0
            overall_confidence = min(overall_confidence, 100.0)

            # Determine status based on threshold
            if overall_confidence >= cls.CONFIDENCE_THRESHOLDS['auto_approve'] * 100:
                status = 'auto_approved'
            elif overall_confidence >= cls.CONFIDENCE_THRESHOLDS['needs_review'] * 100:
                status = 'needs_review'
            else:
                status = 'low_confidence'

            return {
                'overall_confidence': round(overall_confidence, 2),
                'field_confidence': {k: round(v, 2) for k, v in field_scores.items()},
                'confidence_level': cls._get_confidence_level(overall_confidence),
                'status': status
            }

        except Exception as e:
            logger.error(f"Confidence scoring failed: {str(e)}")
            return {
                'overall_confidence': 0.0,
                'field_confidence': {},
                'confidence_level': 'error',
                'status': 'error'
            }

    @staticmethod
    def _get_confidence_level(score: float) -> str:
        """Map numeric score to confidence level"""
        if score >= 90:
            return 'high'
        elif score >= 70:
            return 'medium'
        elif score >= 50:
            return 'low'
        else:
            return 'very_low'