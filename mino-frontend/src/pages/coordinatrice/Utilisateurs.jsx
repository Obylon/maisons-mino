import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, cohorteApi, dossierApi } from "../../services/api";

const ROLES = ["MAMAN", "PARTENAIRE", "PROFESSIONNEL", "COORDINATRICE"];
const SPECIALITES = ["KINESITHERAPEUTE", "SAGE_FEMME", "PSYCHOLOGUE", "SEXOTHERAPEUTE", "DIETETICIENNE"];

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [mamans, setMamans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [derniereCreation, setDerniereCreation] = useState(null);

  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [role, setRole] = useState("MAMAN");
  const [cohorteId, setCohorteId] = useState("");
  const [mamanId, setMamanId] = useState("");
  const [specialite, setSpecialite] = useState(SPECIALITES[0]);
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    Promise.all([adminApi.listerUtilisateurs(), cohorteApi.lister(), adminApi.listerMamans()])
      .then(([resUsers, resCohortes, resMamans]) => {
        setUtilisateurs(resUsers.data);
        setCohortes(resCohortes.data);
        setMamans(resMamans.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleCreer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setDerniereCreation(null);
    try {
      const payload = { email: email.trim(), nom: nom.trim(), prenom: prenom.trim(), role };
      if (role === "MAMAN") {
        payload.cohorteId = cohorteId; // groupeId volontairement absent — assigné plus tard
      }
      if (role === "PARTENAIRE" && mamanId) {
        payload.mamanId = mamanId;
      }
      if (role === "PROFESSIONNEL") {
        payload.specialite = specialite;
      }
      const res = await adminApi.creerCompte(payload);
      setDerniereCreation(res.data);
      setEmail("");
      setNom("");
      setPrenom("");
      setCohorteId("");
      setMamanId("");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleReinitialiser = async (u) => {
    if (!window.confirm(`Générer un nouveau mot de passe temporaire pour ${u.prenom} ${u.nom} ?`)) return;
    try {
      const res = await adminApi.reinitialiserMotDePasse(u.id);
      setDerniereCreation(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "L'opération a échoué.");
    }
  };

  const handleActualiserDossier = async (u) => {
    try {
      await dossierApi.genererPourUtilisateur(u.id);
      alert(`Dossier de ${u.prenom} ${u.nom} actualisé — consultable dans l'onglet Dossiers archivés.`);
    } catch (err) {
      setError(err.response?.data?.message || "L'actualisation du dossier a échoué.");
    }
  };

  const handleSupprimerDefinitivement = async (u) => {
    const confirmation = window.prompt(
      `Suppression DEFINITIVE et IRREVERSIBLE de ${u.prenom} ${u.nom}.\n\n` +
      `Un dossier archive sera automatiquement genere avant suppression (consultable ensuite dans Dossiers archives), mais le compte et toutes ses donnees vivantes (messages, inscriptions...) seront effaces pour de bon.\n\n` +
      `Tape SUPPRIMER en majuscules pour confirmer :`
    );
    if (confirmation !== "SUPPRIMER") return;
    try {
      await adminApi.supprimerDefinitivement(u.id);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  const handleToggleActif = async (u) => {
    try {
      if (u.actif) {
        if (!window.confirm(`Désactiver le compte de ${u.prenom} ${u.nom} ? Il ne pourra plus se connecter.`)) return;
        await adminApi.desactiver(u.id);
      } else {
        await adminApi.activer(u.id);
      }
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "L'opération a échoué.");
    }
  };

  return (
    <>
      <h1 className="page-title">Utilisateurs</h1>
      <p className="page-subtitle">Création de compte, attribution de rôle, désactivation.</p>

      <div className="card">
        <p className="card-title">Nouveau compte</p>
        <form onSubmit={handleCreer}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div className="field">
            <label>Prénom</label>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </div>
          <div className="field">
            <label>Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {role === "MAMAN" && (
            <div className="field">
              <label>Cohorte</label>
              <select value={cohorteId} onChange={(e) => setCohorteId(e.target.value)} required>
                <option value="" disabled>— Choisir une cohorte —</option>
                {cohortes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.ville ? `(${c.ville})` : ""}
                  </option>
                ))}
              </select>
              {cohortes.length === 0 && (
                <small className="error-text">Aucune cohorte n'existe encore — créez-en une dans l'onglet Cohortes.</small>
              )}
              <small style={{ display: "block", marginTop: 4, color: "var(--text-muted, #888)" }}>
                Le groupe n'est pas demandé ici : la maman apparaîtra "en attente" et sera
                affectée à un groupe depuis la <Link to="/coordinatrice/cohortes">page de la cohorte</Link>.
              </small>
            </div>
          )}

          {role === "PARTENAIRE" && (
            <div className="field">
              <label>Maman liée (optionnel)</label>
              <select value={mamanId} onChange={(e) => setMamanId(e.target.value)}>
                <option value="">— Aucune pour l'instant —</option>
                {mamans.map((m) => (
                  <option key={m.mamanId} value={m.mamanId}>
                    {m.prenom} {m.nom}
                  </option>
                ))}
              </select>
              <small style={{ display: "block", marginTop: 4, color: "var(--text-muted, #888)" }}>
                Purement administratif (facturation/logistique) — le partenaire n'a jamais
                accès aux données de la maman, ni son groupe ni ses questionnaires.
              </small>
            </div>
          )}

          {role === "PROFESSIONNEL" && (
            <div className="field">
              <label>Spécialité</label>
              <select value={specialite} onChange={(e) => setSpecialite(e.target.value)}>
                {SPECIALITES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Création..." : "Créer le compte"}
          </button>
        </form>

        {derniereCreation && (
          <p style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "var(--surface-1, #f4f4f4)" }}>
            Compte créé pour <strong>{derniereCreation.email}</strong> — mot de passe temporaire :{" "}
            <code>{derniereCreation.motDePasseTemporaire}</code>
            <br />
            <small>À communiquer à l'utilisateur, cette information ne réapparaîtra plus.</small>
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Liste des utilisateurs</p>
        {loading && <p>Chargement...</p>}
        {!loading && utilisateurs.length === 0 && <p className="empty-state">Aucun utilisateur pour l'instant.</p>}
        {!loading && utilisateurs.length > 0 && (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actif</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id}>
                  <td>{u.prenom} {u.nom}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.actif ? "Oui" : "Non"}</td>
                  <td>
                    <button
                      onClick={() => handleToggleActif(u)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: u.actif ? "#b23b3b" : "#4f8a6d", marginRight: 10 }}
                    >
                      {u.actif ? "Désactiver" : "Réactiver"}
                    </button>
                    <button
                      onClick={() => handleReinitialiser(u)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#1e3a52", marginRight: 10 }}
                    >
                      Réinitialiser mot de passe
                    </button>
                    <button
                      onClick={() => handleActualiserDossier(u)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#1e3a52", marginRight: 10 }}
                    >
                      Actualiser dossier
                    </button>
                    <button
                      onClick={() => handleSupprimerDefinitivement(u)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#b23b3b", fontWeight: 700 }}
                    >
                      Supprimer définitivement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
