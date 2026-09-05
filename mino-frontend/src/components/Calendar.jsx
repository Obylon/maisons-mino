import { useState } from "react";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatDateLocale(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calendrier mensuel reutilisable. "evenementsParJour" est un objet
 * { "2026-09-15": [ ... ] } - la cle est une date au format YYYY-MM-DD.
 * Au clic sur un jour, appelle onJourClic(dateStr, evenementsDuJour).
 */
export default function Calendar({ evenementsParJour = {}, onJourClic }) {
  const [moisAffiche, setMoisAffiche] = useState(() => {
    const auj = new Date();
    return new Date(auj.getFullYear(), auj.getMonth(), 1);
  });

  const annee = moisAffiche.getFullYear();
  const mois = moisAffiche.getMonth();

  const premierJourMois = new Date(annee, mois, 1);
  const dernierJourMois = new Date(annee, mois + 1, 0);
  const nbJoursMois = dernierJourMois.getDate();

  // Decalage pour que la semaine commence un Lundi (0 = Lundi ... 6 = Dimanche)
  const decalage = (premierJourMois.getDay() + 6) % 7;

  const cellules = [];
  for (let i = 0; i < decalage; i++) cellules.push(null);
  for (let jour = 1; jour <= nbJoursMois; jour++) cellules.push(new Date(annee, mois, jour));
  while (cellules.length % 7 !== 0) cellules.push(null);

  const aujourdHui = formatDateLocale(new Date());

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button
          onClick={() => setMoisAffiche(new Date(annee, mois - 1, 1))}
          style={{ border: "1px solid var(--border)", background: "var(--paper)", borderRadius: "var(--radius)", padding: "4px 10px", cursor: "pointer" }}
        >
          ←
        </button>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--pine)", margin: 0, fontSize: 17 }}>
          {MOIS[mois]} {annee}
        </p>
        <button
          onClick={() => setMoisAffiche(new Date(annee, mois + 1, 1))}
          style={{ border: "1px solid var(--border)", background: "var(--paper)", borderRadius: "var(--radius)", padding: "4px 10px", cursor: "pointer" }}
        >
          →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {JOURS.map((j) => (
          <div key={j} style={{ background: "var(--sand)", padding: "6px 0", textAlign: "center", fontSize: 12, fontWeight: 500, color: "var(--ink-muted)" }}>
            {j}
          </div>
        ))}

        {cellules.map((date, i) => {
          if (!date) return <div key={i} style={{ background: "var(--paper)", minHeight: 70 }} />;
          const dateStr = formatDateLocale(date);
          const evenements = evenementsParJour[dateStr] || [];
          const estAujourdHui = dateStr === aujourdHui;

          return (
            <button
              key={i}
              onClick={() => onJourClic?.(dateStr, evenements)}
              style={{
                background: "var(--paper)", border: "none", cursor: "pointer", minHeight: 70,
                padding: "6px 6px", textAlign: "left", display: "flex", flexDirection: "column", gap: 3,
              }}
            >
              <span style={{
                fontSize: 12.5, fontWeight: estAujourdHui ? 700 : 400,
                color: estAujourdHui ? "var(--clay)" : "var(--ink)",
              }}>
                {date.getDate()}
              </span>
              {evenements.slice(0, 2).map((ev, idx) => (
                <span key={idx} style={{
                  fontSize: 10.5, background: "var(--role-professionnel-bg)", color: "var(--role-professionnel)",
                  borderRadius: 4, padding: "1px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {ev.titre || ev.type}
                </span>
              ))}
              {evenements.length > 2 && (
                <span style={{ fontSize: 10, color: "var(--ink-muted)" }}>+{evenements.length - 2} autre(s)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
