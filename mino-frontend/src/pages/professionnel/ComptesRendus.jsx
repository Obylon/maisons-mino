import { useEffect, useState } from "react";
import { atelierApi, compteRenduApi } from "../../services/api";

export default function ComptesRendus() {
  const [ateliers, setAteliers] = useState([]);
  const [comptesRendus, setComptesRendus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [atelierId, setAtelierId] = useState("");
  const [inscrits, setInscrits] = useState([]);
  const [presences, setPresences] = useState({}); // { utilisateurId: "PRESENT" | "ABSENT" }
  const [deroule, setDeroule] = useState("");
  const [pointsAttention, setPointsAttention] = useState("");
  const [suiviRecommande, setSuiviRecommande] = useState("");
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

  const handleChoisirAtelier = async (id) => {
    setAtelierId(id);
    setPresences({});
    if (!id) {
      setInscrits([]);
      return;
    }
    try {
      const res = await atelierApi.listerInscrits(id);
      setInscrits(res.data);
      // Par defaut, tout le monde est marque present - le professionnel decoche les absents
      const defaut = {};
      res.data.forEach((i) => { defaut[i.utilisateurId] = "PRESENT"; });
      setPresences(defaut);
    } catch {
      setInscrits([]);
    }
  };

  const togglePresence = (utilisateurId) => {
    setPresences((prev) => ({
      ...prev,
      [utilisateurId]: prev[utilisateurId] === "PRESENT" ? "ABSENT" : "PRESENT",
    }));
  };

  const handleRediger = async (e) => {
    e.preventDefault();
    if (!atelierId) return;
    setEnvoi(true);
    setError("");
    try {
      await compteRenduApi.rediger({
        atelierId,
        deroule: deroule.trim() || null,
        pointsAttention: pointsAttention.trim() || null,
        suiviRecommande: suiviRecommande.trim() || null,
        presences: Object.entries(presences).map(([utilisateurId, statutPresence]) => ({ utilisateurId, statutPresence })),
      });
      setAtelierId("");
      setInscrits([]);
      setPresences({});
      setDeroule("");
      setPointsAttention("");
      setSuiviRecommande("");
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
        vous-même, non visibles par la maman. Les mamans marquées présentes reçoivent
        une invitation à évaluer l'atelier.
      </p>

      <div className="card">
        <p className="card-title">Nouveau compte-rendu</p>
        <form onSubmit={handleRediger}>
          <div className="field">
            <label>Atelier concerné</label>
            <select value={atelierId} onChange={(e) => handleChoisirAtelier(e.target.value)} required>
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

          {inscrits.length > 0 && (
            <div className="field">
              <label>Présents (décochez les absents)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {inscrits.map((i) => (
                  <label key={i.utilisateurId} style={{ fontSize: 13.5, fontWeight: 400, display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={presences[i.utilisateurId] === "PRESENT"}
                      onChange={() => togglePresence(i.utilisateurId)}
                    />
                    {i.utilisateurNom || "Participante"}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Déroulé de la séance</label>
            <textarea
              value={deroule}
              onChange={(e) => setDeroule(e.target.value)}
              rows={3}
              placeholder="Ce qui a été fait, le format suivi..."
            />
          </div>
          <div className="field">
            <label>Points d'attention</label>
            <textarea
              value={pointsAttention}
              onChange={(e) => setPointsAttention(e.target.value)}
              rows={3}
              placeholder="Difficultés observées, signaux à surveiller..."
            />
          </div>
          <div className="field">
            <label>Suivi recommandé</label>
            <textarea
              value={suiviRecommande}
              onChange={(e) => setSuiviRecommande(e.target.value)}
              rows={3}
              placeholder="Ce qu'il faudrait faire ensuite..."
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
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}