import { useEffect, useState } from "react";
import { adminApi, atelierApi, groupeApi } from "../../services/api";

const TYPES = ["MENSUEL_STANDARD", "P1_GROSSESSE_PARTENAIRE", "P2_POSTPARTUM_PARTENAIRE", "SEANCE_INDIVIDUELLE_S0"];

export default function AteliersAdmin() {
  const [ateliers, setAteliers] = useState([]);
  const [professionnels, setProfessionnels] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [titre, setTitre] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [dateHeure, setDateHeure] = useState("");
  const [groupeId, setGroupeId] = useState("");
  const [professionnelId, setProfessionnelId] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    Promise.all([atelierApi.lister(), adminApi.listerProfessionnels(), groupeApi.lister()])
      .then(([resAteliers, resProfessionnels, resGroupes]) => {
        setAteliers(resAteliers.data);
        setProfessionnels(resProfessionnels.data);
        setGroupes(resGroupes.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!type) return;
    setEnvoi(true);
    setError("");
    try {
      await atelierApi.creer({
        titre: titre.trim() || null,
        type,
        dateHeure: dateHeure || null,
        groupeId: groupeId || null,
        professionnelId: professionnelId || null,
      });
      setTitre("");
      setDateHeure("");
      setGroupeId("");
      setProfessionnelId("");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Gestion des ateliers</h1>
      <p className="page-subtitle">Planning global, assignation des professionnels.</p>

      <div className="card">
        <p className="card-title">Nouvel atelier</p>
        <form onSubmit={handleCreer}>
          <div className="field">
            <label>Titre</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Atelier sommeil bébé" />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
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
            {envoi ? "Création..." : "Créer l'atelier"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Tous les ateliers</p>
        {loading && <p>Chargement...</p>}
        {!loading && ateliers.length === 0 && <p className="empty-state">Aucun atelier pour l'instant.</p>}
        {!loading && ateliers.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Date</th>
                <th>Professionnel</th>
              </tr>
            </thead>
            <tbody>
              {ateliers.map((a) => (
                <tr key={a.id}>
                  <td>{a.titre ?? "—"}</td>
                  <td>{a.type}</td>
                  <td>{a.dateHeure ? new Date(a.dateHeure).toLocaleString("fr-FR") : "—"}</td>
                  <td>{a.professionnelNom ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
