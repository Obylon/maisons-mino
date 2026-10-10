import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "../theme";
import Btn from "./Btn";

export default function EmptyState({ icon = "📭", title = "Rien ici", subtitle, actionLabel, onAction }) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Btn label={actionLabel} onPress={onAction} style={s.btn} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { ...typography.h3, textAlign: "center", marginBottom: 8 },
  subtitle: { ...typography.body, textAlign: "center", color: colors.textMuted, lineHeight: 20 },
  btn: { marginTop: 20, paddingHorizontal: 32 },
});
