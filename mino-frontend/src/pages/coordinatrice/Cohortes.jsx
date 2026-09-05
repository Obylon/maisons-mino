import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cohorteApi } from "../../services/api";

export default function Cohortes() {
  const [cohortes, setCohortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    cohorteApi
      .lister()
      .then((res) => setCohortes(res.data))
      .catch(() => setError("Impossible de charger les cohortes pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setEnvoi(true);
    try {
      await cohorteApi.creer({ nom: nom.trim(), ville: ville.trim() || null, dateDebut: dateDebut || null });
      setNom("");
      setVille("");
      setDateDebut("");
      charger();
    } catch {
      setError("La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleSupprimer = async (cohorteId, nomCohorte) => {
    if (!window.confirm(`Supprimer la cohorte "${nomCohorte}" ? Cette action est irréversible.`)) return;
    try {
      await cohorteApi.supprimer(cohorteId);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  return (
    <>
      <h1 className="page-title">Cohortes & groupes</h1>
      <p className="page-subtitle">Création des cohortes, constitution des groupes de 5.</p>

      <div className="card">
        <p className="card-title">Nouvelle cohorte</p>
        <form onSubmit={handleCreer}>
          <div className="field">
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Paris 17e - Cohorte 1" required />
          </div>
          <div className="field">
            <label>Ville</label>
            <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Paris" />
          </div>
          <div className="field">
            <label>Date de début</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Création..." : "Créer la cohorte"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Liste des cohortes</p>
        {loading && <p>Chargement...</p>}
        {!loading && cohortes.length === 0 && <p className="empty-state">Aucune cohorte pour l'instant.</p>}
        {!loading && cohortes.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville</th>
                <th>Début</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cohortes.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/coordinatrice/cohortes/${c.id}`}>{c.nom}</Link></td>
                  <td>{c.ville ?? "—"}</td>
                  <td>{c.dateDebut ? new Date(c.dateDebut).toLocaleDateString("fr-FR") : "—"}</td>
                  <td>
                    <button
                      onClick={() => handleSupprimer(c.id, c.nom)}
                      style={{ border: "none", background: "none", color: "#b23b3b", cursor: "pointer", fontSize: 12 }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
