import { useState, useRef, useEffect } from "react";

/**
 * Menu d'actions compact pour une ligne de tableau - remplace une rangee de
 * boutons texte cote a cote par un seul bouton "..." qui ouvre un menu.
 *
 * actions : [{ label: string, onClick: () => void, danger?: boolean }]
 */
export default function ActionsMenu({ actions }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClicExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", handleClicExterieur);
    return () => document.removeEventListener("mousedown", handleClicExterieur);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-label="Actions"
        style={{
          border: "1px solid var(--border)", background: "var(--paper)", cursor: "pointer",
          borderRadius: "var(--radius)", padding: "4px 10px", fontSize: 16, lineHeight: 1,
          color: "var(--ink-muted)",
        }}
      >
        ⋯
      </button>

      {ouvert && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", minWidth: 210,
          background: "var(--paper)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
          boxShadow: "0 4px 16px rgba(43, 38, 32, 0.12)", zIndex: 30, overflow: "hidden",
        }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setOuvert(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left", border: "none",
                background: "none", cursor: "pointer", padding: "9px 14px", fontSize: 13.5,
                color: action.danger ? "var(--danger)" : "var(--ink)",
                borderBottom: i < actions.length - 1 ? "1px solid var(--border)" : "none",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--sand)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
