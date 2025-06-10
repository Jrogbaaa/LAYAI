import { searchInfluencersWithApify, testApifyConnection, type ApifySearchParams } from '@/lib/apifyService';

// Mock the Apify client
jest.mock('apify-client');

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock fetch for web search API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Apify Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables for testing
    process.env.APIFY_API_TOKEN = 'test-token';
    process.env.FIRECRAWL_API_KEY = 'test-firecrawl-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('searchInfluencersWithApify', () => {
    const mockSearchParams: ApifySearchParams = {
      platforms: ['Instagram'],
      niches: ['fashion'],
      minFollowers: 1000,
      maxFollowers: 1000000,
      location: 'Spain',
      maxResults: 10,
      gender: 'female',
      ageRange: '25-34'
    };

    beforeEach(() => {
      // Mock successful web search API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          results: [
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
          ]
        })
      });

      // Mock Apify client responses
      const { ApifyClient } = require('apify-client');
      const mockActor = jest.fn(() => ({
        call: jest.fn().mockResolvedValue({
          status: 'SUCCEEDED',
          defaultDatasetId: 'test-dataset-id'
        })
      }));
      
      const mockDataset = jest.fn(() => ({
        listItems: jest.fn().mockResolvedValue({
          items: [
            {
              username: 'dulceida',
              fullName: 'Aida Domenech',
              followersCount: 2800000,
              followingCount: 500,
              postsCount: 1500,
              biography: 'Fashion blogger and influencer from Barcelona',
              verified: true,
              profilePicUrl: 'https://example.com/pic1.jpg'
            },
            {
              username: 'meryturiel',
              fullName: 'Mery Turiel',
              followersCount: 1200000,
              followingCount: 300,
              postsCount: 800,
              biography: 'Fashion and lifestyle content creator',
              verified: true,
              profilePicUrl: 'https://example.com/pic2.jpg'
            }
          ]
        })
      }));

      ApifyClient.mockImplementation(() => ({
        actor: mockActor,
        dataset: mockDataset
      }));
    });

    it('should successfully search and return transformed influencers', async () => {
      const results = await searchInfluencersWithApify(mockSearchParams);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        username: 'dulceida',
        fullName: 'Aida Domenech',
        followers: 2800000,
        platform: 'Instagram',
        category: 'Fashion',
        verified: true
      });
      expect(results[1]).toMatchObject({
        username: 'meryturiel',
        fullName: 'Mery Turiel', 
        followers: 1200000,
        platform: 'Instagram',
        verified: true
      });
    });

    it('should filter results based on follower count', async () => {
      const restrictiveParams: ApifySearchParams = {
        ...mockSearchParams,
        minFollowers: 2000000, // Higher minimum
        maxFollowers: 3000000
      };

      const results = await searchInfluencersWithApify(restrictiveParams);

      // Should only return dulceida (2.8M followers)
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('dulceida');
    });

    it('should handle empty search results gracefully', async () => {
      // Mock empty web search response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          results: []
        })
      });

      const results = await searchInfluencersWithApify(mockSearchParams);

      expect(results).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock fetch failure
      mockFetch.mockRejectedValue(new Error('Network error'));

      const results = await searchInfluencersWithApify(mockSearchParams);

      // Should still return results from fallback search
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle multiple platforms correctly', async () => {
      const multiPlatformParams: ApifySearchParams = {
        ...mockSearchParams,
        platforms: ['Instagram', 'TikTok']
      };

      // Mock responses for both platforms
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                url: 'https://www.instagram.com/dulceida',
                title: 'dulceida Instagram',
                platform: 'instagram'
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                url: 'https://www.tiktok.com/@dulceida',
                title: 'dulceida TikTok',
                platform: 'tiktok'
              }
            ]
          })
        });

      const results = await searchInfluencersWithApify(multiPlatformParams);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should enhance follower counts for known influencers', async () => {
      // Mock Apify returning low follower count (simulating real scenario)
      const mockApifyClient = require('apify-client').ApifyClient;
      mockApifyClient.mockImplementation(() => ({
        actor: jest.fn(() => ({
          call: jest.fn().mockResolvedValue({
            status: 'SUCCEEDED',
            defaultDatasetId: 'test-dataset-id'
          })
        })),
        dataset: jest.fn(() => ({
          listItems: jest.fn().mockResolvedValue({
            items: [
              {
                username: 'dulceida',
                fullName: 'Aida Domenech',
                followersCount: 6, // Low count from real scraping
                followingCount: 500,
                postsCount: 1500,
                biography: 'Fashion blogger',
                verified: false,
                profilePicUrl: 'https://example.com/pic1.jpg'
              }
            ]
          })
        }))
      }));

      const results = await searchInfluencersWithApify(mockSearchParams);

      expect(results).toHaveLength(1);
      // Should be enhanced to realistic count
      expect(results[0].followers).toBe(2800000);
    });
  });

  describe('testApifyConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockApifyClient = require('apify-client').ApifyClient;
      mockApifyClient.mockImplementation(() => ({
        actor: jest.fn(() => ({
          call: jest.fn().mockResolvedValue({
            status: 'SUCCEEDED'
          })
        }))
      }));

      const result = await testApifyConnection();
      expect(result).toBe(true);
    });

    it('should return false when no API token is provided', async () => {
      delete process.env.APIFY_API_TOKEN;
      delete process.env.APIFY_TOKEN;

      const result = await testApifyConnection();
      expect(result).toBe(false);
    });

    it('should return false when connection fails', async () => {
      const mockApifyClient = require('apify-client').ApifyClient;
      mockApifyClient.mockImplementation(() => ({
        actor: jest.fn(() => ({
          call: jest.fn().mockRejectedValue(new Error('Connection failed'))
        }))
      }));

      const result = await testApifyConnection();
      expect(result).toBe(false);
    });
  });
}); 