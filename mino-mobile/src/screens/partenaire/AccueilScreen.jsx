import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/Avatar";
import { atelierApi } from "../../services/api";
import { colors, shadows } from "../../theme";

const TYPE_LABELS = {
  P1_GROSSESSE_PARTENAIRE: "Atelier P1 — Grossesse",
  P2_POSTPARTUM_PARTENAIRE: "Atelier P2 — Post-partum",
};

function fmt(d) {
  return d ? new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "—";
}
function fmtHeure(d) {
  return d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
}

export default function AccueilPartenaireScreen() {
  const { user } = useAuth();
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    atelierApi.ateliersP1P2()
      .then((res) => setAteliers(res.data || []))
      .catch(() => setError("Impossible de charger les ateliers."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const maintenant = new Date();
  const prochains = ateliers.filter((a) => a.dateHeure && new Date(a.dateHeure) >= maintenant)
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
  const passes = ateliers.filter((a) => !a.dateHeure || new Date(a.dateHeure) < maintenant)
    .sort((a, b) => new Date(b.dateHeure || 0) - new Date(a.dateHeure || 0));

  const prochain = prochains[0];

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {/* Header */}
      <LinearGradient colors={colors.PARTENAIRE.gradient} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroRow}>
          <View>
            <Text style={s.greeting}>Bonjour,</Text>
            <Text style={s.name}>{user.prenom} {user.nom || ""}</Text>
            <Text style={s.roleText}>Partenaire</Text>
          </View>
          <Avatar prenom={user.prenom || ""} nom={user.nom || ""} size="lg" />
        </View>
      </LinearGradient>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {/* Prochain atelier - Hero card */}
      <Text style={s.sectionLabel}>Prochain atelier</Text>
      {!prochain ? (
        <EmptyState icon="📅" title="Aucun atelier à venir" subtitle="Les prochains ateliers partenaire apparaîtront ici." />
      ) : (
        <LinearGradient colors={["#78350F", "#D97706"]} style={s.prochainCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.prochainBadge}>
            <Text style={s.prochainBadgeText}>{TYPE_LABELS[prochain.type] || prochain.type}</Text>
          </View>
          {prochain.titre && <Text style={s.prochainTitre}>{prochain.titre}</Text>}
          <View style={s.prochainDateRow}>
            <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={s.prochainDate}>{fmt(prochain.dateHeure)}</Text>
          </View>
          <View style={s.prochainDateRow}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={s.prochainDate}>{fmtHeure(prochain.dateHeure)}</Text>
          </View>
          {prochain.professionnelNom && (
            <View style={s.prochainDateRow}>
              <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={s.prochainDate}>{prochain.professionnelNom}</Text>
            </View>
          )}
        </LinearGradient>
      )}

      {/* Upcoming list */}
      {prochains.length > 1 && (
        <>
          <Text style={s.sectionLabel}>À venir</Text>
          {prochains.slice(1).map((a) => <AtelierItem key={a.id} atelier={a} />)}
        </>
      )}

      {/* Past */}
      {passes.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Passés</Text>
          {passes.map((a) => <AtelierItem key={a.id} atelier={a} passe />)}
        </>
      )}
    </Screen>
  );
}

function AtelierItem({ atelier: a, passe }) {
  return (
    <View style={[s.item, passe && s.itemPasse]}>
      <View style={[s.dot, passe && s.dotPasse]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.itemTitle, passe && s.textPasse]}>{a.titre || TYPE_LABELS[a.type] || a.type}</Text>
        <Text style={s.itemMeta}>{fmt(a.dateHeure)} · {fmtHeure(a.dateHeure)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, marginBottom: 16, ...shadows.lg },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  roleText: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  prochainCard: { borderRadius: 20, padding: 20, marginBottom: 16, ...shadows.lg },
  prochainBadge: { backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  prochainBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  prochainTitre: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 10 },
  prochainDateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  prochainDate: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  item: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 8, ...shadows.sm,
  },
  itemPasse: { opacity: 0.6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.PARTENAIRE.primary, marginTop: 6, marginRight: 12 },
  dotPasse: { backgroundColor: colors.textMuted },
  itemTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  textPasse: { color: colors.textMuted },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
});
