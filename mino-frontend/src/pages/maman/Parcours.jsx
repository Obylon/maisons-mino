import { useEffect, useState } from "react";
import { mamanApi, promPremApi, atelierApi } from "../../services/api";
import { PHASES, scoreEPDS, interpretationEPDS } from "../../data/questionnaires";

const PHASE_LABELS = { T0: "Entrée", T1: "1 mois", T2: "3 mois", T3: "6 mois", T4: "Fin" };
const PHASE_OFFSETS = { T0: 0, T1: 30, T2: 90, T3: 180, T4: 420 };

function phaseDate(parcours, phase) {
  if (!parcours?.dateEntreeParcours) return null;
  const d = new Date(parcours.dateEntreeParcours);
  d.setDate(d.getDate() + (PHASE_OFFSETS[phase] ?? 0));
  return d;
}

function currentPhaseIdx(parcours) {
  if (!parcours?.dateEntreeParcours) return 0;
  const jours = Math.floor((Date.now() - new Date(parcours.dateEntreeParcours)) / 86400000);
  if (jours < 0)   return 0;
  if (jours < 45)  return 1;
  if (jours < 135) return 2;
  if (jours < 270) return 3;
  return 4;
}

export default function Parcours() {
  const [parcours, setParcours] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phaseActive, setPhaseActive] = useState(null);

  useEffect(() => {
    Promise.all([
      mamanApi.monParcours(),
      promPremApi.mesReponses().catch(() => ({ data: [] })),
      atelierApi.monCalendrier().catch(() => ({ data: [] })),
    ]).then(([pRes, qRes, aRes]) => {
      setParcours(pRes.data);
      setReponses(qRes.data);
      setAteliers(aRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Chargement…</p>;
  if (!parcours) return <p className="error-text" style={{ padding: 24 }}>Parcours non disponible.</p>;

  const phases = ["T0", "T1", "T2", "T3", "T4"];
  const currentIdx = currentPhaseIdx(parcours);
  const bebeNe = !!parcours.dateNaissanceBebe;

  const reponsesParPhase = {};
  reponses.forEach(r => {
    if (!reponsesParPhase[r.phase]) reponsesParPhase[r.phase] = [];
    reponsesParPhase[r.phase].push(r);
  });

  const now = Date.now();
  const ateliersAttendus = ateliers.filter(a => a.dateHeure && new Date(a.dateHeure) <= now);
  const ateliersAVenir   = ateliers.filter(a => a.dateHeure && new Date(a.dateHeure) > now);

  return (
    <>
      <h1 className="page-title">Mon parcours</h1>
      <p className="page-subtitle">14 mois avec Maisons MINO — de M-4 aux 10 mois du bébé</p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          {
            value: bebeNe ? parcours.ageBebeJours : (parcours.semaineGrossesse ?? "—"),
            label: bebeNe ? "jours de bébé" : parcours.semaineGrossesse ? "sem. grossesse" : "Terme non renseigné",
            color: "var(--pine)",
          },
          { value: ateliersAttendus.length, label: "ateliers suivis",   color: "#1D4ED8" },
          { value: reponses.length,          label: "questionnaires",    color: "#7C3AED" },
          { value: ateliersAVenir.length,    label: "ateliers à venir",  color: "#D97706" },
        ].map((c, i) => (
          <div key={i} className="card" style={{ textAlign: "center", padding: "18px 12px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline visuelle */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="card-title" style={{ marginBottom: 24 }}>Votre progression</p>

        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ position: "relative", minWidth: 420, paddingBottom: 8 }}>
            {/* Ligne de fond */}
            <div style={{
              position: "absolute", top: 20, left: "10%", right: "10%",
              height: 4, background: "var(--border)", borderRadius: 2, zIndex: 0,
            }} />
            {/* Progression */}
            <div style={{
              position: "absolute", top: 20, left: "10%",
              width: `${Math.min((currentIdx / 4) * 80, 80)}%`,
              height: 4, background: "var(--pine)", borderRadius: 2, zIndex: 1,
              transition: "width 0.6s ease",
            }} />

            {/* Noeuds */}
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
              {phases.map((phase, idx) => {
                const reps = reponsesParPhase[phase] || [];
                const hasPROM = reps.some(r => r.type === "PROM");
                const hasPREM = reps.some(r => r.type === "PREM");
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                const d = phaseDate(parcours, phase);

                return (
                  <div
                    key={phase}
                    onClick={() => setPhaseActive(phaseActive === phase ? null : phase)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "20%", cursor: "pointer" }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: done || active ? "var(--pine)" : "var(--surface)",
                      border: `3px solid ${done || active ? "var(--pine)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: done || active ? "#fff" : "var(--ink-muted)",
                      fontWeight: 700, fontSize: done ? 16 : 12,
                      boxShadow: active ? "0 0 0 5px rgba(22,101,52,0.15)" : "none",
                      transition: "all 0.2s",
                    }}>
                      {done ? "✓" : phase}
                    </div>

                    <div style={{
                      marginTop: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? "var(--pine)" : done ? "var(--ink)" : "var(--ink-muted)",
                      textAlign: "center",
                    }}>{phase}</div>

                    <div style={{ fontSize: 11, color: "var(--ink-muted)", textAlign: "center" }}>
                      {PHASE_LABELS[phase]}
                    </div>

                    <div style={{ marginTop: 4, display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
                      {hasPROM && (
                        <span style={{ fontSize: 9, background: "#DCFCE7", color: "#166534", borderRadius: 3, padding: "1px 4px", fontWeight: 700 }}>
                          PROM
                        </span>
                      )}
                      {hasPREM && (
                        <span style={{ fontSize: 9, background: "#DBEAFE", color: "#1E40AF", borderRadius: 3, padding: "1px 4px", fontWeight: 700 }}>
                          PREM
                        </span>
                      )}
                    </div>

                    {d && (
                      <div style={{ fontSize: 10, color: "var(--ink-muted)", marginTop: 3, textAlign: "center" }}>
                        {d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panneau de détail d'une phase */}
        {phaseActive && (
          <div style={{
            marginTop: 16, padding: 16, background: "var(--surface-alt)",
            borderRadius: "var(--radius)", border: "1px solid var(--border)",
          }}>
            <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
              {phaseActive} — {PHASE_LABELS[phaseActive]}
              {phaseDate(parcours, phaseActive) && (
                <span style={{ fontWeight: 400, color: "var(--ink-muted)", marginLeft: 8, fontSize: 13 }}>
                  ({phaseDate(parcours, phaseActive).toLocaleDateString("fr-FR")})
                </span>
              )}
            </p>

            {(reponsesParPhase[phaseActive] || []).length === 0 ? (
              <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0 }}>
                Aucun questionnaire soumis pour cette phase.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(reponsesParPhase[phaseActive] || []).map(r => {
                  const score = r.type === "PROM" ? scoreEPDS(r.reponses) : null;
                  const interp = score !== null ? interpretationEPDS(score) : null;
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#fff", padding: "10px 14px", borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 7px",
                          background: r.type === "PROM" ? "#DCFCE7" : "#DBEAFE",
                          color: r.type === "PROM" ? "#166534" : "#1E40AF",
                          borderRadius: 4,
                        }}>{r.type}</span>
                        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                          {new Date(r.dateSoumission).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {interp && (
                        <span style={{
                          fontSize: 13, fontWeight: 700, padding: "3px 10px",
                          background: interp.bg, color: interp.color, borderRadius: 12,
                        }}>
                          {interp.icon} {score}/30
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dates clés */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="card-title">Dates clés</p>
        <table className="table-simple">
          <tbody>
            {[
              ["Entrée dans le parcours", parcours.dateEntreeParcours],
              ["Terme prévu",             parcours.dateTermeGrossesse],
              ["Naissance du bébé",       parcours.dateNaissanceBebe, "Pas encore renseignée"],
              ["Sortie prévue",           parcours.dateSortiePrevue],
            ].map(([label, date, fallback = "—"]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{date ? new Date(date).toLocaleDateString("fr-FR") : fallback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prochains ateliers */}
      {ateliersAVenir.length > 0 && (
        <div className="card">
          <p className="card-title">Prochains ateliers</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ateliersAVenir.slice(0, 4).map(a => (
              <div key={a.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "var(--surface-alt)", borderRadius: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.titre || a.type}</div>
                  {a.groupeNom && <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{a.groupeNom}</div>}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-muted)", textAlign: "right" }}>
                  {new Date(a.dateHeure).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
