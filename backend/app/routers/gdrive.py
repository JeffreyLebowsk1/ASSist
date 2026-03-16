"""Google Drive / Docs integration router.
File content is fetched live - no content is cached or stored on disk."""
import re
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from typing import Optional
import httpx

from ..services.session_manager import get_session_manager

router = APIRouter(prefix="/drive", tags=["drive"])

DRIVE_API = "https://www.googleapis.com/drive/v3"
DOCS_EXPORT_URL = "https://docs.google.com/document/d/{id}/export"

# Allowlist for mime_type parameter: only Google Workspace and common types
_ALLOWED_MIME_RE = re.compile(
    r"^(application/vnd\.google-apps\.[a-z]+|application/pdf|text/plain|image/[a-z]+)$"
)


def _sanitize_query(value: str) -> str:
    """Escape Drive query string values to prevent syntax injection."""
    # Strip any characters outside printable ASCII, then escape backslash and single quote
    safe = re.sub(r"[^\x20-\x7E]", "", value)
    return safe.replace("\\", "\\\\").replace("'", "\\'")


def _require_auth(request: Request) -> tuple[str, str]:
    session_manager = get_session_manager()
    session_token = request.cookies.get("session_token")
    if not session_token or not session_manager.exists(session_token):
        raise HTTPException(status_code=401, detail="Not authenticated")
    access_token = session_manager.get(session_token, "access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token")
    return session_token, access_token


@router.get("/files")
async def list_files(
    request: Request,
    query: Optional[str] = Query(default=None, max_length=200),
    page_size: int = Query(default=20, le=100),
    mime_type: Optional[str] = Query(default=None),
):
    """List files from Google Drive."""
    _, access_token = _require_auth(request)

    q_parts = []
    if query:
        q_parts.append(f"name contains '{_sanitize_query(query)}'")
    if mime_type:
        if not _ALLOWED_MIME_RE.match(mime_type):
            raise HTTPException(status_code=400, detail="Invalid mime_type value")
        q_parts.append(f"mimeType='{mime_type}'")
    q_parts.append("trashed=false")

    params = {
        "pageSize": page_size,
        "fields": "files(id,name,mimeType,modifiedTime,size,webViewLink)",
        "q": " and ".join(q_parts),
        "orderBy": "modifiedTime desc",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{DRIVE_API}/files",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Google token expired")
        resp.raise_for_status()
        data = resp.json()

    return JSONResponse(content={"files": data.get("files", [])})


@router.get("/files/{file_id}/metadata")
async def get_file_metadata(file_id: str, request: Request):
    """Get metadata for a specific Drive file."""
    _, access_token = _require_auth(request)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{DRIVE_API}/files/{file_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"fields": "id,name,mimeType,modifiedTime,size,webViewLink,owners"},
        )
        resp.raise_for_status()
        return JSONResponse(content=resp.json())


@router.get("/files/{file_id}/export")
async def export_doc_as_text(file_id: str, request: Request):
    """Export a Google Doc as plain text for AI processing.
    Content is returned to the client, never stored server-side."""
    _, access_token = _require_auth(request)

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            f"{DRIVE_API}/files/{file_id}/export",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"mimeType": "text/plain"},
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="File not found")
        resp.raise_for_status()
        text_content = resp.text

    # Return text content - client processes it, we don't store it
    return JSONResponse(content={"text": text_content, "file_id": file_id})


@router.get("/recent-docs")
async def list_recent_docs(request: Request, limit: int = Query(default=10, le=50)):
    """List recently modified Google Docs."""
    _, access_token = _require_auth(request)

    params = {
        "pageSize": limit,
        "fields": "files(id,name,mimeType,modifiedTime,webViewLink)",
        "q": "mimeType='application/vnd.google-apps.document' and trashed=false",
        "orderBy": "modifiedTime desc",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{DRIVE_API}/files",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    return JSONResponse(content={"docs": data.get("files", [])})
