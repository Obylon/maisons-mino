import { SafeAreaView, ScrollView, View, Text, StyleSheet, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadows, typography } from "../theme";

export default function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  style,
  headerGradient,
  headerColor,
  title,
  subtitle,
  headerContent,
}) {
  const hasHeader = headerGradient || headerColor || title;

  const header = hasHeader ? (
    headerGradient ? (
      <LinearGradient colors={headerGradient} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {title ? <Text style={s.headerTitle}>{title}</Text> : null}
        {subtitle ? <Text style={s.headerSubtitle}>{subtitle}</Text> : null}
        {headerContent || null}
      </LinearGradient>
    ) : (
      <View style={[s.header, { backgroundColor: headerColor }]}>
        {title ? <Text style={s.headerTitle}>{title}</Text> : null}
        {subtitle ? <Text style={s.headerSubtitle}>{subtitle}</Text> : null}
        {headerContent || null}
      </View>
    )
  ) : null;

  if (!scroll) {
    return (
      <SafeAreaView style={[s.safe, style]}>
        {header}
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {header}
      <ScrollView
        contentContainerStyle={[s.content, style]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { ...typography.h2, color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
});
