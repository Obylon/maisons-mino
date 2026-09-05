import { useEffect, useState } from "react";
import { promPremApi, questionnaireModeleApi } from "../../services/api";

const PHASES = ["T0", "T1", "T2", "T3", "T4"];

export default function PromPremMaman() {
  const [reponsesHistorique, setReponsesHistorique] = useState([]);
  const [modeles, setModeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modeleId, setModeleId] = useState("");
  const [type, setType] = useState("");
  const [questions, setQuestions] = useState([]);
  const [reponsesParQuestion, setReponsesParQuestion] = useState({});
  const [texteLibreSecours, setTexteLibreSecours] = useState(""); // si le modele n'a aucune question definie
  const [phase, setPhase] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    Promise.all([promPremApi.mesReponses(), questionnaireModeleApi.listerActifs()])
      .then(([resReponses, resModeles]) => {
        setReponsesHistorique(resReponses.data);
        setModeles(resModeles.data);
        if (resModeles.data.length > 0 && !modeleId) {
          selectionnerModele(resModeles.data[0]);
        }
      })
      .catch(() => setError("Impossible de charger vos questionnaires pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const selectionnerModele = async (modele) => {
    setModeleId(modele.id);
    setType(modele.nom);
    setReponsesParQuestion({});
    setTexteLibreSecours("");
    try {
      const res = await questionnaireModeleApi.listerQuestions(modele.id);
      setQuestions(res.data);
    } catch {
      setQuestions([]);
    }
  };

  const handleChangerModele = (e) => {
    const modele = modeles.find((m) => m.id === e.target.value);
    if (modele) selectionnerModele(modele);
  };

  const handleReponseQuestion = (questionId, valeur) => {
    setReponsesParQuestion((prev) => ({ ...prev, [questionId]: valeur }));
  };

  const handleSoumettre = async (e) => {
    e.preventDefault();
    if (!type) return;
    setEnvoi(true);
    setError("");
    try {
      const contenuReponses = questions.length > 0
        ? JSON.stringify(questions.map((q) => ({
            question: q.texte,
            reponse: reponsesParQuestion[q.id] ?? "",
          })))
        : texteLibreSecours.trim();

      if (!contenuReponses) {
        setError("Merci de répondre avant de soumettre.");
        setEnvoi(false);
        return;
      }

      await promPremApi.soumettre({ type, phase: phase || null, reponses: contenuReponses });
      setReponsesParQuestion({});
      setTexteLibreSecours("");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La soumission a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Mes questionnaires</h1>
      <p className="page-subtitle">Suivi d'impact personnel — PROM, PREM, et autres questionnaires envoyés par la coordination.</p>

      <div className="card">
        <p className="card-title">Nouveau questionnaire</p>
        <form onSubmit={handleSoumettre}>
          <div className="field">
            <label>Type</label>
            <select value={modeleId} onChange={handleChangerModele} required>
              <option value="" disabled>— Choisir un type —</option>
              {modeles.map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
            {modeles.length === 0 && (
              <small className="error-text">Aucun modèle de questionnaire disponible pour l'instant.</small>
            )}
          </div>

          <div className="field">
            <label>Phase (optionnel)</label>
            <select value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value="">— Aucune —</option>
              {PHASES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {questions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "12px 0" }}>
              {questions.map((q) => (
                <div key={q.id} className="field" style={{ margin: 0 }}>
                  <label>{q.texte}</label>

                  {q.type === "TEXTE_LIBRE" && (
                    <textarea
                      rows={3}
                      value={reponsesParQuestion[q.id] ?? ""}
                      onChange={(e) => handleReponseQuestion(q.id, e.target.value)}
                    />
                  )}

                  {q.type === "CHOIX_UNIQUE" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                      {(q.options || "").split(",").map((choix) => (
                        <label key={choix} style={{ fontSize: 13, fontWeight: 400 }}>
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={choix.trim()}
                            checked={reponsesParQuestion[q.id] === choix.trim()}
                            onChange={(e) => handleReponseQuestion(q.id, e.target.value)}
                            style={{ marginRight: 6 }}
                          />
                          {choix.trim()}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "ECHELLE_1_10" && (
                    <select
                      value={reponsesParQuestion[q.id] ?? ""}
                      onChange={(e) => handleReponseQuestion(q.id, e.target.value)}
                    >
                      <option value="" disabled>— Choisir —</option>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ) : (
            modeleId && (
              <div className="field">
                <label>Vos réponses</label>
                <textarea
                  value={texteLibreSecours}
                  onChange={(e) => setTexteLibreSecours(e.target.value)}
                  rows={4}
                  placeholder="Décrivez votre ressenti..."
                />
              </div>
            )
          )}

          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi || modeles.length === 0}>
            {envoi ? "Envoi..." : "Soumettre"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Historique</p>
        {loading && <p>Chargement...</p>}
        {!loading && reponsesHistorique.length === 0 && (
          <p className="empty-state">Aucun questionnaire soumis pour l'instant.</p>
        )}
        {!loading && reponsesHistorique.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Type</th>
                <th>Phase</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reponsesHistorique.map((r) => (
                <tr key={r.id}>
                  <td>{r.type}</td>
                  <td>{r.phase ?? "—"}</td>
                  <td>{r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
