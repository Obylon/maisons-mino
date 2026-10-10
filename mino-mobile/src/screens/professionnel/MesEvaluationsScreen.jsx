import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { evaluationApi } from "../../services/api";

function Stars({ note }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={[styles.star, n <= Math.round(note) && styles.starActive]}>★</Text>
      ))}
      <Text style={styles.noteText}> {note?.toFixed(1)}/5</Text>
    </View>
  );
}

export default function MesEvaluationsScreen() {
  const [synthese, setSynthese] = useState(null);
  const [parAtelier, setParAtelier] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [atelierSel, setAtelierSel] = useState(null);
  const [commentaires, setCommentaires] = useState([]);

  const charger = () => {
    setLoading(true);
    evaluationApi
      .synthese()
      .then((res) => {
        setSynthese(res.data.global);
        setParAtelier(res.data.parAtelier || []);
      })
      .catch(() => setError("Impossible de charger vos évaluations pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const voirCommentaires = async (atelier) => {
    setAtelierSel(atelier);
    setCommentaires([]);
    setModalVisible(true);
    try {
      const res = await evaluationApi.parAtelier(atelier.atelierId);
      setCommentaires(res.data.filter((e) => e.commentaire));
    } catch {
      // silencieux
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {synthese && (
        <Card>
          <CardTitle>Synthèse globale</CardTitle>
          <View style={styles.synthRow}>
            <View style={styles.synthItem}>
              <Text style={styles.synthNum}>{synthese.nombreEvaluations ?? 0}</Text>
              <Text style={styles.synthLabel}>évaluations</Text>
            </View>
            <View style={styles.synthItem}>
              <Text style={styles.synthNum}>{synthese.moyenneAtelier?.toFixed(1) ?? "—"}</Text>
              <Text style={styles.synthLabel}>moy. atelier</Text>
            </View>
            <View style={styles.synthItem}>
              <Text style={styles.synthNum}>{synthese.moyenneProfessionnel?.toFixed(1) ?? "—"}</Text>
              <Text style={styles.synthLabel}>moy. pro</Text>
            </View>
          </View>
        </Card>
      )}

      <Card>
        <CardTitle>Par atelier</CardTitle>
        {parAtelier.length === 0 ? (
          <Text style={styles.empty}>Aucune évaluation pour l'instant.</Text>
        ) : (
          <FlatList
            data={parAtelier}
            keyExtractor={(a) => String(a.atelierId)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.atelierItem}>
                <Text style={styles.atelierTitle}>{item.titre || item.type}</Text>
                <Text style={styles.atelierDate}>{fmt(item.dateHeure)} · {item.nombreEvaluations} avis</Text>
                <Stars note={item.moyenneAtelier} />
                {item.nombreCommentaires > 0 && (
                  <TouchableOpacity onPress={() => voirCommentaires(item)}>
                    <Text style={styles.commentLink}>{item.nombreCommentaires} commentaire{item.nombreCommentaires > 1 ? "s" : ""}</Text>
                  </TouchableOpacity>
                )}
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
            <ScrollView>
              {commentaires.length === 0 ? (
                <Text style={styles.empty}>Aucun commentaire.</Text>
              ) : (
                commentaires.map((c, i) => (
                  <View key={i} style={styles.commentCard}>
                    <Text style={styles.commentText}>"{c.commentaire}"</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  synthRow: { flexDirection: "row", justifyContent: "space-around" },
  synthItem: { alignItems: "center" },
  synthNum: { fontSize: 28, fontWeight: "700", color: "#2d6e4e" },
  synthLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  atelierItem: { paddingVertical: 12 },
  atelierTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  atelierDate: { fontSize: 12, color: "#888", marginTop: 2, marginBottom: 6 },
  starsRow: { flexDirection: "row", alignItems: "center" },
  star: { fontSize: 18, color: "#ddd" },
  starActive: { color: "#f6ad55" },
  noteText: { fontSize: 13, color: "#555", marginLeft: 4 },
  commentLink: { fontSize: 13, color: "#2d6e4e", marginTop: 4 },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: "60%" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  commentCard: { backgroundColor: "#f8f6f3", borderRadius: 8, padding: 12, marginBottom: 8 },
  commentText: { fontSize: 14, color: "#555", fontStyle: "italic" },
  closeBtn: { marginTop: 16, alignItems: "center" },
  closeBtnText: { color: "#2d6e4e", fontWeight: "600", fontSize: 15 },
});
