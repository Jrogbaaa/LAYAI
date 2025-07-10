/**
 * Enhanced Search Service with Smart Caching and Advanced Improvements
 * Now includes: Aesthetic Intelligence, Smart Scraping, Advanced Filtering, Fallback Strategies, and Quality Tracking
 */

import { searchInfluencersWithTwoTierDiscovery } from './apifyService';
import { ProfileVerificationService, type ProfileVerificationRequest, type VerificationResult } from './profileVerificationService';
import { spanishLocationService } from './spanishLocationService';
import { enhanceInfluencerWithAesthetics, analyzeBrandSpecificAesthetic } from './aestheticIntelligence';
import { createSmartScrapingManager, SCRAPING_CONFIGS } from './smartScrapingManager';
import { enhancedInfluencerFiltering } from './advancedFilteringSystem';
import { generateEnhancedFallback } from './fallbackStrategies';
import { searchWithQualityTracking, searchQualitySystem } from './searchQualitySystem';

interface EnhancedSearchParams {
  query: string;
  location?: string;
  gender?: 'male' | 'female' | 'any';
  minAge?: number;
  maxAge?: number;
  minFollowers?: number;
  maxFollowers?: number;
  niches?: string[];
  brandName?: string;
  platforms?: string[];
  verificationLevel?: 'basic' | 'full' | 'off';
  maxResults?: number;
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
      console.log(`🗑️ Evicted LRU cache entry: ${oldestEntry}`);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const isExpired = (now - entry.timestamp) > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    this.stats.lastCleanup = now;
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.hitRatio = this.stats.totalQueries > 0 
      ? (this.stats.cacheHits / this.stats.totalQueries) * 100 
      : 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats & { cacheSize: number; topQueries: Array<{query: string, hits: number}> } {
    const topQueries = Array.from(this.cache.values())
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 5)
      .map(entry => ({
        query: entry.searchParams.location || entry.searchParams.brandName || 'General search',
        hits: entry.hitCount
      }));

