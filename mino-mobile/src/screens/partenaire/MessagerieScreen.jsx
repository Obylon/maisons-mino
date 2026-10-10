import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { messageApi } from "../../services/api";

export default function MessageriePartenaireScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const flatRef = useRef(null);

  // Le partenaire parle avec la coordinatrice via sa propre conversationId (son utilisateurId)
  const conversationId = user?.utilisateurId;

  const charger = async () => {
    if (!conversationId) return;
    try {
      const res = await messageApi.conversation(conversationId);
      setMessages(res.data);
      await messageApi.marquerLuConversation(conversationId);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEnvoyer = async () => {
    const txt = contenu.trim();
    if (!txt || envoi) return;
    setEnvoi(true);
    setContenu("");
    try {
      await messageApi.envoyerConversation(conversationId, txt);
      charger();
    } catch {
      setContenu(txt);
    } finally {
      setEnvoi(false);
    }
  };

  const isMe = (msg) => msg.expediteurId === user?.utilisateurId;

  const fmt = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  if (loading) {
    return <View style={styles.center}><Text style={styles.charg}>Chargement...</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, isMe(item) ? styles.bubbleMe : styles.bubbleOther]}>
            {!isMe(item) && <Text style={styles.expediteur}>{item.expediteurPrenom}</Text>}
            <Text style={[styles.texte, isMe(item) && styles.texteMe]}>{item.contenu}</Text>
            <Text style={[styles.heure, isMe(item) && styles.heureMe]}>{fmt(item.dateEnvoi)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun message. Envoyez le premier !</Text>}
      />
      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          value={contenu}
          onChangeText={setContenu}
          placeholder="Votre message..."
          placeholderTextColor="#bbb"
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, (!contenu.trim() || envoi) && styles.sendBtnDisabled]} onPress={handleEnvoyer} disabled={!contenu.trim() || envoi}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  charg: { color: "#888" },
  list: { padding: 12, paddingBottom: 4 },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  bubble: { maxWidth: "80%", marginBottom: 8, padding: 10, borderRadius: 12 },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: "#2d6e4e" },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: "#f0ede8" },
  expediteur: { fontSize: 11, color: "#888", marginBottom: 2 },
  texte: { fontSize: 14, color: "#1a1a1a" },
  texteMe: { color: "#fff" },
  heure: { fontSize: 10, color: "#888", marginTop: 3, textAlign: "right" },
  heureMe: { color: "rgba(255,255,255,0.7)" },
  bar: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff", alignItems: "flex-end" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100, color: "#1a1a1a" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2d6e4e", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: "#ccc" },
  sendIcon: { color: "#fff", fontSize: 16 },
});
