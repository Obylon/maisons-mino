import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import Screen from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { adminApi, messageApi } from "../../services/api";

export default function MessageriePartenaireScreen() {
  const { user } = useAuth();
  const [partenaires, setPartenaires] = useState([]);
  const [selId, setSelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const flatRef = useRef(null);

  useEffect(() => {
    adminApi
      .listerUtilisateurs(0, 100)
      .then((res) => {
        const pts = res.data.content.filter((u) => u.role === "PARTENAIRE" && u.actif);
        setPartenaires(pts);
      })
      .finally(() => setLoading(false));
  }, []);

  const chargerMessages = async (id) => {
    setSelId(id);
    setMessages([]);
    try {
      const res = await messageApi.conversation(id);
      setMessages(res.data);
      await messageApi.marquerLuConversation(id);
    } catch {
      // silencieux
    }
  };

  const handleEnvoyer = async () => {
    const txt = contenu.trim();
    if (!txt || !selId || envoi) return;
    setEnvoi(true);
    setContenu("");
    try {
      await messageApi.envoyerConversation(selId, txt);
      chargerMessages(selId);
    } catch {
      setContenu(txt);
    } finally {
      setEnvoi(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  if (!selId) {
    return (
      <Screen refreshing={loading}>
        <Text style={styles.title}>Messagerie partenaires</Text>
        {partenaires.length === 0 ? (
          <Text style={styles.empty}>Aucun partenaire actif pour l'instant.</Text>
        ) : (
          partenaires.map((p) => (
            <TouchableOpacity key={p.utilisateurId} style={styles.ptItem} onPress={() => chargerMessages(p.utilisateurId)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{p.prenom?.[0]?.toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ptNom}>{p.prenom} {p.nom}</Text>
                <Text style={styles.ptEmail}>{p.email}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </Screen>
    );
  }

  const partenaire = partenaires.find((p) => p.utilisateurId === selId);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={styles.convHeader}>
        <TouchableOpacity onPress={() => setSelId(null)}>
          <Text style={styles.backBtn}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.convTitle}>{partenaire?.prenom} {partenaire?.nom}</Text>
      </View>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const estMoi = item.expediteurId === user?.utilisateurId;
          return (
            <View style={[styles.bubble, estMoi ? styles.bubbleMe : styles.bubbleOther]}>
              {!estMoi && <Text style={styles.expediteur}>{item.expediteurPrenom}</Text>}
              <Text style={[styles.texte, estMoi && styles.texteMe]}>{item.contenu}</Text>
              <Text style={[styles.heure, estMoi && styles.heureMe]}>{fmt(item.dateEnvoi)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyChat}>Aucun message. Envoyez le premier !</Text>}
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
        <TouchableOpacity
          style={[styles.sendBtn, (!contenu.trim() || envoi) && styles.sendBtnDisabled]}
          onPress={handleEnvoyer}
          disabled={!contenu.trim() || envoi}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  ptItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#d97706", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ptNom: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  ptEmail: { fontSize: 12, color: "#888" },
  chevron: { fontSize: 20, color: "#bbb" },
  convHeader: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { color: "#7c3aed", fontSize: 15, fontWeight: "600", marginRight: 12 },
  convTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  list: { padding: 12, paddingBottom: 4 },
  emptyChat: { textAlign: "center", color: "#888", marginTop: 40 },
  bubble: { maxWidth: "80%", marginBottom: 8, padding: 10, borderRadius: 12 },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: "#7c3aed" },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: "#f0ede8" },
  expediteur: { fontSize: 11, color: "#888", marginBottom: 2 },
  texte: { fontSize: 14, color: "#1a1a1a" },
  texteMe: { color: "#fff" },
  heure: { fontSize: 10, color: "#888", marginTop: 3, textAlign: "right" },
  heureMe: { color: "rgba(255,255,255,0.7)" },
  bar: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff", alignItems: "flex-end" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100, color: "#1a1a1a" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: "#ccc" },
  sendIcon: { color: "#fff", fontSize: 16 },
});
