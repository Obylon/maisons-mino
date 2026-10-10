import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import Screen from "../../components/Screen";
import { Card } from "../../components/Card";
import { atelierApi } from "../../services/api";

const labelType = (type) => ({
  P1_GROSSESSE_PARTENAIRE: "Atelier P1 — Grossesse (partenaire)",
  P2_POSTPARTUM_PARTENAIRE: "Atelier P2 — Post-partum (partenaire)",
})[type] || type;

export default function AteliersScreen() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    atelierApi.ateliersP1P2()
      .then((res) => setAteliers(res.data))
      .catch(() => setError("Impossible de charger les ateliers."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Text style={s.titre}>Ateliers P1 / P2</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!loading && ateliers.length === 0 && <Text style={s.vide}>Aucun atelier disponible.</Text>}
      {ateliers.map((a) => {
        const date = a.dateHeure ? new Date(a.dateHeure) : null;
        return (
          <Card key={a.id}>
            <Text style={s.atelierTitre}>{a.titre || labelType(a.type)}</Text>
            <Text style={s.meta}>
              {date ? date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "Date non fixée"}
            </Text>
            {a.professionnelNom ? <Text style={s.meta}>Intervenant : {a.professionnelNom}</Text> : null}
            {a.lieuAdresse ? <Text style={s.meta}>Lieu : {a.lieuAdresse}</Text> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  titre: { fontSize: 20, fontWeight: "700", color: "#1e3a5f", marginBottom: 16 },
  atelierTitre: { fontSize: 16, fontWeight: "600", color: "#1e3a5f", marginBottom: 4 },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  error: { color: "#dc2626", marginBottom: 12 },
  vide: { color: "#6b7280", textAlign: "center", marginTop: 40 },
});
