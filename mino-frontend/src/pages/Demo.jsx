import { useState } from "react";

// ─── Données mock ─────────────────────────────────────────────────────────────
const MOCK_MESSAGES_GROUPE = [
  { id: "1", expediteurId: "a", expediteurNom: "Marie Dupont",    contenu: "Bonjour tout le monde ! 😊 Hâte de vous retrouver jeudi.", dateEnvoi: "2026-10-10T09:12:00" },
  { id: "2", expediteurId: "b", expediteurNom: "Lucie Martin",    contenu: "Moi aussi ! Est-ce que quelqu'un sait si on peut venir avec les poussettes ?",    dateEnvoi: "2026-10-10T09:18:00" },
  { id: "3", expediteurId: "me",expediteurNom: "Vous",            contenu: "Oui, il y a un espace dédié à l'entrée.",     dateEnvoi: "2026-10-10T09:25:00" },
  { id: "4", expediteurId: "a", expediteurNom: "Marie Dupont",    contenu: "Super merci ! À jeudi alors 🎉",              dateEnvoi: "2026-10-10T10:02:00" },
  { id: "5", expediteurId: "c", expediteurNom: "Sophie Bernard",  contenu: "Je serai là aussi avec mon petit 👶",        dateEnvoi: "2026-10-10T10:15:00" },
];

const MOCK_CONVERSATIONS = [
  { id: "u1", prenom: "Marie",  nom: "Dupont",   nonLus: 2, dernier: "Super merci ! À jeudi" },
  { id: "u2", prenom: "Lucie",  nom: "Martin",   nonLus: 0, dernier: "D'accord, à bientôt !" },
  { id: "u3", prenom: "Sophie", nom: "Bernard",  nonLus: 1, dernier: "Vous pouvez me rappeler ?" },
  { id: "u4", prenom: "Amina",  nom: "Kourouma", nonLus: 0, dernier: "Merci pour les infos 🙏" },
];

const MOCK_GROUPES = [
  { id: "g1", nom: "Groupe Violette", cohorteNom: "Paris 17e · C1", tailleActuelle: 5, tailleCible: 5 },
  { id: "g2", nom: "Groupe Lavande",  cohorteNom: "Paris 17e · C1", tailleActuelle: 3, tailleCible: 5 },
  { id: "g3", nom: "Groupe Jasmin",   cohorteNom: "Vincennes · C2", tailleActuelle: 1, tailleCible: 5 },
  { id: "g4", nom: "Groupe Pivoine",  cohorteNom: "Vincennes · C2", tailleActuelle: 4, tailleCible: 5 },
];

const MOCK_NOTIFS = [
  { id: "n1", expediteur: "Marie",  expediteurNom: "Dupont",  fil: "groupe",    label: "Messagerie groupe" },
  { id: "n2", expediteur: "Joyce",  expediteurNom: "Coord.",  fil: "partenaire",label: "Messagerie partenaires" },
  { id: "n3", expediteur: "Lucie",  expediteurNom: "Martin",  fil: "prive",     label: "Message privé" },
];

