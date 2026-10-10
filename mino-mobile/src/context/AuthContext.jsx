import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync("mino_user").then((stored) => {
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email, motDePasse) => {
    const { data } = await authApi.login(email, motDePasse);
    await SecureStore.setItemAsync("mino_token", data.token);
    await SecureStore.setItemAsync("mino_user", JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("mino_token");
    await SecureStore.deleteItemAsync("mino_user");
    setUser(null);
  }, []);

  const updateUser = useCallback(async (partialData) => {
    setUser((prev) => {
      const next = { ...prev, ...partialData };
      SecureStore.setItemAsync("mino_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
