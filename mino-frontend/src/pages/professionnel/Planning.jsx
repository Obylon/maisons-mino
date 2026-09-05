import { useEffect, useState } from "react";
import { atelierApi } from "../../services/api";

export default function PlanningProfessionnel() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    atelierApi
      .mesAteliers()
      .then((res) => setAteliers(res.data))
      .catch(() => setError("Impossible de charger vos ateliers pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Mon planning</h1>
      <p className="page-subtitle">
        Vos ateliers à venir — filtrés côté serveur (AtelierController.mesAteliers), vous ne voyez
        jamais les ateliers d'un autre professionnel.
      </p>

      <div className="card">
        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && ateliers.length === 0 && (
          <p className="empty-state">Aucun atelier programmé pour l'instant.</p>
        )}

        {!loading && ateliers.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Date</th>
                <th>Groupe</th>
              </tr>
            </thead>
            <tbody>
              {ateliers.map((a) => (
                <tr key={a.id}>
                  <td>{a.titre}</td>
                  <td>{a.type}</td>
                  <td>{a.dateHeure ? new Date(a.dateHeure).toLocaleString("fr-FR") : "—"}</td>
                  <td>{a.groupeId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
