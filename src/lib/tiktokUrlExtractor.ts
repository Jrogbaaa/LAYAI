/**
 * TikTok URL Extraction Utility
 * Handles comprehensive TikTok URL parsing and username extraction
 */

export interface TikTokUrlInfo {
  username: string;
  isValid: boolean;
  originalUrl: string;
  normalizedUrl: string;
  urlType: 'profile' | 'video' | 'live' | 'share' | 'unknown';
  videoId?: string;
  errors?: string[];
}

export interface TikTokUrlExtractionResult {
  success: boolean;
  data?: TikTokUrlInfo;
  error?: string;
}

/**
 * Comprehensive TikTok URL patterns that we need to handle
 */
const TIKTOK_URL_PATTERNS = {
  // Video URLs (contain username and video ID) - check first to match before profile
  VIDEO_STANDARD: /^https?:\/\/(www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)\/video\/(\d+)(?:[/?].*)?$/,
  
  // Live URLs - check before profile  
  LIVE_URL: /^https?:\/\/(www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)\/live(?:[/?].*)?$/,
  
  // Standard profile URLs - check after video and live
  PROFILE_STANDARD: /^https?:\/\/(www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)(?:[/?].*)?$/,
  
  // Short share URLs (vm.tiktok.com)
  SHORT_SHARE: /^https?:\/\/vm\.tiktok\.com\/([a-zA-Z0-9]+)\/?$/,
  
  // Modern share URLs (www.tiktok.com/t/)
  MODERN_SHARE: /^https?:\/\/(www\.)?tiktok\.com\/t\/([a-zA-Z0-9]+)\/?$/,
  
  // Discovery URLs (not profile-specific) - check before profile to prevent false matches
  DISCOVER_URL: /^https?:\/\/(www\.)?tiktok\.com\/discover\/([^/?]+)(?:\/.*)?$/,
  
  // Discovery/hashtag URLs (not profile-specific)
  HASHTAG_URL: /^https?:\/\/(www\.)?tiktok\.com\/tag\/([^/?]+)(?:\/.*)?$/,
  
  // Sound/music URLs (not profile-specific)
  SOUND_URL: /^https?:\/\/(www\.)?tiktok\.com\/music\/([^/?]+)(?:\/.*)?$/,
  
  // Trending/foryou URLs (not profile-specific)
  TRENDING_URL: /^https?:\/\/(www\.)?tiktok\.com\/(trending|foryou|following)(?:\/.*)?$/,
  
  // Search URLs (not profile-specific)
  SEARCH_URL: /^https?:\/\/(www\.)?tiktok\.com\/search\?q=([^&]+)(?:&.*)?$/
};

/**
 * Valid TikTok username patterns
 */
const USERNAME_VALIDATION = {
  // Username must be 1-24 characters, alphanumeric + periods + underscores
  VALID_PATTERN: /^[a-zA-Z0-9._]{1,24}$/,
  
  // Cannot start or end with periods/underscores
  INVALID_START_END: /^[._]|[._]$/,
  
  // Cannot have consecutive periods/underscores
  CONSECUTIVE_SPECIAL: /[._]{2,}/,
  
  // Reserved/system usernames to exclude
  RESERVED_USERNAMES: [
    'www', 'api', 'admin', 'support', 'help', 'tiktok', 'bytedance',
    'discover', 'trending', 'foryou', 'live', 'music', 'tag', 'share',
    't', 'v', 'vm', 'embed', 'oembed'
  ]
};

/**
 * Extract username and metadata from TikTok URL
 */
