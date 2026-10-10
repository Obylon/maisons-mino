export const colors = {
  // Base
  primaryDeep: "#0A2342",
  primary: "#1B4F8A",
  primaryLight: "#3B82F6",
  teal: "#0D9488",
  background: "#F0F4F8",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  // Text
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  // Feedback
  success: "#059669",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
  // Roles
  MAMAN: { primary: "#1D4ED8", light: "#EFF6FF", gradient: ["#1E3A8A", "#2563EB"] },
  PARTENAIRE: { primary: "#92400E", light: "#FFFBEB", gradient: ["#78350F", "#D97706"] },
  PROFESSIONNEL: { primary: "#065F46", light: "#ECFDF5", gradient: ["#064E3B", "#059669"] },
  COORDINATRICE: { primary: "#4C1D95", light: "#F5F3FF", gradient: ["#3B0764", "#7C3AED"] },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  h4: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 12, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
};

export const shadows = {
  sm: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowColor: "#0A2342", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  lg: { shadowColor: "#0A2342", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  xl: { shadowColor: "#0A2342", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};
