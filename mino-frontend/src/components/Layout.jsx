import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import NotificationBell from "./NotificationBell";
import { useState, useEffect } from "react";

const ROLE_LABEL = {
  MAMAN:         "Espace Maman",
  PARTENAIRE:    "Espace Partenaire",
  PROFESSIONNEL: "Espace Professionnel",
  COORDINATRICE: "Espace Coordinatrice",
};

const NAV_BY_ROLE = {
  MAMAN: [
    { to: "/maman",                   label: "Accueil",                end: true },
    { to: "/maman/groupe",            label: "Mon groupe" },
    { to: "/maman/messagerie",        label: "Messagerie groupe",      notif: "groupe" },
    { to: "/maman/messagerie-privee", label: "Messages privés",        notif: "prive" },
    { to: "/maman/evaluer",           label: "Évaluer mes ateliers" },
    { to: "/maman/calendrier",        label: "Calendrier des ateliers" },
    { to: "/maman/prom-prem",         label: "Mes questionnaires" },
    { to: "/maman/parcours",          label: "Mon parcours" },
    { to: "/maman/ressources",        label: "Bibliothèque" },
    { to: "/maman/profil",            label: "Mon profil" },
  ],
  PARTENAIRE: [
    { to: "/partenaire",              label: "Accueil",                end: true },
    { to: "/partenaire/ateliers",     label: "Ateliers P1 / P2" },
    { to: "/partenaire/messagerie",   label: "Messagerie" },
    { to: "/partenaire/profil",       label: "Mon profil" },
  ],
  PROFESSIONNEL: [
    { to: "/professionnel",                label: "Planning",                end: true },
    { to: "/professionnel/comptes-rendus", label: "Comptes-rendus" },
    { to: "/professionnel/evaluations",    label: "Mes évaluations" },
    { to: "/professionnel/convention",     label: "Convention & facturation" },
    { to: "/professionnel/profil",         label: "Mon profil" },
  ],
  COORDINATRICE: [
    { section: "Pilotage" },
    { to: "/coordinatrice",                     label: "Tableau de bord",    end: true },
    { to: "/coordinatrice/cohortes",            label: "Cohortes & groupes" },
    { to: "/coordinatrice/ateliers",            label: "Ateliers" },
    { to: "/coordinatrice/utilisateurs",        label: "Utilisateurs" },
    { section: "Suivi clinique" },
    { to: "/coordinatrice/alertes",             label: "Alertes EPDS",       notif: "alerteProm" },
    { to: "/coordinatrice/prom-prem",           label: "PROM / PREM" },
    { to: "/coordinatrice/comptes-rendus",      label: "Comptes-rendus" },
    { to: "/coordinatrice/evaluations",         label: "Évaluations" },
    { section: "Administration" },
    { to: "/coordinatrice/conventions",         label: "Conventions" },
    { to: "/coordinatrice/dossiers",            label: "Dossiers archivés" },
    { to: "/coordinatrice/ressources",          label: "Bibliothèque" },
    { to: "/coordinatrice/messagerie",          label: "Messagerie partenaires" },
    { to: "/coordinatrice/reporting",           label: "Reporting" },
    { to: "/coordinatrice/profil",              label: "Mon profil" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { groupeNonLu, priveNonLu, alertePromNonLu } = useNotificationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const links = NAV_BY_ROLE[user.role] || [];

  const [menuOuvert, setMenuOuvert] = useState(false);

  // Ferme le menu sur changement de route
  useEffect(() => { setMenuOuvert(false); }, [location.pathname]);

  // Empêche le scroll body quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOuvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOuvert]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initiales = (user.prenom?.[0] || "") + (user.nom?.[0] || "");

  return (
    <div className="app-shell">
      {/* Overlay mobile — clic ferme le menu */}
      {menuOuvert && (
        <div className="sidebar-overlay" onClick={() => setMenuOuvert(false)} />
      )}

      <aside className={`sidebar${menuOuvert ? " sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            Maisons <span>MINO</span>
          </div>
          <div className="sidebar-tagline">Plateforme périnatalité</div>
          {/* Bouton de fermeture visible sur mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initiales || "?"}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.prenom} {user.nom}</div>
            <div className="sidebar-user-role">{ROLE_LABEL[user.role]}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link, i) =>
            link.section ? (
              <div key={`sec-${i}`} className="sidebar-section-label">{link.section}</div>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
              >
                {link.label}
                {link.notif === "groupe"     && groupeNonLu     && <span className="notification-dot" />}
                {link.notif === "prive"      && priveNonLu      && <span className="notification-dot" />}
                {link.notif === "alerteProm" && alertePromNonLu && <span className="notification-dot" />}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          {/* Burger button — visible uniquement sur mobile */}
          <button
            className="burger-btn"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
          >
            <span />
            <span />
            <span />
          </button>

          {/* Titre de marque sur mobile */}
          <div className="topbar-brand">Maisons <strong>MINO</strong></div>

          <NotificationBell />
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
