import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cohorteApi, promPremApi, atelierApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const ACTIONS = [
  { to: "/coordinatrice/cohortes",      label: "Cohortes & groupes",      emoji: "🏘️" },
  { to: "/coordinatrice/ateliers",      label: "Ateliers",                 emoji: "📅" },
  { to: "/coordinatrice/utilisateurs",  label: "Utilisateurs",             emoji: "👥" },
  { to: "/coordinatrice/messagerie",    label: "Messagerie partenaires",   emoji: "✉️" },
  { to: "/coordinatrice/prom-prem",     label: "PROM / PREM",              emoji: "📋" },
  { to: "/coordinatrice/reporting",     label: "Reporting",                emoji: "📈" },
];

export default function DashboardCoordinatrice() {
  const { user } = useAuth();
  const [cohortesActives, setCohortesActives] = useState(null);
  const [questionnairesTotal, setQuestionnairesTotal] = useState(null);
  const [ateliersNonPourvus, setAteliersNonPourvus] = useState(null);
  const [totalAteliers, setTotalAteliers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cohorteApi.lister(),
      promPremApi.listerTout(0, 1000),
      atelierApi.lister(0, 1000),
    ])
      .then(([resCohortes, resQuestionnaires, resAteliers]) => {
        setCohortesActives(resCohortes.data.length);
        setQuestionnairesTotal(resQuestionnaires.data.totalElements);
        const maintenant = new Date();
        const ateliers = resAteliers.data.content;
        setTotalAteliers(ateliers.length);
        setAteliersNonPourvus(
          ateliers.filter((a) => !a.professionnelNom && a.dateHeure && new Date(a.dateHeure) >= maintenant).length
        );
      })
      .catch(() => {
        setCohortesActives(0);
        setQuestionnairesTotal(0);
        setAteliersNonPourvus(0);
        setTotalAteliers(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v) => (loading ? "…" : v ?? "—");

  return (
    <>
      {/* Hero */}
      <div className="hero-card" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>Tableau de bord</div>
        <h1 className="hero-card-title">Bonjour, {user?.prenom} 👋</h1>
        <p className="hero-card-sub">Vue d'ensemble sur toutes les cohortes et tous les groupes actifs.</p>
      </div>

      {/* KPIs */}
      <div className="card-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-value">{fmt(cohortesActives)}</div>
          <div className="stat-label">Cohortes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{fmt(totalAteliers)}</div>
          <div className="stat-label">Ateliers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{fmt(questionnairesTotal)}</div>
          <div className="stat-label">Questionnaires soumis</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-value"
            style={{ color: !loading && ateliersNonPourvus > 0 ? "var(--danger)" : undefined }}
          >
            {fmt(ateliersNonPourvus)}
          </div>
          <div className="stat-label">Ateliers sans professionnel</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <p className="card-title">Accès rapide</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "16px 12px",
                background: "var(--surface-alt)",
                borderRadius: 10,
                border: "1.5px solid var(--border)",
                textDecoration: "none",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 500,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-light)";
                e.currentTarget.style.background = "#EEF4FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--surface-alt)";
              }}
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
