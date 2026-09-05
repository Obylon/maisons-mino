import { useEffect, useState } from "react";
import { atelierApi, compteRenduApi } from "../../services/api";

export default function ComptesRendus() {
  const [ateliers, setAteliers] = useState([]);
  const [comptesRendus, setComptesRendus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [atelierId, setAtelierId] = useState("");
  const [contenu, setContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    Promise.all([atelierApi.mesAteliers(), compteRenduApi.mesComptesRendus()])
      .then(([resAteliers, resComptesRendus]) => {
        setAteliers(resAteliers.data);
        setComptesRendus(resComptesRendus.data);
      })
      .catch(() => setError("Impossible de charger vos données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleRediger = async (e) => {
    e.preventDefault();
    if (!atelierId || !contenu.trim()) return;
    setEnvoi(true);
    setError("");
    try {
      await compteRenduApi.rediger({ atelierId, contenu: contenu.trim() });
      setAtelierId("");
      setContenu("");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La rédaction a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Comptes-rendus</h1>
      <p className="page-subtitle">
        Rédiger un compte-rendu après chaque atelier — réservés à la coordination et à
        vous-même, non visibles par la maman.
      </p>

      <div className="card">
        <p className="card-title">Nouveau compte-rendu</p>
        <form onSubmit={handleRediger}>
          <div className="field">
            <label>Atelier concerné</label>
            <select value={atelierId} onChange={(e) => setAtelierId(e.target.value)} required>
              <option value="" disabled>— Choisir un atelier —</option>
              {ateliers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.titre || a.type} {a.dateHeure ? `— ${new Date(a.dateHeure).toLocaleDateString("fr-FR")}` : ""}
                </option>
              ))}
            </select>
            {ateliers.length === 0 && (
              <small className="error-text">Aucun atelier ne vous est encore assigné.</small>
            )}
          </div>
          <div className="field">
            <label>Contenu</label>
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={5}
              placeholder="Déroulé de la séance, points d'attention, suivi recommandé..."
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Enregistrement..." : "Enregistrer le compte-rendu"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Mes comptes-rendus ({comptesRendus.length})</p>
        {loading && <p>Chargement...</p>}
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
