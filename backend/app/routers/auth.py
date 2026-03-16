"""Google OAuth2 authentication router.
Tokens stored in in-memory session only - never persisted to disk."""
import secrets
from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from typing import Optional

from ..services.google_auth import get_google_auth_service
from ..services.session_manager import get_session_manager
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_session_token(request: Request) -> Optional[str]:
    return request.cookies.get("session_token")


@router.get("/login")
async def login(response: Response):
    """Initiate Google OAuth2 flow."""
    session_manager = get_session_manager()
    auth_service = get_google_auth_service()
    settings = get_settings()

    session_token = session_manager.create_session()
    state = secrets.token_urlsafe(16)
    session_manager.set(session_token, "oauth_state", state)

    auth_url = auth_service.get_authorization_url(state)

    resp = RedirectResponse(url=auth_url)
    resp.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
        max_age=3600,
    )
    return resp


@router.get("/callback")
async def callback(code: str, state: str, request: Request):
    """Handle OAuth2 callback from Google."""
    session_manager = get_session_manager()
    auth_service = get_google_auth_service()

    session_token = _get_session_token(request)
    if not session_token or not session_manager.exists(session_token):
        raise HTTPException(status_code=400, detail="Invalid session")

    stored_state = session_manager.get(session_token, "oauth_state")
    if stored_state != state:
        raise HTTPException(status_code=400, detail="State mismatch - possible CSRF")

    try:
        tokens = await auth_service.exchange_code(code)
        user_info = await auth_service.get_user_info(tokens["access_token"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth exchange failed: {str(e)}")

    # Store in session (memory only)
    session_manager.set(session_token, "access_token", tokens["access_token"])
    session_manager.set(session_token, "refresh_token", tokens.get("refresh_token"))
    session_manager.set(session_token, "user_info", {
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
    })
    session_manager.set(session_token, "authenticated", True)
    session_manager.set(session_token, "oauth_state", None)  # Clear state

    return RedirectResponse(url=get_settings().frontend_url)


@router.get("/me")
async def get_me(request: Request):
    """Return current user info from session."""
    session_manager = get_session_manager()
    session_token = _get_session_token(request)

    if not session_token or not session_manager.exists(session_token):
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not session_manager.get(session_token, "authenticated"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_info = session_manager.get(session_token, "user_info", {})
    return JSONResponse(content={"user": user_info, "authenticated": True})


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout: destroy session (wipes all in-memory data) and revoke token."""
    session_manager = get_session_manager()
    auth_service = get_google_auth_service()

    session_token = _get_session_token(request)
    if session_token and session_manager.exists(session_token):
        access_token = session_manager.get(session_token, "access_token")
        if access_token:
            try:
                await auth_service.revoke_token(access_token)
            except Exception:
                pass  # Best-effort revocation
        session_manager.delete_session(session_token)

    resp = JSONResponse(content={"message": "Logged out"})
    resp.delete_cookie("session_token")
    return resp
