const ROLE_COLORS = {
  MAMAN:         "#1D4ED8",
  PARTENAIRE:    "#92400E",
  PROFESSIONNEL: "#065F46",
  COORDINATRICE: "#4C1D95",
};

export default function Avatar({ prenom, nom, size = 32, role, style }) {
  const initials = ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "?";
  const bg = ROLE_COLORS[role] || "#64748B";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: "-0.5px",
        ...style,
      }}
      aria-label={`${prenom} ${nom}`}
    >
      {initials}
    </div>
  );
}
