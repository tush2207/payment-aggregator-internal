"""
Central Bank of India - Payment Aggregator & RFQ Portal (PAPG)
Banking Security Headers Middleware (RBI & CERT-In Compliant)

Injects mandatory security headers for banking infrastructure:
- Anti-Clickjacking (X-Frame-Options: DENY)
- Anti-MIME Sniffing (X-Content-Type-Options: nosniff)
- Cross-Site Scripting Protection (X-XSS-Protection: 1; mode=block)
- Referrer Policy (strict-origin-when-cross-origin)
- HTTP Strict Transport Security (HSTS)
- Financial Cache-Control on sensitive endpoints
- Content Security Policy (CSP)
"""

from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core import config


class BankingSecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to append RBI & CERT-In compliant HTTP security headers to all responses.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)

        # 1. Anti-Clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # 2. Anti-MIME Sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 3. Legacy XSS Filter Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 4. Referrer Privacy Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 5. Permission Policy
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # 6. Strict Transport Security (HSTS) in PROD mode or over HTTPS
        is_prod = not getattr(config, "DEV_MODE", False)
        if is_prod or request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # 7. Sensitive Banking Endpoint Cache Prevention
        path = request.url.path
        if path.startswith("/api/") or path.startswith("/token") or path.startswith("/dev-login"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"

        # 8. Content Security Policy (Banking Standard)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https: blob:; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' data: https://fonts.gstatic.com; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "connect-src 'self' http: https: ws: wss:;"
        )

        return response
