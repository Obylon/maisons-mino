import { View, Text, StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "../theme";

export function Card({ children, style, variant = "default" }) {
  return (
    <View style={[s.card, variant === "elevated" && s.elevated, variant === "flat" && s.flat, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ children, color }) {
  return <Text style={[s.title, color && { color }]}>{children}</Text>;
}

export function StatCard({ label, value, danger, icon, color, subtitle }) {
  const valueColor = danger ? colors.danger : color || colors.primaryDeep;
  return (
    <View style={[s.card, s.elevated]}>
      <View style={s.statRow}>
        <View style={s.statLeft}>
          <Text style={[s.label]}>{label}</Text>
          <Text style={[s.statValue, { color: valueColor }]}>{value ?? "…"}</Text>
          {subtitle ? <Text style={s.statSubtitle}>{subtitle}</Text> : null}
        </View>
        {icon ? (
          <View style={[s.iconCircle, { backgroundColor: (color || colors.primary) + "18" }]}>
            <Text style={s.iconText}>{icon}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  elevated: { ...shadows.lg },
  flat: { ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLeft: { flex: 1 },
  statValue: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  statSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 24 },
});
