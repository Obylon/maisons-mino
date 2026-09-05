import { useEffect, useState } from "react";
import { mamanApi } from "../../services/api";

export default function Parcours() {
  const [parcours, setParcours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    mamanApi
      .monParcours()
      .then((res) => setParcours(res.data))
      .catch(() => setError("Impossible de charger votre parcours pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error-text">{error}</p>;

  const bebeNe = parcours.ageBebeJours !== null;

  return (
    <>
      <h1 className="page-title">Mon parcours</h1>
      <p className="page-subtitle">14 mois avec Maisons MINO — de M-4 aux 10 mois du bébé.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--pine)" }}>
            {bebeNe ? parcours.ageBebeJours : parcours.semaineGrossesse ?? "—"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>
            {bebeNe
              ? `jour${parcours.ageBebeJours > 1 ? "s" : ""} de bébé`
              : parcours.semaineGrossesse !== null
                ? "semaines de grossesse"
                : "Terme non renseigné"}
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Dates clés de votre parcours</p>
        <table className="table-simple">
          <tbody>
            <tr>
              <td>Entrée dans le parcours (M-4)</td>
              <td>{parcours.dateEntreeParcours ? new Date(parcours.dateEntreeParcours).toLocaleDateString("fr-FR") : "—"}</td>
            </tr>
            <tr>
              <td>Terme de grossesse prévu</td>
              <td>{parcours.dateTermeGrossesse ? new Date(parcours.dateTermeGrossesse).toLocaleDateString("fr-FR") : "—"}</td>
            </tr>
            <tr>
              <td>Naissance du bébé</td>
              <td>{parcours.dateNaissanceBebe ? new Date(parcours.dateNaissanceBebe).toLocaleDateString("fr-FR") : "Pas encore renseignée"}</td>
            </tr>
            <tr>
              <td>Sortie prévue du parcours (10 mois du bébé)</td>
              <td>{parcours.dateSortiePrevue ? new Date(parcours.dateSortiePrevue).toLocaleDateString("fr-FR") : "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}