"""
Central Bank of India - Payment Aggregator & RFQ Portal (PAPG)
RBI & NPCI Cyber Security Compliance & PII Sanitization Engine

Implements regulatory compliance policies:
1. Reserve Bank of India (RBI) Master Direction on Information Technology Governance & Cyber Security.
2. NPCI Data Security and PII Masking Standards.
3. Audit trail sanitization (preventing plaintext storage of sensitive credentials/PII).
"""

import re
from typing import Any, Dict, List, Union

# Regex patterns for identifying sensitive banking data
PAN_REGEX = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b", re.IGNORECASE)
AADHAAR_REGEX = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
MOBILE_REGEX = re.compile(r"\b(?:\+91|91)?[6-9]\d{9}\b")
CARD_REGEX = re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")
ACCOUNT_NO_REGEX = re.compile(r"\b\d{9,18}\b")

# Sensitive parameter keys to automatically redact in audit logs
SENSITIVE_KEYS = {
    "password", "new_password", "confirm_password", "old_password",
    "access_token", "token", "refresh_token", "authorization",
    "secret", "key", "encryption_key", "captcha_answer",
    "pin", "cvv", "otp"
}


def mask_pan(pan: Optional_Str) -> Optional_Str:
    """Masks PAN Number: ABCDE1234F -> XXXXXX1234F per RBI standards."""
    if not pan or len(str(pan).strip()) < 10:
        return pan
    p = str(pan).strip().upper()
    return f"XXXXXX{p[-4:]}"


def mask_bank_account(account_no: Any) -> str:
    """Masks Bank Account Number: 50200012345678 -> XXXXXXXXXX5678."""
    if not account_no:
        return ""
    acc_str = str(account_no).strip()
    if len(acc_str) <= 4:
        return acc_str
    return f"{'X' * (len(acc_str) - 4)}{acc_str[-4:]}"


def mask_mobile(mobile: Any) -> str:
    """Masks Mobile Number: 9876543210 -> XXXXXX3210."""
    if not mobile:
        return ""
    mob_str = str(mobile).strip()
    clean = re.sub(r"[^\d]", "", mob_str)
    if len(clean) >= 10:
        return f"XXXXXX{clean[-4:]}"
    return clean


def mask_email(email: Optional_Str) -> Optional_Str:
    """Masks Email Address: admin.co@cbi.co.in -> a***o@cbi.co.in."""
    if not email or "@" not in str(email):
        return email
    parts = str(email).split("@")
    name, domain = parts[0], parts[1]
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = f"{name[0]}{'*' * (len(name) - 2)}{name[-1]}"
    return f"{masked_name}@{domain}"


def sanitize_audit_details(details: Union[str, Dict[str, Any], List[Any]]) -> Union[str, Dict[str, Any], List[Any]]:
    """
    Sanitizes log details and audit records to prevent plaintext storage
    of credentials, tokens, or unmasked PII in compliance with RBI guidelines.
    """
    if isinstance(details, dict):
        sanitized = {}
        for k, v in details.items():
            k_lower = str(k).lower()
            if any(s in k_lower for s in SENSITIVE_KEYS):
                sanitized[k] = "[REDACTED_BY_RBI_POLICY]"
            elif "pan" in k_lower and isinstance(v, str):
                sanitized[k] = mask_pan(v)
            elif "account" in k_lower and v:
                sanitized[k] = mask_bank_account(v)
            elif "mobile" in k_lower and v:
                sanitized[k] = mask_mobile(v)
            elif "email" in k_lower and v:
                sanitized[k] = mask_email(v)
            elif isinstance(v, (dict, list)):
                sanitized[k] = sanitize_audit_details(v)
            else:
                sanitized[k] = v
        return sanitized

    elif isinstance(details, list):
        return [sanitize_audit_details(item) for item in details]

    elif isinstance(details, str):
        cleaned = details
        for key in SENSITIVE_KEYS:
            cleaned = re.sub(rf'("{key}"\s*:\s*)"[^"]+"', r'\1"[REDACTED]"', cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(rf"('{key}'\s*:\s*)'[^']+'", r"\1'[REDACTED]'", cleaned, flags=re.IGNORECASE)
        return cleaned

    return details


# Type alias helper
Optional_Str = Union[str, None]
