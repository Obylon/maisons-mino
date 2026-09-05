import { useEffect, useState } from "react";
import { adminApi, conventionApi } from "../../services/api";

export default function ConventionsAdmin() {
  const [conventions, setConventions] = useState([]);
  const [professionnels, setProfessionnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [professionnelId, setProfessionnelId] = useState("");
  const [tarif, setTarif] = useState("75.00");
  const [statut, setStatut] = useState("SIGNEE");
  const [dateSignature, setDateSignature] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    Promise.all([conventionApi.lister(), adminApi.listerProfessionnels()])
      .then(([resConventions, resProfessionnels]) => {
        setConventions(resConventions.data);
        setProfessionnels(resProfessionnels.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!professionnelId) return;
    setEnvoi(true);
    setError("");
    try {
      await conventionApi.creer({
        professionnelId,
        tarif: parseFloat(tarif),
        statut,
        dateSignature: dateSignature || null,
      });
      setProfessionnelId("");
      setDateSignature("");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Conventions de prestation</h1>
      <p className="page-subtitle">Tarifs et statuts contractuels des professionnels.</p>

      <div className="card">
        <p className="card-title">Nouvelle convention</p>
        <form onSubmit={handleCreer}>
          <div className="field">
            <label>Professionnel</label>
            <select value={professionnelId} onChange={(e) => setProfessionnelId(e.target.value)} required>
              <option value="" disabled>— Choisir —</option>
              {professionnels.map((p) => (
                <option key={p.professionnelId} value={p.professionnelId}>
                  {p.prenom} {p.nom} {p.specialite ? `(${p.specialite})` : ""}
                </option>
              ))}
            </select>
            {professionnels.length === 0 && (
              <small className="error-text">Aucun professionnel actif — créez-en un dans Utilisateurs.</small>
            )}
          </div>
          <div className="field">
            <label>Tarif (€)</label>
            <input type="number" step="0.01" value={tarif} onChange={(e) => setTarif(e.target.value)} />
          </div>
          <div className="field">
            <label>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="SIGNEE">Signée</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="RESILIEE">Résiliée</option>
            </select>
          </div>
          <div className="field">
            <label>Date de signature</label>
            <input type="date" value={dateSignature} onChange={(e) => setDateSignature(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Création..." : "Créer la convention"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Conventions existantes ({conventions.length})</p>
        {loading && <p>Chargement...</p>}
        {!loading && conventions.length === 0 && <p className="empty-state">Aucune convention créée pour l'instant.</p>}
        {!loading && conventions.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr><th>Professionnel</th><th>Tarif</th><th>Statut</th><th>Signature</th></tr>
            </thead>
            <tbody>
              {conventions.map((c) => (
                <tr key={c.id}>
                  <td>{c.professionnelNom}</td>
                  <td>{c.tarif} €</td>
                  <td>{c.statut ?? "—"}</td>
                  <td>{c.dateSignature ? new Date(c.dateSignature).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
