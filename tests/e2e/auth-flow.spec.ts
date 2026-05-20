import { expect, test } from "@playwright/test";

const typeCode = async (page: import('@playwright/test').Page, digits: string) => {
  for (const digit of digits) {
    await page.locator(`[data-num="${digit}"]`).click();
  }
};

test.describe('Auth flow', () => {
  test('Chana logs in with team code', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Chana/i }).click();

    await expect(page).toHaveURL(/\/code/);
    await expect(page.getByText('Salut Chana')).toBeVisible();

    await typeCode(page, '4729');

    await expect(page.getByText('Bienvenue Chana')).toBeVisible();
    await page.waitForURL(/\/dashboard/);
  });

  test('Alpha logs in with admin code', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Je suis le responsable/i }).click();
    await expect(page.getByText('Console admin')).toBeVisible();

    await typeCode(page, '9182');
    await expect(page.getByText('Console admin ouverte')).toBeVisible();
    await page.waitForURL(/\/admin/);
  });

  test('Wrong code shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Chana/i }).click();

    await typeCode(page, '0000');
    await expect(page.getByText('Mauvais code')).toBeVisible();
  });
});
