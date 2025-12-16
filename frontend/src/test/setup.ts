/**
 * Vitest Setup File
 * 
 * This file runs before all tests.
 * Use it to configure test environment, mocks, and global test utilities.
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock ResizeObserver for React Flow tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

