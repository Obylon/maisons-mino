import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { cohorteApi } from "../../services/api";

export default function CohortesScreen() {
  const navigation = useNavigation();
  const [cohortes, setCohortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const charger = () => {
    setLoading(true);
    cohorteApi
      .lister()
      .then((res) => setCohortes(res.data))
      .catch(() => setError("Impossible de charger les cohortes pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const handleCreer = async () => {
    if (!nom.trim()) return;
    setEnvoi(true);
    setFormError("");
    try {
      await cohorteApi.creer({ nom: nom.trim(), ville: ville.trim() || null, dateDebut: dateDebut || null });
      setNom(""); setVille(""); setDateDebut("");
      setModalVisible(false);
      charger();
    } catch (err) {
      setFormError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleSupprimer = async (id) => {
    try {
      await cohorteApi.supprimer(id);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Cohortes & groupes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Cohortes ({cohortes.length})</CardTitle>
        {cohortes.length === 0 ? (
          <Text style={styles.empty}>Aucune cohorte créée pour l'instant.</Text>
        ) : (
          <FlatList
            data={cohortes}
            keyExtractor={(c) => String(c.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate("DetailCohorte", { id: item.id, nom: item.nom })}>
                  <Text style={styles.itemNom}>{item.nom}</Text>
                  <Text style={styles.itemMeta}>{item.ville ?? "Ville non précisée"} · Début : {fmt(item.dateDebut)}</Text>
                </TouchableOpacity>
                <Text style={styles.chevron}>›</Text>
                <TouchableOpacity onPress={() => handleSupprimer(item.id)} style={styles.delBtn}>
                  <Text style={styles.delBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}
      </Card>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvelle cohorte</Text>

            <Text style={styles.fieldLabel}>Nom *</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Cohorte printemps 2026" placeholderTextColor="#bbb" autoFocus />

            <Text style={styles.fieldLabel}>Ville</Text>
            <TextInput style={styles.input} value={ville} onChangeText={setVille} placeholder="Ex: Paris" placeholderTextColor="#bbb" />

            <Text style={styles.fieldLabel}>Date de début (AAAA-MM-JJ)</Text>
            <TextInput style={styles.input} value={dateDebut} onChangeText={setDateDebut} placeholder="2026-03-01" placeholderTextColor="#bbb" />

            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <Btn label={envoi ? "Création..." : "Créer la cohorte"} onPress={handleCreer} loading={envoi} />
            <Btn label="Annuler" onPress={() => setModalVisible(false)} secondary style={{ marginTop: 8 }} />
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
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  itemNom: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  chevron: { fontSize: 20, color: "#bbb", marginHorizontal: 4 },
  delBtn: { padding: 8 },
  delBtnText: { fontSize: 16, color: "#e53e3e" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#1a1a1a", marginBottom: 14 },
});