export function extractTikTokUrl(url: string): TikTokUrlExtractionResult {
  try {
    // Clean and normalize URL
    const cleanUrl = cleanTikTokUrl(url);
    
    // Try to match against known patterns
    const urlInfo = matchTikTokUrl(cleanUrl);
    
    if (!urlInfo) {
      return {
        success: false,
        error: 'URL does not match any known TikTok URL pattern'
      };
    }

    // Check if this is a share URL or other non-extractable URL type
    if (!urlInfo.isValid) {
      return {
        success: false,
        error: urlInfo.errors?.join('; ') || 'Unable to process this URL type'
      };
    }

    // Validate username if extracted
    if (urlInfo.username) {
      const validation = validateTikTokUsername(urlInfo.username);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid TikTok username: ${validation.errors?.join(', ')}`
        };
      }
    }

    return {
      success: true,
      data: urlInfo
    };

  } catch (error) {
    return {
      success: false,
      error: `URL parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Clean and normalize TikTok URL
 */
function cleanTikTokUrl(url: string): string {
  // Remove whitespace and convert to lowercase for processing
  let cleaned = url.trim();
  
  // Add protocol if missing
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  
  // Handle mobile URLs (m.tiktok.com -> www.tiktok.com) but preserve vm.tiktok.com
  cleaned = cleaned.replace(/\/\/m\.tiktok\.com/g, '//www.tiktok.com');
  
  // Remove unnecessary parameters while preserving essential ones
  try {
    const urlObj = new URL(cleaned);
    
    // Remove tracking and analytics parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', '_nc_ht', 'checksum', 'dry_run', 'source'
    ];
    
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Keep important parameters like lang
    cleaned = urlObj.toString();
  } catch {
    // If URL parsing fails, continue with original cleaned URL
  }
  
  return cleaned;
}

/**
 * Match URL against TikTok patterns and extract information
 */
function matchTikTokUrl(url: string): TikTokUrlInfo | null {
  // Try video URL pattern first (more specific)
  const videoMatch = url.match(TIKTOK_URL_PATTERNS.VIDEO_STANDARD);
  if (videoMatch) {
    const username = videoMatch[2];
    const videoId = videoMatch[3];
    return {
      username,
      isValid: true,
      originalUrl: url,
      normalizedUrl: `https://www.tiktok.com/@${username}`,
      urlType: 'video',
      videoId
    };
  }

  // Try live URL pattern
  const liveMatch = url.match(TIKTOK_URL_PATTERNS.LIVE_URL);
  if (liveMatch) {
    const username = liveMatch[2];
    return {
      username,
      isValid: true,
      originalUrl: url,
      normalizedUrl: `https://www.tiktok.com/@${username}`,
      urlType: 'live'
    };
  }

  // Handle share URLs (these require resolution to get username)
  const shortShareMatch = url.match(TIKTOK_URL_PATTERNS.SHORT_SHARE);
  if (shortShareMatch) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'share',
      errors: ['Share URLs require resolution to extract username - use resolveTikTokShareUrl()']
    };
  }

  const modernShareMatch = url.match(TIKTOK_URL_PATTERNS.MODERN_SHARE);
  if (modernShareMatch) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'share',
      errors: ['Share URLs require resolution to extract username - use resolveTikTokShareUrl()']
    };
  }

  // Handle non-profile URLs (check BEFORE profile pattern to prevent false matches)
  if (url.match(TIKTOK_URL_PATTERNS.DISCOVER_URL)) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'unknown',
      errors: ['Discovery URLs do not contain profile information']
    };
  }

  if (url.match(TIKTOK_URL_PATTERNS.HASHTAG_URL)) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'unknown',
      errors: ['Hashtag URLs do not contain profile information']
    };
  }

  if (url.match(TIKTOK_URL_PATTERNS.SOUND_URL)) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'unknown',
      errors: ['Sound URLs do not contain profile information']
    };
  }

  if (url.match(TIKTOK_URL_PATTERNS.TRENDING_URL)) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'unknown',
      errors: ['Trending/feed URLs do not contain profile information']
    };
  }

  if (url.match(TIKTOK_URL_PATTERNS.SEARCH_URL)) {
    return {
      username: '',
      isValid: false,
      originalUrl: url,
      normalizedUrl: url,
      urlType: 'unknown',
      errors: ['Search URLs do not contain profile information']
    };
  }

  // Try profile URL pattern last (most general)
  const profileMatch = url.match(TIKTOK_URL_PATTERNS.PROFILE_STANDARD);
  if (profileMatch) {
    const username = profileMatch[2];
    return {
      username,
      isValid: true,
      originalUrl: url,
      normalizedUrl: `https://www.tiktok.com/@${username}`,
      urlType: 'profile'
    };
  }

  return null;
}

/**
 * Validate TikTok username
 */
