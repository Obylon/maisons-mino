import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

export default function Badge({ count, dot = false, color = colors.danger, style }) {
  if (!dot && (!count || count <= 0)) return null;
  return (
    <View style={[s.badge, dot ? s.dot : s.count, { backgroundColor: color }, style]}>
      {!dot && <Text style={s.text}>{count > 99 ? "99+" : count}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  badge: { position: "absolute", top: -4, right: -4, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  count: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
