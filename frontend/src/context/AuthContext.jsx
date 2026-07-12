import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { clearStoredToken, getStoredToken, setStoredToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setOrganization(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data.user);
      setOrganization(response.data.data.organization);
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("transitops:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("transitops:unauthorized", handleUnauthorized);
  }, [clearSession]);

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data.data;
    setStoredToken(data.token);
    setUser(data.user);
    setOrganization(data.organization);
    return data;
  };

  const register = async ({ organizationName, name, email, password }) => {
    const response = await api.post("/auth/register", { organizationName, name, email, password });
    const data = response.data.data;
    setStoredToken(data.token);
    setUser(data.user);
    setOrganization(data.organization);
    return data;
  };

  const logout = () => {
    clearSession();
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  };

  const value = useMemo(() => ({
    user,
    organization,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    changePassword,
    refreshMe,
  }), [user, organization, loading, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
