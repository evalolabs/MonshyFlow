import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright E2E Test Configuration
 * 
 * Best Practices:
 * - Page Object Model Pattern
 * - Test Isolation (separate browser contexts)
 * - Parallel execution for speed
 * - Retry on failure
 * - Screenshots on failure
 * - Video recording for debugging
 * - Shared authentication state to avoid rate limiting
 */
export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  globalSetup: path.join(__dirname, 'tests', 'global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Reduce workers to avoid rate limiting - use 1 worker for more stable tests
  workers: process.env.CI ? 1 : 1, // Reduced to 1 for stable test execution
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  // Only look for tests in the e2e directory
  testMatch: /.*\.spec\.ts$/,
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    // Use shared authentication state to avoid rate limiting
    storageState: path.join(__dirname, 'playwright', '.auth', 'user.json'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Increase test timeout to handle rate limiting retries and cleanup
  timeout: 60000, // 60 seconds (was 30s default)
  
  // Exclude Vitest test files and source files
  testIgnore: [
    '**/node_modules/**',
    '**/src/**',
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment for multi-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: 'pnpm --filter frontend dev',
    cwd: path.join(__dirname, '../..'), // Run from workspace root
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