const STATS = [
  { label: "Mamans actives",    value: 24, icon: "👩", color: "#1D4ED8", bg: "#EFF6FF" },
  { label: "Groupes",           value: 6,  icon: "🏘️", color: "#4C1D95", bg: "#F5F3FF" },
  { label: "Ateliers ce mois",  value: 12, icon: "📅", color: "#065F46", bg: "#ECFDF5" },
  { label: "Partenaires actifs",value: 8,  icon: "🤝", color: "#92400E", bg: "#FFFBEB" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtH = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function Av({ prenom, nom, color = "#1B4F8A", size = 36 }) {
  const l = ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {l}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: "2px 9px", borderRadius: 999 }}>{children}</span>;
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px", paddingBottom: 10, borderBottom: "2px solid var(--border)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Composant de messagerie demo ─────────────────────────────────────────────
function ChatDemo() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState(MOCK_MESSAGES_GROUPE);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, { id: Date.now().toString(), expediteurId: "me", expediteurNom: "Vous", contenu: input.trim(), dateEnvoi: new Date().toISOString() }]);
    setInput("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: 480, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(10,35,66,0.06)" }}>
      {/* Colonne gauche */}
      <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ padding: "14px 16px", background: "var(--surface-alt)", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
          Conversations · <span style={{ background: "#EF4444", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 800, padding: "1px 6px", marginLeft: 4 }}>3</span>
        </div>
        {MOCK_CONVERSATIONS.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <div style={{ position: "relative" }}>
              <Av prenom={c.prenom} nom={c.nom} color="#1D4ED8" size={36} />
              {c.nonLus > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: "#EF4444", color: "#fff", borderRadius: 999, fontSize: 9, fontWeight: 800, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--surface)" }}>{c.nonLus}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: c.nonLus ? 700 : 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.prenom} {c.nom}</p>
              <p style={{ margin: 0, fontSize: 11, color: c.nonLus ? "var(--primary-light)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: c.nonLus ? 600 : 400 }}>{c.dernier}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Zone chat */}
      <div style={{ display: "flex", flexDirection: "column", background: "var(--surface)" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", flexShrink: 0 }}>
          <Av prenom="M" nom="D" color="#1D4ED8" size={34} />
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>Groupe Violette</p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>5 membres · Paris 17e</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6, background: "var(--bg)" }}>
          {msgs.map(m => {
            const estMoi = m.expediteurId === "me";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: estMoi ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                {!estMoi && <Av prenom={m.expediteurNom.split(" ")[0]} nom={m.expediteurNom.split(" ")[1]} color="#1D4ED8" size={26} />}
                <div style={{ maxWidth: "60%" }}>
                  {!estMoi && <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: "var(--primary-light)", paddingLeft: 4 }}>{m.expediteurNom}</p>}
                  <div style={{ padding: "9px 13px", borderRadius: estMoi ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: estMoi ? "linear-gradient(135deg,#1B4F8A,#3B82F6)" : "var(--surface)", border: estMoi ? "none" : "1px solid var(--border)", color: estMoi ? "#fff" : "var(--text-primary)", fontSize: 13.5, lineHeight: 1.5, boxShadow: "0 1px 3px rgba(10,35,66,0.07)" }}>
                    {m.contenu}
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--text-muted)", textAlign: estMoi ? "right" : "left", paddingLeft: estMoi ? 0 : 4 }}>{fmtH(m.dateEnvoi)}{estMoi && " ✓✓"}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Taper un message… (Entrée)"
            style={{ flex: 1, padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13.5, background: "var(--bg)", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={send} style={{ width: 40, height: 40, borderRadius: 10, background: input.trim() ? "linear-gradient(135deg,#1B4F8A,#3B82F6)" : "var(--border)", border: "none", color: input.trim() ? "#fff" : "var(--text-muted)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Demo() {
  const [bellOpen, setBellOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px", background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Titre ── */}
      <div style={{ marginBottom: 48, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "var(--text-muted)" }}>Maisons MINO · Design system</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>
            Aperçu de l'interface
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Tous les composants, pages et fonctionnalités en un coup d'œil.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/login" style={{ padding: "9px 18px", borderRadius: 8, background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Se connecter →
          </a>
        </div>
      </div>

      {/* ── 1. Palette et typographie ── */}
      <Section title="1 · Palette & typographie">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { name: "Primary deep", val: "#0A2342" }, { name: "Primary", val: "#1B4F8A" },
            { name: "Primary light", val: "#3B82F6" }, { name: "Teal", val: "#0D9488" },
            { name: "Success", val: "#059669" },       { name: "Warning", val: "#D97706" },
            { name: "Danger", val: "#DC2626" },
          ].map(c => (
            <div key={c.name} style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: c.val, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", marginBottom: 6 }} />
              <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)" }}>{c.name}</p>
              <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}>{c.val}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { role: "Maman",         color: "#1D4ED8", bg: "#EFF6FF" },
            { role: "Partenaire",    color: "#92400E", bg: "#FFFBEB" },
            { role: "Professionnel", color: "#065F46", bg: "#ECFDF5" },
            { role: "Coordinatrice",color: "#4C1D95", bg: "#F5F3FF" },
          ].map(r => (
            <span key={r.role} style={{ padding: "5px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, color: r.color, background: r.bg }}>
              {r.role}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Titre h1 — Source Serif 4</h1>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Titre h2 — Source Serif 4</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, margin: 0, color: "var(--text-secondary)" }}>Corps de texte — Inter 14px · secondaire</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, margin: 0, color: "var(--text-muted)" }}>Texte discret — Inter 12px · muted</p>
        </div>
      </Section>

      {/* ── 2. Boutons & badges ── */}
      <Section title="2 · Boutons, badges & états">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <button className="btn-primary">Bouton principal</button>
          <button className="btn-secondary">Bouton secondaire</button>
          <button style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid var(--danger)", color: "var(--danger)", background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Danger</button>
          <button style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid var(--border)", color: "var(--text-muted)", background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "not-allowed", opacity: 0.5 }} disabled>Désactivé</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "Actif",     color: "#059669", bg: "#ECFDF5" },
            { label: "En attente",color: "#D97706", bg: "#FFFBEB" },
            { label: "Complet",   color: "#059669", bg: "#ECFDF5" },
            { label: "3 non lus", color: "#fff",    bg: "#EF4444" },
            { label: "Nouveau",   color: "#fff",    bg: "#3B82F6" },
          ].map(b => (
            <Badge key={b.label} color={b.color} bg={b.bg}>{b.label}</Badge>
          ))}
        </div>
      </Section>

      {/* ── 3. Cartes statistiques (Dashboard) ── */}
      <Section title="3 · Dashboard — cartes statistiques">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(10,35,66,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 999 }}>+5%</span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. Notifications ── */}
      <Section title="4 · Cloche de notifications">
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            style={{ position: "relative", width: 44, height: 44, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            🔔
            <span style={{ position: "absolute", top: 6, right: 6, width: 10, height: 10, background: "#EF4444", borderRadius: "50%", border: "2px solid var(--surface)", animation: "pulse 1.5s infinite" }} />
          </button>
          {bellOpen && (
            <div style={{ position: "absolute", top: 52, right: 0, width: 360, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "0 8px 32px rgba(10,35,66,0.12)", zIndex: 100 }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications <span style={{ background: "#EF4444", color: "#fff", borderRadius: 999, fontSize: 10, padding: "1px 6px", marginLeft: 4 }}>3</span></p>
                <button onClick={() => setBellOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>✕</button>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {MOCK_NOTIFS.map(n => {
                  const filColor = n.fil === "groupe" ? "#1D4ED8" : n.fil === "prive" ? "#4C1D95" : "#92400E";
                  const filBg    = n.fil === "groupe" ? "#EFF6FF" : n.fil === "prive" ? "#F5F3FF" : "#FFFBEB";
                  return (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <Av prenom={n.expediteur} nom={n.expediteurNom} color={filColor} size={36} />
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 13 }}>
                          <strong>{n.expediteur} {n.expediteurNom}</strong> vous a envoyé un message
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 600, color: filColor, background: filBg, padding: "2px 8px", borderRadius: 999 }}>{n.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "10px 16px", display: "flex", gap: 8, borderTop: "1px solid var(--border)" }}>
                <button style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)" }}>
                  Tout marquer lu
                </button>
                <button style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--danger)" }}>
                  Effacer toutes
                </button>
              </div>
            </div>
          )}
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>Cliquez sur la cloche pour voir le panneau de notifications.</p>
      </Section>

      {/* ── 5. Interface de messagerie ── */}
      <Section title="5 · Interface de messagerie — liste + bulles">
        <ChatDemo />
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
          Champ de saisie actif — tapez un message et appuyez sur Entrée.
        </p>
      </Section>

      {/* ── 6. Groupes ── */}
      <Section title="6 · Groupes de mamans — temps réel">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {MOCK_GROUPES.map(g => {
            const pct = Math.round((g.tailleActuelle / g.tailleCible) * 100);
            const color = g.tailleActuelle === g.tailleCible ? "#059669" : g.tailleActuelle >= 3 ? "#3B82F6" : "#D97706";
            const complet = g.tailleActuelle === g.tailleCible;
            return (
              <div key={g.id} style={{ background: "var(--surface)", border: `1px solid ${complet ? "rgba(5,150,105,0.25)" : "var(--border)"}`, borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(10,35,66,0.06)", position: "relative" }}>
                {complet && <Badge color="#059669" bg="#ECFDF5" style={{ position: "absolute", top: 12, right: 12 }}>Complet</Badge>}
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{g.nom}</p>
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>{g.cohorteNom}</p>
                <div style={{ display: "flex", marginBottom: 10 }}>
                  {Array.from({ length: g.tailleActuelle }).map((_, i) => (
                    <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: ["#1D4ED8","#0D9488","#4C1D95","#92400E","#065F46"][i % 5], border: "2px solid var(--surface)", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.4s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{g.tailleActuelle}/{g.tailleCible}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 7. Sidebar ── */}
      <Section title="7 · Sidebar de navigation">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { role: "COORDINATRICE", color: "#4C1D95", links: ["Tableau de bord", "Cohortes & groupes", "Groupes", "Ateliers", "Messagerie partenaires", "Reporting"] },
            { role: "MAMAN",         color: "#1D4ED8", links: ["Accueil", "Mon groupe", "Messagerie groupe", "Messages privés", "Calendrier", "Mon parcours"] },
            { role: "PARTENAIRE",    color: "#92400E", links: ["Accueil", "Ateliers P1/P2", "Messagerie", "Mon profil"] },
            { role: "PROFESSIONNEL", color: "#065F46", links: ["Planning", "Comptes-rendus", "Mes évaluations", "Convention", "Mon profil"] },
          ].map(r => (
            <div key={r.role} style={{ background: "var(--primary-deep)", borderRadius: 14, padding: 0, overflow: "hidden", width: 220, flexShrink: 0 }}>
              <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>Maisons <span style={{ color: "#0D9488" }}>MINO</span></p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Plateforme périnatalité</p>
              </div>
              <div style={{ padding: "10px 10px 6px" }}>
                {r.links.map(l => (
                  <div key={l} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>{l}</div>
                ))}
              </div>
              <div style={{ padding: "8px 18px 14px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: r.color, background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 999 }}>{r.role}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. Page de connexion ── */}
      <Section title="8 · Formulaire de connexion">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", maxWidth: 780, boxShadow: "0 4px 20px rgba(10,35,66,0.10)" }}>
          <div style={{ background: "linear-gradient(160deg, #0A2342 0%, #1B4F8A 60%, #0D9488 100%)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 16px" }}>Plateforme périnatalité</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 12px", lineHeight: 1.3 }}>Accompagner les mamans dès le début</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>Un espace sécurisé pour coordonner les soins périnataux et tisser des liens durables.</p>
          </div>
          <div style={{ background: "var(--surface)", padding: "48px 40px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Connexion</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Adresse e-mail</label>
              <input readOnly value="joyce@maisonsmino.fr" style={{ width: "100%", padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13.5, background: "var(--surface-alt)", color: "var(--text-primary)", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Mot de passe</label>
              <input type="password" readOnly value="mino2026" style={{ width: "100%", padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13.5, background: "var(--surface-alt)", color: "var(--text-primary)", fontFamily: "inherit" }} />
            </div>
            <a href="/login" style={{ display: "block", width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#1B4F8A,#3B82F6)", color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
              Se connecter →
            </a>
          </div>
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Maisons MINO · Interface médicale périnatalité · 2026</p>
        <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-light)", textDecoration: "none" }}>Accéder à l'application →</a>
      </div>

    </div>
  );
}
