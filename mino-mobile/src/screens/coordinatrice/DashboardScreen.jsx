import { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Screen from "../../components/Screen";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cohorteApi, promPremApi, atelierApi, adminApi } from "../../services/api";
import { colors, shadows } from "../../theme";

const ACTIONS = [
  { screen: "Cohortes", label: "Cohortes", icon: "home", color: "#1D4ED8" },
  { screen: "AteliersAdmin", label: "Ateliers", icon: "calendar", color: "#0D9488" },
  { screen: "MessageriePartenaire", label: "Messagerie", icon: "mail", color: "#7C3AED" },
  { screen: "Reporting", label: "Reporting", icon: "bar-chart", color: "#D97706" },
  { screen: "PromPremAdmin", label: "PROM/PREM", icon: "clipboard", color: "#065F46" },
  { screen: "QuestionnaireModeles", label: "Questionnaires", icon: "list", color: "#92400E" },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [cohortes, setCohortes] = useState(null);
  const [questionnaires, setQuestionnaires] = useState(null);
  const [ateliersNonPourvus, setAteliersNonPourvus] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  const charger = () => {
    setLoading(true);
    Promise.all([
      cohorteApi.lister(),
      promPremApi.listerTout(0, 1000),
      atelierApi.lister(0, 1000),
      adminApi.listerUtilisateurs(0, 1).catch(() => null),
    ]).then(([resC, resQ, resA, resU]) => {
      setCohortes(resC.data.length);
      setQuestionnaires(resQ.data.totalElements);
      const maintenant = new Date();
      setAteliersNonPourvus(
        resA.data.content.filter((a) => !a.professionnelNom && a.dateHeure && new Date(a.dateHeure) >= maintenant).length
      );
      if (resU?.data?.totalElements !== undefined) setTotalUsers(resU.data.totalElements);
    }).catch(() => {
      setCohortes(0); setQuestionnaires(0); setAteliersNonPourvus(0);
    }).finally(() => setLoading(false));
  };

  useEffect(charger, []);

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {/* Hero */}
      <LinearGradient colors={colors.COORDINATRICE.gradient} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroRow}>
          <View>
            <Text style={s.greeting}>Bonjour,</Text>
            <Text style={s.name}>{user.prenom} {user.nom || ""}</Text>
            <Text style={s.role}>Coordinatrice</Text>
          </View>
          <Avatar prenom={user.prenom || ""} nom={user.nom || ""} size="lg" />
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatPill
          label="Cohortes"
          value={loading ? "…" : cohortes}
          icon="home-outline"
          color="#7C3AED"
        />
        <StatPill
          label="Questionnaires"
          value={loading ? "…" : questionnaires}
          icon="clipboard-outline"
          color="#0D9488"
        />
        <StatPill
          label="Sans pro"
          value={loading ? "…" : ateliersNonPourvus}
          icon="alert-circle-outline"
          color={ateliersNonPourvus > 0 ? colors.danger : "#475569"}
          danger={ateliersNonPourvus > 0}
        />
      </View>

      {/* Actions rapides */}
      <Text style={s.sectionLabel}>Actions rapides</Text>
      <View style={s.actionsGrid}>
        {ACTIONS.map((a) => (
          <TouchableOpacity key={a.screen} style={s.actionCard} onPress={() => navigation.navigate(a.screen)} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: a.color + "18" }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

function StatPill({ label, value, icon, color, danger }) {
  return (
    <View style={[s.statPill, danger && s.dangerPill]}>
      <Ionicons name={icon} size={18} color={color} style={{ marginBottom: 6 }} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, marginBottom: 16, ...shadows.lg },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  role: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statPill: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14,
    alignItems: "center", ...shadows.md,
  },
  dangerPill: { backgroundColor: "#FEF2F2" },
  statValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: "center", fontWeight: "600" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    width: "30%", flexGrow: 1,
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    alignItems: "center", ...shadows.sm,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: colors.textPrimary, textAlign: "center" },
});
