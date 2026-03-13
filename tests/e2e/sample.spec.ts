import { test, expect } from '@playwright/test';

// Login requires Keycloak: Nuxt server must reach KEYCLOAK_INTERNAL_URL (e.g. http://localhost:8080 when running dev locally; http://keycloak:8080 in Docker).
const testUserEmail = 'safwan.yacob@afed.com.my'
const testUserPassword = 'safwan'

test.describe('Nuxt app', () => {
  test('homepage redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('login page has Sign in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').click();
    await page.locator('#email').pressSequentially('invalid@example.com', { delay: 20 });
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('wrongpassword', { delay: 20 });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid|required|failed|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('login with valid credentials redirects to admin', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.click();
    await emailInput.pressSequentially(testUserEmail, { delay: 20 });
    await passwordInput.click();
    await passwordInput.pressSequentially(testUserPassword, { delay: 20 });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/(admin|login)/, { timeout: 30000 }).catch(() => {});
    const url = page.url();
    if (!/\/admin/.test(url)) {
      const errText = await page.locator('.notice, [role="alert"], .error').first().textContent().catch(() => '');
      const bodySnip = await page.locator('main').first().textContent().catch(() => '');
      throw new Error(`Login failed. Current URL: ${url}. Page error/notice: "${errText}". Content: ${(bodySnip ?? '').slice(0, 300)}`);
    }
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.click();
    await emailInput.pressSequentially(testUserEmail, { delay: 20 });
    await passwordInput.click();
    await passwordInput.pressSequentially(testUserPassword, { delay: 20 });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

    await page.getByRole('link', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
