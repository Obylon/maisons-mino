import { useEffect, useState, useRef } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { atelierApi, groupeApi, mamanApi, messageApi } from "../../services/api";
import { colors, shadows } from "../../theme";

const LIENS = [
  { screen: "MonGroupe", label: "Mon groupe", icon: "people", color: "#1D4ED8", bg: "#EFF6FF" },
  { screen: "Parcours", label: "Mon parcours", icon: "calendar", color: "#0D9488", bg: "#F0FDF4" },
  { screen: "EvaluerAteliers", label: "Évaluer", icon: "star", color: "#D97706", bg: "#FFFBEB" },
  { screen: "PromPrem", label: "PROM/PREM", icon: "clipboard", color: "#7C3AED", bg: "#F5F3FF" },
];

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function formatHour(dateStr) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function AccueilScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [parcours, setParcours] = useState(null);
  const [prochainAtelier, setProchainAtelier] = useState(null);
  const [nonLus, setNonLus] = useState(0);
  const [loading, setLoading] = useState(true);
  const cardAnims = useRef(LIENS.map(() => new Animated.Value(0))).current;

  const charger = () => {
    setLoading(true);
    Promise.all([
      mamanApi.monParcours().catch(() => null),
      atelierApi.monCalendrier().catch(() => ({ data: [] })),
      groupeApi.monGroupe().catch(() => null),
    ]).then(async ([resParcours, resAteliers, resGroupe]) => {
      setParcours(resParcours?.data ?? null);
      const maintenant = new Date();
      const prochains = (resAteliers.data || [])
        .filter((a) => a.dateHeure && new Date(a.dateHeure) >= maintenant)
        .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
      setProchainAtelier(prochains[0] ?? null);
      if (resGroupe?.data?.id) {
        const resN = await messageApi.nonLusGroupe(resGroupe.data.id).catch(() => ({ data: 0 }));
        setNonLus(resN.data || 0);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    Animated.stagger(80, cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 })
    )).start();
  }, []);

  const labelParcours = () => {
    if (!parcours) return null;
    if (parcours.ageBebeJours !== null) return { label: `${parcours.ageBebeJours} jours`, sub: "Âge de bébé" };
    if (parcours.semaineGrossesse !== null) return { label: `${parcours.semaineGrossesse} SA`, sub: "Grossesse en cours" };
    return null;
  };

  const parcoursInfo = labelParcours();
  const jours = prochainAtelier?.dateHeure ? daysUntil(prochainAtelier.dateHeure) : null;

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {/* Header gradient card */}
      <LinearGradient colors={colors.MAMAN.gradient} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.heroContent}>
          <View>
            <Text style={s.heroGreeting}>Bonjour,</Text>
            <Text style={s.heroName}>{user.prenom} {user.nom || ""}</Text>
          </View>
          <Avatar prenom={user.prenom || ""} nom={user.nom || ""} size="lg" />
        </View>
        {parcoursInfo && (
          <View style={s.progressPill}>
            <Text style={s.progressLabel}>{parcoursInfo.sub}</Text>
            <Text style={s.progressValue}>{parcoursInfo.label}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Prochain atelier */}
      {prochainAtelier ? (
        <View style={s.atelierCard}>
          <View style={s.atelierLeft}>
            <Text style={s.atelierTopLabel}>Prochain atelier</Text>
            <Text style={s.atelierTitle} numberOfLines={1}>
              {prochainAtelier.titre || prochainAtelier.type}
            </Text>
            <Text style={s.atelierDate}>
              {formatDate(prochainAtelier.dateHeure)} à {formatHour(prochainAtelier.dateHeure)}
            </Text>
          </View>
          {jours !== null && (
            <View style={[s.countdownBadge, jours === 0 && { backgroundColor: "#FEF2F2" }]}>
              <Text style={[s.countdownNum, jours === 0 && { color: colors.danger }]}>
                {jours === 0 ? "Auj." : jours}
              </Text>
              {jours > 0 && <Text style={s.countdownUnit}>jours</Text>}
            </View>
          )}
        </View>
      ) : !loading ? (
        <View style={s.atelierCard}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
          <Text style={s.atelierTitle}>Aucun atelier à venir</Text>
        </View>
      ) : null}

      {/* Messages non lus */}
      {nonLus > 0 && (
        <TouchableOpacity style={s.alertBanner} onPress={() => navigation.navigate("Msg groupe")}>
          <Ionicons name="chatbubbles" size={18} color={colors.MAMAN.primary} />
          <Text style={s.alertText}>{nonLus} message{nonLus > 1 ? "s" : ""} non lu{nonLus > 1 ? "s" : ""} dans votre groupe</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.MAMAN.primary} />
        </TouchableOpacity>
      )}

      {/* Accès rapide */}
      <Text style={s.sectionTitle}>Accès rapide</Text>
      <View style={s.grid}>
        {LIENS.map((l, i) => (
          <Animated.View
            key={l.screen}
            style={{ transform: [{ scale: cardAnims[i] }], opacity: cardAnims[i], flex: 1, minWidth: "45%" }}
          >
            <TouchableOpacity style={[s.quickCard, { backgroundColor: l.bg }]} onPress={() => navigation.navigate(l.screen)} activeOpacity={0.8}>
              <View style={[s.quickIconWrap, { backgroundColor: l.color + "22" }]}>
                <Ionicons name={l.icon} size={24} color={l.color} />
              </View>
              <Text style={[s.quickLabel, { color: l.color }]}>{l.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, marginBottom: 14, ...shadows.lg },
  heroContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroGreeting: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 2 },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  progressPill: { marginTop: 16, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10 },
  progressLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  progressValue: { fontSize: 16, fontWeight: "700", color: "#fff" },
  atelierCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 12, ...shadows.md,
  },
  atelierLeft: { flex: 1 },
  atelierTopLabel: { fontSize: 11, fontWeight: "700", color: colors.MAMAN.primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  atelierTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  atelierDate: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  countdownBadge: { alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 12, padding: 10, minWidth: 52 },
  countdownNum: { fontSize: 22, fontWeight: "800", color: colors.MAMAN.primary },
  countdownUnit: { fontSize: 10, color: colors.MAMAN.primary, fontWeight: "600" },
  alertBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF",
    borderRadius: 12, padding: 12, marginBottom: 14, gap: 8,
  },
  alertText: { flex: 1, fontSize: 13, color: colors.MAMAN.primary, fontWeight: "600" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: { borderRadius: 16, padding: 16, alignItems: "center", ...shadows.sm },
  quickIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  quickLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});
