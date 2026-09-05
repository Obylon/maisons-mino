import { useEffect, useState } from "react";
import { atelierApi } from "../../services/api";

export default function AteliersP1P2() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inscritIds, setInscritIds] = useState(new Set());

  useEffect(() => {
    atelierApi
      .ateliersP1P2()
      .then((res) => setAteliers(res.data))
      .catch(() => setError("Impossible de charger les ateliers pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  const handleInscription = async (atelierId) => {
    try {
      await atelierApi.sInscrire(atelierId);
      setInscritIds((prev) => new Set(prev).add(atelierId));
    } catch (err) {
      setError(err.response?.data?.message || "L'inscription a échoué.");
    }
  };

  return (
    <>
      <h1 className="page-title">Ateliers P1 / P2</h1>
      <p className="page-subtitle">Ateliers dédiés aux pères — grossesse (P1) et post-partum (P2).</p>

      <div className="card">
        <p className="card-title">Calendrier P1/P2</p>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && ateliers.length === 0 && (
          <p className="empty-state">Aucun atelier P1/P2 programmé pour l'instant.</p>
        )}

        {!loading && ateliers.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ateliers.map((a) => (
                <tr key={a.id}>
                  <td>{a.titre ?? "—"}</td>
                  <td>{a.type === "P1_GROSSESSE_PARTENAIRE" ? "P1" : "P2"}</td>
                  <td>{a.dateHeure ? new Date(a.dateHeure).toLocaleString("fr-FR") : "—"}</td>
                  <td>
                    {inscritIds.has(a.id) ? (
                      <span>Inscrit ✓</span>
                    ) : (
                      <button className="btn-primary" onClick={() => handleInscription(a.id)}>
                        S'inscrire
                      </button>
                    )}
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
