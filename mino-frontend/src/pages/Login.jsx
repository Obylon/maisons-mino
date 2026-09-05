import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";

const HOME_BY_ROLE = {
  MAMAN: "/maman",
  PARTENAIRE: "/partenaire",
  PROFESSIONNEL: "/professionnel",
  COORDINATRICE: "/coordinatrice",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [modeOublie, setModeOublie] = useState(false);
  const [emailOublie, setEmailOublie] = useState("");
  const [messageOublie, setMessageOublie] = useState("");
  const [envoiOublie, setEnvoiOublie] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, motDePasse);
      navigate(HOME_BY_ROLE[data.role] || "/");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleMotDePasseOublie = async (e) => {
    e.preventDefault();
    setEnvoiOublie(true);
    setMessageOublie("");
    try {
      const res = await authApi.motDePasseOublie(emailOublie);
      setMessageOublie(res.data);
    } catch {
      setMessageOublie("Une erreur est survenue, réessayez plus tard.");
    } finally {
      setEnvoiOublie(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">MAISONS MINO</div>

        {!modeOublie ? (
          <>
            <h1 className="login-title">Connexion</h1>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setModeOublie(true); setMessageOublie(""); }}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "var(--pine)", marginTop: 12 }}
            >
              Mot de passe oublié ?
            </button>
          </>
        ) : (
          <>
            <h1 className="login-title">Mot de passe oublié</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted, #888)", marginBottom: 12 }}>
              Entrez votre email — si un compte existe, un mot de passe temporaire vous sera envoyé.
            </p>

            <form onSubmit={handleMotDePasseOublie}>
              <div className="field">
                <label htmlFor="email-oublie">Email</label>
                <input
                  id="email-oublie"
                  type="email"
                  value={emailOublie}
                  onChange={(e) => setEmailOublie(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {messageOublie && <p style={{ fontSize: 13, color: "var(--success)" }}>{messageOublie}</p>}

              <button className="btn-primary" type="submit" disabled={envoiOublie}>
                {envoiOublie ? "Envoi..." : "Envoyer"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setModeOublie(false)}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "var(--pine)", marginTop: 12 }}
            >
              ← Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}