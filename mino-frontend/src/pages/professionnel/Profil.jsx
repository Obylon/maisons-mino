import { useEffect, useState } from "react";
import ProfilPage from "../../components/ProfilPage";
import { professionnelApi } from "../../services/api";

const SPECIALITES = ["KINESITHERAPEUTE", "SAGE_FEMME", "PSYCHOLOGUE", "SEXOTHERAPEUTE", "DIETETICIENNE"];

export default function ProfilProfessionnel() {
  const [specialite, setSpecialite] = useState("");
  const [statutConventionnement, setStatutConventionnement] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    professionnelApi
      .monProfil()
      .then((res) => {
        setSpecialite(res.data.specialite || SPECIALITES[0]);
        setStatutConventionnement(res.data.statutConventionnement || "");
      })
      .catch(() => setError("Impossible de charger vos informations professionnelles."))
      .finally(() => setLoading(false));
  }, []);

  const handleEnregistrer = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setEnvoi(true);
    try {
      await professionnelApi.mettreAJourProfil({ specialite, statutConventionnement: statutConventionnement.trim() || null });
      setMessage("Informations professionnelles mises à jour.");
    } catch {
      setError("La mise à jour a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const formulaireProfessionnel = (
    <div className="card" style={{ marginTop: 16 }}>
      <p className="card-title">Mes informations professionnelles</p>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <form onSubmit={handleEnregistrer}>
          <div className="field">
            <label>Spécialité</label>
            <select value={specialite} onChange={(e) => setSpecialite(e.target.value)}>
              {SPECIALITES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Statut de conventionnement</label>
            <input
              value={statutConventionnement}
              onChange={(e) => setStatutConventionnement(e.target.value)}
              placeholder="Ex: Conventionné secteur 1"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {message && <p style={{ color: "var(--success)" }}>{message}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}
    </div>
  );

  return <ProfilPage extraForm={formulaireProfessionnel} />;
}