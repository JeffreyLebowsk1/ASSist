"""Gmail integration router.
All data returned is fetched live from Google's API - nothing is cached to disk."""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from typing import Optional
import httpx

from ..services.session_manager import get_session_manager

router = APIRouter(prefix="/gmail", tags=["gmail"])

GMAIL_API = "https://gmail.googleapis.com/gmail/v1"


def _require_auth(request: Request) -> tuple[str, str]:
    session_manager = get_session_manager()
    session_token = request.cookies.get("session_token")
    if not session_token or not session_manager.exists(session_token):
        raise HTTPException(status_code=401, detail="Not authenticated")
    access_token = session_manager.get(session_token, "access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token")
    return session_token, access_token


@router.get("/messages")
async def list_messages(
    request: Request,
    max_results: int = Query(default=20, le=100),
    query: Optional[str] = Query(default=None),
    label: Optional[str] = Query(default="INBOX"),
):
    """List Gmail messages from the user's mailbox."""
    _, access_token = _require_auth(request)

    params = {"maxResults": max_results}
    if query:
        params["q"] = query
    if label:
        params["labelIds"] = label

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GMAIL_API}/users/me/messages",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Google token expired")
        resp.raise_for_status()
        data = resp.json()

    messages = data.get("messages", [])
    return JSONResponse(content={"messages": messages, "total": len(messages)})


@router.get("/messages/{message_id}")
async def get_message(message_id: str, request: Request, format: str = "metadata"):
    """Get a specific Gmail message.
    
    format: "metadata" (headers only), "full" (full payload), "minimal"
    """
    _, access_token = _require_auth(request)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GMAIL_API}/users/me/messages/{message_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"format": format},
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Google token expired")
        resp.raise_for_status()
        message = resp.json()

    return JSONResponse(content=message)


@router.get("/labels")
async def list_labels(request: Request):
    """List Gmail labels."""
    _, access_token = _require_auth(request)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GMAIL_API}/users/me/labels",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        data = resp.json()

    return JSONResponse(content={"labels": data.get("labels", [])})


@router.post("/draft")
async def create_draft(request: Request):
    """Create a Gmail draft. Body is NOT logged."""
    _, access_token = _require_auth(request)
    body = await request.json()

    import base64
    from email.mime.text import MIMEText

    mime_msg = MIMEText(body.get("body", ""))
    mime_msg["to"] = body.get("to", "")
    mime_msg["subject"] = body.get("subject", "")
    if body.get("cc"):
        mime_msg["cc"] = body["cc"]

    raw = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{GMAIL_API}/users/me/drafts",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={"message": {"raw": raw}},
        )
        resp.raise_for_status()
        draft = resp.json()

    return JSONResponse(content={"draft_id": draft.get("id"), "status": "created"})
