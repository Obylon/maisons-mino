import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { groupeApi, messageApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";
import Avatar from "../../components/Avatar";

function dateSep(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const m of messages) {
    const label = dateSep(m.dateEnvoi);
    if (label !== lastDate) {
      groups.push({ type: "sep", label, key: `sep-${m.id}` });
      lastDate = label;
    }
    groups.push({ type: "msg", ...m });
  }
  return groups;
}

export default function MessagerieGroupe() {
  const { user } = useAuth();
  const [groupeId, setGroupeId] = useState(null);
  const [groupe, setGroupe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const { signal, marquerGroupeVu } = useNotificationContext();
  const bottomRef = useRef(null);

  useEffect(() => {
    groupeApi.monGroupe()
      .then((res) => {
        setGroupeId(res.data.id);
        setGroupe(res.data);
        messageApi.marquerLuGroupe(res.data.id).catch(() => {});
        marquerGroupeVu();
        return messageApi.filGroupe(res.data.id);
      })
      .then((res) => setMessages(res.data))
      .catch(() => setError("Impossible de charger la messagerie pour le moment."))
      .finally(() => setLoading(false));
  }, [signal]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    const txt = contenu.trim();
    if (!txt || !groupeId) return;
    setEnvoi(true);
    setContenu("");
    try {
      const res = await messageApi.envoyer(groupeId, txt);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setError("L'envoi du message a échoué.");
      setContenu(txt);
    } finally {
      setEnvoi(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnvoyer(e);
    }
  };

  const grouped = groupByDate(messages);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 170px)" }}>
      <div style={{ flexShrink: 0, marginBottom: 16 }}>
        <h1 className="page-title">Messagerie de groupe</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          {groupe ? `Groupe : ${groupe.nom || "Mon groupe"} · ${groupe.tailleActuelle ?? "?"} membre(s)` : "Espace de parole libre entre les membres de votre groupe."}
        </p>
      </div>

      <div className="card" style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-alt)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Fil de discussion</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, padding: 16, background: "var(--bg)" }}>
          {loading && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Chargement…</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && !error && messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Aucun message</p>
              <p style={{ fontSize: 13 }}>Lancez la conversation !</p>
            </div>
          )}
          {grouped.map((item) =>
            item.type === "sep" ? (
              <div key={item.key} className="chat-date-sep">{item.label}</div>
            ) : (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: item.expediteurId === user?.utilisateurId ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {item.expediteurId !== user?.utilisateurId && (
                  <Avatar prenom={item.expediteurNom?.split(" ")[0]} nom={item.expediteurNom?.split(" ")[1]} size={28} />
                )}
                <div style={{ maxWidth: "70%" }}>
                  {item.expediteurId !== user?.utilisateurId && (
                    <div className="chat-sender-name">{item.expediteurNom}</div>
                  )}
                  <div className={item.expediteurId === user?.utilisateurId ? "chat-bubble-me" : "chat-bubble-other"}>
                    {item.contenu}
                    <div className="chat-time" style={{ textAlign: item.expediteurId === user?.utilisateurId ? "right" : "left" }}>
                      {new Date(item.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <form onSubmit={handleEnvoyer} className="chat-input-bar">
            <textarea
              className="chat-input"
              rows={1}
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message… (Entrée pour envoyer)"
              disabled={envoi}
            />
            <button className="chat-send-btn" type="submit" disabled={!contenu.trim() || envoi} aria-label="Envoyer">
              ➤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
