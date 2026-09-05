import { useState, useRef, useEffect } from "react";
import { useNotificationContext } from "../context/NotificationContext";

function tempsEcoule(date) {
  const secondes = Math.floor((Date.now() - date) / 1000);
  if (secondes < 60) return "à l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  return `il y a ${heures} h`;
}

export default function NotificationBell() {
  const { notifications, nonLus, marquerVu } = useNotificationContext();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClicExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", handleClicExterieur);
    return () => document.removeEventListener("mousedown", handleClicExterieur);
  }, []);

  const toggle = () => {
    setOuvert((v) => !v);
    if (!ouvert) marquerVu();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        style={{
          position: "relative", border: "none", background: "none", cursor: "pointer",
          fontSize: 20, padding: 6, lineHeight: 1,
        }}
      >
        🔔
        {nonLus > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0, background: "#b23b3b", color: "#fff",
            borderRadius: "50%", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}>
            {nonLus > 9 ? "9+" : nonLus}
          </span>
        )}
      </button>

      {ouvert && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", width: 280,
          background: "#fff", border: "1px solid var(--border, #e4e1da)", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 320, overflowY: "auto",
        }}>
          {notifications.length === 0 ? (
            <p style={{ padding: 14, fontSize: 13, color: "var(--text-muted, #888)", margin: 0 }}>
              Aucune notification pour l'instant.
            </p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: i < notifications.length - 1 ? "1px solid var(--border, #eee)" : "none" }}>
                <p style={{ margin: 0, fontSize: 13 }}>{n.message}</p>
                <span style={{ fontSize: 11, color: "var(--text-muted, #888)" }}>{tempsEcoule(n.date)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
