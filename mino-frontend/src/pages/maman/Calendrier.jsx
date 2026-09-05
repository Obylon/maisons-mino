import { useEffect, useState } from "react";
import { atelierApi } from "../../services/api";

export default function Calendrier() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enCours, setEnCours] = useState(null); // id de l'atelier en cours de traitement

  const charger = () => {
    atelierApi
      .monCalendrier()
      .then((res) => setAteliers(res.data))
      .catch(() => setError("Impossible de charger votre calendrier pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleToggleInscription = async (atelier) => {
    setEnCours(atelier.id);
    setError("");
    try {
      if (atelier.inscrite) {
        await atelierApi.seDesinscrire(atelier.id);
      } else {
        await atelierApi.sInscrire(atelier.id);
      }
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "L'opération a échoué.");
    } finally {
      setEnCours(null);
    }
  };

  const labelType = (type) => {
    switch (type) {
      case "MENSUEL_STANDARD": return "Atelier mensuel";
      case "SEANCE_INDIVIDUELLE_S0": return "Séance individuelle";
      default: return type;
    }
  };

  return (
    <>
      <h1 className="page-title">Calendrier des ateliers</h1>
      <p className="page-subtitle">Les ateliers de votre groupe, du parcours de 14 mois.</p>

      <div className="card">
        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && ateliers.length === 0 && (
          <p className="empty-state">
            Aucun atelier programmé pour l'instant — soit vous n'avez pas encore de groupe,
            soit la coordinatrice n'a pas encore planifié d'ateliers.
          </p>
        )}

        {!loading && ateliers.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Atelier</th>
                <th>Date</th>
                <th>Intervenant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ateliers.map((a) => (
                <tr key={a.id}>
                  <td>{a.titre || labelType(a.type)}</td>
                  <td>{a.dateHeure ? new Date(a.dateHeure).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                  <td>{a.professionnelNom ?? "—"}</td>
                  <td>
                    <button
                      className="btn-primary"
                      disabled={enCours === a.id}
                      onClick={() => handleToggleInscription(a)}
                      style={a.inscrite ? { background: "#4f8a6d" } : {}}
                    >
                      {enCours === a.id ? "..." : a.inscrite ? "Inscrite ✓" : "S'inscrire"}
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
