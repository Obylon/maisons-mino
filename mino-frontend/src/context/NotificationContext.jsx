import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { groupeApi, messageApi, messagePriveApi } from "../services/api";

const NotificationContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

/**
 * Parse le payload SSE : les backends récents envoient du JSON
 * {"expediteur":"Marie","fil":"groupe","cible":"abc"}.
 * L'ancien format (chaîne brute) est toléré pour rétrocompatibilité.
 */
function parsePayload(raw, eventType) {
  try {
    const p = JSON.parse(raw);
    const filLabels = { groupe: "Messagerie groupe", prive: "Message privé", partenaire: "Messagerie partenaires" };
    return {
      expediteur: p.expediteur || "Quelqu'un",
      expediteurNom: p.expediteurNom || "",
      fil: p.fil || "groupe",
      cible: p.cible || null,
      label: filLabels[p.fil] || "Nouveau message",
    };
  } catch {
    // Ancien format texte brut
    const prenom = raw.replace(/^.*de\s+/i, "").trim() || "Quelqu'un";
    const fil = eventType === "nouveau-message-prive" ? "prive"
              : eventType === "nouveau-message" ? "groupe"
              : "partenaire";
    return { expediteur: prenom, expediteurNom: "", fil, cible: null, label: "Nouveau message" };
  }
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nonLus, setNonLus] = useState(0);
  const [signal, setSignal] = useState(0);
  const [groupeNonLu, setGroupeNonLu] = useState(false);
  const [priveNonLu, setPriveNonLu] = useState(false);
  const [alertePromNonLu, setAlertePromNonLu] = useState(false);
  const sourceRef = useRef(null);

  // Points rouges initiaux (message reçu hors-ligne)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "MAMAN") return;
    groupeApi.monGroupe()
      .then((res) => messageApi.nonLusGroupe(res.data.id))
      .then((res) => setGroupeNonLu(res.data > 0))
      .catch(() => setGroupeNonLu(false));
    messagePriveApi.nonLusTotal()
      .then((res) => setPriveNonLu(res.data > 0))
      .catch(() => setPriveNonLu(false));
  }, [isAuthenticated, user?.role]);

  // Connexion SSE
  useEffect(() => {
    if (!isAuthenticated) {
      sourceRef.current?.close();
      return;
    }
    const token = localStorage.getItem("mino_token");
    if (!token) return;

    const source = new EventSource(`${API_URL}/notifications/stream?token=${token}`);
    sourceRef.current = source;

    const gererEvenement = (type) => (e) => {
      const payload = parsePayload(e.data, type);
      const notif = { ...payload, type, date: Date.now(), id: Date.now() + Math.random() };

      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setNonLus((n) => n + 1);
      setSignal((s) => s + 1);

      if (type === "nouveau-message") setGroupeNonLu(true);
      if (type === "nouveau-message-prive") setPriveNonLu(true);

      // Toast visuel natif (discret, n'interrompt pas)
      if (Notification.permission === "granted") {
        new Notification(`💬 ${payload.expediteur}`, {
          body: payload.label,
          silent: true,
          tag: type,
        });
      }
    };

    source.addEventListener("nouveau-message",       gererEvenement("nouveau-message"));
    source.addEventListener("nouveau-message-prive", gererEvenement("nouveau-message-prive"));
    source.addEventListener("nouvel-atelier",        gererEvenement("nouvel-atelier"));
    source.addEventListener("invitation-evaluation", gererEvenement("invitation-evaluation"));
    source.addEventListener("alerte-prom",           (e) => {
      gererEvenement("alerte-prom")(e);
      setAlertePromNonLu(true);
    });

    return () => source.close();
  }, [isAuthenticated]);

  // Demander permission notifications bureau (une seule fois, discrètement)
  useEffect(() => {
    if (isAuthenticated && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [isAuthenticated]);

  // Titre de l'onglet
  useEffect(() => {
    document.title = nonLus > 0 ? `(${nonLus}) Maisons MINO` : "Maisons MINO";
  }, [nonLus]);

  const marquerVu          = useCallback(() => setNonLus(0), []);
  const marquerGroupeVu    = useCallback(() => setGroupeNonLu(false), []);
  const marquerPriveVu     = useCallback(() => setPriveNonLu(false), []);
  const marquerAlertePromVu = useCallback(() => setAlertePromNonLu(false), []);

  return (
    <NotificationContext.Provider value={{
      notifications, nonLus, signal, marquerVu,
      groupeNonLu, priveNonLu, marquerGroupeVu, marquerPriveVu,
      alertePromNonLu, marquerAlertePromVu,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext doit être utilisé dans un NotificationProvider");
  return ctx;
}
