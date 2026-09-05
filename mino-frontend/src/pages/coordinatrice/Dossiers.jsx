import { useEffect, useState } from "react";
import { dossierApi } from "../../services/api";

export default function Dossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [selectionId, setSelectionId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dossierApi
      .lister()
      .then((res) => setDossiers(res.data))
      .catch(() => setError("Impossible de charger les dossiers pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  const ouvrir = (id) => {
    setSelectionId(id);
    setDetail(null);
    dossierApi.obtenir(id).then((res) => setDetail(res.data)).catch(() => setError("Impossible de charger ce dossier."));
  };

  return (
    <>
      <h1 className="page-title">Dossiers archivés</h1>
      <p className="page-subtitle">
        Trace permanente de l'activité de chaque personne — persiste même après
        suppression de son compte.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div className="card">
          <p className="card-title">Tous les dossiers ({dossiers.length})</p>
          {loading && <p>Chargement...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && dossiers.length === 0 && <p className="empty-state">Aucun dossier généré pour l'instant.</p>}
          {!loading && dossiers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {dossiers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => ouvrir(d.id)}
                  style={{
                    textAlign: "left", padding: "8px 10px", borderRadius: 6, border: "none",
                    cursor: "pointer", background: selectionId === d.id ? "var(--surface-1, #eee)" : "transparent",
                  }}
                >
                  <strong>{d.prenom} {d.nom}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>
                    {d.role} {d.compteSupprime && "· compte supprimé"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <p className="card-title">Détail</p>
          {!detail ? (
            <p className="empty-state">Sélectionnez un dossier dans la liste.</p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "var(--text-muted, #888)", marginBottom: 8 }}>
                Dernière mise à jour : {new Date(detail.dateDerniereMaj).toLocaleString("fr-FR")}
                {detail.compteSupprime && " — le compte d'origine a été supprimé"}
              </p>
              <pre style={{
                whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13,
                background: "var(--surface-1, #f4f4f4)", padding: 12, borderRadius: 8,
              }}>
                {detail.contenu}
              </pre>
            </>
          )}
        </div>
      </div>
    </>
  );
}
