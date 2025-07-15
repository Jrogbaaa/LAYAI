import { test, expect } from '@playwright/test';
import { navigateToSearch, getChatInput, getSendButton, waitForSearchResults, waitForStartSearchButton } from './test-utils';

/**
 * Production Smoke Tests
 * Tests critical functionality on the live Vercel deployment
 * These tests verify that the major fixes (Firebase, EROFS, etc.) are working
 */

test.describe('Production Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');
    
    // Wait for the landing page to fully load
    await expect(page.locator('h1')).toContainText('buenas clara', { timeout: 20000 });
  });

  test('✅ Landing page loads without console errors', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') && // Ignore resource loading issues
      !error.includes('net::ERR_BLOCKED_BY_CONTENT_BLOCKER') && // Ignore ad blockers
      !error.includes('googletagmanager') // Ignore analytics issues
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('📊 Campaigns tab loads without 500 errors', async ({ page }) => {
    // First navigate to the main app (past landing page)
    await navigateToSearch(page);
    await page.waitForTimeout(3000);
    
    // Look for the campaigns navigation button using the exact structure from Sidebar.tsx
    // Try multiple strategies to find the campaigns button
    const campaignsSelectors = [
      'button[aria-label*="Campaigns"]',  // Desktop sidebar with English
      'button[aria-label*="Campañas"]',   // Desktop sidebar with Spanish  
      'button:has-text("Campaigns")',     // Button with English text
      'button:has-text("Campañas")',      // Button with Spanish text
      'button:has(span:has-text("🎯"))',  // Button with the campaigns icon
      'nav button:has(span:text-is("🎯"))', // Navigation button with target emoji
    ];
    
    let campaignsButton = page.locator(campaignsSelectors[0]).first();
    for (const selector of campaignsSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`✅ Found campaigns button with selector: ${selector}`);
        campaignsButton = button;
        break;
      }
    }
    
    // Wait for campaigns navigation to be available
    await expect(campaignsButton).toBeVisible({ timeout: 15000 });
    await campaignsButton.click();
    
    // Wait for the campaigns to load
    await page.waitForTimeout(5000);
    
    // Check that we don't see error messages
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Failed to load')).not.toBeVisible();
    await expect(page.locator('text=Error')).not.toBeVisible();
    
    // Check that campaigns interface is visible - handle both languages
    const campaignHeaders = page.locator('h1:has-text("Gestión de Campañas"), h1:has-text("Campaign Management"), h2:has-text("📊"), text=Campaign, text=Campaña').first();
    await expect(campaignHeaders).toBeVisible({ timeout: 15000 });
    
    // Verify loading state appears (shows Firebase is connecting)
    // Note: This might pass quickly, so we use a short timeout
    try {
      await expect(page.locator('text=Cargando, text=Loading')).toBeVisible({ timeout: 3000 });
    } catch {
      // Loading might complete too quickly, which is fine
      console.log('Loading state completed too quickly to detect');
    }
  });

  test('🔍 Search functionality basic test', async ({ page }) => {
    // Click the "Comenzar Búsqueda" button to reveal search interface
    await navigateToSearch(page);
    
    // Wait for search interface to load
    await page.waitForTimeout(3000);
    
    // Check that search interface is present
    const searchInput = page.locator('textarea').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Basic test - make sure we can interact with the search
    await searchInput.fill('Test search');
    await expect(searchInput).toHaveValue('Test search');
    
    // Check for send button
    const sendButton = getSendButton(page);
    await expect(sendButton).toBeVisible({ timeout: 5000 });
  });

  test('🤖 AI chat interface responds', async ({ page }) => {
    // Navigate to search
    await navigateToSearch(page);
    await page.waitForTimeout(3000);
    
    // Get chat elements
    const chatInput = getChatInput(page);
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // Type a simple query
    await chatInput.fill('Hello');
    
    // Try to send (but don't wait for full response in smoke test)
    const sendButton = getSendButton(page);
    if (await sendButton.isVisible() && !await sendButton.isDisabled()) {
      await sendButton.click();
      
      // Just check that some response appears within reasonable time
      await page.waitForTimeout(5000);
      
      // Look for any kind of response indication
      const hasResponse = await page.locator('text=Hola, text=Hello, text=influencer').first().isVisible({ timeout: 3000 }) ||
                         await page.locator('div[class*="bg-white"][class*="text-gray-800"]').first().isVisible({ timeout: 3000 });
      
      expect(hasResponse).toBeTruthy();
    }
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
    
    // First navigate to the main app (past landing page)
    await navigateToSearch(page);
    await page.waitForTimeout(3000);
    
    // Look for the campaigns navigation button using multiple strategies
    const campaignsSelectors = [
      'button[aria-label*="Campaigns"]',
      'button[aria-label*="Campañas"]',
      'button:has-text("Campaigns")',
      'button:has-text("Campañas")',
      'button:has(span:has-text("🎯"))',
    ];
    
    let campaignsButton = page.locator(campaignsSelectors[0]).first();
    for (const selector of campaignsSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        campaignsButton = button;
        break;
      }
    }
    
    await expect(campaignsButton).toBeVisible({ timeout: 15000 });
    await campaignsButton.click();
    await page.waitForTimeout(8000);
    
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
    await page.waitForTimeout(5000);
    
    // First navigate to the main app (past landing page)
    await navigateToSearch(page);
    await page.waitForTimeout(3000);
    
    // Look for the campaigns navigation button using multiple strategies
    const campaignsSelectors = [
      'button[aria-label*="Campaigns"]',
      'button[aria-label*="Campañas"]',
      'button:has-text("Campaigns")',
      'button:has-text("Campañas")',
      'button:has(span:has-text("🎯"))',
    ];
    
    let campaignsButton = page.locator(campaignsSelectors[0]).first();
    for (const selector of campaignsSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        campaignsButton = button;
        break;
      }
    }
    
    await expect(campaignsButton).toBeVisible({ timeout: 15000 });
    await campaignsButton.click();
    await page.waitForTimeout(5000);
    
    // If Firebase vars were missing, we'd see specific errors
    await expect(page.locator('text=Firebase configuration error')).not.toBeVisible();
    await expect(page.locator('text=Environment variable missing')).not.toBeVisible();
    
    // Check that some Firebase functionality is working
    const hasFirebaseContent = await page.locator('text=Campaign, text=Campaña, text=📊').first().isVisible({ timeout: 10000 });
    expect(hasFirebaseContent).toBeTruthy();
  });
}); 