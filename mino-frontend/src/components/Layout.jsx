import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const NAV_BY_ROLE = {
  MAMAN: [
    { to: "/maman", label: "Accueil", end: true },
    { to: "/maman/groupe", label: "Mon groupe" },
    { to: "/maman/messagerie", label: "Messagerie" },
    { to: "/maman/calendrier", label: "Calendrier des ateliers" },
    { to: "/maman/prom-prem", label: "Mes questionnaires" },
    { to: "/maman/parcours", label: "Mon parcours" },
    { to: "/maman/profil", label: "Mon profil" },
  ],
  PARTENAIRE: [
    { to: "/partenaire", label: "Accueil", end: true },
    { to: "/partenaire/ateliers", label: "Ateliers P1 / P2" },
    { to: "/partenaire/messagerie", label: "Messagerie coordinatrice" },
    { to: "/partenaire/profil", label: "Mon profil" },
  ],
  PROFESSIONNEL: [
    { to: "/professionnel", label: "Planning", end: true },
    { to: "/professionnel/comptes-rendus", label: "Comptes-rendus" },
    { to: "/professionnel/convention", label: "Convention & facturation" },
    { to: "/professionnel/profil", label: "Mon profil" },
  ],
  COORDINATRICE: [
    { to: "/coordinatrice", label: "Tableau de bord", end: true },
    { to: "/coordinatrice/cohortes", label: "Cohortes & groupes" },
    { to: "/coordinatrice/ateliers", label: "Ateliers" },
    { to: "/coordinatrice/prom-prem", label: "Administration PROM/PREM" },
    { to: "/coordinatrice/questionnaire-modeles", label: "Modèles de questionnaires" },
    { to: "/coordinatrice/comptes-rendus", label: "Comptes-rendus" },
    { to: "/coordinatrice/conventions", label: "Conventions" },
    { to: "/coordinatrice/dossiers", label: "Dossiers archivés" },
    { to: "/coordinatrice/messagerie", label: "Messagerie partenaires" },
    { to: "/coordinatrice/profil", label: "Mon profil" },
    { to: "/coordinatrice/utilisateurs", label: "Utilisateurs" },
    { to: "/coordinatrice/reporting", label: "Reporting" },
  ],
};

const ROLE_LABEL = {
  MAMAN: "Espace Maman",
  PARTENAIRE: "Espace Partenaire",
  PROFESSIONNEL: "Espace Professionnel",
  COORDINATRICE: "Espace Coordinatrice",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_BY_ROLE[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">MAISONS MINO</div>
        <div className="sidebar-role">{ROLE_LABEL[user.role]} · {user.prenom}</div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>Se déconnecter</button>
      </aside>
      <main className="main-content">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <NotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
