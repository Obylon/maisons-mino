import { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Btn from "../components/Btn";
import Input from "../components/Input";
import Avatar from "../components/Avatar";
import { Card, CardTitle } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { colors, shadows } from "../theme";

const ROLE_LABEL = {
  COORDINATRICE: "Coordinatrice",
  MAMAN: "Maman",
  PROFESSIONNEL: "Professionnel·le",
  PARTENAIRE: "Partenaire",
};

export default function ProfilScreen() {
  const { user, logout, updateUser } = useAuth();
  const roleColors = colors[user.role] || { primary: colors.primary, gradient: [colors.primaryDeep, colors.primary] };

  const [nom, setNom] = useState(user.nom || "");
  const [prenom, setPrenom] = useState(user.prenom || "");
  const [telephone, setTelephone] = useState(user.telephone || "");
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMdp, setLoadingMdp] = useState(false);

  const sauvegarder = async () => {
    setLoading(true);
    try {
      await authApi.mettreAJourProfil({ nom: nom.trim(), prenom: prenom.trim(), telephone: telephone.trim() || null });
      updateUser({ nom: nom.trim(), prenom: prenom.trim(), telephone: telephone.trim() || null });
      Alert.alert("Succès", "Profil mis à jour.");
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.message || "Mise à jour échouée.");
    } finally {
      setLoading(false);
    }
  };

  const changerMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert("Erreur", "Remplis les deux champs."); return; }
    setLoadingMdp(true);
    try {
      await authApi.changerMotDePasse(ancienMdp, nouveauMdp);
      setAncienMdp(""); setNouveauMdp("");
      Alert.alert("Succès", "Mot de passe changé.");
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.message || "Opération échouée.");
    } finally {
      setLoadingMdp(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <LinearGradient colors={roleColors.gradient} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Avatar prenom={user.prenom || ""} nom={user.nom || ""} size="xl" />
          <Text style={s.headerName}>{user.prenom} {user.nom}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>{ROLE_LABEL[user.role] || user.role}</Text>
          </View>
          <Text style={s.headerEmail}>{user.email}</Text>
        </LinearGradient>

        {/* Informations */}
        <Card style={s.card}>
          <CardTitle>Informations personnelles</CardTitle>
          <Input label="Prénom" value={prenom} onChangeText={setPrenom} leftIcon="person-outline" />
          <Input label="Nom" value={nom} onChangeText={setNom} leftIcon="person-outline" />
          <Input label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" leftIcon="call-outline" />
          <Btn label={loading ? "Enregistrement..." : "Enregistrer les modifications"} onPress={sauvegarder} loading={loading} />
        </Card>

        {/* Sécurité */}
        <Card style={s.card}>
          <CardTitle>Sécurité</CardTitle>
          <Input label="Mot de passe actuel" value={ancienMdp} onChangeText={setAncienMdp} secureTextEntry leftIcon="lock-closed-outline" />
          <Input label="Nouveau mot de passe" value={nouveauMdp} onChangeText={setNouveauMdp} secureTextEntry leftIcon="lock-open-outline" />
          <Btn label={loadingMdp ? "Changement..." : "Changer le mot de passe"} onPress={changerMdp} loading={loadingMdp} variant="secondary" />
        </Card>

        {/* Déconnexion */}
        <Btn label="Se déconnecter" onPress={logout} variant="danger" style={s.logoutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { paddingBottom: 40 },
  header: { alignItems: "center", paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20, marginBottom: 16 },
  headerName: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 12 },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 },
  roleBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  headerEmail: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6 },
  card: { marginHorizontal: 16, marginBottom: 12 },
  logoutBtn: { marginHorizontal: 16, marginTop: 4 },
});
