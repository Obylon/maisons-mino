export default function DashboardCoordinatrice() {
  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-subtitle">Vue d'ensemble sur toutes les cohortes et tous les groupes actifs.</p>
      <div className="card-grid">
        <div className="card"><p className="card-title">Cohortes actives</p><p>—</p></div>
        <div className="card"><p className="card-title">Questionnaires en retard</p><p>—</p></div>
        <div className="card"><p className="card-title">Ateliers non pourvus</p><p>—</p></div>
      </div>
    </>
  );
}