function validateTikTokUsername(username: string): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // Check basic requirements
  if (!username || username.length === 0) {
    errors.push('Username cannot be empty');
    return { isValid: false, errors };
  }

  // Check length and basic pattern (more lenient)
  if (username.length > 24) {
    errors.push('Username must be 24 characters or less');
  }

  // Allow alphanumeric + periods + underscores (more lenient pattern)
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, periods, and underscores');
  }

  // Check for invalid start/end characters (less strict - allow more patterns)
  if (/^[._]{2,}|[._]{2,}$/.test(username)) {
    errors.push('Username cannot start or end with multiple periods or underscores');
  }

  // Check for excessive consecutive special characters
  if (/[._]{4,}/.test(username)) {
    errors.push('Username cannot contain 4 or more consecutive periods or underscores');
  }

  // Check against reserved usernames (reduced list)
  const restrictedUsernames = ['www', 'api', 'admin', 'tiktok', 'discover', 'trending'];
  if (restrictedUsernames.includes(username.toLowerCase())) {
    errors.push('Username is reserved and cannot be used');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Extract multiple TikTok URLs from text
 */
export function extractAllTikTokUrls(text: string): TikTokUrlExtractionResult[] {
  const results: TikTokUrlExtractionResult[] = [];
  
  // Comprehensive URL detection pattern for TikTok
  const urlPattern = /https?:\/\/((?:www\.|vm\.|m\.)?tiktok\.com\/[^\s<>"']+)/gi;
  
  let match;
  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0];
    const result = extractTikTokUrl(url);
    results.push(result);
  }
  
  return results;
}

/**
 * Resolve TikTok share URL to get the actual profile URL
 * Note: This requires making an HTTP request to follow redirects
 */
export async function resolveTikTokShareUrl(shareUrl: string): Promise<TikTokUrlExtractionResult> {
  try {
    // Check if it's actually a share URL
    const isShortShare = TIKTOK_URL_PATTERNS.SHORT_SHARE.test(shareUrl);
    const isModernShare = TIKTOK_URL_PATTERNS.MODERN_SHARE.test(shareUrl);
    
    if (!isShortShare && !isModernShare) {
      return {
        success: false,
        error: 'URL is not a TikTok share URL'
      };
    }

    // In a real implementation, you would make an HTTP request here
    // For now, return a placeholder that indicates manual resolution is needed
    return {
      success: false,
      error: 'Share URL resolution requires HTTP request - implement with fetch() to follow redirects'
    };

  } catch (error) {
    return {
      success: false,
      error: `Error resolving share URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate TikTok profile URL from username
 */
export function generateTikTokProfileUrl(username: string): string {
  // Clean username (remove @ if present)
  const cleanUsername = username.replace(/^@/, '');
  
  // Validate username
  const validation = validateTikTokUsername(cleanUsername);
  if (!validation.isValid) {
    throw new Error(`Invalid TikTok username: ${validation.errors?.join(', ')}`);
  }
  
  return `https://www.tiktok.com/@${cleanUsername}`;
}

/**
 * Utility function for backward compatibility with existing code
 */
export function extractTikTokUsername(url: string): string {
  const result = extractTikTokUrl(url);
  
  if (result.success && result.data?.username) {
    return result.data.username;
  }
  
  // Fallback to 'unknown' for backward compatibility
  return 'unknown';
}

/**
 * Check if a URL is a valid TikTok URL
 */
export function isTikTokUrl(url: string): boolean {
  try {
    const cleanUrl = cleanTikTokUrl(url);
    
    // Test against all TikTok URL patterns
    return Object.values(TIKTOK_URL_PATTERNS).some(pattern => pattern.test(cleanUrl)) ||
           // Also check basic TikTok domain pattern for any TikTok URL
           /^https?:\/\/(www\.|m\.|vm\.)?tiktok\.com/i.test(cleanUrl);
  } catch {
    return false;
  }
}

/**
 * Get TikTok URL type without full extraction
 */
export function getTikTokUrlType(url: string): 'profile' | 'video' | 'live' | 'share' | 'unknown' | null {
  try {
    const cleanUrl = cleanTikTokUrl(url);
    
    // Check in order of specificity
    if (TIKTOK_URL_PATTERNS.VIDEO_STANDARD.test(cleanUrl)) return 'video';
    if (TIKTOK_URL_PATTERNS.LIVE_URL.test(cleanUrl)) return 'live';
    if (TIKTOK_URL_PATTERNS.SHORT_SHARE.test(cleanUrl) || TIKTOK_URL_PATTERNS.MODERN_SHARE.test(cleanUrl)) return 'share';
    if (TIKTOK_URL_PATTERNS.HASHTAG_URL.test(cleanUrl) || TIKTOK_URL_PATTERNS.SOUND_URL.test(cleanUrl)) return 'unknown';
    if (TIKTOK_URL_PATTERNS.PROFILE_STANDARD.test(cleanUrl)) return 'profile';
    
    // If it's a TikTok domain but doesn't match patterns, check if it's TikTok-related
    if (/^https?:\/\/(www\.|m\.|vm\.)?tiktok\.com/i.test(cleanUrl)) {
      return 'unknown';
    }
    
    return null;
  } catch {
    return null;
  }
} 