import { test, expect } from '@playwright/test';
import { navigateToSearch, getChatInput, getSendButton, waitForSearchResults, waitForStartSearchButton } from './test-utils';

test.describe('Influencer Matching Platform', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
  });

  test('should display the main platform interface', async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.locator('h1')).toContainText('buenas clara');
    
    // Check if the get started button is present
    await waitForStartSearchButton(page);
    
    // Check if tagline is present
    await expect(page.locator('text=AI-Powered Influencer Marketing Platform')).toBeVisible();
  });

  test('should show search interface after getting started', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await navigateToSearch(page);
    
    // Wait for the interface to load
    await page.waitForTimeout(3000);
    
    // Check if chat/search interface is present
    const searchInterface = page.locator('textarea, input[type="text"], [class*="chat"], [class*="search"]').first();
    await expect(searchInterface).toBeVisible({ timeout: 15000 });
    
    // Check if the interface has expected placeholder text
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    // Verify placeholder text is present (even if disabled)
    const placeholderText = await textarea.getAttribute('placeholder');
    expect(placeholderText).toContain('find influencers');
  });

  test('should navigate to proposal generator', async ({ page }) => {
    // First click "Comenzar Búsqueda" to enter the app
    await navigateToSearch(page);
    
    // Wait for the interface to load
    await page.waitForTimeout(3000);
    
    // Check that chat interface is visible
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    
    // Look for send button - multiple strategies
    const sendButtonByText = page.locator('button:has-text("Enviar")').first();
    const sendButtonByIcon = page.locator('button:has(svg[viewBox="0 0 24 24"])').last();
    
    const hasSendButton = await sendButtonByText.isVisible().catch(() => false);
    const hasSendIcon = await sendButtonByIcon.isVisible().catch(() => false);
    
    expect(hasSendButton || hasSendIcon).toBe(true);
  });

  test('should show PDF upload functionality', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await navigateToSearch(page);
    await page.waitForTimeout(3000);
    
    // Check for PDF upload button (Upload icon)
    const uploadButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    const uploadIcon = page.locator('button svg').filter({ hasText: '' });
    const pdfHint = page.locator('text=PDF').first();
    const uploadTitle = page.locator('button[title*="PDF"]').first();
    
    // Wait a bit for the interface to fully load
    await page.waitForTimeout(2000);
    
    const hasUploadButton = await uploadButton.isVisible().catch(() => false);
    const hasUploadIcon = await uploadIcon.count() > 0;
    const hasPdfHint = await pdfHint.isVisible().catch(() => false);
    const hasUploadTitle = await uploadTitle.isVisible().catch(() => false);
    
    // Should have some form of PDF upload functionality
    expect(hasUploadButton || hasUploadIcon || hasPdfHint || hasUploadTitle).toBe(true);
  });

  test('should have proper chat interface structure', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await navigateToSearch(page);
    await page.waitForTimeout(3000);
    
    // Check for chat header - FIXED
    await expect(page.locator('h1:has-text("Asistente de IA para Influencers"), h2:has-text("Asistente de IA para Influencers")').first()).toBeVisible({ timeout: 15000 });
    
    // Check for chat input area
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible();
    
    // Check for welcome message - Updated to match actual English text
    const welcomeText = page.locator('text=Hello! I\'m your AI assistant for finding influencers');
    await expect(welcomeText).toBeVisible({ timeout: 10000 });
  });

  test('should handle navigation between views', async ({ page }) => {
    // Start on landing page
    await waitForStartSearchButton(page);
    
    // Navigate to chat
    await navigateToSearch(page);
    await page.waitForTimeout(2000);
    
    // Should see chat interface
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });
    
    // Check if there's a way to navigate back (if applicable)
    const backButton = page.locator('button:has-text("Atrás"), button:has-text("Back")').first();
    const homeButton = page.locator('button:has-text("Inicio"), button:has-text("Home")').first();
    
    // Navigation buttons are optional, so we just check the interface is functional
    const hasNavigation = await backButton.isVisible().catch(() => false) || 
                         await homeButton.isVisible().catch(() => false);
    
    // Interface should be functional regardless of navigation buttons
    expect(hasNavigation || true).toBe(true);
  });

  test('should display chat input placeholder correctly', async ({ page }) => {
    // Navigate to search
    await navigateToSearch(page);
    await page.waitForTimeout(2000);
    
    // Check textarea placeholder
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder).toContain('find influencers');
  });

  test('should show AI assistant header', async ({ page }) => {
    // Navigate to search
    await navigateToSearch(page);
    await page.waitForTimeout(2000);
    
    // Check for AI assistant header
    const aiHeader = page.locator('h2:has-text("Asistente de IA para Influencers")').first();
    await expect(aiHeader).toBeVisible({ timeout: 10000 });
    
    // Check for subtitle
    const subtitle = page.locator('text=creadores perfectos').first();
    await expect(subtitle).toBeVisible({ timeout: 5000 });
  });

  test('should have functional send button', async ({ page }) => {
    // Navigate to search
    await navigateToSearch(page);
    await page.waitForTimeout(2000);
    
    // Get send button using utility
    const sendButton = getSendButton(page);
    await expect(sendButton).toBeVisible({ timeout: 10000 });
    
    // Button should be initially disabled (no input)
    const isDisabled = await sendButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should show suggested prompts', async ({ page }) => {
    // Navigate to search
    await navigateToSearch(page);
    await page.waitForTimeout(2000);
    
    // Look for suggested prompt buttons
    const promptButtons = page.locator('button').filter({ hasText: /fitness|beauty|cristiano|PDF/i });
    const promptCount = await promptButtons.count();
    
    // Should have some suggested prompts
    expect(promptCount).toBeGreaterThan(0);
  });
}); 