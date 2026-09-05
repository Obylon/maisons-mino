import { Link } from "react-router-dom";

/** Bouton retour visible, a placer en haut de toute page "imbriquee" (fiche detail, sous-page...). */
export default function BackLink({ to, label = "Retour" }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none",
        color: "var(--pine)", fontSize: 13.5, fontWeight: 500, marginBottom: 16,
      }}
    >
      <span aria-hidden="true">←</span> {label}
    </Link>
  );
}
