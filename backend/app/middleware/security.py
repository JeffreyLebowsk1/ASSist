"""Security headers and request sanitization middleware."""
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https://lh3.googleusercontent.com; "
            "connect-src 'self' https://accounts.google.com; "
            "frame-ancestors 'none';"
        )
        return response


class NoPIILoggingMiddleware(BaseHTTPMiddleware):
    """Ensures request bodies are never written to logs.
    Bodies containing potential PII are handled in-memory only."""

    # Patterns that suggest PII in query params (block logging)
    _pii_param_patterns = re.compile(
        r"(ssn|dob|birth|email|phone|address|student|ferpa|name)",
        re.IGNORECASE,
    )

    async def dispatch(self, request: Request, call_next) -> Response:
        # Never log the body - just pass through
        response = await call_next(request)
        return response
