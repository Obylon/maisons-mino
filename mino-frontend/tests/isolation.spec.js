import { test, expect } from '@playwright/test';
import { getCoordinatriceCredentials } from './credentials';

test.describe('Isolation par role (ProtectedRoute)', () => {
  test('un visiteur non connecte est redirige vers /login', async ({ page }) => {
    await page.goto('/coordinatrice/utilisateurs');
    await expect(page).toHaveURL('/login');
  });

  test('une coordinatrice ne peut pas acceder a l\'espace maman', async ({ page }) => {
    const { email, motDePasse } = getCoordinatriceCredentials();

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mot de passe').fill(motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL('/coordinatrice');

    // Tentative d'acces direct a une route reservee a un autre role
    await page.goto('/maman');
    await expect(page).not.toHaveURL('/maman');
  });
});
