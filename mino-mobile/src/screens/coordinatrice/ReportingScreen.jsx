import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../../components/Screen";
import { Card, CardTitle } from "../../components/Card";
import { StatCard } from "../../components/Card";
import { cohorteApi, groupeApi, adminApi, atelierApi, promPremApi } from "../../services/api";

function BarChart({ data, labelKey, valueKey, color = "#2d6e4e" }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <View style={{ gap: 8 }}>
      {data.map((d) => (
        <View key={d[labelKey]} style={styles.barRow}>
          <Text style={styles.barLabel}>{d[labelKey]}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(d[valueKey] / max) * 100}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.barValue}>{d[valueKey]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ReportingScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = () => {
    setLoading(true);
    Promise.all([
      cohorteApi.lister(),
      groupeApi.lister(),
      adminApi.listerUtilisateurs(0, 1000),
      atelierApi.lister(0, 1000),
      promPremApi.listerTout(0, 1000),
    ])
      .then(([resC, resG, resU, resA, resQ]) => {
        const cohortes = resC.data;
        const groupes = resG.data;
        const utilisateurs = resU.data.content;
        const ateliers = resA.data.content;
        const questionnaires = resQ.data.content;

        const actifs = utilisateurs.filter((u) => u.actif);
        const parRole = ["MAMAN", "PARTENAIRE", "PROFESSIONNEL", "COORDINATRICE"].map((role) => ({
          role,
          nombre: actifs.filter((u) => u.role === role).length,
        }));

        const typesAtelier = [...new Set(ateliers.map((a) => a.type))];
        const parTypeAtelier = typesAtelier.map((type) => ({
          type: type.replace("_", " ").substring(0, 20),
          nombre: ateliers.filter((a) => a.type === type).length,
        }));

        const phases = ["T0", "T1", "T2", "T3", "T4"];
        const parPhase = phases.map((phase) => ({
          phase,
          nombre: questionnaires.filter((q) => q.phase === phase).length,
        }));

        setStats({
          totalCohortes: cohortes.length,
          totalGroupes: groupes.length,
          tailleMoyenneGroupe: groupes.length
            ? (groupes.reduce((s, g) => s + g.tailleActuelle, 0) / groupes.length).toFixed(1)
            : 0,
          totalActifs: actifs.length,
          totalInactifs: utilisateurs.length - actifs.length,
          totalAteliers: ateliers.length,
          totalQuestionnaires: questionnaires.length,
          totalProm: questionnaires.filter((q) => q.type === "PROM").length,
          totalPrem: questionnaires.filter((q) => q.type === "PREM").length,
          parRole,
          parTypeAtelier,
          parPhase,
        });
      })
      .catch(() => setError("Impossible de charger les statistiques pour le moment."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  return (
    <Screen onRefresh={charger} refreshing={loading}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {stats && (
        <>
          <View style={styles.statGrid}>
            <StatCard label="Cohortes" value={stats.totalCohortes} />
            <StatCard label="Groupes" value={stats.totalGroupes} />
            <StatCard label="Taille moy." value={stats.tailleMoyenneGroupe} />
            <StatCard label="Actifs" value={stats.totalActifs} />
            <StatCard label="Ateliers" value={stats.totalAteliers} />
            <StatCard label="Questionnaires" value={stats.totalQuestionnaires} />
          </View>

          <Card>
            <CardTitle>Utilisateurs actifs par rôle</CardTitle>
            <BarChart data={stats.parRole} labelKey="role" valueKey="nombre" color="#7c3aed" />
            {stats.totalInactifs > 0 && (
              <Text style={styles.inactive}>+ {stats.totalInactifs} compte{stats.totalInactifs > 1 ? "s" : ""} désactivé{stats.totalInactifs > 1 ? "s" : ""}</Text>
            )}
          </Card>

          <Card>
            <CardTitle>Ateliers par type</CardTitle>
            {stats.parTypeAtelier.length === 0 ? (
              <Text style={styles.empty}>Aucun atelier créé pour l'instant.</Text>
            ) : (
              <BarChart data={stats.parTypeAtelier} labelKey="type" valueKey="nombre" color="#c47a3a" />
            )}
          </Card>

          <Card>
            <CardTitle>PROM/PREM par phase</CardTitle>
            <Text style={styles.subtitle}>{stats.totalProm} PROM · {stats.totalPrem} PREM</Text>
            {stats.totalQuestionnaires === 0 ? (
              <Text style={styles.empty}>Aucun questionnaire soumis pour l'instant.</Text>
            ) : (
              <BarChart data={stats.parPhase} labelKey="phase" valueKey="nombre" color="#059669" />
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: "#e53e3e", fontSize: 13, marginBottom: 8 },
  empty: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 8 },
  subtitle: { fontSize: 12, color: "#888", marginBottom: 10 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  inactive: { fontSize: 12, color: "#888", marginTop: 10 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 100, fontSize: 11, color: "#555" },
  barTrack: { flex: 1, height: 14, backgroundColor: "#f0ede8", borderRadius: 7, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 7 },
  barValue: { width: 24, fontSize: 11, color: "#555", textAlign: "right" },
});
