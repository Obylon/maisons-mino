import { useEffect, useState } from "react";
import { evaluationApi } from "../../services/api";

// ─── Étoiles interactives ─────────────────────────────────────────────────────
function Etoiles({ valeur, onChange, label }) {
  const [hover, setHover] = useState(0);
  const LABELS = ["", "Décevant", "Peut mieux faire", "Bien", "Très bien", "Excellent !"];
  return (
    <div>
      {label && (
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            style={{
              border: "none", background: "none", cursor: "pointer", padding: 2,
              fontSize: 32, lineHeight: 1,
              color: n <= (hover || valeur) ? "#F59E0B" : "var(--border)",
              transition: "color 0.1s, transform 0.1s",
              transform: n <= (hover || valeur) ? "scale(1.15)" : "scale(1)",
            }}
          >
            ★
          </button>
        ))}
        <span style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B", marginLeft: 6 }}>
          {LABELS[hover || valeur] || ""}
        </span>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EvaluerAteliers() {
  const [ateliers, setAteliers]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [atelierEnCours, setAtelierEnCours] = useState(null);
  const [noteAtelier, setNoteAtelier]       = useState(5);
  const [notePro, setNotePro]               = useState(5);
  const [commentaire, setCommentaire]       = useState("");
  const [envoi, setEnvoi]                   = useState(false);
  const [succes, setSucces]                 = useState("");

  const charger = () => {
    setLoading(true);
    evaluationApi.ateliersAEvaluer()
      .then(res => setAteliers(res.data))
      .catch(() => setError("Impossible de charger les ateliers à évaluer."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  // Sépare les ateliers dont l'heure est passée (évaluables) des futurs
  const maintenant = new Date();
  const evaluables = ateliers.filter(a => !a.dateHeure || new Date(a.dateHeure) <= maintenant);
  const upcoming   = ateliers.filter(a => a.dateHeure && new Date(a.dateHeure) > maintenant);

  const ouvrir = (atelier) => {
    setAtelierEnCours(atelier);
    setNoteAtelier(5);
    setNotePro(5);
    setCommentaire("");
    setSucces("");
    setError("");
  };

  const fermer = () => setAtelierEnCours(null);

  const handleSoumettre = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setError("");
    try {
      await evaluationApi.soumettre({
        atelierId: atelierEnCours.atelierId,
        noteAtelier,
        noteProfessionnel: notePro,
        commentaire: commentaire.trim() || null,
      });
      setSucces(`Merci pour votre avis sur "${atelierEnCours.atelierTitre}" !`);
      setAtelierEnCours(null);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "L'envoi de votre évaluation a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;

  // Temps relatif depuis la fin de l'atelier
  const depuis = (d) => {
    if (!d) return null;
    const diff = maintenant - new Date(d);
    const h = Math.floor(diff / 3_600_000);
    const j = Math.floor(diff / 86_400_000);
    if (h < 1) return "tout à l'heure";
    if (h < 24) return `il y a ${h} h`;
    if (j < 7) return `il y a ${j} jour${j > 1 ? "s" : ""}`;
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Temps avant le début
  const avant = (d) => {
    if (!d) return null;
    const diff = new Date(d) - maintenant;
    const h = Math.floor(diff / 3_600_000);
    const j = Math.floor(diff / 86_400_000);
    if (h < 1) return "dans moins d'1 h";
    if (h < 24) return `dans ${h} h`;
    return `dans ${j} jour${j > 1 ? "s" : ""}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Évaluer mes ateliers</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Votre retour est précieux — l'évaluation est disponible dès la fin de l'atelier.
          </p>
        </div>
      </div>

      {succes && (
        <div style={{ background: "var(--success-bg)", border: "1px solid #6EE7B7", borderRadius: 10, padding: "13px 18px", marginBottom: 20, fontSize: 14, fontWeight: 600, color: "var(--success)", display: "flex", alignItems: "center", gap: 10 }}>
          ✓ {succes}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {!loading && error && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "13px 18px", borderRadius: 10, fontSize: 14 }}>{error}</div>
      )}

      {!loading && !error && ateliers.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "56px 24px" }}>
          <p style={{ fontSize: 44, margin: "0 0 16px" }}>🎉</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>Tout est à jour !</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Aucun atelier en attente d'évaluation pour l'instant.</p>
        </div>
      )}

      {/* ── Ateliers évaluables (heure passée) ── */}
      {!loading && evaluables.length > 0 && !atelierEnCours && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              En attente de votre avis
            </h2>
            <span style={{ background: "#EFF6FF", color: "var(--primary-light)", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "2px 9px" }}>
              {evaluables.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {evaluables.map(a => (
              <div key={a.atelierId} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(10,35,66,0.05)" }}>
                {/* Icône */}
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  🏥
                </div>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>
                    {a.atelierTitre}
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      👩‍⚕️ {a.professionnelNom}
                    </span>
                    {a.dateHeure && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        📅 {fmtDate(a.dateHeure)}
                      </span>
                    )}
                    {a.dateHeure && (
                      <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                        · terminé {depuis(a.dateHeure)}
                      </span>
                    )}
                  </div>
                </div>
                {/* CTA */}
                <button
                  className="btn-primary"
                  onClick={() => ouvrir(a)}
                  style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  Évaluer ★
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ateliers à venir (pas encore évaluables) ── */}
      {!loading && upcoming.length > 0 && !atelierEnCours && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-secondary)" }}>
              À venir — évaluation disponible après l'atelier
            </h2>
            <span style={{ background: "var(--surface-alt)", color: "var(--text-muted)", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "2px 9px" }}>
              {upcoming.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map(a => (
              <div key={a.atelierId} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, opacity: 0.7 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  🕐
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                    {a.atelierTitre}
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>👩‍⚕️ {a.professionnelNom}</span>
                    {a.dateHeure && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>📅 {fmtDate(a.dateHeure)}</span>
                    )}
                    {a.dateHeure && (
                      <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>
                        · disponible {avant(a.dateHeure)}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--surface-alt)", padding: "6px 12px", borderRadius: 8, fontWeight: 500, flexShrink: 0 }}>
                  Pas encore disponible
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Formulaire d'évaluation ── */}
      {atelierEnCours && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", boxShadow: "0 2px 10px rgba(10,35,66,0.07)", maxWidth: 600 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)" }}>Évaluation</p>
              <h2 style={{ margin: "0 0 5px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                {atelierEnCours.atelierTitre}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                Animé par {atelierEnCours.professionnelNom}
                {atelierEnCours.dateHeure && ` · ${fmtDate(atelierEnCours.dateHeure)}`}
              </p>
            </div>
            <button
              type="button"
              onClick={fermer}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 14, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSoumettre} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Note atelier */}
            <div style={{ padding: "18px 20px", background: "var(--surface-alt)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <Etoiles
                valeur={noteAtelier}
                onChange={setNoteAtelier}
                label="La séance vous a-t-elle été utile ?"
              />
            </div>

            {/* Note professionnel */}
            <div style={{ padding: "18px 20px", background: "var(--surface-alt)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <Etoiles
                valeur={notePro}
                onChange={setNotePro}
                label={`Comment évaluez-vous ${atelierEnCours.professionnelNom} ?`}
              />
            </div>

            {/* Commentaire */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                Un commentaire ? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                rows={3}
                placeholder="Partagez votre expérience de cet atelier…"
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, resize: "vertical", background: "var(--bg)", color: "var(--text-primary)", lineHeight: 1.6, fontFamily: "inherit", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "var(--primary-light)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <p style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-primary"
                type="submit"
                disabled={envoi}
                style={{ flex: 1, padding: "12px" }}
              >
                {envoi ? "Envoi…" : "Envoyer mon évaluation ✓"}
              </button>
              <button
                type="button"
                onClick={fermer}
                style={{ padding: "12px 20px", border: "1.5px solid var(--border)", background: "var(--surface)", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)" }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
