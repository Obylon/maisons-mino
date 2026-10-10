import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import Btn from "../../components/Btn";
import { cohorteApi, groupeApi } from "../../services/api";

export default function DetailCohorteScreen() {
  const route = useRoute();
  const { id, nom } = route.params;

  const [cohorte, setCohorte] = useState(null);
  const [enAttente, setEnAttente] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modalGroupe, setModalGroupe] = useState(false);
  const [nomGroupe, setNomGroupe] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    setLoading(true);
    setError("");
    try {
      const [resC, resA, resG] = await Promise.all([
        cohorteApi.obtenir(id),
        cohorteApi.mamansEnAttente(id),
        groupeApi.lister(),
      ]);
      setCohorte(resC.data);
      setEnAttente(resA.data);
      const groupesDeCetteCohorte = resG.data.filter((g) => String(g.cohorteId) === String(id));
      const withMembres = await Promise.all(
        groupesDeCetteCohorte.map(async (g) => {
          const res = await groupeApi.membres(g.id);
          return { ...g, membres: res.data };
        })
      );
      setGroupes(withMembres);
    } catch {
      setError("Impossible de charger cette cohorte pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [id]);

  const handleCreerGroupe = async () => {
    setEnvoi(true);
    setError("");
    try {
      await groupeApi.creer({ cohorteId: id, nom: nomGroupe.trim() || null, dateConstitution: new Date().toISOString().slice(0, 10) });
      setMessage("Groupe créé.");
      setNomGroupe("");
      setModalGroupe(false);
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La création a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  const handleAjouter = async (mamanId, groupeId) => {
    setError(""); setMessage("");
    try {
      await groupeApi.ajouterMaman(groupeId, mamanId);
      setMessage("Femme ajoutée au groupe.");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "L'ajout a échoué.");
    }
  };

  const handleRetirer = async (groupeId, mamanId) => {
    setError(""); setMessage("");
    try {
      await groupeApi.retirerMaman(groupeId, mamanId);
      setMessage("Femme retirée du groupe.");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "Le retrait a échoué.");
    }
  };

  const handleSupprimerGroupe = async (groupeId) => {
    setError(""); setMessage("");
    try {
      await groupeApi.supprimer(groupeId);
      setMessage("Groupe supprimé.");
      charger();
    } catch (err) {
      setError(err.response?.data?.message || "La suppression a échoué.");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Text style={styles.pageTitle}>{nom}</Text>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <CardTitle>Informations</CardTitle>
        <View style={styles.row}><Text style={styles.rowLabel}>Ville</Text><Text style={styles.rowVal}>{cohorte?.ville ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Début</Text><Text style={styles.rowVal}>{fmt(cohorte?.dateDebut)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Groupes</Text><Text style={styles.rowVal}>{groupes.length}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>En attente</Text><Text style={styles.rowVal}>{enAttente.length}</Text></View>
      </Card>

      {/* Femmes en attente */}
      <Card>
        <CardTitle>En attente d'affectation ({enAttente.length})</CardTitle>
        {enAttente.length === 0 ? (
          <Text style={styles.empty}>Toutes les mamans ont un groupe.</Text>
        ) : (
          <FlatList
            data={enAttente}
            keyExtractor={(m) => String(m.mamanId)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.mamanItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mamanNom}>{item.prenom} {item.nom}</Text>
                  <Text style={styles.mamanMeta}>Terme : {fmt(item.dateTermeGrossesse)}</Text>
                </View>
                {groupes.filter((g) => g.tailleActuelle < g.tailleCible).length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {groupes.filter((g) => g.tailleActuelle < g.tailleCible).map((g) => (
                      <TouchableOpacity key={g.id} style={styles.addChip} onPress={() => handleAjouter(item.mamanId, g.id)}>
                        <Text style={styles.addChipText}>+ {g.nom || "Groupe"}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}
      </Card>

      {/* Groupes constitués */}
      <Card>
        <View style={styles.cardHeader}>
          <CardTitle>Groupes ({groupes.length})</CardTitle>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalGroupe(true)}>
            <Text style={styles.addBtnText}>+ Créer</Text>
          </TouchableOpacity>
        </View>
        {groupes.length === 0 ? (
          <Text style={styles.empty}>Aucun groupe constitué.</Text>
        ) : (
          groupes.map((g) => (
            <View key={g.id} style={styles.groupeCard}>
              <View style={styles.groupeHeader}>
                <Text style={styles.groupeNom}>{g.nom || "Groupe sans nom"}</Text>
                <View style={styles.groupeActions}>
                  <Text style={styles.groupeTaille}>{g.tailleActuelle}/{g.tailleCible}</Text>
                  <TouchableOpacity onPress={() => handleSupprimerGroupe(g.id)} style={{ marginLeft: 8 }}>
                    <Text style={styles.delText}>Suppr.</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {g.membres?.length === 0 ? (
                <Text style={styles.empty}>Aucun membre.</Text>
              ) : (
                g.membres.map((m) => (
                  <View key={m.utilisateurId} style={styles.membreRow}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{m.prenom?.[0]?.toUpperCase()}</Text></View>
                    <Text style={styles.membreNom}>{m.prenom}</Text>
                    <TouchableOpacity onPress={() => handleRetirer(g.id, m.mamanId)}>
                      <Text style={styles.retirerText}>Retirer</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </Card>

      <Modal visible={modalGroupe} animationType="slide" transparent onRequestClose={() => setModalGroupe(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Créer un groupe</Text>
            <Text style={styles.fieldLabel}>Nom (optionnel)</Text>
            <TextInput style={styles.input} value={nomGroupe} onChangeText={setNomGroupe} placeholder="Ex: Groupe A" placeholderTextColor="#bbb" autoFocus />
            <Btn label={envoi ? "Création..." : "Créer"} onPress={handleCreerGroupe} loading={envoi} />
            <Btn label="Annuler" onPress={() => setModalGroupe(false)} secondary style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  success: { color: "#2d6e4e", fontSize: 13, marginBottom: 8 },
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 13, textAlign: "center", paddingVertical: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  rowLabel: { fontSize: 13, color: "#555" },
  rowVal: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addBtn: { backgroundColor: "#7c3aed", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  mamanItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  mamanNom: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  mamanMeta: { fontSize: 12, color: "#888" },
  addChip: { backgroundColor: "#e8e0fb", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, marginLeft: 6 },
  addChipText: { fontSize: 12, color: "#7c3aed", fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#f0ede8" },
  groupeCard: { borderWidth: 1, borderColor: "#f0ede8", borderRadius: 10, padding: 12, marginBottom: 10 },
  groupeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  groupeNom: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  groupeActions: { flexDirection: "row", alignItems: "center" },
  groupeTaille: { fontSize: 12, color: "#888" },
  delText: { fontSize: 12, color: "#e53e3e" },
  membreRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#c47a3a", alignItems: "center", justifyContent: "center", marginRight: 8 },
  avatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  membreNom: { flex: 1, fontSize: 13, color: "#1a1a1a" },
  retirerText: { fontSize: 12, color: "#e53e3e" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#1a1a1a", marginBottom: 14 },
});
