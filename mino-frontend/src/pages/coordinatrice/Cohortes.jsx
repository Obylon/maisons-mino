import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cohorteApi, groupeApi } from "../../services/api";
import Modal from "../../components/Modal";

// ─── Barre de progression membres ────────────────────────────────────────────
function MembreBar({ actuel, cible = 5 }) {
  const pct = Math.min(100, Math.round((actuel / cible) * 100));
  const color = actuel === cible ? "var(--success)" : actuel >= 3 ? "var(--primary-light)" : "var(--warning)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: "nowrap" }}>{actuel}/{cible}</span>
    </div>
  );
}

// ─── Avatars empilés des membres ─────────────────────────────────────────────
function AvatarStack({ count, max = 5 }) {
  const colors = ["#1D4ED8","#0D9488","#4C1D95","#92400E","#065F46"];
  return (
    <div style={{ display: "flex" }}>
      {Array.from({ length: Math.min(count, max) }).map((_, i) => (
        <div key={i} style={{
          width: 26, height: 26, borderRadius: "50%",
          background: colors[i % colors.length],
          border: "2px solid var(--surface)",
          marginLeft: i === 0 ? 0 : -8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#fff",
          zIndex: count - i,
        }}>
          {i + 1}
        </div>
      ))}
    </div>
  );
}

