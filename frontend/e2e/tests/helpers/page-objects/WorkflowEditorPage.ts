/**
 * Workflow Editor Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class WorkflowEditorPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly configPanel: Locator;
  readonly nodeInfoOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('.react-flow');
    this.configPanel = page.locator('[data-testid="node-config-panel"]');
    this.nodeInfoOverlay = page.locator('[data-testid="node-info-overlay"]');
  }

  async goto(workflowId?: string) {
    const url = workflowId ? `/workflow/${workflowId}` : '/';
    await this.page.goto(url);
    
    // Wait for the page to load - use domcontentloaded as fallback if networkidle times out
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Fallback to domcontentloaded if networkidle times out
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    }
    
    if (workflowId) {
      // Wait for the canvas to be visible
      await this.canvas.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        // If canvas not found, continue anyway
      });
    } else {
      // On home page, wait for workflow-related content
      await this.page.waitForSelector('text=/workflow/i, .react-flow, [class*="workflow"]', { timeout: 10000 }).catch(() => {
        // If selector not found, continue anyway
      });
    }
  }

  async clickNode(nodeId: string) {
    const node = this.canvas.locator(`[data-id="${nodeId}"]`);
    await node.click();
  }

  async openNodeConfig(nodeId: string) {
    await this.clickNode(nodeId);
    await this.page.waitForTimeout(500); // Wait for config panel to open
  }

  async selectSecretInConfig(secretName: string) {
    const secretSelector = this.configPanel.locator('select').first();
    await secretSelector.selectOption(secretName);
  }

  async getValidationErrors(): Promise<string[]> {
    const errorElements = this.configPanel.locator('.text-red-700');
    const count = await errorElements.count();
    const errors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent();
      if (text) errors.push(text);
    }
    
    return errors;
  }

  async clickCreateSecretLink(secretKey: string) {
    const link = this.configPanel.locator(`a:has-text("Secret anlegen")`);
    await link.click();
  }

  async waitForNodeInfoOverlay() {
    await this.nodeInfoOverlay.waitFor({ state: 'visible', timeout: 5000 });
  }
}

