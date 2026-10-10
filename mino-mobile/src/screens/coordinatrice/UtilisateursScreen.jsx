import { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Avatar from "../../components/Avatar";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import { adminApi, cohorteApi } from "../../services/api";
import { colors, shadows } from "../../theme";

const ROLE_COLOR = {
  COORDINATRICE: colors.COORDINATRICE.primary,
  MAMAN: colors.MAMAN.primary,
  PROFESSIONNEL: colors.PROFESSIONNEL.primary,
  PARTENAIRE: colors.PARTENAIRE.primary,
};

const ROLES = ["MAMAN", "PROFESSIONNEL", "PARTENAIRE", "COORDINATRICE"];
const FILTRES = ["Tous", "MAMAN", "PROFESSIONNEL", "PARTENAIRE", "COORDINATRICE"];

export default function UtilisateursScreen() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filtreRole, setFiltreRole] = useState("Tous");

  const [modalCreer, setModalCreer] = useState(false);
  const [formPrenom, setFormPrenom] = useState("");
  const [formNom, setFormNom] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("MAMAN");
  const [formSpecialite, setFormSpecialite] = useState("");
  const [formCohorteId, setFormCohorteId] = useState("");
  const [cohortes, setCohortes] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const charger = (p = 0) => {
    setLoading(true);
    adminApi.listerUtilisateurs(p)
      .then((res) => {
        setUtilisateurs(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Impossible de charger les utilisateurs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(page); }, [page]);
  useEffect(() => { cohorteApi.lister().then((res) => setCohortes(res.data)).catch(() => {}); }, []);

  const filteredUsers = utilisateurs.filter((u) => {
    const matchRole = filtreRole === "Tous" || u.role === filtreRole;
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const toggleActif = async (u) => {
    const action = u.actif ? "Désactiver" : "Réactiver";
    Alert.alert(action, `${action} le compte de ${u.prenom} ${u.nom} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: action, style: u.actif ? "destructive" : "default",
        onPress: async () => {
          try {
            u.actif ? await adminApi.desactiver(u.id) : await adminApi.activer(u.id);
            charger(page);
          } catch (e) {
            Alert.alert("Erreur", e.response?.data?.message || "Opération échouée.");
          }
        },
      },
    ]);
  };

  const reinitialiser = async (u) => {
    Alert.alert("Réinitialiser MDP", `Nouveau mot de passe pour ${u.prenom} ${u.nom} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        onPress: async () => {
          try {
            const res = await adminApi.reinitialiserMotDePasse(u.id);
            Alert.alert("Nouveau mot de passe", res.data.motDePasseTemporaire);
          } catch (e) {
            Alert.alert("Erreur", e.response?.data?.message || "Opération échouée.");
          }
        },
      },
    ]);
  };

  const handleCreer = async () => {
    if (!formPrenom.trim() || !formEmail.trim()) return;
    setEnvoi(true);
    setFormError("");
    try {
      const res = await adminApi.creerCompte({
        prenom: formPrenom.trim(),
        nom: formNom.trim() || null,
        email: formEmail.trim(),
        role: formRole,
        specialite: formRole === "PROFESSIONNEL" ? formSpecialite.trim() || null : null,
        cohorteId: formRole === "MAMAN" ? formCohorteId || null : null,
      });
      const mdp = res.data.motDePasseTemporaire;
      setModalCreer(false);
      setFormPrenom(""); setFormNom(""); setFormEmail(""); setFormSpecialite(""); setFormCohorteId("");
      charger(page);
      Alert.alert("Compte créé ✓", `Mot de passe temporaire :\n${mdp}`);
    } catch (e) {
      setFormError(e.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Screen onRefresh={() => charger(page)} refreshing={loading}>
      {/* Toolbar */}
      <View style={s.toolbar}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={s.searchIcon} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher..."
            style={s.searchInput}
            inputStyle={{ paddingVertical: 8 }}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalCreer(true)}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Role filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow} contentContainerStyle={{ paddingRight: 12 }}>
        {FILTRES.map((r) => (
          <Chip
            key={r}
            label={r === "Tous" ? `Tous (${utilisateurs.length})` : r}
            selected={filtreRole === r}
            onPress={() => setFiltreRole(r)}
            color={r === "Tous" ? colors.primary : ROLE_COLOR[r]}
          />
        ))}
      </ScrollView>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {!loading && filteredUsers.length === 0 && (
        <EmptyState icon="👥" title="Aucun utilisateur" subtitle="Aucun résultat pour cette recherche." />
      )}

      {filteredUsers.map((u) => (
        <View key={u.id} style={s.userCard}>
          <Avatar prenom={u.prenom || ""} nom={u.nom || ""} size="md" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <View style={s.nameRow}>
              <Text style={s.nom}>{u.prenom} {u.nom}</Text>
              {!u.actif && <View style={s.inactifBadge}><Text style={s.inactifText}>Inactif</Text></View>}
            </View>
            <Text style={s.email}>{u.email}</Text>
            <View style={[s.roleBadge, { backgroundColor: (ROLE_COLOR[u.role] || colors.primary) + "18" }]}>
              <Text style={[s.roleBadgeText, { color: ROLE_COLOR[u.role] || colors.primary }]}>{u.role}</Text>
            </View>
          </View>
          <View style={s.actions}>
            <TouchableOpacity style={[s.actionBtn, u.actif ? s.btnDanger : s.btnSuccess]} onPress={() => toggleActif(u)}>
              <Ionicons name={u.actif ? "close-circle-outline" : "checkmark-circle-outline"} size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => reinitialiser(u)}>
              <Ionicons name="key-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {totalPages > 1 && (
        <View style={s.pagination}>
          <TouchableOpacity disabled={page === 0} onPress={() => setPage((p) => p - 1)} style={[s.pagBtn, page === 0 && s.disabled]}>
            <Text style={s.pagTxt}>← Préc.</Text>
          </TouchableOpacity>
          <Text style={s.pagInfo}>{page + 1} / {totalPages}</Text>
          <TouchableOpacity disabled={page >= totalPages - 1} onPress={() => setPage((p) => p + 1)} style={[s.pagBtn, page >= totalPages - 1 && s.disabled]}>
            <Text style={s.pagTxt}>Suiv. →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal créer */}
      <Modal visible={modalCreer} animationType="slide" transparent onRequestClose={() => setModalCreer(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>Créer un compte</Text>
              <Input label="Prénom *" value={formPrenom} onChangeText={setFormPrenom} placeholder="Marie" autoFocus leftIcon="person-outline" />
              <Input label="Nom" value={formNom} onChangeText={setFormNom} placeholder="Dupont" leftIcon="person-outline" />
              <Input label="Email *" value={formEmail} onChangeText={setFormEmail} placeholder="marie@exemple.fr" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
              <Text style={s.fieldLabel}>Rôle</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {ROLES.map((r) => (
                  <Chip key={r} label={r} selected={formRole === r} onPress={() => setFormRole(r)} color={ROLE_COLOR[r]} />
                ))}
              </ScrollView>

              {formRole === "PROFESSIONNEL" && (
                <Input label="Spécialité *" value={formSpecialite} onChangeText={setFormSpecialite} placeholder="Ex: Kinésithérapeute" leftIcon="briefcase-outline" />
              )}

              {formRole === "MAMAN" && (
                <>
                  <Text style={s.fieldLabel}>Cohorte *</Text>
                  {cohortes.length === 0 ? (
                    <Text style={s.error}>Aucune cohorte disponible — créez-en une d'abord.</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      {cohortes.map((c) => (
                        <Chip key={c.id} label={c.nom} selected={formCohorteId === c.id} onPress={() => setFormCohorteId(c.id)} color={colors.MAMAN.primary} />
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {formError ? <Text style={s.error}>{formError}</Text> : null}
              <Btn label={envoi ? "Création..." : "Créer le compte"} onPress={handleCreer} loading={envoi} />
              <Btn label="Annuler" onPress={() => setModalCreer(false)} variant="ghost" style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  toolbar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  searchWrap: { flex: 1 },
  searchIcon: { position: "absolute", left: 12, top: 15, zIndex: 1 },
  searchInput: { marginBottom: 0 },
  addBtn: { backgroundColor: colors.COORDINATRICE.primary, width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", ...shadows.md },
  chipsRow: { marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, ...shadows.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  nom: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  email: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  inactifBadge: { backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  inactifText: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
  actions: { gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.textMuted, alignItems: "center", justifyContent: "center" },
  btnDanger: { backgroundColor: colors.danger },
  btnSuccess: { backgroundColor: colors.success },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  pagBtn: { padding: 10 },
  pagTxt: { color: colors.COORDINATRICE.primary, fontWeight: "600" },
  pagInfo: { color: colors.textMuted, fontSize: 13 },
  disabled: { opacity: 0.4 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
});
