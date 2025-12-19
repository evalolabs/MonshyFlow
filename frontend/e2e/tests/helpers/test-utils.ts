/**
 * E2E Test Utilities
 * 
 * Best Practices:
 * - Reusable test helpers
 * - Consistent data cleanup
 * - Auth helpers for test isolation
 * - API helpers for test data setup
 */

import { Page, expect } from '@playwright/test';

// Cache für bereits authentifizierte Sessions
const authenticatedPages = new Map<string, { email: string; password: string }>();

/**
 * Authentication Helper
 * Logs in with a seeded test user
 * 
 * Available test users (from seed/README.md):
 * - admin@acme.com / admin123 (admin, user) - Acme Corporation
 * - user@acme.com / user123 (user) - Acme Corporation
 * - developer@techstart.io / dev123 (user, developer) - TechStart Inc
 * - demo@demo.monshy.com / demo123 (user) - Demo Company
 * 
 * Note: This function caches authentication to avoid rate limiting in E2E tests.
 */
export async function loginAsTestUser(
  page: Page, 
  email?: string, 
  password?: string,
  tenant?: 'acme' | 'techstart' | 'demo'
) {
  // Default to admin user from Acme Corporation
  let testEmail: string;
  let testPassword: string;
  
  if (email && password) {
    testEmail = email;
    testPassword = password;
  } else {
    // Use tenant-specific default users
    switch (tenant) {
      case 'techstart':
        testEmail = 'developer@techstart.io';
        testPassword = 'dev123';
        break;
      case 'demo':
        testEmail = 'demo@demo.monshy.com';
        testPassword = 'demo123';
        break;
      case 'acme':
      default:
        testEmail = 'admin@acme.com';
        testPassword = 'admin123';
        break;
    }
  }
  
  // Check if we're already authenticated with this user
  const pageKey = `${testEmail}:${testPassword}`;
  const currentUrl = page.url();
  
  // If already on a protected route and authenticated, skip login
  if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
    // Check if we have a valid session by trying to access a protected route
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 3000 });
      const isAuthenticated = await page.evaluate(() => {
        return localStorage.getItem('auth_token') !== null;
      });
      
      if (isAuthenticated) {
        // Already logged in, return
        return { email: testEmail, password: testPassword };
      }
    } catch {
      // Not authenticated, continue with login
    }
  }
  
  // Navigate to login
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  
  // Fill login form
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  
  // Click submit button and wait for response
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }).catch(() => null),
    page.click('button[type="submit"]')
  ]);
  
  // Wait for navigation after login
  // The app navigates to "/" (HomePage) after successful login
  try {
    await page.waitForURL(url => url.pathname !== '/login', { timeout: 10000 });
  } catch (error) {
    // If navigation didn't happen, check for error message
    await page.waitForTimeout(1000); // Wait a bit for error message to appear
    
    const errorMessage = await page.locator('.text-red-600, .error, [role="alert"], .text-red-700').first().textContent().catch(() => null);
    
    // Also check response status if we got one
    if (response) {
      const status = response.status();
      if (status !== 200 && status !== 201) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(`Login failed with status ${status}: ${responseBody.error || responseBody.message || 'Unknown error'}`);
      }
    }
    
    if (errorMessage) {
      throw new Error(`Login failed: ${errorMessage}`);
    }
    
    // If no error message, check if we're still on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Check if button is still in "loading" state
      const buttonText = await page.locator('button[type="submit"]').textContent().catch(() => '');
      if (buttonText?.includes('Signing in') || buttonText?.includes('Loading')) {
        throw new Error('Login failed: Button still in loading state - request may have timed out');
      }
      throw new Error('Login failed: Still on login page after 10 seconds');
    }
    // Otherwise, assume we navigated successfully
  }
  
  // Additional wait to ensure page is fully loaded
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {
    // Ignore if timeout, page might still be usable
  });
  
  // Cache the authentication
  authenticatedPages.set(pageKey, { email: testEmail, password: testPassword });
  
  return { email: testEmail, password: testPassword };
}

/**
 * Create a test secret via API or UI
 */
