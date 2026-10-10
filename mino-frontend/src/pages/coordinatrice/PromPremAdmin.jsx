import { useEffect, useState, useCallback } from "react";
import { promPremApi } from "../../services/api";
import { scoreEPDS, interpretationEPDS, scorePREM, decodeReponses } from "../../data/questionnaires";

const PHASES = ["T0", "T1", "T2", "T3", "T4"];

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ r }) {
  if (r.type === "PROM") {
    const s = scoreEPDS(r.reponses);
    const i = interpretationEPDS(s);
    if (s === null || !i) return <span style={{ color: "var(--ink-muted)", fontSize: 12 }}>—</span>;
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: i.color, background: i.bg, padding: "3px 10px", borderRadius: 999 }}>
        {i.icon} {s}/30
      </span>
    );
  }
  const n = scorePREM(r.reponses);
  if (n === null) return <span style={{ color: "var(--ink-muted)", fontSize: 12 }}>—</span>;
  const color = n >= 8 ? "#059669" : n >= 5 ? "#D97706" : "#DC2626";
  const bg    = n >= 8 ? "#ECFDF5" : n >= 5 ? "#FFFBEB" : "#FEF2F2";
  return <span style={{ fontSize: 12, fontWeight: 700, color, background: bg, padding: "3px 10px", borderRadius: 999 }}>⭐ {n}/10</span>;
}

