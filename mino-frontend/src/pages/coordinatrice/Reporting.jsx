import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { cohorteApi, groupeApi, adminApi, atelierApi, promPremApi } from "../../services/api";

const COLORS_ROLE = ["#1D4ED8", "#D97706", "#059669", "#7C3AED"];
const COLORS_PHASE = ["#0284C7", "#0D9488", "#4F46E5", "#D97706", "#DC2626"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>{label}</p>
      <p style={{ margin: "2px 0 0", color: "var(--text-secondary)" }}>{payload[0].value} entrée{payload[0].value !== 1 ? "s" : ""}</p>
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
      adminApi.listerUtilisateurs(0, 1000),
      atelierApi.lister(0, 1000),
      promPremApi.listerTout(0, 1000),
    ])
      .then(([resCohortes, resGroupes, resUtilisateurs, resAteliers, resQuestionnaires]) => {
        const cohortes = resCohortes.data;
        const groupes = resGroupes.data;
        const utilisateurs = resUtilisateurs.data.content;
        const ateliers = resAteliers.data.content;
        const questionnaires = resQuestionnaires.data.content;

        const utilisateursActifs = utilisateurs.filter((u) => u.actif);
        const parRole = ["MAMAN", "PARTENAIRE", "PROFESSIONNEL", "COORDINATRICE"].map((role) => ({
          name: role,
          value: utilisateursActifs.filter((u) => u.role === role).length,
        }));

        const tailleMoyenneGroupe = groupes.length
          ? (groupes.reduce((sum, g) => sum + g.tailleActuelle, 0) / groupes.length).toFixed(1)
          : 0;

        const typesAtelier = [...new Set(ateliers.map((a) => a.type))];
        const parTypeAtelier = typesAtelier.map((type) => ({
          name: type,
          value: ateliers.filter((a) => a.type === type).length,
        }));

        const phases = ["T0", "T1", "T2", "T3", "T4"];
        const parPhase = phases.map((phase) => ({
          name: phase,
          value: questionnaires.filter((q) => q.phase === phase).length,
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

  const exportCsv = () => {
    if (!stats) return;
    const rows = [
      ["Indicateur", "Valeur"],
      ["Cohortes", stats.totalCohortes],
      ["Groupes", stats.totalGroupes],
      ["Taille moyenne groupe", stats.tailleMoyenneGroupe],
      ["Utilisateurs actifs", stats.totalUtilisateursActifs],
      ["Utilisateurs inactifs", stats.totalUtilisateursInactifs],
      ["Ateliers total", stats.totalAteliers],
      ["Questionnaires total", stats.totalQuestionnaires],
      ["PROM", stats.totalProm],
      ["PREM", stats.totalPrem],
      [],
      ["Rôle", "Nombre d'utilisateurs actifs"],
      ...stats.parRole.map((r) => [r.name, r.value]),
      [],
      ["Type d'atelier", "Nombre"],
      ...stats.parTypeAtelier.map((r) => [r.name, r.value]),
      [],
      ["Phase questionnaire", "Nombre"],
      ...stats.parPhase.map((r) => [r.name, r.value]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mino-reporting-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>Chargement des statistiques…</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Reporting</h1>
          <p className="page-subtitle">Vue d'ensemble pour le rapport d'impact annuel.</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={exportCsv} style={{ marginTop: 4 }}>⬇ Exporter CSV</button>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Cohortes",            value: stats.totalCohortes },
          { label: "Groupes",             value: stats.totalGroupes },
          { label: "Taille moy. groupe",  value: stats.tailleMoyenneGroupe },
          { label: "Utilisateurs actifs", value: stats.totalUtilisateursActifs },
          { label: "Ateliers",            value: stats.totalAteliers },
          { label: "Questionnaires",      value: stats.totalQuestionnaires },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ textAlign: "center" }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Utilisateurs par rôle — pie */}
        <div className="card">
          <p className="card-title">Utilisateurs actifs par rôle</p>
          {stats.totalUtilisateursActifs === 0 ? (
            <p className="empty-state">Aucun utilisateur actif.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.parRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {stats.parRole.map((_, i) => (
                    <Cell key={i} fill={COLORS_ROLE[i % COLORS_ROLE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "utilisateurs"]} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {stats.totalUtilisateursInactifs > 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              + {stats.totalUtilisateursInactifs} compte{stats.totalUtilisateursInactifs > 1 ? "s" : ""} désactivé{stats.totalUtilisateursInactifs > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Ateliers par type — bar */}
        <div className="card">
          <p className="card-title">Ateliers par type</p>
          {stats.parTypeAtelier.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">Aucun atelier créé</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.parTypeAtelier} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="var(--teal)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* PROM/PREM par phase — bar */}
      <div className="card">
        <p className="card-title">Questionnaires PROM/PREM par phase</p>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8, marginBottom: 16 }}>
          {stats.totalProm} PROM · {stats.totalPrem} PREM
        </p>
        {stats.totalQuestionnaires === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Aucun questionnaire soumis</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.parPhase} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {stats.parPhase.map((_, i) => (
                  <Cell key={i} fill={COLORS_PHASE[i % COLORS_PHASE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
