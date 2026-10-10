import { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import EmptyState from "../../components/EmptyState";
import Btn from "../../components/Btn";
import { atelierApi } from "../../services/api";
import { colors, shadows } from "../../theme";

const TYPE_LABELS = {
  MENSUEL_STANDARD: "Mensuel",
  SEANCE_INDIVIDUELLE_S0: "Séance individuelle",
  P1_GROSSESSE_PARTENAIRE: "Atelier P1",
  P2_POSTPARTUM_PARTENAIRE: "Atelier P2",
};

const TYPE_COLORS = {
  MENSUEL_STANDARD: "#1D4ED8",
  SEANCE_INDIVIDUELLE_S0: "#0D9488",
  P1_GROSSESSE_PARTENAIRE: "#7C3AED",
  P2_POSTPARTUM_PARTENAIRE: "#D97706",
};

function groupByMonth(ateliers) {
  const map = {};
  for (const a of ateliers) {
    const key = a.dateHeure
      ? new Date(a.dateHeure).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : "Date non fixée";
    if (!map[key]) map[key] = [];
    map[key].push(a);
  }
  return Object.entries(map);
}

export default function CalendrierScreen() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enCours, setEnCours] = useState(null);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    atelierApi.monCalendrier()
      .then((res) => setAteliers(res.data || []))
      .catch(() => setError("Impossible de charger le calendrier."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const toggleInscription = async (atelier) => {
    setEnCours(atelier.id);
    setError("");
    try {
      atelier.inscrite ? await atelierApi.seDesinscrire(atelier.id) : await atelierApi.sInscrire(atelier.id);
      charger();
    } catch (e) {
      setError(e.response?.data?.message || "L'opération a échoué.");
    } finally {
      setEnCours(null);
    }
  };

  const grouped = groupByMonth(ateliers);

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!loading && ateliers.length === 0 && (
        <EmptyState icon="📅" title="Aucun atelier" subtitle="Aucun atelier programmé pour l'instant." />
      )}
      {grouped.map(([month, list]) => (
        <View key={month}>
          <Text style={s.monthLabel}>{month.charAt(0).toUpperCase() + month.slice(1)}</Text>
          {list.map((a) => {
            const date = a.dateHeure ? new Date(a.dateHeure) : null;
            const typeColor = TYPE_COLORS[a.type] || colors.primary;
            const typeLabel = TYPE_LABELS[a.type] || a.type;
            return (
              <View key={a.id} style={s.card}>
                <View style={[s.typeBar, { backgroundColor: typeColor }]} />
                <View style={s.cardContent}>
                  <View style={s.topRow}>
                    <View style={[s.typeBadge, { backgroundColor: typeColor + "18" }]}>
                      <Text style={[s.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                    </View>
                    {a.inscrite && (
                      <View style={s.inscritBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={s.inscritText}>Inscrite</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.titre}>{a.titre || typeLabel}</Text>
                  {date && (
                    <View style={s.dateRow}>
                      <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                      <Text style={s.meta}>
                        {date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} à {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  )}
                  {a.professionnelNom && (
                    <View style={s.dateRow}>
                      <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                      <Text style={s.meta}>{a.professionnelNom}</Text>
                    </View>
                  )}
                  <View style={s.btnRow}>
                    <Btn
                      label={a.inscrite ? "Se désinscrire" : "S'inscrire"}
                      onPress={() => toggleInscription(a)}
                      loading={enCours === a.id}
                      variant={a.inscrite ? "outline" : "primary"}
                      size="sm"
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  monthLabel: { fontSize: 14, fontWeight: "800", color: colors.textPrimary, textTransform: "capitalize", marginBottom: 10, marginTop: 8 },
  card: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, marginBottom: 10,
    overflow: "hidden", ...shadows.md,
  },
  typeBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  inscritBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  inscritText: { fontSize: 12, color: colors.success, fontWeight: "600" },
  titre: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  meta: { fontSize: 12, color: colors.textMuted },
  btnRow: { marginTop: 10 },
});
