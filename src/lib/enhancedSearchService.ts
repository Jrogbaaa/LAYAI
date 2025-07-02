/**
 * Enhanced Search Service with Smart Caching
 * Provides intelligent caching for search queries to improve performance
 */

import { searchInfluencersWithTwoTierDiscovery } from './apifyService';
import { ProfileVerificationService, type ProfileVerificationRequest, type VerificationResult } from './profileVerificationService';
import { spanishLocationService } from './spanishLocationService';

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
}

interface EnhancedSearchResponse {
  results: EnhancedSearchResult[];
  summary: {
    totalFound: number;
    verified: number;
    averageScore: number;
    processingTime: number;
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
      { location: 'España', platforms: ['instagram'], minFollowers: 10000 },
      { location: 'México', platforms: ['instagram'], minFollowers: 50000 },
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
   * Enhanced search with optional verification
   */
  async searchWithVerification(params: EnhancedSearchParams): Promise<EnhancedSearchResponse> {
    const startTime = Date.now();
    
    console.log('🚀 Starting enhanced search with verification...');
    
    try {
      // Step 1: Perform initial discovery search
      console.log('🔍 Phase 1: Discovery search...');
      const discoveryResults = await searchInfluencersWithTwoTierDiscovery({
        query: params.query,
        location: params.location,
        gender: params.gender,
        platforms: params.platforms || ['instagram', 'tiktok', 'youtube'],
        maxResults: params.maxResults || 50
      });

      if (!discoveryResults.success || discoveryResults.influencers.length === 0) {
        return {
          results: [],
          summary: {
            totalFound: 0,
            verified: 0,
            averageScore: 0,
            processingTime: Date.now() - startTime
          },
          recommendations: ['No profiles found in discovery phase. Try broader search terms.']
        };
      }

      console.log(`✅ Discovery found ${discoveryResults.influencers.length} profiles`);

      // Step 2: Convert discovery results to enhanced format
      let enhancedResults: EnhancedSearchResult[] = discoveryResults.influencers.map(profile => ({
        profileUrl: profile.url,
        platform: this.extractPlatform(profile.url),
        discoveryScore: 0.5, // Base discovery score
        username: this.extractUsername(profile.url),
        followers: profile.followerCount,
        category: Array.isArray(profile.category) ? profile.category.join(', ') : profile.category,
        location: profile.location,
        combinedScore: 50 // Default score before verification
      }));

      // Step 3: Apply verification if requested
      if (params.verificationLevel && params.verificationLevel !== 'off') {
        console.log(`🔬 Phase 2: ${params.verificationLevel} verification...`);
        
        const verificationResults = await this.performVerification(
          enhancedResults,
          {
            minAge: params.minAge,
            maxAge: params.maxAge,
            location: params.location,
            gender: params.gender,
            niches: params.niches,
            brandName: params.brandName,
            minFollowers: params.minFollowers,
            maxFollowers: params.maxFollowers
          },
          params.verificationLevel
        );

        // Merge verification results
        enhancedResults = this.mergeVerificationResults(enhancedResults, verificationResults);
      }

      // Step 4: Sort by combined score
      enhancedResults.sort((a, b) => b.combinedScore - a.combinedScore);

      // Step 5: Generate summary and recommendations
      const summary = this.generateSummary(enhancedResults, Date.now() - startTime);
      const recommendations = this.generateRecommendations(enhancedResults, params);

      console.log(`✅ Enhanced search completed: ${summary.verified}/${summary.totalFound} verified`);

      return {
        results: enhancedResults,
        summary,
        recommendations
      };

    } catch (error) {
      console.error('❌ Enhanced search failed:', error);
      throw new Error(`Enhanced search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform verification on discovery results
   */
  private async performVerification(
    profiles: EnhancedSearchResult[],
    searchCriteria: any,
    verificationLevel: 'basic' | 'full'
  ): Promise<VerificationResult[]> {
    
    // Prepare verification requests
    const verificationRequests: ProfileVerificationRequest[] = profiles.map(profile => ({
      profileUrl: profile.profileUrl,
      platform: profile.platform as any,
      searchCriteria
    }));

    if (verificationLevel === 'basic') {
      // Use basic verification via API call
      return await this.performBasicVerification(profiles, searchCriteria);
    } else {
      // Use full verification service
      return await this.verificationService.verifyProfiles(verificationRequests);
    }
  }

  /**
   * Basic verification using discovery data
   */
  private async performBasicVerification(
    profiles: EnhancedSearchResult[],
    searchCriteria: any
  ): Promise<VerificationResult[]> {
    
    return profiles.map(profile => {
      const extractedData = {
        username: profile.username,
        followerCount: profile.followers,
        location: profile.location,
        bio: profile.category,
      };

      // Basic scoring
      let nicheScore = 0;
      let followerScore = 100;
      let locationScore = 50;

      // Niche scoring
      if (searchCriteria.niches && profile.category) {
        const categoryLower = profile.category.toLowerCase();
        for (const niche of searchCriteria.niches) {
          if (categoryLower.includes(niche.toLowerCase())) {
            nicheScore += 25;
          }
        }
      }

      // Follower scoring
      if (searchCriteria.minFollowers && profile.followers && profile.followers < searchCriteria.minFollowers) {
        followerScore -= 50;
      }
      if (searchCriteria.maxFollowers && profile.followers && profile.followers > searchCriteria.maxFollowers) {
        followerScore -= 50;
      }

      // Location scoring
      if (searchCriteria.location && profile.location) {
        const locationMatch = profile.location.toLowerCase().includes(searchCriteria.location.toLowerCase());
        locationScore = locationMatch ? 100 : 20;
      }

      const overallScore = Math.round(
        nicheScore * 0.4 +
        followerScore * 0.3 +
        locationScore * 0.3
      );

      return {
        profileUrl: profile.profileUrl,
        platform: profile.platform,
        verified: overallScore >= 60,
        confidence: Math.min(overallScore / 100 * 0.7, 1),
        extractedData,
        matchAnalysis: {
          nicheAlignment: {
            score: nicheScore,
            matchedKeywords: [],
            explanation: `Basic niche analysis based on category`
          },
          demographicMatch: {
            score: locationScore,
            locationMatch: locationScore > 50,
            explanation: `Location analysis: ${profile.location || 'not specified'}`
          },
          brandCompatibility: {
            score: 70,
            reasons: ['Basic verification - limited brand analysis'],
            redFlags: []
          },
          followerValidation: {
            score: followerScore,
            inRange: followerScore >= 100,
            quality: 'medium' as const,
            explanation: `Follower count: ${profile.followers?.toLocaleString() || 'unknown'}`
          }
        },
        overallScore,
        scrapedAt: new Date()
      } as VerificationResult;
    });
  }

  /**
   * Merge verification results with enhanced results
   */
  private mergeVerificationResults(
    enhancedResults: EnhancedSearchResult[],
    verificationResults: VerificationResult[]
  ): EnhancedSearchResult[] {
    
    const verificationMap = new Map(
      verificationResults.map(result => [result.profileUrl, result])
    );

    return enhancedResults.map(result => {
      const verification = verificationMap.get(result.profileUrl);
      if (verification) {
        return {
          ...result,
          verificationData: verification,
          combinedScore: this.calculateCombinedScore(result.discoveryScore, verification.overallScore)
        };
      }
      return result;
    });
  }

  /**
   * Calculate combined score from discovery and verification
   */
  private calculateCombinedScore(discoveryScore: number, verificationScore: number): number {
    // Weight verification more heavily than discovery
    return Math.round(discoveryScore * 30 + verificationScore * 0.7);
  }

  /**
   * Generate search summary
   */
  private generateSummary(results: EnhancedSearchResult[], processingTime: number) {
    const verified = results.filter(r => r.verificationData?.verified).length;
    const scores = results
      .filter(r => r.verificationData)
      .map(r => r.verificationData!.overallScore);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      totalFound: results.length,
      verified,
      averageScore: Math.round(averageScore),
      processingTime
    };
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    results: EnhancedSearchResult[],
    params: EnhancedSearchParams
  ): string[] {
    const recommendations: string[] = [];
    
    const highQuality = results.filter(r => r.combinedScore >= 80).length;
    const lowQuality = results.filter(r => r.combinedScore < 50).length;

    if (highQuality === 0) {
      recommendations.push('⚠️ No high-quality matches found. Consider broadening your search criteria.');
    } else if (highQuality >= 5) {
      recommendations.push('✅ Excellent results! You have multiple high-quality candidates.');
    }

    if (lowQuality > results.length * 0.7) {
      recommendations.push('🔍 Many low-quality matches. Try more specific search terms.');
    }

    if (params.verificationLevel === 'off') {
      recommendations.push('💡 Enable verification to get more accurate match scores.');
    } else if (params.verificationLevel === 'basic') {
      recommendations.push('🎯 Consider full verification for your top candidates.');
    }

    if (results.length < 10) {
      recommendations.push('📈 Consider broader search terms to find more candidates.');
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
}

// Singleton instance
const enhancedSearchService = new EnhancedSearchService();

export { enhancedSearchService, type SearchCacheEntry, type CacheStats }; 