export default function Cohortes() {
  const navigate = useNavigate();

  // Cohortes
  const [cohortes, setCohortes] = useState([]);
  const [loadingCohortes, setLoadingCohortes] = useState(true);
  const [error, setError]       = useState("");

  // Modal nouvelle cohorte
  const [modalOuverte, setModalOuverte] = useState(false);
  const [nom, setNom]             = useState("");
  const [ville, setVille]         = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [envoi, setEnvoi]         = useState(false);

  // Groupes (temps réel)
  const [groupes, setGroupes]           = useState([]);
  const [loadingGroupes, setLoadingGroupes] = useState(true);
  const [derniereMaj, setDerniereMaj]   = useState(null);

  // ── Chargement ────────────────────────────────────────────────────────────
  const chargerCohortes = useCallback(() => {
    setLoadingCohortes(true);
    cohorteApi.lister()
      .then((res) => setCohortes(res.data))
      .catch(() => setError("Impossible de charger les cohortes."))
      .finally(() => setLoadingCohortes(false));
  }, []);

  const chargerGroupes = useCallback(() => {
    groupeApi.lister()
      .then((res) => { setGroupes(res.data); setDerniereMaj(new Date()); })
      .catch(() => {})
      .finally(() => setLoadingGroupes(false));
  }, []);

  useEffect(() => { chargerCohortes(); chargerGroupes(); }, [chargerCohortes, chargerGroupes]);

  // Polling groupes toutes les 30 s (membres peuvent changer)
  useEffect(() => {
    const id = setInterval(chargerGroupes, 30_000);
    return () => clearInterval(id);
  }, [chargerGroupes]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCreer = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setEnvoi(true);
    try {
      await cohorteApi.creer({ nom: nom.trim(), ville: ville.trim() || null, dateDebut: dateDebut || null });
      setNom(""); setVille(""); setDateDebut("");
      setModalOuverte(false);
      chargerCohortes();
    } catch { setError("La création a échoué."); }
    finally   { setEnvoi(false); }
  };

  const handleSupprimer = async (id, nomC) => {
    if (!window.confirm(`Supprimer la cohorte "${nomC}" ?`)) return;
    try { await cohorteApi.supprimer(id); chargerCohortes(); }
    catch (err) { setError(err.response?.data?.message || "Suppression échouée."); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
  const fmtHeure = (d) => d ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  // Tri groupes : complets en dernier, puis par taille décroissante
  const groupesTries = [...groupes].sort((a, b) => {
    if (a.tailleActuelle === a.tailleCible && b.tailleActuelle !== b.tailleCible) return 1;
    if (b.tailleActuelle === b.tailleCible && a.tailleActuelle !== a.tailleCible) return -1;
    return b.tailleActuelle - a.tailleActuelle;
  });

  return (
    <>
      {/* ── En-tête ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Cohortes & groupes</h1>
          <p className="page-subtitle">Gestion des cohortes et suivi en temps réel des groupes de 5 mamans.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOuverte(true)}>+ Nouvelle cohorte</button>
      </div>

      {error && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION GROUPES — au-dessus des cohortes
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Groupes actifs
            </h2>
            <span style={{
              background: "var(--role-coordinatrice-bg)", color: "var(--role-coordinatrice)",
              borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "2px 9px",
            }}>
              {groupes.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {derniereMaj && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Actualisé à {fmtHeure(derniereMaj)}
              </span>
            )}
            <button
              onClick={chargerGroupes}
              style={{ border: "1.5px solid var(--border)", background: "var(--surface)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--primary-light)" }}
            >
              ↻ Actualiser
            </button>
          </div>
        </div>

        {loadingGroupes ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, height: 120 }}>
                <div className="skeleton" style={{ height: 14, width: "55%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 10, width: "30%", marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 6, width: "100%", borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ) : groupesTries.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 14, padding: "36px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, margin: "0 0 10px" }}>🏘️</p>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Aucun groupe constitué pour l'instant.</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
              Créez d'abord une cohorte, puis constituez les groupes depuis la page de détail.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {groupesTries.map((g) => {
              const complet = g.tailleActuelle === g.tailleCible;
              return (
                <div
                  key={g.id}
                  onClick={() => g.cohorteId && navigate(`/coordinatrice/cohortes/${g.cohorteId}`)}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${complet ? "rgba(5,150,105,0.25)" : "var(--border)"}`,
                    borderRadius: 14,
                    padding: "18px 20px",
                    cursor: g.cohorteId ? "pointer" : "default",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    boxShadow: "0 1px 3px rgba(10,35,66,0.06)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(10,35,66,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(10,35,66,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {/* Badge complet */}
                  {complet && (
                    <span style={{
                      position: "absolute", top: 12, right: 12,
                      fontSize: 10, fontWeight: 700,
                      background: "var(--success-bg)", color: "var(--success)",
                      padding: "2px 8px", borderRadius: 999,
                    }}>
                      Complet
                    </span>
                  )}

                  {/* Nom + cohorte */}
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", paddingRight: complet ? 60 : 0 }}>
                    {g.nom || `Groupe ${g.id?.slice(0, 6)}`}
                  </p>
                  <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>
                    {g.cohorteNom || "Sans cohorte"}
                    {g.dateConstitution && (
                      <span style={{ marginLeft: 6 }}>· constitué le {fmtDate(g.dateConstitution)}</span>
                    )}
                  </p>

                  {/* Avatars empilés */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <AvatarStack count={g.tailleActuelle} max={5} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {g.tailleActuelle === 0 ? "Vide" : `${g.tailleActuelle} membre${g.tailleActuelle > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <MembreBar actuel={g.tailleActuelle} cible={g.tailleCible || 5} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION COHORTES
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p className="card-title" style={{ margin: 0 }}>Cohortes ({cohortes.length})</p>
        </div>
        {loadingCohortes && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chargement…</p>}
        {!loadingCohortes && cohortes.length === 0 && (
          <div className="empty-state">
            <p style={{ fontSize: 32, margin: "0 0 10px" }}>📋</p>
            <p style={{ margin: 0 }}>Aucune cohorte pour l'instant.</p>
          </div>
        )}
        {!loadingCohortes && cohortes.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville</th>
                <th>Début</th>
                <th>Groupes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cohortes.map((c) => {
                const nbGroupes = groupes.filter((g) => g.cohorteId === c.id).length;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/coordinatrice/cohortes/${c.id}`}
                        style={{ color: "var(--primary-light)", fontWeight: 600, textDecoration: "none" }}
                      >
                        {c.nom}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.ville ?? "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(c.dateDebut)}</td>
                    <td>
                      {nbGroupes > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary-light)" }}>
                          {nbGroupes} groupe{nbGroupes > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleSupprimer(c.id, c.nom)}
                        style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      <Modal open={modalOuverte} onClose={() => setModalOuverte(false)} title="Nouvelle cohorte">
        <form onSubmit={handleCreer}>
          <div className="field">
            <label>Nom *</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Paris 17e — Cohorte 1" required autoFocus />
          </div>
          <div className="field">
            <label>Ville</label>
            <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Paris" />
          </div>
          <div className="field">
            <label>Date de début</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi} style={{ width: "100%" }}>
            {envoi ? "Création…" : "Créer la cohorte"}
          </button>
        </form>
      </Modal>
    </>
  );
}
