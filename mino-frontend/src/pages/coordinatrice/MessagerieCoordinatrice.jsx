import { useEffect, useRef, useState, useCallback } from "react";
import { adminApi, messageApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotificationContext } from "../../context/NotificationContext";

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function fmtHeure(d)  { return d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""; }
function fmtRelative(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)        return "à l'instant";
  if (diff < 3_600_000)     return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)    return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function dateSep(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  d.setHours(0,0,0,0);
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
function Av({ prenom, nom, size = 36, color = "#92400E" }) {
  const letters = ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>{letters}</div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MessagerieCoordinatrice() {
  const { user } = useAuth();
  const { signal } = useNotificationContext();

  const [partenaires, setPartenaires]     = useState([]);
  const [nonLusMap, setNonLusMap]         = useState({});
  const [dernierMsgMap, setDernierMsgMap] = useState({});
  const [selectionne, setSelectionne]     = useState(null);
  const [messages, setMessages]           = useState([]);
  const [contenu, setContenu]             = useState("");
  const [loadingListe, setLoadingListe]   = useState(true);
  const [loadingConv, setLoadingConv]     = useState(false);
  const [envoi, setEnvoi]                 = useState(false);
  const [error, setError]                 = useState("");
  const [mobileVue, setMobileVue]         = useState("liste"); // "liste" | "chat"
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  // ── Chargement liste partenaires + badges ──
  const chargerListe = useCallback(async () => {
    try {
      const res = await adminApi.listerUtilisateurs(0, 200);
      const pts = (res.data.content ?? res.data).filter((u) => u.role === "PARTENAIRE" && u.actif);
      setPartenaires(pts);
      const counts = await Promise.all(
        pts.map((p) => messageApi.nonLusConversation(p.utilisateurId ?? p.id).then((r) => [p.utilisateurId ?? p.id, r.data]).catch(() => [p.utilisateurId ?? p.id, 0]))
      );
      setNonLusMap(Object.fromEntries(counts));
    } catch { setError("Impossible de charger les partenaires."); }
    finally  { setLoadingListe(false); }
  }, []);

  useEffect(() => { chargerListe(); }, [chargerListe]);

  // ── Chargement conversation ──
  const chargerConversation = useCallback(async (partenaire, silent = false) => {
    if (!partenaire) return;
    if (!silent) setLoadingConv(true);
    try {
      const res = await messageApi.conversation(partenaire.utilisateurId ?? partenaire.id);
      const msgs = res.data;
      setMessages(msgs);
      if (msgs.length > 0) {
        setDernierMsgMap((prev) => ({ ...prev, [partenaire.utilisateurId ?? partenaire.id]: msgs[msgs.length - 1] }));
      }
      await messageApi.marquerLuConversation(partenaire.utilisateurId ?? partenaire.id).catch(() => {});
      setNonLusMap((prev) => ({ ...prev, [partenaire.utilisateurId ?? partenaire.id]: 0 }));
    } catch { if (!silent) setError("Impossible de charger la conversation."); }
    finally   { if (!silent) setLoadingConv(false); }
  }, []);

  useEffect(() => {
    setMessages([]);
    chargerConversation(selectionne);
    inputRef.current?.focus();
  }, [selectionne, chargerConversation]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selectionne) return;
    pollRef.current = setInterval(() => chargerConversation(selectionne, true), 10_000);
    return () => clearInterval(pollRef.current);
  }, [selectionne, chargerConversation]);

  useEffect(() => {
    if (selectionne) chargerConversation(selectionne, true);
    chargerListe();
  }, [signal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Envoi ──
  const handleEnvoyer = async () => {
    const txt = contenu.trim();
    if (!txt || !selectionne || envoi) return;
    setEnvoi(true);
    setContenu("");
    try {
      const res = await messageApi.envoyerConversation(selectionne.utilisateurId ?? selectionne.id, txt);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setContenu(txt);
      setError("L'envoi a échoué.");
    } finally { setEnvoi(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnvoyer(); }
  };

  const selectionnerPartenaire = (p) => {
    setSelectionne(p);
    setMobileVue("chat");
  };

  const revenirListe = () => {
    setMobileVue("liste");
  };

  const ptId = (p) => p.utilisateurId ?? p.id;
  const totalNonLus = Object.values(nonLusMap).reduce((a, b) => a + b, 0);

  // ── Rendu ──
  return (
    <div className="messagerie-wrapper">
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Messagerie partenaires</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Conversations 1-à-1 avec chaque partenaire.</p>
        </div>
      </div>

      <div className="messagerie-grid" data-vue={mobileVue}>

        {/* ── Colonne gauche : liste partenaires ── */}
        <div className="messagerie-liste">
          {/* Header liste */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface-alt)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Partenaires
              </span>
              {totalNonLus > 0 && (
                <span style={{ background: "#EF4444", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 800, padding: "2px 7px" }}>
                  {totalNonLus} non lu{totalNonLus > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingListe ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 10, width: "80%" }} />
                  </div>
                </div>
              ))
            ) : partenaires.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>🤝</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Aucun partenaire actif.</p>
              </div>
            ) : (
              partenaires.map((p) => {
                const id = ptId(p);
                const nonLus = nonLusMap[id] || 0;
                const dernier = dernierMsgMap[id];
                const actif = selectionne && ptId(selectionne) === id;
                return (
                  <div
                    key={id}
                    onClick={() => selectionnerPartenaire(p)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      borderBottom: "1px solid var(--border)",
                      borderLeft: actif ? "3px solid var(--primary-light)" : "3px solid transparent",
                      background: actif ? "rgba(59,130,246,0.06)" : "transparent",
                      cursor: "pointer", transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { if (!actif) e.currentTarget.style.background = "var(--surface-alt)"; }}
                    onMouseLeave={(e) => { if (!actif) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ position: "relative" }}>
                      <Av prenom={p.prenom} nom={p.nom} size={40} color="#92400E" />
                      {nonLus > 0 && (
                        <span style={{
                          position: "absolute", top: -4, right: -4,
                          background: "#EF4444", color: "#fff", borderRadius: 999,
                          fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "0 3px", border: "2px solid var(--surface)",
                        }}>
                          {nonLus > 9 ? "9+" : nonLus}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: nonLus > 0 ? 700 : 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.prenom} {p.nom}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11.5, color: nonLus > 0 ? "var(--primary-light)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: nonLus > 0 ? 600 : 400 }}>
                        {nonLus > 0
                          ? `${nonLus} nouveau${nonLus > 1 ? "x" : ""} message${nonLus > 1 ? "s" : ""}`
                          : dernier
                            ? dernier.contenu.slice(0, 35) + (dernier.contenu.length > 35 ? "…" : "")
                            : p.email}
                      </p>
                    </div>

                    {dernier && (
                      <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, alignSelf: "flex-start", marginTop: 2 }}>
                        {fmtRelative(dernier.dateEnvoi)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Colonne droite : conversation ── */}
        <div className="messagerie-chat">
          {!selectionne ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--text-muted)" }}>
              <span style={{ fontSize: 48 }}>💬</span>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "var(--text-secondary)" }}>Sélectionnez un partenaire</p>
                <p style={{ margin: 0, fontSize: 13 }}>Choisissez une conversation dans la liste à gauche.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 12 }}>
                <button className="messagerie-back-btn" onClick={revenirListe} aria-label="Retour">
                  ← Retour
                </button>
                <Av prenom={selectionne.prenom} nom={selectionne.nom} size={38} color="#92400E" />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {selectionne.prenom} {selectionne.nom}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{selectionne.email}</p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <button
                    onClick={() => chargerConversation(selectionne)}
                    style={{ border: "1.5px solid var(--border)", background: "var(--surface)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)" }}
                  >
                    ↻
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, background: "var(--bg)" }}>
                {loadingConv ? (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
                    <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--primary-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", marginTop: 60, color: "var(--text-muted)" }}>
                    <p style={{ fontSize: 36, margin: "0 0 12px" }}>👋</p>
                    <p style={{ fontSize: 14, margin: 0 }}>Démarrez la conversation avec {selectionne.prenom}.</p>
                  </div>
                ) : (
                  groupByDate(messages).map((item) => {
                    if (item._sep) {
                      return (
                        <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0 8px" }}>
                          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{item.label}</span>
                          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                        </div>
                      );
                    }

                    const estMoi = item.expediteurId === user?.utilisateurId;
                    return (
                      <div key={item.id} style={{ display: "flex", flexDirection: estMoi ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
                        {!estMoi && <Av prenom={selectionne.prenom} nom={selectionne.nom} size={28} color="#92400E" />}
                        <div style={{ maxWidth: "65%" }}>
                          {!estMoi && (
                            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, color: "#92400E", paddingLeft: 4 }}>
                              {item.expediteurNom}
                            </p>
                          )}
                          <div style={{
                            padding: "10px 14px",
                            borderRadius: estMoi ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: estMoi
                              ? "linear-gradient(135deg, #1B4F8A 0%, #3B82F6 100%)"
                              : "var(--surface)",
                            border: estMoi ? "none" : "1px solid var(--border)",
                            color: estMoi ? "#fff" : "var(--text-primary)",
                            fontSize: 14, lineHeight: 1.5,
                            boxShadow: "0 1px 3px rgba(10,35,66,0.07)",
                          }}>
                            {item.contenu}
                          </div>
                          <p style={{ margin: "3px 0 0", fontSize: 10.5, color: "var(--text-muted)", textAlign: estMoi ? "right" : "left", paddingLeft: estMoi ? 0 : 4, paddingRight: estMoi ? 4 : 0 }}>
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
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  ref={inputRef}
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Écrire à ${selectionne.prenom}… (Entrée pour envoyer)`}
                  rows={1}
                  style={{
                    flex: 1, padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 12,
                    fontSize: 14, resize: "none", background: "var(--bg)", color: "var(--text-primary)",
                    maxHeight: 120, lineHeight: 1.5, fontFamily: "inherit",
                    transition: "border-color 0.15s", outline: "none",
                  }}
                  onFocus={(e)  => (e.target.style.borderColor = "var(--primary-light)")}
                  onBlur={(e)   => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={handleEnvoyer}
                  disabled={!contenu.trim() || envoi}
                  style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: contenu.trim() && !envoi
                      ? "linear-gradient(135deg, #1B4F8A, #3B82F6)"
                      : "var(--border)",
                    border: "none", color: contenu.trim() && !envoi ? "#fff" : "var(--text-muted)",
                    fontSize: 18, cursor: contenu.trim() && !envoi ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  ➤
                </button>
              </div>

              {error && (
                <div style={{ padding: "8px 16px", background: "var(--danger-bg)", color: "var(--danger)", fontSize: 13 }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
