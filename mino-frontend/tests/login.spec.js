import { test, expect } from '@playwright/test';
import { getCoordinatriceCredentials } from './credentials';

// .serial : ces tests partagent le meme compte coordinatrice de test - les
// executer en parallele (comportement par defaut de Playwright) peut creer
// des interferences difficiles a diagnostiquer. Les executer l'un apres
// l'autre elimine cette source de flakiness.
test.describe.serial('Connexion', () => {
  test('connexion reussie redirige vers le tableau de bord coordinatrice', async ({ page }) => {
    const { email, motDePasse } = getCoordinatriceCredentials();

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mot de passe').fill(motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL('/coordinatrice');
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('mauvais mot de passe affiche un message d\'erreur clair', async ({ page }) => {
    const { email } = getCoordinatriceCredentials();

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mot de passe').fill('mot-de-passe-volontairement-faux');

    // On attend la vraie reponse reseau du login plutot que de deviner un
    // delai - a la fois plus fiable ET plus utile pour diagnostiquer :
    // si le statut n'est pas 401, l'assertion ci-dessous le dira clairement.
    const reponseLoginPromise = page.waitForResponse((res) => res.url().includes('/api/auth/login'));
    await page.getByRole('button', { name: 'Se connecter' }).click();
    const reponseLogin = await reponseLoginPromise;

    expect(reponseLogin.status()).toBe(401);
    await expect(page.locator('.error-text')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('le lien mot de passe oublie affiche le formulaire dedie', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Mot de passe oublié ?' }).click();

    await expect(page.getByText('Mot de passe oublié')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Envoyer' })).toBeVisible();
  });
});