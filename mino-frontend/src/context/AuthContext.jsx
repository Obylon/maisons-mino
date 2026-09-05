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
    // data: { token, role, utilisateurId, email, nom, prenom, telephone } — voir AuthDtos.LoginResponse côté backend
    localStorage.setItem("mino_token", data.token);
    localStorage.setItem("mino_user", JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  /**
   * Met a jour les infos de l'utilisateur courant apres une modification de
   * profil (nom/prenom/telephone) - sans ca, la sidebar et le reste de
   * l'app continueraient d'afficher les anciennes infos jusqu'a la
   * prochaine reconnexion.
   */
  const updateUser = useCallback((partialData) => {
    setUser((prev) => {
      const next = { ...prev, ...partialData };
      localStorage.setItem("mino_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mino_token");
    localStorage.removeItem("mino_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}