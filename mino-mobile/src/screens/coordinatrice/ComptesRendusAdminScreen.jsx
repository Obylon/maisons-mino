import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { compteRenduApi } from "../../services/api";

export default function ComptesRendusAdminScreen() {
  const [crs, setCrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selCr, setSelCr] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const charger = () => {
    setLoading(true);
    compteRenduApi
      .listerTout(page)
      .then((res) => {
        setCrs(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Impossible de charger les comptes rendus pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [page]);

  const ouvrir = (cr) => {
    setSelCr(cr);
    setModalVisible(true);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Comptes rendus</CardTitle>
        {crs.length === 0 ? (
          <Text style={styles.empty}>Aucun compte rendu pour l'instant.</Text>
        ) : (
          <FlatList
            data={crs}
            keyExtractor={(cr) => String(cr.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => ouvrir(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.atelierTitre || item.atelierType || "Atelier"}</Text>
                  <Text style={styles.itemMeta}>{item.professionnelPrenom} {item.professionnelNom} · {fmt(item.atelierDate)}</Text>
                </View>
                <View style={styles.badges}>
                  {item.suiviRecommande && <View style={styles.badge}><Text style={styles.badgeText}>Suivi</Text></View>}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
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

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selCr?.atelierTitre || selCr?.atelierType || "Atelier"}</Text>
              <Text style={styles.modalMeta}>{selCr?.professionnelPrenom} {selCr?.professionnelNom} · {fmt(selCr?.atelierDate)}</Text>
              <Text style={styles.modalMeta}>Présences : {selCr?.nombrePresences ?? "—"}</Text>

              {selCr?.deroule && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Déroulé</Text>
                  <Text style={styles.sectionText}>{selCr.deroule}</Text>
                </View>
              )}
              {selCr?.pointsAttention && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Points d'attention</Text>
                  <Text style={styles.sectionText}>{selCr.pointsAttention}</Text>
                </View>
              )}
              {selCr?.suiviRecommande && (
                <View style={styles.tagRow}>
                  <View style={styles.tagSuivi}><Text style={styles.tagText}>Suivi recommandé</Text></View>
                </View>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  badges: { marginHorizontal: 8 },
  badge: { backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, color: "#c47a3a", fontWeight: "600" },
  chevron: { fontSize: 20, color: "#bbb" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#f0ede8" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: "#555" },
  pageInfo: { fontSize: 13, color: "#555" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  modalMeta: { fontSize: 13, color: "#888", marginBottom: 4 },
  section: { marginTop: 14, padding: 12, backgroundColor: "#f8f6f3", borderRadius: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#555", textTransform: "uppercase", marginBottom: 6 },
  sectionText: { fontSize: 14, color: "#1a1a1a", lineHeight: 20 },
  tagRow: { flexDirection: "row", marginTop: 12 },
  tagSuivi: { backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 13, color: "#c47a3a", fontWeight: "600" },
  closeBtn: { marginTop: 20, alignItems: "center" },
  closeBtnText: { color: "#7c3aed", fontWeight: "600", fontSize: 15 },
});
