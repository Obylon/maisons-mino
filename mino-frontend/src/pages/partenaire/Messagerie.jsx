import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { messageApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function fmtHeure(d) {
  return d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
}

function dateSep(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime())     return "Aujourd'hui";
  if (d.getTime() === yesterday.getTime()) return "Hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDate(messages) {
  const items = [];
  let last = null;
  for (const m of messages) {
    const sep = dateSep(m.dateEnvoi);
    if (sep !== last) { items.push({ _sep: true, label: sep, key: `sep-${m.id}` }); last = sep; }
    items.push(m);
  }
  return items;
}

// ─── Avatar initiales ─────────────────────────────────────────────────────────
function Av({ initiales, color = "#1B4F8A", size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initiales || "C"}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MessageriePartenaire() {
  const { user } = useAuth();
  const { signal } = useNotificationContext();

  const [messages, setMessages]   = useState([]);
  const [contenu, setContenu]     = useState("");
  const [loading, setLoading]     = useState(true);
  const [envoi, setEnvoi]         = useState(false);
  const [error, setError]         = useState("");
  const [coordNom, setCoordNom]   = useState("Coordinatrice");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  // La convention : conversationId = l'id utilisateur du partenaire
  const conversationId = user.utilisateurId;

  const charger = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      await messageApi.marquerLuConversation(conversationId).catch(() => {});
      const res = await messageApi.conversation(conversationId);
      const msgs = res.data;
      setMessages(msgs);
      // Récupère le nom de la coordinatrice depuis les messages reçus
      const msgCoor = msgs.find((m) => m.expediteurId !== user.utilisateurId);
      if (msgCoor) setCoordNom(msgCoor.expediteurNom || "Coordinatrice");
    } catch {
      if (!silent) setError("Impossible de charger la conversation.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId, user.utilisateurId]);

  useEffect(() => { charger(); }, [charger]);

  // Refresh sur signal SSE
  useEffect(() => { charger(true); }, [signal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll toutes les 10s
  useEffect(() => {
    pollRef.current = setInterval(() => charger(true), 10_000);
    return () => clearInterval(pollRef.current);
  }, [charger]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Envoi ──
  const handleEnvoyer = async () => {
    const txt = contenu.trim();
    if (!txt || envoi) return;
    setEnvoi(true);
    setContenu("");
    try {
      const res = await messageApi.envoyerConversation(conversationId, txt);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setContenu(txt);
      setError("L'envoi a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnvoyer(); }
  };

  const coordInitiales = coordNom
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const rendered = groupByDate(messages);

  // ── Rendu ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 170px)" }}>
      {/* En-tête page */}
      <div style={{ flexShrink: 0, marginBottom: 16 }}>
        <h1 className="page-title">Messagerie</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Canal direct avec la coordinatrice — questions pratiques et logistiques.
        </p>
      </div>

      {/* Zone chat */}
      <div style={{
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 2px 8px rgba(10,35,66,0.06)",
      }}>
        {/* Header conv */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
          background: "var(--surface)", display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
        }}>
          <Av initiales={coordInitiales} color="#1B4F8A" size={40} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {coordNom}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Coordinatrice · Maisons MINO</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => charger()}
              style={{
                border: "1.5px solid var(--border)", background: "var(--surface)",
                borderRadius: 8, padding: "5px 12px", fontSize: 12,
                fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)",
              }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto",
          padding: "20px 24px", display: "flex", flexDirection: "column",
          gap: 4, background: "var(--bg)",
        }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
              <div style={{
                width: 28, height: 28, border: "3px solid var(--border)",
                borderTopColor: "var(--primary-light)", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            </div>
          ) : error ? (
            <div style={{
              textAlign: "center", marginTop: 60, color: "var(--danger)",
              background: "var(--danger-bg)", padding: "16px 24px", borderRadius: 10,
            }}>
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 80 }}>
              <p style={{ fontSize: 40, margin: "0 0 12px" }}>👋</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>
                Démarrez la conversation
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Envoyez votre premier message à la coordinatrice.
              </p>
            </div>
          ) : (
            rendered.map((item) => {
              if (item._sep) {
                return (
                  <div key={item.key} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0 8px",
                  }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>
                );
              }

              const estMoi = item.expediteurId === user?.utilisateurId;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: estMoi ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  {!estMoi && <Av initiales={coordInitiales} color="#1B4F8A" size={28} />}
                  <div style={{ maxWidth: "65%" }}>
                    {!estMoi && (
                      <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, color: "var(--primary-light)", paddingLeft: 4 }}>
                        {item.expediteurNom}
                      </p>
                    )}
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: estMoi ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: estMoi
                        ? "linear-gradient(135deg, #92400E 0%, #B45309 100%)"
                        : "var(--surface)",
                      border: estMoi ? "none" : "1px solid var(--border)",
                      color: estMoi ? "#fff" : "var(--text-primary)",
                      fontSize: 14, lineHeight: 1.5,
                      boxShadow: "0 1px 3px rgba(10,35,66,0.07)",
                    }}>
                      {item.contenu}
                    </div>
                    <p style={{
                      margin: "3px 0 0", fontSize: 10.5, color: "var(--text-muted)",
                      textAlign: estMoi ? "right" : "left",
                      paddingLeft: estMoi ? 0 : 4,
                      paddingRight: estMoi ? 4 : 0,
                    }}>
                      {fmtHeure(item.dateEnvoi)}
                      {estMoi && <span style={{ marginLeft: 4 }}>✓✓</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Barre d'envoi */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid var(--border)",
          background: "var(--surface)", display: "flex", gap: 10,
          alignItems: "flex-end", flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire à la coordinatrice… (Entrée pour envoyer)"
            rows={1}
            style={{
              flex: 1, padding: "11px 14px",
              border: "1.5px solid var(--border)", borderRadius: 12,
              fontSize: 14, resize: "none", background: "var(--bg)",
              color: "var(--text-primary)", maxHeight: 120, lineHeight: 1.5,
              fontFamily: "inherit", transition: "border-color 0.15s", outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary-light)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={handleEnvoyer}
            disabled={!contenu.trim() || envoi}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: contenu.trim() && !envoi
                ? "linear-gradient(135deg, #92400E, #B45309)"
                : "var(--border)",
              border: "none",
              color: contenu.trim() && !envoi ? "#fff" : "var(--text-muted)",
              fontSize: 18, cursor: contenu.trim() && !envoi ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
