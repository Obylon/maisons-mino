import { useEffect, useState } from "react";
import { cohorteApi, promPremApi, atelierApi } from "../../services/api";

export default function DashboardCoordinatrice() {
  const [cohortesActives, setCohortesActives] = useState(null);
  const [questionnairesTotal, setQuestionnairesTotal] = useState(null);
  const [ateliersNonPourvus, setAteliersNonPourvus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cohorteApi.lister(),
      promPremApi.listerTout(0, 1000),
      atelierApi.lister(0, 1000),
    ])
      .then(([resCohortes, resQuestionnaires, resAteliers]) => {
        setCohortesActives(resCohortes.data.length);
        setQuestionnairesTotal(resQuestionnaires.data.totalElements);

        const maintenant = new Date();
        const nonPourvus = resAteliers.data.content.filter(
          (a) => !a.professionnelNom && a.dateHeure && new Date(a.dateHeure) >= maintenant
        ).length;
        setAteliersNonPourvus(nonPourvus);
      })
      .catch(() => {
        setCohortesActives(0);
        setQuestionnairesTotal(0);
        setAteliersNonPourvus(0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-subtitle">Vue d'ensemble sur toutes les cohortes et tous les groupes actifs.</p>
      <div className="card-grid">
        <div className="card">
          <p className="card-title">Cohortes</p>
          <p style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
            {loading ? "…" : cohortesActives}
          </p>
        </div>
        <div className="card">
          <p className="card-title">Questionnaires soumis</p>
          <p style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
            {loading ? "…" : questionnairesTotal}
          </p>
        </div>
        <div className="card">
          <p className="card-title">Ateliers à venir sans professionnel</p>
          <p style={{ fontSize: 28, fontWeight: 600, margin: 0, color: ateliersNonPourvus > 0 ? "var(--danger)" : "var(--ink)" }}>
            {loading ? "…" : ateliersNonPourvus}
          </p>
        </div>
      </div>
    </>
  );
}