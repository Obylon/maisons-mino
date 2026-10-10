import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext({ toast: () => {} });

let _id = 0;

const ICONS = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className="toast-icon">{ICONS[t.type] || "ℹ"}</span>
            <span className="toast-body">{t.message}</span>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fermer">✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
