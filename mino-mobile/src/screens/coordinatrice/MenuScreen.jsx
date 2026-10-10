import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "../../theme";

const ITEMS = [
  { screen: "Cohortes", label: "Cohortes & groupes", icon: "home", color: "#1D4ED8", bg: "#EFF6FF", desc: "Gérer les cohortes" },
  { screen: "AteliersAdmin", label: "Ateliers", icon: "calendar", color: "#0D9488", bg: "#F0FDF4", desc: "CRUD ateliers" },
  { screen: "MessageriePartenaire", label: "Messagerie", icon: "mail", color: "#7C3AED", bg: "#F5F3FF", desc: "Partenaires" },
  { screen: "ComptesRendusAdmin", label: "Comptes rendus", icon: "document-text", color: "#D97706", bg: "#FFFBEB", desc: "Professionnels" },
  { screen: "ConventionsAdmin", label: "Conventions", icon: "document", color: "#065F46", bg: "#ECFDF5", desc: "Tarifs & statuts" },
  { screen: "EvaluationsAdmin", label: "Évaluations", icon: "star", color: "#92400E", bg: "#FEF3C7", desc: "Avis des mamans" },
  { screen: "PromPremAdmin", label: "PROM/PREM", icon: "clipboard", color: "#1B4F8A", bg: "#EFF6FF", desc: "Questionnaires" },
  { screen: "QuestionnaireModeles", label: "Modèles", icon: "list", color: "#6B21A8", bg: "#F5F3FF", desc: "Templates" },
  { screen: "Reporting", label: "Reporting", icon: "bar-chart", color: "#0F766E", bg: "#F0FDFA", desc: "Vue d'ensemble" },
  { screen: "Dossiers", label: "Dossiers", icon: "archive", color: "#475569", bg: "#F1F5F9", desc: "Historique archivé" },
];

export default function MenuScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Menu coordinatrice</Text>
      <View style={s.grid}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[s.card, { backgroundColor: item.bg }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.8}
          >
            <View style={[s.iconCircle, { backgroundColor: item.color + "22" }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={[s.cardLabel, { color: item.color }]}>{item.label}</Text>
            <Text style={s.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    ...shadows.sm,
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardLabel: { fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  cardDesc: { fontSize: 11, color: colors.textMuted, textAlign: "center" },
});
