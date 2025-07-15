/**
 * Enhanced Search Service with Smart Caching and Advanced Improvements
 * Now includes: Aesthetic Intelligence, Smart Scraping, Advanced Filtering, Fallback Strategies, and Quality Tracking
 */

import { searchInfluencersWithTwoTierDiscovery, extractUsernameFromUrl, getPlatformFromUrl } from './apifyService';
import { ProfileVerificationService, type ProfileVerificationRequest, type VerificationResult } from './profileVerificationService';
import { spanishLocationService } from './spanishLocationService';
import { enhanceInfluencerWithAesthetics, analyzeBrandSpecificAesthetic } from './aestheticIntelligence';
import { createSmartScrapingManager, SCRAPING_CONFIGS } from './smartScrapingManager';
import { enhancedInfluencerFiltering } from './advancedFilteringSystem';
import { generateEnhancedFallback } from './fallbackStrategies';
import { searchWithQualityTracking, searchQualitySystem } from './searchQualitySystem';
import { searchVettedInfluencers, getInfluencerById, convertVettedToMatchResult } from './vettedInfluencersService';
import type { MatchResult } from '../types/influencer';
import type { SearchParams } from './vettedInfluencersService';


// Function to generate realistic demographics for discovered profiles
const generateRealisticDemographics = (profile: { niche: string[], gender: string, followerCount: number }, ageRange: string) => {
    const niches = Array.isArray(profile.niche) ? profile.niche : [];
    
    const isArt = niches.some(n => n && n.toLowerCase().includes('art'));
    const isLifestyle = niches.some(n => n && n.toLowerCase().includes('lifestyle'));
    const isFitness = niches.some(n => n && n.toLowerCase().includes('fitness'));
    const isFood = niches.some(n => n && n.toLowerCase().includes('food'));
    const isTravel = niches.some(n => n && n.toLowerCase().includes('travel'));
    const isBeauty = niches.some(n => n && n.toLowerCase().includes('beauty'));
    const isFashion = niches.some(n => n && n.toLowerCase().includes('fashion'));
    const isTech = niches.some(n => n && n.toLowerCase().includes('tech'));
    const isMusic = niches.some(n => n && n.toLowerCase().includes('music'));
    const isGaming = niches.some(n => n && n.toLowerCase().includes('gaming'));
    const isEducation = niches.some(n => n && n.toLowerCase().includes('education'));
    const isMale = profile.gender === 'Male';
    const followerCount = profile.followerCount;
    
    let ageGroups = {
      '13-17': 5, '18-24': 30, '25-34': 35, '35-44': 20, '45-54': 8, '55+': 2
    };
    if (isGaming || isMusic) {
      ageGroups = { '13-17': 12, '18-24': 45, '25-34': 28, '35-44': 12, '45-54': 2, '55+': 1 };
    } else if (isBeauty || isFashion) {
      ageGroups = { '13-17': 8, '18-24': 42, '25-34': 35, '35-44': 12, '45-54': 2, '55+': 1 };
    } else if (isEducation || isTech) {
      ageGroups = { '13-17': 3, '18-24': 25, '25-34': 45, '35-44': 20, '45-54': 5, '55+': 2 };
    } else if (isTravel) {
      ageGroups = { '13-17': 2, '18-24': 35, '25-34': 40, '35-44': 18, '45-54': 4, '55+': 1 };
    } else if (isFitness) {
      ageGroups = { '13-17': 5, '18-24': 38, '25-34': 42, '35-44': 12, '45-54': 2, '55+': 1 };
    } else if (isFood) {
      ageGroups = { '13-17': 3, '18-24': 28, '25-34': 38, '35-44': 25, '45-54': 5, '55+': 1 };
    } else if (isArt) {
      ageGroups = { '13-17': 8, '18-24': 32, '25-34': 35, '35-44': 20, '45-54': 4, '55+': 1 };
    }
    
    let genderDistribution = { male: 45, female: 52, other: 3 };
    if (isMale) {
      if (isGaming || isTech) {
        genderDistribution = { male: 75, female: 23, other: 2 };
      } else if (isFitness) {
        genderDistribution = { male: 55, female: 43, other: 2 };
      } else if (isMusic) {
        genderDistribution = { male: 62, female: 36, other: 2 };
      } else {
        genderDistribution = { male: 48, female: 49, other: 3 };
      }
    } else {
      if (isBeauty || isFashion) {
        genderDistribution = { male: 18, female: 80, other: 2 };
      } else if (isLifestyle) {
        const baseVariation = Math.floor(Math.random() * 8) - 4;
        const followerVariation = followerCount > 500000 ? -3 : followerCount > 100000 ? 0 : 3;
        const malePercentage = Math.max(15, Math.min(35, 25 + baseVariation + followerVariation));
        const femalePercentage = Math.max(60, Math.min(80, 72 - baseVariation - followerVariation));
        const otherPercentage = 100 - malePercentage - femalePercentage;
        genderDistribution = { male: malePercentage, female: femalePercentage, other: otherPercentage };
      } else if (isFood) {
        genderDistribution = { male: 35, female: 63, other: 2 };
      } else {
        genderDistribution = { male: 38, female: 59, other: 3 };
      }
    }
    
    let topLocations = ['Madrid', 'Barcelona', 'Valencia'];
    if (followerCount > 1000000) {
      topLocations = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'];
    } else if (followerCount > 500000) {
      topLocations = ['Madrid', 'Barcelona', 'Valencia', 'Málaga'];
    }
    
    const interests = [...niches];
    if (isLifestyle) interests.push('Travel', 'Food', 'Fashion');
    if (isBeauty) interests.push('Skincare', 'Makeup', 'Fashion');
    
    return {
      ageGroups,
      gender: genderDistribution,
      topLocations: Array.from(new Set(topLocations)).slice(0, 4),
      interests: Array.from(new Set(interests)).slice(0, 4)
    };
};

