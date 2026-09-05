import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, cohorteApi, dossierApi } from "../../services/api";
import ActionsMenu from "../../components/ActionsMenu";
import Pagination from "../../components/Pagination";
import Modal from "../../components/Modal";

const ROLES = ["MAMAN", "PARTENAIRE", "PROFESSIONNEL", "COORDINATRICE"];
const SPECIALITES = ["KINESITHERAPEUTE", "SAGE_FEMME", "PSYCHOLOGUE", "SEXOTHERAPEUTE", "DIETETICIENNE"];

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cohortes, setCohortes] = useState([]);
  const [mamans, setMamans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [derniereCreation, setDerniereCreation] = useState(null);
  const [modalOuverte, setModalOuverte] = useState(false);

  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState("MAMAN");
  const [cohorteId, setCohorteId] = useState("");
  const [dateTermeGrossesse, setDateTermeGrossesse] = useState("");
  const [dateNaissanceBebe, setDateNaissanceBebe] = useState("");
  const [dateEntreeParcours, setDateEntreeParcours] = useState("");
  const [dateSortiePrevue, setDateSortiePrevue] = useState("");
  const [mamanId, setMamanId] = useState("");
  const [specialite, setSpecialite] = useState(SPECIALITES[0]);
  const [statutConventionnement, setStatutConventionnement] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    Promise.all([adminApi.listerUtilisateurs(page), cohorteApi.lister(), adminApi.listerMamans()])
      .then(([resUsers, resCohortes, resMamans]) => {
        setUtilisateurs(resUsers.data.content);
        setTotalPages(resUsers.data.totalPages);
        setCohortes(resCohortes.data);
        setMamans(resMamans.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, [page]);

  const reinitialiserFormulaire = () => {
    setEmail(""); setNom(""); setPrenom(""); setTelephone(""); setCohorteId("");
    setDateTermeGrossesse(""); setDateNaissanceBebe(""); setDateEntreeParcours(""); setDateSortiePrevue("");
    setMamanId(""); setStatutConventionnement("");
  };

  const ouvrirNouveauCompte = () => {
    setDerniereCreation(null);
    reinitialiserFormulaire();
    setModalOuverte(true);
  };

  const fermerModal = () => {
    setModalOuverte(false);
    setDerniereCreation(null);
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setError("");
    try {
      const payload = {
        email: email.trim(), nom: nom.trim(), prenom: prenom.trim(),
        telephone: telephone.trim() || null, role,
      };
      if (role === "MAMAN") {
        payload.cohorteId = cohorteId; // groupeId volontairement absent — assigné plus tard
        payload.dateTermeGrossesse = dateTermeGrossesse || null;
        payload.dateNaissanceBebe = dateNaissanceBebe || null;
        payload.dateEntreeParcours = dateEntreeParcours || null;
        payload.dateSortiePrevue = dateSortiePrevue || null;
      }
      if (role === "PARTENAIRE" && mamanId) {
        payload.mamanId = mamanId;
      }
      if (role === "PROFESSIONNEL") {
        payload.specialite = specialite;
        payload.statutConventionnement = statutConventionnement.trim() || null;
      }
      const res = await adminApi.creerCompte(payload);
      setDerniereCreation(res.data); // la modale reste ouverte pour afficher le mot de passe
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
      setModalOuverte(true); // reutilise la meme modale juste pour afficher le mot de passe
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">Création de compte, attribution de rôle, désactivation.</p>
        </div>
        <button className="btn-primary" onClick={ouvrirNouveauCompte}>+ Nouveau compte</button>
      </div>

      <Modal open={modalOuverte} onClose={fermerModal} title={derniereCreation ? "Compte créé" : "Nouveau compte"}>
        {derniereCreation ? (
          <div>
            <p style={{ marginTop: 0 }}>
              Compte créé pour <strong>{derniereCreation.email}</strong> — mot de passe temporaire :
            </p>
            <p style={{ padding: "10px 14px", background: "var(--sand)", borderRadius: "var(--radius)", fontFamily: "monospace", fontSize: 15 }}>
              {derniereCreation.motDePasseTemporaire}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
              À communiquer à l'utilisateur — cette information ne réapparaîtra plus.
              La personne pourra compléter ou corriger ses informations depuis son
              propre profil une fois connectée.
            </p>
            <button className="btn-primary" onClick={fermerModal}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleCreer}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
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
              <label>Téléphone</label>
              <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
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
              <>
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
                  <small style={{ display: "block", marginTop: 4, color: "var(--ink-muted)" }}>
                    Le groupe n'est pas demandé ici : la maman apparaîtra "en attente" et sera
                    affectée à un groupe depuis la <Link to="/coordinatrice/cohortes">page de la cohorte</Link>.
                  </small>
                </div>
                <div className="field">
                  <label>Terme de grossesse (si connu)</label>
                  <input type="date" value={dateTermeGrossesse} onChange={(e) => setDateTermeGrossesse(e.target.value)} />
                </div>
                <div className="field">
                  <label>Date de naissance du bébé (si déjà né)</label>
                  <input type="date" value={dateNaissanceBebe} onChange={(e) => setDateNaissanceBebe(e.target.value)} />
                </div>
                <div className="field">
                  <label>Entrée dans le parcours (M-4)</label>
                  <input type="date" value={dateEntreeParcours} onChange={(e) => setDateEntreeParcours(e.target.value)} />
                </div>
                <div className="field">
                  <label>Sortie prévue du parcours (10 mois du bébé)</label>
                  <input type="date" value={dateSortiePrevue} onChange={(e) => setDateSortiePrevue(e.target.value)} />
                </div>
                <small style={{ display: "block", marginTop: -8, marginBottom: 14, color: "var(--ink-muted)" }}>
                  Ces dates pourront être corrigées ou complétées plus tard par la maman
                  elle-même, depuis son profil.
                </small>
              </>
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
                <small style={{ display: "block", marginTop: 4, color: "var(--ink-muted)" }}>
                  Purement administratif (facturation/logistique) — le partenaire n'a jamais
                  accès aux données de la maman, ni son groupe ni ses questionnaires.
                </small>
              </div>
            )}

            {role === "PROFESSIONNEL" && (
              <>
                <div className="field">
                  <label>Spécialité</label>
                  <select value={specialite} onChange={(e) => setSpecialite(e.target.value)}>
                    {SPECIALITES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Statut de conventionnement</label>
                  <input
                    value={statutConventionnement}
                    onChange={(e) => setStatutConventionnement(e.target.value)}
                    placeholder="Ex: Conventionné secteur 1"
                  />
                </div>
              </>
            )}

            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" type="submit" disabled={envoi}>
              {envoi ? "Création..." : "Créer le compte"}
            </button>
          </form>
        )}
      </Modal>

      <div className="card">
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
                    <ActionsMenu
                      actions={[
                        {
                          label: u.actif ? "Désactiver" : "Réactiver",
                          onClick: () => handleToggleActif(u),
                          danger: u.actif,
                        },
                        { label: "Réinitialiser le mot de passe", onClick: () => handleReinitialiser(u) },
                        { label: "Actualiser le dossier", onClick: () => handleActualiserDossier(u) },
                        { label: "Supprimer définitivement", onClick: () => handleSupprimerDefinitivement(u), danger: true },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </>
  );
}