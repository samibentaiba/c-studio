import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for C-Studio Electron App
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects - we use a custom Electron setup */
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.spec.ts',
    },
  ],

  /* Timeout for each test - increased for Electron app startup */
  timeout: 60000,
  
  /* Timeout for expect assertions - increased for UI rendering */
  expect: {
    timeout: 15000
  },
});
