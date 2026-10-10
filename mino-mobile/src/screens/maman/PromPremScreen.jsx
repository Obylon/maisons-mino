import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { promPremApi, questionnaireModeleApi } from "../../services/api";

export default function PromPremScreen() {
  const [historique, setHistorique] = useState([]);
  const [modeles, setModeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modeleSel, setModeleSel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [reponses, setReponses] = useState({});
  const [phase, setPhase] = useState("T0");
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const PHASES = ["T0", "T1", "T2", "T3", "T4"];

  const charger = () => {
    setLoading(true);
    Promise.all([promPremApi.mesReponses(), questionnaireModeleApi.listerActifs()])
      .then(([resHist, resMod]) => {
        setHistorique(resHist.data);
        setModeles(resMod.data);
      })
      .catch(() => setError("Impossible de charger les questionnaires pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const ouvrir = async (modele) => {
    setModeleSel(modele);
    setReponses({});
    setPhase("T0");
    setFormError("");
    try {
      const res = await questionnaireModeleApi.listerQuestions(modele.id);
      setQuestions(res.data);
    } catch {
      setQuestions([]);
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!modeleSel) return;
    const lignes = questions.map((q) => ({ questionId: q.id, valeur: reponses[q.id] || "" }));
    setEnvoi(true);
    setFormError("");
    try {
      await promPremApi.soumettre({
        questionnaireModeleId: modeleSel.id,
        phase,
        lignes,
      });
      setModalVisible(false);
      charger();
    } catch (err) {
      setFormError(err.response?.data?.message || "L'envoi a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Questionnaires disponibles</CardTitle>
        {modeles.length === 0 ? (
          <Text style={styles.empty}>Aucun questionnaire disponible pour le moment.</Text>
        ) : (
          <FlatList
            data={modeles}
            keyExtractor={(m) => String(m.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.modeleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{item.nom}</Text>
                  {item.description ? <Text style={styles.modeDesc}>{item.description}</Text> : null}
                </View>
                <TouchableOpacity style={styles.fillBtn} onPress={() => ouvrir(item)}>
                  <Text style={styles.fillBtnText}>Remplir</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}
      </Card>

      <Card>
        <CardTitle>Mes réponses passées</CardTitle>
        {historique.length === 0 ? (
          <Text style={styles.empty}>Aucune réponse soumise pour l'instant.</Text>
        ) : (
          <FlatList
            data={historique}
            keyExtractor={(r) => String(r.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.histRow}>
                <Text style={styles.histType}>{item.type}</Text>
                <Text style={styles.histPhase}>{item.phase}</Text>
                <Text style={styles.histDate}>{fmt(item.dateSoumission)}</Text>
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
              <Text style={styles.modalTitle}>{modeleSel?.nom}</Text>

              <Text style={styles.fieldLabel}>Phase</Text>
              <View style={styles.phaseRow}>
                {PHASES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.phaseBtn, phase === p && styles.phaseBtnActive]}
                    onPress={() => setPhase(p)}
                  >
                    <Text style={[styles.phaseBtnText, phase === p && styles.phaseBtnTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {questions.map((q) => (
                <View key={q.id} style={styles.qBlock}>
                  <Text style={styles.qTexte}>{q.texte}</Text>
                  {q.type === "TEXTE_LIBRE" && (
                    <TextInput
                      style={styles.textarea}
                      value={reponses[q.id] || ""}
                      onChangeText={(v) => setReponses((r) => ({ ...r, [q.id]: v }))}
                      multiline
                      numberOfLines={2}
                      placeholderTextColor="#bbb"
                    />
                  )}
                  {q.type === "ECHELLE_1_10" && (
                    <View style={styles.echelleRow}>
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <TouchableOpacity
                          key={n}
                          style={[styles.echelleBtn, reponses[q.id] === String(n) && styles.echelleBtnActive]}
                          onPress={() => setReponses((r) => ({ ...r, [q.id]: String(n) }))}
                        >
                          <Text style={[styles.echelleBtnText, reponses[q.id] === String(n) && styles.echelleBtnTextActive]}>
                            {n}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {q.type === "CHOIX_UNIQUE" && q.options && (
                    <View style={styles.choixCol}>
                      {q.options.split(",").map((opt) => opt.trim()).map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.choixBtn, reponses[q.id] === opt && styles.choixBtnActive]}
                          onPress={() => setReponses((r) => ({ ...r, [q.id]: opt }))}
                        >
                          <Text style={[styles.choixBtnText, reponses[q.id] === opt && styles.choixBtnTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {formError ? <Text style={styles.error}>{formError}</Text> : null}

              <Btn label={envoi ? "Envoi..." : "Soumettre"} onPress={handleSubmit} loading={envoi} />
              <Btn label="Annuler" onPress={() => setModalVisible(false)} secondary style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  modeleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  modeTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  modeDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  fillBtn: { backgroundColor: "#2d6e4e", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fillBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  histRow: { flexDirection: "row", paddingVertical: 8, alignItems: "center" },
  histType: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  histPhase: { fontSize: 13, color: "#555", marginRight: 10 },
  histDate: { fontSize: 12, color: "#888" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  phaseRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  phaseBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  phaseBtnActive: { backgroundColor: "#2d6e4e", borderColor: "#2d6e4e" },
  phaseBtnText: { fontSize: 13, color: "#555" },
  phaseBtnTextActive: { color: "#fff", fontWeight: "600" },
  qBlock: { marginBottom: 16 },
  qTexte: { fontSize: 14, color: "#1a1a1a", marginBottom: 8 },
  textarea: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 14, color: "#1a1a1a", minHeight: 60 },
  echelleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  echelleBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
  echelleBtnActive: { backgroundColor: "#2d6e4e", borderColor: "#2d6e4e" },
  echelleBtnText: { fontSize: 13, color: "#555" },
  echelleBtnTextActive: { color: "#fff", fontWeight: "600" },
  choixCol: { gap: 8 },
  choixBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  choixBtnActive: { backgroundColor: "#2d6e4e", borderColor: "#2d6e4e" },
  choixBtnText: { fontSize: 14, color: "#555" },
  choixBtnTextActive: { color: "#fff", fontWeight: "600" },
});
