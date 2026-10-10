import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupeApi } from "../../services/api";

function Avatar({ nom, size = 36 }) {
  const letter = (nom || "?")[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: "linear-gradient(135deg, #4C1D95, #7C3AED)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.44, fontWeight: 700, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: "60%" }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
    </div>
  );
}

export default function Groupes() {
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recherche, setRecherche] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    groupeApi.lister()
      .then((res) => setGroupes(res.data))
      .catch(() => setError("Impossible de charger les groupes."))
      .finally(() => setLoading(false));
  }, []);

  const filtres = groupes.filter((g) => {
    const q = recherche.toLowerCase();
    return !q
      || (g.nom || "").toLowerCase().includes(q)
      || (g.cohorteNom || "").toLowerCase().includes(q);
  });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Groupes</h1>
        <p className="page-subtitle">Tous les groupes de mamans — accès direct sans passer par les cohortes.</p>
      </div>

      {/* Barre de recherche + compteur */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un groupe ou une cohorte…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 36px",
              border: "1.5px solid var(--border)", borderRadius: 10,
              fontSize: 14, background: "var(--surface)", color: "var(--text-primary)",
              outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary-light)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {loading ? "…" : `${filtres.length} groupe${filtres.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {error && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,35,66,0.06)" }}>
        {/* En-tête tableau */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 180px 100px 120px",
          padding: "10px 20px",
          background: "var(--surface-alt)", borderBottom: "2px solid var(--border)",
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.8px",
        }}>
          <span>Groupe</span>
          <span>Cohorte</span>
          <span>Membres</span>
          <span></span>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : filtres.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏘️</div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
              {recherche ? "Aucun groupe ne correspond à cette recherche." : "Aucun groupe créé pour l'instant."}
            </p>
          </div>
        ) : (
          filtres.map((g, idx) => (
            <div
              key={g.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 180px 100px 120px",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: idx < filtres.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.12s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => g.cohorteId && navigate(`/coordinatrice/cohortes/${g.cohorteId}`)}
            >
              {/* Nom du groupe */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar nom={g.nom} size={36} />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {g.nom || `Groupe ${g.id?.slice(0, 6)}`}
                  </p>
                  {g.id && (
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      ID : {g.id.slice(0, 8)}…
                    </p>
                  )}
                </div>
              </div>

              {/* Cohorte */}
              <div>
                {g.cohorteNom ? (
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    background: "var(--role-coordinatrice-bg)", color: "var(--role-coordinatrice)",
                    padding: "3px 10px", borderRadius: 999,
                  }}>
                    {g.cohorteNom}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                )}
              </div>

              {/* Membres */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                  {g.nombreMembres ?? g.membres?.length ?? "—"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  / 5
                </span>
              </div>

              {/* Action */}
              <div style={{ textAlign: "right" }}>
                {g.cohorteId ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/coordinatrice/cohortes/${g.cohorteId}`); }}
                    style={{
                      background: "transparent", border: "1.5px solid var(--border)",
                      color: "var(--primary-light)", borderRadius: 8,
                      padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-light)"; e.currentTarget.style.background = "#EFF6FF"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    Voir →
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sans cohorte</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
