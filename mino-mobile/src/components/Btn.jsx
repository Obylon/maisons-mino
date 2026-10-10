import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, radii } from "../theme";

const VARIANTS = {
  primary: { gradient: [colors.primary, colors.primaryLight], text: "#fff" },
  secondary: { gradient: [colors.textSecondary, "#64748B"], text: "#fff" },
  danger: { gradient: [colors.danger, "#EF4444"], text: "#fff" },
  ghost: { gradient: null, bg: "transparent", text: colors.primary, border: null },
  outline: { gradient: null, bg: "transparent", text: colors.primary, border: colors.primary },
  success: { gradient: [colors.success, "#10B981"], text: "#fff" },
};

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
  md: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 16 },
};

export default function Btn({ label, onPress, loading, disabled, style, variant = "primary", size = "md", secondary, danger }) {
  const resolvedVariant = danger ? "danger" : secondary ? "secondary" : variant;
  const v = VARIANTS[resolvedVariant] || VARIANTS.primary;
  const sz = SIZES[size] || SIZES.md;

  const handlePress = async () => {
    if (disabled || loading) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onPress?.();
  };

  if (v.gradient) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[{ opacity: disabled || loading ? 0.55 : 1 }, style]}
      >
        <LinearGradient
          colors={v.gradient}
          style={[s.base, { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[s.label, { fontSize: sz.fontSize }]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        s.base,
        { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal, backgroundColor: v.bg },
        v.border && { borderWidth: 1.5, borderColor: v.border },
        (disabled || loading) && s.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={v.text} size="small" />
        : <Text style={[s.label, { fontSize: sz.fontSize, color: v.text }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: { borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "700", letterSpacing: 0.2 },
  disabled: { opacity: 0.5 },
});
