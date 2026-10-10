import { useEffect, useState } from "react";
import { promPremApi } from "../../services/api";
import { EPDS, PREM_QUESTIONS, PHASES, scoreEPDS, interpretationEPDS } from "../../data/questionnaires";

// ─── Composants de questions ──────────────────────────────────────────────────
function QuestionChoix({ question, valeur, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {question.options.map((opt, i) => {
        const sel = valeur === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              border: sel ? "2px solid var(--primary-light)" : "2px solid var(--border)",
              background: sel ? "rgba(59,130,246,0.06)" : "var(--surface)",
              color: "var(--text-primary)",
              fontSize: 14, fontWeight: sel ? 600 : 400,
              textAlign: "left", cursor: "pointer",
              transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: sel ? "6px solid var(--primary-light)" : "2px solid var(--border-strong)",
              flexShrink: 0, transition: "all 0.12s",
            }} />
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function QuestionEchelle({ question, valeur, onChange }) {
  const notes = Array.from({ length: question.max - question.min + 1 }, (_, i) => i + question.min);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {notes.map(n => {
          const sel = valeur === n;
          const color = n <= 4 ? "#DC2626" : n <= 6 ? "#D97706" : n <= 8 ? "#3B82F6" : "#059669";
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                width: 52, height: 52, borderRadius: 12,
                border: sel ? `2px solid ${color}` : "2px solid var(--border)",
                background: sel ? color : "var(--surface)",
                color: sel ? "#fff" : "var(--text-secondary)",
                fontSize: 17, fontWeight: 700, cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "0 4px" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Très insatisfaite</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Excellent</span>
      </div>
    </div>
  );
}

function QuestionTexte({ question, valeur, onChange }) {
  return (
    <textarea
      value={valeur || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={question.placeholder}
      rows={4}
      style={{
        width: "100%", padding: "13px 16px",
        border: "1.5px solid var(--border)", borderRadius: 12,
        fontSize: 14, resize: "vertical", background: "var(--bg)",
        color: "var(--text-primary)", lineHeight: 1.6, fontFamily: "inherit",
        outline: "none", transition: "border-color 0.15s",
      }}
      onFocus={e => (e.target.style.borderColor = "var(--primary-light)")}
      onBlur={e  => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

// ─── Barre de progression ──────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Question {current} sur {total}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-light)" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#1B4F8A,#3B82F6)", borderRadius: 999, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

// ─── Historique ───────────────────────────────────────────────────────────────
function HistoriqueItem({ r }) {
  let score = null;
  let interp = null;
  try {
    const parsed = JSON.parse(r.reponses);
    if (r.type === "PROM" && Array.isArray(parsed)) {
      // Reconstruit le score depuis les reponses sauvegardées
      const repMap = {};
      parsed.forEach(item => { if (item.questionId) repMap[item.questionId] = item.valeur; });
      const s = EPDS.reduce((tot, q) => {
        const v = repMap[q.id];
        return v !== undefined ? tot + (q.reverse ? 3 - v : v) : tot;
      }, 0);
      score = s;
      interp = interpretationEPDS(s);
    }
  } catch { /* reponses en texte libre */ }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: r.type === "PROM" ? "#EFF6FF" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {r.type === "PROM" ? "🧠" : "⭐"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{r.type}</span>
          {r.phase && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary-light)", background: "#EFF6FF", padding: "2px 8px", borderRadius: 999 }}>{r.phase}</span>}
          {interp && <span style={{ fontSize: 11, fontWeight: 600, color: interp.color, background: interp.bg, padding: "2px 8px", borderRadius: 999 }}>{interp.icon} {interp.label}</span>}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </span>
      </div>
      {score !== null && (
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: interp?.color }}>{score}</p>
          <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)" }}>/ 30</p>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PromPremMaman() {
  const [onglet, setOnglet] = useState("PROM"); // "PROM" | "PREM"
  const [phase, setPhase] = useState("");
  const [etape, setEtape] = useState(0);        // 0=intro, 1..N=questions, N+1=résultat
  const [reponses, setReponses] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loadHist, setLoadHist] = useState(true);

  const questions = onglet === "PROM" ? EPDS : PREM_QUESTIONS;
  const total = questions.length;
  const qActuelle = etape >= 1 && etape <= total ? questions[etape - 1] : null;

  // Charger historique
  useEffect(() => {
    promPremApi.mesReponses()
      .then(res => setHistorique(res.data))
      .catch(() => {})
      .finally(() => setLoadHist(false));
  }, [resultat]);

  const reset = () => {
    setEtape(0);
    setReponses({});
    setResultat(null);
    setErreur("");
  };

  const changerOnglet = (t) => {
    setOnglet(t);
    reset();
  };

  const repondre = (val) => {
    if (!qActuelle) return;
    setReponses(prev => ({ ...prev, [qActuelle.id]: val }));
  };

  const validerEtape = () => {
    if (etape === 0) { setEtape(1); return; }
    if (etape < total) { setEtape(e => e + 1); return; }
    // Dernière question → soumettre
    soumettre();
  };

  const reponseActuelle = qActuelle ? reponses[qActuelle.id] : undefined;
  const peutContinuer = etape === 0
    ? true
    : qActuelle?.type === "texte"
      ? true  // texte libre = optionnel
      : reponseActuelle !== undefined;

  const soumettre = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const payload = onglet === "PROM"
        ? EPDS.map(q => {
            const idx = reponses[q.id] ?? 0;
            return { questionId: q.id, texte: q.texte, valeur: idx, reponseTexte: q.options[idx] };
          })
        : PREM_QUESTIONS.map(q => {
            const v = reponses[q.id] ?? "";
            const texteR = q.options ? (q.options[v] ?? String(v)) : String(v);
            return { questionId: q.id, texte: q.texte, valeur: v, reponseTexte: texteR };
          });

      await promPremApi.soumettre({
        type: onglet,
        phase: phase || null,
        reponses: JSON.stringify(payload),
      });

      if (onglet === "PROM") {
        const score = scoreEPDS(reponses);
        setResultat({ score, interp: interpretationEPDS(score) });
      } else {
        setResultat({ prem: true });
      }
      setEtape(total + 1);
    } catch (e) {
      setErreur(e.response?.data?.message || "La soumission a échoué, veuillez réessayer.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes questionnaires</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Outils de suivi validés — vos réponses aident à adapter votre accompagnement.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

        {/* ── Colonne principale : wizard ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
            {["PROM", "PREM"].map(t => (
              <button
                key={t}
                onClick={() => changerOnglet(t)}
                style={{
                  padding: "9px 28px", borderRadius: 9, border: "none",
                  background: onglet === t ? "linear-gradient(135deg,#1B4F8A,#3B82F6)" : "transparent",
                  color: onglet === t ? "#fff" : "var(--text-secondary)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t === "PROM" ? "🧠 PROM" : "⭐ PREM"}
              </button>
            ))}
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 36px", boxShadow: "0 2px 8px rgba(10,35,66,0.05)" }}>

            {/* ── Étape 0 : Intro ── */}
            {etape === 0 && (
              <div>
                {onglet === "PROM" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🧠</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                          Questionnaire PROM
                        </h2>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Échelle d'Édimbourg (EPDS) · 10 questions · ~3 min</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                      Ce questionnaire évalue votre <strong>bien-être émotionnel</strong> au cours de la semaine passée. Il est utilisé par les professionnels de santé périnatale pour vous apporter le soutien adapté.
                      <br /><br />
                      Il n'y a pas de bonne ou mauvaise réponse — répondez spontanément, en pensant à comment vous vous êtes sentie <strong>au cours des 7 derniers jours</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>⭐</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                          Questionnaire PREM
                        </h2>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Expérience de soin · 8 questions · ~5 min</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                      Ce questionnaire mesure votre <strong>expérience au sein de Maisons MINO</strong> — la qualité de l'accueil, du suivi, des ateliers et de la coordination.
                      <br /><br />
                      Vos réponses sont confidentielles et permettent d'<strong>améliorer continuellement nos services</strong> pour vous et les futures mamans.
                    </p>
                  </>
                )}

                {/* Phase */}
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                    À quel moment de votre parcours êtes-vous ?
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PHASES.map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setPhase(p.val)}
                        style={{
                          padding: "7px 14px", borderRadius: 8,
                          border: phase === p.val ? "2px solid var(--primary-light)" : "2px solid var(--border)",
                          background: phase === p.val ? "rgba(59,130,246,0.07)" : "var(--surface)",
                          color: phase === p.val ? "var(--primary-light)" : "var(--text-secondary)",
                          fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        {p.val}
                      </button>
                    ))}
                  </div>
                  {phase && <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{PHASES.find(p2 => p2.val === phase)?.label}</p>}
                </div>

                <button
                  className="btn-primary"
                  onClick={validerEtape}
                  style={{ padding: "12px 32px", fontSize: 15 }}
                >
                  Commencer le questionnaire →
                </button>
              </div>
            )}

            {/* ── Étapes questions ── */}
            {etape >= 1 && etape <= total && qActuelle && (
              <div>
                <ProgressBar current={etape} total={total} />

                <div style={{ marginBottom: 28 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)" }}>
                    Question {etape}
                  </p>
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.4 }}>
                    {qActuelle.texte}
                  </h3>
                  {qActuelle.sous && (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Réfléchissez aux 7 derniers jours
                    </p>
                  )}
                </div>

                {(qActuelle.type === "CHOIX_UNIQUE" || qActuelle.reverse !== undefined) && (
                  <QuestionChoix question={qActuelle} valeur={reponseActuelle} onChange={repondre} />
                )}
                {qActuelle.type === "echelle" && (
                  <QuestionEchelle question={qActuelle} valeur={reponseActuelle} onChange={repondre} />
                )}
                {qActuelle.type === "texte" && (
                  <QuestionTexte question={qActuelle} valeur={reponseActuelle} onChange={repondre} />
                )}
                {qActuelle.type === "choix" && (
                  <QuestionChoix question={qActuelle} valeur={reponseActuelle} onChange={repondre} />
                )}

                {erreur && <p style={{ marginTop: 16, color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
                  <button
                    onClick={() => setEtape(e => e - 1)}
                    style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    ← Précédent
                  </button>
                  <button
                    className="btn-primary"
                    onClick={validerEtape}
                    disabled={!peutContinuer || envoi}
                    style={{ padding: "10px 28px" }}
                  >
                    {envoi ? "Envoi…" : etape === total ? "Soumettre ✓" : "Suivant →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Résultat PROM ── */}
            {etape === total + 1 && resultat && onglet === "PROM" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{resultat.interp.icon}</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
                  Questionnaire envoyé
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>Merci pour vos réponses.</p>

                {/* Score */}
                <div style={{ background: resultat.interp.bg, border: `1.5px solid ${resultat.interp.color}22`, borderRadius: 14, padding: "24px 32px", marginBottom: 24, display: "inline-block" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 13, color: resultat.interp.color, fontWeight: 600 }}>Score EPDS</p>
                  <p style={{ margin: "0 0 8px", fontSize: 52, fontWeight: 800, color: resultat.interp.color, lineHeight: 1 }}>
                    {resultat.score}
                    <span style={{ fontSize: 20, fontWeight: 400 }}>/30</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: resultat.interp.color }}>{resultat.interp.label}</p>
                </div>

                {/* Barre de score visuelle */}
                <div style={{ maxWidth: 320, margin: "0 auto 28px" }}>
                  <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 2 }}>
                    <div style={{ flex: 9, background: "#ECFDF5", borderRadius: "999px 0 0 999px" }} />
                    <div style={{ flex: 4, background: "#FFFBEB" }} />
                    <div style={{ flex: 17, background: "#FEF2F2", borderRadius: "0 999px 999px 0" }} />
                  </div>
                  <div style={{ position: "relative", height: 16 }}>
                    <div style={{
                      position: "absolute",
                      left: `${(resultat.score / 30) * 100}%`,
                      transform: "translateX(-50%)",
                      width: 14, height: 14, borderRadius: "50%",
                      background: resultat.interp.color,
                      border: "3px solid var(--surface)",
                      top: 1,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
                    <span>0 — Bien-être</span>
                    <span>9</span>
                    <span>13</span>
                    <span>30 — Détresse</span>
                  </div>
                </div>

                {resultat.score >= 13 && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#991B1B", lineHeight: 1.6, textAlign: "left" }}>
                    <strong>Un accompagnement vous est proposé.</strong> La coordinatrice a été informée de votre score. N'hésitez pas à la contacter directement via la messagerie.
                  </div>
                )}

                <button className="btn-primary" onClick={reset} style={{ marginRight: 10 }}>
                  Nouveau questionnaire
                </button>
                <button onClick={reset} style={{ padding: "10px 20px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Voir l'historique ↓
                </button>
              </div>
            )}

            {/* ── Résultat PREM ── */}
            {etape === total + 1 && resultat?.prem && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
                  Merci pour votre retour !
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 380, margin: "0 auto 28px", lineHeight: 1.6 }}>
                  Votre expérience est précieuse. Vos réponses nous aident à améliorer l'accompagnement de toutes les mamans de Maisons MINO.
                </p>
                <button className="btn-primary" onClick={reset}>
                  Nouveau questionnaire
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : historique ── */}
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(10,35,66,0.05)" }}>
            <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Historique
            </p>
            {loadHist ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 44, borderRadius: 8, background: "var(--border)", opacity: 0.5, animation: "shimmer 1.5s infinite" }} />
                ))}
              </div>
            ) : historique.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>📋</p>
                <p style={{ fontSize: 13, margin: 0 }}>Aucun questionnaire soumis.</p>
              </div>
            ) : (
              historique.map(r => <HistoriqueItem key={r.id} r={r} />)
            )}
          </div>

          {/* Info card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", marginTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              À quoi servent ces questionnaires ?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🧠", label: "PROM", desc: "Mesure votre bien-être émotionnel grâce à l'Échelle d'Édimbourg (EPDS), validée cliniquement." },
                { icon: "⭐", label: "PREM", desc: "Évalue votre expérience chez Maisons MINO pour améliorer continuellement nos services." },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{item.label} — </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
