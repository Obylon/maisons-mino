import { useEffect, useState } from "react";
import { questionnaireModeleApi } from "../../services/api";

const TYPES_QUESTION = [
  { value: "TEXTE_LIBRE", label: "Texte libre" },
  { value: "CHOIX_UNIQUE", label: "Choix unique" },
  { value: "ECHELLE_1_10", label: "Échelle 1 à 10" },
];

export default function QuestionnaireModeles() {
  const [modeles, setModeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [modeleOuvertId, setModeleOuvertId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [texteQuestion, setTexteQuestion] = useState("");
  const [typeQuestion, setTypeQuestion] = useState("TEXTE_LIBRE");
  const [optionsQuestion, setOptionsQuestion] = useState("");

  const charger = () => {
    questionnaireModeleApi
      .lister()
      .then((res) => setModeles(res.data))
      .catch(() => setError("Impossible de charger les modèles pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setEnvoi(true);
    setError("");
    try {
      await questionnaireModeleApi.creer({ nom: nom.trim(), description: description.trim() || null });
      setNom("");
      setDescription("");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La création a échoué (nom peut-être déjà utilisé).");
    } finally {
      setEnvoi(false);
    }
  };

  const handleToggle = async (m) => {
    try {
      if (m.actif) {
        await questionnaireModeleApi.desactiver(m.id);
      } else {
        await questionnaireModeleApi.activer(m.id);
      }
      charger();
    } catch {
      setError("L'opération a échoué.");
    }
  };

  const ouvrirQuestions = async (modeleId) => {
    if (modeleOuvertId === modeleId) {
      setModeleOuvertId(null);
      return;
    }
    setModeleOuvertId(modeleId);
    try {
      const res = await questionnaireModeleApi.listerQuestions(modeleId);
      setQuestions(res.data);
    } catch {
      setError("Impossible de charger les questions.");
    }
  };

  const handleAjouterQuestion = async (e) => {
    e.preventDefault();
    if (!texteQuestion.trim() || !modeleOuvertId) return;
    try {
      await questionnaireModeleApi.ajouterQuestion(modeleOuvertId, {
        texte: texteQuestion.trim(),
        type: typeQuestion,
        options: typeQuestion === "CHOIX_UNIQUE" ? optionsQuestion.trim() : null,
        ordre: questions.length,
      });
      setTexteQuestion("");
      setOptionsQuestion("");
      const res = await questionnaireModeleApi.listerQuestions(modeleOuvertId);
      setQuestions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "L'ajout de la question a échoué.");
    }
  };

  const handleSupprimerQuestion = async (questionId) => {
    try {
      await questionnaireModeleApi.supprimerQuestion(questionId);
      const res = await questionnaireModeleApi.listerQuestions(modeleOuvertId);
      setQuestions(res.data);
    } catch {
      setError("La suppression a échoué.");
    }
  };

  return (
    <>
      <h1 className="page-title">Modèles de questionnaires</h1>
      <p className="page-subtitle">
        PROM et PREM existent par défaut — créez d'autres questionnaires avec leurs
        propres questions (texte libre, choix unique, échelle 1-10).
      </p>

      <div className="card">
        <p className="card-title">Nouveau modèle</p>
        <form onSubmit={handleCreer}>
          <div className="field">
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Satisfaction atelier" required />
          </div>
          <div className="field">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optionnel" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Création..." : "Créer le modèle"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Modèles existants ({modeles.length})</p>
        {loading && <p>Chargement...</p>}
        {!loading && modeles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {modeles.map((m) => (
              <div key={m.id} style={{ border: "1px solid var(--border, #e4e1da)", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{m.nom}</strong>
                    {m.description && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted, #888)" }}>{m.description}</span>}
                    <span style={{ marginLeft: 8, fontSize: 11, color: m.actif ? "#4f8a6d" : "#b23b3b" }}>
                      {m.actif ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                  <div>
                    <button onClick={() => ouvrirQuestions(m.id)} className="btn-primary" style={{ marginRight: 8, fontSize: 12, padding: "4px 10px" }}>
                      {modeleOuvertId === m.id ? "Masquer les questions" : "Gérer les questions"}
                    </button>
                    <button
                      onClick={() => handleToggle(m)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: m.actif ? "#b23b3b" : "#4f8a6d" }}
                    >
                      {m.actif ? "Désactiver" : "Réactiver"}
                    </button>
                  </div>
                </div>

                {modeleOuvertId === m.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border, #e4e1da)" }}>
                    {questions.length === 0 ? (
                      <p className="empty-state" style={{ fontSize: 12.5 }}>Aucune question pour l'instant.</p>
                    ) : (
                      <ol style={{ paddingLeft: 18, marginBottom: 12 }}>
                        {questions.map((q) => (
                          <li key={q.id} style={{ fontSize: 13, marginBottom: 6 }}>
                            {q.texte} <span style={{ color: "var(--text-muted, #888)", fontSize: 11 }}>
                              ({TYPES_QUESTION.find((t) => t.value === q.type)?.label}
                              {q.options ? ` : ${q.options}` : ""})
                            </span>
                            <button
                              onClick={() => handleSupprimerQuestion(q.id)}
                              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "#b23b3b", marginLeft: 8 }}
                            >
                              Supprimer
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}

                    <form onSubmit={handleAjouterQuestion} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input
                        value={texteQuestion}
                        onChange={(e) => setTexteQuestion(e.target.value)}
                        placeholder="Texte de la question"
                        style={{ flex: 2, minWidth: 160 }}
                        required
                      />
                      <select value={typeQuestion} onChange={(e) => setTypeQuestion(e.target.value)} style={{ flex: 1 }}>
                        {TYPES_QUESTION.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      {typeQuestion === "CHOIX_UNIQUE" && (
                        <input
                          value={optionsQuestion}
                          onChange={(e) => setOptionsQuestion(e.target.value)}
                          placeholder="Choix séparés par des virgules"
                          style={{ flex: 2, minWidth: 160 }}
                          required
                        />
                      )}
                      <button className="btn-primary" type="submit" style={{ fontSize: 12 }}>Ajouter</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
