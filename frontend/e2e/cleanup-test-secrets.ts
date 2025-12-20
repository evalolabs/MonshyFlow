/**
 * Manual Cleanup Script for Test Secrets
 * 
 * This script can be run manually to clean up all test secrets created during E2E tests.
 * 
 * Usage:
 *   cd frontend/e2e
 *   pnpm cleanup
 */

import { chromium } from '@playwright/test';
import { cleanupTestSecrets } from './tests/helpers/test-utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🧹 Starting cleanup of test secrets...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Use existing auth state if available
    const authFile = path.join(__dirname, 'playwright', '.auth', 'user.json');
    
    if (existsSync(authFile)) {
      const authState = JSON.parse(readFileSync(authFile, 'utf-8'));
      await page.context().addCookies(authState.cookies || []);
      console.log('✅ Using existing authentication state\n');
    } else {
      console.log('⚠️  No authentication state found. Please login manually.\n');
      await page.goto('http://localhost:5173/login');
      console.log('Please login in the browser window that opened...');
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000 });
    }
    
    // Cleanup all test secret prefixes
    // Note: Only secrets with timestamp pattern will be deleted (e.g., "test-secret-1234567890")
    // This prevents accidental deletion of user-created secrets
    const prefixes = ['test-', 'OPENAI_API_KEY_', 'DEEP_LINK_SECRET_', 'PIPEDRIVE_API_KEY_'];
    console.log(`Cleaning up test secrets with prefixes: ${prefixes.join(', ')}`);
    console.log('⚠️  Only secrets with timestamp pattern (e.g., "prefix_1234567890") will be deleted\n');
    
    await cleanupTestSecrets(page, prefixes);
    
    console.log('\n✅ Cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

