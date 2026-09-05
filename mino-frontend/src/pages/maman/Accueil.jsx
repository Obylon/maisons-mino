import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { atelierApi, groupeApi, mamanApi, messageApi } from "../../services/api";
import { useNotificationContext } from "../../context/NotificationContext";

export default function MamanAccueil() {
  const { user } = useAuth();
  const [prochainAtelier, setProchainAtelier] = useState(null);
  const [parcours, setParcours] = useState(null);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const [loading, setLoading] = useState(true);
  const { signal } = useNotificationContext();

  useEffect(() => {
    mamanApi.monParcours().then((res) => setParcours(res.data)).catch(() => setParcours(null));

    atelierApi
      .monCalendrier()
      .then((res) => {
        const maintenant = new Date();
        const prochains = res.data
          .filter((a) => a.dateHeure && new Date(a.dateHeure) >= maintenant)
          .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
        setProchainAtelier(prochains[0] ?? null);
      })
      .catch(() => setProchainAtelier(null));

    // Vrai compteur de non-lus, remis a jour automatiquement des qu'une notification
    // temps reel arrive (voir compteur dans les dependances ci-dessous).
    groupeApi
      .monGroupe()
      .then((res) => messageApi.nonLusGroupe(res.data.id))
      .then((res) => setMessagesNonLus(res.data))
      .catch(() => setMessagesNonLus(0))
      .finally(() => setLoading(false));
  }, [signal]);

  return (
    <>
      <h1 className="page-title">Bonjour {user.prenom} 👋</h1>
      <p className="page-subtitle">Voici où vous en êtes dans votre parcours.</p>

      <div className="card-grid">
        <div className="card">
          <p className="card-title">Mon parcours</p>
          {!parcours ? (
            <p>Chargement...</p>
          ) : parcours.ageBebeJours !== null ? (
            <p>{parcours.ageBebeJours} jour{parcours.ageBebeJours > 1 ? "s" : ""} de bébé</p>
          ) : parcours.semaineGrossesse !== null ? (
            <p>{parcours.semaineGrossesse} semaines de grossesse</p>
          ) : (
            <p>Terme de grossesse non renseigné.</p>
          )}
        </div>
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
            <p>Aucun atelier à venir pour l'instant.</p>
          )}
        </div>
        <div className="card">
          <p className="card-title">Messages du groupe</p>
          <p>{loading ? "Chargement..." : messagesNonLus > 0 ? `${messagesNonLus} nouveau${messagesNonLus > 1 ? "x" : ""} message${messagesNonLus > 1 ? "s" : ""}` : "Aucun nouveau message."}</p>
        </div>
      </div>
    </>
  );
}
