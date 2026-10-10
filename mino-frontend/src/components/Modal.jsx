import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handleEchap = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEchap);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEchap);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10, 35, 66, 0.4)",
        backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 20,
        animation: "modalFadeIn 0.18s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: "28px 32px",
          width: "100%",
          maxWidth: 520,
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(10, 35, 66, 0.2)",
          border: "1px solid var(--border)",
          animation: "modalSlideUp 0.22s ease both",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              border: "none", background: "var(--surface-alt)", cursor: "pointer",
              width: 30, height: 30, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "var(--text-muted)", lineHeight: 1,
              transition: "background 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-alt)"}
          >
            ✕
          </button>
        </div>
        {children}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
