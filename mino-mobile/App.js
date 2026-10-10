import { useState, useRef, useEffect } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Animated, Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { BadgeProvider } from "./src/context/BadgeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Input from "./src/components/Input";

const { height } = Dimensions.get("window");

function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !motDePasse) { Alert.alert("Erreur", "Email et mot de passe requis."); return; }
    setLoading(true);
    try {
      await login(email.trim(), motDePasse);
    } catch (e) {
      const msg = e.response?.status === 401
        ? "Email ou mot de passe incorrect."
        : `Impossible de joindre le serveur.\n\n${e.message}`;
      Alert.alert("Échec de connexion", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0A2342", "#1B4F8A"]}
        style={s.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[s.logoWrap, { opacity: fadeAnim }]}>
          <View style={s.logoCircle}>
            <Text style={s.logoLetter}>M</Text>
          </View>
          <Text style={s.appName}>Maisons MINO</Text>
          <Text style={s.appSub}>Plateforme périnatalité</Text>
        </Animated.View>
        <View style={s.heroCurve} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={s.formSection}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[s.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={s.formTitle}>Connexion</Text>
          <Text style={s.formSub}>Accédez à votre espace personnel</Text>

          <Input
            label="Adresse e-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.fr"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            style={s.inputSpacing}
          />

          <Input
            label="Mot de passe"
            value={motDePasse}
            onChangeText={setMotDePasse}
            placeholder="••••••••"
            secureTextEntry
            leftIcon="lock-closed-outline"
            style={s.inputSpacing}
          />

          <TouchableOpacity
            style={[s.connectBtn, loading && s.connectBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#1B4F8A", "#3B82F6"]}
              style={s.connectGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.connectText}>Se connecter</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <Text style={s.footerText}>Maisons MINO · v2.0</Text>
      </View>
    </SafeAreaView>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <LinearGradient colors={["#0A2342", "#1B4F8A"]} style={s.splash}>
        <View style={s.logoCircle}>
          <Text style={s.logoLetter}>M</Text>
        </View>
        <Text style={[s.appName, { marginTop: 16 }]}>Maisons MINO</Text>
        <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 32 }} />
      </LinearGradient>
    );
  }
  return isAuthenticated ? <AppNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BadgeProvider>
          <AppContent />
        </BadgeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4F8" },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroSection: {
    height: height * 0.38,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 32,
  },
  heroCurve: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#F0F4F8",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  logoWrap: { alignItems: "center" },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  logoLetter: { fontSize: 36, fontWeight: "800", color: "#1B4F8A" },
  appName: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  appSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  formSection: { flex: 1, paddingHorizontal: 20, paddingTop: 32 },
  formCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, shadowColor: "#0A2342", shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  formTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  formSub: { fontSize: 14, color: "#94A3B8", marginBottom: 24 },
  inputSpacing: { marginBottom: 0 },
  connectBtn: { marginTop: 8, borderRadius: 12, overflow: "hidden" },
  connectBtnDisabled: { opacity: 0.7 },
  connectGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  connectText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },
  footer: { alignItems: "center", paddingBottom: 16 },
  footerText: { fontSize: 12, color: "#94A3B8" },
});
