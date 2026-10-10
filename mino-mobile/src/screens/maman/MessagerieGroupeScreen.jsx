import { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "../../components/Avatar";
import { groupeApi, messageApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useBadges } from "../../context/BadgeContext";
import { colors, shadows } from "../../theme";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const m of messages) {
    const d = m.dateEnvoi ? new Date(m.dateEnvoi).toDateString() : null;
    if (d !== lastDate) { groups.push({ type: "date", id: `date-${d}`, label: formatDate(m.dateEnvoi) }); lastDate = d; }
    groups.push({ type: "message", ...m });
  }
  return groups;
}

export default function MessagerieGroupeScreen() {
  const { user } = useAuth();
  const { refreshBadges } = useBadges();
  const [groupeInfo, setGroupeInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState("");
  const flatRef = useRef(null);

  const charger = async () => {
    try {
      const resGroupe = await groupeApi.monGroupe();
      setGroupeInfo(resGroupe.data);
      await messageApi.marquerLuGroupe(resGroupe.data.id).catch(() => {});
      const resMsgs = await messageApi.filGroupe(resGroupe.data.id);
      setMessages(resMsgs.data);
      refreshBadges();
    } catch {
      setError("Impossible de charger la messagerie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);
  useEffect(() => { if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  const envoyer = async () => {
    if (!contenu.trim() || !groupeInfo?.id || envoi) return;
    const texte = contenu.trim();
    setContenu("");
    setEnvoi(true);
    try {
      const res = await messageApi.envoyer(groupeInfo.id, texte);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setError("Envoi échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const items = groupByDate(messages);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={colors.MAMAN.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <FlatList
          ref={flatRef}
          data={items}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            if (item.type === "date") {
              return (
                <View style={s.dateSep}>
                  <View style={s.dateLine} />
                  <Text style={s.dateLabel}>{item.label}</Text>
                  <View style={s.dateLine} />
                </View>
              );
            }
            const moi = item.expediteurId === user?.utilisateurId;
            const initPrenom = (item.expediteurNom || "?").split(" ")[0];
            return (
              <View style={[s.row, moi ? s.rowMe : s.rowOther]}>
                {!moi && (
                  <Avatar prenom={initPrenom} size="sm" style={{ marginRight: 6, marginTop: 4 }} />
                )}
                <View style={[s.bubble, moi ? s.bubbleMe : s.bubbleOther]}>
                  {!moi && <Text style={s.senderName}>{item.expediteurNom}</Text>}
                  <Text style={[s.msgText, moi && s.msgTextMe]}>{item.contenu}</Text>
                  <View style={s.metaRow}>
                    <Text style={[s.timeText, moi && s.timeMe]}>
                      {new Date(item.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    {moi && <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.65)" style={{ marginLeft: 4 }} />}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
              <Text style={s.vide}>Aucun message — lancez la conversation !</Text>
            </View>
          }
        />
        <View style={s.bar}>
          <TextInput
            style={s.input}
            value={contenu}
            onChangeText={setContenu}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!contenu.trim() || envoi) && s.sendBtnOff]}
            onPress={envoyer}
            disabled={!contenu.trim() || envoi}
          >
            {envoi
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  error: { color: colors.danger, padding: 12, textAlign: "center", fontSize: 13 },
  vide: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  dateSep: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dateLabel: { fontSize: 11, color: colors.textMuted, marginHorizontal: 10, fontWeight: "600" },
  row: { flexDirection: "row", marginBottom: 6, alignItems: "flex-end" },
  rowMe: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 12, ...shadows.sm },
  bubbleMe: { backgroundColor: colors.MAMAN.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: "700", color: colors.textMuted, marginBottom: 3 },
  msgText: { fontSize: 15, color: colors.textPrimary, lineHeight: 20 },
  msgTextMe: { color: "#fff" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 },
  timeText: { fontSize: 10, color: colors.textMuted },
  timeMe: { color: "rgba(255,255,255,0.65)" },
  bar: {
    flexDirection: "row",
    padding: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    ...shadows.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.MAMAN.primary,
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  sendBtnOff: { backgroundColor: colors.textMuted },
});
