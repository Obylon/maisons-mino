import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { atelierApi, adminApi, groupeApi } from "../../services/api";

const TYPES = [
  { value: "MENSUEL_STANDARD", label: "Atelier mensuel" },
  { value: "P1_GROSSESSE_PARTENAIRE", label: "Atelier P1 (grossesse)" },
  { value: "P2_POSTPARTUM_PARTENAIRE", label: "Atelier P2 (post-partum)" },
  { value: "SEANCE_INDIVIDUELLE_S0", label: "Séance individuelle S0" },
];

const LABEL_TYPE = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

const VIDE = { titre: "", type: "MENSUEL_STANDARD", dateHeure: "", groupeId: "", professionnelId: "" };

export default function AteliersAdminScreen() {
  const [ateliers, setAteliers] = useState([]);
  const [professionnels, setProfessionnels] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [atelierEd, setAtelierEd] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const charger = () => {
    setLoading(true);
    Promise.all([
      atelierApi.lister(page, 20),
      adminApi.listerProfessionnels(),
      groupeApi.lister(),
    ])
      .then(([resA, resP, resG]) => {
        setAteliers(resA.data.content);
        setTotalPages(resA.data.totalPages);
        setProfessionnels(resP.data);
        setGroupes(resG.data);
      })
      .catch(() => setError("Impossible de charger les données pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [page]);

  const ouvrir = (atelier = null) => {
    setAtelierEd(atelier);
    setForm(atelier ? {
      titre: atelier.titre || "",
      type: atelier.type,
      dateHeure: atelier.dateHeure?.slice(0, 16) || "",
      groupeId: atelier.groupeId || "",
      professionnelId: atelier.professionnelId || "",
    } : VIDE);
    setFormError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    setEnvoi(true);
    setFormError("");
    const payload = {
      titre: form.titre.trim() || null,
      type: form.type,
      dateHeure: form.dateHeure || null,
      groupeId: form.groupeId || null,
      professionnelId: form.professionnelId || null,
    };
    try {
      if (atelierEd) await atelierApi.modifier(atelierEd.id, payload);
      else await atelierApi.creer(payload);
      setModalVisible(false);
      charger();
    } catch (err) {
      setFormError(err.response?.data?.message || "L'enregistrement a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleDelete = async (atelier) => {
    try {
      await atelierApi.supprimer(atelier.id);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") + " " + new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Gestion des ateliers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => ouvrir()}>
          <Text style={styles.addBtnText}>+ Nouvel atelier</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Ateliers ({ateliers.length} sur cette page)</CardTitle>
        {ateliers.length === 0 ? (
          <Text style={styles.empty}>Aucun atelier pour l'instant.</Text>
        ) : (
          <FlatList
            data={ateliers}
            keyExtractor={(a) => String(a.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.titre || LABEL_TYPE[item.type] || item.type}</Text>
                  <Text style={styles.itemMeta}>{fmt(item.dateHeure)} · {item.professionnelNom ?? "Aucun pro"}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => ouvrir(item)}>
                  <Text style={styles.editBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.delBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}
        <View style={styles.pagination}>
          <TouchableOpacity disabled={page === 0} onPress={() => setPage((p) => p - 1)} style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}>
            <Text style={styles.pageBtnText}>‹ Préc.</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{page + 1} / {Math.max(1, totalPages)}</Text>
          <TouchableOpacity disabled={page >= totalPages - 1} onPress={() => setPage((p) => p + 1)} style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}>
            <Text style={styles.pageBtnText}>Suiv. ›</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{atelierEd ? "Modifier l'atelier" : "Nouvel atelier"}</Text>

              <Text style={styles.fieldLabel}>Titre (optionnel)</Text>
              <TextInput style={styles.input} value={form.titre} onChangeText={(v) => setForm((f) => ({ ...f, titre: v }))} placeholder="Ex: Atelier sommeil bébé" placeholderTextColor="#bbb" />

              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeList}>
                {TYPES.map((t) => (
                  <TouchableOpacity key={t.value} style={[styles.typeBtn, form.type === t.value && styles.typeBtnActive]} onPress={() => setForm((f) => ({ ...f, type: t.value }))}>
                    <Text style={[styles.typeBtnText, form.type === t.value && styles.typeBtnTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Date et heure (AAAA-MM-JJTHH:MM)</Text>
              <TextInput style={styles.input} value={form.dateHeure} onChangeText={(v) => setForm((f) => ({ ...f, dateHeure: v }))} placeholder="2026-06-15T09:00" placeholderTextColor="#bbb" />

              <Text style={styles.fieldLabel}>Groupe</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity style={[styles.selectChip, !form.groupeId && styles.selectChipActive]} onPress={() => setForm((f) => ({ ...f, groupeId: "" }))}>
                  <Text style={[styles.selectChipText, !form.groupeId && styles.selectChipTextActive]}>Aucun</Text>
                </TouchableOpacity>
                {groupes.map((g) => (
                  <TouchableOpacity key={g.id} style={[styles.selectChip, form.groupeId === g.id && styles.selectChipActive]} onPress={() => setForm((f) => ({ ...f, groupeId: g.id }))}>
                    <Text style={[styles.selectChipText, form.groupeId === g.id && styles.selectChipTextActive]}>{g.nom || "Groupe sans nom"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Professionnel</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <TouchableOpacity style={[styles.selectChip, !form.professionnelId && styles.selectChipActive]} onPress={() => setForm((f) => ({ ...f, professionnelId: "" }))}>
                  <Text style={[styles.selectChipText, !form.professionnelId && styles.selectChipTextActive]}>Aucun</Text>
                </TouchableOpacity>
                {professionnels.map((p) => (
                  <TouchableOpacity key={p.professionnelId} style={[styles.selectChip, form.professionnelId === p.professionnelId && styles.selectChipActive]} onPress={() => setForm((f) => ({ ...f, professionnelId: p.professionnelId }))}>
                    <Text style={[styles.selectChipText, form.professionnelId === p.professionnelId && styles.selectChipTextActive]}>{p.prenom} {p.nom}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <Btn label={envoi ? "Enregistrement..." : atelierEd ? "Enregistrer" : "Créer"} onPress={handleSave} loading={envoi} />
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
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  editBtn: { padding: 8 },
  editBtnText: { fontSize: 18, color: "#7c3aed" },
  delBtn: { padding: 8 },
  delBtnText: { fontSize: 16, color: "#e53e3e" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#f0ede8" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: "#555" },
  pageInfo: { fontSize: 13, color: "#555" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#1a1a1a", marginBottom: 14 },
  typeList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  typeBtnActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  typeBtnText: { fontSize: 12, color: "#555" },
  typeBtnTextActive: { color: "#fff" },
  selectChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", marginRight: 8 },
  selectChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  selectChipText: { fontSize: 13, color: "#555" },
  selectChipTextActive: { color: "#fff" },
});
