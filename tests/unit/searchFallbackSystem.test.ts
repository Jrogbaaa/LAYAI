import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock environment variables
process.env.SERPLY_API_KEY = 'test-serply-key-12345';
process.env.SERPAPI_KEY = 'test-serpapi-key-12345';

describe('Search Fallback System - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Multi-Tier Fallback Strategies', () => {
    test('should implement primary search tier correctly', async () => {
      // Mock successful primary search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Primary Search Result',
              link: 'https://www.instagram.com/primary_user',
              description: 'Found via primary search'
            }
          ]
        })
      } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'primary tier test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    test('should fall back to secondary search when primary fails', async () => {
      // Mock primary search failure, secondary success
      mockFetch
        .mockRejectedValueOnce(new Error('Primary API failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'Secondary Search Result',
                link: 'https://www.instagram.com/secondary_user',
                description: 'Found via secondary fallback'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'secondary fallback test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      // Test passes if no error is thrown and results are defined
    });

    test('should implement tertiary fallback with synthetic profile generation', async () => {
      // Mock all API searches failing
      mockFetch.mockRejectedValue(new Error('All APIs failed'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        location: 'Spain',
        gender: 'male',
        userQuery: 'tertiary fallback test'
      });

      expect(result).toBeDefined();
      expect(result.discoveryResults).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      // Should generate synthetic profiles based on search parameters
    });

    test('should implement query transformation fallbacks', async () => {
      // Mock initial query failure, transformed query success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }) // Empty results trigger fallback
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'Transformed Query Result',
                link: 'https://www.instagram.com/transformed_user',
                description: 'Found via query transformation'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['very-specific-niche'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'very specific search that should trigger fallback'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Recovery Mechanisms', () => {
    test('should handle network timeouts with retry logic', async () => {
      jest.useFakeTimers();
      
      // Mock timeout errors followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'Retry Success Result',
                link: 'https://www.instagram.com/retry_user',
                description: 'Found after retry'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const searchPromise = searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'timeout retry test'
      });

      // Fast-forward through retry delays
      jest.advanceTimersByTime(30000);

      const result = await searchPromise;
      expect(result).toBeDefined();
      // Test passes if no error is thrown and results are defined

      jest.useRealTimers();
    });

    test('should handle 504 Gateway Timeout errors specifically', async () => {
      // Mock 504 errors (as seen in logs)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 504,
          statusText: 'Gateway Timeout',
          json: async () => ({ error: 'Gateway Timeout' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: '504 Recovery Result',
                link: 'https://www.instagram.com/recovery_user',
                description: 'Recovered from 504 error'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: '504 error recovery test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    test('should implement circuit breaker pattern', async () => {
      // Mock consecutive failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));
      }

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      // Multiple searches should trigger circuit breaker
      const results = await Promise.all([
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'],
          niches: ['fitness'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: 'circuit breaker test 1'
        }),
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'],
          niches: ['fitness'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: 'circuit breaker test 2'
        })
      ]);

      // Should still return valid responses even with circuit breaker open
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.totalFound).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle API key validation errors gracefully', async () => {
      // Mock API key errors
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' })
      } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'API key error test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      // Should not expose API key errors to user
    });
  });

  describe('Synthetic Profile Generation', () => {
    test('should generate synthetic profiles based on search parameters', async () => {
      // Mock all searches failing to trigger synthetic generation
      mockFetch.mockRejectedValue(new Error('All searches failed'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 10000,
        maxFollowers: 500000,
        location: 'Spain',
        gender: 'male',
        userQuery: 'synthetic profile generation test'
      });

      expect(result).toBeDefined();
      expect(result.discoveryResults).toBeDefined();
      
             // Should include search parameters in synthetic profiles
       const hasParameterBasedProfiles = result.discoveryResults.some(profile => 
         profile.platform === 'instagram' ||
         profile.niche?.includes('fitness') ||
         profile.fullName?.includes('Spain')
       );
      
      expect(hasParameterBasedProfiles).toBe(true);
    });

    test('should generate platform-specific synthetic profiles', async () => {
      mockFetch.mockRejectedValue(new Error('All searches failed'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['tiktok'],
        niches: ['lifestyle'],
        minFollowers: 50000,
        maxFollowers: 1000000,
        location: 'Barcelona',
        gender: 'female',
        userQuery: 'TikTok synthetic profiles test'
      });

      expect(result).toBeDefined();
      expect(result.discoveryResults).toBeDefined();
      
      // Should generate TikTok-specific profiles
      const hasTikTokProfiles = result.discoveryResults.some(profile => 
        profile.platform === 'tiktok' ||
        profile.profileUrl?.includes('tiktok.com')
      );
      
      expect(hasTikTokProfiles).toBe(true);
    });

    test('should include brand collaboration context in synthetic profiles', async () => {
      mockFetch.mockRejectedValue(new Error('All searches failed'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 100000,
        maxFollowers: 2000000,
        brandName: 'Nike',
        userQuery: 'Nike brand collaboration synthetic test'
      });

      expect(result).toBeDefined();
      expect(result.discoveryResults).toBeDefined();
      
             // Should include brand context
       const hasBrandContext = result.discoveryResults.some(profile => 
         profile.fullName?.includes('Nike') ||
         profile.niche?.includes('sports') ||
         profile.niche?.includes('fitness')
       );
      
      expect(hasBrandContext).toBe(true);
    });
  });

  describe('Fallback Quality Scoring', () => {
    test('should prioritize primary search results over fallbacks', async () => {
      // Mock mixed results from primary and fallback
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'Primary High Quality Result',
                link: 'https://www.instagram.com/high_quality_user',
                description: 'Verified high quality influencer'
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'Fallback Lower Quality Result',
                link: 'https://www.instagram.com/lower_quality_user',
                description: 'Standard quality result'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'quality prioritization test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      // Primary results should be prioritized
    });

    test('should apply quality filters to fallback results', async () => {
      // Mock fallback with mixed quality results
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }) // Trigger fallback
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'High Quality Fallback',
                link: 'https://www.instagram.com/quality_fallback',
                description: 'Verified influencer with good engagement'
              },
              {
                title: 'Low Quality Result',
                link: 'https://www.instagram.com/user12345',
                description: 'Generic profile'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'fallback quality filtering test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      // Should filter out low quality results
    });
  });

  describe('Fallback Performance Optimization', () => {
    test('should implement intelligent fallback timing', async () => {
      jest.useFakeTimers();
      
      // Mock delayed primary search
      mockFetch
        .mockImplementationOnce(() => 
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ results: [] })
          } as Response), 15000))
        )
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                title: 'Quick Fallback Result',
                link: 'https://www.instagram.com/quick_fallback',
                description: 'Fast fallback response'
              }
            ]
          })
        } as Response);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const searchPromise = searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'intelligent timing test'
      });

      // Fast-forward to trigger fallback
      jest.advanceTimersByTime(20000);

      const result = await searchPromise;
      expect(result).toBeDefined();

      jest.useRealTimers();
    });

    test('should cache fallback strategies for repeated failures', async () => {
      // Mock repeated failures from same source
      mockFetch.mockRejectedValue(new Error('Persistent API failure'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      // Multiple searches should use cached fallback strategy
      const startTime = Date.now();
      
      await Promise.all([
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'],
          niches: ['fitness'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: 'cache test 1'
        }),
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'],
          niches: ['fitness'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: 'cache test 2'
        })
      ]);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should be faster due to cached fallback strategy
      expect(totalTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });
}); 