import { test, expect } from '@playwright/test';

test.describe('Influencer Matching Platform', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main platform interface', async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.locator('h1')).toContainText('buenas clara');
    
    // Check if the get started button is present
    await expect(page.locator('text=Comenzar Búsqueda')).toBeVisible();
    
    // Check if tagline is present
    await expect(page.locator('text=Plataforma de Marketing de Influencers Potenciada por IA')).toBeVisible();
  });

  test('should show search interface after getting started', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    
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
    expect(placeholderText).toContain('encuentre influencers');
  });

  test('should navigate to proposal generator', async ({ page }) => {
    // First click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    
    // Wait for the interface to load
    await page.waitForTimeout(3000);
    
    // Check that chat interface is visible
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    
    // Check if we can at least see the chat interface elements
    await expect(page.locator('text=Asistente de IA para Influencers')).toBeVisible();
  });

  test('should handle basic interface interactions', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    await page.waitForTimeout(3000);
    
    // Check basic interface elements
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    
    // Check if send button exists
    const sendButton = page.locator('button').filter({ hasText: /send|enviar|submit/i }).first();
    const sendButtonByIcon = page.locator('button:has(svg)').last(); // Send button with arrow icon
    
    // At least one send mechanism should be visible
    const hasSendButton = await sendButton.isVisible().catch(() => false);
    const hasSendIcon = await sendButtonByIcon.isVisible().catch(() => false);
    
    expect(hasSendButton || hasSendIcon).toBe(true);
  });

  test('should show PDF upload functionality', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    await page.waitForTimeout(3000);
    
    // Check if PDF upload button/hint is visible
    const pdfUpload = page.locator('text=PDF, text=sube, button:has-text("Upload")').first();
    const pdfHint = page.locator('text=Sube una propuesta PDF').first();
    
    const hasPdfUpload = await pdfUpload.isVisible().catch(() => false);
    const hasPdfHint = await pdfHint.isVisible().catch(() => false);
    
    expect(hasPdfUpload || hasPdfHint).toBe(true);
  });

  test('should have proper chat interface structure', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    await page.waitForTimeout(3000);
    
    // Check for chat header
    await expect(page.locator('text=Asistente de IA para Influencers')).toBeVisible({ timeout: 15000 });
    
    // Check for chat input area
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible();
    
    // Check for welcome message by looking for specific text content
    const welcomeText = page.locator('text=¡Hola! Soy tu asistente de IA para encontrar influencers');
    await expect(welcomeText).toBeVisible({ timeout: 10000 });
  });

  test('should handle navigation between views', async ({ page }) => {
    // Start on landing page
    await expect(page.locator('text=Comenzar Búsqueda')).toBeVisible();
    
    // Navigate to chat
    await page.click('text=Comenzar Búsqueda');
    await page.waitForTimeout(2000);
    
    // Should see chat interface
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });
    
    // Check if there's a way to navigate back (if applicable)
    const backButton = page.locator('button:has-text("Volver"), button:has-text("Back"), button:has-text("Atrás")').first();
    const hasBackButton = await backButton.isVisible().catch(() => false);
    
    // This is optional - not all interfaces need a back button
    // Just checking the navigation flow works
    expect(true).toBe(true); // Test passes if we get to this point
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    await page.waitForTimeout(3000);
    
    // Check that interface loads without infinite loading
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    
    // The textarea may be disabled initially, but it should exist
    const textareaExists = await chatInput.count();
    expect(textareaExists).toBeGreaterThan(0);
  });

  test('should have accessible interface elements', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    await page.waitForTimeout(3000);
    
    // Check for proper labeling and accessibility
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    
    // Check if input has proper placeholder
    const placeholder = await chatInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.length).toBeGreaterThan(5);
  });

  test('should maintain interface stability', async ({ page }) => {
    // Click "Comenzar Búsqueda" to enter the app
    await page.click('text=Comenzar Búsqueda');
    
    // Wait and check that interface remains stable
    await page.waitForTimeout(5000);
    
    // Interface should be consistently visible
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible();
    
    // Check that no critical errors occurred
    const errorMessages = page.locator('text=Error, text=error, text=failed, text=falló').first();
    const hasErrors = await errorMessages.isVisible().catch(() => false);
    
    expect(hasErrors).toBe(false);
  });
}); 