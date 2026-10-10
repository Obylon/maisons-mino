import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { promPremApi } from "../../services/api";

export default function PromPremAdminScreen() {
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filtreType, setFiltreType] = useState("TOUS");

  const charger = () => {
    setLoading(true);
    promPremApi
      .listerTout(page)
      .then((res) => {
        setReponses(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Impossible de charger les questionnaires pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [page]);

  const types = ["TOUS", ...new Set(reponses.map((r) => r.type).filter(Boolean))];
  const filtrees = filtreType === "TOUS" ? reponses : reponses.filter((r) => r.type === filtreType);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Suivi PROM/PREM</CardTitle>
        <Text style={styles.subtitle}>Questionnaires pour le rapport d'impact annuel.</Text>

        <View style={styles.filtreRow}>
          {types.map((t) => (
            <TouchableOpacity key={t} style={[styles.filtreBtn, filtreType === t && styles.filtreBtnActive]} onPress={() => setFiltreType(t)}>
              <Text style={[styles.filtreBtnText, filtreType === t && styles.filtreBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtrees.length === 0 ? (
          <Text style={styles.empty}>Aucun questionnaire soumis pour l'instant.</Text>
        ) : (
          <FlatList
            data={filtrees}
            keyExtractor={(r) => String(r.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mamanNom}>{item.mamanPrenom} {item.mamanNom}</Text>
                  <Text style={styles.meta}>{item.type} · {item.phase}</Text>
                </View>
                <Text style={styles.date}>{fmt(item.dateSoumission)}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}

        <View style={styles.pagination}>
          <TouchableOpacity disabled={page === 0} onPress={() => setPage((p) => p - 1)} style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}>
            <Text style={styles.pageBtnText}>‹ Préc.</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{page + 1} / {Math.max(1, totalPages)}</Text>
          <TouchableOpacity disabled={page >= totalPages - 1} onPress={() => setPage((p) => p + 1)} style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}>
            <Text style={styles.pageBtnText}>Suiv. ›</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  filtreRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  filtreBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#ddd" },
  filtreBtnActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  filtreBtnText: { fontSize: 13, color: "#555" },
  filtreBtnTextActive: { color: "#fff", fontWeight: "600" },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  mamanNom: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  date: { fontSize: 12, color: "#555" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#f0ede8" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: "#555" },
  pageInfo: { fontSize: 13, color: "#555" },
});
