// Échelle d'Édimbourg (EPDS) — version française validée
// Items q1 et q2 : score inversé (options[0] = 3 pts, options[3] = 0 pts)
export const EPDS = [
  {
    id: "q1", reverse: true,
    texte: "J'ai pu rire et voir le bon côté des choses",
    options: [
      "Aussi souvent que d'habitude",
      "Pas tout à fait autant",
      "Vraiment beaucoup moins qu'avant",
      "Absolument pas",
    ],
  },
  {
    id: "q2", reverse: true,
    texte: "Je me suis sentie pleine d'entrain et d'espoir",
    options: [
      "Autant que d'habitude",
      "Un peu moins qu'avant",
      "Beaucoup moins qu'avant",
      "Presque pas du tout",
    ],
  },
  {
    id: "q3", reverse: false,
    texte: "Je me suis reprochée des choses sans raison",
    options: ["Jamais", "Rarement", "Oui, parfois", "Oui, très souvent"],
  },
  {
    id: "q4", reverse: false,
    texte: "Je me suis sentie anxieuse ou inquiète sans bonne raison",
    options: ["Pas du tout", "Très rarement", "Oui, parfois", "Oui, très souvent"],
  },
  {
    id: "q5", reverse: false,
    texte: "Je me suis sentie effrayée ou paniquée sans raison valable",
    options: ["Pas du tout", "Non, pas vraiment", "Oui, parfois", "Oui, assez souvent"],
  },
  {
    id: "q6", reverse: false,
    texte: "Les événements m'ont dépassée",
    options: [
      "Je m'en suis sortie aussi bien qu'avant",
      "La plupart du temps, je m'en suis bien sortie",
      "Parfois, j'ai eu du mal",
      "Oui, la plupart du temps je n'ai pas pu faire face",
    ],
  },
  {
    id: "q7", reverse: false,
    texte: "J'ai été si malheureuse que j'ai eu du mal à dormir",
    options: ["Pas du tout", "Pas souvent", "Oui, parfois", "Oui, la plupart du temps"],
  },
  {
    id: "q8", reverse: false,
    texte: "Je me suis sentie triste ou malheureuse",
    options: ["Pas du tout", "Rarement", "Oui, assez souvent", "Oui, la plupart du temps"],
  },
  {
    id: "q9", reverse: false,
    texte: "J'ai été si malheureuse que j'en ai pleuré",
    options: ["Jamais", "Seulement de temps en temps", "Oui, assez souvent", "Oui, très souvent"],
  },
  {
    id: "q10", reverse: false,
    texte: "Il m'est arrivé de penser à me faire du mal",
    options: ["Jamais", "Très rarement", "Parfois", "Oui, assez souvent"],
  },
];

// Enquête expérience patient PREM — Maisons MINO
export const PREM_QUESTIONS = [
  {
    id: "p1", type: "echelle",
    texte: "Note globale de votre expérience à Maisons MINO",
    sous: "De 1 (très insatisfaite) à 10 (excellente)",
    min: 1, max: 10,
  },
  {
    id: "p2", type: "choix",
    texte: "Vous êtes-vous sentie écoutée et soutenue par la coordinatrice ?",
    options: ["Toujours", "La plupart du temps", "Parfois", "Rarement ou jamais"],
  },
  {
    id: "p3", type: "choix",
    texte: "Les ateliers ont-ils répondu à vos besoins et attentes ?",
    options: ["Tout à fait", "Plutôt oui", "Plutôt non", "Non"],
  },
  {
    id: "p4", type: "choix",
    texte: "Avez-vous bénéficié d'un bon accompagnement en cas de difficulté ?",
    options: ["Oui, toujours", "Oui, souvent", "Rarement", "Je n'ai pas eu de difficultés"],
  },
  {
    id: "p5", type: "choix",
    texte: "La coordination entre les professionnels vous a-t-elle semblé efficace ?",
    options: ["Très efficace", "Efficace", "Insuffisante", "Pas concernée"],
  },
  {
    id: "p6", type: "choix",
    texte: "Recommanderiez-vous Maisons MINO à d'autres futures mamans ?",
    options: ["Oui, certainement", "Oui, probablement", "Probablement pas", "Non"],
  },
  {
    id: "p7", type: "texte",
    texte: "Qu'est-ce qui vous a le plus aidé dans votre suivi ?",
    placeholder: "Votre témoignage est précieux pour nous améliorer…",
  },
  {
    id: "p8", type: "texte",
    texte: "Que pourrait-on améliorer ?",
    placeholder: "Toute suggestion est la bienvenue…",
  },
];

export const PHASES = [
  { val: "T0", label: "T0 — Entrée dans le programme" },
  { val: "T1", label: "T1 — 1 mois" },
  { val: "T2", label: "T2 — 3 mois" },
  { val: "T3", label: "T3 — 6 mois" },
  { val: "T4", label: "T4 — Fin de programme" },
];

// ─── Helpers score ────────────────────────────────────────────────────────────
export function scoreEPDS(reponsesJson) {
  try {
    const arr = JSON.parse(reponsesJson);
    if (!Array.isArray(arr)) return null;
    return arr.reduce((tot, item) => {
      const v = typeof item.valeur === "number" ? item.valeur : parseInt(item.valeur, 10);
      if (isNaN(v)) return tot;
      const q = EPDS.find(q => q.id === item.questionId);
      if (!q) return tot;
      return tot + (q.reverse ? 3 - v : v);
    }, 0);
  } catch { return null; }
}

export function interpretationEPDS(score) {
  if (score === null || score === undefined) return null;
  if (score <= 8)  return { label: "Bien-être satisfaisant", color: "#059669", bg: "#ECFDF5", icon: "🌿" };
  if (score <= 12) return { label: "Vigilance conseillée",   color: "#D97706", bg: "#FFFBEB", icon: "⚠️" };
  return               { label: "Soutien recommandé",       color: "#DC2626", bg: "#FEF2F2", icon: "❤️" };
}

export function scorePREM(reponsesJson) {
  try {
    const arr = JSON.parse(reponsesJson);
    if (!Array.isArray(arr)) return null;
    const note = arr.find(a => a.questionId === "p1");
    return note != null ? note.valeur : null;
  } catch { return null; }
}

// Décode un tableau de réponses en objets lisibles
export function decodeReponses(reponsesJson, type) {
  try {
    const arr = JSON.parse(reponsesJson);
    if (!Array.isArray(arr)) return null;
    const defs = type === "PROM" ? EPDS : PREM_QUESTIONS;
    return arr.map(item => {
      const def = defs.find(d => d.id === item.questionId);
      let texteReponse;
      if (typeof item.valeur === "number" && def?.options) {
        texteReponse = def.options[item.valeur] ?? String(item.valeur);
      } else {
        texteReponse = item.valeur != null ? String(item.valeur) : "";
      }
      // Score partiel pour PROM
      let pts = null;
      if (type === "PROM" && def && typeof item.valeur === "number") {
        pts = def.reverse ? 3 - item.valeur : item.valeur;
      }
      return {
        questionId: item.questionId,
        texteQuestion: item.texte || def?.texte || item.questionId,
        texteReponse,
        pts,
        alerte: item.questionId === "q10" && item.valeur > 0,
      };
    });
  } catch { return null; }
}
