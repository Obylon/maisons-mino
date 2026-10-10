import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { atelierApi, groupeApi, mamanApi, messageApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";

const ACCES_RAPIDE = [
  { to: "/maman/groupe",           emoji: "👥", label: "Mon groupe",            color: "var(--role-maman)",         bg: "var(--role-maman-bg)" },
  { to: "/maman/messagerie",       emoji: "💬", label: "Messagerie groupe",      color: "#0D9488",                  bg: "#F0FDF4" },
  { to: "/maman/messagerie-privee",emoji: "✉️", label: "Messages privés",        color: "#7C3AED",                  bg: "#F5F3FF" },
  { to: "/maman/calendrier",       emoji: "📅", label: "Calendrier ateliers",    color: "#D97706",                  bg: "#FFFBEB" },
  { to: "/maman/evaluer",          emoji: "⭐", label: "Évaluer mes ateliers",   color: "#065F46",                  bg: "#ECFDF5" },
  { to: "/maman/prom-prem",        emoji: "📋", label: "Mes questionnaires",     color: "#92400E",                  bg: "#FFFBEB" },
  { to: "/maman/parcours",         emoji: "🗓️", label: "Mon parcours",           color: "#1B4F8A",                  bg: "#EFF6FF" },
  { to: "/maman/profil",           emoji: "👤", label: "Mon profil",             color: "#475569",                  bg: "#F1F5F9" },
];

export default function MamanAccueil() {
  const { user } = useAuth();
  const [prochainAtelier, setProchainAtelier] = useState(null);
  const [parcours, setParcours] = useState(null);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const [loading, setLoading] = useState(true);
  const { signal } = useNotificationContext();

  useEffect(() => {
    mamanApi.monParcours().then((res) => setParcours(res.data)).catch(() => setParcours(null));

    atelierApi.monCalendrier()
      .then((res) => {
        const maintenant = new Date();
        const prochains = res.data
          .filter((a) => a.dateHeure && new Date(a.dateHeure) >= maintenant)
          .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
        setProchainAtelier(prochains[0] ?? null);
      })
      .catch(() => setProchainAtelier(null));

    groupeApi.monGroupe()
      .then((res) => messageApi.nonLusGroupe(res.data.id))
      .then((res) => setMessagesNonLus(res.data))
      .catch(() => setMessagesNonLus(0))
      .finally(() => setLoading(false));
  }, [signal]);

  const parcoursLabel = () => {
    if (!parcours) return null;
    if (parcours.ageBebeJours !== null)
      return `${parcours.ageBebeJours} jour${parcours.ageBebeJours !== 1 ? "s" : ""} de bébé`;
    if (parcours.semaineGrossesse !== null)
      return `${parcours.semaineGrossesse} semaines de grossesse`;
    return "Terme non renseigné";
  };

  const atelierDate = prochainAtelier
    ? new Date(prochainAtelier.dateHeure).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
    : null;

  const daysUntil = prochainAtelier
    ? Math.ceil((new Date(prochainAtelier.dateHeure) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      {/* Hero */}
      <div className="hero-card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>Espace Maman</div>
        <h1 className="hero-card-title">Bonjour, {user.prenom} 👋</h1>
        <p className="hero-card-sub">
          {parcoursLabel() ? parcoursLabel() : "Bienvenue dans votre espace périnatalité."}
        </p>
        {messagesNonLus > 0 && (
          <Link to="/maman/messagerie" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", textDecoration: "none", color: "#fff", fontSize: 13, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)", marginTop: 4 }}>
            💬 {messagesNonLus} nouveau{messagesNonLus > 1 ? "x" : ""} message{messagesNonLus > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Prochain atelier */}
      {!loading && prochainAtelier && (
        <div className="card" style={{ borderLeft: "4px solid var(--teal)", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p className="card-title" style={{ marginBottom: 4 }}>
                <span style={{ marginRight: 6 }}>📅</span>Prochain atelier
              </p>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                {prochainAtelier.titre || prochainAtelier.type}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{atelierDate}</p>
            </div>
            {daysUntil !== null && (
              <div style={{ textAlign: "center", background: daysUntil <= 2 ? "var(--danger-bg)" : "var(--info-bg)", borderRadius: 10, padding: "10px 16px", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: daysUntil <= 2 ? "var(--danger)" : "var(--info)", lineHeight: 1 }}>
                  {daysUntil}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {daysUntil <= 1 ? "demain" : "jours"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick access grid */}
      <div className="card">
        <p className="card-title">Accès rapide</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {ACCES_RAPIDE.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "16px 12px",
                background: a.bg,
                borderRadius: 10,
                border: `1.5px solid ${a.bg}`,
                textDecoration: "none",
                color: a.color,
                fontSize: 13,
                fontWeight: 600,
                textAlign: "center",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <span style={{ fontSize: 22 }}>{a.emoji}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
