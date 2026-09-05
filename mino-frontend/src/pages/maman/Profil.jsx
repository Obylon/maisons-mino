import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi, mamanApi } from "../../services/api";

export default function ProfilMaman() {
  const { user, updateUser } = useAuth();
  const [parcours, setParcours] = useState(null);

  const [nom, setNom] = useState(user.nom || "");
  const [prenom, setPrenom] = useState(user.prenom || "");
  const [telephone, setTelephone] = useState(user.telephone || "");
  const [messageInfos, setMessageInfos] = useState("");
  const [erreurInfos, setErreurInfos] = useState("");
  const [envoiInfos, setEnvoiInfos] = useState(false);

  const [dateTermeGrossesse, setDateTermeGrossesse] = useState("");
  const [dateNaissanceBebe, setDateNaissanceBebe] = useState("");
  const [messageParcours, setMessageParcours] = useState("");
  const [erreurParcours, setErreurParcours] = useState("");
  const [envoiParcours, setEnvoiParcours] = useState(false);

  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    mamanApi.monParcours().then((res) => {
      setParcours(res.data);
      setDateTermeGrossesse(res.data.dateTermeGrossesse || "");
      setDateNaissanceBebe(res.data.dateNaissanceBebe || "");
    }).catch(() => setParcours(null));
  }, []);

  const handleEnregistrerInfos = async (e) => {
    e.preventDefault();
    setErreurInfos("");
    setMessageInfos("");
    setEnvoiInfos(true);
    try {
      const res = await authApi.mettreAJourProfil({ nom: nom.trim(), prenom: prenom.trim(), telephone: telephone.trim() || null });
      updateUser({ nom: res.data.nom, prenom: res.data.prenom, telephone: res.data.telephone });
      setMessageInfos("Informations mises à jour.");
    } catch (err) {
      setErreurInfos(err.response?.data?.message || "La mise à jour a échoué.");
    } finally {
      setEnvoiInfos(false);
    }
  };

  const handleEnregistrerParcours = async (e) => {
    e.preventDefault();
    setErreurParcours("");
    setMessageParcours("");
    setEnvoiParcours(true);
    try {
      await mamanApi.mettreAJourParcours({
        dateTermeGrossesse: dateTermeGrossesse || null,
        dateNaissanceBebe: dateNaissanceBebe || null,
      });
      setMessageParcours("Dates mises à jour.");
      const res = await mamanApi.monParcours();
      setParcours(res.data);
    } catch {
      setErreurParcours("La mise à jour a échoué.");
    } finally {
      setEnvoiParcours(false);
    }
  };

  const handleChangerMotDePasse = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (nouveau !== confirmation) {
      setError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }
    if (nouveau.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setEnvoi(true);
    try {
      await authApi.changerMotDePasse(ancien, nouveau);
      setMessage("Mot de passe modifié avec succès.");
      setAncien("");
      setNouveau("");
      setConfirmation("");
    } catch (err) {
      setError(err.response?.data?.message || "L'ancien mot de passe est incorrect.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Mon profil</h1>
      <p className="page-subtitle">Corrigez ou complétez vos informations à tout moment.</p>

      <div className="card">
        <p className="card-title">Mes informations</p>
        <form onSubmit={handleEnregistrerInfos}>
          <div className="field">
            <label>Prénom</label>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </div>
          <div className="field">
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          <table className="table-simple" style={{ marginBottom: 16 }}>
            <tbody>
              <tr><th>Email</th><td>{user.email ?? "—"}</td></tr>
              <tr><th>Rôle</th><td><span className={`badge badge-role-${user.role.toLowerCase()}`}>{user.role}</span></td></tr>
            </tbody>
          </table>
          {erreurInfos && <p className="error-text">{erreurInfos}</p>}
          {messageInfos && <p style={{ color: "var(--success)" }}>{messageInfos}</p>}
          <button className="btn-primary" type="submit" disabled={envoiInfos}>
            {envoiInfos ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Mon parcours</p>
        <form onSubmit={handleEnregistrerParcours}>
          <div className="field">
            <label>Terme de grossesse</label>
            <input type="date" value={dateTermeGrossesse} onChange={(e) => setDateTermeGrossesse(e.target.value)} />
          </div>
          <div className="field">
            <label>Date de naissance du bébé (si déjà né)</label>
            <input type="date" value={dateNaissanceBebe} onChange={(e) => setDateNaissanceBebe(e.target.value)} />
          </div>
          {erreurParcours && <p className="error-text">{erreurParcours}</p>}
          {messageParcours && <p style={{ color: "var(--success)" }}>{messageParcours}</p>}
          <button className="btn-primary" type="submit" disabled={envoiParcours}>
            {envoiParcours ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>

        {parcours && (
          <table className="table-simple" style={{ marginTop: 16 }}>
            <tbody>
              <tr>
                <th>Entrée dans le parcours</th>
                <td>{parcours.dateEntreeParcours ? new Date(parcours.dateEntreeParcours).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
              <tr>
                <th>Sortie prévue du parcours</th>
                <td>{parcours.dateSortiePrevue ? new Date(parcours.dateSortiePrevue).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
          Les dates d'entrée et de sortie du parcours sont fixées par la coordination —
          contactez-la pour les modifier.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-title">Changer mon mot de passe</p>
        <form onSubmit={handleChangerMotDePasse}>
          <div className="field">
            <label>Mot de passe actuel</label>
            <input type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} required />
          </div>
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required minLength={6} />
          </div>
          <div className="field">
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required minLength={6} />
          </div>
          {error && <p className="error-text">{error}</p>}
          {message && <p style={{ color: "var(--success)" }}>{message}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </>
  );
}