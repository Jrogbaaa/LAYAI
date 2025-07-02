import { ApifyClient } from 'apify-client';
import { extractTikTokUsername, isTikTokUrl } from './tiktokUrlExtractor';

interface ProfileVerificationRequest {
  profileUrl: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
  searchCriteria: {
    minAge?: number;
    maxAge?: number;
    location?: string;
    gender?: 'male' | 'female' | 'any';
    niches?: string[];
    brandName?: string;
    minFollowers?: number;
    maxFollowers?: number;
  };
}

interface VerificationResult {
  profileUrl: string;
  platform: string;
  verified: boolean;
  confidence: number; // 0-1 confidence score
  extractedData: {
    username: string;
    displayName?: string;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    bio?: string;
    location?: string;
    website?: string;
    profilePictureUrl?: string;
    isVerified?: boolean;
    recentPosts?: Array<{
      content: string;
      likes: number;
      comments: number;
      hashtags: string[];
    }>;
  };
  matchAnalysis: {
    nicheAlignment: {
      score: number;
      matchedKeywords: string[];
      explanation: string;
    };
    demographicMatch: {
      score: number;
      estimatedAge?: number;
      estimatedGender?: string;
      locationMatch: boolean;
      explanation: string;
    };
    brandCompatibility: {
      score: number;
      reasons: string[];
      redFlags: string[];
    };
    followerValidation: {
      score: number;
      inRange: boolean;
      quality: 'low' | 'medium' | 'high';
      explanation: string;
    };
  };
  overallScore: number; // Weighted final score 0-100
  errors?: string[];
  scrapedAt: Date;
}

class ProfileVerificationService {
  private apifyClient: ApifyClient;
  private rateLimiter: Map<string, number> = new Map();
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests per domain
  
  // Enhanced Spanish location detection database
  private readonly SPANISH_LOCATIONS = {
    // Major cities
    cities: [
      'madrid', 'barcelona', 'valencia', 'sevilla', 'seville', 'zaragoza', 'málaga', 'malaga',
      'murcia', 'palma', 'las palmas', 'bilbao', 'alicante', 'córdoba', 'cordoba', 'valladolid',
      'vigo', 'gijón', 'gijon', 'hospitalet', 'vitoria', 'granada', 'oviedo', 'badalona',
      'cartagena', 'terrassa', 'jerez', 'sabadell', 'móstoles', 'mostoles', 'santa cruz',
      'pamplona', 'almería', 'almeria', 'fuenlabrada', 'leganés', 'leganes', 'donostia',
      'san sebastián', 'san sebastian', 'burgos', 'santander', 'castellón', 'castellon',
      'alcorcón', 'alcorcon', 'albacete', 'getafe', 'salamanca', 'huelva', 'logroño', 'logrono',
      'badajoz', 'tarragona', 'lleida', 'marbella', 'león', 'leon', 'cádiz', 'cadiz',
      'dos hermanas', 'torrejon', 'parla', 'mataró', 'mataro', 'algeciras', 'reus', 'ourense',
      'santiago', 'lugo', 'girona', 'cáceres', 'caceres', 'lorca', 'coslada', 'talavera',
      'el puerto', 'cornellà', 'cornella', 'avilés', 'aviles', 'palencia', 'galdakao',
      'torrent', 'torrevieja', 'chiclana', 'manresa', 'ferrol', 'vélez', 'velez', 'gandía', 'gandia'
    ],
    
    // Autonomous communities and regions
    regions: [
      'andalucía', 'andalucia', 'cataluña', 'catalunya', 'madrid', 'valencia', 'galicia',
      'castilla y león', 'castilla y leon', 'país vasco', 'pais vasco', 'euskadi', 'canarias',
      'castilla-la mancha', 'murcia', 'aragón', 'aragon', 'extremadura', 'asturias',
      'navarra', 'cantabria', 'la rioja', 'baleares', 'ceuta', 'melilla'
    ],
    
    // Spanish language indicators
    languageIndicators: [
      'español', 'española', 'spanish', 'spain', 'españa', 'madrid', 'barcelona',
      'hablo español', 'de españa', 'spanish girl', 'spanish boy', 'española',
      'vivo en', 'desde', 'nacida en', 'nacido en', 'spanish influencer'
    ],
    
    // Cultural and contextual markers
    culturalMarkers: [
      'paella', 'flamenco', 'siesta', 'tapas', 'jamón', 'jamon', 'sangría', 'sangria',
      'real madrid', 'fc barcelona', 'barça', 'barca', 'atletico', 'sevilla fc',
      'la liga', 'el clasico', 'feria', 'semana santa', 'san fermin', 'camino',
      'costa del sol', 'costa brava', 'islas baleares', 'canary islands', 'tenerife',
      'mallorca', 'ibiza', 'formentera', 'gran canaria', 'lanzarote', 'fuerteventura'
    ],
    
    // Spanish postal codes pattern
    postalCodePattern: /\b\d{5}\b/g, // Spanish postal codes are 5 digits
    
    // Spanish phone patterns
    phonePatterns: [
      /\+34\s?\d{3}\s?\d{3}\s?\d{3}/, // +34 format
      /\b6\d{8}\b/, // Mobile numbers starting with 6
      /\b7\d{8}\b/, // Mobile numbers starting with 7
      /\b9\d{8}\b/  // Landline numbers starting with 9
    ]
  };

