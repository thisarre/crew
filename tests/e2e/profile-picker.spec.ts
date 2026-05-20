import { expect, test } from "@playwright/test";

const memberNames = ["Chana", "Isaac", "Chrisciana", "Dave", "Stéphanie", "Gloria"];

test.describe('Profile Picker', () => {
  test('lists all members and admin entry point', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Qui es-tu ?' })).toBeVisible();

    for (const name of memberNames) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'Je suis le responsable' })).toBeVisible();
  });
});
