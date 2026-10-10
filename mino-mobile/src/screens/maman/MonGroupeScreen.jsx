import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { groupeApi } from "../../services/api";

export default function MonGroupeScreen() {
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    groupeApi
      .monGroupe()
      .then((res) => setGroupe(res.data))
      .catch(() => setError("Impossible de charger votre groupe pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Card>
        <CardTitle>Mon groupe</CardTitle>
        <Text style={styles.subtitle}>Les femmes de votre cohorte — l'effet village.</Text>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !groupe ? null : (
          <>
            {groupe.dateConstitution && (
              <Text style={styles.meta}>
                Groupe constitué le {new Date(groupe.dateConstitution).toLocaleDateString("fr-FR")}
              </Text>
            )}
            {groupe.membres?.length === 0 ? (
              <Text style={styles.empty}>Aucun membre pour l'instant.</Text>
            ) : (
              <FlatList
                data={groupe.membres}
                keyExtractor={(m) => String(m.utilisateurId)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.membre}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.prenom?.[0]?.toUpperCase() ?? "?"}</Text>
                    </View>
                    <Text style={styles.prenom}>{item.prenom}</Text>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: "#888", marginBottom: 16 },
  meta: { fontSize: 13, color: "#888", marginBottom: 12 },
  error: { color: "#e53e3e", fontSize: 14 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  membre: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#c47a3a",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  prenom: { fontSize: 16, color: "#1a1a1a" },
  separator: { height: 1, backgroundColor: "#f0ede8" },
});
