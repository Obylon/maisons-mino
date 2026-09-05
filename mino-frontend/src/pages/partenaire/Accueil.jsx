import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { atelierApi } from "../../services/api";

export default function PartenaireAccueil() {
  const { user } = useAuth();
  const [prochainAtelier, setProchainAtelier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    atelierApi
      .ateliersP1P2()
      .then((res) => {
        const maintenant = new Date();
        const prochains = res.data
          .filter((a) => a.dateHeure && new Date(a.dateHeure) >= maintenant)
          .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
        setProchainAtelier(prochains[0] ?? null);
      })
      .catch(() => setProchainAtelier(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Bonjour {user.prenom} 👋</h1>
      <p className="page-subtitle">
        Votre espace est indépendant de celui de votre conjointe — vous n'avez pas accès
        à son groupe ni à ses questionnaires, pour préserver son espace de parole libre.
      </p>
      <div className="card">
        <p className="card-title">Prochain atelier</p>
        {loading ? (
          <p>Chargement...</p>
        ) : prochainAtelier ? (
          <p>
            <strong>{prochainAtelier.titre || prochainAtelier.type}</strong>
            <br />
            {new Date(prochainAtelier.dateHeure).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        ) : (
          <p>Aucun atelier P1/P2 à venir pour l'instant.</p>
        )}
      </div>
    </>
  );
}
