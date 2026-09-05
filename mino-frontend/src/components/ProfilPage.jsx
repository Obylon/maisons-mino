import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";

export default function ProfilPage({ extraFields }) {
  const { user } = useAuth();

  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);

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
      <p className="page-subtitle">Informations personnelles et paramètres de compte.</p>

      <div className="card">
        <table className="table-simple">
          <tbody>
            <tr><th>Prénom</th><td>{user.prenom}</td></tr>
            <tr><th>Nom</th><td>{user.nom}</td></tr>
            <tr><th>Email</th><td>{user.email ?? "—"}</td></tr>
            <tr><th>Rôle</th><td><span className={`badge badge-role-${user.role.toLowerCase()}`}>{user.role}</span></td></tr>
            {extraFields}
          </tbody>
        </table>
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
          {message && <p style={{ color: "#4f8a6d" }}>{message}</p>}
          <button className="btn-primary" type="submit" disabled={envoi}>
            {envoi ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </>
  );
}
