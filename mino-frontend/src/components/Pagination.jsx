export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 14 }}>
      <button
        className="btn-primary"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        style={{ padding: "4px 12px", fontSize: 13 }}
      >
        ← Précédent
      </button>
      <span style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>
        Page {page + 1} / {totalPages}
      </span>
      <button
        className="btn-primary"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        style={{ padding: "4px 12px", fontSize: 13 }}
      >
        Suivant →
      </button>
    </div>
  );
}