  // Enhanced age detection patterns
  private readonly AGE_PATTERNS = {
    // Direct age mentions
    directAge: [
      /(\d{1,2})\s*(?:años?|years?|yo|y\.?o\.?|age)/i,
      /age\s*:?\s*(\d{1,2})/i,
      /(\d{1,2})\s*(?:year|yr)s?\s*old/i,
      /born\s*(?:in\s*)?(?:19|20)(\d{2})/i,
      /(\d{1,2})\s*(?:añitos|añita)/i // Spanish diminutives
    ],
    
    // Birth year patterns
    birthYear: [
      /(?:born|nacida?|nací)\s*(?:en\s*)?(?:19|20)(\d{2})/i,
      /(?:19|20)(\d{2})\s*(?:baby|kid|born)/i,
      /class\s*(?:of\s*)?(?:19|20)(\d{2})/i,
      /graduated?\s*(?:19|20)(\d{2})/i
    ],
    
    // Generation indicators
    generationMarkers: {
      'gen z': { minAge: 18, maxAge: 27 },
      'generation z': { minAge: 18, maxAge: 27 },
      'millennial': { minAge: 28, maxAge: 43 },
      'gen y': { minAge: 28, maxAge: 43 },
      'zoomer': { minAge: 18, maxAge: 27 },
      'boomer': { minAge: 58, maxAge: 77 }
    },
    
    // Life stage indicators
    lifeStageMarkers: {
      'university': { minAge: 18, maxAge: 25 },
      'college': { minAge: 18, maxAge: 25 },
      'student': { minAge: 16, maxAge: 25 },
      'teenager': { minAge: 13, maxAge: 19 },
      'teen': { minAge: 13, maxAge: 19 },
      'high school': { minAge: 14, maxAge: 18 },
      'married': { minAge: 20, maxAge: 60 },
      'mom': { minAge: 18, maxAge: 55 },
      'mother': { minAge: 18, maxAge: 55 },
      'mama': { minAge: 18, maxAge: 55 },
      'dad': { minAge: 18, maxAge: 60 },
      'father': { minAge: 18, maxAge: 60 },
      'papa': { minAge: 18, maxAge: 60 },
      'grandmother': { minAge: 45, maxAge: 85 },
      'grandfather': { minAge: 45, maxAge: 85 },
      'abuela': { minAge: 45, maxAge: 85 },
      'abuelo': { minAge: 45, maxAge: 85 },
      'retired': { minAge: 60, maxAge: 85 }
    }
  };

  constructor() {
    this.apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
  }

  /**
   * Verify a single profile against search criteria
   */
  async verifyProfile(request: ProfileVerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Starting verification for: ${request.profileUrl}`);
      
      // Rate limiting
      await this.enforceRateLimit(request.platform);
      
      // Scrape profile data
      const extractedData = await this.scrapeProfile(request.profileUrl, request.platform);
      
      if (!extractedData) {
        return this.createFailedResult(request, 'Failed to scrape profile data');
      }
      
      // Analyze the scraped data against criteria
      const matchAnalysis = await this.analyzeProfileMatch(extractedData, request.searchCriteria);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(matchAnalysis);
      
      const result: VerificationResult = {
        profileUrl: request.profileUrl,
        platform: request.platform,
        verified: overallScore >= 70, // 70% threshold for verification
        confidence: Math.min(overallScore / 100, 1),
        extractedData,
        matchAnalysis,
        overallScore,
        scrapedAt: new Date()
      };
      
      console.log(`✅ Verification completed in ${Date.now() - startTime}ms. Score: ${overallScore}/100`);
      return result;
      
    } catch (error) {
      console.error(`❌ Verification failed for ${request.profileUrl}:`, error);
      return this.createFailedResult(request, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Verify multiple profiles in batches - OPTIMIZED FOR PARALLEL PROCESSING
   */
  async verifyProfiles(requests: ProfileVerificationRequest[]): Promise<VerificationResult[]> {
    console.log(`🔍 Starting OPTIMIZED batch verification of ${requests.length} profiles`);
    
    const results: VerificationResult[] = [];
    
    // Dynamic batch sizing based on total profiles
    const getDynamicBatchSize = (totalCount: number) => {
      if (totalCount <= 10) return Math.min(totalCount, 8); // Small batches for small counts
      if (totalCount <= 50) return 15; // Medium batches
      return 25; // Large batches for big searches
    };
    
    const batchSize = getDynamicBatchSize(requests.length);
    const totalBatches = Math.ceil(requests.length / batchSize);
    
    console.log(`⚡ Using dynamic batch size: ${batchSize} profiles per batch (${totalBatches} total batches)`);
    
    // Process batches with reduced delays
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} profiles)`);
      
      const startTime = Date.now();
      
      // Process all profiles in batch concurrently
      const batchPromises = batch.map(async (request) => {
        try {
          return await this.verifyProfile(request);
        } catch (error) {
          console.error(`Verification failed for ${request.profileUrl}:`, error);
          return this.createFailedResult(request, error instanceof Error ? error.message : 'Unknown error');
        }
      });
      
