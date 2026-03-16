"""Application configuration via environment variables."""
import secrets
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "ASSist"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # Security
    # Must be set explicitly in production via SECRET_KEY env var.
    # Falls back to a per-process random value in development (invalidates sessions on restart).
    secret_key: str = secrets.token_urlsafe(32)
    session_max_age: int = 3600  # 1 hour
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    frontend_url: str = "http://localhost:5173"
    trusted_hosts: list[str] = ["localhost", "127.0.0.1", "*.local"]

    # Google OAuth2
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/callback"
    google_scopes: list[str] = [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/chat.messages.readonly",
    ]

    # AI Backend (choose: "openai", "ollama", "gemini")
    ai_backend: str = "ollama"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # Session store (in-memory only, no disk persistence)
    max_sessions: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
