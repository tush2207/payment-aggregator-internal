"""
Central Bank of India - Payment Aggregator Portal
Cryptographic API Endpoints (AES-256-GCM Encryption & Decryption)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Any, Dict
from app.core.encryption import (
    encrypt_data,
    decrypt_data,
    encrypt_payload,
    decrypt_payload,
    encrypt_field,
    decrypt_field
)

router = APIRouter(prefix="/api/crypto", tags=["Cryptography & Encryption"])


class EncryptRequest(BaseModel):
    plaintext: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    custom_key: Optional[str] = None


class DecryptRequest(BaseModel):
    ciphertext: str
    custom_key: Optional[str] = None


@router.post("/encrypt")
def api_encrypt_data(req: EncryptRequest):
    """
    Encrypts a plaintext string or JSON payload using AES-256-GCM.
    """
    if req.payload is not None:
        encrypted = encrypt_payload(req.payload, req.custom_key)
        return {
            "success": True,
            "algorithm": "AES-256-GCM",
            "type": "payload",
            "ciphertext": encrypted
        }
    elif req.plaintext is not None:
        encrypted = encrypt_data(req.plaintext, req.custom_key)
        return {
            "success": True,
            "algorithm": "AES-256-GCM",
            "type": "string",
            "ciphertext": encrypted
        }
    else:
        raise HTTPException(status_code=400, detail="Provide either 'plaintext' or 'payload' to encrypt.")


@router.post("/decrypt")
def api_decrypt_data(req: DecryptRequest):
    """
    Decrypts an AES-256-GCM encrypted ciphertext and validates cryptographic integrity.
    """
    try:
        decrypted_str = decrypt_data(req.ciphertext, req.custom_key)
        # Check if it was a JSON payload
        try:
            import json
            parsed_json = json.loads(decrypted_str)
            return {
                "success": True,
                "algorithm": "AES-256-GCM",
                "type": "payload",
                "plaintext": decrypted_str,
                "data": parsed_json
            }
        except Exception:
            return {
                "success": True,
                "algorithm": "AES-256-GCM",
                "type": "string",
                "plaintext": decrypted_str
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Decryption failed: {e}")


@router.get("/demo")
def api_crypto_demo():
    """
    Live interactive demonstration of AES-256-GCM encryption, decryption,
    and anti-tampering verification.
    """
    sample_quote = {
        "aggregator": "Razorpay Software Pvt Ltd",
        "applicationId": 1001,
        "quotedRate": 1.25,
        "panNumber": "AAACR1234F",
        "bankAccountNumber": "50200012345678"
    }

    # 1. Payload Encryption
    encrypted_payload = encrypt_payload(sample_quote)
    
    # 2. Payload Decryption
    decrypted_quote = decrypt_payload(encrypted_payload)

    # 3. Field-level Encryption test
    encrypted_pan = encrypt_field(sample_quote["panNumber"])
    decrypted_pan = decrypt_field(encrypted_pan)

    # 4. Tampering Test (modify one character of ciphertext)
    tampered_ciphertext = encrypted_payload[:-2] + ("X" if encrypted_payload[-2] != "X" else "Y") + encrypted_payload[-1]
    tamper_detected = False
    try:
        decrypt_data(tampered_ciphertext)
    except Exception:
        tamper_detected = True

    return {
        "status": "active",
        "cipher": "AES-256-GCM (Galois/Counter Mode)",
        "keyLengthBits": 256,
        "originalPayload": sample_quote,
        "encryptedCiphertext": encrypted_payload,
        "decryptedResult": decrypted_quote,
        "fieldLevelEncryption": {
            "originalPAN": sample_quote["panNumber"],
            "encryptedPAN": encrypted_pan,
            "decryptedPAN": decrypted_pan
        },
        "integrityVerification": {
            "tamperDetectionPassed": tamper_detected,
            "status": "Cryptographic authentication tag prevents any unauthorized modification."
        }
    }
