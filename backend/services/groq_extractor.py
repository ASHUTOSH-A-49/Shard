import base64
import json
import logging
from groq import Groq
from typing import Dict, Any, Optional
from config import Config

logger = logging.getLogger(__name__)

class GroqExtractor:
    """Handles Groq API calls for invoice extraction"""

    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model = Config.GROQ_MODEL

    @staticmethod
    def encode_image(file_obj) -> str:
        """Convert uploaded file to base64 string"""
        try:
            # Ensure we are at the start of the file
            file_obj.seek(0)
            return base64.b64encode(file_obj.read()).decode('utf-8')
        except Exception as e:
            logger.error(f"Image encoding failed: {str(e)}")
            raise ValueError(f"Failed to encode image: {str(e)}")

    def get_extraction_prompt(self) -> str:
        """Generate detailed extraction prompt with ALL required fields"""
        return """
Extract invoice data into JSON Supporting Hindi, Marathi, and Gujarati . Fields:
- invoice_metadata: company_name, invoice_number, date(YYYY-MM-DD), time, due_date, invoice_type
- vendor_info: vendor_name, vendor_address, vendor_tax_id, vendor_phone, vendor_email
- items: [item_name, quantity, unit, unit_price, discount{has_discount, discount_amount, discounted_price}, line_total, tax_applicable]
- pricing_summary: subtotal, tax{has_tax, tax_type, tax_amount}, shipping, total_amount, currency
- payment_info: payment_terms, payment_methods, bank_account, po_reference

RULES: 
1. Return ONLY raw JSON. No markdown, no text.
2. Use null for missing fields. 
3. Use numeric types for amounts.
4. check location or address if mentioned in invoice and based on that correct the currency 
"""


    def extract(self, image_base64: str) -> Dict[str, Any]:
        """Call Groq API to extract invoice data with usage tracking"""
        try:
            prompt = self.get_extraction_prompt()

            chat_completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                },
                            },
                        ],
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                # Reverted back to max_tokens for SDK compatibility
                max_tokens=4096, 
            )

            response_text = chat_completion.choices[0].message.content
            extracted_data = json.loads(response_text)
            
            # Capture usage stats for rate-limit management
            usage = chat_completion.usage
            extracted_data["_usage"] = {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens
            }

            logger.info(f"Extraction successful. Tokens used: {usage.total_tokens}")
            return extracted_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Groq response: {str(e)}")
            return {"error": "Invalid JSON response from model"}
        except Exception as e:
            logger.error(f"Groq extraction failed: {str(e)}")
            return {"error": f"Extraction service error: {str(e)}"}

    def validate_response_structure(self, data: Dict) -> tuple[bool, Optional[str]]:
        """Validate that response has required structure"""
        required_keys = ['invoice_metadata', 'items', 'pricing_summary', 'payment_info']

        for key in required_keys:
            if key not in data:
                return False, f"Missing required key: {key}"

        if not isinstance(data.get('items'), list):
            return False, "Items must be a list"

        return True, None