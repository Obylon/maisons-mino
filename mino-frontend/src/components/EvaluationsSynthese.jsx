import { useEffect, useState } from "react";
import { evaluationApi } from "../services/api";
import Modal from "./Modal";

function Etoiles({ valeur }) {
  const arrondi = Math.round(valeur);
  return (
    <span aria-label={`${valeur.toFixed(1)} sur 5`} style={{ whiteSpace: "nowrap" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= arrondi ? "var(--clay)" : "var(--border)" }}>★</span>
      ))}
      <span style={{ marginLeft: 6, fontSize: 12.5, color: "var(--ink-muted)" }}>{valeur.toFixed(1)}</span>
    </span>
  );
}

const moyenne = (liste, cle) => (liste.length ? liste.reduce((s, x) => s + x[cle] * x.nombreEvaluations, 0)
  / liste.reduce((s, x) => s + x.nombreEvaluations, 0) : 0);

/**
 * Vue des evaluations d'ateliers, commune a la coordinatrice et au professionnel
 * (le backend filtre deja : un professionnel ne recoit que SES ateliers).
 * Les evaluations sont anonymes - aucune identite de maman n'est jamais affichee.
 *
 * parProfessionnel : afficher aussi le recapitulatif par soignant (utile pour la
 * coordinatrice, sans objet pour un professionnel qui ne voit que lui-meme).
 */
export default function EvaluationsSynthese({ parProfessionnel = false }) {
  const [synthese, setSynthese] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [atelierOuvert, setAtelierOuvert] = useState(null);
  const [details, setDetails] = useState([]);

  useEffect(() => {
    evaluationApi
      .synthese()
      .then((res) => setSynthese(res.data))
      .catch(() => setError("Impossible de charger les évaluations pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  const ouvrir = async (atelier) => {
    setAtelierOuvert(atelier);
    setDetails([]);
    try {
      const res = await evaluationApi.parAtelier(atelier.atelierId);
      setDetails(res.data);
    } catch {
      setDetails([]);
    }
  };

  // Recapitulatif par soignant (moyenne ponderee par le nombre d'evaluations)
  const parSoignant = Object.values(
    synthese.reduce((acc, s) => {
      const cle = s.professionnelId || "aucun";
      if (!acc[cle]) acc[cle] = { nom: s.professionnelNom, lignes: [] };
      acc[cle].lignes.push(s);
      return acc;
    }, {})
  ).map((g) => ({
    nom: g.nom,
    total: g.lignes.reduce((s, x) => s + x.nombreEvaluations, 0),
    moyenne: moyenne(g.lignes, "moyenneProfessionnel"),
  }));

  const commentairesDetails = details.filter((d) => d.commentaire && d.commentaire.trim());

  return (
    <>
      {error && <p className="error-text">{error}</p>}
      {loading && <p>Chargement...</p>}

      {!loading && !error && synthese.length === 0 && (
        <div className="card">
          <p className="empty-state">
            Aucune évaluation pour l'instant. Elles apparaissent ici dès que des mamans
            présentes à un atelier donnent leur avis.
          </p>
        </div>
      )}

      {!loading && synthese.length > 0 && (
        <>
          <div className="card-grid" style={{ marginBottom: 18 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <p className="card-title">Utilité des ateliers</p>
              <Etoiles valeur={moyenne(synthese, "moyenneAtelier")} />
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <p className="card-title">{parProfessionnel ? "Soignants (moyenne générale)" : "Votre évaluation"}</p>
              <Etoiles valeur={moyenne(synthese, "moyenneProfessionnel")} />
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <p className="card-title">Avis recueillis</p>
              <p style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
                {synthese.reduce((s, x) => s + x.nombreEvaluations, 0)}
              </p>
            </div>
          </div>

          {parProfessionnel && parSoignant.length > 0 && (
            <div className="card">
              <p className="card-title">Par soignant</p>
              <table className="table-simple">
                <thead>
                  <tr><th>Soignant</th><th>Note moyenne</th><th>Avis</th></tr>
                </thead>
                <tbody>
                  {parSoignant.map((p) => (
                    <tr key={p.nom}>
                      <td>{p.nom}</td>
                      <td><Etoiles valeur={p.moyenne} /></td>
                      <td>{p.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card">
            <p className="card-title">Par atelier</p>
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Atelier</th>
                  {parProfessionnel && <th>Soignant</th>}
                  <th>Note atelier</th>
                  <th>Note soignant</th>
                  <th>Avis</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {synthese.map((s) => (
                  <tr key={s.atelierId}>
                    <td>
                      {s.atelierTitre}
                      {s.dateHeure && (
                        <span style={{ display: "block", fontSize: 12, color: "var(--ink-muted)" }}>
                          {new Date(s.dateHeure).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </td>
                    {parProfessionnel && <td>{s.professionnelNom}</td>}
                    <td><Etoiles valeur={s.moyenneAtelier} /></td>
                    <td><Etoiles valeur={s.moyenneProfessionnel} /></td>
                    <td>{s.nombreEvaluations}</td>
                    <td>
                      <button
                        onClick={() => ouvrir(s)}
                        style={{ border: "none", background: "none", color: "var(--pine)", cursor: "pointer", fontSize: 12.5 }}
                      >
                        Voir les commentaires
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={!!atelierOuvert} onClose={() => setAtelierOuvert(null)} title={atelierOuvert?.atelierTitre || ""}>
        <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 0 }}>
          Les avis sont anonymes.
        </p>
        {commentairesDetails.length === 0 ? (
          <p className="empty-state">Aucun commentaire écrit pour cet atelier.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {commentairesDetails.map((d) => (
              <div key={d.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12 }}>
                <div style={{ display: "flex", gap: 16, fontSize: 12.5, marginBottom: 6 }}>
                  <span>Atelier <Etoiles valeur={d.noteAtelier} /></span>
                  <span>Soignant <Etoiles valeur={d.noteProfessionnel} /></span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5 }}>{d.commentaire}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
