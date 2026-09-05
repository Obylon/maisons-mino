import { createContext, useContext, useState, useCallback } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mino_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, motDePasse) => {
    const { data } = await authApi.login(email, motDePasse);
    // data: { token, role, utilisateurId, nom, prenom } — voir AuthDtos.LoginResponse côté backend
    localStorage.setItem("mino_token", data.token);
    localStorage.setItem("mino_user", JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mino_token");
    localStorage.removeItem("mino_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
