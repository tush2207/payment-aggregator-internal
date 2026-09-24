"""
Central Bank of India - Payment Aggregator & RFQ Portal (PAPG)
End-to-End API Request & Response Encryption Middleware (AES-256-GCM)

Automatically intercepts:
1. Incoming encrypted request payloads -> Decrypts before route handlers execute.
2. Outgoing response payloads -> Encrypts before returning to client.
"""

import json
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import Message

from app.core.encryption import encrypt_data, decrypt_data, CIPHER_PREFIX
from app.core import config

logger = logging.getLogger(__name__)

# Paths that must never be encrypted (docs, static files, health checks, raw crypto sandbox, file uploads & downloads)
EXEMPT_PATHS = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
    "/api/health",
    "/api/system/db-status",
    "/api/crypto/",
    "/static",
    "/assets",
    "/fonts",
    "/dist",
    "/favicon.ico",
    "/robots.txt",
    "/api/files/upload",
    "/api/files/download",
    "/api/files/delete",
    "/api/files",
    "/api/annexures/upload",
    "/api/annexures/download",
)


class EndToEndCryptoMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette Middleware providing transparent AES-256-GCM payload encryption
    and decryption for all API requests and responses.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Check if path is exempt from payload encryption
        is_exempt = any(path == p or path.startswith(p if p.endswith("/") else p + "/") for p in EXEMPT_PATHS)
        if is_exempt:
            return await call_next(request)

        # Bypass multipart/form-data and binary streaming uploads
        content_type = request.headers.get("content-type", "").lower()
        if (
            "multipart/form-data" in content_type
            or "application/octet-stream" in content_type
            or "image/" in content_type
            or "application/pdf" in content_type
        ):
            return await call_next(request)

        # Flag indicating whether the response should be encrypted
        should_encrypt_response = False

        # Header triggers:
        # X-Encrypted-Payload: true, Accept-Encryption: aes256gcm, X-Cipher: aes256gcm
        req_enc_header = request.headers.get("x-encrypted-payload", "").lower() in ("true", "1", "yes")
        accept_enc_header = "aes256gcm" in request.headers.get("accept-encryption", "").lower()
        forced_global = getattr(config, "E2E_PAYLOAD_ENCRYPTION_FORCE", False)

        if req_enc_header or accept_enc_header or forced_global:
            should_encrypt_response = True

        # ─────────────────────────────────────────────────────────────────────
        # 1. INCOMING REQUEST DECRYPTION INTERCEPTION
        # ─────────────────────────────────────────────────────────────────────
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            try:
                raw_body = await request.body()
                if raw_body:
                    try:
                        body_str = raw_body.decode("utf-8").strip()
                    except UnicodeDecodeError:
                        # Raw binary file upload or non-text payload
                        return await call_next(request)

                    decrypted_str = None

                    # Case A: Body starts directly with the CIPHER_PREFIX (e.g. "enc:aes256gcm:...")
                    if body_str.startswith(CIPHER_PREFIX) or body_str.startswith('"enc:aes256gcm:'):
                        clean_cipher = body_str.strip('"')
                        decrypted_str = decrypt_data(clean_cipher)
                        should_encrypt_response = True

                    # Case B: Body is a JSON object containing an encrypted field
                    elif body_str.startswith("{") and body_str.endswith("}"):
                        try:
                            json_obj = json.loads(body_str)
                        except Exception:
                            json_obj = None

                        if isinstance(json_obj, dict):
                            cipher_val = (
                                json_obj.get("encrypted_data")
                                or json_obj.get("payload")
                                or json_obj.get("ciphertext")
                                or json_obj.get("data")
                            )
                            if isinstance(cipher_val, str) and cipher_val.startswith(CIPHER_PREFIX):
                                decrypted_str = decrypt_data(cipher_val)
                                should_encrypt_response = True

                    # If request had X-Encrypted-Payload header and wasn't decrypted by prefix check
                    if decrypted_str is None and req_enc_header and body_str:
                        decrypted_str = decrypt_data(body_str)
                        should_encrypt_response = True

                    # If payload was decrypted, replace the request body for downstream route handlers
                    if decrypted_str is not None:
                        new_bytes = decrypted_str.encode("utf-8")
                        request._body = new_bytes

                        # Re-stream the decrypted payload into the request
                        async def receive_decrypted() -> Message:
                            return {"type": "http.request", "body": new_bytes, "more_body": False}

                        request._receive = receive_decrypted
                    elif forced_global and body_str and not request.headers.get("content-type", "").startswith("multipart/form-data"):
                        # In strict PROD enforcement mode, reject unencrypted requests
                        return JSONResponse(
                            status_code=400,
                            content={
                                "statusCode": 400,
                                "status": "error",
                                "error_code": "ENCRYPTION_REQUIRED",
                                "message": "In PROD mode, all API payloads must be AES-256-GCM encrypted per RBI compliance.",
                                "data": None,
                            },
                        )
            except Exception as exc:
                logger.error(f"[CRYPTO MIDDLEWARE] Decryption error on {request.method} {path}: {exc}")
                return JSONResponse(
                    status_code=400,
                    content={
                        "statusCode": 400,
                        "status": "error",
                        "error_code": "DECRYPTION_FAILED",
                        "message": f"Malformed or tampered encrypted payload: {str(exc)}",
                        "data": None,
                    },
                )

        # ─────────────────────────────────────────────────────────────────────
        # 2. EXECUTE ROUTE HANDLER
        # ─────────────────────────────────────────────────────────────────────
        response = await call_next(request)

        # ─────────────────────────────────────────────────────────────────────
        # 3. OUTGOING RESPONSE ENCRYPTION INTERCEPTION
        # ─────────────────────────────────────────────────────────────────────
        if should_encrypt_response and path.startswith("/api"):
            try:
                # Read response body
                resp_body = [section async for section in response.body_iterator]
                response.body_iterator = iter(resp_body)
                raw_response_bytes = b"".join(resp_body)
                raw_response_str = raw_response_bytes.decode("utf-8")

                # Encrypt the JSON response body
                encrypted_ciphertext = encrypt_data(raw_response_str)

                payload_wrapper = {
                    "encrypted": True,
                    "cipher": "AES-256-GCM",
                    "encrypted_data": encrypted_ciphertext,
                    "original_status": response.status_code
                }

                encrypted_json_bytes = json.dumps(payload_wrapper).encode("utf-8")

                headers = dict(response.headers)
                headers["content-length"] = str(len(encrypted_json_bytes))
                headers["content-type"] = "application/json"
                headers["x-encrypted-payload"] = "true"
                headers["x-cipher"] = "AES-256-GCM"

                return Response(
                    content=encrypted_json_bytes,
                    status_code=response.status_code,
                    headers=headers,
                    media_type="application/json"
                )
            except Exception as exc:
                logger.error(f"[CRYPTO MIDDLEWARE] Response encryption error: {exc}")
                return response

        return response
