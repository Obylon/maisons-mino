import { useEffect } from "react";

/** Fenetre modale generique - fond assombri, fermeture au clic exterieur ou touche Echap. */
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handleEchap = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEchap);
    return () => document.removeEventListener("keydown", handleEchap);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(43, 38, 32, 0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)", borderRadius: "var(--radius)", borderTop: "3px solid var(--pine)",
          padding: "24px 26px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p className="card-title" style={{ margin: 0 }}>{title}</p>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--ink-muted)", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
