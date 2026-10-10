import { useEffect, useState } from "react";
import { compteRenduApi } from "../../services/api";
import Pagination from "../../components/Pagination";

export default function ComptesRendusAdmin() {
  const [comptesRendus, setComptesRendus] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    compteRenduApi
      .listerTout(page)
      .then((res) => {
        setComptesRendus(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Impossible de charger les comptes-rendus pour le moment."))
      .finally(() => setLoading(false));
  }, [page]);

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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {comptesRendus.map((c) => (
              <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  <strong>{c.atelierTitre || "Atelier"}</strong>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    {c.dateRedaction ? new Date(c.dateRedaction).toLocaleDateString("fr-FR") : "—"}
                    {" · rédigé par "}{c.professionnelNom}
                  </span>
                </div>

                {c.deroule && <p style={{ fontSize: 13.5, margin: "6px 0" }}><strong>Déroulé :</strong> {c.deroule}</p>}
                {c.pointsAttention && <p style={{ fontSize: 13.5, margin: "6px 0" }}><strong>Points d'attention :</strong> {c.pointsAttention}</p>}
                {c.suiviRecommande && <p style={{ fontSize: 13.5, margin: "6px 0" }}><strong>Suivi recommandé :</strong> {c.suiviRecommande}</p>}

                {c.presences && c.presences.length > 0 && (
                  <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 8 }}>
                    Présentes : {c.presences.filter((p) => p.statutPresence === "PRESENT").map((p) => p.prenom).join(", ") || "aucune"}
                    {c.presences.some((p) => p.statutPresence === "ABSENT") && (
                      <> · Absentes : {c.presences.filter((p) => p.statutPresence === "ABSENT").map((p) => p.prenom).join(", ")}</>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </>
  );
}