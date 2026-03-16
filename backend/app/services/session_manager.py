"""In-memory only session manager. No data is persisted to disk.
All session data is lost when the server restarts or session expires."""
import secrets
import threading
import time
from collections import OrderedDict
from typing import Any

from ..config import get_settings


class SessionManager:
    """Thread-safe in-memory session store with automatic expiry.
    
    SECURITY: All data is stored in RAM only. No PII is written to disk.
    Sessions expire after `session_max_age` seconds of inactivity.
    """

    def __init__(self):
        self._store: OrderedDict[str, dict] = OrderedDict()
        self._timestamps: dict[str, float] = {}
        self._lock = threading.Lock()

    @property
    def _settings(self):
        return get_settings()

    def create_session(self) -> str:
        """Create a new session and return its token."""
        with self._lock:
            self._evict_expired_unsafe()
            settings = self._settings
            if len(self._store) >= settings.max_sessions:
                oldest = next(iter(self._store))
                self._delete_unsafe(oldest)
            token = secrets.token_urlsafe(32)
            self._store[token] = {}
            self._timestamps[token] = time.monotonic()
            return token

    def get(self, token: str, key: str, default: Any = None) -> Any:
        """Retrieve a value from a session."""
        with self._lock:
            self._touch_unsafe(token)
            return self._store.get(token, {}).get(key, default)

    def set(self, token: str, key: str, value: Any) -> None:
        """Store a value in a session."""
        with self._lock:
            if token not in self._store:
                return
            self._touch_unsafe(token)
            self._store[token][key] = value

    def delete_session(self, token: str) -> None:
        """Destroy a session and wipe all its data."""
        with self._lock:
            self._delete_unsafe(token)

    def clear_ai_history(self, token: str) -> None:
        """Clear the AI conversation history for a session."""
        with self._lock:
            if token in self._store:
                self._store[token].pop("ai_history", None)

    def _touch_unsafe(self, token: str) -> None:
        if token in self._timestamps:
            self._timestamps[token] = time.monotonic()

    def _delete_unsafe(self, token: str) -> None:
        self._store.pop(token, None)
        self._timestamps.pop(token, None)

    def _evict_expired_unsafe(self) -> None:
        now = time.monotonic()
        max_age = self._settings.session_max_age
        expired = [t for t, ts in self._timestamps.items() if now - ts > max_age]
        for token in expired:
            self._delete_unsafe(token)

    def exists(self, token: str) -> bool:
        with self._lock:
            self._evict_expired_unsafe()
            return token in self._store


# Singleton instance - module-level, in-memory only
_session_manager = SessionManager()


def get_session_manager() -> SessionManager:
    return _session_manager