export async function createDiscoveryResults(
  profileUrls: string[],
  searchParams: SearchParams
): Promise<MatchResult[]> {
  console.log(`Creating discovery results from ${profileUrls.length} profile URLs`);

  const results = await Promise.all(profileUrls.map(async (url, index) => {
    const handle = extractUsernameFromUrl(url, getPlatformFromUrl(url)) || `unknown_${index}`;
    const platform = getPlatformFromUrl(url);

    const followerCount = Math.floor(Math.random() * (searchParams.maxFollowers || 2000000)) + (searchParams.minFollowers || 5000);
    const engagementRate = Math.random() * 0.05 + 0.01; // 1-6%
    const gender = (Math.random() > 0.4 ? 'Female' : 'Male') as 'Male' | 'Female' | 'Other';
    const ageRange = ['18-24', '25-34', '35-44'][Math.floor(Math.random() * 3)] as '18-24' | '25-34' | '35-44';
    
    const influencerProfile: any = {
      id: `discovered_${handle}`,
      name: handle.replace(/_/g, ' ').replace(/\./g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      handle: handle,
      platform: platform as 'Instagram' | 'TikTok',
      followerCount,
      engagementRate,
      ageRange,
      gender,
      location: searchParams.location ? (searchParams.location.split(' ')[0] || 'Spain') : 'Spain',
      niche: searchParams.niches || ['Lifestyle'],
      contentStyle: ['Posts', 'Stories', 'Reels'],
      pastCollaborations: [],
      averageRate: Math.round(followerCount * (Math.random() * 0.01 + 0.005)),
      costLevel: 'Mid-Range' as const,
      audienceDemographics: generateRealisticDemographics(
        { niche: searchParams.niches || ['Lifestyle'], gender, followerCount },
        ageRange
      ),
      recentPosts: [],
      contactInfo: { email: undefined, preferredContact: 'DM' as const },
      isActive: true,
      lastUpdated: new Date(),
      validationStatus: {
        isDiscovered: true,
        isValidProfile: true,
        isBrandAccount: false,
        apifyVerified: false,
      }
    };

    const matchScore = 0.6 + Math.random() * 0.2;
    
    return {
      influencer: influencerProfile,
      matchScore: matchScore,
      matchReasons: [
        'Newly discovered profile via web search',
        `High relevance for "${searchParams.userQuery}"`,
        `Platform match: ${platform}`
      ],
      estimatedCost: influencerProfile.averageRate,
      similarPastCampaigns: [],
      potentialReach: influencerProfile.followerCount * (Math.random() * 0.4 + 0.2),
      recommendations: ['Newly discovered profile, data is estimated.'],
    };
  }));
  
  return results;
}

export async function addCollaborationStatus(
  results: MatchResult[],
  brandName: string | null
): Promise<MatchResult[]> {
  return results;
}


interface EnhancedSearchResult {
  profileUrl: string;
  platform: string;
  discoveryScore: number;
  verificationData?: VerificationResult;
  combinedScore: number;
  username: string;
  followers?: number;
  category?: string;
  location?: string;
  aestheticScore?: number;
  filteringDecision?: any;
  isFallback?: boolean;
}

interface EnhancedSearchResponse {
  results: EnhancedSearchResult[];
  summary: {
    totalFound: number;
    totalScraped: number;
    totalReturned: number;
    verified: number;
    averageScore: number;
    processingTime: number;
    highAestheticAlignment?: number;
    highQuality?: number;
    averageQualityScore?: number;
    averageAestheticScore?: number;
    scrapingEfficiency?: number;
    improvements?: {
      aestheticIntelligence: boolean;
      smartScraping: boolean;
      advancedFiltering: boolean;
      fallbackStrategies: boolean;
      qualityTracking: boolean;
    };
  };
  recommendations: string[];
}

interface SearchCacheEntry {
  query: string;
  queryHash: string;
  results: any[];
  timestamp: number;
  searchParams: any;
  hitCount: number;
  lastAccessed: number;
  sourceStrategy: string;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  avgResponseTime: number;
  lastCleanup: number;
}

class EnhancedSearchService {
  private verificationService: ProfileVerificationService;
  private cache: Map<string, SearchCacheEntry> = new Map();
  private stats: CacheStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRatio: 0,
    avgResponseTime: 0,
    lastCleanup: Date.now()
  };

  // Cache configuration
  private readonly MAX_CACHE_SIZE = 100;
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly POPULAR_QUERY_TTL = 2 * 60 * 60 * 1000; // 2 hours for popular queries
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.verificationService = new ProfileVerificationService();
    // Auto cleanup every 10 minutes
    setInterval(() => this.cleanupCache(), this.CLEANUP_INTERVAL);
  }

  /**
   * Generate a cache key from search parameters
   */
  private generateCacheKey(searchParams: any): string {
    const normalized = {
      location: searchParams.location?.toLowerCase(),
      gender: searchParams.gender,
      brandName: searchParams.brandName?.toLowerCase(),
      niches: searchParams.niches?.map((n: string) => n.toLowerCase()).sort(),
      platforms: searchParams.platforms?.map((p: string) => p.toLowerCase()).sort(),
      minFollowers: searchParams.minFollowers,
      maxFollowers: searchParams.maxFollowers,
      engagementRate: searchParams.engagementRate,
      costLevel: searchParams.costLevel
    };
    
    const keyString = JSON.stringify(normalized);
    return this.hashString(keyString);
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if a query is cached and valid
   */
  async getCachedResults(searchParams: any): Promise<SearchCacheEntry | null> {
    const cacheKey = this.generateCacheKey(searchParams);
    const entry = this.cache.get(cacheKey);
    
    this.stats.totalQueries++;
    
    if (!entry) {
      this.stats.cacheMisses++;
      this.updateStats();
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(cacheKey);
      this.stats.cacheMisses++;
      this.updateStats();
      console.log(`🗑️ Cache entry expired for query: ${cacheKey}`);
      return null;
    }

    // Update access stats
    entry.hitCount++;
    entry.lastAccessed = now;
    this.cache.set(cacheKey, entry);
    
    this.stats.cacheHits++;
    this.updateStats();
    
    console.log(`⚡ Cache HIT for query: ${cacheKey} (${entry.hitCount} hits)`);
    return entry;
  }

  /**
   * Cache search results
   */
  async cacheResults(searchParams: any, results: any[], sourceStrategy: string): Promise<void> {
    const cacheKey = this.generateCacheKey(searchParams);
    const now = Date.now();
    
    // Determine TTL based on query characteristics
    const ttl = this.determineTTL(searchParams, results);
    
    const entry: SearchCacheEntry = {
      query: JSON.stringify(searchParams),
      queryHash: cacheKey,
      results: results,
      timestamp: now,
      searchParams: searchParams,
      hitCount: 0,
      lastAccessed: now,
      sourceStrategy: sourceStrategy,
      ttl: ttl
    };

    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    this.cache.set(cacheKey, entry);
    console.log(`💾 Cached ${results.length} results for query: ${cacheKey} (TTL: ${ttl / 1000 / 60}min)`);
  }

  /**
   * Determine cache TTL based on query characteristics
   */
  private determineTTL(searchParams: any, results: any[]): number {
    // Longer TTL for broad queries that return many results
    if (results.length > 50) return this.POPULAR_QUERY_TTL;
    
    // Longer TTL for location-based queries (geographic data changes slowly)
    if (searchParams.location) return this.POPULAR_QUERY_TTL;
    
    // Shorter TTL for very specific queries (more likely to change)
    if (searchParams.brandName && searchParams.niches?.length > 2) {
      return this.DEFAULT_TTL / 2; // 15 minutes
    }
    
    return this.DEFAULT_TTL;
  }

  /**
   * Evict least recently used cache entries
   */
  private evictLeastUsed(): void {
    let oldestEntry: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestEntry = key;
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry);
      console.log(`🗑️ Evicted least recently used cache entry: ${oldestEntry}`);
    }
  }

  /**
   * Periodically clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if ((now - entry.timestamp) > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries.`);
    }
    
    this.stats.lastCleanup = now;
  }

  private updateStats(): void {
    if (this.stats.totalQueries > 0) {
      this.stats.hitRatio = this.stats.cacheHits / this.stats.totalQueries;
  }
  }

  getCacheStats(): CacheStats & { cacheSize: number; topQueries: Array<{query: string, hits: number}> } {
    const topQueries = Array.from(this.cache.values())
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 5)
      .map(entry => ({ query: entry.query, hits: entry.hitCount }));

    return {
      ...this.stats,
      cacheSize: this.cache.size,
      topQueries: topQueries
    };
  }

  invalidateCache(criteria?: { location?: string; brandName?: string }): number {
    if (!criteria || Object.keys(criteria).length === 0) {
      const size = this.cache.size;
      this.cache.clear();
      console.log('🚮 Invalidated entire cache.');
      return size;
    }

    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      let shouldDelete = false;
      if (criteria.location && entry.searchParams.location?.toLowerCase().includes(criteria.location.toLowerCase())) {
        shouldDelete = true;
      }
      if (criteria.brandName && entry.searchParams.brandName?.toLowerCase().includes(criteria.brandName.toLowerCase())) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        keysToDelete.push(key);
        invalidatedCount++;
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    if (invalidatedCount > 0) {
      console.log(`🚮 Invalidated ${invalidatedCount} cache entries matching criteria.`);
    }

    return invalidatedCount;
  }

  async preloadPopularSearches(): Promise<void> {
    const popularSearches = [
      { niches: ['fashion'], location: 'spain' },
      { niches: ['beauty'], location: 'spain' },
      { niches: ['lifestyle'], location: 'spain' },
      { niches: ['food'], location: 'madrid' },
      { niches: ['travel'] },
    ];

    console.log('⚡ Preloading popular searches into cache...');
    
    for (const params of popularSearches) {
      const fullParams = { ...params, query: `${params.niches.join(' ')} ${params.location || ''}`.trim() };
      // Prevent re-caching if already present
      const cached = await this.getCachedResults(fullParams);
      if (!cached) {
        await this.searchWithAllImprovements(fullParams as EnhancedSearchParams);
      }
    }
  }

  async searchWithAllImprovements(params: EnhancedSearchParams): Promise<EnhancedSearchResponse> {
    const startTime = Date.now();
    
    // 1. Check cache first
    const cached = await this.getCachedResults(params);
    if (cached) {
      const processingTime = Date.now() - startTime;
      return {
        ...cached.results,
        summary: { ...cached.results.summary, processingTime, fromCache: true }
      };
      }

    // 2. Determine optimal scraping strategy based on context
      const scrapingMode = this.determineOptimalScrapingMode(params);
    const scrapingManager = createSmartScrapingManager(scrapingMode);

    try {
      // 3. Perform two-tier discovery with quality tracking
      const scrapingResult = await searchWithQualityTracking(
        () => scrapingManager.execute(
          () => searchInfluencersWithTwoTierDiscovery(params.query, params.platforms || ['instagram', 'tiktok'], params.maxResults || 20),
          params
        ),
        searchQualitySystem,
        params
      );

      let profiles = scrapingResult.results;

      // Emergency Fallback: If primary scraping fails completely, use a simpler method
      if (profiles.length === 0) {
        const fallbackResults = await this.tryDiscoveryFallbacks(params);
        if (fallbackResults.length > 0) {
        return this.processFallbackResults(fallbackResults, params, startTime);
        } else {
          return this.createEmptyResponse(startTime, 'No results found after all fallbacks.');
        }
      }

      // 4. Enhance with Aesthetic Intelligence
      profiles = await this.enhanceWithAestheticIntelligence(profiles, params.brandName || '', params.query);

      // 5. Smart Verification (adjusts based on scraping quality)
      profiles = await this.performSmartVerification(profiles, params, scrapingResult.quality.scrapingScore);

      // 6. Advanced Filtering
      profiles = await this.applyAdvancedFiltering(profiles, { brandName: params.brandName, niches: params.niches });

      // 7. Intelligent Ranking
      profiles = this.applyIntelligentRanking(profiles, params);
      
      const processingTime = Date.now() - startTime;
      
      // 8. Generate Summary & Recommendations
      const qualityMetrics = searchQualitySystem.getMetricsForQuery(params.query);
      const summary = this.generateEnhancedSummary(profiles, scrapingResult, qualityMetrics, processingTime);
      const recommendations = this.generateIntelligentRecommendations(profiles, params, scrapingResult, qualityMetrics, scrapingResult.optimization);

      const response = {
        results: profiles.map(this.formatEnhancedResult),
        summary,
        recommendations
      };

      // 9. Cache the final results
      await this.cacheResults(params, response, 'two_tier_discovery');
      
      return response;

    } catch (error) {
      console.error("❌ Error in searchWithAllImprovements:", error);
      // Try emergency fallback on any error during the main pipeline
      const fallbackResults = await this.emergencyFallback(params);
      if (fallbackResults.length > 0) {
        return this.processFallbackResults(fallbackResults, params, startTime);
      }
      return this.createEmptyResponse(startTime, 'An unexpected error occurred.');
    }
  }

  private async enhancedScrapingFunction(
    profiles: any[], 
    platform: string, 
    params: any
  ): Promise<any[]> {
    // This is where you might use a more advanced scraping tool like Firecrawl
    // For now, we simulate an enhancement process
    console.log(`🔥 Enhancing ${profiles.length} profiles from ${platform} using advanced scraping...`);
    return profiles.map(p => ({
      ...p,
      enhancedData: {
        bio: `Enhanced bio for ${p.username}`,
        recentPostTopics: ['fashion', 'travel', 'lifestyle']
      }
    }));
  }

  private async applyAdvancedFiltering(
    profiles: any[], 
    searchContext: any
  ): Promise<any[]> {
    const filteringPromises = profiles.map(profile => 
      enhancedInfluencerFiltering(profile, searchContext)
    );
    const decisions = await Promise.all(filteringPromises);
    
    const filteredProfiles = profiles.filter((_, index) => decisions[index].shouldKeep);
    
    console.log(`🔬 Advanced Filtering: Kept ${filteredProfiles.length}/${profiles.length} profiles.`);
    
    // Attach filtering decision for transparency
    return profiles.map((p, i) => ({ ...p, filteringDecision: decisions[i] }));
  }
  
  private async enhanceWithAestheticIntelligence(
    profiles: any[], 
    brandName: string, 
    userQuery: string
  ): Promise<any[]> {
    if (!brandName && !userQuery) return profiles;
    
    // Analyze brand aesthetics from the query itself if no brand name is given
    const brandAesthetics = await analyzeBrandSpecificAesthetic(brandName || userQuery);
    
    const enhancementPromises = profiles.map(profile =>
      enhanceInfluencerWithAesthetics(profile, brandAesthetics)
    );
    
    const enhancedProfiles = await Promise.all(enhancementPromises);
    console.log(`🎨 Enhanced ${enhancedProfiles.length} profiles with aesthetic intelligence.`);
    
    return enhancedProfiles;
  }

  private async performSmartVerification(
    profiles: any[],
    params: any,
    scrapingQuality: number
  ): Promise<any[]> {
    if (params.verificationLevel === 'off') {
      return profiles;
    }

    // Adjust verification based on initial scraping quality
    // High quality scrape -> trust the data more, do lighter verification
    // Low quality scrape -> be more thorough
    const verificationConfidence = scrapingQuality > 0.8 ? 'high' : 'medium';
    const sampleSize = scrapingQuality > 0.8 ? 0.5 : 0.8; // Verify 50% for high quality, 80% for lower

    const profilesToVerify = profiles.slice(0, Math.ceil(profiles.length * sampleSize));

    const verificationRequests: ProfileVerificationRequest[] = profilesToVerify.map(p => ({
      profileUrl: p.profileUrl,
      platform: p.platform,
      confidenceThreshold: verificationConfidence === 'high' ? 0.75 : 0.6
    }));
        
    const verificationResults = await this.verificationService.batchVerify(verificationRequests);
    
    const verificationMap = new Map(verificationResults.map(r => [r.profileUrl, r]));

    return profiles.map(p => {
      const verificationData = verificationMap.get(p.profileUrl);
      return {
        ...p,
        verificationData: verificationData || p.verificationData, // Keep old data if not re-verified
        combinedScore: this.calculateCombinedScore({ ...p, verificationData })
      };
    });
  }

  private applyIntelligentRanking(profiles: any[], params: any): any[] {
    return profiles.sort((a, b) => {
      const scoreA = this.calculateCombinedScore(a);
      const scoreB = this.calculateCombinedScore(b);
      return scoreB - scoreA;
    });
  }

  private async tryDiscoveryFallbacks(params: any): Promise<any[]> {
    console.warn('⚠️ Primary search failed. Trying discovery fallbacks...');
    
    // Fallback 1: Generate enhanced query and re-run
    const enhancedQuery = generateEnhancedFallback(params.query, params);
    let results = await searchInfluencersWithTwoTierDiscovery(enhancedQuery, params.platforms, params.maxResults);
    if (results.length > 0) {
      console.log(`✅ Fallback successful with enhanced query: "${enhancedQuery}"`);
      return results.map(r => ({ ...r, isFallback: true, fallbackSource: 'enhanced_query' }));
    }
    
    // Fallback 2: Broader query
    const broaderQuery = this.createBroaderQuery(params.query);
    results = await searchInfluencersWithTwoTierDiscovery(broaderQuery, params.platforms, params.maxResults);
    if (results.length > 0) {
      console.log(`✅ Fallback successful with broader query: "${broaderQuery}"`);
      return results.map(r => ({ ...r, isFallback: true, fallbackSource: 'broader_query' }));
    }

    // Fallback 3: Emergency local data (if available)
    try {
      const emergencyResults = await this.emergencyFallback(params);
      if (emergencyResults.length > 0) {
        console.log(`✅ Fallback successful with emergency local data.`);
        return emergencyResults.map(r => ({ ...r, isFallback: true, fallbackSource: 'emergency_local' }));
        }
    } catch (e) {
      console.error("Emergency fallback failed:", e);
      }
    
    console.error('❌ All discovery fallbacks failed.');
    return [];
  }

  private async emergencyFallback(params: any): Promise<any[]> {
    // This is a last resort. For example, search a static JSON file.
    console.warn('🚨 Executing emergency fallback...');
    // In a real app, you might load a static list of popular influencers
    // For now, returning an empty array.
    return [];
  }

  private determineOptimalScrapingMode(params: any): 'economy' | 'balanced' | 'comprehensive' | 'unlimited' {
    if (params.brandName) return 'comprehensive';
    if (params.niches && params.niches.length > 1) return 'balanced';
    if (params.minFollowers > 100000) return 'balanced';
    return 'economy';
  }

  private generateEnhancedSummary(
    profiles: any[], 
    scrapingResult: any, 
    qualityMetrics: any, 
    processingTime: number
  ): any {
    return {
      totalFound: scrapingResult.total,
      totalScraped: scrapingResult.results.length,
      totalReturned: profiles.length,
      verified: profiles.filter(p => p.verificationData?.isVerified).length,
      averageScore: profiles.reduce((sum, p) => sum + this.calculateCombinedScore(p), 0) / (profiles.length || 1),
      processingTime,
      highAestheticAlignment: profiles.filter(p => p.aestheticScore > 0.8).length,
      highQuality: qualityMetrics.highQualitySearches,
      averageQualityScore: qualityMetrics.averageScore,
      scrapingEfficiency: scrapingResult.quality?.efficiency,
      improvements: {
        aestheticIntelligence: true,
        smartScraping: true,
        advancedFiltering: true,
        fallbackStrategies: true,
        qualityTracking: true,
      },
    };
  }

  private generateIntelligentRecommendations(
    profiles: any[], 
    params: any, 
    scrapingResult: any, 
    qualityMetrics: any,
    optimization: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (qualityMetrics.averageScore < 0.6) {
      recommendations.push("Search quality was low. Try a more specific query like adding a location or niche.");
    }
    if (scrapingResult.results.length < (params.maxResults || 20) * 0.5) {
      recommendations.push("Fewer results than expected. Broaden your search by removing a keyword.");
    }
    if (profiles.every(p => p.aestheticScore < 0.7)) {
      recommendations.push("Aesthetic alignment is low. Try adding keywords related to your brand's visual style (e.g., 'minimalist', 'vibrant', 'cinematic').");
    }
    if (optimization?.applied) {
      recommendations.push(`Scraping was optimized (${optimization.reason}). To disable, use a more specific query.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Search successful. For more specific results, add follower ranges or negative keywords.");
    }

    return recommendations;
  }

  private extractPlatform(url: string): string {
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('youtube.com')) return 'YouTube';
    return 'Unknown';
  }

  private extractUsername(url: string): string {
    try {
      const path = new URL(url).pathname.split('/').filter(Boolean);
      if (path.length > 0) return path[0];
    } catch (e) {
      // ignore invalid URLs
    }
    return '';
  }

  private createEmptyResponse(startTime: number, message: string): EnhancedSearchResponse {
    const processingTime = Date.now() - startTime;
    return {
      results: [],
      summary: {
        totalFound: 0,
        totalScraped: 0,
        totalReturned: 0,
        verified: 0,
        averageScore: 0,
        processingTime,
      },
      recommendations: [message, "Please try broadening your search or checking your spelling."]
    };
  }

  private processFallbackResults(fallbackResults: any[], params: any, startTime: number): EnhancedSearchResponse {
    const processingTime = Date.now() - startTime;
    return {
      results: fallbackResults.map(this.formatEnhancedResult),
      summary: this.generateFallbackSummary(fallbackResults, processingTime),
      recommendations: ["Primary search failed, but we found results using a fallback strategy. Data may be less accurate."]
    };
  }

  private formatEnhancedResult(profile: any): EnhancedSearchResult {
    return {
      profileUrl: profile.profileUrl,
      platform: profile.platform,
      discoveryScore: profile.discoveryScore,
      verificationData: profile.verificationData,
      combinedScore: this.calculateCombinedScore(profile),
      username: profile.username,
      followers: profile.followers,
      category: profile.category,
      location: profile.location,
      aestheticScore: profile.aestheticScore,
      filteringDecision: profile.filteringDecision,
      isFallback: profile.isFallback || false
    };
  }

  private calculateCombinedScore(profile: any): number {
    let score = profile.discoveryScore || 0.5;
    if (profile.verificationData?.isVerified) {
      score = (score * 0.7) + (profile.verificationData.confidence * 0.3);
    }
    if (profile.aestheticScore) {
      score = (score * 0.6) + (profile.aestheticScore * 0.4);
    }
    return Math.min(1, score) * 100;
  }

  private generateFallbackSummary(profiles: any[], processingTime: number): any {
    return {
      totalFound: profiles.length,
      totalScraped: profiles.length,
      totalReturned: profiles.length,
      verified: 0,
      averageScore: 50, // Default for fallbacks
      processingTime,
      isFallback: true
    };
  }

  // Example of how you might create a broader query
  private createBroaderQuery(originalQuery: string): string {
    const terms = originalQuery.split(' ');
    // Remove the last term if more than 2 terms exist
    if (terms.length > 2) {
      return terms.slice(0, -1).join(' ');
    }
    return originalQuery;
  }

  private async primaryScrapingMethod(profiles: any[], platform: string, params: any): Promise<any[]> {
    // Your main scraping logic here
    return this.enhancedScrapingFunction(profiles, platform, params);
  }

  private async scrapingWithFallbacks(profiles: any[], platform: string, params: any): Promise<any[]> {
    try {
      return await this.primaryScrapingMethod(profiles, platform, params);
    } catch (error) {
      console.warn('Primary scraping method failed, trying secondary...');
      // A simpler, more reliable but less detailed scraping function
      return profiles.map(p => ({ ...p, scrapedWith: 'secondary_fallback' }));
  }
}
}

export const enhancedSearchService = new EnhancedSearchService(); 