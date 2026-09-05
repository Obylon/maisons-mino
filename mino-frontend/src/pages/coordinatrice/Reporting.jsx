import { useEffect, useState } from "react";
import { cohorteApi, groupeApi, adminApi, atelierApi, promPremApi } from "../../services/api";

const BarChart = ({ data, labelKey, valueKey, color = "#1e3a52" }) => {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d) => (
        <div key={d[labelKey]} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 140, fontSize: 12.5 }}>{d[labelKey]}</span>
          <div style={{ flex: 1, background: "#f0efec", borderRadius: 6, overflow: "hidden", height: 18 }}>
            <div style={{
              width: `${(d[valueKey] / max) * 100}%`, background: color, height: "100%",
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ width: 30, fontSize: 12.5, textAlign: "right" }}>{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
};

export default function Reporting() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      cohorteApi.lister(),
      groupeApi.lister(),
      adminApi.listerUtilisateurs(),
      atelierApi.lister(),
      promPremApi.listerTout(),
    ])
      .then(([resCohortes, resGroupes, resUtilisateurs, resAteliers, resQuestionnaires]) => {
        const cohortes = resCohortes.data;
        const groupes = resGroupes.data;
        const utilisateurs = resUtilisateurs.data;
        const ateliers = resAteliers.data;
        const questionnaires = resQuestionnaires.data;

        const utilisateursActifs = utilisateurs.filter((u) => u.actif);
        const parRole = ["MAMAN", "PARTENAIRE", "PROFESSIONNEL", "COORDINATRICE"].map((role) => ({
          role,
          nombre: utilisateursActifs.filter((u) => u.role === role).length,
        }));

        const tailleMoyenneGroupe = groupes.length
          ? (groupes.reduce((sum, g) => sum + g.tailleActuelle, 0) / groupes.length).toFixed(1)
          : 0;

        const typesAtelier = [...new Set(ateliers.map((a) => a.type))];
        const parTypeAtelier = typesAtelier.map((type) => ({
          type,
          nombre: ateliers.filter((a) => a.type === type).length,
        }));

        const phases = ["T0", "T1", "T2", "T3", "T4"];
        const parPhase = phases.map((phase) => ({
          phase,
          nombre: questionnaires.filter((q) => q.phase === phase).length,
        }));

        setStats({
          totalCohortes: cohortes.length,
          totalGroupes: groupes.length,
          tailleMoyenneGroupe,
          totalUtilisateursActifs: utilisateursActifs.length,
          totalUtilisateursInactifs: utilisateurs.length - utilisateursActifs.length,
          parRole,
          totalAteliers: ateliers.length,
          parTypeAtelier,
          totalQuestionnaires: questionnaires.length,
          totalProm: questionnaires.filter((q) => q.type === "PROM").length,
          totalPrem: questionnaires.filter((q) => q.type === "PREM").length,
          parPhase,
        });
      })
      .catch(() => setError("Impossible de charger les statistiques pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      <h1 className="page-title">Reporting</h1>
      <p className="page-subtitle">Vue d'ensemble pour le rapport d'impact annuel.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Cohortes", value: stats.totalCohortes },
          { label: "Groupes", value: stats.totalGroupes },
          { label: "Taille moy. groupe", value: stats.tailleMoyenneGroupe },
          { label: "Utilisateurs actifs", value: stats.totalUtilisateursActifs },
          { label: "Ateliers", value: stats.totalAteliers },
          { label: "Questionnaires", value: stats.totalQuestionnaires },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1e3a52" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <p className="card-title">Utilisateurs actifs par rôle</p>
          <BarChart data={stats.parRole} labelKey="role" valueKey="nombre" />
          {stats.totalUtilisateursInactifs > 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted, #888)", marginTop: 10 }}>
              + {stats.totalUtilisateursInactifs} compte{stats.totalUtilisateursInactifs > 1 ? "s" : ""} désactivé{stats.totalUtilisateursInactifs > 1 ? "s" : ""} (non comptés ci-dessus)
            </p>
          )}
        </div>

        <div className="card">
          <p className="card-title">Ateliers par type</p>
          {stats.parTypeAtelier.length === 0 ? (
            <p className="empty-state">Aucun atelier créé pour l'instant.</p>
          ) : (
            <BarChart data={stats.parTypeAtelier} labelKey="type" valueKey="nombre" color="#c98a4b" />
          )}
        </div>
      </div>

      <div className="card">
        <p className="card-title">Questionnaires PROM/PREM par phase</p>
        <p style={{ fontSize: 12.5, color: "var(--text-muted, #888)", marginBottom: 10 }}>
          {stats.totalProm} PROM · {stats.totalPrem} PREM
        </p>
        {stats.totalQuestionnaires === 0 ? (
          <p className="empty-state">Aucun questionnaire soumis pour l'instant.</p>
        ) : (
          <BarChart data={stats.parPhase} labelKey="phase" valueKey="nombre" color="#4f8a6d" />
        )}
      </div>
    </>
  );
}
