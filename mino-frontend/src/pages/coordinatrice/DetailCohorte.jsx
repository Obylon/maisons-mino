import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { cohorteApi, groupeApi } from "../../services/api";

const initiales = (prenom) => (prenom?.[0] ?? "").toUpperCase();

export default function DetailCohorte() {
  const { id } = useParams();

  const [cohorte, setCohorte] = useState(null);
  const [enAttente, setEnAttente] = useState([]);
  const [groupes, setGroupes] = useState([]); // [{ ...GroupeResponse, membres: [...] }]
  const [selection, setSelection] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [afficherFormGroupe, setAfficherFormGroupe] = useState(false);
  const [nomGroupe, setNomGroupe] = useState("");

  const charger = async () => {
    setLoading(true);
    setError("");
    try {
      const [resCohorte, resAttente, resGroupes] = await Promise.all([
        cohorteApi.obtenir(id),
        cohorteApi.mamansEnAttente(id),
        groupeApi.lister(),
      ]);
      setCohorte(resCohorte.data);
      setEnAttente(resAttente.data);

      const groupesDeCetteCohorte = resGroupes.data.filter((g) => g.cohorteId === id);
      const groupesAvecMembres = await Promise.all(
        groupesDeCetteCohorte.map(async (g) => {
          const resMembres = await groupeApi.membres(g.id);
          return { ...g, membres: resMembres.data };
        })
      );
      setGroupes(groupesAvecMembres);
    } catch {
      setError("Impossible de charger cette cohorte pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleSelection = (mamanId) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(mamanId)) next.delete(mamanId);
      else next.add(mamanId);
      return next;
    });
  };

  const handleConstituer = async () => {
    if (selection.size === 0) return;
    setEnvoi(true);
    setMessage("");
    setError("");
    try {
      await groupeApi.constituer({
        cohorteId: id,
        dateConstitution: new Date().toISOString().slice(0, 10),
        mamanIds: Array.from(selection),
      });
      setMessage(`Groupe créé avec ${selection.size} femme${selection.size > 1 ? "s" : ""}.`);
      setSelection(new Set());
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La constitution du groupe a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleCreerGroupeVide = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setMessage("");
    setError("");
    try {
      await groupeApi.creer({
        cohorteId: id,
        nom: nomGroupe.trim() || null,
        dateConstitution: new Date().toISOString().slice(0, 10),
      });
      setMessage("Groupe créé — vous pouvez maintenant y ajouter des femmes.");
      setNomGroupe("");
      setAfficherFormGroupe(false);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La création du groupe a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleAjouterAuGroupe = async (mamanId, groupeId) => {
    if (!groupeId) return;
    setError("");
    setMessage("");
    try {
      await groupeApi.ajouterMaman(groupeId, mamanId);
      setMessage("Femme ajoutée au groupe.");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "L'ajout au groupe a échoué.");
    }
  };

  const handleRetirerMembre = async (groupeId, mamanId, prenom) => {
    if (!window.confirm(`Retirer ${prenom} de ce groupe ? Elle repassera "en attente".`)) return;
    setError("");
    setMessage("");
    try {
      await groupeApi.retirerMaman(groupeId, mamanId);
      setMessage(`${prenom} retirée du groupe.`);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "Le retrait a échoué.");
    }
  };

  const handleSupprimerGroupe = async (groupeId, nomAffiche) => {
    if (!window.confirm(`Supprimer ${nomAffiche} ? Les femmes qui y sont repasseront "en attente".`)) return;
    setError("");
    setMessage("");
    try {
      await groupeApi.supprimer(groupeId);
      setMessage("Groupe supprimé.");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error && !cohorte) return <p className="error-text">{error}</p>;

  const groupesNonComplets = groupes.filter((g) => g.tailleActuelle < g.tailleCible);

  return (
    <>
      <p style={{ fontSize: 13, color: "var(--text-muted, #888)", marginBottom: 4 }}>
        <Link to="/coordinatrice/cohortes">Cohortes &amp; groupes</Link> &nbsp;/&nbsp; {cohorte.nom}
      </p>
      <h1 className="page-title">{cohorte.nom}</h1>
      <p className="page-subtitle">Constitution des groupes de 5 · l'effet village.</p>

      {message && <p style={{ color: "#4f8a6d" }}>{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <p className="card-title">Informations cohorte</p>
          <table className="table-simple">
            <tbody>
              <tr><td>Ville</td><td>{cohorte.ville ?? "—"}</td></tr>
              <tr><td>Date de début</td><td>{cohorte.dateDebut ? new Date(cohorte.dateDebut).toLocaleDateString("fr-FR") : "—"}</td></tr>
              <tr><td>Groupes constitués</td><td>{groupes.length}</td></tr>
              <tr><td>En attente d'affectation</td><td>{enAttente.length}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <p className="card-title">Aperçu rapide</p>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{groupes.length}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>groupes</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{enAttente.length}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>en attente</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="card-title" style={{ margin: 0 }}>
            Femmes en attente d'affectation ({enAttente.length})
          </p>
          <button className="btn-primary" disabled={selection.size === 0 || envoi} onClick={handleConstituer}>
            {envoi ? "Création..." : `Créer un nouveau groupe avec la sélection (${selection.size})`}
          </button>
        </div>

        {enAttente.length === 0 ? (
          <p className="empty-state">Aucune femme en attente — toutes les mamans de cette cohorte ont un groupe.</p>
        ) : (
          <table className="table-simple">
            <thead>
              <tr>
                <th></th>
                <th>Nom</th>
                <th>Terme prévu</th>
                <th>Ajouter à un groupe existant</th>
              </tr>
            </thead>
            <tbody>
              {enAttente.map((m) => (
                <tr key={m.mamanId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selection.has(m.mamanId)}
                      onChange={() => toggleSelection(m.mamanId)}
                    />
                  </td>
                  <td>{m.prenom} {m.nom}</td>
                  <td>{m.dateTermeGrossesse ? new Date(m.dateTermeGrossesse).toLocaleDateString("fr-FR") : "—"}</td>
                  <td>
                    {groupesNonComplets.length === 0 ? (
                      <span style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>Aucun groupe disponible</span>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={(e) => handleAjouterAuGroupe(m.mamanId, e.target.value)}
                      >
                        <option value="" disabled>— Choisir un groupe —</option>
                        {groupesNonComplets.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nom || "Groupe sans nom"} ({g.tailleActuelle}/{g.tailleCible})
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="card-title" style={{ margin: 0 }}>Groupes constitués ({groupes.length})</p>
          <button className="btn-primary" onClick={() => setAfficherFormGroupe((v) => !v)}>
            {afficherFormGroupe ? "Annuler" : "+ Créer un groupe vide"}
          </button>
        </div>

        {afficherFormGroupe && (
          <form onSubmit={handleCreerGroupeVide} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Nom du groupe (ex: Groupe A)"
              value={nomGroupe}
              onChange={(e) => setNomGroupe(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" type="submit" disabled={envoi}>
              {envoi ? "Création..." : "Créer"}
            </button>
          </form>
        )}

        {groupes.length === 0 ? (
          <p className="empty-state">Aucun groupe constitué pour l'instant.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {groupes.map((g) => (
              <div key={g.id} style={{ border: "1px solid var(--border, #e4e1da)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong>{g.nom || "Groupe sans nom"}</strong>
                  <button
                    onClick={() => handleSupprimerGroupe(g.id, g.nom || "ce groupe")}
                    style={{ border: "none", background: "none", color: "#b23b3b", cursor: "pointer", fontSize: 12 }}
                  >
                    Supprimer
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted, #888)", marginBottom: 8 }}>
                  {g.tailleActuelle}/{g.tailleCible} membres
                  {g.tailleActuelle >= g.tailleCible && (
                    <span style={{ marginLeft: 8, fontWeight: 700, color: "#4f8a6d" }}>Complet</span>
                  )}
                </div>
                {g.membres.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>Aucune femme pour l'instant.</p>
                ) : (
                  g.membres.map((m) => (
                    <div key={m.utilisateurId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", background: "#c98a4b", color: "#fff",
                        fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {initiales(m.prenom)}
                      </span>
                      <span style={{ flex: 1 }}>{m.prenom}</span>
                      <button
                        onClick={() => handleRetirerMembre(g.id, m.mamanId, m.prenom)}
                        style={{ border: "none", background: "none", color: "#b23b3b", cursor: "pointer", fontSize: 11 }}
                      >
                        Retirer
                      </button>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
