import { useEffect, useState } from "react";
import { conventionApi } from "../../services/api";

export default function ConventionPrestation() {
  const [conventions, setConventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    conventionApi
      .maConvention()
      .then((res) => setConventions(res.data))
      .catch(() => setError("Impossible de charger votre convention pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Convention & facturation</h1>
      <p className="page-subtitle">Suivi de votre convention de prestation (75€/atelier).</p>

      <div className="card">
        <p className="card-title">Votre convention</p>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && conventions.length === 0 && (
          <p className="empty-state">Aucune convention enregistrée pour l'instant.</p>
        )}

        {!loading && conventions.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Tarif</th>
                <th>Statut</th>
                <th>Date de signature</th>
              </tr>
            </thead>
            <tbody>
              {conventions.map((c) => (
                <tr key={c.id}>
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
