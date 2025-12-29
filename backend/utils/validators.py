import re
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

class InvoiceValidator:
    """Validates extracted and canonicalized invoice data"""

    @staticmethod
    def validate_company_name(name: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate company name"""
        if not name or len(name.strip()) == 0:
            return False, "Company name is required"
        if len(name) < 2:
            return False, "Company name too short (minimum 2 characters)"
        if len(name) > 200:
            return False, "Company name too long (maximum 200 characters)"
        return True, None

    @staticmethod
    def validate_date(date: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate date format YYYY-MM-DD"""
        if not date:
            return False, "Date is required"
        pattern = r'^\d{4}-\d{2}-\d{2}$'
        if not re.match(pattern, date):
            return False, "Date must be in YYYY-MM-DD format"
        return True, None

    @staticmethod
    def validate_time(time: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate time format HH:MM:SS (optional)"""
        if not time:
            return True, None  # Time is optional
        pattern = r'^\d{2}:\d{2}:\d{2}$'
        if not re.match(pattern, time):
            return False, "Time must be in HH:MM:SS format"
        return True, None

    @staticmethod
    def validate_items(items: Optional[list]) -> Tuple[bool, Optional[str]]:
        """Validate items list"""
        if not items or not isinstance(items, list):
            return False, "Items must be a non-empty list"
        if len(items) == 0:
            return False, "At least one item is required"

        for i, item in enumerate(items):
            if not isinstance(item, dict):
                return False, f"Item {i} is not a dictionary"
            if not item.get('item_name'):
                return False, f"Item {i} is missing name"
            if item.get('quantity') is None or not isinstance(item['quantity'], (int, float)):
                return False, f"Item {i} has invalid quantity"
            if item.get('unit_price') is None or not isinstance(item['unit_price'], (int, float)):
                return False, f"Item {i} has invalid unit_price"

        return True, None

    @staticmethod
    def validate_pricing(pricing: Optional[dict]) -> Tuple[bool, Optional[str]]:
        """Validate pricing summary"""
        if not pricing or not isinstance(pricing, dict):
            return False, "Pricing summary is required"
        if pricing.get('subtotal') is None:
            return False, "Subtotal is required"
        if not isinstance(pricing['subtotal'], (int, float)):
            return False, "Subtotal must be numeric"
        if pricing.get('total_amount') is None:
            return False, "Total amount is required"
        if not isinstance(pricing['total_amount'], (int, float)):
            return False, "Total amount must be numeric"

        return True, None

    @classmethod
    def validate_invoice(cls, invoice_data: dict) -> Tuple[bool, Optional[str]]:
        """Validate complete invoice"""
        # Check metadata
        meta = invoice_data.get('invoice_metadata', {})
        is_valid, error = cls.validate_company_name(meta.get('company_name'))
        if not is_valid:
            return False, f"Metadata: {error}"

        is_valid, error = cls.validate_date(meta.get('date'))
        if not is_valid:
            return False, f"Metadata: {error}"

        is_valid, error = cls.validate_time(meta.get('time'))
        if not is_valid:
            return False, f"Metadata: {error}"

        # Check items
        is_valid, error = cls.validate_items(invoice_data.get('items'))
        if not is_valid:
            return False, f"Items: {error}"

        # Check pricing
        is_valid, error = cls.validate_pricing(invoice_data.get('pricing_summary'))
        if not is_valid:
            return False, f"Pricing: {error}"

        return True, None