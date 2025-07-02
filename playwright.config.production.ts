import { defineConfig, devices } from '@playwright/test';

/**
 * Production Playwright Configuration
 * Tests the live Vercel deployment instead of localhost
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1, // Allow 1 retry for production tests
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2, // Reduce workers for production testing
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report-production' }],
    ['list'] // Also show list output in terminal
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PRODUCTION_URL || 'https://layai.vercel.app',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure for production debugging */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Increase timeout for production (network latency) */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Global test timeout for production */
  timeout: 60000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-production',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional settings for production testing
        ignoreHTTPSErrors: false,
        // Test with realistic viewport
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox-production',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'webkit-production',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Test against mobile viewports for production */
    {
      name: 'mobile-chrome-production',
      use: { 
        ...devices['Pixel 5'],
        // Test mobile experience on production
      },
    },
  ],

  /* NO webServer - we're testing against live production */
  // webServer is omitted because we're testing the deployed site
}); 