      // Wait for all profiles in batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch verification error:', result.reason);
        }
      });
      
      const batchTime = Date.now() - startTime;
      console.log(`✅ Batch ${batchNumber} completed in ${batchTime}ms (${Math.round(batchTime / batch.length)}ms per profile)`);
      
      // Reduced delay between batches - only delay for large batches
      if (i + batchSize < requests.length && batchSize >= 15) {
        const delay = Math.min(1500, batchSize * 50); // Shorter, proportional delays
        console.log(`⏱️ Brief delay: ${delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const verifiedCount = results.filter(r => r.verified).length;
    const avgScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length) : 0;
    
    console.log(`🎯 OPTIMIZED batch verification completed:`);
    console.log(`   - Total processed: ${results.length}/${requests.length} profiles`);
    console.log(`   - Successfully verified: ${verifiedCount} profiles`);
    console.log(`   - Average quality score: ${avgScore}/100`);
    
    return results;
  }

  /**
   * Scrape profile data using appropriate method for platform
   */
  private async scrapeProfile(url: string, platform: string): Promise<VerificationResult['extractedData'] | null> {
    switch (platform) {
      case 'instagram':
        return await this.scrapeInstagramProfile(url);
      case 'tiktok':
        return await this.scrapeTikTokProfile(url);
      case 'youtube':
        return await this.scrapeYouTubeProfile(url);
      case 'twitter':
        return await this.scrapeTwitterProfile(url);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Scrape Instagram profile using Apify
   */
  private async scrapeInstagramProfile(url: string): Promise<VerificationResult['extractedData'] | null> {
    try {
      console.log(`📸 Scraping Instagram profile: ${url}`);
      
      const input = {
        usernames: [this.extractUsernameFromUrl(url)],
        resultsType: 'profiles',
        resultsLimit: 1,
        searchType: 'hashtag',
        searchLimit: 5
      };

      const run = await this.apifyClient.actor('shu8hvrXbJbY3Eb9W').call(input);
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        console.log(`❌ No Instagram data found for ${url}`);
        return null;
      }

      const profile = items[0];
      
      return {
        username: String(profile.username || ''),
        displayName: profile.fullName ? String(profile.fullName) : undefined,
        followerCount: typeof profile.followersCount === 'number' ? profile.followersCount : undefined,
        followingCount: typeof profile.followsCount === 'number' ? profile.followsCount : undefined,
        postCount: typeof profile.postsCount === 'number' ? profile.postsCount : undefined,
        bio: profile.biography ? String(profile.biography) : undefined,
        location: profile.businessCategoryName ? String(profile.businessCategoryName) : undefined,
        website: profile.externalUrl ? String(profile.externalUrl) : undefined,
        profilePictureUrl: profile.profilePicUrl ? String(profile.profilePicUrl) : undefined,
        isVerified: Boolean(profile.verified),
        recentPosts: profile.latestPosts?.slice(0, 5).map((post: any) => ({
          content: post.caption ? String(post.caption) : '',
          likes: typeof post.likesCount === 'number' ? post.likesCount : 0,
          comments: typeof post.commentsCount === 'number' ? post.commentsCount : 0,
          hashtags: this.extractHashtags(post.caption ? String(post.caption) : '')
        })) || []
      };
      
    } catch (error) {
      console.error(`❌ Instagram scraping failed for ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape TikTok profile using Apify
   */
  private async scrapeTikTokProfile(url: string): Promise<VerificationResult['extractedData'] | null> {
    try {
      console.log(`🎵 Scraping TikTok profile: ${url}`);
      
      const username = this.extractUsernameFromUrl(url);
      const input = {
        profiles: [`https://www.tiktok.com/@${username}`],
        shouldDownloadVideos: false,
        resultsPerPage: 5
      };

      const run = await this.apifyClient.actor('clockworks/tiktok-scraper').call(input);
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        console.log(`❌ No TikTok data found for ${url}`);
        return null;
      }

      const profile = items[0];
      
      return {
        username: profile.authorMeta?.name || username,
        displayName: profile.authorMeta?.nickName,
        followerCount: profile.authorMeta?.fans,
        followingCount: profile.authorMeta?.following,
        postCount: profile.authorMeta?.video,
        bio: profile.authorMeta?.signature,
        profilePictureUrl: profile.authorMeta?.avatar,
        isVerified: profile.authorMeta?.verified,
        recentPosts: profile.collector?.slice(0, 5).map((post: any) => ({
          content: post.text || '',
          likes: post.diggCount || 0,
          comments: post.commentCount || 0,
          hashtags: this.extractHashtags(post.text || '')
        })) || []
      };
      
    } catch (error) {
      console.error(`❌ TikTok scraping failed for ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape YouTube profile using Apify
   */
  private async scrapeYouTubeProfile(url: string): Promise<VerificationResult['extractedData'] | null> {
    try {
      console.log(`📺 Scraping YouTube profile: ${url}`);
      
      const input = {
        startUrls: [{ url }],
        maxResults: 5
      };

      const run = await this.apifyClient.actor('streamers/youtube-scraper').call(input);
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        console.log(`❌ No YouTube data found for ${url}`);
        return null;
      }

      const channel = items[0];
      
      return {
        username: channel.channelName,
        displayName: channel.channelName,
        followerCount: channel.subscriberCount,
        postCount: channel.videoCount,
        bio: channel.description,
        profilePictureUrl: channel.channelThumbnail,
        recentPosts: channel.videos?.slice(0, 5).map((video: any) => ({
          content: video.title + ' ' + (video.description || ''),
          likes: video.likeCount || 0,
          comments: video.commentCount || 0,
          hashtags: this.extractHashtags(video.title + ' ' + (video.description || ''))
        })) || []
      };
      
    } catch (error) {
      console.error(`❌ YouTube scraping failed for ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape Twitter profile (placeholder - would need Twitter API)
   */
  private async scrapeTwitterProfile(url: string): Promise<VerificationResult['extractedData'] | null> {
    // Twitter scraping would require different approach due to API restrictions
    console.log(`🐦 Twitter scraping not yet implemented for: ${url}`);
    return null;
  }

  /**
   * Analyze how well a profile matches the search criteria
   */
  private async analyzeProfileMatch(
    profile: VerificationResult['extractedData'], 
    criteria: ProfileVerificationRequest['searchCriteria']
  ): Promise<VerificationResult['matchAnalysis']> {
    
    // Analyze niche alignment
    const nicheAlignment = this.analyzeNicheAlignment(profile, criteria.niches || [], criteria.brandName);
    
    // Analyze demographic match
    const demographicMatch = await this.analyzeDemographicMatch(profile, criteria);
    
    // Analyze brand compatibility
    const brandCompatibility = this.analyzeBrandCompatibility(profile, criteria.brandName);
    
    // Validate follower count
    const followerValidation = this.validateFollowerCount(profile, criteria);
    
    return {
      nicheAlignment,
      demographicMatch,
      brandCompatibility,
      followerValidation
    };
  }

  /**
   * Analyze niche alignment based on bio and recent posts
   */
  private analyzeNicheAlignment(
    profile: VerificationResult['extractedData'],
    targetNiches: string[],
    brandName?: string
  ): VerificationResult['matchAnalysis']['nicheAlignment'] {
    
    const contentToAnalyze = [
      profile.bio || '',
      ...profile.recentPosts?.map(post => post.content) || []
    ].join(' ').toLowerCase();
    
    // Define keyword mappings for different niches
    const nicheKeywords: Record<string, string[]> = {
      'home': ['home', 'interior', 'decor', 'furniture', 'design', 'room', 'house', 'apartment', 'living', 'kitchen', 'bedroom', 'decorating', 'styling'],
      'lifestyle': ['lifestyle', 'daily', 'life', 'routine', 'wellness', 'self-care', 'mindfulness', 'healthy', 'balance'],
      'fashion': ['fashion', 'style', 'outfit', 'clothing', 'wardrobe', 'trend', 'designer', 'brand', 'look', 'wear'],
      'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'skincare', 'hair', 'nails', 'glow', 'routine'],
      'fitness': ['fitness', 'workout', 'gym', 'exercise', 'health', 'training', 'muscle', 'cardio', 'yoga', 'pilates'],
      'food': ['food', 'cooking', 'recipe', 'kitchen', 'chef', 'delicious', 'meal', 'restaurant', 'eat', 'taste'],
      'travel': ['travel', 'trip', 'vacation', 'explore', 'adventure', 'destination', 'journey', 'wanderlust', 'discover'],
      'tech': ['tech', 'technology', 'gadget', 'app', 'software', 'digital', 'innovation', 'coding', 'programming']
    };
    
    // Brand-specific keywords
    const brandKeywords: Record<string, string[]> = {
      'ikea': ['ikea', 'furniture', 'home', 'interior', 'design', 'storage', 'minimalist', 'nordic', 'scandinavian', 'affordable', 'diy', 'assembly'],
      'nike': ['nike', 'sport', 'athletic', 'fitness', 'running', 'training', 'performance', 'just', 'do', 'it'],
      'sephora': ['sephora', 'beauty', 'makeup', 'skincare', 'cosmetics', 'ulta', 'beauty', 'products']
    };
    
    let matchedKeywords: string[] = [];
    let totalScore = 0;
    
    // Check niche keywords
    for (const niche of targetNiches) {
      const keywords = nicheKeywords[niche.toLowerCase()] || [];
      const nicheMatches = keywords.filter(keyword => contentToAnalyze.includes(keyword));
      matchedKeywords.push(...nicheMatches);
      totalScore += nicheMatches.length * 10; // 10 points per keyword match
    }
    
    // Check brand-specific keywords if brand specified
    if (brandName) {
      const brandWords = brandKeywords[brandName.toLowerCase()] || [];
      const brandMatches = brandWords.filter(keyword => contentToAnalyze.includes(keyword));
      matchedKeywords.push(...brandMatches);
      totalScore += brandMatches.length * 15; // 15 points for brand-specific matches
    }
    
    // Remove duplicates
    matchedKeywords = Array.from(new Set(matchedKeywords));
    
    // Normalize score to 0-100
    const score = Math.min(totalScore, 100);
    
    let explanation = '';
    if (score >= 80) {
      explanation = `Excellent niche alignment with ${matchedKeywords.length} relevant keywords found`;
    } else if (score >= 60) {
      explanation = `Good niche alignment with ${matchedKeywords.length} relevant keywords found`;
    } else if (score >= 40) {
      explanation = `Moderate niche alignment with ${matchedKeywords.length} relevant keywords found`;
    } else {
      explanation = `Poor niche alignment - only ${matchedKeywords.length} relevant keywords found`;
    }
    
    return {
      score,
      matchedKeywords,
      explanation
    };
  }

  /**
   * Enhanced demographic analysis with Spanish location detection and improved age estimation
   */
  private async analyzeDemographicMatch(
    profile: VerificationResult['extractedData'],
    criteria: ProfileVerificationRequest['searchCriteria']
  ): Promise<VerificationResult['matchAnalysis']['demographicMatch']> {
    
    let score = 0;
    const explanations: string[] = [];
    
    // Enhanced Spanish location detection
    let locationMatch = false;
    if (criteria.location) {
      const targetLocation = criteria.location.toLowerCase();
      
      // Check if looking for Spanish locations
      const isLookingForSpain = targetLocation.includes('spain') || 
                               targetLocation.includes('españa') ||
                               targetLocation.includes('spanish') ||
                               this.SPANISH_LOCATIONS.cities.some(city => targetLocation.includes(city)) ||
                               this.SPANISH_LOCATIONS.regions.some(region => targetLocation.includes(region));
      
      if (isLookingForSpain) {
        const spanishDetection = this.detectSpanishLocation(profile);
        locationMatch = spanishDetection.isSpanish;
        
        if (locationMatch) {
          // Bonus points for high confidence Spanish detection
          const confidenceBonus = Math.round(spanishDetection.confidence / 5); // 0-20 bonus points
          score += 40 + confidenceBonus;
          explanations.push(`Spanish location detected (${spanishDetection.confidence}% confidence): ${spanishDetection.indicators.slice(0, 2).join('; ')}`);
          
          if (spanishDetection.detectedLocations.length > 0) {
            explanations.push(`Specific locations: ${spanishDetection.detectedLocations.slice(0, 3).join(', ')}`);
          }
        } else {
          explanations.push(`No Spanish location indicators found (${spanishDetection.confidence}% confidence)`);
          if (spanishDetection.indicators.length > 0) {
            explanations.push(`Weak indicators: ${spanishDetection.indicators.slice(0, 2).join('; ')}`);
          }
        }
      } else {
        // Standard location matching for non-Spanish locations
        if (profile.location) {
          const profileLocation = profile.location.toLowerCase();
          locationMatch = profileLocation.includes(targetLocation) || targetLocation.includes(profileLocation);
          
          if (locationMatch) {
            score += 40;
            explanations.push(`Location matches: ${profile.location}`);
          } else {
            explanations.push(`Location mismatch: ${profile.location} vs ${criteria.location}`);
          }
        } else {
          explanations.push('No location information available in profile');
        }
      }
    } else {
      score += 40; // No location requirement
      locationMatch = true;
    }
    
    // Enhanced age estimation
    let estimatedAge: number | undefined;
    const ageAnalysis = this.estimateAge(profile);
    estimatedAge = ageAnalysis.estimatedAge;
    
    if (ageAnalysis.estimatedAge || ageAnalysis.ageRange) {
      const ageToCheck = ageAnalysis.estimatedAge || 
                        Math.round((ageAnalysis.ageRange!.min + ageAnalysis.ageRange!.max) / 2);
      
      let ageScore = 0;
      const ageExplanations: string[] = [];
      
      // Check age criteria
      if (criteria.minAge && ageToCheck >= criteria.minAge) {
        ageScore += 15;
        ageExplanations.push(`Age ${ageToCheck} meets minimum requirement (${criteria.minAge}+)`);
      } else if (criteria.minAge && ageToCheck < criteria.minAge) {
        ageExplanations.push(`Age ${ageToCheck} below minimum requirement (${criteria.minAge}+)`);
      }
      
      if (criteria.maxAge && ageToCheck <= criteria.maxAge) {
        ageScore += 15;
        ageExplanations.push(`Age ${ageToCheck} meets maximum requirement (${criteria.maxAge}-)`);
      } else if (criteria.maxAge && ageToCheck > criteria.maxAge) {
        ageExplanations.push(`Age ${ageToCheck} above maximum requirement (${criteria.maxAge}-)`);
      }
      
      if (!criteria.minAge && !criteria.maxAge) {
        ageScore += 15; // No age requirements
      }
      
      score += ageScore;
      
      // Add confidence-based explanation
      const confidenceLevel = ageAnalysis.confidence >= 80 ? 'high' : 
                             ageAnalysis.confidence >= 50 ? 'medium' : 'low';
      
      if (ageAnalysis.ageRange) {
        explanations.push(`Age estimated: ${ageAnalysis.ageRange.min}-${ageAnalysis.ageRange.max} (${confidenceLevel} confidence, method: ${ageAnalysis.method})`);
      } else {
        explanations.push(`Age estimated: ${ageAnalysis.estimatedAge} (${confidenceLevel} confidence, method: ${ageAnalysis.method})`);
      }
      
      if (ageAnalysis.indicators.length > 0) {
        explanations.push(`Age indicators: ${ageAnalysis.indicators.slice(0, 2).join('; ')}`);
      }
      
      explanations.push(...ageExplanations);
    } else {
      score += 15; // Can't determine age, don't penalize heavily
      explanations.push('Age could not be determined from profile');
    }
    
    // Enhanced gender estimation with Spanish language support
    let estimatedGender: string | undefined;
    if (criteria.gender && criteria.gender !== 'any') {
      const bioText = (profile.bio || '').toLowerCase();
      const allText = [
        profile.bio || '',
        profile.displayName || '',
        ...profile.recentPosts?.map(post => post.content) || []
      ].join(' ').toLowerCase();
      
      // Enhanced gender detection with Spanish support
      const genderWords = {
        female: [
          // English
          'she', 'her', 'girl', 'woman', 'female', 'mama', 'mom', 'mother', 'wife', 'lady',
          'daughter', 'sister', 'girlfriend', 'bride', 'queen', 'princess', 'goddess',
          // Spanish
          'ella', 'mujer', 'chica', 'niña', 'señora', 'señorita', 'mamá', 'madre', 'esposa',
          'hija', 'hermana', 'novia', 'reina', 'princesa', 'diosa', 'femenina'
        ],
        male: [
          // English
          'he', 'him', 'boy', 'man', 'male', 'dad', 'father', 'husband', 'guy', 'dude',
          'son', 'brother', 'boyfriend', 'groom', 'king', 'prince', 'god',
          // Spanish
          'él', 'hombre', 'chico', 'niño', 'señor', 'papá', 'padre', 'esposo',
          'hijo', 'hermano', 'novio', 'rey', 'príncipe', 'dios', 'masculino'
        ]
      };
      
      const femaleCount = genderWords.female.filter(word => allText.includes(word)).length;
      const maleCount = genderWords.male.filter(word => allText.includes(word)).length;
      
      if (femaleCount > maleCount && femaleCount > 0) {
        estimatedGender = 'female';
      } else if (maleCount > femaleCount && maleCount > 0) {
        estimatedGender = 'male';
      }
      
      if (estimatedGender === criteria.gender) {
        score += 30;
        explanations.push(`Gender appears to match: ${estimatedGender} (${Math.max(femaleCount, maleCount)} indicators)`);
      } else if (estimatedGender) {
        explanations.push(`Gender mismatch: appears ${estimatedGender}, looking for ${criteria.gender}`);
      } else {
        score += 15; // Can't determine gender, partial credit
        explanations.push('Gender could not be determined from profile');
      }
    } else {
      score += 30; // No gender requirement
    }
    
    return {
      score,
      estimatedAge,
      estimatedGender,
      locationMatch,
      explanation: explanations.join('; ')
    };
  }

  /**
   * Analyze brand compatibility
   */
  private analyzeBrandCompatibility(
    profile: VerificationResult['extractedData'],
    brandName?: string
  ): VerificationResult['matchAnalysis']['brandCompatibility'] {
    
    if (!brandName) {
      return {
        score: 100,
        reasons: ['No specific brand requirements'],
        redFlags: []
      };
    }
    
    const contentToAnalyze = [
      profile.bio || '',
      ...profile.recentPosts?.map(post => post.content) || []
    ].join(' ').toLowerCase();
    
    const reasons: string[] = [];
    const redFlags: string[] = [];
    let score = 50; // Start with neutral score
    
    // Brand-specific compatibility analysis
    switch (brandName.toLowerCase()) {
      case 'ikea':
        // Check for home/interior content
        if (contentToAnalyze.includes('home') || contentToAnalyze.includes('interior')) {
          score += 20;
          reasons.push('Content includes home/interior themes');
        }
        
        // Check for DIY/furniture content
        if (contentToAnalyze.includes('diy') || contentToAnalyze.includes('furniture')) {
          score += 15;
          reasons.push('Shows interest in DIY/furniture');
        }
        
        // Check for competing brands
        const homeCompetitors = ['west elm', 'pottery barn', 'wayfair', 'cb2'];
        const competitorMentions = homeCompetitors.filter(comp => contentToAnalyze.includes(comp));
        if (competitorMentions.length > 0) {
          score -= 20;
          redFlags.push(`Mentions competitors: ${competitorMentions.join(', ')}`);
        }
        break;
        
      default:
        // Generic brand compatibility
        score += 10;
        reasons.push('Profile appears suitable for brand collaboration');
    }
    
    // Check for professionalism indicators
    if (profile.isVerified) {
      score += 10;
      reasons.push('Verified account shows credibility');
    }
    
    // Check engagement quality
    const avgLikes = profile.recentPosts?.reduce((sum, post) => sum + post.likes, 0) || 0;
    const postCount = profile.recentPosts?.length || 1;
    const avgEngagement = avgLikes / postCount;
    
    if (avgEngagement > 1000) {
      score += 10;
      reasons.push('High engagement rates');
    } else if (avgEngagement < 50) {
      score -= 10;
      redFlags.push('Low engagement rates');
    }
    
    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      reasons,
      redFlags
    };
  }

  /**
   * Validate follower count against criteria
   */
  private validateFollowerCount(
    profile: VerificationResult['extractedData'],
    criteria: ProfileVerificationRequest['searchCriteria']
  ): VerificationResult['matchAnalysis']['followerValidation'] {
    
    const followerCount = profile.followerCount || 0;
    let score = 100;
    let inRange = true;
    let quality: 'low' | 'medium' | 'high' = 'medium';
    const explanations: string[] = [];
    
    // Check if within specified range
    if (criteria.minFollowers && followerCount < criteria.minFollowers) {
      score -= 50;
      inRange = false;
      explanations.push(`Below minimum: ${followerCount} < ${criteria.minFollowers}`);
    }
    
    if (criteria.maxFollowers && followerCount > criteria.maxFollowers) {
      score -= 50;
      inRange = false;
      explanations.push(`Above maximum: ${followerCount} > ${criteria.maxFollowers}`);
    }
    
    // Assess follower quality based on engagement
    const avgLikes = profile.recentPosts?.reduce((sum, post) => sum + post.likes, 0) || 0;
    const postCount = profile.recentPosts?.length || 1;
    const engagementRate = (avgLikes / postCount) / Math.max(followerCount, 1);
    
    if (engagementRate > 0.05) { // 5% engagement rate
      quality = 'high';
      score += 10;
      explanations.push('High engagement rate indicates quality followers');
    } else if (engagementRate < 0.01) { // 1% engagement rate
      quality = 'low';
      score -= 20;
      explanations.push('Low engagement rate may indicate fake followers');
    }
    
    if (followerCount > 0) {
      explanations.push(`${followerCount.toLocaleString()} followers with ${(engagementRate * 100).toFixed(2)}% engagement`);
    }
    
    return {
      score: Math.max(0, score),
      inRange,
      quality,
      explanation: explanations.join('; ')
    };
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(analysis: VerificationResult['matchAnalysis']): number {
    const weights = {
      nicheAlignment: 0.3,      // 30% - most important for brand fit
      brandCompatibility: 0.25,  // 25% - brand-specific factors
      followerValidation: 0.25,  // 25% - audience size matters
      demographicMatch: 0.2      // 20% - demographics
    };
    
    return Math.round(
      analysis.nicheAlignment.score * weights.nicheAlignment +
      analysis.brandCompatibility.score * weights.brandCompatibility +
      analysis.followerValidation.score * weights.followerValidation +
      analysis.demographicMatch.score * weights.demographicMatch
    );
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(platform: string): Promise<void> {
    const lastRequest = this.rateLimiter.get(platform) || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms for ${platform}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.rateLimiter.set(platform, Date.now());
  }

  /**
   * Extract username from profile URL
   */
  private extractUsernameFromUrl(url: string): string {
    // Use enhanced TikTok URL extraction for TikTok URLs
    if (isTikTokUrl(url)) {
      return extractTikTokUsername(url);
    }
    
    // For other platforms, use the existing logic
    const match = url.match(/@([^/?\s]+)/);
    return match ? match[1] : url.split('/').pop() || '';
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const hashtags = text.match(/#[\w]+/g) || [];
    return hashtags.map(tag => tag.toLowerCase());
  }

  /**
   * Create failed result helper
   */
  private createFailedResult(
    request: ProfileVerificationRequest, 
    error: string
  ): VerificationResult {
    return {
      profileUrl: request.profileUrl,
      platform: request.platform,
      verified: false,
      confidence: 0,
      extractedData: {
        username: this.extractUsernameFromUrl(request.profileUrl),
      },
      matchAnalysis: {
        nicheAlignment: { score: 0, matchedKeywords: [], explanation: 'Could not analyze - scraping failed' },
        demographicMatch: { score: 0, locationMatch: false, explanation: 'Could not analyze - scraping failed' },
        brandCompatibility: { score: 0, reasons: [], redFlags: ['Scraping failed'] },
        followerValidation: { score: 0, inRange: false, quality: 'low', explanation: 'Could not validate - scraping failed' }
      },
      overallScore: 0,
      errors: [error],
      scrapedAt: new Date()
    };
  }

  /**
   * Enhanced Spanish location detection
   */
  private detectSpanishLocation(profile: VerificationResult['extractedData']): {
    isSpanish: boolean;
    confidence: number;
    indicators: string[];
    detectedLocations: string[];
  } {
    const indicators: string[] = [];
    const detectedLocations: string[] = [];
    let confidence = 0;
    
    // Combine all text sources for analysis
    const allText = [
      profile.bio || '',
      profile.location || '',
      profile.displayName || '',
      ...profile.recentPosts?.map(post => post.content) || []
    ].join(' ').toLowerCase();
    
    // 1. Direct location field analysis
    if (profile.location) {
      const location = profile.location.toLowerCase();
      
      // Check major cities (high confidence)
      const cityMatches = this.SPANISH_LOCATIONS.cities.filter(city => 
        location.includes(city) || city.includes(location)
      );
      if (cityMatches.length > 0) {
        confidence += 40;
        indicators.push(`Location field contains Spanish city: ${cityMatches.join(', ')}`);
        detectedLocations.push(...cityMatches);
      }
      
      // Check regions (high confidence)
      const regionMatches = this.SPANISH_LOCATIONS.regions.filter(region => 
        location.includes(region) || region.includes(location)
      );
      if (regionMatches.length > 0) {
        confidence += 35;
        indicators.push(`Location field contains Spanish region: ${regionMatches.join(', ')}`);
        detectedLocations.push(...regionMatches);
      }
      
      // Check for "Spain" or "España"
      if (location.includes('spain') || location.includes('españa')) {
        confidence += 50;
        indicators.push('Location explicitly mentions Spain');
        detectedLocations.push('Spain');
      }
    }
    
    // 2. Language indicators in bio/content
    const languageMatches = this.SPANISH_LOCATIONS.languageIndicators.filter(indicator => 
      allText.includes(indicator)
    );
    if (languageMatches.length > 0) {
      confidence += languageMatches.length * 10;
      indicators.push(`Spanish language indicators: ${languageMatches.join(', ')}`);
    }
    
    // 3. Cultural markers
    const culturalMatches = this.SPANISH_LOCATIONS.culturalMarkers.filter(marker => 
      allText.includes(marker)
    );
    if (culturalMatches.length > 0) {
      confidence += culturalMatches.length * 5;
      indicators.push(`Spanish cultural markers: ${culturalMatches.join(', ')}`);
    }
    
    // 4. Spanish phone number patterns
    const phoneMatches = this.SPANISH_LOCATIONS.phonePatterns.some(pattern => 
      pattern.test(allText)
    );
    if (phoneMatches) {
      confidence += 20;
      indicators.push('Spanish phone number pattern detected');
    }
    
    // 5. Spanish postal code pattern
    const postalMatches = this.SPANISH_LOCATIONS.postalCodePattern.test(allText);
    if (postalMatches) {
      confidence += 15;
      indicators.push('Spanish postal code pattern detected');
    }
    
    // 6. Content analysis for Spanish cities/regions mentioned in posts
    const contentLocationMatches = [
      ...this.SPANISH_LOCATIONS.cities,
      ...this.SPANISH_LOCATIONS.regions
    ].filter(location => allText.includes(location));
    
    if (contentLocationMatches.length > 0) {
      confidence += Math.min(contentLocationMatches.length * 3, 20);
      indicators.push(`Spanish locations mentioned in content: ${contentLocationMatches.slice(0, 5).join(', ')}`);
      detectedLocations.push(...contentLocationMatches);
    }
    
    // 7. Username analysis for Spanish patterns
    const username = profile.username.toLowerCase();
    const spanishNamePatterns = [
      'madrid', 'barcelona', 'valencia', 'sevilla', 'spain', 'español', 'española'
    ];
    const usernameMatches = spanishNamePatterns.filter(pattern => username.includes(pattern));
    if (usernameMatches.length > 0) {
      confidence += 15;
      indicators.push(`Username contains Spanish indicators: ${usernameMatches.join(', ')}`);
    }
    
    // Cap confidence at 100
    confidence = Math.min(confidence, 100);
    
    return {
      isSpanish: confidence >= 30, // Threshold for considering someone Spanish
      confidence,
      indicators,
      detectedLocations: Array.from(new Set(detectedLocations)) // Remove duplicates
    };
  }

  /**
   * Enhanced age estimation
   */
  private estimateAge(profile: VerificationResult['extractedData']): {
    estimatedAge?: number;
    ageRange?: { min: number; max: number };
    confidence: number;
    method: string;
    indicators: string[];
  } {
    const allText = [
      profile.bio || '',
      profile.displayName || '',
      ...profile.recentPosts?.map(post => post.content) || []
    ].join(' ');
    
    const indicators: string[] = [];
    let estimatedAge: number | undefined;
    let ageRange: { min: number; max: number } | undefined;
    let confidence = 0;
    let method = 'unknown';
    
    // 1. Direct age patterns
    for (const pattern of this.AGE_PATTERNS.directAge) {
      const match = allText.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 13 && age <= 80) { // Reasonable age range
          estimatedAge = age;
          confidence = 90;
          method = 'direct_mention';
          indicators.push(`Direct age mention: ${age}`);
          break;
        }
      }
    }
    
    // 2. Birth year patterns
    if (!estimatedAge) {
      for (const pattern of this.AGE_PATTERNS.birthYear) {
        const match = allText.match(pattern);
        if (match) {
          const birthYear = parseInt(`20${match[1]}`) || parseInt(`19${match[1]}`);
          const currentYear = new Date().getFullYear();
          const calculatedAge = currentYear - birthYear;
          
          if (calculatedAge >= 13 && calculatedAge <= 80) {
            estimatedAge = calculatedAge;
            confidence = 85;
            method = 'birth_year';
            indicators.push(`Birth year: ${birthYear}, calculated age: ${calculatedAge}`);
            break;
          }
        }
      }
    }
    
    // 3. Generation markers
    if (!estimatedAge) {
      const lowerText = allText.toLowerCase();
      for (const [marker, range] of Object.entries(this.AGE_PATTERNS.generationMarkers)) {
        if (lowerText.includes(marker)) {
          ageRange = range;
          estimatedAge = Math.round((range.minAge + range.maxAge) / 2);
          confidence = 60;
          method = 'generation_marker';
          indicators.push(`Generation marker: ${marker} (${range.minAge}-${range.maxAge})`);
          break;
        }
      }
    }
    
    // 4. Life stage markers
    if (!estimatedAge) {
      const lowerText = allText.toLowerCase();
      const matchedStages: Array<{ marker: string; range: { minAge: number; maxAge: number } }> = [];
      
      for (const [marker, range] of Object.entries(this.AGE_PATTERNS.lifeStageMarkers)) {
        if (lowerText.includes(marker)) {
          matchedStages.push({ marker, range });
        }
      }
      
      if (matchedStages.length > 0) {
        // If multiple markers, find overlapping range
        let minAge = Math.max(...matchedStages.map(s => s.range.minAge));
        let maxAge = Math.min(...matchedStages.map(s => s.range.maxAge));
        
        if (minAge <= maxAge) {
          ageRange = { minAge, maxAge };
          estimatedAge = Math.round((minAge + maxAge) / 2);
          confidence = 50 + (matchedStages.length * 10); // More markers = higher confidence
          method = 'life_stage';
          indicators.push(`Life stage markers: ${matchedStages.map(s => s.marker).join(', ')}`);
        }
      }
    }
    
    // 5. Visual/contextual clues from recent posts
    if (!estimatedAge && profile.recentPosts) {
      const postContent = profile.recentPosts.map(p => p.content.toLowerCase()).join(' ');
      
      // School/education indicators
      if (postContent.includes('university') || postContent.includes('college') || postContent.includes('uni')) {
        ageRange = { minAge: 18, maxAge: 25 };
        estimatedAge = 21;
        confidence = 40;
        method = 'education_context';
        indicators.push('University/college context suggests young adult');
      }
      // Work/career indicators
      else if (postContent.includes('work') || postContent.includes('job') || postContent.includes('career')) {
        ageRange = { minAge: 22, maxAge: 65 };
        estimatedAge = 30;
        confidence = 30;
        method = 'work_context';
        indicators.push('Work/career context suggests working age');
      }
      // Family indicators
      else if (postContent.includes('kids') || postContent.includes('children') || postContent.includes('family')) {
        ageRange = { minAge: 25, maxAge: 50 };
        estimatedAge = 35;
        confidence = 35;
        method = 'family_context';
        indicators.push('Family context suggests parent age');
      }
    }
    
    return {
      estimatedAge,
      ageRange,
      confidence,
      method,
      indicators
    };
  }
}

export { ProfileVerificationService, type ProfileVerificationRequest, type VerificationResult }; 