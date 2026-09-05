import { useEffect, useState } from "react";
import { adminApi, messageApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";

export default function MessagerieCoordinatrice() {
  const [partenaires, setPartenaires] = useState([]);
  const [partenaireSelectionne, setPartenaireSelectionne] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const { signal } = useNotificationContext();

  useEffect(() => {
    adminApi
      .listerUtilisateurs()
      .then((res) => setPartenaires(res.data.filter((u) => u.role === "PARTENAIRE" && u.actif)))
      .catch(() => setError("Impossible de charger la liste des partenaires."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!partenaireSelectionne) return;
    messageApi.marquerLuConversation(partenaireSelectionne.id).catch(() => {});
    messageApi
      .conversation(partenaireSelectionne.id)
      .then((res) => setMessages(res.data))
      .catch(() => setError("Impossible de charger cette conversation."));
  }, [partenaireSelectionne, signal]);

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    if (!contenu.trim() || !partenaireSelectionne) return;
    setEnvoi(true);
    try {
      const res = await messageApi.envoyerConversation(partenaireSelectionne.id, contenu.trim());
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
      <h1 className="page-title">Messagerie partenaires</h1>
      <p className="page-subtitle">Conversations 1-à-1 avec chaque partenaire — questions pratiques et logistiques.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div className="card">
          <p className="card-title">Partenaires ({partenaires.length})</p>
          {loading && <p>Chargement...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && partenaires.length === 0 && (
            <p className="empty-state">Aucun partenaire actif pour l'instant.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {partenaires.map((p) => (
              <button
                key={p.id}
                onClick={() => setPartenaireSelectionne(p)}
                style={{
                  textAlign: "left", padding: "8px 10px", borderRadius: 6, border: "none",
                  cursor: "pointer", background: partenaireSelectionne?.id === p.id ? "var(--surface-1, #eee)" : "transparent",
                }}
              >
                {p.prenom} {p.nom}
                <br />
                <span style={{ fontSize: 11, color: "var(--text-muted, #888)" }}>{p.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="card-title">
            {partenaireSelectionne ? `Conversation avec ${partenaireSelectionne.prenom} ${partenaireSelectionne.nom}` : "Sélectionnez un partenaire"}
          </p>
          {!partenaireSelectionne ? (
            <p className="empty-state">Choisissez un partenaire dans la liste pour voir la conversation.</p>
          ) : (
            <>
              {messages.length === 0 ? (
                <p className="empty-state">Aucun message pour l'instant.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 360, overflowY: "auto" }}>
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
      </div>
    </>
  );
}
