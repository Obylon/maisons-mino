import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";

// Maman
import MamanAccueil from "./pages/maman/Accueil";
import MonGroupe from "./pages/maman/MonGroupe";
import MessagerieGroupe from "./pages/maman/MessagerieGroupe";
import MessageriePrivee from "./pages/maman/MessageriePrivee";
import EvaluerAteliers from "./pages/maman/EvaluerAteliers";
import CalendrierMaman from "./pages/maman/Calendrier";
import PromPremMaman from "./pages/maman/PromPrem";
import Parcours from "./pages/maman/Parcours";
import RessourcesMaman from "./pages/maman/Ressources";
import ProfilMaman from "./pages/maman/Profil";

// Partenaire
import PartenaireAccueil from "./pages/partenaire/Accueil";
import AteliersP1P2 from "./pages/partenaire/AteliersP1P2";
import MessageriePartenaire from "./pages/partenaire/Messagerie";
import ProfilPartenaire from "./pages/partenaire/Profil";

// Professionnel
import PlanningProfessionnel from "./pages/professionnel/Planning";
import ComptesRendus from "./pages/professionnel/ComptesRendus";
import EvaluationsProfessionnel from "./pages/professionnel/MesEvaluations";
import ConventionPrestation from "./pages/professionnel/Convention";
import ProfilProfessionnel from "./pages/professionnel/Profil";

// Coordinatrice
import DashboardCoordinatrice from "./pages/coordinatrice/Dashboard";
import Cohortes from "./pages/coordinatrice/Cohortes";
import DetailCohorte from "./pages/coordinatrice/DetailCohorte";
import AteliersAdmin from "./pages/coordinatrice/Ateliers";
import PromPremAdmin from "./pages/coordinatrice/PromPremAdmin";
import QuestionnaireModeles from "./pages/coordinatrice/QuestionnaireModeles";
import Utilisateurs from "./pages/coordinatrice/Utilisateurs";
import Reporting from "./pages/coordinatrice/Reporting";
import ComptesRendusAdmin from "./pages/coordinatrice/ComptesRendusAdmin";
import EvaluationsCoordinatrice from "./pages/coordinatrice/EvaluationsAdmin";
import ConventionsAdmin from "./pages/coordinatrice/ConventionsAdmin";
import Dossiers from "./pages/coordinatrice/Dossiers";
import MessagerieCoordinatrice from "./pages/coordinatrice/MessagerieCoordinatrice";
import AlertesCoordinatrice from "./pages/coordinatrice/Alertes";
import RessourcesAdmin from "./pages/coordinatrice/Ressources";
import ProfilCoordinatrice from "./pages/coordinatrice/Profil";

import Demo from "./pages/Demo";
import "./styles/tokens.css";

const HOME_BY_ROLE = {
  MAMAN: "/maman",
  PARTENAIRE: "/partenaire",
  PROFESSIONNEL: "/professionnel",
  COORDINATRICE: "/coordinatrice",
};

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <NotificationProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Espace MAMAN */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["MAMAN"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/maman" element={<MamanAccueil />} />
            <Route path="/maman/groupe" element={<MonGroupe />} />
            <Route path="/maman/messagerie" element={<MessagerieGroupe />} />
            <Route path="/maman/messagerie-privee" element={<MessageriePrivee />} />
            <Route path="/maman/evaluer" element={<EvaluerAteliers />} />
            <Route path="/maman/calendrier" element={<CalendrierMaman />} />
            <Route path="/maman/prom-prem" element={<PromPremMaman />} />
            <Route path="/maman/parcours" element={<Parcours />} />
            <Route path="/maman/ressources" element={<RessourcesMaman />} />
            <Route path="/maman/profil" element={<ProfilMaman />} />
          </Route>

          {/* Espace PARTENAIRE — isolé, aucune route ne recoupe l'espace Maman */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["PARTENAIRE"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/partenaire" element={<PartenaireAccueil />} />
            <Route path="/partenaire/ateliers" element={<AteliersP1P2 />} />
            <Route path="/partenaire/messagerie" element={<MessageriePartenaire />} />
            <Route path="/partenaire/profil" element={<ProfilPartenaire />} />
          </Route>

          {/* Espace PROFESSIONNEL */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["PROFESSIONNEL"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/professionnel" element={<PlanningProfessionnel />} />
            <Route path="/professionnel/comptes-rendus" element={<ComptesRendus />} />
            <Route path="/professionnel/evaluations" element={<EvaluationsProfessionnel />} />
            <Route path="/professionnel/convention" element={<ConventionPrestation />} />
            <Route path="/professionnel/profil" element={<ProfilProfessionnel />} />
          </Route>

          {/* Espace COORDINATRICE (admin) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["COORDINATRICE"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/coordinatrice" element={<DashboardCoordinatrice />} />
            <Route path="/coordinatrice/cohortes" element={<Cohortes />} />
            <Route path="/coordinatrice/cohortes/:id" element={<DetailCohorte />} />
            <Route path="/coordinatrice/ateliers" element={<AteliersAdmin />} />
            <Route path="/coordinatrice/prom-prem" element={<PromPremAdmin />} />
            <Route path="/coordinatrice/questionnaire-modeles" element={<QuestionnaireModeles />} />
            <Route path="/coordinatrice/comptes-rendus" element={<ComptesRendusAdmin />} />
            <Route path="/coordinatrice/evaluations" element={<EvaluationsCoordinatrice />} />
            <Route path="/coordinatrice/conventions" element={<ConventionsAdmin />} />
            <Route path="/coordinatrice/dossiers" element={<Dossiers />} />
            <Route path="/coordinatrice/alertes" element={<AlertesCoordinatrice />} />
            <Route path="/coordinatrice/ressources" element={<RessourcesAdmin />} />
            <Route path="/coordinatrice/messagerie" element={<MessagerieCoordinatrice />} />
            <Route path="/coordinatrice/profil" element={<ProfilCoordinatrice />} />
            <Route path="/coordinatrice/utilisateurs" element={<Utilisateurs />} />
            <Route path="/coordinatrice/reporting" element={<Reporting />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
