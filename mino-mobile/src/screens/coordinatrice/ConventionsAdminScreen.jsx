import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { conventionApi, adminApi } from "../../services/api";

const STATUTS = [
  { value: "SIGNEE", label: "Signée" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "RESILIEE", label: "Résiliée" },
];

const STATUT_COLOR = { SIGNEE: "#2d6e4e", EN_ATTENTE: "#c47a3a", RESILIEE: "#e53e3e" };

export default function ConventionsAdminScreen() {
  const [conventions, setConventions] = useState([]);
  const [professionnels, setProfessionnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [professionnelId, setProfessionnelId] = useState("");
  const [tarif, setTarif] = useState("75.00");
  const [statut, setStatut] = useState("SIGNEE");
  const [dateSignature, setDateSignature] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const charger = () => {
    setLoading(true);
    Promise.all([conventionApi.lister(), adminApi.listerProfessionnels()])
      .then(([resC, resP]) => {
        setConventions(resC.data);
        setProfessionnels(resP.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const handleCreer = async () => {
    if (!professionnelId) return;
    setEnvoi(true);
    setFormError("");
    try {
      await conventionApi.creer({
        professionnelId,
        tarif: parseFloat(tarif),
        statut,
        dateSignature: dateSignature || null,
      });
      setProfessionnelId(""); setDateSignature("");
      setModalVisible(false);
      charger();
    } catch (err) {
      setFormError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Conventions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Conventions existantes ({conventions.length})</CardTitle>
        {conventions.length === 0 ? (
          <Text style={styles.empty}>Aucune convention créée pour l'instant.</Text>
        ) : (
          <FlatList
            data={conventions}
            keyExtractor={(c) => String(c.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNom}>{item.professionnelNom}</Text>
                  <Text style={styles.itemMeta}>{item.tarif != null ? `${item.tarif} €` : "—"} · Signé le {fmt(item.dateSignature)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUT_COLOR[item.statut] || "#888") + "20" }]}>
                  <Text style={[styles.badgeText, { color: STATUT_COLOR[item.statut] || "#888" }]}>
                    {STATUTS.find((s) => s.value === item.statut)?.label ?? item.statut ?? "—"}
                  </Text>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}
      </Card>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nouvelle convention</Text>

              <Text style={styles.fieldLabel}>Professionnel *</Text>
              {professionnels.length === 0 ? (
                <Text style={styles.error}>Aucun professionnel actif — créez-en un dans Utilisateurs.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 120, marginBottom: 14 }}>
                  {professionnels.map((p) => (
                    <TouchableOpacity key={p.professionnelId} style={[styles.proItem, professionnelId === p.professionnelId && styles.proItemActive]} onPress={() => setProfessionnelId(p.professionnelId)}>
                      <Text style={[styles.proItemText, professionnelId === p.professionnelId && styles.proItemTextActive]}>
                        {p.prenom} {p.nom}{p.specialite ? ` (${p.specialite})` : ""}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.fieldLabel}>Tarif (€)</Text>
              <TextInput style={styles.input} value={tarif} onChangeText={setTarif} keyboardType="decimal-pad" placeholderTextColor="#bbb" />

              <Text style={styles.fieldLabel}>Statut</Text>
              <View style={styles.statutRow}>
                {STATUTS.map((s) => (
                  <TouchableOpacity key={s.value} style={[styles.statutBtn, statut === s.value && styles.statutBtnActive]} onPress={() => setStatut(s.value)}>
                    <Text style={[styles.statutBtnText, statut === s.value && styles.statutBtnTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Date de signature (AAAA-MM-JJ)</Text>
              <TextInput style={styles.input} value={dateSignature} onChangeText={setDateSignature} placeholder="2026-01-15" placeholderTextColor="#bbb" />

              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <Btn label={envoi ? "Création..." : "Créer la convention"} onPress={handleCreer} loading={envoi} />
              <Btn label="Annuler" onPress={() => setModalVisible(false)} secondary style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  addBtn: { backgroundColor: "#7c3aed", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  itemNom: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#1a1a1a", marginBottom: 14 },
  proItem: { padding: 10, borderRadius: 8, marginBottom: 4 },
  proItemActive: { backgroundColor: "#e8e0fb" },
  proItemText: { fontSize: 14, color: "#555" },
  proItemTextActive: { color: "#7c3aed", fontWeight: "600" },
  statutRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statutBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  statutBtnActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  statutBtnText: { fontSize: 13, color: "#555" },
  statutBtnTextActive: { color: "#fff", fontWeight: "600" },
});
