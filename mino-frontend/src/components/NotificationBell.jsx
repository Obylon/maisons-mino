import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from "../context/NotificationContext";

const ROLE_COLORS = {
  groupe:     { bg: "#EFF6FF", color: "#1D4ED8" },
  prive:      { bg: "#F5F3FF", color: "#4C1D95" },
  partenaire: { bg: "#FFFBEB", color: "#92400E" },
  default:    { bg: "#F1F5F9", color: "#475569" },
};

const FIL_LABELS = {
  groupe:     "Messagerie groupe",
  prive:      "Message privé",
  partenaire: "Messagerie partenaires",
};

const FIL_ROUTES = {
  groupe:     "/maman/messagerie",
  prive:      "/maman/messagerie-privee",
  partenaire: "/coordinatrice/messagerie",
};

function tempsEcoule(date) {
  const sec = Math.floor((Date.now() - date) / 1000);
  if (sec < 60)  return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60)  return `il y a ${min} min`;
  return `il y a ${Math.floor(min / 60)} h`;
}

function Initiales({ prenom, fil, size = 32 }) {
  const c = ROLE_COLORS[fil] || ROLE_COLORS.default;
  const letter = (prenom || "?")[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c.bg, color: c.color, border: `1.5px solid ${c.color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 700, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, nonLus, marquerVu } = useNotificationContext();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    setOuvert((v) => {
      if (!v) marquerVu();
      return !v;
    });
  };

  const allerVers = (notif) => {
    const route = FIL_ROUTES[notif.fil];
    if (route) { navigate(route); setOuvert(false); }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bouton cloche */}
      <button
        onClick={toggle}
        aria-label={nonLus > 0 ? `${nonLus} notification(s) non lue(s)` : "Notifications"}
        style={{
          position: "relative",
          width: 40, height: 40,
          border: "1.5px solid var(--border)",
          background: ouvert ? "var(--surface-alt)" : "var(--surface)",
          borderRadius: 10,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          transition: "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary-light)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = ouvert ? "var(--primary-light)" : "var(--border)"}
      >
        🔔
        {nonLus > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            background: "#EF4444", color: "#fff",
            borderRadius: 999, fontSize: 10, fontWeight: 800,
            minWidth: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid var(--bg)",
            animation: "bellPulse 2s infinite",
          }}>
            {nonLus > 99 ? "99+" : nonLus}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {ouvert && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 340,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          boxShadow: "0 12px 40px rgba(10,35,66,0.16)",
          zIndex: 200,
          overflow: "hidden",
          animation: "scaleIn 0.15s ease both",
          transformOrigin: "top right",
        }}>
          {/* En-tête */}
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications</span>
              {nonLus > 0 && (
                <span style={{
                  background: "#EF4444", color: "#fff",
                  borderRadius: 999, fontSize: 10, fontWeight: 800,
                  padding: "1px 7px",
                }}>
                  {nonLus}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={marquerVu}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--primary-light)", fontWeight: 600 }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔕</div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Aucune notification récente</p>
              </div>
            ) : (
              notifications.map((n) => {
                const c = ROLE_COLORS[n.fil] || ROLE_COLORS.default;
                const route = FIL_ROUTES[n.fil];
                const nomComplet = [n.expediteur, n.expediteurNom].filter(Boolean).join(" ");
                return (
                  <div
                    key={n.id}
                    onClick={() => route && allerVers(n)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      display: "flex", gap: 12, alignItems: "flex-start",
                      cursor: route ? "pointer" : "default",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { if (route) e.currentTarget.style.background = "var(--surface-alt)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Initiales prenom={n.expediteur} fil={n.fil} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Ligne 1 : qui + action */}
                      <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                        <strong style={{ fontWeight: 700 }}>{nomComplet}</strong>
                        {" "}vous a envoyé un message
                      </p>
                      {/* Ligne 2 : canal coloré + temps */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: c.color, background: c.bg,
                          padding: "1px 7px", borderRadius: 999,
                        }}>
                          {FIL_LABELS[n.fil] || "Message"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {tempsEcoule(n.date)}
                        </span>
                      </div>
                    </div>
                    {/* Indicateur non-lu */}
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#3B82F6", flexShrink: 0, marginTop: 4,
                    }} />
                  </div>
                );
              })
            )}
          </div>

          {/* Pied */}
          {notifications.length > 0 && (
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border)",
              textAlign: "center",
              background: "var(--surface-alt)",
            }}>
              <button
                onClick={() => { marquerVu(); setOuvert(false); }}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}
              >
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
