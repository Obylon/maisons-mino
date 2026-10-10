import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

export default function SectionTitle({ title, subtitle, color, style }) {
  const accent = color || colors.primary;
  return (
    <View style={[s.wrap, style]}>
      <View style={[s.bar, { backgroundColor: accent }]} />
      <View style={s.texts}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: 4 },
  bar: { width: 4, height: 22, borderRadius: 2, marginRight: 10 },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