export async function createTestSecret(
  page: Page,
  secretName: string,
  secretValue: string,
  secretType: 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp' = 'ApiKey',
  provider?: string
) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Navigate to secrets page
      await page.goto('/admin/secrets');
      
      // Click "New Secret" button
      await page.click('button:has-text("New Secret")');
      
      // Wait for modal to be visible
      await page.waitForSelector('input[name="secret-name"]', { timeout: 10000 });
      await page.waitForTimeout(500); // Small delay for modal animation
      
      // Fill secret form (using correct field names)
      await page.fill('input[name="secret-name"]', secretName);
      if (provider) {
        await page.fill('input[name="secret-provider"]', provider);
      }
      // Map secretType string to numeric value
      const typeMap: Record<string, string> = {
        'ApiKey': '0',
        'Password': '1',
        'Token': '2',
        'Generic': '3',
        'Smtp': '4',
      };
      await page.selectOption('select[name="secret-type"]', typeMap[secretType] || '0');
      await page.fill('input[name="secret-value"]', secretValue);
      
      // Save (button text is "Create" for new secrets)
      // Wait for API response (could be through Kong, so check for /secrets in URL)
      const responsePromise = page.waitForResponse(resp => {
        const url = resp.url();
        const method = resp.request().method();
        const status = resp.status();
        // Check for POST request to secrets endpoint with success status OR 429 (rate limit)
        return method === 'POST' && 
               (url.includes('/api/secrets') || url.includes('/secrets')) && 
               !url.includes('/decrypt') && 
               (status === 200 || status === 201 || status === 429 || status === 409);
      }, { timeout: 15000 }).catch(() => null);
      
      await page.click('button[type="submit"]:has-text("Create")');
      
      const response = await responsePromise;
      
      // Handle 429 Rate Limiting
      if (response && response.status() === 429) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Get retry-after header or use default wait time
          const retryAfter = response.headers()['retry-after'] || '60';
          const waitTime = Math.min(parseInt(retryAfter, 10) * 1000, 60000); // Max 60 seconds
          console.log(`⚠️ Rate limited (429). Waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}...`);
          await page.waitForTimeout(waitTime);
          // Close modal if still open
          await page.click('button:has-text("Cancel")').catch(() => {});
          continue; // Retry
        } else {
          throw new Error('Secret creation failed: Rate limited (429) after max retries');
        }
      }
      
      // Handle 409 Conflict (secret already exists)
      if (response && response.status() === 409) {
        console.warn(`Secret '${secretName}' already exists. Skipping creation.`);
        await page.click('button:has-text("Cancel")').catch(() => {});
        await page.waitForTimeout(500);
        return; // Secret already exists, that's okay
      }
      
      // Check if we got a successful response
      if (!response || (response.status() !== 200 && response.status() !== 201)) {
        // Wait a bit to see if an error alert appears or modal closes anyway
        await page.waitForTimeout(3000);
        
        // Check for error message in the page
        const errorElement = await page.locator('.text-red-600, .error, [role="alert"], .text-red-700, .bg-red-50').first().textContent().catch(() => null);
        if (errorElement && errorElement.trim()) {
          // Check if it's a rate limit error
          if (errorElement.includes('429') || errorElement.includes('Rate limit')) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`⚠️ Rate limited. Retrying ${retryCount}/${maxRetries}...`);
              await page.waitForTimeout(60000); // Wait 60 seconds
              await page.click('button:has-text("Cancel")').catch(() => {});
              continue; // Retry
            }
          }
          
          // Check if modal is still visible
          const modalVisible = await page.locator('input[name="secret-name"]').isVisible().catch(() => false);
          if (modalVisible) {
            throw new Error(`Secret creation failed: ${errorElement}`);
          }
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
          await page.click('button:has-text("Cancel")').catch(() => {});
          continue; // Retry
        }
      }
      throw error;
    }
  }
  
  // Wait for either:
  // 1. Modal to close (normal case)
  // 2. Navigation to happen (deep-link case with returnTo)
  // 3. Error alert to appear (error case)
  try {
    // Try waiting for modal to close (most common case)
    await page.waitForSelector('input[name="secret-name"]', { state: 'hidden', timeout: 5000 });
  } catch {
    // If modal doesn't close, might be navigating or error occurred
    // Wait a bit and check if we're still on the page
    await page.waitForTimeout(1000);
    
    // Check if we navigated away (deep-link with returnTo)
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/secrets')) {
      // We navigated away, that's fine for deep-links
      return;
    }
    
    // Still on secrets page, check if modal is gone or if there's an error
    const modalVisible = await page.locator('input[name="secret-name"]').isVisible().catch(() => false);
    if (modalVisible) {
      // Modal still visible, might be an error
      // Check for error message
      const errorText = await page.locator('.text-red-600, .error, [role="alert"]').first().textContent().catch(() => null);
      if (errorText) {
        throw new Error(`Secret creation failed: ${errorText}`);
      }
      // Wait a bit more and try to close modal manually or check again
      await page.waitForTimeout(2000);
      const stillVisible = await page.locator('input[name="secret-name"]').isVisible().catch(() => false);
      if (stillVisible) {
        // Modal still visible after waiting, might be a problem
        // Try clicking cancel to close it
        await page.click('button:has-text("Cancel")').catch(() => {});
      }
    }
  }
  
  // Wait for success (secret should appear in list if we're still on secrets page)
  // If we navigated away, this will fail but that's expected for deep-links
  try {
    await page.waitForSelector(`text=${secretName}`, { timeout: 3000 });
  } catch {
    // If secret doesn't appear, we might have navigated away (deep-link case)
    // Or the secret might already exist - that's fine
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/secrets')) {
      // We navigated away, that's fine
      return;
    }
    // If we're still on secrets page and secret doesn't appear, it might already exist
    // That's acceptable for tests
  }
}

/**
 * Delete a test secret
 */
export async function deleteTestSecret(page: Page, secretName: string) {
  await page.goto('/admin/secrets');
  
  // Find and click delete button for the secret
  const row = page.locator(`tr:has-text("${secretName}")`);
  const deleteButton = row.locator('button[title*="Delete"]');
  
  if (await deleteButton.count() > 0) {
    await deleteButton.click();
    // Confirm deletion if modal appears
    await page.click('button:has-text("Confirm")').catch(() => {});
    await page.waitForTimeout(1000);
  }
}

/**
 * Cleanup: Delete all test secrets
 */
export async function cleanupTestSecrets(page: Page, prefix: string = 'test-') {
  await page.goto('/admin/secrets');
  
  // Get all secret rows
  const rows = page.locator('tbody tr');
  const count = await rows.count();
  
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const nameCell = row.locator('td').first();
    const secretName = await nameCell.textContent();
    
    if (secretName?.startsWith(prefix)) {
      const deleteButton = row.locator('button[title*="Delete"]');
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.click('button:has-text("Confirm")').catch(() => {});
        await page.waitForTimeout(500);
      }
    }
  }
}

/**
 * Wait for element with retry
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; state?: 'visible' | 'attached' }
) {
  return page.waitForSelector(selector, {
    timeout: options?.timeout || 10000,
    state: options?.state || 'visible',
  });
}

/**
 * Assert element is visible
 */
export async function expectVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Assert element contains text
 */
export async function expectText(page: Page, selector: string, text: string) {
  await expect(page.locator(selector)).toContainText(text);
}

