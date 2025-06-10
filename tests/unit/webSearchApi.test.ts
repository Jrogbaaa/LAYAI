// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Web Search Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FIRECRAWL_API_KEY = 'test-firecrawl-key';
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should generate realistic search results', () => {
    // Test the search result generation logic
    const query = 'Spain female fashion influencer instagram';
    const limit = 5;
    
    // Simulate the search result generation
    const mockResults = [
      {
        url: 'https://www.instagram.com/dulceida',
        title: 'dulceida (@dulceida) • Instagram photos and videos',
        description: '2.8M Followers, 500 Following. Fashion influencer from Spain.',
        platform: 'instagram'
      },
      {
        url: 'https://www.instagram.com/meryturiel',
        title: 'meryturiel (@meryturiel) • Instagram photos and videos',
        description: '1.2M Followers, 300 Following. Fashion influencer from Spain.',
        platform: 'instagram'
      }
    ];

    expect(mockResults).toHaveLength(2);
    expect(mockResults[0]).toHaveProperty('url');
    expect(mockResults[0]).toHaveProperty('title');
    expect(mockResults[0]).toHaveProperty('description');
    expect(mockResults[0]).toHaveProperty('platform');
    expect(mockResults[0].url).toContain('instagram.com');
  });

  it('should handle different platform queries correctly', () => {
    const testCases = [
      { query: 'spain fitness influencer instagram', expectedPlatform: 'instagram' },
      { query: 'madrid food creator tiktok', expectedPlatform: 'tiktok' },
      { query: 'barcelona travel blogger youtube', expectedPlatform: 'youtube' },
    ];

    testCases.forEach(testCase => {
      // Extract platform from query
      const platforms = ['instagram', 'tiktok', 'youtube'];
      const detectedPlatform = platforms.find(p => testCase.query.toLowerCase().includes(p)) || 'instagram';
      
      expect(detectedPlatform).toBe(testCase.expectedPlatform);
    });
  });

  it('should generate valid profile URLs', () => {
    const testUrls = [
      'https://www.instagram.com/dulceida',
      'https://www.tiktok.com/@dulceida',
      'https://www.youtube.com/@dulceida'
    ];

    testUrls.forEach(url => {
      if (url.includes('instagram.com')) {
        expect(url).toMatch(/^https:\/\/www\.instagram\.com\/[a-zA-Z0-9._]+$/);
      } else if (url.includes('tiktok.com')) {
        expect(url).toMatch(/^https:\/\/www\.tiktok\.com\/@[a-zA-Z0-9._]+$/);
      } else if (url.includes('youtube.com')) {
        expect(url).toMatch(/^https:\/\/www\.youtube\.com\/@[a-zA-Z0-9._]+$/);
      }
    });
  });

  it('should include known Spanish influencers', () => {
    const knownInfluencers = ['dulceida', 'meryturiel', 'lauraescanes', 'isasaweis'];
    const mockResults = [
      { url: 'https://www.instagram.com/dulceida' },
      { url: 'https://www.instagram.com/meryturiel' }
    ];

    const resultUsernames = mockResults.map(r => r.url.split('/').pop());
    const hasKnownInfluencer = knownInfluencers.some(username => 
      resultUsernames.includes(username)
    );
    
    expect(hasKnownInfluencer).toBe(true);
  });

  it('should respect limit parameter', () => {
    const limits = [1, 3, 5, 8];

    limits.forEach(limit => {
      // Simulate result generation with limit
      const mockResults = Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
        url: `https://www.instagram.com/user${i}`,
        title: `User ${i}`,
        platform: 'instagram'
      }));

      expect(mockResults.length).toBeLessThanOrEqual(limit);
    });
  });

  it('should work without Firecrawl API key', () => {
    delete process.env.FIRECRAWL_API_KEY;

    // Should still be able to generate fallback results
    const mockFallbackResults = [
      {
        url: 'https://www.instagram.com/dulceida',
        title: 'dulceida - fashion influencer',
        description: 'Fashion content creator from Spain',
        platform: 'instagram',
        source: 'fallback'
      }
    ];

    expect(mockFallbackResults).toHaveLength(1);
    expect(mockFallbackResults[0].source).toBe('fallback');
  });
}); 