// ─── Détail PROM ──────────────────────────────────────────────────────────────
function DetailPROM({ r }) {
  const score = scoreEPDS(r.reponses);
  const interp = interpretationEPDS(score);
  const lignes = decodeReponses(r.reponses, "PROM");

  if (score === null) {
    return <p style={{ color: "var(--ink-muted)" }}>Détail non disponible (redémarrez le backend pour activer le champ réponses).</p>;
  }

  return (
    <div>
      {interp && (
        <div style={{ background: interp.bg, border: `1.5px solid ${interp.color}44`, borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 48, fontWeight: 800, color: interp.color, lineHeight: 1 }}>{score}</p>
            <p style={{ margin: 0, fontSize: 12, color: interp.color, opacity: 0.8 }}>/ 30</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: interp.color }}>{interp.icon} {interp.label}</p>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: interp.color, opacity: 0.75 }}>Échelle d'Édimbourg (EPDS)</p>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ flex: 9, background: "#ECFDF5" }} />
                <div style={{ flex: 4, background: "#FFFBEB" }} />
                <div style={{ flex: 17, background: "#FEF2F2" }} />
              </div>
              <div style={{ position: "absolute", top: "50%", transform: "translateX(-50%) translateY(-50%)", left: `${(score / 30) * 100}%`, width: 14, height: 14, borderRadius: "50%", background: interp.color, border: "3px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--ink-muted)" }}>
                <span>0</span><span>9</span><span>13</span><span>30</span>
              </div>
            </div>
          </div>
          {score >= 13 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#991B1B", maxWidth: 180, lineHeight: 1.5 }}>
              ⚠️ <strong>Score élevé.</strong> Suivi renforcé recommandé.
            </div>
          )}
        </div>
      )}
      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>Détail des réponses</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(lignes || []).map((l, idx) => (
          <div key={idx} style={{ padding: "12px 16px", borderRadius: 10, background: l.alerte ? "#FEF2F2" : "var(--surface-alt)", border: l.alerte ? "1.5px solid #FCA5A5" : "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: l.alerte ? "#FEE2E2" : "#EFF6FF", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: l.alerte ? "#DC2626" : "#1D4ED8", flexShrink: 0 }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.4 }}>{l.texteQuestion}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: l.alerte ? "#DC2626" : "var(--ink)" }}>{l.texteReponse || <em style={{ color: "var(--ink-muted)" }}>—</em>}</p>
            </div>
            {l.pts !== null && (
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: l.pts >= 2 ? "#DC2626" : l.pts === 1 ? "#D97706" : "#059669" }}>{l.pts}</span>
                <p style={{ margin: 0, fontSize: 9, color: "var(--ink-muted)" }}>pts</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Détail PREM ──────────────────────────────────────────────────────────────
function DetailPREM({ r }) {
  const note = scorePREM(r.reponses);
  const lignes = decodeReponses(r.reponses, "PREM");
  const color = note >= 8 ? "#059669" : note >= 5 ? "#D97706" : "#DC2626";
  const bg    = note >= 8 ? "#ECFDF5" : note >= 5 ? "#FFFBEB" : "#FEF2F2";

  return (
    <div>
      {note !== null && (
        <div style={{ background: bg, border: `1.5px solid ${color}44`, borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>{note}</p>
            <p style={{ margin: 0, fontSize: 12, color, opacity: 0.8 }}>/ 10</p>
          </div>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 700, color }}>
              {note >= 8 ? "⭐ Très satisfaite" : note >= 5 ? "👍 Satisfaite" : "😕 Insatisfaite"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color, opacity: 0.75 }}>Note d'expérience globale</p>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(lignes || []).map((l, idx) => (
          <div key={idx} style={{ padding: "12px 16px", borderRadius: 10, background: "var(--surface-alt)", border: "1px solid var(--border)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F5F3FF", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4C1D95", flexShrink: 0 }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.4 }}>{l.texteQuestion}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{l.texteReponse || <em style={{ color: "var(--ink-muted)" }}>—</em>}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Carte dossier (par maman) ────────────────────────────────────────────────
function Dossier({ dossier, onDetail }) {
  const [ouvert, setOuvert] = useState(false);

  const proms = dossier.questionnaires.filter(q => q.type === "PROM");
  const scores = proms.map(q => scoreEPDS(q.reponses)).filter(s => s !== null);
  const alerteCount = scores.filter(s => s >= 13).length;
  const vigilanceCount = scores.filter(s => s >= 9 && s < 13).length;
  const phasesAvec = new Set(dossier.questionnaires.map(q => q.phase).filter(Boolean));
  const derniere = dossier.questionnaires[0]?.dateSoumission;

  return (
    <div style={{ background: "var(--surface)", border: alerteCount > 0 ? "1.5px solid #FCA5A5" : "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      {/* En-tête cliquable */}
      <div
        onClick={() => setOuvert(!ouvert)}
        style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: alerteCount > 0 ? "#FFF5F5" : "var(--surface)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: alerteCount > 0 ? "#FEE2E2" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: alerteCount > 0 ? "#DC2626" : "#1D4ED8", flexShrink: 0 }}>
            {(dossier.mamanPrenom?.[0] || "") + (dossier.mamanNom?.[0] || "")}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{dossier.mamanPrenom} {dossier.mamanNom}</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 1 }}>
              {dossier.questionnaires.length} questionnaire{dossier.questionnaires.length > 1 ? "s" : ""}
              {derniere ? ` · dernier : ${new Date(derniere).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Phase timeline compacte */}
          <div style={{ display: "flex", gap: 3 }}>
            {PHASES.map(p => (
              <div key={p} title={p} style={{
                width: 22, height: 22, borderRadius: "50%",
                background: phasesAvec.has(p) ? "var(--pine)" : "var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: phasesAvec.has(p) ? "#fff" : "var(--ink-muted)",
              }}>{phasesAvec.has(p) ? "✓" : p}</div>
            ))}
          </div>
          {alerteCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "3px 10px", borderRadius: 20 }}>⚠️ {alerteCount} alerte{alerteCount > 1 ? "s" : ""}</span>}
          {vigilanceCount > 0 && alerteCount === 0 && <span style={{ fontSize: 12, fontWeight: 700, background: "#FFFBEB", color: "#D97706", padding: "3px 10px", borderRadius: 20 }}>⚡ {vigilanceCount} vigilance</span>}
          <span style={{ color: "var(--ink-muted)", fontSize: 16 }}>{ouvert ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Corps — questionnaires de cette maman */}
      {ouvert && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {dossier.questionnaires.map(r => {
            const score = r.type === "PROM" ? scoreEPDS(r.reponses) : null;
            const note  = r.type === "PREM" ? scorePREM(r.reponses) : null;
            const interp = score !== null ? interpretationEPDS(score) : null;
            const isAlerte = score !== null && score >= 13;

            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 10,
                background: isAlerte ? "#FEF2F2" : "var(--surface-alt)",
                border: isAlerte ? "1.5px solid #FCA5A5" : "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px",
                    background: r.type === "PROM" ? "#EFF6FF" : "#F5F3FF",
                    color: r.type === "PROM" ? "#1D4ED8" : "#4C1D95",
                    borderRadius: 999,
                  }}>{r.type === "PROM" ? "🧠" : "⭐"} {r.type}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Phase {r.phase ?? "—"}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    {r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {interp && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: interp.color, background: interp.bg, padding: "3px 10px", borderRadius: 999 }}>
                      {interp.icon} {score}/30
                    </span>
                  )}
                  {note !== null && (() => {
                    const c = note >= 8 ? "#059669" : note >= 5 ? "#D97706" : "#DC2626";
                    const b = note >= 8 ? "#ECFDF5" : note >= 5 ? "#FFFBEB" : "#FEF2F2";
                    return <span style={{ fontSize: 13, fontWeight: 700, color: c, background: b, padding: "3px 10px", borderRadius: 999 }}>⭐ {note}/10</span>;
                  })()}
                  <button onClick={() => onDetail(r)} style={{ border: "1.5px solid var(--border)", background: "var(--surface)", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: isAlerte ? "#DC2626" : "var(--ink)" }}>
                    Voir →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Modal de détail ──────────────────────────────────────────────────────────
function ModalDetail({ detail, onClose }) {
  if (!detail) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,35,66,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "var(--surface)", borderRadius: 18, maxWidth: 660, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(10,35,66,0.22)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 700 }}>
              {detail.type === "PROM" ? "🧠" : "⭐"} {detail.type} · {detail.mamanPrenom} {detail.mamanNom}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>
              {detail.phase ? `Phase ${detail.phase} · ` : ""}{detail.dateSoumission ? new Date(detail.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 16, color: "var(--ink-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {detail.type === "PROM" ? <DetailPROM r={detail} /> : <DetailPREM r={detail} />}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PromPremAdmin() {
  const [reponses, setReponses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [vue, setVue]             = useState("dossiers"); // "dossiers" | "liste"
  const [filtreType, setFiltre]   = useState("TOUS");
  const [detail, setDetail]       = useState(null);

  const charger = useCallback(() => {
    setLoading(true);
    // Charge jusqu'à 200 questionnaires pour avoir une vue complète
    promPremApi.listerTout(0, 200)
      .then(res => setReponses(res.data.content ?? []))
      .catch(() => setError("Impossible de charger les questionnaires."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Stats globales ──
  const promListe  = reponses.filter(r => r.type === "PROM");
  const premListe  = reponses.filter(r => r.type === "PREM");
  const scoresEPDS = promListe.map(r => scoreEPDS(r.reponses)).filter(s => s !== null);
  const moyEPDS    = scoresEPDS.length ? Math.round(scoresEPDS.reduce((a, b) => a + b, 0) / scoresEPDS.length) : null;
  const notesPREM  = premListe.map(r => scorePREM(r.reponses)).filter(n => n !== null);
  const moyPREM    = notesPREM.length ? (notesPREM.reduce((a, b) => a + b, 0) / notesPREM.length).toFixed(1) : null;
  const alertes    = scoresEPDS.filter(s => s >= 13).length;

  // ── Construction des dossiers ──
  const dossiersMap = {};
  reponses.forEach(r => {
    if (!dossiersMap[r.mamanId]) {
      dossiersMap[r.mamanId] = {
        mamanId: r.mamanId,
        mamanNom: r.mamanNom,
        mamanPrenom: r.mamanPrenom,
        questionnaires: [],
      };
    }
    dossiersMap[r.mamanId].questionnaires.push(r);
  });
  // Tri : alertes en premier, puis par date de dernière soumission
  const dossiers = Object.values(dossiersMap)
    .map(d => {
      d.questionnaires.sort((a, b) => new Date(b.dateSoumission) - new Date(a.dateSoumission));
      const scores = d.questionnaires.filter(q => q.type === "PROM").map(q => scoreEPDS(q.reponses)).filter(s => s !== null);
      const hasAlerte = scores.some(s => s >= 13);
      return { ...d, hasAlerte };
    })
    .sort((a, b) => {
      if (a.hasAlerte && !b.hasAlerte) return -1;
      if (!a.hasAlerte && b.hasAlerte) return 1;
      const dateA = new Date(a.questionnaires[0]?.dateSoumission || 0);
      const dateB = new Date(b.questionnaires[0]?.dateSoumission || 0);
      return dateB - dateA;
    });

  // ── Vue liste ──
  const filtrees = filtreType === "TOUS" ? reponses : reponses.filter(r => r.type === filtreType);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">PROM / PREM</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Suivi des indicateurs patients — bien-être (EPDS) et expérience de soin.
          </p>
        </div>
        <button onClick={charger} className="btn-secondary">Actualiser</button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "🧠", label: "Questionnaires PROM", value: promListe.length,    color: "#1D4ED8", bg: "#EFF6FF" },
          { icon: "⭐", label: "Questionnaires PREM", value: premListe.length,    color: "#4C1D95", bg: "#F5F3FF" },
          { icon: "📊", label: "Score EPDS moyen",    value: moyEPDS !== null ? `${moyEPDS}/30` : "—", color: "#065F46", bg: "#ECFDF5" },
          { icon: "⚠️", label: "Alertes (score ≥ 13)", value: alertes, color: alertes > 0 ? "#DC2626" : "#059669", bg: alertes > 0 ? "#FEF2F2" : "#ECFDF5" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>{s.icon}</div>
            <p style={{ margin: "0 0 3px", fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toggle vue */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "dossiers", label: "👤 Par maman" },
          { key: "liste",    label: "☰ Liste" },
        ].map(v => (
          <button key={v.key} onClick={() => setVue(v.key)} style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: vue === v.key ? "2px solid var(--pine)" : "1.5px solid var(--border)",
            background: vue === v.key ? "var(--pine)" : "var(--surface)",
            color: vue === v.key ? "#fff" : "var(--ink-muted)",
          }}>{v.label}</button>
        ))}
        {vue === "liste" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {["TOUS", "PROM", "PREM"].map(t => (
              <button key={t} onClick={() => setFiltre(t)} style={{ padding: "6px 14px", borderRadius: 8, border: filtreType === t ? "2px solid var(--primary-light, #3B82F6)" : "2px solid var(--border)", background: filtreType === t ? "rgba(59,130,246,0.07)" : "var(--surface)", color: filtreType === t ? "#3B82F6" : "var(--ink-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p style={{ color: "var(--ink-muted)" }}>Chargement…</p>}
      {error  && <p className="error-text">{error}</p>}

      {/* ── Vue dossiers ── */}
      {!loading && vue === "dossiers" && (
        dossiers.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p style={{ fontSize: 32, margin: "0 0 10px" }}>📋</p>
              <p style={{ margin: 0 }}>Aucun questionnaire soumis pour l'instant.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dossiers.map(d => (
              <Dossier key={d.mamanId} dossier={d} onDetail={setDetail} />
            ))}
          </div>
        )
      )}

      {/* ── Vue liste ── */}
      {!loading && vue === "liste" && (
        <div className="card">
          {filtrees.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 32, margin: "0 0 10px" }}>📋</p>
              <p style={{ margin: 0 }}>Aucun questionnaire.</p>
            </div>
          ) : (
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Maman</th><th>Type</th><th>Phase</th><th>Score / Note</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtrees.map(r => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setDetail(r)}>
                    <td style={{ fontWeight: 600 }}>{r.mamanPrenom} {r.mamanNom}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.type === "PROM" ? "#1D4ED8" : "#4C1D95", background: r.type === "PROM" ? "#EFF6FF" : "#F5F3FF", padding: "2px 9px", borderRadius: 999 }}>
                        {r.type === "PROM" ? "🧠" : "⭐"} {r.type}
                      </span>
                    </td>
                    <td style={{ color: "var(--ink-muted)" }}>{r.phase ?? "—"}</td>
                    <td><ScoreBadge r={r} /></td>
                    <td style={{ color: "var(--ink-muted)", fontSize: 13 }}>
                      {r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); setDetail(r); }} style={{ border: "1.5px solid var(--border)", background: "var(--surface)", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#3B82F6" }}>
                        Voir →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ModalDetail detail={detail} onClose={() => setDetail(null)} />
    </>
  );
}
