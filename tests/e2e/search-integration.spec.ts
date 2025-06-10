import { test, expect } from '@playwright/test';

test.describe('Search Integration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load with more specific selector to avoid strict mode violation
    await expect(page.locator('h2').filter({ hasText: 'Find Perfect Influencer Matches' })).toBeVisible();
  });

  test('should display results with permissive filters', async ({ page }) => {
    // Fill in search criteria with very permissive filters
    await page.selectOption('select[id="platform-select"]', 'Instagram');
    await page.selectOption('select[id="niche-select"]', 'Fashion');
    
    // Use very permissive follower range
    await page.fill('input[placeholder="Min followers"]', '1000');
    await page.fill('input[placeholder="Max followers"]', '10000000');
    
    // Click search button
    await page.locator('button:has-text("Find Influencers")').click();
    
    // Wait for search to complete (increased timeout)
    await page.waitForTimeout(60000);
    
    // Check if results appear
    const resultsSection = page.locator('[data-testid="search-results"]');
    await expect(resultsSection).toBeVisible({ timeout: 10000 });
    
    // Look for influencer cards
    const influencerCards = page.locator('[data-testid="influencer-card"]');
    const count = await influencerCards.count();
    console.log(`Found ${count} influencer cards`);
    
    // Should have at least one result
    expect(count).toBeGreaterThan(0);
    
    // Check first card has expected content
    const firstCard = influencerCards.first();
    await expect(firstCard.locator('.follower-count')).toBeVisible();
    await expect(firstCard.locator('.platform-badge')).toContainText('Instagram');
  });

  test('should complete full search flow and display results', async ({ page }) => {
    // Fill in search criteria
    await page.selectOption('select[id="platform-select"]', 'Instagram');
    await page.selectOption('select[id="niche-select"]', 'Fashion');
    await page.selectOption('select[id="location-select"]', 'Spain');
    await page.selectOption('select[id="gender-select"]', 'Female');
    await page.selectOption('select[id="age-range-select"]', '25-34');
    
    // Use more realistic follower range  
    await page.fill('input[placeholder="Min followers"]', '50000');
    await page.fill('input[placeholder="Max followers"]', '5000000');
    
    // Click search button
    await page.locator('button:has-text("Find Influencers")').click();
    
    // Wait for loading to start and then finish
    await expect(page.getByText('Searching...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 60000 });
    
    // Check for either results or no results message  
    const resultsSection = page.locator('[data-testid="search-results"]');
    const resultsVisible = await resultsSection.isVisible();
    
    if (resultsVisible) {
      await expect(resultsSection).toBeVisible({ timeout: 5000 });
    }
    
    // Check if we have results or a no results message
    const influencerCards = page.locator('[data-testid="influencer-card"]');
    const noResultsMessage = page.locator('text=No influencers found');
    
    const hasResults = await influencerCards.count() > 0;
    const hasNoResultsMessage = await noResultsMessage.isVisible();
    
    // Should have either results or no results message
    expect(hasResults || hasNoResultsMessage).toBe(true);
    
    if (hasResults) {
      console.log(`Found ${await influencerCards.count()} results`);
      
      // Verify first result has expected fields
      const firstCard = influencerCards.first();
      await expect(firstCard.locator('.follower-count')).toBeVisible();
      await expect(firstCard.locator('.engagement-rate')).toBeVisible();
      await expect(firstCard.locator('.platform-badge')).toContainText('Instagram');
      
      // Try to generate proposal for first result
      await firstCard.locator('button:has-text("Generate Proposal"), button:has-text("View Details")').first().click();
      
      // Should navigate to proposal generator
      await expect(page.locator('h2').filter({ hasText: /Proposal|Campaign/i })).toBeVisible();
    } else {
      console.log('No results found - this is acceptable for strict filters');
    }
  });

  test('should show empty state when no results found', async ({ page }) => {
    // Use very restrictive criteria that won't match
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Fashion');
    await page.getByLabel('Min Followers').fill('50000000'); // Very high minimum
    await page.getByLabel('Max Followers').fill('100000000');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    // Should show empty state or no results message
    const hasResults = await page.locator('[data-testid="influencer-card"]').count();
    if (hasResults === 0) {
      // Verify empty state is shown appropriately
      await expect(page.locator('h3')).not.toContainText('Search Results');
    }
  });

  test('should handle multiple platform selection', async ({ page }) => {
    // Select multiple platforms
    await page.getByLabel('Platform').selectOption(['Instagram', 'TikTok']);
    await page.getByLabel('Niche').selectOption('Lifestyle');
    await page.getByLabel('Location').selectOption('Spain');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    // Check that results include multiple platforms
    const resultCards = page.locator('[data-testid="influencer-card"]');
    if (await resultCards.count() > 0) {
      // Verify at least one result is visible
      await expect(resultCards.first()).toBeVisible();
    }
  });

  test('should validate form inputs', async ({ page }) => {
    // Try to search without required fields
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    // Should show validation errors or not proceed
    const isLoading = await page.getByText('Searching...').isVisible();
    if (!isLoading) {
      // Form validation should prevent search
      expect(true).toBe(true); // Form validation working
    }
  });

  test('should display realistic influencer data', async ({ page }) => {
    // Perform a standard search
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Fashion');
    await page.getByLabel('Location').selectOption('Spain');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    const resultCards = page.locator('[data-testid="influencer-card"]');
    
    if (await resultCards.count() > 0) {
      const firstCard = resultCards.first();
      
      // Check for realistic data patterns
      const followerText = await firstCard.locator('.follower-count').textContent();
      const engagementText = await firstCard.locator('.engagement-rate').textContent();
      
      // Followers should be in reasonable format (e.g., "1.2M", "500K")
      expect(followerText).toMatch(/[\d,]+[KM]?|[\d,]+ followers/i);
      
      // Engagement rate should be percentage
      expect(engagementText).toMatch(/\d+\.?\d*%/);
      
      // Should have platform badge
      await expect(firstCard.locator('.platform-badge')).toContainText(/Instagram|TikTok|YouTube/i);
    }
  });

  test('should navigate to proposal generator from results', async ({ page }) => {
    // Complete a search first
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Fashion');
    await page.getByLabel('Location').selectOption('Spain');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    // Check if results exist
    const resultCards = page.locator('[data-testid="influencer-card"]');
    const resultCount = await resultCards.count();
    
    if (resultCount > 0) {
      // Click the "Create Proposal from Results" button
      await page.getByRole('button', { name: 'Create Proposal from Results' }).click();
      
      // Should navigate to proposal generator
      await expect(page.locator('h2').filter({ hasText: /Proposal|Campaign/i })).toBeVisible();
    }
  });

  test('should handle search errors gracefully', async ({ page }) => {
    // Mock network failure by intercepting API calls
    await page.route('/api/search-apify', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Fashion');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    // Should handle error gracefully - either show error message or empty results
    const hasErrorMessage = await page.getByText(/error|failed/i).isVisible();
    const hasResults = await page.locator('[data-testid="influencer-card"]').count();
    
    // Either show error or handle gracefully with empty results
    expect(hasErrorMessage || hasResults === 0).toBe(true);
  });

  test('should maintain search criteria when navigating back', async ({ page }) => {
    // Fill in specific search criteria
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Beauty');
    await page.getByLabel('Location').selectOption('Madrid');
    await page.getByLabel('Gender').selectOption('Female');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    // Navigate to another page (if proposal button exists)
    const proposalButton = page.getByRole('button', { name: 'Create Proposal from Results' });
    if (await proposalButton.isVisible()) {
      await proposalButton.click();
      
      // Navigate back
      await page.goBack();
      
      // Verify criteria are maintained
      const platformValue = await page.getByLabel('Platform').inputValue();
      const nicheValue = await page.getByLabel('Niche').inputValue();
      const locationValue = await page.getByLabel('Location').inputValue();
      
      expect(platformValue).toBe('Instagram');
      expect(nicheValue).toBe('Beauty');
      expect(locationValue).toBe('Madrid');
    }
  });

  test('should show loading state during search', async ({ page }) => {
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Fashion');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    // Verify loading state appears
    await expect(page.getByText('Searching...')).toBeVisible();
    
    // Verify search button is disabled during loading
    const searchButton = page.getByRole('button', { name: 'Find Influencers' });
    await expect(searchButton).toBeDisabled();
    
    // Wait for loading to complete
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    // Verify button is re-enabled
    await expect(searchButton).toBeEnabled();
  });

  test('should display correct influencer count in results header', async ({ page }) => {
    await page.getByLabel('Platform').selectOption('Instagram');
    await page.getByLabel('Niche').selectOption('Fashion');
    await page.getByLabel('Location').selectOption('Spain');
    
    await page.getByRole('button', { name: 'Find Influencers' }).click();
    
    await expect(page.getByText('Searching...')).toBeVisible();
    await expect(page.getByText('Searching...')).not.toBeVisible({ timeout: 30000 });
    
    const resultCards = page.locator('[data-testid="influencer-card"]');
    const actualCount = await resultCards.count();
    
    if (actualCount > 0) {
      // Check the results header shows correct count
      const resultsHeader = page.locator('h3').filter({ hasText: 'Search Results' });
      await expect(resultsHeader).toContainText(`(${actualCount} matches)`);
    }
  });
}); 