import { useState, useEffect, useCallback } from "react";
import type { AuthState } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    user: null,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAuth({ authenticated: true, user: data.user, loading: false });
      } else {
        setAuth({ authenticated: false, user: null, loading: false });
      }
    } catch {
      setAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    window.location.href = `${API_BASE}/auth/login`;
  };

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setAuth({ authenticated: false, user: null, loading: false });
  };

  return { ...auth, login, logout, checkAuth };
}
