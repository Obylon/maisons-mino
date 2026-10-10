import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows } from "../theme";

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "sentences",
  autoFocus,
  multiline,
  numberOfLines,
  error,
  leftIcon,
  style,
  inputStyle,
  editable = true,
}) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={[s.wrapper, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.row, focused && s.focused, error && s.errorBorder, !editable && s.disabled]}>
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={focused ? colors.primary : colors.textMuted} style={s.leftIcon} />
        ) : null}
        <TextInput
          style={[s.input, multiline && { height: numberOfLines ? numberOfLines * 20 + 20 : 80, textAlignVertical: "top" }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={s.eyeBtn}>
            <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    minHeight: 48,
    ...shadows.sm,
  },
  focused: { borderColor: colors.primary, ...shadows.md },
  errorBorder: { borderColor: colors.danger },
  disabled: { backgroundColor: "#F8FAFC", opacity: 0.7 },
  leftIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 12 },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
});
