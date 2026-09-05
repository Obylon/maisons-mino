import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Garde-fou côté front — miroir des règles définies dans SecurityConfig (backend).
 * Ce n'est qu'un confort d'UX (cacher des liens/pages inaccessibles) : la vraie
 * barrière de sécurité reste le backend, qui revérifie le rôle sur chaque requête.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
