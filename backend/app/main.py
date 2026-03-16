"""ASSist - Modular Digital Work Assistant
FastAPI application entry point.

SECURITY NOTES:
- No PII or sensitive content is persisted to disk
- All session data is in-memory (RAM) only
- Sessions expire after inactivity
- Tokens are never logged
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from .config import get_settings
from .middleware.security import NoPIILoggingMiddleware, SecurityHeadersMiddleware
from .routers import auth, ai_assistant, gmail, gdrive

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Modular digital work assistant with Google Workspace integration",
    # Disable API docs in production to reduce attack surface
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

# --- Middleware (order matters: outermost first) ---

# Security headers on every response
app.add_middleware(SecurityHeadersMiddleware)

# No PII logging
app.add_middleware(NoPIILoggingMiddleware)

# CORS - restrict to frontend origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Cookie"],
    expose_headers=[],
)

# Trusted host protection
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.trusted_hosts,
    )

# --- Routers ---
app.include_router(auth.router)
app.include_router(ai_assistant.router)
app.include_router(gmail.router)
app.include_router(gdrive.router)


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and Docker health checks."""
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="warning",  # Minimize log output to avoid accidental PII logging
        access_log=False,     # Disable access log (would log URL params)
    )
