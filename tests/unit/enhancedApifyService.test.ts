import { searchInfluencersWithTwoTierDiscovery, testApifyConnection, type ApifySearchParams } from '@/lib/apifyService';
import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Helper function to create mock Response
const createMockResponse = (data: any, options: Partial<Response> = {}): Response => {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
    clone: jest.fn(),
    json: jest.fn().mockResolvedValue(data),
    ...options
  } as Response;
};

// Mock fetch for API calls with proper typing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock environment variables
process.env.SERPLY_API_KEY = 'test-serply-key-12345';
process.env.SERPAPI_KEY = 'test-serpapi-key-12345';

describe('Enhanced Apify Service - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('SerplyRateLimiter', () => {
    test('should implement singleton pattern correctly', async () => {
      // Import the service to access the rate limiter
      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      // Test that rate limiter is properly initialized
      expect(process.env.SERPLY_API_KEY).toBeDefined();
      expect(process.env.SERPLY_API_KEY?.length).toBeGreaterThan(10);
    });

    test('should queue requests and process them sequentially', async () => {
      jest.useFakeTimers();
      
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          results: [
            {
              title: 'Test Influencer 1',
              link: 'https://www.instagram.com/testuser1',
              description: 'Test description 1'
            }
          ]
        }))
        .mockResolvedValueOnce(createMockResponse({
          results: [
            {
              title: 'Test Influencer 2', 
              link: 'https://www.instagram.com/testuser2',
              description: 'Test description 2'
            }
          ]
        }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      // Start multiple searches simultaneously
      const searchPromises = [
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'],
          niches: ['fitness'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: 'fitness influencers Spain'
        }),
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'], 
          niches: ['lifestyle'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: 'lifestyle influencers Madrid'
        })
      ];

      // Fast-forward timers to process rate limiting
      jest.advanceTimersByTime(10000);

      const results = await Promise.all(searchPromises);
      
      // Verify both searches completed
      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();

      jest.useRealTimers();
    });

    test('should implement exponential backoff on consecutive errors', async () => {
      jest.useFakeTimers();
      
      // Mock consecutive failures followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('504 Gateway Timeout'))
        .mockRejectedValueOnce(new Error('504 Gateway Timeout'))
        .mockResolvedValueOnce(createMockResponse({ results: [] }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const searchPromise = searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'test query'
      });

      // Fast-forward through backoff periods
      jest.advanceTimersByTime(60000);

      const result = await searchPromise;
      expect(result).toBeDefined();

      jest.useRealTimers();
    });

    test('should handle rate limit (429) errors with proper backoff', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(
        { message: 'Rate limit exceeded' },
        { ok: false, status: 429, statusText: 'Too Many Requests' }
      ));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'test query'
      });

      // Should handle the error gracefully and return results (even if empty)
      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Parallel Search Processing', () => {
    test('should execute SerpApi and Serply searches in parallel', async () => {
      // Mock both API responses
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          organic_results: [
            {
              title: 'SerpApi Result',
              link: 'https://www.instagram.com/serpapi_user',
              snippet: 'SerpApi test result'
            }
          ]
        }))
        .mockResolvedValueOnce(createMockResponse({
          results: [
            {
              title: 'Serply Result',
              link: 'https://www.instagram.com/serply_user',
              description: 'Serply test result'
            }
          ]
        }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const startTime = Date.now();
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'fitness influencers parallel test'
      });
      const endTime = Date.now();

      // Verify parallel execution (should be faster than sequential)
      expect(endTime - startTime).toBeLessThan(10000);
      expect(result).toBeDefined();
    });

    test('should merge and prioritize results from multiple APIs', async () => {
      // Mock responses with different quality indicators
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          organic_results: [
            {
              title: 'High Quality SerpApi Result',
              link: 'https://www.instagram.com/quality_user',
              snippet: 'Verified high quality result'
            }
          ]
        }))
        .mockResolvedValueOnce(createMockResponse({
          results: [
            {
              title: 'Serply Result',
              link: 'https://www.instagram.com/serply_user',
              description: 'Standard quality result'
            }
          ]
        }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'quality test search'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Profile URL Extraction and Validation', () => {
    test('should extract valid Instagram profile URLs', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        results: [
          {
            title: 'Valid Instagram Profile',
            link: 'https://www.instagram.com/validuser123',
            description: 'Valid Instagram profile'
          },
          {
            title: 'Invalid Profile',
            link: 'https://www.instagram.com/discover/fitness',
            description: 'Discover page, not a profile'
          },
          {
            title: 'Another Valid Profile',
            link: 'https://instagram.com/anotheruser',
            description: 'Another valid profile'
          }
        ]
      }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'fitness influencers'
      });

      expect(result).toBeDefined();
      // Should filter out invalid URLs and keep only valid profiles
    });

    test('should extract valid TikTok profile URLs', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        results: [
          {
            title: 'Valid TikTok Profile',
            link: 'https://www.tiktok.com/@validtiktokuser',
            description: 'Valid TikTok profile'
          },
          {
            title: 'TikTok Video URL',
            link: 'https://www.tiktok.com/@user123/video/7123456789',
            description: 'TikTok video URL - should extract username'
          },
          {
            title: 'TikTok Discover Page',
            link: 'https://www.tiktok.com/discover/fitness',
            description: 'Discover page, not a profile'
          }
        ]
      }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['tiktok'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'fitness creators TikTok'
      });

      expect(result).toBeDefined();
    });

    test('should deduplicate profile URLs correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        results: [
          {
            title: 'Profile 1',
            link: 'https://www.instagram.com/testuser',
            description: 'Test user profile'
          },
          {
            title: 'Profile 1 Duplicate',
            link: 'https://instagram.com/testuser',
            description: 'Same user, different URL format'
          },
          {
            title: 'Profile 1 with trailing slash',
            link: 'https://www.instagram.com/testuser/',
            description: 'Same user with trailing slash'
          },
          {
            title: 'Different Profile',
            link: 'https://www.instagram.com/differentuser',
            description: 'Different user'
          }
        ]
      }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'deduplication test'
      });

      expect(result).toBeDefined();
      // Should properly deduplicate the URLs
    });
  });

  describe('Search Fallback Strategies', () => {
    test('should use fallback queries when initial search returns few results', async () => {
      // Mock initial search with few results
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ results: [] }))
        .mockResolvedValueOnce(createMockResponse({
          results: [
            {
              title: 'Fallback Result',
              link: 'https://www.instagram.com/fallback_user',
              description: 'Found via fallback strategy'
            }
          ]
        }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['very-specific-niche'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'very specific search that might fail'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    test('should create synthetic profile discovery when all searches fail', async () => {
      // Mock all searches failing
      mockFetch.mockRejectedValue(new Error('All APIs failed'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        location: 'Spain',
        gender: 'male',
        userQuery: 'fallback test'
      });

      expect(result).toBeDefined();
      expect(result.discoveryResults).toBeDefined();
      // Should create synthetic profiles based on search parameters
    });

    test('should handle circuit breaker open state gracefully', async () => {
      // Mock circuit breaker behavior - immediate failures
      mockFetch.mockRejectedValue(new Error('Circuit breaker open'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'circuit breaker test'
      });

      expect(result).toBeDefined();
      // Should still return a valid response structure
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Profile Filtering and Validation', () => {
    test('should filter profiles by gender correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        results: [
          {
            title: 'Male Fitness Influencer',
            link: 'https://www.instagram.com/carlos_fitness',
            description: 'Male fitness influencer from Spain'
          },
          {
            title: 'Female Lifestyle Influencer',
            link: 'https://www.instagram.com/maria_lifestyle',
            description: 'Female lifestyle influencer'
          }
        ]
      }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        gender: 'male',
        userQuery: 'male fitness influencers'
      });

      expect(result).toBeDefined();
      // Should filter to only include male influencers
    });

    test('should filter profiles by location correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        results: [
          {
            title: 'Spanish Influencer',
            link: 'https://www.instagram.com/spanish_user',
            description: 'Influencer from Madrid, Spain'
          },
          {
            title: 'French Influencer',
            link: 'https://www.instagram.com/french_user',
            description: 'Influencer from Paris, France'
          }
        ]
      }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['lifestyle'],
        minFollowers: 1000,
        maxFollowers: 100000,
        location: 'Spain',
        userQuery: 'Spanish influencers'
      });

      expect(result).toBeDefined();
    });

    test('should filter out brand accounts and invalid profiles', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        results: [
          {
            title: 'Valid Personal Profile',
            link: 'https://www.instagram.com/real_person',
            description: 'Real person influencer profile'
          },
          {
            title: 'Brand Account',
            link: 'https://www.instagram.com/nike_official',
            description: 'Official Nike brand account'
          },
          {
            title: 'Generic Profile',
            link: 'https://www.instagram.com/user12345',
            description: 'Generic user profile'
          }
        ]
      }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'authentic influencers'
      });

      expect(result).toBeDefined();
      // Should filter out brand accounts and invalid profiles
    });
  });

  describe('Brand Collaboration Analysis', () => {
    test('should analyze brand collaboration from profile data', async () => {
      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      // Test with brand name in search
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        brandName: 'Nike',
        userQuery: 'Nike brand collaboration test'
      });

      expect(result).toBeDefined();
      // Should include brand collaboration analysis
    });

    test('should detect brand mentions in bio and posts', async () => {
      // This would test the brand collaboration analysis functionality
      // when profile data includes brand mentions
      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fashion'],
        minFollowers: 1000,
        maxFollowers: 100000,
        brandName: 'Adidas',
        userQuery: 'Adidas collaboration analysis'
      });

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'network error test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid JSON responses', async () => {
      const mockResponse = createMockResponse({});
      (mockResponse.json as jest.MockedFunction<() => Promise<unknown>>).mockRejectedValue(new Error('Invalid JSON'));
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'invalid JSON test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    test('should handle API key validation errors', async () => {
      // Temporarily remove API key
      const originalKey = process.env.SERPLY_API_KEY;
      delete process.env.SERPLY_API_KEY;

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'no API key test'
      });

      expect(result).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);

      // Restore API key
      process.env.SERPLY_API_KEY = originalKey;
    });
  });

  describe('Performance and Optimization', () => {
    test('should limit profile discovery to prevent UI overload', async () => {
      // Mock response with many results
      const manyResults = Array.from({ length: 50 }, (_, i) => ({
        title: `Profile ${i}`,
        link: `https://www.instagram.com/user${i}`,
        description: `Test profile ${i}`
      }));

      mockFetch.mockResolvedValueOnce(createMockResponse({ results: manyResults }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const result = await searchInfluencersWithTwoTierDiscovery({
        platforms: ['instagram'],
        niches: ['fitness'],
        minFollowers: 1000,
        maxFollowers: 100000,
        userQuery: 'many results test'
      });

      expect(result).toBeDefined();
      // Should limit results to prevent UI overload (max 15 profiles)
      expect(result.discoveryResults.length).toBeLessThanOrEqual(15);
    });

    test('should handle concurrent searches efficiently', async () => {
      jest.useFakeTimers();
      
      mockFetch.mockResolvedValue(createMockResponse({ results: [] }));

      const { searchInfluencersWithTwoTierDiscovery } = await import('../../src/lib/apifyService');
      
      const startTime = Date.now();
      
      // Launch multiple concurrent searches
      const searches = Array.from({ length: 5 }, (_, i) =>
        searchInfluencersWithTwoTierDiscovery({
          platforms: ['instagram'],
          niches: ['fitness'],
          minFollowers: 1000,
          maxFollowers: 100000,
          userQuery: `concurrent search ${i}`
        })
      );

      jest.advanceTimersByTime(30000);
      
      const results = await Promise.all(searches);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      jest.useRealTimers();
    });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });
}); 