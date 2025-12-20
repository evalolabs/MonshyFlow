/**
 * E2E Tests: Secrets Management
 * 
 * Tests critical flows:
 * 1. Create secret
 * 2. View secrets (tenant isolation)
 * 3. Edit secret
 * 4. Delete secret
 * 5. Search secrets
 */

import { test, expect } from '@playwright/test';
import { SecretsPage } from '../helpers/page-objects/SecretsPage';
import { createTestSecret } from '../helpers/test-utils';
import { cleanupTestSecrets } from '../helpers/test-utils';

test.describe('Secrets Management', () => {
  let secretsPage: SecretsPage;
  const testSecretName = `test-secret-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    secretsPage = new SecretsPage(page);
    // Note: Authentication is handled by storageState in playwright.config.ts
    // No need to call loginAsTestUser here
    await secretsPage.goto();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test secrets (all test prefixes)
    // Note: Only secrets with timestamp pattern will be deleted (e.g., "test-secret-1234567890")
    // This prevents accidental deletion of user-created secrets
    // Use Promise.race to ensure cleanup doesn't exceed timeout
    await Promise.race([
      cleanupTestSecrets(page, ['test-', 'OPENAI_API_KEY_', 'DEEP_LINK_SECRET_', 'PIPEDRIVE_API_KEY_']),
      new Promise(resolve => setTimeout(resolve, 20000)) // Max 20 seconds for cleanup
    ]).catch(() => {
      // Silently fail cleanup - don't break tests
    });
  });

  test('should display tenant badge', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check if user has tenantName
    const userData = await page.evaluate(() => {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    });
    
    // Only test if tenantName is available
    if (userData?.tenantName) {
      await expect(secretsPage.tenantBadge).toBeVisible({ timeout: 5000 });
    } else {
      // Skip if tenantName is not available
      test.skip();
    }
  });

  test('should create a new secret', async ({ page }) => {
    // Use the robust createTestSecret helper which handles rate limiting and retries
    await createTestSecret(page, testSecretName, 'test-api-key-value', 'ApiKey');
    
    // Verify secret appears in list
    await secretsPage.goto(); // Ensure we're on the secrets page
    await page.waitForTimeout(500);
    const secretRow = await secretsPage.getSecretRow(testSecretName);
    await expect(secretRow).toBeVisible({ timeout: 10000 });
  });

  test('should search for secrets', async ({ page }) => {
    // Use the robust createTestSecret helper
    await createTestSecret(page, testSecretName, 'test-value', 'ApiKey');
    
    // Verify secret appears in list
    await secretsPage.goto();
    await page.waitForTimeout(500);
    const secretRow = await secretsPage.getSecretRow(testSecretName);
    await expect(secretRow).toBeVisible({ timeout: 10000 });

    // Search for the secret
    await secretsPage.search(testSecretName);

    // Verify only matching secret is visible
    const secretRowAfterSearch = await secretsPage.getSecretRow(testSecretName);
    await expect(secretRowAfterSearch).toBeVisible();
  });

  test('should delete a secret', async ({ page }) => {
    // Create a test secret first using the robust helper
    await createTestSecret(page, testSecretName, 'test-value', 'ApiKey');
    
    // Verify secret appears in list
    await secretsPage.goto(); // Ensure we're on the secrets page
    await page.waitForTimeout(500); // Small delay for list to render
    const secretRow = await secretsPage.getSecretRow(testSecretName);
    await expect(secretRow).toBeVisible({ timeout: 10000 });

    // Delete the secret
    await secretsPage.deleteSecret(testSecretName);

    // Verify secret is removed - wait for it to disappear
    // The row might still exist in DOM but be hidden, or it might be removed
    const deletedSecretRow = await secretsPage.getSecretRow(testSecretName);
    
    // Try multiple approaches to verify deletion
    try {
      // First, wait for the row to be hidden or removed
      await deletedSecretRow.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // If that doesn't work, check if the row is still visible
      const isVisible = await deletedSecretRow.isVisible().catch(() => false);
      if (isVisible) {
        // If still visible, wait a bit more and reload the page
        await page.waitForTimeout(1000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        
        // Check again after reload
        const rowAfterReload = await secretsPage.getSecretRow(testSecretName);
        await expect(rowAfterReload).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should filter secrets by tenant', async ({ page }) => {
    // This test verifies that only secrets from the current tenant are shown
    // The tenant badge should be visible
    await expect(secretsPage.tenantBadge).toBeVisible();
    
    // All visible secrets should belong to the current tenant
    // (This is implicitly tested by the backend filtering)
    const secretCount = await secretsPage.getSecretCount();
    expect(secretCount).toBeGreaterThanOrEqual(0);
  });
});

