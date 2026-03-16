"""AI assistant service - session-scoped, no persistent memory.
Conversation history lives only in the server-side session for the duration
of the user's session. No content is written to disk or external databases."""
from __future__ import annotations

from typing import AsyncGenerator, Optional

from ..config import get_settings


class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


SYSTEM_PROMPT = """You are ASSist, a professional work assistant integrated with Google Workspace.
You help with tasks like summarizing emails, drafting responses, analyzing documents, and managing work.
You work with sensitive information (PII, FERPA-protected student records). 
Important rules:
- Never suggest storing PII outside of authorized systems
- Remind users to follow data handling policies when you detect sensitive info
- Be helpful, concise, and professional
- You do not retain memory between sessions
- Current session context is cleared when the user logs out"""


class AIService:
    """Provides AI assistant capabilities.
    
    Supports multiple backends: OpenAI, Ollama (local), Gemini.
    History is passed in per-request (stored in session, not here).
    """

    def __init__(self):
        self.settings = get_settings()

    async def chat(
        self,
        message: str,
        history: list[dict],
        *,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        """Send a message and return the assistant response.
        
        Args:
            message: The user's new message
            history: Conversation history from the session (list of {role, content})
            stream: Whether to stream the response
        """
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history[-20:])  # Keep last 20 messages only
        messages.append({"role": "user", "content": message})

        backend = self.settings.ai_backend
        if backend == "openai":
            return await self._openai_chat(messages, stream=stream)
        elif backend == "gemini":
            return await self._gemini_chat(messages, stream=stream)
        else:
            return await self._ollama_chat(messages, stream=stream)

    async def _openai_chat(self, messages: list[dict], *, stream: bool = False) -> str:
        import httpx

        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.settings.openai_model,
            "messages": messages,
            "max_tokens": 2048,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def _ollama_chat(self, messages: list[dict], *, stream: bool = False) -> str:
        import httpx

        payload = {
            "model": self.settings.ollama_model,
            "messages": messages,
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.settings.ollama_base_url}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]

    async def _gemini_chat(self, messages: list[dict], *, stream: bool = False) -> str:
        import httpx

        # Convert OpenAI-style messages to Gemini format
        contents = []
        for msg in messages:
            if msg["role"] == "system":
                continue  # Gemini handles system prompts differently
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "generationConfig": {"maxOutputTokens": 2048},
        }
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.settings.gemini_model}:generateContent"
            f"?key={self.settings.gemini_api_key}"
        )
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]


def get_ai_service() -> AIService:
    return AIService()
