import EvaluationsSynthese from "../../components/EvaluationsSynthese";

export default function EvaluationsCoordinatrice() {
  return (
    <>
      <h1 className="page-title">Évaluations</h1>
      <p className="page-subtitle">
        Avis des mamans sur les ateliers et sur les soignants — anonymes, recueillis
        après chaque atelier.
      </p>
      <EvaluationsSynthese parProfessionnel />
    </>
  );
}
