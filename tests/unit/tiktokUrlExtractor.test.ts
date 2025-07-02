import { describe, it, expect } from '@jest/globals';
import { 
  extractTikTokUrl, 
  extractTikTokUsername, 
  extractAllTikTokUrls, 
  generateTikTokProfileUrl,
  isTikTokUrl,
  getTikTokUrlType
} from '../../src/lib/tiktokUrlExtractor';

describe('TikTok URL Extraction Utility', () => {
  
  describe('extractTikTokUrl', () => {
    it('should extract username from standard profile URL', () => {
      const url = 'https://www.tiktok.com/@username123';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('username123');
      expect(result.data?.urlType).toBe('profile');
      expect(result.data?.normalizedUrl).toBe('https://www.tiktok.com/@username123');
    });

    it('should extract username from video URL', () => {
      const url = 'https://www.tiktok.com/@testuser/video/7123456789012345678';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('testuser');
      expect(result.data?.urlType).toBe('video');
      expect(result.data?.videoId).toBe('7123456789012345678');
      expect(result.data?.normalizedUrl).toBe('https://www.tiktok.com/@testuser');
    });

    it('should extract username from live URL', () => {
      const url = 'https://www.tiktok.com/@liveuser/live';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('liveuser');
      expect(result.data?.urlType).toBe('live');
      expect(result.data?.normalizedUrl).toBe('https://www.tiktok.com/@liveuser');
    });

    it('should handle URLs without www', () => {
      const url = 'https://tiktok.com/@noWwwUser';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('noWwwUser');
      expect(result.data?.urlType).toBe('profile');
    });

    it('should handle URLs with additional parameters', () => {
      const url = 'https://www.tiktok.com/@user_with_params?lang=en&utm_source=test';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('user_with_params');
      expect(result.data?.urlType).toBe('profile');
    });

    it('should identify share URLs but not extract username', () => {
      const url = 'https://vm.tiktok.com/ZM123ABC';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Share URLs require resolution');
    });

    it('should identify modern share URLs', () => {
      const url = 'https://www.tiktok.com/t/ZM123ABC/';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Share URLs require resolution');
    });

    it('should reject invalid usernames', () => {
      const url = 'https://www.tiktok.com/@_invalid_start_';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid TikTok username');
    });

    it('should reject reserved usernames', () => {
      const url = 'https://www.tiktok.com/@admin';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Username is reserved');
    });

    it('should handle mobile URLs', () => {
      const url = 'https://m.tiktok.com/@mobile_user';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('mobile_user');
      expect(result.data?.normalizedUrl).toBe('https://www.tiktok.com/@mobile_user');
    });

    it('should clean tracking parameters from URLs', () => {
      const url = 'https://www.tiktok.com/@user123?utm_source=test&fbclid=123&gclid=456&lang=en';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('user123');
      // The cleaned URL should preserve important params like lang but remove tracking
      expect(result.data?.originalUrl).toContain('lang=en');
      expect(result.data?.originalUrl).not.toContain('utm_source');
      expect(result.data?.originalUrl).not.toContain('fbclid');
    });

    it('should reject TikTok discovery URLs', () => {
      const discoveryUrls = [
        'https://www.tiktok.com/discover/tik-tokers-gym-espa%C3%B1a',
        'https://www.tiktok.com/discover/fitness-madrid',
        'https://www.tiktok.com/discover/influencers-fitness',
        'https://tiktok.com/discover/trending-topic'
      ];
      
      discoveryUrls.forEach(url => {
        const result = extractTikTokUrl(url);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Discovery URLs do not contain profile information');
      });
    });

    it('should reject TikTok trending and search URLs', () => {
      const nonProfileUrls = [
        'https://www.tiktok.com/trending',
        'https://www.tiktok.com/foryou',
        'https://www.tiktok.com/following',
        'https://www.tiktok.com/search?q=fitness+madrid',
        'https://tiktok.com/trending',
        'https://tiktok.com/search?q=influencers'
      ];
      
      nonProfileUrls.forEach(url => {
        const result = extractTikTokUrl(url);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/(Trending\/feed URLs|Search URLs) do not contain profile information/);
      });
    });

    it('should handle edge cases in discovery URL patterns', () => {
      const edgeCases = [
        'https://www.tiktok.com/discover/fitness-park-madrid-principe-pio-influencer-pelo-blanco',
        'https://www.tiktok.com/discover/fitness-park-madrid-principe-pio-influencer-proxis',
        'https://www.tiktok.com/discover/influenciadora-fitness-%C3%A1rabe-leana'
      ];
      
      edgeCases.forEach(url => {
        const result = extractTikTokUrl(url);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Discovery URLs do not contain profile information');
      });
    });
  });

  describe('extractTikTokUsername', () => {
    it('should extract username from valid URL', () => {
      const url = 'https://www.tiktok.com/@test_user_123';
      const username = extractTikTokUsername(url);
      
      expect(username).toBe('test_user_123');
    });

    it('should return "unknown" for invalid URLs', () => {
      const url = 'https://invalid-url.com/not-tiktok';
      const username = extractTikTokUsername(url);
      
      expect(username).toBe('unknown');
    });

    it('should handle URLs with periods and underscores', () => {
      const url = 'https://www.tiktok.com/@user.name_123';
      const username = extractTikTokUsername(url);
      
      expect(username).toBe('user.name_123');
    });
  });

  describe('extractAllTikTokUrls', () => {
    it('should extract multiple TikTok URLs from text', () => {
      const text = `
        Check out these TikTok profiles:
        https://www.tiktok.com/@user1
        Visit https://www.tiktok.com/@user2/video/123456789 for cool videos
        And don't miss https://tiktok.com/@user3
      `;
      
      const results = extractAllTikTokUrls(text);
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].data?.username).toBe('user1');
      expect(results[1].success).toBe(true);
      expect(results[1].data?.username).toBe('user2');
      expect(results[2].success).toBe(true);
      expect(results[2].data?.username).toBe('user3');
    });

    it('should return empty array for text without TikTok URLs', () => {
      const text = 'This text has no TikTok URLs, just Instagram https://instagram.com/user';
      const results = extractAllTikTokUrls(text);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('generateTikTokProfileUrl', () => {
    it('should generate valid profile URL from username', () => {
      const username = 'test_user_123';
      const url = generateTikTokProfileUrl(username);
      
      expect(url).toBe('https://www.tiktok.com/@test_user_123');
    });

    it('should handle username with @ prefix', () => {
      const username = '@test_user_123';
      const url = generateTikTokProfileUrl(username);
      
      expect(url).toBe('https://www.tiktok.com/@test_user_123');
    });

    it('should throw error for invalid username', () => {
      const username = '_invalid_start_';
      
      expect(() => generateTikTokProfileUrl(username)).toThrow('Invalid TikTok username');
    });

    it('should throw error for reserved username', () => {
      const username = 'admin';
      
      expect(() => generateTikTokProfileUrl(username)).toThrow('Username is reserved');
    });
  });

  describe('isTikTokUrl', () => {
    it('should return true for valid TikTok URLs', () => {
      const validUrls = [
        'https://www.tiktok.com/@user',
        'https://tiktok.com/@user',
        'https://www.tiktok.com/@user/video/123',
        'https://vm.tiktok.com/ABC123',
        'https://www.tiktok.com/t/ABC123',
        'https://m.tiktok.com/@user',
        'https://www.tiktok.com/@user/live'
      ];
      
      validUrls.forEach(url => {
        expect(isTikTokUrl(url)).toBe(true);
      });
    });

    it('should return false for non-TikTok URLs', () => {
      const invalidUrls = [
        'https://www.instagram.com/@user',
        'https://www.youtube.com/@user',
        'https://twitter.com/user',
        'https://www.google.com',
        'not-a-url-at-all',
        ''
      ];
      
      invalidUrls.forEach(url => {
        expect(isTikTokUrl(url)).toBe(false);
      });
    });
  });

  describe('getTikTokUrlType', () => {
    it('should correctly identify URL types', () => {
      const testCases = [
        { url: 'https://www.tiktok.com/@user', expected: 'profile' },
        { url: 'https://www.tiktok.com/@user/video/123', expected: 'video' },
        { url: 'https://www.tiktok.com/@user/live', expected: 'live' },
        { url: 'https://vm.tiktok.com/ABC123', expected: 'share' },
        { url: 'https://www.tiktok.com/t/ABC123', expected: 'share' },
        { url: 'https://www.tiktok.com/tag/hashtag', expected: 'unknown' },
        { url: 'https://www.tiktok.com/music/song', expected: 'unknown' }
      ];
      
      testCases.forEach(({ url, expected }) => {
        expect(getTikTokUrlType(url)).toBe(expected);
      });
    });

    it('should return null for non-TikTok URLs', () => {
      expect(getTikTokUrlType('https://www.instagram.com/@user')).toBe(null);
      expect(getTikTokUrlType('invalid-url')).toBe(null);
    });
  });

  describe('Edge Cases and Real-World Examples', () => {
    it('should handle real Spanish TikTok influencer URLs', () => {
      const urls = [
        'https://www.tiktok.com/@thegrefg',
        'https://www.tiktok.com/@dulceida',
        'https://www.tiktok.com/@meryturiel',
        'https://www.tiktok.com/@agustin51'
      ];
      
      urls.forEach(url => {
        const result = extractTikTokUrl(url);
        expect(result.success).toBe(true);
        expect(result.data?.urlType).toBe('profile');
        expect(result.data?.username).toBeTruthy();
      });
    });

    it('should handle URLs with various valid username patterns', () => {
      const usernames = [
        'user123',
        'user_name',
        'user.name',
        'user123.name_test',
        'a',  // minimum length
        'a'.repeat(24)  // maximum length
      ];
      
      usernames.forEach(username => {
        const url = `https://www.tiktok.com/@${username}`;
        const result = extractTikTokUrl(url);
        expect(result.success).toBe(true);
        expect(result.data?.username).toBe(username);
      });
    });

    it('should reject URLs with invalid username patterns', () => {
      const invalidUsernames = [
        '.startswith.dot',
        'endswith.dot.',
        '_startswith_underscore',
        'endswith_underscore_',
        'consecutive..dots',
        'consecutive__underscores',
        'a'.repeat(25),  // too long
        '',  // empty
        'user@with@at'  // invalid characters
      ];
      
      invalidUsernames.forEach(username => {
        const url = `https://www.tiktok.com/@${username}`;
        const result = extractTikTokUrl(url);
        expect(result.success).toBe(false);
      });
    });

    it('should handle URLs without protocol', () => {
      const url = 'www.tiktok.com/@user123';
      const result = extractTikTokUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('user123');
    });
  });
}); 