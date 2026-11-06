import { expect, test, type Page } from '@playwright/test';

/**
 * Régression : aucune erreur d'hydratation React ne doit apparaître au chargement des écrans.
 *
 * Chaque écran est chargé par une navigation complète (page.goto) pour forcer le rendu serveur
 * puis l'hydratation côté client, et tout message console lié à l'hydratation fait échouer le test.
 */

const MOTIFS_HYDRATATION =
  /hydrat|Expected server HTML|did not match|Text content does not match|rendered on the server/i;

const collecterErreursHydratation = (page: Page): string[] => {
  const erreurs: string[] = [];
  page.on('console', message => {
    if (MOTIFS_HYDRATATION.test(message.text())) {
      erreurs.push(`[console.${message.type()}] ${message.text()}`);
    }
  });
  page.on('pageerror', error => {
    if (MOTIFS_HYDRATATION.test(String(error))) {
      erreurs.push(`[pageerror] ${String(error)}`);
    }
  });
  return erreurs;
};

const typeCode = async (page: Page, digits: string) => {
  for (const digit of digits) {
    await page.locator(`[data-num="${digit}"]`).click();
  }
};

/** Laisse le temps à React de terminer l'hydratation et de journaliser une éventuelle erreur. */
const attendreHydratation = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
};

test.describe("Hydratation React", () => {
  test("écrans de connexion : / et /code", async ({ page }) => {
    const erreurs = collecterErreursHydratation(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Qui es-tu ?' })).toBeVisible();
    await attendreHydratation(page);

    await page.getByRole('button', { name: /Chana/i }).click();
    await expect(page).toHaveURL(/\/code\?/);

    // Rechargement complet de /code?profile_id=… pour passer par le rendu serveur.
    await page.goto(page.url());
    await expect(page.getByText('Salut Chana')).toBeVisible();
    await attendreHydratation(page);

    expect(erreurs, erreurs.join('\n')).toEqual([]);
  });

  test("espace membre : /dashboard", async ({ page }) => {
    const erreurs = collecterErreursHydratation(page);

    await page.goto('/');
    await page.getByRole('button', { name: /Chana/i }).click();
    await typeCode(page, '4729');
    await page.waitForURL(/\/dashboard/);

    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await attendreHydratation(page);

    expect(erreurs, erreurs.join('\n')).toEqual([]);
  });

  test("console admin : /admin", async ({ page }) => {
    const erreurs = collecterErreursHydratation(page);

    await page.goto('/');
    await page.getByRole('button', { name: /Je suis le responsable/i }).click();
    await typeCode(page, '9182');
    await page.waitForURL(/\/admin/);

    await page.goto('/admin');
    await attendreHydratation(page);

    expect(erreurs, erreurs.join('\n')).toEqual([]);
  });

  test("un service worker résiduel est désenregistré et ses caches vidés hors production", async ({ page }) => {
    const erreurs = collecterErreursHydratation(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Qui es-tu ?' })).toBeVisible();

    // Simule un service worker laissé par une session de production sur la même origine.
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    });

    // La page suivante est contrôlée par le service worker : l'app doit le désenregistrer, vider
    // ses caches et recharger une fois. Les évaluations peuvent tomber pendant ce rechargement
    // automatique (contexte détruit) : on renvoie alors une valeur provisoire et on réessaie.
    await page.reload();
    await expect
      .poll(
        () =>
          page
            .evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)
            .catch(() => -1),
        { timeout: 10_000 },
      )
      .toBe(0);
    await expect
      .poll(
        () =>
          page
            .evaluate(async () => (await caches.keys()).filter(key => key.startsWith('crew-')))
            .catch(() => ['contexte détruit, nouvel essai']),
        { timeout: 10_000 },
      )
      .toEqual([]);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Qui es-tu ?' })).toBeVisible();
    await attendreHydratation(page);
    expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
    expect(erreurs, erreurs.join('\n')).toEqual([]);
  });
});
