import { useEffect, useState } from "react";
import { groupeApi } from "../../services/api";

export default function MonGroupe() {
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    groupeApi
      .monGroupe()
      .then((res) => setGroupe(res.data))
      .catch(() => setError("Impossible de charger votre groupe pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Mon groupe</h1>
      <p className="page-subtitle">Les 5 femmes de votre cohorte — l'effet village.</p>

      <div className="card">
        <p className="card-title">Membres du groupe</p>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && groupe && (
          <>
            <p style={{ marginBottom: 12, color: "var(--text-muted, #888)" }}>
              Groupe constitué le{" "}
              {groupe.dateConstitution
                ? new Date(groupe.dateConstitution).toLocaleDateString("fr-FR")
                : "—"}
            </p>
            {groupe.membres.length === 0 ? (
              <p className="empty-state">Aucun membre pour l'instant.</p>
            ) : (
              <ul>
                {groupe.membres.map((m) => (
                  <li key={m.utilisateurId}>{m.prenom}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
