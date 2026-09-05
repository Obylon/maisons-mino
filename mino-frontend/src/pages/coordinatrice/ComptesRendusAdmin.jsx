import { useEffect, useState } from "react";
import { compteRenduApi } from "../../services/api";

export default function ComptesRendusAdmin() {
  const [comptesRendus, setComptesRendus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    compteRenduApi
      .listerTout()
      .then((res) => setComptesRendus(res.data))
      .catch(() => setError("Impossible de charger les comptes-rendus pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Comptes-rendus d'ateliers</h1>
      <p className="page-subtitle">Vue d'ensemble — tous les professionnels, tous les ateliers.</p>

      <div className="card">
        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && comptesRendus.length === 0 && (
          <p className="empty-state">Aucun compte-rendu rédigé pour l'instant.</p>
        )}

        {!loading && comptesRendus.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comptesRendus.map((c) => (
              <div key={c.id} style={{ border: "1px solid var(--border, #e4e1da)", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <strong>{c.atelierTitre || "Atelier"}</strong>
                  <span style={{ color: "var(--text-muted, #888)" }}>
                    {c.dateRedaction ? new Date(c.dateRedaction).toLocaleDateString("fr-FR") : "—"}
                  </span>
                </div>
                <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13.5 }}>{c.contenu}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
