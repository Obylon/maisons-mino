import { defineConfig, devices } from '@playwright/test';

/**
 * Le backend (Spring Boot, port 8081) doit deja tourner separement avant de
 * lancer les tests - Playwright ne demarre que le frontend (Vite), pas la
 * chaine complete (base de donnees, backend Java) qui serait trop lente/
 * complexe a orchestrer automatiquement ici.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