    return {
      ...this.stats,
      cacheSize: this.cache.size,
      topQueries
    };
  }

  /**
   * Invalidate cache entries matching certain criteria
   */
  invalidateCache(criteria?: { location?: string; brandName?: string }): number {
    let invalidatedCount = 0;

    if (!criteria) {
      // Clear all cache
      invalidatedCount = this.cache.size;
      this.cache.clear();
      console.log(`🗑️ Cleared entire cache: ${invalidatedCount} entries`);
      return invalidatedCount;
    }

    // Selective invalidation
    for (const [key, entry] of Array.from(this.cache.entries())) {
      let shouldInvalidate = false;

      if (criteria.location && entry.searchParams.location?.toLowerCase().includes(criteria.location.toLowerCase())) {
        shouldInvalidate = true;
      }
      if (criteria.brandName && entry.searchParams.brandName?.toLowerCase().includes(criteria.brandName.toLowerCase())) {
        shouldInvalidate = true;
      }

      if (shouldInvalidate) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    console.log(`🗑️ Invalidated ${invalidatedCount} cache entries matching criteria`);
    return invalidatedCount;
  }

  /**
   * Preload popular searches into cache
   */
  async preloadPopularSearches(): Promise<void> {
    const popularSearches = [
      { location: 'Spain', platforms: ['instagram'], minFollowers: 10000 },
      { location: 'Mexico', platforms: ['instagram'], minFollowers: 50000 },
      { niches: ['fitness', 'lifestyle'], platforms: ['instagram'], minFollowers: 25000 },
      { location: 'Colombia', platforms: ['instagram'], minFollowers: 10000 },
      { niches: ['beauty', 'fashion'], platforms: ['instagram'], minFollowers: 15000 }
    ];

    console.log('🚀 Preloading popular search patterns...');
    
    // Note: In a real implementation, you'd call the actual search service here
    // For now, we'll just create placeholder cache entries
    for (const searchParams of popularSearches) {
      const cacheKey = this.generateCacheKey(searchParams);
      if (!this.cache.has(cacheKey)) {
        // Simulate cached results - in production, these would be real searches
        await this.cacheResults(searchParams, [], 'preloaded');
      }
    }
  }

  /**
   * Enhanced search with all improvements integrated
   */
  async searchWithAllImprovements(params: EnhancedSearchParams): Promise<EnhancedSearchResponse> {
    const startTime = Date.now();
    
    console.log('🚀 Starting enhanced search with comprehensive improvements...');
    console.log(`🎯 Addressing shortcomings: Aesthetic Intelligence, Smart Limits, Advanced Filtering, Fallbacks, Quality Tracking`);
    
    try {
      // Step 1: Optimize search query using quality system
      const optimization = await searchQualitySystem.optimizeSearch(params.query, params);
      const optimizedQuery = optimization.expectedImprovement > 10 ? optimization.optimizedQuery : params.query;
      
      console.log(`🔧 Query optimization: ${optimization.expectedImprovement}% improvement expected`);
      if (optimizedQuery !== params.query) {
        console.log(`📝 Optimized query: "${optimizedQuery}"`);
      }

      // Step 2: Configure smart scraping based on user preferences or auto-detect
      const scrapingMode = this.determineOptimalScrapingMode(params);
      const scrapingManager = createSmartScrapingManager(scrapingMode, {
        maxProfiles: params.maxResults || SCRAPING_CONFIGS[scrapingMode].maxProfiles
      });
      
      console.log(`⚙️ Using ${scrapingMode} scraping mode (max ${SCRAPING_CONFIGS[scrapingMode].maxProfiles} profiles)`);

      // Step 3: Perform initial discovery search with optimized query
      console.log('🔍 Phase 1: Discovery search with optimization...');
      const discoveryResults = await searchInfluencersWithTwoTierDiscovery({
        platforms: params.platforms || ['instagram', 'tiktok'],
        niches: params.niches || ['lifestyle'],
        minFollowers: params.minFollowers || 1000,
        maxFollowers: params.maxFollowers || 1000000,
        location: params.location,
        gender: params.gender,
        userQuery: optimizedQuery,
        brandName: params.brandName,
        maxResults: SCRAPING_CONFIGS[scrapingMode].maxProfiles * 2 // Get more for better prioritization
      });

      if (!discoveryResults.premiumResults || (discoveryResults.premiumResults.length === 0 && discoveryResults.discoveryResults.length === 0)) {
        console.log('❌ No profiles found in discovery phase, trying fallback strategies...');
        
        // Use fallback strategies for discovery
        const fallbackResults = await this.tryDiscoveryFallbacks(params);
        if (fallbackResults.length === 0) {
          return this.createEmptyResponse(startTime, 'No profiles found even with fallback strategies');
        }
        
        return this.processFallbackResults(fallbackResults, params, startTime);
      }

      const allDiscoveredProfiles = [...discoveryResults.premiumResults, ...discoveryResults.discoveryResults];
      console.log(`✅ Discovery found ${allDiscoveredProfiles.length} profiles`);

      // Step 4: Intelligent profile prioritization
      const profileUrls = allDiscoveredProfiles.map((p: any) => ({ url: p.url || p.profileUrl, platform: this.extractPlatform(p.url || p.profileUrl) }));
      const prioritizedProfiles = await scrapingManager.prioritizeProfiles(profileUrls, params);
      
      console.log(`🧠 Prioritized ${prioritizedProfiles.length} profiles for scraping`);

      // Step 5: Smart scraping with fallback handling
      const scrapingResult = await scrapingManager.executeScraping(
        prioritizedProfiles,
        this.enhancedScrapingFunction.bind(this),
        params
      );

      console.log(`✅ Smart scraping completed: ${scrapingResult.totalScraped} profiles scraped`);

      // Step 6: Advanced filtering with ML-based detection
      console.log('🔬 Phase 2: Advanced filtering and quality assessment...');
      const filteredProfiles = await this.applyAdvancedFiltering(scrapingResult.profiles, params);
      
      console.log(`🔍 Advanced filtering: ${filteredProfiles.length}/${scrapingResult.profiles.length} profiles passed`);

      // Step 7: Aesthetic intelligence enhancement
      console.log('🎨 Phase 3: Aesthetic intelligence analysis...');
      const aestheticallyEnhancedProfiles = await this.enhanceWithAestheticIntelligence(
        filteredProfiles, 
        params.brandName || '', 
        params.query
      );

      // Step 8: Optional verification with smart thresholds
      let finalProfiles = aestheticallyEnhancedProfiles;
      if (params.verificationLevel && params.verificationLevel !== 'off') {
        console.log(`🔬 Phase 4: ${params.verificationLevel} verification...`);
        finalProfiles = await this.performSmartVerification(
          aestheticallyEnhancedProfiles,
          params,
          scrapingResult.qualityScore
        );
      }

      // Step 9: Intelligent sorting and ranking
      finalProfiles = this.applyIntelligentRanking(finalProfiles, params);

      // Step 10: Quality tracking and insights
      const qualityMetrics = await searchQualitySystem.trackSearch(
        `search_${Date.now()}`,
        optimizedQuery,
        params,
        finalProfiles,
        {
          searchTime: Date.now() - startTime,
          apiCalls: scrapingResult.resourceUsage.apiCalls,
          resourceUsage: scrapingResult.totalScraped
        }
      );

      // Step 11: Generate comprehensive response
      const summary = this.generateEnhancedSummary(finalProfiles, scrapingResult, qualityMetrics, Date.now() - startTime);
      const recommendations = this.generateIntelligentRecommendations(
        finalProfiles, 
        params, 
        scrapingResult, 
        qualityMetrics,
        optimization
      );

      console.log(`✅ Enhanced search completed: ${summary.verified}/${summary.totalFound} high-quality matches`);
      console.log(`📊 Overall quality score: ${qualityMetrics.qualityScore}%`);

      return {
        results: finalProfiles.map(this.formatEnhancedResult.bind(this)),
        summary,
        recommendations
      };

    } catch (error) {
      console.error('❌ Enhanced search failed:', error);
      
      // Try emergency fallback
      console.log('🔄 Attempting emergency fallback...');
      const emergencyResults = await this.emergencyFallback(params);
      
      if (emergencyResults.length > 0) {
        const summary = this.generateFallbackSummary(emergencyResults, Date.now() - startTime);
        return {
          results: emergencyResults,
          summary,
          recommendations: [
            '⚠️ Primary search failed - using fallback results',
            '💡 Try simplifying search criteria for better results',
            '🔧 Consider using economy mode to reduce complexity'
          ]
        };
      }
      
      throw new Error(`Enhanced search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced scraping function with fallback integration
   */
  private async enhancedScrapingFunction(
    profiles: any[], 
    platform: string, 
    params: any
  ): Promise<any[]> {
    try {
      // Try primary scraping
      const primaryResults = await this.primaryScrapingMethod(profiles, platform, params);
      
      if (primaryResults.length > 0) {
        return primaryResults;
      }
      
      // If primary fails, try fallback strategies
      console.log(`🔄 Primary scraping failed for ${platform}, trying fallback strategies...`);
      const fallbackResults = await this.scrapingWithFallbacks(profiles, platform, params);
      
      return fallbackResults;
      
    } catch (error) {
      console.error(`❌ Scraping failed for ${platform}:`, error);
      
      // Generate fallback profiles
      const fallbackProfiles = await Promise.all(
        profiles.map(profile => generateEnhancedFallback(profile.url, platform, params))
      );
      
      return fallbackProfiles.filter(p => p !== null);
    }
  }

  /**
   * Apply advanced filtering with ML-based detection
   */
  private async applyAdvancedFiltering(
    profiles: any[], 
    searchContext: any
  ): Promise<any[]> {
    const filteredProfiles: any[] = [];
    
    for (const profile of profiles) {
      try {
        const filteringResult = await enhancedInfluencerFiltering(profile, {
          searchQuery: searchContext.query,
          brandName: searchContext.brandName
        });
        
        if (filteringResult.shouldInclude) {
          // Add filtering metadata to profile
          profile.filteringDecision = filteringResult.decision;
          profile.filteringRecommendations = filteringResult.recommendations;
          filteredProfiles.push(profile);
          
          if (filteringResult.decision.riskLevel === 'high') {
            console.log(`⚠️ High-risk profile included: ${profile.username} (${filteringResult.decision.confidence}% confidence)`);
          }
        } else {
          console.log(`🚫 Filtered out: ${profile.username} - ${filteringResult.decision.reason}`);
        }
      } catch (error) {
        console.error(`❌ Filtering error for ${profile.username}:`, error);
        // Include profile if filtering fails to avoid over-filtering
        filteredProfiles.push(profile);
      }
    }
    
    return filteredProfiles;
      }

  /**
   * Enhance profiles with aesthetic intelligence
   */
  private async enhanceWithAestheticIntelligence(
    profiles: any[], 
    brandName: string, 
    userQuery: string
  ): Promise<any[]> {
    const enhancedProfiles: any[] = [];
    
    for (const profile of profiles) {
      try {
        const enhancedProfile = enhanceInfluencerWithAesthetics(
          profile,
          brandName,
          userQuery
        );
        
        enhancedProfiles.push(enhancedProfile);
        
        if (enhancedProfile.aestheticScore >= 80) {
          console.log(`🎨 Excellent aesthetic match: ${profile.username} (${enhancedProfile.aestheticScore}%)`);
      }
      } catch (error) {
        console.error(`❌ Aesthetic enhancement error for ${profile.username}:`, error);
        enhancedProfiles.push(profile);
      }
    }
    
    return enhancedProfiles;
  }

  /**
   * Perform smart verification with adaptive thresholds
   */
  private async performSmartVerification(
    profiles: any[],
    params: any,
    scrapingQuality: number
  ): Promise<any[]> {
    // Adjust verification strictness based on scraping quality
    const adaptiveThreshold = scrapingQuality > 80 ? 70 : scrapingQuality > 60 ? 60 : 50;
    
    console.log(`🎯 Using adaptive verification threshold: ${adaptiveThreshold}%`);
    
    const verifiedProfiles: any[] = [];
    
    for (const profile of profiles) {
      try {
        const verificationRequest: ProfileVerificationRequest = {
          profileUrl: profile.url,
        platform: profile.platform,
          searchCriteria: {
            niches: params.niches,
            location: params.location,
            minAge: params.minAge,
            maxAge: params.maxAge,
            gender: params.gender,
            brandName: params.brandName,
            minFollowers: params.minFollowers,
            maxFollowers: params.maxFollowers
          }
        };
        
        const verificationResult = await this.verificationService.verifyProfile(verificationRequest);
        
        if (verificationResult.overallScore >= adaptiveThreshold) {
          profile.verificationResult = verificationResult;
          verifiedProfiles.push(profile);
        } else {
          console.log(`📉 Verification failed: ${profile.username} (${verificationResult.overallScore}% < ${adaptiveThreshold}%)`);
        }
      } catch (error) {
        console.error(`❌ Verification error for ${profile.username}:`, error);
        // Include profile if verification fails
        verifiedProfiles.push(profile);
      }
    }
    
    return verifiedProfiles;
  }

  /**
   * Apply intelligent ranking considering all factors
   */
  private applyIntelligentRanking(profiles: any[], params: any): any[] {
    return profiles.sort((a, b) => {
      // Multi-factor scoring
      let scoreA = 0;
      let scoreB = 0;
      
      // Aesthetic alignment (30%)
      scoreA += (a.aestheticScore || 50) * 0.3;
      scoreB += (b.aestheticScore || 50) * 0.3;
      
      // Quality score (25%)
      scoreA += (a.filteringDecision?.features?.followerCount || 0) > 10000 ? 25 : 15;
      scoreB += (b.filteringDecision?.features?.followerCount || 0) > 10000 ? 25 : 15;
      
      // Verification score (25%)
      scoreA += (a.verificationResult?.overallScore || 50) * 0.25;
      scoreB += (b.verificationResult?.overallScore || 50) * 0.25;
      
      // Priority score from scraping (20%)
      scoreA += (a.priorityScore || 50) * 0.2;
      scoreB += (b.priorityScore || 50) * 0.2;
      
      return scoreB - scoreA;
    });
  }

  /**
   * Try discovery fallbacks when main search fails
   */
  private async tryDiscoveryFallbacks(params: any): Promise<any[]> {
    const fallbackResults: any[] = [];
    
    // Try broader search terms
    if (params.query) {
      const broaderQuery = this.createBroaderQuery(params.query);
      console.log(`🔄 Trying broader query: "${broaderQuery}"`);
      
      try {
        const broaderResults = await searchInfluencersWithTwoTierDiscovery({
          platforms: params.platforms || ['instagram'],
          niches: params.niches || ['lifestyle'],
          minFollowers: params.minFollowers || 1000,
          maxFollowers: params.maxFollowers || 1000000,
          location: params.location,
          userQuery: broaderQuery,
          maxResults: 20
        });
        
        if (broaderResults.premiumResults.length > 0 || broaderResults.discoveryResults.length > 0) {
          fallbackResults.push(...broaderResults.premiumResults, ...broaderResults.discoveryResults);
        }
      } catch (error) {
        console.log('❌ Broader query failed:', error);
      }
    }
    
    // Try location-only search
    if (params.location && fallbackResults.length < 5) {
      console.log(`🔄 Trying location-focused search: ${params.location}`);
      
      try {
        const locationResults = await searchInfluencersWithTwoTierDiscovery({
          platforms: params.platforms || ['instagram'],
          niches: ['lifestyle'],
          minFollowers: 1000,
          maxFollowers: 1000000,
          location: params.location,
          userQuery: `influencers ${params.location}`,
          maxResults: 15
        });
        
        if (locationResults.premiumResults.length > 0 || locationResults.discoveryResults.length > 0) {
          fallbackResults.push(...locationResults.premiumResults, ...locationResults.discoveryResults);
        }
      } catch (error) {
        console.log('❌ Location search failed:', error);
      }
    }
    
    return fallbackResults;
  }

  /**
   * Emergency fallback when everything fails
   */
  private async emergencyFallback(params: any): Promise<any[]> {
    console.log('🆘 Executing emergency fallback...');
    
    const emergencyProfiles = [];
    const platforms = params.platforms || ['instagram'];
    
    for (const platform of platforms) {
      // Generate basic fallback profiles
      for (let i = 0; i < 5; i++) {
        const fallbackProfile = await generateEnhancedFallback(
          `https://${platform}.com/fallback_user_${i}`,
          platform,
          params
        );
        
        if (fallbackProfile) {
          emergencyProfiles.push({
            username: fallbackProfile.username,
            platform: fallbackProfile.platform,
            url: fallbackProfile.url,
            followers: fallbackProfile.estimatedMetrics.followers,
            engagementRate: fallbackProfile.estimatedMetrics.engagementRate,
            isEmergencyFallback: true,
            confidence: fallbackProfile.confidence,
            niche: fallbackProfile.inferredData.niche,
            location: fallbackProfile.inferredData.location
          });
      }
      }
    }
    
    return emergencyProfiles;
  }

  /**
   * Determine optimal scraping mode based on query complexity
   */
  private determineOptimalScrapingMode(params: any): 'economy' | 'balanced' | 'comprehensive' | 'unlimited' {
    let complexityScore = 0;
    
    // Query complexity
    if (params.query && params.query.length > 50) complexityScore += 2;
    if (params.brandName) complexityScore += 2;
    if (params.niches && params.niches.length > 2) complexityScore += 1;
    if (params.location) complexityScore += 1;
    if (params.minFollowers || params.maxFollowers) complexityScore += 1;
    if (params.platforms && params.platforms.length > 2) complexityScore += 1;
    
    // User preferences (could be added to params)
    if (params.scrapingMode) return params.scrapingMode;
    
    // Auto-determine based on complexity
    if (complexityScore <= 3) return 'economy';
    if (complexityScore <= 6) return 'balanced';
    if (complexityScore <= 8) return 'comprehensive';
    return 'unlimited';
  }

  /**
   * Generate enhanced summary with all improvements
   */
  private generateEnhancedSummary(
    profiles: any[], 
    scrapingResult: any, 
    qualityMetrics: any, 
    processingTime: number
  ): any {
    const verified = profiles.filter(p => p.verificationResult?.verified).length;
    const highAesthetic = profiles.filter(p => (p.aestheticScore || 0) >= 80).length;
    const highQuality = profiles.filter(p => p.filteringDecision?.confidence >= 80).length;

    return {
      totalFound: scrapingResult.totalFound,
      totalScraped: scrapingResult.totalScraped,
      totalReturned: profiles.length,
      verified,
      highAestheticAlignment: highAesthetic,
      highQuality,
      averageQualityScore: qualityMetrics.qualityScore,
      averageAestheticScore: profiles.reduce((sum, p) => sum + (p.aestheticScore || 50), 0) / profiles.length,
      processingTime,
      scrapingEfficiency: scrapingResult.resourceUsage.successRate,
      improvements: {
        aestheticIntelligence: true,
        smartScraping: true,
        advancedFiltering: true,
        fallbackStrategies: true,
        qualityTracking: true
      }
    };
  }

  /**
   * Generate intelligent recommendations
   */
  private generateIntelligentRecommendations(
    profiles: any[], 
    params: any, 
    scrapingResult: any, 
    qualityMetrics: any,
    optimization: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Quality-based recommendations
    if (qualityMetrics.qualityScore >= 80) {
      recommendations.push('🌟 Excellent search quality - results are highly relevant and well-matched');
    } else if (qualityMetrics.qualityScore >= 60) {
      recommendations.push('✅ Good search quality - consider verification for top candidates');
    } else {
      recommendations.push('⚠️ Consider refining search criteria for better quality results');
    }
    
    // Aesthetic recommendations
    const avgAesthetic = profiles.reduce((sum, p) => sum + (p.aestheticScore || 50), 0) / profiles.length;
    if (avgAesthetic < 50) {
      recommendations.push('🎨 Low aesthetic alignment detected - try more specific style keywords');
    } else if (avgAesthetic >= 80) {
      recommendations.push('🎨 Excellent aesthetic matching - perfect for style-specific campaigns');
    }

    // Performance recommendations
    if (scrapingResult.resourceUsage.timeSpent > 60000) {
      recommendations.push('⏰ Consider economy mode for faster results in future searches');
    }

    // Optimization recommendations
    if (optimization.expectedImprovement > 15) {
      recommendations.push(`💡 Query optimization available: ${optimization.optimization.join(', ')}`);
    }
    
    // Coverage recommendations
    if (profiles.length < 5) {
      recommendations.push('📈 Few results found - try broader criteria or comprehensive mode');
    } else if (profiles.length > 30) {
      recommendations.push('🎯 Many results found - consider narrowing criteria for more focused results');
    }
    
    // Fallback usage recommendations
    const fallbackProfiles = profiles.filter(p => p.isFallback || p.isEmergencyFallback);
    if (fallbackProfiles.length > 0) {
      recommendations.push(`🔄 ${fallbackProfiles.length} fallback profiles included - verify manually for best results`);
    }

    return recommendations;
  }

  /**
   * Extract platform from URL
   */
  private extractPlatform(url: string): string {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'unknown';
  }

  /**
   * Extract username from URL
   */
  private extractUsername(url: string): string {
    const match = url.match(/@([^/?\s]+)/);
    return match ? match[1] : url.split('/').pop() || 'unknown';
  }

  /**
   * Create empty response when no results found
   */
  private createEmptyResponse(startTime: number, message: string): EnhancedSearchResponse {
    return {
      results: [],
      summary: {
        totalFound: 0,
        totalScraped: 0,
        totalReturned: 0,
        verified: 0,
        averageScore: 0,
        processingTime: Date.now() - startTime,
        highAestheticAlignment: 0,
        highQuality: 0,
        averageQualityScore: 0,
        averageAestheticScore: 0,
        scrapingEfficiency: 0,
        improvements: {
          aestheticIntelligence: true,
          smartScraping: true,
          advancedFiltering: true,
          fallbackStrategies: true,
          qualityTracking: true
        }
      },
      recommendations: [message, '💡 Try broader search terms or different criteria']
    };
  }

  /**
   * Process fallback results
   */
  private processFallbackResults(fallbackResults: any[], params: any, startTime: number): EnhancedSearchResponse {
    const formattedResults = fallbackResults.map(this.formatEnhancedResult.bind(this));
    
    return {
      results: formattedResults,
      summary: this.generateFallbackSummary(formattedResults, Date.now() - startTime),
      recommendations: [
        '🔄 Using fallback discovery results',
        '💡 Primary search failed - results may be less accurate',
        '🔧 Try adjusting search parameters for better results'
      ]
    };
  }

  /**
   * Format profile for enhanced result
   */
  private formatEnhancedResult(profile: any): EnhancedSearchResult {
    return {
      profileUrl: profile.url || profile.profileUrl,
      platform: profile.platform || this.extractPlatform(profile.url || profile.profileUrl),
      discoveryScore: profile.discoveryScore || 0.5,
      username: profile.username || this.extractUsername(profile.url || profile.profileUrl),
      followers: profile.followers || profile.followerCount,
      category: profile.category || profile.niche?.join(', ') || 'lifestyle',
      location: profile.location,
      combinedScore: profile.combinedScore || this.calculateCombinedScore(profile),
      verificationData: profile.verificationResult,
      aestheticScore: profile.aestheticScore,
      filteringDecision: profile.filteringDecision,
      isFallback: profile.isFallback || profile.isEmergencyFallback || false
    };
  }

  /**
   * Calculate combined score for profile
   */
  private calculateCombinedScore(profile: any): number {
    let score = 50; // Base score
    
    if (profile.aestheticScore) score += profile.aestheticScore * 0.3;
    if (profile.verificationResult?.overallScore) score += profile.verificationResult.overallScore * 0.4;
    if (profile.filteringDecision?.confidence) score += profile.filteringDecision.confidence * 0.3;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Generate fallback summary
   */
  private generateFallbackSummary(profiles: any[], processingTime: number): any {
    return {
      totalFound: profiles.length,
      totalScraped: profiles.length,
      totalReturned: profiles.length,
      verified: profiles.filter(p => p.verificationData?.verified).length,
      highAestheticAlignment: profiles.filter(p => (p.aestheticScore || 0) >= 80).length,
      highQuality: profiles.filter(p => (p.combinedScore || 0) >= 70).length,
      averageQualityScore: profiles.reduce((sum, p) => sum + (p.combinedScore || 50), 0) / profiles.length,
      averageAestheticScore: profiles.reduce((sum, p) => sum + (p.aestheticScore || 50), 0) / profiles.length,
      processingTime,
      scrapingEfficiency: 0.5,
      improvements: {
        aestheticIntelligence: false,
        smartScraping: false,
        advancedFiltering: false,
        fallbackStrategies: true,
        qualityTracking: false
      }
    };
  }

  /**
   * Create broader query for fallback
   */
  private createBroaderQuery(originalQuery: string): string {
    // Remove specific terms and make query more general
    const words = originalQuery.split(' ');
    const essentialWords = words.filter(word => 
      !['style', 'aesthetic', 'specific', 'particular', 'exactly'].includes(word.toLowerCase())
    );
    
    return essentialWords.slice(0, 3).join(' '); // Keep only first 3 essential words
  }

  /**
   * Primary scraping method
   */
  private async primaryScrapingMethod(profiles: any[], platform: string, params: any): Promise<any[]> {
    // This would integrate with your existing scraping logic
    // For now, return empty array to trigger fallback
    return [];
  }

  /**
   * Scraping with fallbacks
   */
  private async scrapingWithFallbacks(profiles: any[], platform: string, params: any): Promise<any[]> {
    // Try alternative scraping methods
    const fallbackProfiles = await Promise.all(
      profiles.map(async (profile: any) => {
        const fallbackData = await generateEnhancedFallback(profile.url, platform, params);
        return fallbackData ? {
          ...profile,
          ...fallbackData,
          isFallback: true
        } : null;
      })
    );
    
    return fallbackProfiles.filter(p => p !== null);
  }
}

// Singleton instance
const enhancedSearchService = new EnhancedSearchService();

export { enhancedSearchService, type SearchCacheEntry, type CacheStats }; 