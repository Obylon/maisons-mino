/**
 * Identifiants de test lus depuis les variables d'environnement - jamais
 * codes en dur dans le code (bonne pratique, et les mots de passe temporaires
 * generes par l'application changent de toute facon a chaque creation/
 * reinitialisation de compte).
 *
 * Avant de lancer les tests, definir (PowerShell) :
 *   $env:MINO_TEST_COORDINATRICE_EMAIL="joyce@maisonsmino.fr"
 *   $env:MINO_TEST_COORDINATRICE_PASSWORD="mino2026"
 */
export function getCoordinatriceCredentials() {
  const email = process.env.MINO_TEST_COORDINATRICE_EMAIL;
  const motDePasse = process.env.MINO_TEST_COORDINATRICE_PASSWORD;
  if (!email || !motDePasse) {
    throw new Error(
      "Variables d'environnement manquantes : MINO_TEST_COORDINATRICE_EMAIL et " +
      "MINO_TEST_COORDINATRICE_PASSWORD doivent etre definies avant de lancer les tests."
    );
  }
  return { email, motDePasse };
}
