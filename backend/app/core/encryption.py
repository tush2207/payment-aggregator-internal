"""
Central Bank of India - Payment Aggregator & RFQ Portal (PAPG)
AES-256-GCM Cryptographic Encryption & Decryption Engine

Implements authenticated Galois/Counter Mode (GCM) symmetric encryption
for securing sensitive payloads, quotes, commercial bids, API keys, and bank details.
"""

import os
import json
import base64
import hashlib
import logging
from typing import Optional, Any, Dict, Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core import config

logger = logging.getLogger(__name__)

# Prefix identifier for encrypted ciphertext strings
CIPHER_PREFIX = "enc:aes256gcm:"


def _derive_32byte_key(secret: Optional[str] = None) -> bytes:
    """
    Derives a 256-bit (32-byte) binary cryptographic key from the configured
    secret string using SHA-256 key stretching.
    """
    raw_secret = secret or getattr(config, "ENCRYPTION_KEY", "CBI_PAPG_SECURE_AES256_KEY_2026_PROD#!")
    return hashlib.sha256(raw_secret.encode("utf-8")).digest()


def encrypt_data(plaintext: str, key_secret: Optional[str] = None) -> str:
    """
    Encrypts a plaintext string using AES-256-GCM authenticated encryption.
    Returns a prefixed Base64 string containing: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes).
    """
    if plaintext is None:
        return None
    if not isinstance(plaintext, str):
        plaintext = str(plaintext)

    key = _derive_32byte_key(key_secret)
    aesgcm = AESGCM(key)
    
    # 12-byte cryptographically secure random Nonce / IV (NIST SP 800-38D standard)
    iv = os.urandom(12)
    
    # Encrypt and generate 128-bit authentication tag
    ciphertext_bytes = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    
    # Bundle IV + Ciphertext (which includes the 16-byte GCM tag at the end)
    payload = iv + ciphertext_bytes
    encoded = base64.b64encode(payload).decode("utf-8")
    
    return f"{CIPHER_PREFIX}{encoded}"


def decrypt_data(ciphertext_str: str, key_secret: Optional[str] = None) -> str:
    """
    Decrypts an AES-256-GCM ciphertext string.
    Verifies authenticity and integrity tag before returning decrypted plaintext.
    """
    if ciphertext_str is None:
        return None
    if not isinstance(ciphertext_str, str):
        return str(ciphertext_str)

    # Strip prefix if present
    raw_b64 = ciphertext_str
    if raw_b64.startswith(CIPHER_PREFIX):
        raw_b64 = raw_b64[len(CIPHER_PREFIX):]
    elif raw_b64.startswith("enc:"):
        raw_b64 = raw_b64.split(":", 1)[1]

    try:
        payload = base64.b64decode(raw_b64)
        if len(payload) < 28:  # 12 (IV) + 16 (Tag) minimum
            raise ValueError("Ciphertext too short to contain valid IV and GCM tag.")
        
        iv = payload[:12]
        ciphertext_and_tag = payload[12:]
        
        key = _derive_32byte_key(key_secret)
        aesgcm = AESGCM(key)
        
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext_and_tag, None)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"AES-256 Decryption failure: {e}")
        raise ValueError(f"Decryption failed: Invalid ciphertext or incorrect encryption key. ({e})")


def encrypt_field(value: Optional[Union[str, int, float]]) -> Optional[str]:
    """
    Field-level encryption helper for sensitive database attributes
    (e.g., PAN, GSTIN, Bank Account Numbers).
    """
    if value is None or str(value).strip() == "":
        return None
    return encrypt_data(str(value))


def decrypt_field(value: Optional[str]) -> Optional[str]:
    """
    Field-level decryption helper. Returns plain string if not encrypted.
    """
    if value is None or str(value).strip() == "":
        return None
    val_str = str(value)
    if val_str.startswith("enc:"):
        try:
            return decrypt_data(val_str)
        except Exception:
            return val_str
    return val_str


def encrypt_payload(data_dict: Dict[str, Any], key_secret: Optional[str] = None) -> str:
    """
    Serializes a Python dictionary to JSON and encrypts it using AES-256-GCM.
    """
    json_str = json.dumps(data_dict, ensure_ascii=False, default=str)
    return encrypt_data(json_str, key_secret)


def decrypt_payload(encrypted_payload: str, key_secret: Optional[str] = None) -> Dict[str, Any]:
    """
    Decrypts an AES-256-GCM encrypted payload and deserializes it back to a Python dictionary.
    """
    decrypted_json = decrypt_data(encrypted_payload, key_secret)
    return json.loads(decrypted_json)
