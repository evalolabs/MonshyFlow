/**
 * Secrets Page Object Model
 * 
 * Best Practice: Encapsulate page interactions in a class
 * This makes tests more maintainable and readable
 */

import { Page, Locator } from '@playwright/test';

export class SecretsPage {
  readonly page: Page;
  readonly newSecretButton: Locator;
  readonly searchInput: Locator;
  readonly secretsTable: Locator;
  readonly tenantBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newSecretButton = page.getByRole('button', { name: /new secret/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.secretsTable = page.locator('table tbody');
    // Tenant badge: Look for the badge containing "Tenant:" text
    // The badge structure: <div class="mb-4"><span class="px-3 py-1.5...">🏢 Tenant: {name}</span></div>
    // Use a more specific selector that matches only the badge span (not the helper text)
    // The badge has specific classes: "px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700"
    this.tenantBadge = page.locator('div.mb-4 span.bg-blue-50:has-text("Tenant:")').first();
  }

  async goto() {
    await this.page.goto('/admin/secrets');
    // Wait for the page to load - use domcontentloaded as fallback if networkidle times out
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Fallback to domcontentloaded if networkidle times out
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    }
    // Wait for the secrets table or at least the page header to be visible
    await this.page.waitForSelector('table, [class*="PageHeader"], h1', { timeout: 5000 }).catch(() => {
      // If selector not found, continue anyway
    });
  }

  async clickNewSecret() {
    await this.newSecretButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(300); // Wait for debounce
  }

  async getSecretRow(secretName: string): Promise<Locator> {
    return this.secretsTable.locator(`tr:has-text("${secretName}")`);
  }

  async isSecretVisible(secretName: string): Promise<boolean> {
    const row = await this.getSecretRow(secretName);
    return await row.isVisible();
  }

  async deleteSecret(secretName: string) {
    const row = await this.getSecretRow(secretName);
    // Delete button is an icon button (Trash2), find it by locating the button with the trash icon
    const deleteButton = row.locator('button').filter({ has: this.page.locator('svg.lucide-trash-2') }).first();
    
    // Handle browser confirm dialog BEFORE clicking
    // Note: We can't use expect() here as it's not available in Page Objects
    this.page.once('dialog', async dialog => {
      // Just accept the dialog - the test will verify deletion separately
      await dialog.accept();
    });
    
    // Wait for DELETE API response
    const [response] = await Promise.all([
      this.page.waitForResponse(resp => {
        const method = resp.request().method();
        const url = resp.url();
        const status = resp.status();
        return method === 'DELETE' && 
               (url.includes('/api/secrets/') || url.includes('/secrets/')) && 
               (status === 204 || status === 200);
      }, { timeout: 10000 }).catch(() => null),
      deleteButton.click()
    ]);
    
    if (response && (response.status() === 204 || response.status() === 200)) {
      // Wait for the row to disappear from the DOM
      await row.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
        // If row doesn't disappear, wait a bit more and check again
      });
      // Give the UI time to update
      await this.page.waitForTimeout(500);
    } else {
      // If no response or error, wait a bit anyway
      await this.page.waitForTimeout(1000);
    }
  }

  async getSecretCount(): Promise<number> {
    const rows = this.secretsTable.locator('tr');
    return await rows.count();
  }

  async hasTenantBadge(): Promise<boolean> {
    return await this.tenantBadge.isVisible();
  }
}

