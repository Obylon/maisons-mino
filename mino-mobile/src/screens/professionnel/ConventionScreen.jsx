import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { conventionApi } from "../../services/api";

const STATUT_LABEL = { SIGNEE: "Signée", EN_ATTENTE: "En attente", RESILIEE: "Résiliée" };
const STATUT_COLOR = { SIGNEE: "#2d6e4e", EN_ATTENTE: "#c47a3a", RESILIEE: "#e53e3e" };

export default function ConventionScreen() {
  const [convention, setConvention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    conventionApi
      .maConvention()
      .then((res) => setConvention(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setConvention(null);
        else setError("Impossible de charger la convention pour le moment.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Card>
        <CardTitle>Ma convention de prestation</CardTitle>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !convention ? (
          <Text style={styles.empty}>Aucune convention n'a encore été établie pour votre compte. Contactez la coordinatrice.</Text>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Tarif</Text>
              <Text style={styles.value}>{convention.tarif != null ? `${convention.tarif} €` : "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Statut</Text>
              <View style={[styles.badge, { backgroundColor: STATUT_COLOR[convention.statut] + "20" }]}>
                <Text style={[styles.badgeText, { color: STATUT_COLOR[convention.statut] }]}>
                  {STATUT_LABEL[convention.statut] ?? convention.statut ?? "—"}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date de signature</Text>
              <Text style={styles.value}>{fmt(convention.dateSignature)}</Text>
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: "#e53e3e", fontSize: 13 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  label: { fontSize: 14, color: "#555" },
  value: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: "600" },
});
