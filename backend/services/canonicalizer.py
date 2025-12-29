import re
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from dateutil import parser as date_parser
import uuid

logger = logging.getLogger(__name__)

class DataCanonicalizer:
    """Standardizes extracted invoice data - CRITICAL for PS3 Requirement #3"""

    # ISO currency codes mapping
    CURRENCY_MAPPINGS = {
        'dollar': 'USD', 'usd': 'USD', '$': 'USD',
        'rupee': 'INR', 'inr': 'INR', '₹': 'INR',
        'euro': 'EUR', 'eur': 'EUR', '€': 'EUR',
        'pound': 'GBP', 'gbp': 'GBP', '£': 'GBP',
        'yen': 'JPY', 'jpy': 'JPY', '¥': 'JPY',
        'franc': 'CHF', 'chf': 'CHF',
        'australian dollar': 'AUD', 'aud': 'AUD',
        'canadian dollar': 'CAD', 'cad': 'CAD',
    }

    @staticmethod
    def canonicalize_date(date_str: Optional[str]) -> Optional[str]:
        """
        Convert any date format to YYYY-MM-DD

        Handles:
        - 29-12-2025 → 2025-12-29
        - Dec 29, 2025 → 2025-12-29
        - 29/12/25 → 2025-12-29
        - 2025-12-29 → 2025-12-29 (passthrough)
        """
        if not date_str or date_str.strip() == '':
            return None

        try:
            # Use dateparser for robust multi-format parsing
            parsed_date = date_parser.parse(date_str)
            return parsed_date.strftime("%Y-%m-%d")
        except:
            logger.warning(f"Could not parse date: {date_str}")
            return None

    @staticmethod
    def canonicalize_time(time_str: Optional[str]) -> Optional[str]:
        """
        Ensure time is in HH:MM:SS format

        Handles:
        - 14:30:00 → 14:30:00 (passthrough)
        - 14:30 → 14:30:00
        - 2:30 PM → 14:30:00
        - null → null
        """
        if not time_str or time_str.strip() == '':
            return None

        # Remove common time indicators
        time_str = time_str.replace('am', '').replace('pm', '').replace('AM', '').replace('PM', '').strip()

        try:
            parsed_time = datetime.strptime(time_str, "%H:%M:%S")
            return parsed_time.strftime("%H:%M:%S")
        except:
            try:
                parsed_time = datetime.strptime(time_str, "%H:%M")
                return parsed_time.strftime("%H:%M:00")
            except:
                logger.warning(f"Could not parse time: {time_str}")
                return None

    @staticmethod
    def clean_string(text: Optional[str]) -> Optional[str]:
        """Remove extra whitespace and normalize text"""
        if not text:
            return None

        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', str(text))
        # Remove leading/trailing whitespace
        text = text.strip()
        return text if text else None

    @classmethod
    def normalize_currency_amount(cls, amount: Any) -> Tuple[Optional[float], Optional[str]]:
        """
        Convert amount to float with currency detection

        Handles:
        - "$1,500.00" → (1500.00, "USD")
        - "₹15,000" → (15000.00, "INR")
        - "EUR 1200,50" → (1200.50, "EUR")
        - "1,500.00" → (1500.00, None)
        - "1.500,00" (European) → (1500.00, None)
        """
        if amount is None:
            return None, None

        if isinstance(amount, (int, float)):
            return float(amount), None

        try:
            amount_str = str(amount).strip()

            # Detect currency symbol
            detected_currency = None
            for symbol, currency in [('₹', 'INR'), ('$', 'USD'), ('€', 'EUR'), ('£', 'GBP')]:
                if symbol in amount_str:
                    detected_currency = currency
                    break

            # Remove currency symbols and spaces
            cleaned = re.sub(r'[^\d.,\-]', '', amount_str)

            # Handle European format (1.200,50 vs US format 1,200.50)
            if cleaned.count(',') == 1 and cleaned.count('.') == 1:
                # Both present - determine which is separator
                if cleaned.rindex(',') > cleaned.rindex('.'):
                    # European: 1.200,50
                    cleaned = cleaned.replace('.', '').replace(',', '.')
                else:
                    # US: 1,200.50
                    cleaned = cleaned.replace(',', '')
            elif cleaned.count(',') == 1:
                # Only comma
                if re.search(r'\d{3},\d{2}$', cleaned):
                    # European decimal: 1200,50
                    cleaned = cleaned.replace(',', '.')
                else:
                    # Thousands separator: 1,500
                    cleaned = cleaned.replace(',', '')
            elif cleaned.count('.') > 1:
                # Multiple dots - European thousands: 1.000.000,00
                cleaned = re.sub(r'\.(?=\d{3}[.,])', '', cleaned)
                if ',' in cleaned:
                    cleaned = cleaned.replace(',', '.')

            return round(float(cleaned), 2), detected_currency

        except Exception as e:
            logger.warning(f"Could not normalize currency: {amount} - {str(e)}")
            return None, None

    @staticmethod
    def canonicalize_currency_code(currency: Optional[str]) -> Optional[str]:
        """
        Standardize currency to ISO 4217 code

        Handles:
        - "dollar" → "USD"
        - "$" → "USD"
        - "INR" → "INR" (passthrough)
        - "rupee" → "INR"
        """
        if not currency:
            return "USD"  # Default

        currency_upper = currency.upper().strip()

        # If already ISO code, return as-is
        if len(currency_upper) == 3 and currency_upper.isalpha():
            return currency_upper

        # Look up in mapping
        for key, value in DataCanonicalizer.CURRENCY_MAPPINGS.items():
            if key in currency_upper.lower():
                return value

        return "USD"  # Default fallback

    @classmethod
    def canonicalize_vendor_name(cls, vendor_name: Optional[str]) -> Dict[str, Any]:
        """
        Normalize vendor name and generate canonical ID

        Handles:
        - "ABC Corporation" vs "ABC Corp." → Same canonical ID
        - "abc corporation" vs "ABC Corporation" → Same canonical ID
        - "A.B.C. Corporation Inc." vs "ABC Corporation" → Same canonical ID
        """
        if not vendor_name or vendor_name.strip() == '':
            return {
                "canonical_id": "VENDOR_UNKNOWN",
                "normalized_name": "Unknown",
                "raw_input": vendor_name
            }

        # Normalize: lowercase, remove special chars, collapse spaces
        normalized = re.sub(r'[^a-z0-9\s]', '', vendor_name.lower())
        normalized = re.sub(r'\s+', ' ', normalized).strip()

        # Remove common suffixes
        for suffix in ['inc', 'ltd', 'llc', 'corp', 'company', 'pvt']:
            normalized = re.sub(rf'\b{suffix}\b', '', normalized)
            normalized = re.sub(r'\s+', ' ', normalized).strip()

        # Generate canonical ID
        canonical_id = f"VENDOR_{uuid.uuid4().hex[:8].upper()}"

        return {
            "canonical_id": canonical_id,
            "normalized_name": normalized,
            "raw_input": vendor_name,
            "first_seen": datetime.now().isoformat()
        }

    @classmethod
    def canonicalize_invoice(cls, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Canonicalize entire invoice data

        Applies standardization to:
        - Dates (any format → YYYY-MM-DD)
        - Times (any format → HH:MM:SS)
        - Currencies (symbols → ISO codes)
        - Amounts (various formats → decimal)
        - Vendor names (variants → canonical ID)
        - All string fields (whitespace normalization)
        """

        try:
            # Canonicalize metadata
            if 'invoice_metadata' in invoice_data:
                meta = invoice_data['invoice_metadata']
                meta['date'] = cls.canonicalize_date(meta.get('date'))
                meta['time'] = cls.canonicalize_time(meta.get('time'))
                meta['due_date'] = cls.canonicalize_date(meta.get('due_date'))
                meta['company_name'] = cls.clean_string(meta.get('company_name'))
                meta['invoice_number'] = cls.clean_string(meta.get('invoice_number'))
                meta['invoice_type'] = cls.clean_string(meta.get('invoice_type'))

            # Canonicalize vendor info
            if 'vendor_info' in invoice_data:
                vendor = invoice_data['vendor_info']
                vendor_canonical = cls.canonicalize_vendor_name(vendor.get('vendor_name'))
                vendor['vendor_name_canonical'] = vendor_canonical
                vendor['vendor_address'] = cls.clean_string(vendor.get('vendor_address'))
                vendor['vendor_tax_id'] = cls.clean_string(vendor.get('vendor_tax_id'))

            # Canonicalize items
            if 'items' in invoice_data and isinstance(invoice_data['items'], list):
                for item in invoice_data['items']:
                    item['item_name'] = cls.clean_string(item.get('item_name'))
                    item['unit'] = cls.clean_string(item.get('unit'))
                    item['quantity'], _ = cls.normalize_currency_amount(item.get('quantity'))
                    item['unit_price'], _ = cls.normalize_currency_amount(item.get('unit_price'))
                    item['line_total'], _ = cls.normalize_currency_amount(item.get('line_total'))

                    # Canonicalize discount data
                    if 'discount' in item and isinstance(item['discount'], dict):
                        discount = item['discount']
                        discount['discount_percent'], _ = cls.normalize_currency_amount(discount.get('discount_percent'))
                        discount['discount_amount'], _ = cls.normalize_currency_amount(discount.get('discount_amount'))
                        discount['actual_price'], _ = cls.normalize_currency_amount(discount.get('actual_price'))
                        discount['discount_price'], _ = cls.normalize_currency_amount(discount.get('discounted_price'))

            # Canonicalize pricing summary
            if 'pricing_summary' in invoice_data:
                pricing = invoice_data['pricing_summary']

                # Amounts
                pricing['subtotal'], _ = cls.normalize_currency_amount(pricing.get('subtotal'))
                pricing['total_amount'], _ = cls.normalize_currency_amount(pricing.get('total_amount'))
                pricing['total_discount'], _ = cls.normalize_currency_amount(pricing.get('total_discount'))

                # Currency
                raw_currency = pricing.get('currency')
                amount_val = pricing.get('total_amount')
                _, detected_currency = cls.normalize_currency_amount(amount_val)
                final_currency = detected_currency or cls.canonicalize_currency_code(raw_currency)
                pricing['currency'] = final_currency

                # Tax
                if 'tax' in pricing and isinstance(pricing['tax'], dict):
                    tax = pricing['tax']
                    tax['tax_percent'], _ = cls.normalize_currency_amount(tax.get('tax_percent'))
                    tax['tax_amount'], _ = cls.normalize_currency_amount(tax.get('tax_amount'))
                    tax['tax_type'] = cls.clean_string(tax.get('tax_type'))

                # Shipping
                if 'shipping' in pricing and isinstance(pricing['shipping'], dict):
                    shipping = pricing['shipping']
                    shipping['shipping_amount'], _ = cls.normalize_currency_amount(shipping.get('shipping_amount'))

            # Canonicalize payment info
            if 'payment_info' in invoice_data:
                payment = invoice_data['payment_info']
                payment['payment_terms'] = cls.clean_string(payment.get('payment_terms'))
                payment['bank_account'] = cls.clean_string(payment.get('bank_account'))
                payment['po_reference'] = cls.clean_string(payment.get('po_reference'))

            logger.info("Invoice canonicalization successful")
            return invoice_data

        except Exception as e:
            logger.error(f"Canonicalization failed: {str(e)}")
            return invoice_data