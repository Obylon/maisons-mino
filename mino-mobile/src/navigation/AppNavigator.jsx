import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useBadges } from "../context/BadgeContext";
import Badge from "../components/Badge";
import { colors } from "../theme";

// Maman
import AccueilMamanScreen from "../screens/maman/AccueilScreen";
import CalendrierScreen from "../screens/maman/CalendrierScreen";
import MessagerieGroupeScreen from "../screens/maman/MessagerieGroupeScreen";
import MessageriePriveeScreen from "../screens/maman/MessageriePriveeScreen";
import MonGroupeScreen from "../screens/maman/MonGroupeScreen";
import ParcoursScreen from "../screens/maman/ParcoursScreen";
import EvaluerAteliersScreen from "../screens/maman/EvaluerAteliersScreen";
import PromPremScreen from "../screens/maman/PromPremScreen";

// Partenaire
import AccueilPartenaireScreen from "../screens/partenaire/AccueilScreen";
import AteliersPartenaireScreen from "../screens/partenaire/AteliersScreen";
import MessageriePartenaireUserScreen from "../screens/partenaire/MessagerieScreen";

// Professionnel
import PlanningScreen from "../screens/professionnel/PlanningScreen";
import ComptesRendusScreen from "../screens/professionnel/ComptesRendusScreen";
import ConventionScreen from "../screens/professionnel/ConventionScreen";
import MesEvaluationsScreen from "../screens/professionnel/MesEvaluationsScreen";

// Coordinatrice
import DashboardScreen from "../screens/coordinatrice/DashboardScreen";
import UtilisateursScreen from "../screens/coordinatrice/UtilisateursScreen";
import MenuScreen from "../screens/coordinatrice/MenuScreen";
import AteliersAdminScreen from "../screens/coordinatrice/AteliersAdminScreen";
import CohortesScreen from "../screens/coordinatrice/CohortesScreen";
import DetailCohorteScreen from "../screens/coordinatrice/DetailCohorteScreen";
import MessageriePartenaireScreen from "../screens/coordinatrice/MessageriePartenaireScreen";
import ComptesRendusAdminScreen from "../screens/coordinatrice/ComptesRendusAdminScreen";
import ConventionsAdminScreen from "../screens/coordinatrice/ConventionsAdminScreen";
import EvaluationsAdminScreen from "../screens/coordinatrice/EvaluationsAdminScreen";
import PromPremAdminScreen from "../screens/coordinatrice/PromPremAdminScreen";
import QuestionnaireModelesScreen from "../screens/coordinatrice/QuestionnaireModelesScreen";
import ReportingScreen from "../screens/coordinatrice/ReportingScreen";
import DossiersScreen from "../screens/coordinatrice/DossiersScreen";

// Shared
import ProfilScreen from "../screens/ProfilScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── CUSTOM TAB BAR ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation, roleColor, tabDefs }) {
  const insets = useSafeAreaInsets();
  const { groupeBadge, priveBadge } = useBadges();

  return (
    <View style={[tabStyles.container, { paddingBottom: insets.bottom + 4 }]}>
      {state.routes.map((route, index) => {
        const def = tabDefs[index] || {};
        const focused = state.index === index;
        const iconName = focused ? def.icon : def.iconOutline || def.icon;

        let badgeCount = 0;
        if (def.badge === "groupe") badgeCount = groupeBadge;
        if (def.badge === "prive") badgeCount = priveBadge;

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <View style={tabStyles.iconWrap}>
              {focused && <View style={[tabStyles.pill, { backgroundColor: roleColor + "22" }]} />}
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={focused ? roleColor : "#94A3B8"}
                />
                {badgeCount > 0 && (
                  <Badge count={badgeCount} color={colors.danger} />
                )}
              </View>
            </View>
            <Text style={[tabStyles.label, focused && { color: roleColor, fontWeight: "700" }]}>
              {def.label || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#0A2342",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center" },
  iconWrap: { alignItems: "center", justifyContent: "center", width: 44, height: 34 },
  pill: { position: "absolute", width: 44, height: 34, borderRadius: 17 },
  label: { fontSize: 10, color: "#94A3B8", marginTop: 2, fontWeight: "500" },
});

// ─── MAMAN ────────────────────────────────────────────────────────────────────

const MAMAN_TABS = [
  { label: "Accueil", icon: "home", iconOutline: "home-outline" },
  { label: "Calendrier", icon: "calendar", iconOutline: "calendar-outline" },
  { label: "Groupe", icon: "chatbubbles", iconOutline: "chatbubbles-outline", badge: "groupe" },
  { label: "Messages", icon: "mail", iconOutline: "mail-outline", badge: "prive" },
  { label: "Profil", icon: "person", iconOutline: "person-outline" },
];

function MamanTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} roleColor={colors.MAMAN.primary} tabDefs={MAMAN_TABS} />}
      screenOptions={{ headerShown: true }}
    >
      <Tab.Screen name="Accueil" component={AccueilMamanScreen} />
      <Tab.Screen name="Calendrier" component={CalendrierScreen} />
      <Tab.Screen name="Msg groupe" component={MessagerieGroupeScreen} options={{ title: "Messagerie groupe" }} />
      <Tab.Screen name="Msg privée" component={MessageriePriveeScreen} options={{ title: "Messages privés" }} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

function MamanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MamanTabs" component={MamanTabs} />
      <Stack.Screen name="MonGroupe" component={MonGroupeScreen} options={{ headerShown: true, title: "Mon groupe" }} />
      <Stack.Screen name="Parcours" component={ParcoursScreen} options={{ headerShown: true, title: "Mon parcours" }} />
      <Stack.Screen name="EvaluerAteliers" component={EvaluerAteliersScreen} options={{ headerShown: true, title: "Évaluer mes ateliers" }} />
      <Stack.Screen name="PromPrem" component={PromPremScreen} options={{ headerShown: true, title: "PROM/PREM" }} />
    </Stack.Navigator>
  );
}

