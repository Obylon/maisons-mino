import { useEffect, useState } from "react";
import { Text, TextInput, StyleSheet, Alert, View, Modal, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card } from "../../components/Card";
import Btn from "../../components/Btn";
import { compteRenduApi } from "../../services/api";

export default function ComptesRendusScreen() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [contenu, setContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    setLoading(true);
    compteRenduApi.mesComptesRendus()
      .then((res) => setComptes(res.data))
      .catch(() => setError("Impossible de charger les comptes rendus."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const rediger = async () => {
    if (!contenu.trim()) { Alert.alert("Erreur", "Le contenu est vide."); return; }
    setEnvoi(true);
    try {
      await compteRenduApi.rediger({ contenu: contenu.trim() });
      setContenu("");
      setModal(false);
      charger();
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.message || "La rédaction a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <Screen onRefresh={charger} refreshing={loading}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={s.titre}>Comptes rendus</Text>
          <Btn label="+ Nouveau" onPress={() => setModal(true)} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {!loading && comptes.length === 0 && <Text style={s.vide}>Aucun compte rendu rédigé.</Text>}
        {comptes.map((c) => (
          <Card key={c.id}>
            <Text style={s.date}>
              {new Date(c.dateRedaction).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
            </Text>
            <Text style={s.texte} numberOfLines={4}>{c.contenu}</Text>
          </Card>
        ))}
      </Screen>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={s.modalContent}>
          <Text style={s.modalTitre}>Nouveau compte rendu</Text>
          <TextInput
            style={s.textArea}
            value={contenu}
            onChangeText={setContenu}
            placeholder="Rédigez votre compte rendu..."
            multiline
            numberOfLines={12}
            textAlignVertical="top"
            autoFocus
          />
          <Btn label="Enregistrer" onPress={rediger} loading={envoi} style={{ marginBottom: 12 }} />
          <Btn label="Annuler" onPress={() => { setModal(false); setContenu(""); }} secondary />
        </ScrollView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  titre: { fontSize: 20, fontWeight: "700", color: "#1e3a5f" },
  date: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  texte: { fontSize: 14, color: "#374151", lineHeight: 20 },
  error: { color: "#dc2626", marginBottom: 12 },
  vide: { color: "#6b7280", textAlign: "center", marginTop: 40 },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalTitre: { fontSize: 22, fontWeight: "700", color: "#1e3a5f", marginBottom: 20 },
  textArea: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    padding: 12, fontSize: 15, minHeight: 200, marginBottom: 20,
    backgroundColor: "#f9fafb",
  },
});
