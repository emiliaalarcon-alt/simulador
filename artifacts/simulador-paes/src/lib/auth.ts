import { useEffect } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export const TOKEN_KEY = "paes_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function initAuth() {
  setAuthTokenGetter(() => {
    return getToken();
  });
}

export function useAuthGuard() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLocation("/admin");
    }
  }, [setLocation]);
}
