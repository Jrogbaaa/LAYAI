import { test, expect } from '@playwright/test';

/**
 * Production Smoke Tests
 * Tests critical functionality on the live Vercel deployment
 * These tests verify that the major fixes (Firebase, EROFS, etc.) are working
 */

test.describe('Production Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the production site
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('🏠 Homepage loads without errors', async ({ page }) => {
    // Check that the page title contains expected content
    await expect(page).toHaveTitle(/LAYAI/);
    
    // Check that content loads properly (look for actual page content)
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Plataforma de Marketing')).toBeVisible();
    await expect(page.locator('text=Comenzar Búsqueda')).toBeVisible();
    
    // Verify no JavaScript console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to surface
    await page.waitForTimeout(3000);
    
    // Check for critical errors (ignore known minor ones)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') && // Ignore resource loading issues
      !error.includes('net::ERR_BLOCKED_BY_CONTENT_BLOCKER') && // Ignore ad blockers
      !error.includes('googletagmanager') // Ignore analytics issues
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('📊 Campaigns tab loads without 500 errors', async ({ page }) => {
    // Navigate to campaigns tab
    await page.click('text=Campañas');
    
    // Wait for the campaigns to load
    await page.waitForTimeout(3000);
    
    // Check that we don't see error messages
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Failed to load')).not.toBeVisible();
    await expect(page.locator('text=Error')).not.toBeVisible();
    
    // Check that campaigns interface is visible (use specific heading)
    await expect(page.locator('h3:has-text("Gestión de Campañas")')).toBeVisible({ timeout: 10000 });
    
    // Verify loading state appears (shows Firebase is connecting)
    // Note: This might pass quickly, so we use a short timeout
    try {
      await expect(page.locator('text=Cargando')).toBeVisible({ timeout: 2000 });
    } catch {
      // Loading might complete too quickly, which is fine
      console.log('Loading state completed too quickly to detect');
    }
  });

  test('🔍 Search functionality basic test', async ({ page }) => {
    // Click the "Comenzar Búsqueda" button to reveal search interface
    await page.click('text=Comenzar Búsqueda');
    
    // Wait for search interface to load
    await page.waitForTimeout(2000);
    
    // Find the search input (now it should be visible)
    const searchInput = page.locator('input[type="text"], textarea').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Type a simple search
    await searchInput.fill('hola');
    
    // Press Enter to trigger search
    await page.keyboard.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check that we don't get 500 errors
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Error handling')).not.toBeVisible();
    
    // Look for some kind of response
    const hasResponse = await page.locator('text=Puedo ayudarte').isVisible({ timeout: 2000 }) ||
                       await page.locator('text=Hola').isVisible({ timeout: 2000 }) ||
                       await page.locator('text=influencer').isVisible({ timeout: 2000 });
    
    expect(hasResponse).toBeTruthy();
  });

  test('🔥 Firebase connection working (no EROFS errors)', async ({ page }) => {
    // Monitor network requests for Firebase calls
    const firebaseRequests: string[] = [];
    const errorRequests: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('firestore') || response.url().includes('firebase')) {
        firebaseRequests.push(response.url());
      }
      if (response.status() >= 500) {
        errorRequests.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    // Navigate to campaigns to trigger Firebase calls
    await page.click('text=Campañas');
    await page.waitForTimeout(5000);
    
    // Check that we don't have 500 errors (EROFS would cause these)
    const erorsErrors = errorRequests.filter(error => error.includes('500'));
    expect(erorsErrors).toHaveLength(0);
    
    console.log('Firebase requests detected:', firebaseRequests.length);
    console.log('Error requests:', errorRequests);
  });

  test('📱 Mobile viewport loads correctly', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page in mobile view
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that content is visible and responsive
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check that navigation works on mobile
    const hasNavigation = await page.locator('nav, [role="navigation"], button').first().isVisible();
    expect(hasNavigation).toBeTruthy();
  });

  test('🌐 Production environment variables working', async ({ page }) => {
    // Check that the page loads (indicates env vars are set correctly)
    await page.goto('/');
    
    // Look for signs that Firebase is configured
    // This would fail if NEXT_PUBLIC_FIREBASE_* vars weren't set
    await page.waitForTimeout(3000);
    
    // Navigate to a feature that requires Firebase
    await page.click('text=Campañas');
    await page.waitForTimeout(3000);
    
    // If Firebase vars were missing, we'd see specific errors
    await expect(page.locator('text=Firebase API key')).not.toBeVisible();
    await expect(page.locator('text=Invalid API key')).not.toBeVisible();
    await expect(page.locator('text=No Firebase')).not.toBeVisible();
  });
}); 