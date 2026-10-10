import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { dossierApi } from "../../services/api";

export default function DossiersScreen() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selDossier, setSelDossier] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const charger = () => {
    setLoading(true);
    dossierApi
      .lister(page)
      .then((res) => {
        setDossiers(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Impossible de charger les dossiers pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [page]);

  const ouvrir = async (dossier) => {
    setSelDossier(dossier);
    setDetail(null);
    setModalVisible(true);
    try {
      const res = await dossierApi.obtenir(dossier.id);
      setDetail(res.data);
    } catch {
      setDetail({ contenu: "Impossible de charger ce dossier.", dateDerniereMaj: null });
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Dossiers archivés</CardTitle>
        <Text style={styles.subtitle}>Trace permanente — persiste après suppression de compte.</Text>

        {dossiers.length === 0 ? (
          <Text style={styles.empty}>Aucun dossier généré pour l'instant.</Text>
        ) : (
          <FlatList
            data={dossiers}
            keyExtractor={(d) => String(d.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => ouvrir(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNom}>{item.prenom} {item.nom}</Text>
                  <Text style={styles.itemMeta}>{item.role}{item.compteSupprime ? " · compte supprimé" : ""}</Text>
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
            <Text style={styles.modalTitle}>{selDossier?.prenom} {selDossier?.nom}</Text>
            <Text style={styles.modalMeta}>{selDossier?.role}</Text>

            {!detail ? (
              <Text style={styles.loading}>Chargement...</Text>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                <Text style={styles.meta}>Dernière mise à jour : {fmt(detail.dateDerniereMaj)}</Text>
                {detail.compteSupprime && <Text style={styles.supprime}>Le compte d'origine a été supprimé.</Text>}
                <View style={styles.contenuBlock}>
                  <Text style={styles.contenu}>{detail.contenu}</Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  itemNom: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  chevron: { fontSize: 20, color: "#bbb" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#f0ede8" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: "#555" },
  pageInfo: { fontSize: 13, color: "#555" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modalMeta: { fontSize: 13, color: "#888", marginBottom: 12 },
  loading: { color: "#888", textAlign: "center", paddingVertical: 20 },
  meta: { fontSize: 12, color: "#888", marginBottom: 8 },
  supprime: { fontSize: 12, color: "#e53e3e", marginBottom: 8 },
  contenuBlock: { backgroundColor: "#f8f6f3", borderRadius: 10, padding: 12 },
  contenu: { fontSize: 13, color: "#1a1a1a", lineHeight: 20, fontFamily: "monospace" },
  closeBtn: { marginTop: 16, alignItems: "center" },
  closeBtnText: { color: "#7c3aed", fontWeight: "600", fontSize: 15 },
});
