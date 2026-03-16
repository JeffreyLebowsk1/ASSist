"""AI assistant router - session-scoped, zero persistent memory.
Conversation history is stored in the in-memory session only."""
from fastapi import APIRouter, Cookie, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from typing import Optional

from ..services.ai_service import get_ai_service
from ..services.session_manager import get_session_manager

router = APIRouter(prefix="/ai", tags=["ai-assistant"])

MAX_MESSAGE_LENGTH = 8000  # Characters


class ChatRequest(BaseModel):
    message: str
    clear_history: bool = False

    @validator("message")
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        if len(v) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message too long (max {MAX_MESSAGE_LENGTH} chars)")
        return v.strip()


def _require_auth(request: Request) -> str:
    session_manager = get_session_manager()
    session_token = request.cookies.get("session_token")
    if not session_token or not session_manager.exists(session_token):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not session_manager.get(session_token, "authenticated"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return session_token


@router.post("/chat")
async def chat(body: ChatRequest, request: Request):
    """Send a message to the AI assistant.
    
    History is session-scoped and never persisted to disk.
    Set clear_history=True to wipe current conversation.
    """
    session_token = _require_auth(request)
    session_manager = get_session_manager()
    ai_service = get_ai_service()

    if body.clear_history:
        session_manager.clear_ai_history(session_token)

    history = session_manager.get(session_token, "ai_history", [])

    try:
        reply = await ai_service.chat(body.message, history)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")

    # Append to in-memory history (session only)
    history = list(history)
    history.append({"role": "user", "content": body.message})
    history.append({"role": "assistant", "content": reply})
    # Keep last 40 messages to avoid unbounded growth
    if len(history) > 40:
        history = history[-40:]
    session_manager.set(session_token, "ai_history", history)

    return JSONResponse(content={"reply": reply, "history_length": len(history)})


@router.delete("/history")
async def clear_history(request: Request):
    """Clear AI conversation history for current session."""
    session_token = _require_auth(request)
    session_manager = get_session_manager()
    session_manager.clear_ai_history(session_token)
    return JSONResponse(content={"message": "Conversation history cleared"})


@router.get("/history")
async def get_history(request: Request):
    """Get current conversation history (current session only)."""
    session_token = _require_auth(request)
    session_manager = get_session_manager()
    history = session_manager.get(session_token, "ai_history", [])
    return JSONResponse(content={"history": history, "count": len(history)})
