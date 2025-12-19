/**
 * Global Setup for E2E Tests
 * 
 * This runs once before all tests and creates a shared authentication state.
 * This prevents rate limiting issues by logging in only once.
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  // Check if authentication state already exists
  const authDir = path.join(__dirname, '..', 'playwright', '.auth');
  const authFile = path.join(authDir, 'user.json');
  
  try {
    const fs = await import('fs');
    if (fs.existsSync(authFile)) {
      console.log('✅ Using existing authentication state');
      return;
    }
  } catch {
    // File doesn't exist, continue with login
  }
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Login with test user
      await page.goto('http://localhost:5173/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      await page.fill('input[type="email"]', 'admin@acme.com');
      await page.fill('input[type="password"]', 'admin123');
      
      // Click submit and wait for response
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }).catch(() => null),
        page.click('button[type="submit"]')
      ]);
      
      // Check response status
      if (response) {
        const status = response.status();
        if (status === 429) {
          // Rate limited - wait and retry
          retryCount++;
          const retryAfter = response.headers()['retry-after'] || '60';
          const waitTime = parseInt(retryAfter, 10) * 1000;
          console.log(`⚠️ Rate limited (429). Waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}...`);
          await page.waitForTimeout(Math.min(waitTime, 60000)); // Max 60 seconds
          continue;
        }
        if (status !== 200 && status !== 201) {
          const responseBody = await response.json().catch(() => ({}));
          throw new Error(`Login failed with status ${status}: ${responseBody.error || responseBody.message || 'Unknown error'}`);
        }
      }
      
      // Wait for navigation after login
      try {
        await page.waitForURL(url => url.pathname !== '/login', { timeout: 10000 });
      } catch (error) {
        // If navigation didn't happen, check for error message
        await page.waitForTimeout(1000);
        
        const errorMessage = await page.locator('.text-red-600, .error, [role="alert"], .text-red-700').first().textContent().catch(() => null);
        
        if (errorMessage) {
          if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
            retryCount++;
            console.log(`⚠️ Rate limited. Retrying ${retryCount}/${maxRetries}...`);
            await page.waitForTimeout(60000); // Wait 60 seconds
            continue;
          }
          throw new Error(`Login failed: ${errorMessage}`);
        }
        
        // If no error message, check if we're still on login page
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          throw new Error('Login failed: Still on login page after 10 seconds');
        }
      }
      
      // Success - break out of retry loop
      break;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`⚠️ Rate limited. Retrying ${retryCount}/${maxRetries}...`);
          await page.waitForTimeout(60000); // Wait 60 seconds
          continue;
        }
      }
      throw error;
    }
  }
  
  try {
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {
      // Ignore if timeout, page might still be usable
    });
    
    // Save authentication state (authDir already defined above)
    await page.context().storageState({ path: authFile });
    
    console.log('✅ Global setup: Authentication state saved');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

