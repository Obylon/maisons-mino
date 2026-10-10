import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { evaluationApi } from "../../services/api";

function StarRating({ value, onChange }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={[styles.star, n <= value && styles.starActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function EvaluerAteliersScreen() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [atelierSel, setAtelierSel] = useState(null);
  const [noteAtelier, setNoteAtelier] = useState(3);
  const [noteProfessionnel, setNoteProfessionnel] = useState(3);
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const charger = () => {
    setLoading(true);
    evaluationApi
      .ateliersAEvaluer()
      .then((res) => setAteliers(res.data))
      .catch(() => setError("Impossible de charger les ateliers pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const ouvrir = (atelier) => {
    setAtelierSel(atelier);
    setNoteAtelier(3);
    setNoteProfessionnel(3);
    setCommentaire("");
    setFormError("");
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!atelierSel) return;
    setEnvoi(true);
    setFormError("");
    try {
      await evaluationApi.soumettre({
        atelierId: atelierSel.atelierId,
        noteAtelier,
        noteProfessionnel,
        commentaire: commentaire.trim() || null,
      });
      setModalVisible(false);
      charger();
    } catch (err) {
      setFormError(err.response?.data?.message || "L'évaluation a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Card>
        <CardTitle>Évaluer mes ateliers</CardTitle>
        <Text style={styles.subtitle}>Vos avis sont anonymes et précieux.</Text>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : ateliers.length === 0 ? (
          <Text style={styles.empty}>Aucun atelier à évaluer pour l'instant.</Text>
        ) : (
          <FlatList
            data={ateliers}
            keyExtractor={(a) => String(a.atelierId)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.titre || item.type}</Text>
                  <Text style={styles.itemDate}>{fmt(item.dateHeure)}</Text>
                </View>
                <TouchableOpacity style={styles.evalBtn} onPress={() => ouvrir(item)}>
                  <Text style={styles.evalBtnText}>Évaluer</Text>
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
            <Text style={styles.modalTitle}>{atelierSel?.titre || atelierSel?.type}</Text>
            <Text style={styles.modalDate}>{fmt(atelierSel?.dateHeure)}</Text>

            <Text style={styles.ratingLabel}>Note de l'atelier</Text>
            <StarRating value={noteAtelier} onChange={setNoteAtelier} />

            <Text style={styles.ratingLabel}>Note du professionnel</Text>
            <StarRating value={noteProfessionnel} onChange={setNoteProfessionnel} />

            <Text style={styles.ratingLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.textarea}
              value={commentaire}
              onChangeText={setCommentaire}
              placeholder="Vos remarques..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#bbb"
            />

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <View style={styles.modalActions}>
              <Btn label={envoi ? "Envoi..." : "Soumettre"} onPress={handleSubmit} loading={envoi} />
              <Btn label="Annuler" onPress={() => setModalVisible(false)} secondary style={{ marginTop: 8 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  error: { color: "#e53e3e", fontSize: 13 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  itemDate: { fontSize: 12, color: "#888", marginTop: 2 },
  evalBtn: { backgroundColor: "#2d6e4e", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  evalBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  modalDate: { fontSize: 13, color: "#888", marginBottom: 16 },
  ratingLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  stars: { flexDirection: "row", marginBottom: 16 },
  star: { fontSize: 32, color: "#ddd", marginRight: 4 },
  starActive: { color: "#f6ad55" },
  textarea: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    padding: 10, fontSize: 14, color: "#1a1a1a", minHeight: 72, marginBottom: 12,
  },
  modalActions: { gap: 4 },
});
