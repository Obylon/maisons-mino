import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

/**
 * Une SEULE connexion SSE pour toute l'application (montee une fois au niveau
 * racine dans App.jsx), plutot qu'une connexion par page comme dans la version
 * precedente - evite d'ouvrir/fermer des connexions a chaque navigation.
 *
 * Expose :
 * - notifications : liste des evenements recus depuis la connexion (les plus
 *   recents en premier), pour afficher le contenu de la cloche.
 * - nonLus : nombre de notifications pas encore "vues" (cloche cliquee).
 * - signal : compteur qui s'incremente a chaque evenement - les pages qui
 *   veulent se rafraichir automatiquement (ex: MessagerieGroupe) l'ajoutent
 *   simplement a leurs dependances useEffect, exactement comme avant.
 * - marquerVu() : remet nonLus a 0 (appelee a l'ouverture du menu de la cloche).
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nonLus, setNonLus] = useState(0);
  const [signal, setSignal] = useState(0);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      sourceRef.current?.close();
      return;
    }

    const token = localStorage.getItem("mino_token");
    if (!token) return;

    const source = new EventSource(`${API_URL}/notifications/stream?token=${token}`);
    sourceRef.current = source;

    source.addEventListener("nouveau-message", (e) => {
      setNotifications((prev) => [{ message: e.data, date: Date.now() }, ...prev].slice(0, 20));
      setNonLus((n) => n + 1);
      setSignal((s) => s + 1);
    });

    return () => source.close();
  }, [isAuthenticated]);

  const marquerVu = useCallback(() => setNonLus(0), []);

  return (
    <NotificationContext.Provider value={{ notifications, nonLus, signal, marquerVu }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext doit être utilisé dans un NotificationProvider");
  return ctx;
}
