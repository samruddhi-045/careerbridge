import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setAccessToken } from "../lib/axios";
import { loginRequest, registerRequest, refreshRequest, logoutRequest } from "../features/auth/api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // true until we know if a session exists

  // access token is gone after a refresh (it's only in memory), so try to
  // get a new one using the refresh cookie
  useEffect(() => {
    refreshRequest()
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, []);

  const applySession = (res) => {
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = useCallback((payload) => loginRequest(payload).then(applySession), []);
  const register = useCallback((role, payload) => registerRequest(role, payload).then(applySession), []);

  const logout = useCallback(async () => {
    try { await logoutRequest(); } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};