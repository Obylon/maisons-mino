import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { groupeApi, messagePriveApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";
import Avatar from "../../components/Avatar";

function dateSep(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function groupByDate(messages) {
  const result = [];
  let lastDate = null;
  for (const msg of messages) {
    const day = new Date(msg.dateEnvoi).toDateString();
    if (day !== lastDate) {
      result.push({ type: "sep", label: dateSep(msg.dateEnvoi), key: "sep-" + msg.dateEnvoi });
      lastDate = day;
    }
    result.push(msg);
  }
  return result;
}

function timeStr(dateStr) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageriePrivee() {
  const { user } = useAuth();
  const [membres, setMembres] = useState([]);
  const [nonLusParMembre, setNonLusParMembre] = useState({});
  const [membreSelectionne, setMembreSelectionne] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const { signal, marquerPriveVu } = useNotificationContext();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const chargerMembresEtCompteurs = useCallback(() => {
    groupeApi
      .monGroupe()
      .then(async (res) => {
        const autres = res.data.membres.filter((m) => m.utilisateurId !== user.utilisateurId);
        setMembres(autres);
        const compteurs = {};
        await Promise.all(
          autres.map(async (m) => {
            try {
              const r = await messagePriveApi.nonLus(m.utilisateurId);
              compteurs[m.utilisateurId] = r.data;
            } catch {
              compteurs[m.utilisateurId] = 0;
            }
          })
        );
        setNonLusParMembre(compteurs);
      })
      .catch(() => setError("Impossible de charger votre groupe pour le moment."))
      .finally(() => setLoading(false));
  }, [user.utilisateurId]);

  useEffect(() => {
    chargerMembresEtCompteurs();
  }, [chargerMembresEtCompteurs, signal]);

  useEffect(() => {
    if (!membreSelectionne) return;
    messagePriveApi.marquerLu(membreSelectionne.utilisateurId).catch(() => {});
    messagePriveApi
      .conversation(membreSelectionne.utilisateurId)
      .then((res) => setMessages(res.data))
      .catch(() => setError("Impossible de charger cette conversation."));

    setNonLusParMembre((prev) => {
      const next = { ...prev, [membreSelectionne.utilisateurId]: 0 };
      if (!Object.values(next).some((n) => n > 0)) marquerPriveVu();
      return next;
    });
    inputRef.current?.focus();
  }, [membreSelectionne]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnvoyer = async () => {
    if (!contenu.trim() || !membreSelectionne || envoi) return;
    setEnvoi(true);
    try {
      const res = await messagePriveApi.envoyer(membreSelectionne.utilisateurId, contenu.trim());
      setMessages((prev) => [...prev, res.data]);
      setContenu("");
    } catch {
      setError("L'envoi du message a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnvoyer();
    }
  };

  const rendered = groupByDate(messages);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 170px)" }}>
      <div style={{ flexShrink: 0 }}>
        <h1 className="page-title">Messages privés</h1>
        <p className="page-subtitle" style={{ marginBottom: 16 }}>
          Conversations strictement privées avec les autres mamans de votre groupe.
        </p>
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {/* ── Colonne gauche : liste des conversations ── */}
        <div className="conv-list" style={{ display: "flex", flexDirection: "column" }}>
          <div className="conv-list-header">
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Messages privés</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {membres.length} membre{membres.length > 1 ? "s" : ""} dans le groupe
            </div>
          </div>

          {loading && (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div className="skeleton skeleton-avatar" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: "60%", height: 12, marginBottom: 6 }} />
                    <div className="skeleton skeleton-text" style={{ width: "80%", height: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: 16 }}>
              <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>
            </div>
          )}

          {!loading && membres.length === 0 && !error && (
            <div style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Aucune autre maman dans votre groupe pour l'instant.
              </p>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {membres.map((m) => {
              const nonLus = nonLusParMembre[m.utilisateurId] || 0;
              const actif = membreSelectionne?.mamanId === m.mamanId;
              return (
                <div
                  key={m.mamanId}
                  className={"conv-item" + (actif ? " active" : "")}
                  onClick={() => setMembreSelectionne(m)}
                >
                  <Avatar prenom={m.prenom} nom={m.nom} size={36} role="MAMAN" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="conv-item-name">{m.prenom} {m.nom}</div>
                    <div className="conv-last-msg">
                      {actif && messages.length > 0
                        ? (messages[messages.length - 1].expediteurId === user.utilisateurId ? "Vous : " : "")
                          + messages[messages.length - 1].contenu
                        : "Cliquez pour voir la conversation"}
                    </div>
                  </div>
                  {nonLus > 0 && (
                    <span className="conv-unread-badge">{nonLus > 9 ? "9+" : nonLus}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Colonne droite : conversation ── */}
        <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border)" }}>
          {!membreSelectionne ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "var(--bg)", gap: 12,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(27,79,138,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>💬</div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15, margin: 0 }}>
                Sélectionnez une conversation
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, textAlign: "center", maxWidth: 260 }}>
                Choisissez une maman dans la liste pour démarrer ou reprendre une conversation privée.
              </p>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="chat-header" style={{ borderRadius: 0, borderLeft: "none", borderTop: "none", borderRight: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar prenom={membreSelectionne.prenom} nom={membreSelectionne.nom} size={38} role="MAMAN" />
                  <div>
                    <div className="chat-header-title">{membreSelectionne.prenom} {membreSelectionne.nom}</div>
                    <div className="chat-header-sub">Conversation privée · visible uniquement par vous deux</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, color: "var(--success)", background: "var(--success-bg)",
                  padding: "4px 10px", borderRadius: 999, fontWeight: 600,
                }}>
                  🔒 Chiffrée
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none" }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ fontSize: 40 }}>✉️</div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                      Aucun message — dites bonjour à {membreSelectionne.prenom} !
                    </p>
                  </div>
                )}
                {rendered.map((item) => {
                  if (item.type === "sep") {
                    return <div key={item.key} className="chat-date-sep">{item.label}</div>;
                  }
                  const estMoi = item.expediteurId === user.utilisateurId;
                  return (
                    <div key={item.id} className={"chat-msg-row" + (estMoi ? " mine" : "")}>
                      {!estMoi && (
                        <div className="chat-avatar-sm">
                          {(membreSelectionne.prenom?.[0] || "").toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className={estMoi ? "chat-bubble-me" : "chat-bubble-other"}>
                          {item.contenu}
                        </div>
                        <div className="chat-bubble-meta" style={{ textAlign: estMoi ? "right" : "left" }}>
                          {timeStr(item.dateEnvoi)}
                          {estMoi && item.lu && (
                            <span style={{ marginLeft: 5, color: "var(--primary-light)" }}>✓✓</span>
                          )}
                          {estMoi && !item.lu && (
                            <span style={{ marginLeft: 5, color: "var(--text-muted)" }}>✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="chat-input-bar" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderBottom: "none" }}>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  rows={1}
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Écrire à ${membreSelectionne.prenom}…`}
                  style={{ minHeight: 44 }}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleEnvoyer}
                  disabled={!contenu.trim() || envoi}
                  title="Envoyer (Entrée)"
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
