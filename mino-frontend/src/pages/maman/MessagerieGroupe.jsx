import { useEffect, useState } from "react";
import { groupeApi, messageApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";

export default function MessagerieGroupe() {
  const [groupeId, setGroupeId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const { signal } = useNotificationContext();

  useEffect(() => {
    groupeApi
      .monGroupe()
      .then((res) => {
        setGroupeId(res.data.id);
        messageApi.marquerLuGroupe(res.data.id).catch(() => {}); // marque comme lu à l'ouverture
        return messageApi.filGroupe(res.data.id);
      })
      .then((res) => setMessages(res.data))
      .catch(() => setError("Impossible de charger la messagerie pour le moment."))
      .finally(() => setLoading(false));
  }, [signal]); // se re-charge automatiquement des qu'une notification temps reel arrive

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    if (!contenu.trim() || !groupeId) return;
    setEnvoi(true);
    try {
      const res = await messageApi.envoyer(groupeId, contenu.trim());
      setMessages((prev) => [...prev, res.data]);
      setContenu("");
    } catch {
      setError("L'envoi du message a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Messagerie de groupe</h1>
      <p className="page-subtitle">Espace de parole libre entre les 5 femmes de votre groupe.</p>

      <div className="card">
        <p className="card-title">Fil de discussion</p>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <>
            {messages.length === 0 ? (
              <p className="empty-state">Aucun message pour l'instant — lancez la conversation !</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {messages.map((m) => (
                  <div key={m.id} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface-1, #f4f4f4)" }}>
                    <strong>{m.expediteurNom}</strong>
                    <p style={{ margin: "4px 0 0" }}>{m.contenu}</p>
                    <span style={{ fontSize: 12, color: "var(--text-muted, #999)" }}>
                      {new Date(m.dateEnvoi).toLocaleString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleEnvoyer} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Écrire un message..."
                style={{ flex: 1 }}
              />
              <button className="btn-primary" type="submit" disabled={envoi}>
                Envoyer
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
