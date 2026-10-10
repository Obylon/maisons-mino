import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { mamanApi } from "../../services/api";

const CHAMPS = [
  { key: "dateTermeGrossesse", label: "Date de terme (grossesse)" },
  { key: "dateNaissance", label: "Date de naissance du bébé" },
  { key: "dateEntreeMaison", label: "Date d'entrée en Maison MINO" },
  { key: "dateSortieMaison", label: "Date de sortie de la Maison MINO" },
];

export default function ParcoursScreen() {
  const [parcours, setParcours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const charger = () => {
    setLoading(true);
    mamanApi
      .monParcours()
      .then((res) => {
        setParcours(res.data);
        setForm({
          dateTermeGrossesse: res.data.dateTermeGrossesse?.slice(0, 10) ?? "",
          dateNaissance: res.data.dateNaissance?.slice(0, 10) ?? "",
          dateEntreeMaison: res.data.dateEntreeMaison?.slice(0, 10) ?? "",
          dateSortieMaison: res.data.dateSortieMaison?.slice(0, 10) ?? "",
        });
      })
      .catch(() => setError("Impossible de charger votre parcours pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const handleSave = async () => {
    setEnvoi(true);
    setError("");
    setSuccess("");
    try {
      await mamanApi.mettreAJourParcours({
        dateTermeGrossesse: form.dateTermeGrossesse || null,
        dateNaissance: form.dateNaissance || null,
        dateEntreeMaison: form.dateEntreeMaison || null,
        dateSortieMaison: form.dateSortieMaison || null,
      });
      setSuccess("Parcours mis à jour.");
      setEditing(false);
      charger();
    } catch {
      setError("La mise à jour a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const fmt = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Card>
        <View style={styles.header}>
          <CardTitle>Mon parcours</CardTitle>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Modifier</Text>
            </TouchableOpacity>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        {!editing ? (
          CHAMPS.map((c) => (
            <View key={c.key} style={styles.row}>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={styles.value}>{fmt(parcours?.[c.key])}</Text>
            </View>
          ))
        ) : (
          <>
            {CHAMPS.map((c) => (
              <View key={c.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{c.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[c.key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [c.key]: v }))}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="#bbb"
                />
              </View>
            ))}
            <View style={styles.actions}>
              <Btn label={envoi ? "Enregistrement..." : "Enregistrer"} onPress={handleSave} loading={envoi} />
              <Btn label="Annuler" onPress={() => setEditing(false)} secondary style={styles.cancelBtn} />
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  editBtn: { color: "#2d6e4e", fontWeight: "600", fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  label: { fontSize: 13, color: "#888", flex: 1 },
  value: { fontSize: 14, color: "#1a1a1a", fontWeight: "500" },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: "#555", marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#1a1a1a",
  },
  actions: { marginTop: 8, gap: 8 },
  cancelBtn: { marginTop: 8 },
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  success: { color: "#2d6e4e", fontSize: 13, marginBottom: 8 },
});
