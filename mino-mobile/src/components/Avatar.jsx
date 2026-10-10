import { View, Text, StyleSheet } from "react-native";

const SIZES = { sm: 32, md: 40, lg: 52, xl: 72 };
const FONT_SIZES = { sm: 12, md: 15, lg: 20, xl: 28 };

function colorFromName(name = "") {
  const palette = [
    "#1D4ED8", "#0D9488", "#7C3AED", "#D97706",
    "#065F46", "#92400E", "#1B4F8A", "#C026D3",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function Avatar({ prenom = "", nom = "", size = "md", statusColor, style }) {
  const dim = SIZES[size] || SIZES.md;
  const fontSize = FONT_SIZES[size] || FONT_SIZES.md;
  const initials = `${prenom[0] || ""}${nom[0] || ""}`.toUpperCase() || "?";
  const bg = colorFromName(`${prenom}${nom}`);

  return (
    <View style={[s.wrap, style]}>
      <View style={[s.circle, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }]}>
        <Text style={[s.text, { fontSize }]}>{initials}</Text>
      </View>
      {statusColor ? (
        <View style={[s.status, { backgroundColor: statusColor, width: dim * 0.3, height: dim * 0.3, borderRadius: dim * 0.15, right: 0, bottom: 0 }]} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "relative" },
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "700" },
  status: { position: "absolute", borderWidth: 2, borderColor: "#fff" },
});
