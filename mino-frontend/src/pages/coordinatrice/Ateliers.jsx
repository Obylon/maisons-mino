import { useEffect, useState } from "react";
import { adminApi, atelierApi, groupeApi } from "../../services/api";
import Calendar from "../../components/Calendar";
import Modal from "../../components/Modal";

const TYPES = ["MENSUEL_STANDARD", "P1_GROSSESSE_PARTENAIRE", "P2_POSTPARTUM_PARTENAIRE", "SEANCE_INDIVIDUELLE_S0"];
const LABELS_TYPE = {
  MENSUEL_STANDARD: "Atelier mensuel",
  P1_GROSSESSE_PARTENAIRE: "Atelier P1 (grossesse, partenaire)",
  P2_POSTPARTUM_PARTENAIRE: "Atelier P2 (post-partum, partenaire)",
  SEANCE_INDIVIDUELLE_S0: "Séance individuelle S0",
};

export default function AteliersAdmin() {
  const [ateliers, setAteliers] = useState([]);
  const [professionnels, setProfessionnels] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // mode : null | "jour" (liste du jour) | "form" (creation ou edition)
  const [mode, setMode] = useState(null);
  const [jourSelectionne, setJourSelectionne] = useState(null);
  const [ateliersDuJour, setAteliersDuJour] = useState([]);
  const [atelierEnEdition, setAtelierEnEdition] = useState(null); // null = creation, sinon = edition

  const [titre, setTitre] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [dateHeure, setDateHeure] = useState("");
  const [groupeId, setGroupeId] = useState("");
  const [professionnelId, setProfessionnelId] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    // Taille de page large : le calendrier a besoin de voir tous les ateliers,
    // pas seulement une page de 20 - c'est une vue d'ensemble, pas une liste paginee.
    Promise.all([atelierApi.lister(0, 1000), adminApi.listerProfessionnels(), groupeApi.lister()])
      .then(([resAteliers, resProfessionnels, resGroupes]) => {
        setAteliers(resAteliers.data.content);
        setProfessionnels(resProfessionnels.data);
        setGroupes(resGroupes.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const evenementsParJour = ateliers.reduce((acc, a) => {
    if (!a.dateHeure) return acc;
    const dateStr = a.dateHeure.slice(0, 10);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(a);
    return acc;
  }, {});

  const reinitialiserFormulaire = () => {
    setTitre(""); setType(TYPES[0]); setDateHeure(""); setGroupeId(""); setProfessionnelId(""); setError("");
  };

  const handleJourClic = (dateStr, evenements) => {
    setJourSelectionne(dateStr);
    setAteliersDuJour(evenements);
    setMode("jour");
  };

  const ouvrirCreationDepuisJour = () => {
    reinitialiserFormulaire();
    setAtelierEnEdition(null);
    setDateHeure(`${jourSelectionne}T09:00`);
    setMode("form");
  };

  const ouvrirCreationVide = () => {
    reinitialiserFormulaire();
    setAtelierEnEdition(null);
    setMode("form");
  };

  const ouvrirEdition = (atelier) => {
    setAtelierEnEdition(atelier);
    setTitre(atelier.titre || "");
    setType(atelier.type);
    setDateHeure(atelier.dateHeure ? atelier.dateHeure.slice(0, 16) : "");
    setGroupeId(atelier.groupeId || "");
    setProfessionnelId(atelier.professionnelId || "");
    setError("");
    setMode("form");
  };

  const fermerTout = () => {
    setMode(null);
    setJourSelectionne(null);
    setAtelierEnEdition(null);
  };

  const handleEnregistrer = async (e) => {
    e.preventDefault();
    if (!type) return;
    setEnvoi(true);
    setError("");
    const payload = {
      titre: titre.trim() || null,
      type,
      dateHeure: dateHeure || null,
      groupeId: groupeId || null,
      professionnelId: professionnelId || null,
    };
    try {
      if (atelierEnEdition) {
        await atelierApi.modifier(atelierEnEdition.id, payload);
      } else {
        await atelierApi.creer(payload);
      }
      fermerTout();
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "L'enregistrement a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleSupprimer = async (atelier) => {
    if (!window.confirm(`Supprimer "${atelier.titre || LABELS_TYPE[atelier.type]}" ? Cette action est irréversible.`)) return;
    try {
      await atelierApi.supprimer(atelier.id);
      fermerTout();
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Gestion des ateliers</h1>
          <p className="page-subtitle">Cliquez sur un jour pour voir, ajouter, modifier ou supprimer un atelier.</p>
        </div>
        <button className="btn-primary" onClick={ouvrirCreationVide}>+ Nouvel atelier</button>
      </div>

      <div className="card">
        {loading && <p>Chargement...</p>}
        {!loading && <Calendar evenementsParJour={evenementsParJour} onJourClic={handleJourClic} />}
      </div>

      {/* Vue "jour" : liste des ateliers de la journee choisie */}
      <Modal
        open={mode === "jour"}
        onClose={fermerTout}
        title={jourSelectionne ? new Date(jourSelectionne).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : ""}
      >
        {ateliersDuJour.length === 0 ? (
          <p className="empty-state">Aucun atelier ce jour-là.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {ateliersDuJour.map((a) => (
              <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12 }}>
                <strong>{a.titre || LABELS_TYPE[a.type] || a.type}</strong>
                <p style={{ margin: "6px 0", fontSize: 13, color: "var(--ink-muted)" }}>
                  {a.dateHeure ? new Date(a.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Heure non fixée"}
                  {" · "}{a.professionnelNom ?? "Aucun professionnel"}
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => ouvrirEdition(a)} style={{ border: "none", background: "none", color: "var(--pine)", cursor: "pointer", fontSize: 12.5 }}>
                    Modifier
                  </button>
                  <button onClick={() => handleSupprimer(a)} style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12.5 }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn-primary" onClick={ouvrirCreationDepuisJour}>+ Ajouter un atelier ce jour</button>
      </Modal>

      {/* Vue "form" : creation ou edition d'un atelier */}
      <Modal open={mode === "form"} onClose={fermerTout} title={atelierEnEdition ? "Modifier l'atelier" : "Nouvel atelier"}>
        <form onSubmit={handleEnregistrer}>
          <div className="field">
            <label>Titre</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Atelier sommeil bébé" autoFocus />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{LABELS_TYPE[t]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date et heure</label>
            <input type="datetime-local" value={dateHeure} onChange={(e) => setDateHeure(e.target.value)} />
          </div>
          <div className="field">
            <label>Groupe (requis pour un atelier mensuel)</label>
            <select value={groupeId} onChange={(e) => setGroupeId(e.target.value)}>
              <option value="">— Aucun —</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom || "Groupe sans nom"} ({g.cohorteNom})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Professionnel</label>
            <select value={professionnelId} onChange={(e) => setProfessionnelId(e.target.value)}>
              <option value="">— Aucun —</option>
              {professionnels.map((p) => (
                <option key={p.professionnelId} value={p.professionnelId}>
                  {p.prenom} {p.nom} {p.specialite ? `(${p.specialite})` : ""}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Enregistrement..." : atelierEnEdition ? "Enregistrer les modifications" : "Créer l'atelier"}
          </button>
        </form>
      </Modal>
    </>
  );
}