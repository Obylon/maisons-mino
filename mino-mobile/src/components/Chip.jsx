import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, radii } from "../theme";

export default function Chip({ label, selected, onPress, color, style }) {
  const activeColor = color || colors.primary;
  return (
    <TouchableOpacity
      style={[s.chip, selected ? { backgroundColor: activeColor, borderColor: activeColor } : s.outlined, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[s.text, selected ? s.textActive : s.textInactive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.full, borderWidth: 1.5, marginRight: 8 },
  outlined: { backgroundColor: "transparent", borderColor: colors.border },
  text: { fontSize: 13, fontWeight: "600" },
  textActive: { color: "#fff" },
  textInactive: { color: colors.textSecondary },
});
