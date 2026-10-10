import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import Screen from "../../components/Screen";
import { Card } from "../../components/Card";
import { atelierApi } from "../../services/api";

const labelType = (type) => ({
  MENSUEL_STANDARD: "Atelier mensuel",
  P1_GROSSESSE_PARTENAIRE: "Atelier P1",
  P2_POSTPARTUM_PARTENAIRE: "Atelier P2",
  SEANCE_INDIVIDUELLE_S0: "Séance individuelle S0",
})[type] || type;

export default function PlanningScreen() {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    atelierApi.mesAteliers()
      .then((res) => {
        const tries = [...res.data].sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
        setAteliers(tries);
      })
      .catch(() => setError("Impossible de charger votre planning."))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const maintenant = new Date();

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      <Text style={s.titre}>Mon planning</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!loading && ateliers.length === 0 && <Text style={s.vide}>Aucun atelier assigné.</Text>}
      {ateliers.map((a) => {
        const date = a.dateHeure ? new Date(a.dateHeure) : null;
        const passe = date && date < maintenant;
        return (
          <Card key={a.id} style={passe && { opacity: 0.5 }}>
            <Text style={s.atelierTitre}>{a.titre || labelType(a.type)}</Text>
            <Text style={s.meta}>
              {date ? date.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }) : "Date non fixée"}
              {a.dureeMinutes ? ` · ${a.dureeMinutes} min` : ""}
            </Text>
            {a.groupeNom ? <Text style={s.meta}>Groupe : {a.groupeNom}</Text> : null}
            {passe && <Text style={s.passe}>Passé</Text>}
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
  passe: { fontSize: 11, color: "#9ca3af", marginTop: 4, fontStyle: "italic" },
});