// ─── PARTENAIRE ───────────────────────────────────────────────────────────────

const PARTENAIRE_TABS = [
  { label: "Accueil", icon: "home", iconOutline: "home-outline" },
  { label: "Ateliers", icon: "grid", iconOutline: "grid-outline" },
  { label: "Messagerie", icon: "mail", iconOutline: "mail-outline" },
  { label: "Profil", icon: "person", iconOutline: "person-outline" },
];

function PartenaireTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} roleColor={colors.PARTENAIRE.primary} tabDefs={PARTENAIRE_TABS} />}
      screenOptions={{ headerShown: true }}
    >
      <Tab.Screen name="Accueil" component={AccueilPartenaireScreen} />
      <Tab.Screen name="Ateliers" component={AteliersPartenaireScreen} />
      <Tab.Screen name="Messagerie" component={MessageriePartenaireUserScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

// ─── PROFESSIONNEL ────────────────────────────────────────────────────────────

const PROFESSIONNEL_TABS = [
  { label: "Planning", icon: "calendar", iconOutline: "calendar-outline" },
  { label: "C. rendus", icon: "document-text", iconOutline: "document-text-outline" },
  { label: "Convention", icon: "document", iconOutline: "document-outline" },
  { label: "Évaluations", icon: "star", iconOutline: "star-outline" },
  { label: "Profil", icon: "person", iconOutline: "person-outline" },
];

function ProfessionnelTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} roleColor={colors.PROFESSIONNEL.primary} tabDefs={PROFESSIONNEL_TABS} />}
      screenOptions={{ headerShown: true }}
    >
      <Tab.Screen name="Planning" component={PlanningScreen} />
      <Tab.Screen name="Cptes rendus" component={ComptesRendusScreen} options={{ title: "Comptes rendus" }} />
      <Tab.Screen name="Convention" component={ConventionScreen} />
      <Tab.Screen name="Évaluations" component={MesEvaluationsScreen} options={{ title: "Mes évaluations" }} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

// ─── COORDINATRICE ────────────────────────────────────────────────────────────

const COORD_TABS = [
  { label: "Dashboard", icon: "grid", iconOutline: "grid-outline" },
  { label: "Utilisateurs", icon: "people", iconOutline: "people-outline" },
  { label: "Menu", icon: "menu", iconOutline: "menu-outline" },
  { label: "Profil", icon: "person", iconOutline: "person-outline" },
];

function CoordinatriceTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} roleColor={colors.COORDINATRICE.primary} tabDefs={COORD_TABS} />}
      screenOptions={{ headerShown: true }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Utilisateurs" component={UtilisateursScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

function CoordinatriceNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoordTabs" component={CoordinatriceTabs} />
      <Stack.Screen name="AteliersAdmin" component={AteliersAdminScreen} options={{ headerShown: true, title: "Gestion des ateliers" }} />
      <Stack.Screen name="Cohortes" component={CohortesScreen} options={{ headerShown: true, title: "Cohortes & groupes" }} />
      <Stack.Screen name="DetailCohorte" component={DetailCohorteScreen} options={{ headerShown: true, title: "Détail cohorte" }} />
      <Stack.Screen name="MessageriePartenaire" component={MessageriePartenaireScreen} options={{ headerShown: true, title: "Messagerie partenaires" }} />
      <Stack.Screen name="ComptesRendusAdmin" component={ComptesRendusAdminScreen} options={{ headerShown: true, title: "Comptes rendus" }} />
      <Stack.Screen name="ConventionsAdmin" component={ConventionsAdminScreen} options={{ headerShown: true, title: "Conventions" }} />
      <Stack.Screen name="EvaluationsAdmin" component={EvaluationsAdminScreen} options={{ headerShown: true, title: "Évaluations" }} />
      <Stack.Screen name="PromPremAdmin" component={PromPremAdminScreen} options={{ headerShown: true, title: "PROM/PREM" }} />
      <Stack.Screen name="QuestionnaireModeles" component={QuestionnaireModelesScreen} options={{ headerShown: true, title: "Questionnaires" }} />
      <Stack.Screen name="Reporting" component={ReportingScreen} options={{ headerShown: true, title: "Reporting" }} />
      <Stack.Screen name="Dossiers" component={DossiersScreen} options={{ headerShown: true, title: "Dossiers archivés" }} />
    </Stack.Navigator>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

function TabsForRole({ role }) {
  switch (role) {
    case "MAMAN": return <MamanNavigator />;
    case "PARTENAIRE": return <PartenaireTabs />;
    case "PROFESSIONNEL": return <ProfessionnelTabs />;
    case "COORDINATRICE": return <CoordinatriceNavigator />;
    default: return null;
  }
}

export default function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <TabsForRole role={user?.role} />
    </NavigationContainer>
  );
}
