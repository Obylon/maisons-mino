import { useEffect, useState } from "react";
import { atelierApi, evaluationApi, compteRenduApi } from "../../services/api";
import Calendar from "../../components/Calendar";
import Modal from "../../components/Modal";

const LABELS_TYPE = {
  MENSUEL_STANDARD:          "Atelier mensuel",
  P1_GROSSESSE_PARTENAIRE:   "Atelier P1 (grossesse, partenaire)",
  P2_POSTPARTUM_PARTENAIRE:  "Atelier P2 (post-partum, partenaire)",
  SEANCE_INDIVIDUELLE_S0:    "Séance individuelle S0",
};

function fmt(d, opts) {
  return d ? new Date(d).toLocaleString("fr-FR", opts) : "—";
}

function diffDays(dateHeure) {
  if (!dateHeure) return null;
  return Math.ceil((new Date(dateHeure) - Date.now()) / 86400000);
}

export default function PlanningProfessionnel() {
  const [ateliers, setAteliers]       = useState([]);
  const [synthese, setSynthese]       = useState([]);
  const [comptes, setComptes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [jourSelectionne, setJour]    = useState(null);
  const [ateliersDuJour, setDuJour]   = useState([]);

  useEffect(() => {
    Promise.all([
      atelierApi.mesAteliers(),
      evaluationApi.synthese().catch(() => ({ data: [] })),
      compteRenduApi.mesComptesRendus().catch(() => ({ data: [] })),
    ]).then(([aRes, eRes, cRes]) => {
      setAteliers(aRes.data);
      setSynthese(eRes.data);
      setComptes(cRes.data);
    }).catch(() => setError("Impossible de charger les données."))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const cesMois = ateliers.filter(a => {
    if (!a.dateHeure) return false;
    const d = new Date(a.dateHeure);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  });

  const prochain = ateliers
    .filter(a => a.dateHeure && new Date(a.dateHeure) > now)
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure))[0];

  const moyAtelier = synthese.length
    ? (synthese.reduce((s, e) => s + e.moyenneAtelier, 0) / synthese.length).toFixed(1)
    : null;

  const evenementsParJour = ateliers.reduce((acc, a) => {
    if (!a.dateHeure) return acc;
    const key = a.dateHeure.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const handleJourClic = (dateStr, evts) => { setJour(dateStr); setDuJour(evts); };

  // Prochain atelier — affichage countdown
  const prochainDiff = prochain ? diffDays(prochain.dateHeure) : null;
  const prochainLabel = prochainDiff === null ? "—"
    : prochainDiff === 0 ? "Aujourd'hui !"
    : prochainDiff === 1 ? "Demain"
    : `Dans ${prochainDiff} jours`;

  const stats = [
    {
      icon: "📅",
      label: "Prochain atelier",
      value: prochain ? (prochain.titre || LABELS_TYPE[prochain.type] || prochain.type) : "Aucun prévu",
      sub: prochainDiff !== null ? prochainLabel : null,
      color: "#1D4ED8", bg: "#EFF6FF",
    },
    {
      icon: "📆",
      label: "Ce mois-ci",
      value: `${cesMois.length} atelier${cesMois.length > 1 ? "s" : ""}`,
      sub: cesMois.length > 0 ? `dont ${cesMois.filter(a => new Date(a.dateHeure) > now).length} à venir` : null,
      color: "#065F46", bg: "#ECFDF5",
    },
    {
      icon: "⭐",
      label: "Note moyenne",
      value: moyAtelier !== null ? `${moyAtelier}/5` : "—",
      sub: synthese.length > 0 ? `sur ${synthese.reduce((s, e) => s + e.nombreEvaluations, 0)} évaluations` : "Aucune évaluation",
      color: "#92400E", bg: "#FFFBEB",
    },
    {
      icon: "📝",
      label: "Comptes-rendus",
      value: comptes.length,
      sub: comptes.length > 0 ? `Dernier : ${fmt(comptes[0]?.dateRedaction, { day: "numeric", month: "short" })}` : null,
      color: "#4C1D95", bg: "#F5F3FF",
    },
  ];

  return (
    <>
      <h1 className="page-title">Mon planning</h1>
      <p className="page-subtitle">
        Vos ateliers — cliquez sur un jour pour le consulter en détail.
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, marginBottom: 10,
            }}>{s.icon}</div>
            <p style={{ margin: "0 0 1px", fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>
              {s.value}
            </p>
            {s.sub && <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--ink-muted)" }}>{s.sub}</p>}
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendrier */}
      <div className="card">
        {loading && <p>Chargement…</p>}
        {error  && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <Calendar evenementsParJour={evenementsParJour} onJourClic={handleJourClic} />
        )}
      </div>

      <Modal
        open={!!jourSelectionne}
        onClose={() => setJour(null)}
        title={jourSelectionne
          ? new Date(jourSelectionne).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
          : ""}
      >
        {ateliersDuJour.length === 0 ? (
          <p className="empty-state">Aucun atelier ce jour-là.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ateliersDuJour.map(a => (
              <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12 }}>
                <strong>{a.titre || LABELS_TYPE[a.type] || a.type}</strong>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
                  {fmt(a.dateHeure, { hour: "2-digit", minute: "2-digit" })}
                  {a.dureeMinutes ? ` · ${a.dureeMinutes} min` : ""}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
                  {a.groupeNom ? `Groupe : ${a.groupeNom}` : "Aucun groupe associé"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
