import { useEffect, useState } from "react";
import { ressourceApi } from "../../services/api";

const CATEGORIE_COLORS = {
  "Allaitement":                { bg: "#ECFDF5", color: "#065F46" },
  "Sommeil":                    { bg: "#EFF6FF", color: "#1E40AF" },
  "Dépression périnatale":      { bg: "#FEF2F2", color: "#991B1B" },
  "Préparation à la naissance": { bg: "#F5F3FF", color: "#4C1D95" },
  "Vie de couple":              { bg: "#FFF7ED", color: "#92400E" },
  "Nutrition":                  { bg: "#ECFDF5", color: "#065F46" },
  "Activité physique":          { bg: "#DBEAFE", color: "#1D4ED8" },
  "Soutien psychologique":      { bg: "#FDF4FF", color: "#7C3AED" },
  "Administratif":              { bg: "#F9FAFB", color: "#374151" },
  "Autre":                      { bg: "#F3F4F6", color: "#6B7280" },
};

async function telecharger(r) {
  try {
    const res = await ressourceApi.telechargerFichier(r.id);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = r.nomFichier || "fichier";
    a.click();
    URL.revokeObjectURL(url);
  } catch { /* silent */ }
}

function RessourceCard({ r }) {
  const [ouvert, setOuvert] = useState(false);
  const style = CATEGORIE_COLORS[r.categorie] || CATEGORIE_COLORS["Autre"];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, background: style.bg, color: style.color, borderRadius: 20, padding: "3px 10px" }}>
            {r.categorie}
          </span>
          <h3 style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 700 }}>{r.titre}</h3>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", flexShrink: 0, marginTop: 4 }}>
          {r.datePublication ? new Date(r.datePublication).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}
        </div>
      </div>

      {r.description && (
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.5 }}>{r.description}</p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {r.url && (
          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "var(--pine)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            🔗 Ouvrir le lien
          </a>
        )}
        {r.hasFichier && (
          <button onClick={() => telecharger(r)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--ink)" }}>
            📎 Télécharger {r.nomFichier ? `(${r.nomFichier.split(".").pop()?.toUpperCase()})` : ""}
          </button>
        )}
        {r.contenu && (
          <button onClick={() => setOuvert(!ouvert)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--ink)" }}>
            {ouvert ? "▲ Réduire" : "▼ Lire le contenu"}
          </button>
        )}
      </div>

      {ouvert && r.contenu && (
        <div style={{ marginTop: 14, padding: "14px 16px", background: "var(--surface-alt)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--ink)" }}>
          {r.contenu}
        </div>
      )}
    </div>
  );
}

export default function RessourcesMaman() {
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtre, setFiltre]         = useState("Tous");
  const [recherche, setRecherche]   = useState("");

  useEffect(() => {
    ressourceApi.listerPubliees()
      .then(r => setRessources(r.data))
      .catch(() => setRessources([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["Tous", ...new Set(ressources.map(r => r.categorie))];

  const visibles = ressources.filter(r => {
    const matchCat = filtre === "Tous" || r.categorie === filtre;
    const term = recherche.toLowerCase();
    const matchSearch = !term
      || r.titre.toLowerCase().includes(term)
      || (r.description ?? "").toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  return (
    <>
      <h1 className="page-title">Bibliothèque</h1>
      <p className="page-subtitle">Fiches, articles et ressources partagés par l'équipe</p>

      <div style={{ marginBottom: 16 }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} className="input" placeholder="Rechercher une ressource…" style={{ maxWidth: 400 }} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFiltre(c)} style={{
            padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: filtre === c ? "2px solid var(--pine)" : "1.5px solid var(--border)",
            background: filtre === c ? "var(--pine)" : "var(--surface)",
            color: filtre === c ? "#fff" : "var(--ink-muted)",
          }}>{c}</button>
        ))}
      </div>

      {loading && <p>Chargement…</p>}

      {!loading && visibles.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 36, margin: "0 0 8px" }}>📚</p>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {recherche ? "Aucun résultat." : "Aucune ressource disponible pour l'instant."}
            </p>
          </div>
        </div>
      )}

      {!loading && visibles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {visibles.map(r => <RessourceCard key={r.id} r={r} />)}
        </div>
      )}
    </>
  );
}
