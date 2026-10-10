import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { questionnaireModeleApi } from "../../services/api";

const TYPES_Q = [
  { value: "TEXTE_LIBRE", label: "Texte libre" },
  { value: "CHOIX_UNIQUE", label: "Choix unique" },
  { value: "ECHELLE_1_10", label: "Échelle 1-10" },
];

export default function QuestionnaireModelesScreen() {
  const [modeles, setModeles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalCreer, setModalCreer] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [formError, setFormError] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [texteQ, setTexteQ] = useState("");
  const [typeQ, setTypeQ] = useState("TEXTE_LIBRE");
  const [optionsQ, setOptionsQ] = useState("");

  const charger = () => {
    setLoading(true);
    questionnaireModeleApi
      .lister()
      .then((res) => setModeles(res.data))
      .catch(() => setError("Impossible de charger les modèles pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const handleCreer = async () => {
    if (!nom.trim()) return;
    setEnvoi(true);
    setFormError("");
    try {
      await questionnaireModeleApi.creer({ nom: nom.trim(), description: description.trim() || null });
      setNom(""); setDescription("");
      setModalCreer(false);
      charger();
    } catch (err) {
      setFormError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleToggle = async (m) => {
    try {
      if (m.actif) await questionnaireModeleApi.desactiver(m.id);
      else await questionnaireModeleApi.activer(m.id);
      charger();
    } catch {
      setError("L'opération a échoué.");
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    try {
      const res = await questionnaireModeleApi.listerQuestions(id);
      setQuestions(res.data);
    } catch {
      setQuestions([]);
    }
  };

  const handleAjouterQ = async (modeleId) => {
    if (!texteQ.trim()) return;
    try {
      await questionnaireModeleApi.ajouterQuestion(modeleId, {
        texte: texteQ.trim(), type: typeQ,
        options: typeQ === "CHOIX_UNIQUE" ? optionsQ.trim() : null,
        ordre: questions.length,
      });
      setTexteQ(""); setOptionsQ("");
      const res = await questionnaireModeleApi.listerQuestions(modeleId);
      setQuestions(res.data);
    } catch {
      setError("L'ajout de la question a échoué.");
    }
  };

  const handleSupprimerQ = async (questionId, modeleId) => {
    try {
      await questionnaireModeleApi.supprimerQuestion(questionId);
      const res = await questionnaireModeleApi.listerQuestions(modeleId);
      setQuestions(res.data);
    } catch {
      setError("La suppression a échoué.");
    }
  };

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Questionnaires</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalCreer(true)}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Modèles ({modeles.length})</CardTitle>
        {modeles.length === 0 ? (
          <Text style={styles.empty}>Aucun modèle créé pour l'instant.</Text>
        ) : (
          modeles.map((m) => (
            <View key={m.id} style={styles.modeleCard}>
              <View style={styles.modeleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeleNom}>{m.nom}</Text>
                  {m.description ? <Text style={styles.modeleDesc}>{m.description}</Text> : null}
                  <Text style={[styles.modeleStatut, { color: m.actif ? "#2d6e4e" : "#e53e3e" }]}>
                    {m.actif ? "Actif" : "Désactivé"}
                  </Text>
                </View>
                <View style={styles.modeleActions}>
                  <TouchableOpacity onPress={() => toggleExpand(m.id)} style={styles.qBtn}>
                    <Text style={styles.qBtnText}>{expandedId === m.id ? "Masquer" : "Questions"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleToggle(m)}>
                    <Text style={[styles.toggleText, { color: m.actif ? "#e53e3e" : "#2d6e4e" }]}>
                      {m.actif ? "Désact." : "Réact."}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {expandedId === m.id && (
                <View style={styles.questionsBlock}>
                  {questions.length === 0 ? (
                    <Text style={styles.empty}>Aucune question.</Text>
                  ) : (
                    questions.map((q, idx) => (
                      <View key={q.id} style={styles.qRow}>
                        <Text style={styles.qNum}>{idx + 1}.</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.qTexte}>{q.texte}</Text>
                          <Text style={styles.qType}>{TYPES_Q.find((t) => t.value === q.type)?.label}{q.options ? ` : ${q.options}` : ""}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleSupprimerQ(q.id, m.id)}>
                          <Text style={styles.delText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  <View style={styles.addQBlock}>
                    <TextInput style={styles.qInput} value={texteQ} onChangeText={setTexteQ} placeholder="Texte de la question" placeholderTextColor="#bbb" />
                    <View style={styles.typeRow}>
                      {TYPES_Q.map((t) => (
                        <TouchableOpacity key={t.value} style={[styles.typeChip, typeQ === t.value && styles.typeChipActive]} onPress={() => setTypeQ(t.value)}>
                          <Text style={[styles.typeChipText, typeQ === t.value && styles.typeChipTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {typeQ === "CHOIX_UNIQUE" && (
                      <TextInput style={styles.qInput} value={optionsQ} onChangeText={setOptionsQ} placeholder="Choix séparés par des virgules" placeholderTextColor="#bbb" />
                    )}
                    <TouchableOpacity style={styles.addQBtn} onPress={() => handleAjouterQ(m.id)}>
                      <Text style={styles.addQBtnText}>Ajouter la question</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </Card>

      <Modal visible={modalCreer} animationType="slide" transparent onRequestClose={() => setModalCreer(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouveau modèle</Text>
            <Text style={styles.fieldLabel}>Nom *</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Satisfaction atelier" placeholderTextColor="#bbb" autoFocus />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Optionnel" placeholderTextColor="#bbb" />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <Btn label={envoi ? "Création..." : "Créer le modèle"} onPress={handleCreer} loading={envoi} />
            <Btn label="Annuler" onPress={() => setModalCreer(false)} secondary style={{ marginTop: 8 }} />
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
  empty: { color: "#888", fontSize: 13, textAlign: "center", paddingVertical: 8 },
  modeleCard: { borderWidth: 1, borderColor: "#f0ede8", borderRadius: 10, padding: 12, marginBottom: 10 },
  modeleHeader: { flexDirection: "row", alignItems: "flex-start" },
  modeleNom: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  modeleDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  modeleStatut: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  modeleActions: { alignItems: "flex-end", gap: 6 },
  qBtn: { backgroundColor: "#e8e0fb", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  qBtnText: { fontSize: 12, color: "#7c3aed", fontWeight: "600" },
  toggleText: { fontSize: 12, fontWeight: "600" },
  questionsBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0ede8" },
  qRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 6 },
  qNum: { fontSize: 13, color: "#888", marginRight: 6, width: 20 },
  qTexte: { fontSize: 13, color: "#1a1a1a" },
  qType: { fontSize: 11, color: "#888" },
  delText: { fontSize: 14, color: "#e53e3e", padding: 4 },
  addQBlock: { marginTop: 12, backgroundColor: "#faf8f5", borderRadius: 8, padding: 10 },
  qInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: "#1a1a1a", marginBottom: 8 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: "#ddd" },
  typeChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  typeChipText: { fontSize: 12, color: "#555" },
  typeChipTextActive: { color: "#fff" },
  addQBtn: { backgroundColor: "#7c3aed", padding: 10, borderRadius: 8, alignItems: "center" },
  addQBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#1a1a1a", marginBottom: 14 },
});
