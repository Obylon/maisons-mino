import { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { messagePriveApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// La maman parle uniquement avec la coordinatrice (hardcodé côté backend par convention)
// On passe l'id via la route ; ici on charge depuis le contexte si disponible.
export default function MessageriePriveeScreen({ route }) {
  const { user } = useAuth();
  const autreId = route?.params?.autreId;
  const autreNom = route?.params?.autreNom || "Coordinatrice";

  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const flatRef = useRef(null);

  const charger = async () => {
    if (!autreId) { setLoading(false); return; }
    try {
      await messagePriveApi.marquerLu(autreId).catch(() => {});
      const res = await messagePriveApi.conversation(autreId);
      setMessages(res.data);
    } catch {
      setError("Impossible de charger la conversation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [autreId]);
  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const envoyer = async () => {
    if (!contenu.trim() || !autreId) return;
    const texte = contenu.trim();
    setContenu("");
    try {
      const res = await messagePriveApi.envoyer(autreId, texte);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setError("Envoi échoué.");
    }
  };

  if (!autreId) return (
    <SafeAreaView style={s.safe}>
      <Text style={s.center}>Aucune conversation sélectionnée.</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {!loading && messages.length === 0 && (
          <Text style={s.vide}>Démarrez la conversation avec {autreNom}</Text>
        )}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          renderItem={({ item: m }) => {
            const moi = m.expediteurId === user.utilisateurId;
            return (
              <View style={[s.bulle, moi ? s.bullesMoi : s.bulleAutre]}>
                <Text style={[s.texte, moi && { color: "#fff" }]}>{m.contenu}</Text>
                <Text style={[s.heure, moi && { color: "rgba(255,255,255,0.7)" }]}>
                  {new Date(m.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
        <View style={s.barre}>
          <TextInput
            style={s.input}
            value={contenu}
            onChangeText={setContenu}
            placeholder={`Message à ${autreNom}...`}
            multiline
          />
          <TouchableOpacity style={s.sendBtn} onPress={envoyer}>
            <Text style={s.sendTxt}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  center: { textAlign: "center", marginTop: 40, color: "#6b7280" },
  vide: { textAlign: "center", marginTop: 40, color: "#6b7280", paddingHorizontal: 24 },
  error: { color: "#dc2626", padding: 12, textAlign: "center" },
  bulle: { maxWidth: "80%", borderRadius: 12, padding: 10, marginBottom: 8 },
  bullesMoi: { backgroundColor: "#2563EB", alignSelf: "flex-end" },
  bulleAutre: { backgroundColor: "#fff", alignSelf: "flex-start", borderWidth: 1, borderColor: "#e5e7eb" },
  texte: { fontSize: 15, color: "#111827" },
  heure: { fontSize: 11, color: "#9ca3af", marginTop: 4, alignSelf: "flex-end" },
  barre: {
    flexDirection: "row", padding: 8, borderTopWidth: 1, borderColor: "#e5e7eb",
    backgroundColor: "#fff", alignItems: "flex-end",
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100, backgroundColor: "#f9fafb",
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center", marginLeft: 8,
  },
  sendTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
