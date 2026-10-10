import { useEffect, useState, useCallback, useRef } from "react";
import { ressourceApi } from "../../services/api";

const CATEGORIES = [
  "Allaitement", "Sommeil", "Dépression périnatale", "Préparation à la naissance",
  "Vie de couple", "Nutrition", "Activité physique", "Soutien psychologique",
  "Administratif", "Autre",
];

const VIDE = { titre: "", description: "", categorie: CATEGORIES[0], url: "", contenu: "", publiee: true };

export default function RessourcesAdmin() {
  const [ressources, setRessources]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);   // null | "creer" | ressource
  const [form, setForm]               = useState(VIDE);
  const [fichier, setFichier]         = useState(null);
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState("");
  const [filtreCategorie, setFiltre]  = useState("Tous");
  const fileRef                       = useRef(null);

  const charger = useCallback(() => {
    setLoading(true);
    ressourceApi.listerTout()
      .then(r => setRessources(r.data))
      .catch(() => setRessources([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirCreer = () => {
    setForm(VIDE);
    setFichier(null);
    setErr("");
    setModal("creer");
  };

  const ouvrirEditer = (r) => {
    setForm({
      titre: r.titre, description: r.description ?? "",
      categorie: r.categorie, url: r.url ?? "",
      contenu: r.contenu ?? "", publiee: r.publiee,
    });
    setFichier(null);
    setErr("");
    setModal(r);
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) { setErr("Le titre est obligatoire."); return; }
    setSaving(true);
    setErr("");
    try {
      let savedId;
      if (modal === "creer") {
        const res = await ressourceApi.creer(form);
        savedId = res.data.id;
      } else {
        await ressourceApi.modifier(modal.id, form);
        savedId = modal.id;
      }
      if (fichier) {
        await ressourceApi.uploadFichier(savedId, fichier);
      }
      setModal(null);
      charger();
    } catch (e) {
      setErr(e?.response?.data?.message || "Une erreur est survenue, vérifiez le formulaire.");
    } finally {
      setSaving(false);
    }
  };

  const supprimerFichier = async (r) => {
    if (!confirm("Supprimer la pièce jointe ?")) return;
    await ressourceApi.supprimerFichier(r.id).catch(() => {});
    charger();
  };

  const supprimer = async (id) => {
    if (!confirm("Supprimer cette ressource définitivement ?")) return;
    await ressourceApi.supprimer(id).catch(() => {});
    charger();
  };

  const telecharger = async (r) => {
    try {
      const res = await ressourceApi.telechargerFichier(r.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.nomFichier || "fichier";
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  const categoriesDisponibles = ["Tous", ...new Set(ressources.map(r => r.categorie))];
  const filtrees = filtreCategorie === "Tous" ? ressources : ressources.filter(r => r.categorie === filtreCategorie);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bibliothèque de ressources</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Publiez des fiches, liens et documents pour les mamans.
          </p>
        </div>
        <button className="btn-primary" onClick={ouvrirCreer}>+ Nouvelle ressource</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total",      value: ressources.length,                        color: "#1D4ED8" },
          { label: "Publiées",   value: ressources.filter(r => r.publiee).length, color: "#059669" },
          { label: "Brouillons", value: ressources.filter(r => !r.publiee).length, color: "#D97706" },
          { label: "Avec fichier", value: ressources.filter(r => r.hasFichier).length, color: "#7C3AED" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 20px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filtre catégories */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {categoriesDisponibles.map(c => (
          <button key={c} onClick={() => setFiltre(c)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: filtreCategorie === c ? "2px solid var(--pine)" : "1.5px solid var(--border)",
            background: filtreCategorie === c ? "var(--pine)" : "var(--surface)",
            color: filtreCategorie === c ? "#fff" : "var(--ink-muted)",
          }}>{c}</button>
        ))}
      </div>

      {/* Liste */}
      <div className="card">
        {loading && <p style={{ color: "var(--ink-muted)" }}>Chargement…</p>}
        {!loading && filtrees.length === 0 && (
          <div className="empty-state">
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>📚</p>
            <p style={{ margin: 0 }}>Aucune ressource.</p>
          </div>
        )}
        {!loading && filtrees.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Fichier</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.titre}</div>
                    {r.description && (
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                        {r.description.slice(0, 70)}{r.description.length > 70 ? "…" : ""}
                      </div>
                    )}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--pine)" }}>
                        🔗 Lien
                      </a>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 12, background: "#EFF6FF", color: "#1D4ED8", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                      {r.categorie}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "3px 10px", background: r.publiee ? "#ECFDF5" : "#FFF7ED", color: r.publiee ? "#059669" : "#D97706" }}>
                      {r.publiee ? "Publiée" : "Brouillon"}
                    </span>
                  </td>
                  <td>
                    {r.hasFichier ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button onClick={() => telecharger(r)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--pine)", padding: 0, fontWeight: 600 }}>
                          📎 {r.nomFichier ? r.nomFichier.slice(0, 20) + (r.nomFichier.length > 20 ? "…" : "") : "Fichier"}
                        </button>
                        <button onClick={() => supprimerFichier(r)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#DC2626", padding: 0 }} title="Supprimer le fichier">✕</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--ink-muted)", fontSize: 13 }}>
                    {r.datePublication ? new Date(r.datePublication).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => ouvrirEditer(r)} style={{ border: "1.5px solid var(--border)", background: "var(--surface)", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Modifier
                      </button>
                      <button onClick={() => supprimer(r.id)} style={{ border: "1.5px solid #FCA5A5", background: "#FEF2F2", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#DC2626" }}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal créer / modifier */}
      {modal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,35,66,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setModal(null)}>
          <div style={{ background: "var(--surface)", borderRadius: 18, maxWidth: 620, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(10,35,66,0.22)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {modal === "creer" ? "Nouvelle ressource" : `Modifier — ${modal.titre}`}
              </p>
              <button onClick={() => setModal(null)} style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 16, color: "var(--ink-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <form onSubmit={soumettre} style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {err && <p style={{ color: "#DC2626", margin: 0, fontSize: 13, background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{err}</p>}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="input" placeholder="Titre de la ressource" maxLength={200} required />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Catégorie *</label>
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Description courte</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Résumé visible dans la liste" />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Lien externe (URL)</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="input"
                  placeholder="https://…"
                  type="text"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Contenu texte</label>
                <textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} className="input" rows={4} placeholder="Texte libre, conseils, explications…" style={{ resize: "vertical", fontFamily: "inherit" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Pièce jointe {modal !== "creer" && modal?.hasFichier ? <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>(fichier actuel : {modal.nomFichier})</span> : ""}
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={e => setFichier(e.target.files[0] || null)}
                  style={{ fontSize: 13 }}
                />
                {fichier && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--pine)" }}>
                    ✓ {fichier.name} ({(fichier.size / 1024).toFixed(0)} Ko)
                  </p>
                )}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={form.publiee} onChange={e => setForm(f => ({ ...f, publiee: e.target.checked }))} />
                Publier immédiatement (visible par les mamans)
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Enregistrement…" : modal === "creer" ? "Créer" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
