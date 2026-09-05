/**
 * Écran "à connecter" : structure et intitulé définitifs, contenu à brancher sur l'API.
 * Évite d'avoir des pages vides pendant le développement itératif du backend.
 */
export default function ApiPendingCard({ title, endpoint, description }) {
  return (
    <div className="card">
      <p className="card-title">{title}</p>
      {description && <p style={{ marginBottom: 10 }}>{description}</p>}
      <p className="empty-state" style={{ padding: "16px 0" }}>
        À connecter à <code>{endpoint}</code>
      </p>
    </div>
  );
}
