import { useEffect, useState } from "react";
import { promPremApi } from "../../services/api";

export default function PromPremAdmin() {
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtreType, setFiltreType] = useState("TOUS");

  useEffect(() => {
    promPremApi
      .listerTout()
      .then((res) => setReponses(res.data))
      .catch(() => setError("Impossible de charger les questionnaires pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  const reponsesFiltrees = filtreType === "TOUS"
    ? reponses
    : reponses.filter((r) => r.type === filtreType);

  const typesDisponibles = [...new Set(reponses.map((r) => r.type))];

  return (
    <>
      <h1 className="page-title">Administration PROM/PREM</h1>
      <p className="page-subtitle">Suivi des questionnaires pour le rapport d'impact annuel.</p>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="card-title" style={{ margin: 0 }}>
            Suivi des questionnaires ({reponsesFiltrees.length})
          </p>
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
            <option value="TOUS">Tous les types</option>
            {typesDisponibles.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && reponsesFiltrees.length === 0 && (
          <p className="empty-state">Aucun questionnaire soumis pour l'instant.</p>
        )}

        {!loading && reponsesFiltrees.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Maman</th>
                <th>Type</th>
                <th>Phase</th>
                <th>Date de soumission</th>
              </tr>
            </thead>
            <tbody>
              {reponsesFiltrees.map((r) => (
                <tr key={r.id}>
                  <td>{r.mamanPrenom} {r.mamanNom}</td>
                  <td>{r.type}</td>
                  <td>{r.phase}</td>
                  <td>{r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
