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

const FEATURES = [
  "Suivi périnatal personnalisé",
  "Communication simplifiée",
  "Données sécurisées & conformes",
];

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
    } catch {
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
      {/* Hero side */}
      <div className="login-hero">
        <div className="login-hero-logo">M</div>
        <h1 className="login-hero-title">Maisons<br />MINO</h1>
        <p className="login-hero-subtitle">
          La plateforme numérique de suivi périnatal — conçue pour les maisons de naissance et leurs équipes pluridisciplinaires.
        </p>
        <div className="login-hero-features">
          {FEATURES.map((f) => (
            <div key={f} className="login-hero-feature">
              <div className="login-hero-feature-icon">✓</div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-brand">Maisons MINO</div>

          {!modeOublie ? (
            <>
              <h2 className="login-title">Connexion</h2>
              <p className="login-subtitle">Accédez à votre espace personnel.</p>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="email">Adresse e-mail</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
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
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? "Connexion en cours…" : "Se connecter"}
                </button>
              </form>

              <button
                type="button"
                className="login-forgot"
                onClick={() => { setModeOublie(true); setMessageOublie(""); }}
              >
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <>
              <h2 className="login-title">Réinitialisation</h2>
              <p className="login-subtitle">
                Entrez votre e-mail — si un compte existe, un mot de passe temporaire vous sera envoyé.
              </p>

              <form onSubmit={handleMotDePasseOublie}>
                <div className="field">
                  <label htmlFor="email-oublie">Adresse e-mail</label>
                  <input
                    id="email-oublie"
                    type="email"
                    value={emailOublie}
                    onChange={(e) => setEmailOublie(e.target.value)}
                    placeholder="vous@exemple.fr"
                    required
                    autoFocus
                  />
                </div>

                {messageOublie && (
                  <p style={{ fontSize: 13, color: "var(--success)", background: "var(--success-bg)", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                    {messageOublie}
                  </p>
                )}

                <button className="btn-primary" type="submit" disabled={envoiOublie}>
                  {envoiOublie ? "Envoi en cours…" : "Envoyer le lien"}
                </button>
              </form>

              <button
                type="button"
                className="login-forgot"
                onClick={() => setModeOublie(false)}
              >
                ← Retour à la connexion
              </button>
            </>
          )}

          <p style={{ marginTop: 32, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
            Maisons MINO · v2.0 · Données hébergées en France
          </p>
        </div>
      </div>
    </div>
  );
}
