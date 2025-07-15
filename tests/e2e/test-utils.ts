import { Page, Locator } from '@playwright/test';

/**
 * Utility functions for language-agnostic Playwright tests
 */

/**
 * Click the start/search button that works in both English and Spanish
 */
export async function clickStartSearchButton(page: Page): Promise<void> {
  // Try multiple selectors to find the button
  const selectors = [
    'text=Start Search',
    'text=Comenzar Búsqueda',
    'button:has-text("Start Search")',
    'button:has-text("Comenzar Búsqueda")',
    'button[class*="bg-gradient-to-r"][class*="from-blue-600"]',
    'button[class*="bg-gradient-to-r"][class*="to-purple-600"]'
  ];
  
  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      await button.waitFor({ state: 'visible', timeout: 5000 });
      await button.click();
      return;
    } catch (error) {
      // Continue to next selector
    }
  }
  
  throw new Error('Could not find start/search button with any selector');
}

/**
 * Wait for the start/search button to be visible
 */
export async function waitForStartSearchButton(page: Page): Promise<Locator> {
  const selectors = [
    'text=Start Search',
    'text=Comenzar Búsqueda',
    'button:has-text("Start Search")',
    'button:has-text("Comenzar Búsqueda")',
    'button[class*="bg-gradient-to-r"][class*="from-blue-600"]'
  ];
  
  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      await button.waitFor({ state: 'visible', timeout: 5000 });
      return button;
    } catch (error) {
      // Continue to next selector
    }
  }
  
  throw new Error('Could not find start/search button with any selector');
}

/**
 * Get the chat input textarea (language-agnostic)
 */
export function getChatInput(page: Page): Locator {
  const selectors = [
    'textarea[placeholder*="influencers"]',
    'textarea[placeholder*="PDF"]',
    'textarea[placeholder*="Describe"]',
    'textarea[placeholder*="busco"]',
    'textarea[placeholder*="mensaje"]',
    'textarea[rows="2"]',
    'textarea'
  ];
  
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (element) return element;
  }
  
  return page.locator('textarea').first();
}

/**
 * Get the send button (language-agnostic)
 */
export function getSendButton(page: Page): Locator {
  const selectors = [
    'button:has(svg[viewBox="0 0 24 24"]):has(path[d*="M12 19l9 2"])',
    'button[type="submit"]',
    'button:has(svg):has(path[d*="M12 19l9 2"])',
    'button[class*="bg-gradient-to-r"][class*="from-blue-600"]:has(svg)',
    'button[class*="bg-blue-600"]:has(svg)',
    'button:has(svg[viewBox="0 0 24 24"])'
  ];
  
  for (const selector of selectors) {
    const element = page.locator(selector).last(); // Use last() for send button
    if (element) return element;
  }
  
  return page.locator('button:has(svg)').last();
}

/**
 * Wait for search results to load
 */
export async function waitForSearchResults(page: Page, timeout: number = 30000): Promise<void> {
  // Wait for either success results or error messages
  await page.waitForSelector(
    '.influencer-card, [data-testid="search-results"], .search-results, text="No results found", text="No se encontraron resultados"',
    { timeout }
  );
}

/**
 * Navigate to the application and enter the search interface
 */
export async function navigateToSearch(page: Page): Promise<void> {
  await page.goto('/');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait for the landing page to be visible
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Click the start search button
  await clickStartSearchButton(page);
  
  // Wait for the search interface to load
  await page.waitForTimeout(3000);
  
  // Verify we're in the search interface by checking for chat input
  try {
    const chatInput = getChatInput(page);
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });
  } catch (error) {
    console.log('Chat input not found immediately, waiting longer...');
    await page.waitForTimeout(5000);
  }
} 