"""Application configuration via environment variables."""
import logging
import secrets
from functools import lru_cache
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# Sentinel to detect whether SECRET_KEY was explicitly provided
_GENERATED_KEY = secrets.token_urlsafe(32)


class Settings(BaseSettings):
    # App
    app_name: str = "ASSist"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # Security
    # IMPORTANT: Set SECRET_KEY explicitly in production via the environment variable.
    # The default is a per-process random value (sessions invalidated on restart).
    secret_key: str = _GENERATED_KEY
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

    def __init__(self, **data):
        super().__init__(**data)
        if not self.debug and self.secret_key == _GENERATED_KEY:
            logger.warning(
                "SECRET_KEY is not set — using a per-process random key. "
                "Sessions will be invalidated on every restart. "
                "Set SECRET_KEY in your .env file for production."
            )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
