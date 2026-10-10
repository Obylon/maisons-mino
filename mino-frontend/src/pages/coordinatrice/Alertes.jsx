import { useEffect, useState, useCallback } from "react";
import { promPremApi } from "../../services/api";
import { scoreEPDS, interpretationEPDS, decodeReponses } from "../../data/questionnaires";
import { useNotificationContext } from "../../context/NotificationContext";

function DetailPROM({ r }) {
  const score = scoreEPDS(r.reponses);
  const interp = interpretationEPDS(score);
  const lignes = decodeReponses(r.reponses, "PROM");

  return (
    <div>
      {score !== null && interp && (
        <div style={{ background: interp.bg, border: `1.5px solid ${interp.color}44`, borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
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
              <div style={{
                position: "absolute", top: "50%", transform: "translateX(-50%) translateY(-50%)",
                left: `${(score / 30) * 100}%`,
                width: 14, height: 14, borderRadius: "50%",
                background: interp.color, border: "3px solid white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--ink-muted)" }}>
                <span>0</span><span>9</span><span>13</span><span>30</span>
              </div>
            </div>
          </div>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#991B1B", maxWidth: 180, lineHeight: 1.5 }}>
            ⚠️ <strong>Score élevé.</strong> Un suivi renforcé est recommandé.
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(lignes || []).map((l, idx) => (
          <div key={idx} style={{
            padding: "10px 14px", borderRadius: 8,
            background: l.alerte ? "#FEF2F2" : "var(--surface-alt)",
            border: l.alerte ? "1.5px solid #FCA5A5" : "1px solid var(--border)",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: l.alerte ? "#FEE2E2" : "#EFF6FF", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: l.alerte ? "#DC2626" : "#1D4ED8", flexShrink: 0 }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 3px", fontSize: 12, color: "var(--ink-muted)" }}>{l.texteQuestion}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: l.alerte ? "#DC2626" : "var(--ink)" }}>{l.texteReponse || <em>—</em>}</p>
            </div>
            {l.pts !== null && (
              <span style={{ fontSize: 15, fontWeight: 800, color: l.pts >= 2 ? "#DC2626" : l.pts === 1 ? "#D97706" : "#059669", flexShrink: 0 }}>{l.pts}pt</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Alertes() {
  const [toutes, setToutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const { marquerAlertePromVu } = useNotificationContext();

  const charger = useCallback(() => {
    setLoading(true);
    promPremApi.listerTout(0, 200)
      .then(res => setToutes(res.data.content ?? []))
      .catch(() => setToutes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    charger();
    marquerAlertePromVu();
  }, [charger, marquerAlertePromVu]);

  const alertes = toutes
    .filter(r => r.type === "PROM")
    .map(r => ({ ...r, score: scoreEPDS(r.reponses) }))
    .filter(r => r.score !== null && r.score >= 13)
    .sort((a, b) => new Date(b.dateSoumission) - new Date(a.dateSoumission));

  const vigilance = toutes
    .filter(r => r.type === "PROM")
    .map(r => ({ ...r, score: scoreEPDS(r.reponses) }))
    .filter(r => r.score !== null && r.score >= 9 && r.score < 13)
    .sort((a, b) => new Date(b.dateSoumission) - new Date(a.dateSoumission));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alertes EPDS</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Questionnaires PROM avec score élevé — suivi prioritaire requis.
          </p>
        </div>
        <button onClick={charger} className="btn-secondary">Actualiser</button>
      </div>

      {/* Compteurs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "🔴", label: "Score ≥ 13 (alerte)", value: alertes.length,   color: "#DC2626", bg: "#FEF2F2" },
          { icon: "🟡", label: "Score 9-12 (vigilance)", value: vigilance.length, color: "#D97706", bg: "#FFFBEB" },
          { icon: "📊", label: "PROM soumis au total",  value: toutes.filter(r => r.type === "PROM").length, color: "#1D4ED8", bg: "#EFF6FF" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
            <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: "var(--ink-muted)" }}>Chargement…</p>}

      {/* Alertes critiques */}
      {alertes.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid #DC2626" }}>
          <p className="card-title" style={{ color: "#DC2626" }}>🔴 Soutien recommandé — score ≥ 13</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alertes.map(r => {
              const interp = interpretationEPDS(r.score);
              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FCA5A5",
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.mamanPrenom} {r.mamanNom}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                      Phase {r.phase ?? "—"} · {r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#DC2626" }}>{r.score}<span style={{ fontSize: 12, fontWeight: 500 }}>/30</span></span>
                    <button
                      onClick={() => setDetail(r)}
                      style={{ border: "1.5px solid #FCA5A5", background: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#DC2626" }}
                    >
                      Voir →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vigilance */}
      {vigilance.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid #D97706" }}>
          <p className="card-title" style={{ color: "#D97706" }}>⚠️ Vigilance conseillée — score 9-12</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vigilance.map(r => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.mamanPrenom} {r.mamanNom}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                    Phase {r.phase ?? "—"} · {r.dateSoumission ? new Date(r.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#D97706" }}>{r.score}<span style={{ fontSize: 12, fontWeight: 500 }}>/30</span></span>
                  <button
                    onClick={() => setDetail(r)}
                    style={{ border: "1.5px solid #FDE68A", background: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#92400E" }}
                  >
                    Voir →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && alertes.length === 0 && vigilance.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 36, margin: "0 0 10px" }}>🌿</p>
            <p style={{ margin: 0, fontWeight: 600 }}>Aucune alerte active</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
              Tous les scores EPDS sont dans la norme.
            </p>
          </div>
        </div>
      )}

      {/* Modal de détail */}
      {detail && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(10,35,66,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setDetail(null)}
        >
          <div
            style={{ background: "var(--surface)", borderRadius: 18, maxWidth: 660, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(10,35,66,0.22)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 700 }}>
                  🧠 PROM · {detail.mamanPrenom} {detail.mamanNom}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>
                  {detail.phase ? `Phase ${detail.phase} · ` : ""}
                  {detail.dateSoumission ? new Date(detail.dateSoumission).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 16, color: "var(--ink-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
              <DetailPROM r={detail} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
