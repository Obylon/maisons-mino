import { useEffect, useState } from "react";
import { atelierApi } from "../../services/api";
import Calendar from "../../components/Calendar";
import Modal from "../../components/Modal";

const LABELS_TYPE = {
  MENSUEL_STANDARD: "Atelier mensuel",
  P1_GROSSESSE_PARTENAIRE: "Atelier P1 (grossesse, partenaire)",
  P2_POSTPARTUM_PARTENAIRE: "Atelier P2 (post-partum, partenaire)",
  SEANCE_INDIVIDUELLE_S0: "Séance individuelle S0",
};

export default function PlanningProfessionnel() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jourSelectionne, setJourSelectionne] = useState(null);
  const [ateliersDuJour, setAteliersDuJour] = useState([]);

  useEffect(() => {
    atelierApi
      .mesAteliers()
      .then((res) => setAteliers(res.data))
      .catch(() => setError("Impossible de charger vos ateliers pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  // Regroupe les ateliers par date (YYYY-MM-DD) pour le calendrier
  const evenementsParJour = ateliers.reduce((acc, a) => {
    if (!a.dateHeure) return acc;
    const dateStr = a.dateHeure.slice(0, 10);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(a);
    return acc;
  }, {});

  const handleJourClic = (dateStr, evenements) => {
    setJourSelectionne(dateStr);
    setAteliersDuJour(evenements);
  };

  return (
    <>
      <h1 className="page-title">Mon planning</h1>
      <p className="page-subtitle">
        Vos ateliers à venir — vous ne voyez jamais les ateliers d'un autre professionnel.
        Cliquez sur un jour pour le consulter en détail.
      </p>

      <div className="card">
        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && <Calendar evenementsParJour={evenementsParJour} onJourClic={handleJourClic} />}
      </div>

      <Modal
        open={!!jourSelectionne}
        onClose={() => setJourSelectionne(null)}
        title={jourSelectionne ? new Date(jourSelectionne).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : ""}
      >
        {ateliersDuJour.length === 0 ? (
          <p className="empty-state">Aucun atelier ce jour-là.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ateliersDuJour.map((a) => (
              <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12 }}>
                <strong>{a.titre || LABELS_TYPE[a.type] || a.type}</strong>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
                  {a.dateHeure ? new Date(a.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Heure non fixée"}
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