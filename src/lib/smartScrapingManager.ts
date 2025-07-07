/**
 * Smart Scraping Manager
 * Intelligent prioritization and resource management for influencer discovery
 */

export interface ScrapingConfig {
  mode: 'economy' | 'balanced' | 'comprehensive' | 'unlimited';
  maxProfiles: number;
  priorityThreshold: number;
  timeoutMs: number;
  retryAttempts: number;
  enableParallelProcessing: boolean;
  fallbackEnabled: boolean;
}

export interface ProfilePriority {
  url: string;
  platform: string;
  priority: number;
  reason: string;
  qualityScore: number;
  estimatedRelevance: number;
}

export interface ScrapingResult {
  profiles: any[];
  totalFound: number;
  totalScraped: number;
  qualityScore: number;
  resourceUsage: {
    timeSpent: number;
    apiCalls: number;
    successRate: number;
  };
  recommendations: string[];
}

/**
 * Predefined scraping configurations
 */
export const SCRAPING_CONFIGS: Record<string, ScrapingConfig> = {
  economy: {
    mode: 'economy',
    maxProfiles: 15,
    priorityThreshold: 70,
    timeoutMs: 60000,
    retryAttempts: 1,
    enableParallelProcessing: false,
    fallbackEnabled: true
  },
  balanced: {
    mode: 'balanced',
    maxProfiles: 25,
    priorityThreshold: 60,
    timeoutMs: 90000,
    retryAttempts: 2,
    enableParallelProcessing: true,
    fallbackEnabled: true
  },
  comprehensive: {
    mode: 'comprehensive',
    maxProfiles: 40,
    priorityThreshold: 50,
    timeoutMs: 120000,
    retryAttempts: 3,
    enableParallelProcessing: true,
    fallbackEnabled: true
  },
  unlimited: {
    mode: 'unlimited',
    maxProfiles: 100,
    priorityThreshold: 30,
    timeoutMs: 300000,
    retryAttempts: 3,
    enableParallelProcessing: true,
    fallbackEnabled: false
  }
};

/**
 * Smart Scraping Manager Class
 */
export class SmartScrapingManager {
  private config: ScrapingConfig;
  private profileQueue: ProfilePriority[] = [];
  private scrapedProfiles: any[] = [];
  private stats = {
    totalFound: 0,
    totalScraped: 0,
    apiCalls: 0,
    timeSpent: 0,
    successRate: 0
  };

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  /**
   * Analyze and prioritize discovered profiles
   */
  async prioritizeProfiles(
    discoveredProfiles: { url: string; platform: string }[],
    searchParams: any
  ): Promise<ProfilePriority[]> {
    console.log(`🧠 Analyzing ${discoveredProfiles.length} profiles for intelligent prioritization...`);
    
    const prioritizedProfiles: ProfilePriority[] = [];

    for (const profile of discoveredProfiles) {
      const priority = await this.calculateProfilePriority(profile, searchParams);
      prioritizedProfiles.push(priority);
    }

    // Sort by priority (higher is better)
    prioritizedProfiles.sort((a, b) => b.priority - a.priority);

    // Apply priority threshold
    const qualifiedProfiles = prioritizedProfiles.filter(
      profile => profile.priority >= this.config.priorityThreshold
    );

    console.log(`🎯 Prioritization complete: ${qualifiedProfiles.length}/${discoveredProfiles.length} profiles qualify for scraping`);
    console.log(`📊 Top 5 priorities: ${qualifiedProfiles.slice(0, 5).map(p => `${this.extractUsername(p.url)} (${p.priority})`).join(', ')}`);

    return qualifiedProfiles;
  }

  /**
   * Calculate priority score for a profile
   */
  private async calculateProfilePriority(
    profile: { url: string; platform: string },
    searchParams: any
  ): Promise<ProfilePriority> {
    let priority = 50; // Base priority
    let qualityScore = 50;
    let estimatedRelevance = 50;
    const reasons: string[] = [];

    const username = this.extractUsername(profile.url);

    // 1. Username Quality Analysis
    const usernameQuality = this.analyzeUsernameQuality(username);
    priority += usernameQuality * 0.3;
    qualityScore += usernameQuality * 0.2;
    if (usernameQuality > 70) reasons.push('High-quality username');

    // 2. Platform Relevance
    const platformRelevance = this.analyzePlatformRelevance(profile.platform, searchParams);
    priority += platformRelevance * 0.2;
    if (platformRelevance > 80) reasons.push('Optimal platform match');

    // 3. Brand Context Analysis
    if (searchParams.brandName) {
      const brandRelevance = this.analyzeBrandRelevance(username, searchParams.brandName);
      priority += brandRelevance * 0.25;
      estimatedRelevance += brandRelevance * 0.3;
      if (brandRelevance > 70) reasons.push('Strong brand alignment');
    }

    // 4. Niche Alignment
    if (searchParams.niches && searchParams.niches.length > 0) {
      const nicheRelevance = this.analyzeNicheAlignment(username, searchParams.niches);
      priority += nicheRelevance * 0.2;
      estimatedRelevance += nicheRelevance * 0.3;
      if (nicheRelevance > 60) reasons.push('Niche alignment detected');
    }

    // 5. Geographic Relevance
    if (searchParams.location) {
      const geoRelevance = this.analyzeGeographicRelevance(username, searchParams.location);
      priority += geoRelevance * 0.15;
      if (geoRelevance > 70) reasons.push('Geographic match');
    }

    // 6. Account Verification Indicators
    const verificationScore = this.analyzeVerificationIndicators(username);
    priority += verificationScore * 0.1;
    qualityScore += verificationScore * 0.15;
    if (verificationScore > 80) reasons.push('Likely verified account');

    // Normalize scores
    priority = Math.min(100, Math.max(0, priority));
    qualityScore = Math.min(100, Math.max(0, qualityScore));
    estimatedRelevance = Math.min(100, Math.max(0, estimatedRelevance));

    return {
      url: profile.url,
      platform: profile.platform,
      priority: Math.round(priority),
      reason: reasons.join(', ') || 'Basic profile analysis',
      qualityScore: Math.round(qualityScore),
      estimatedRelevance: Math.round(estimatedRelevance)
    };
  }

  /**
   * Execute smart scraping with intelligent resource management
   */
  async executeScraping(
    prioritizedProfiles: ProfilePriority[],
    scrapingFunction: (profiles: any[], platform: string, params: any) => Promise<any[]>,
    searchParams: any
  ): Promise<ScrapingResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting smart scraping with ${this.config.mode} mode`);
    console.log(`📋 Processing ${Math.min(prioritizedProfiles.length, this.config.maxProfiles)} profiles`);

    this.stats = {
      totalFound: prioritizedProfiles.length,
      totalScraped: 0,
      apiCalls: 0,
      timeSpent: 0,
      successRate: 0
    };

    // Group profiles by platform for efficient batch processing
    const platformGroups = this.groupProfilesByPlatform(prioritizedProfiles);
    
    // Process each platform group
    for (const [platform, profiles] of Object.entries(platformGroups)) {
      if (this.stats.totalScraped >= this.config.maxProfiles) break;

      const remainingSlots = this.config.maxProfiles - this.stats.totalScraped;
      const profilesToProcess = profiles.slice(0, remainingSlots);

      console.log(`📱 Processing ${profilesToProcess.length} ${platform} profiles...`);

      try {
        const platformResults = await this.scrapePlatformProfiles(
          profilesToProcess,
          platform,
          scrapingFunction,
          searchParams
        );

        this.scrapedProfiles.push(...platformResults);
        this.stats.totalScraped += platformResults.length;
        this.stats.apiCalls++;

        console.log(`✅ Successfully scraped ${platformResults.length} ${platform} profiles`);

      } catch (error) {
        console.error(`❌ Error scraping ${platform} profiles:`, error);
        
        if (this.config.fallbackEnabled) {
          console.log(`🔄 Attempting fallback for ${platform}...`);
          const fallbackResults = await this.createFallbackProfiles(profilesToProcess, platform);
          this.scrapedProfiles.push(...fallbackResults);
        }
      }
    }

    // Calculate final metrics
    this.stats.timeSpent = Date.now() - startTime;
    this.stats.successRate = this.stats.totalScraped / Math.min(this.stats.totalFound, this.config.maxProfiles);

    const qualityScore = this.calculateOverallQualityScore();
    const recommendations = this.generateRecommendations();

    console.log(`🎯 Smart scraping complete: ${this.stats.totalScraped}/${this.stats.totalFound} profiles scraped`);
    console.log(`📊 Quality score: ${qualityScore}% | Success rate: ${(this.stats.successRate * 100).toFixed(1)}%`);

    return {
      profiles: this.scrapedProfiles,
      totalFound: this.stats.totalFound,
      totalScraped: this.stats.totalScraped,
      qualityScore,
      resourceUsage: {
        timeSpent: this.stats.timeSpent,
        apiCalls: this.stats.apiCalls,
        successRate: this.stats.successRate
      },
      recommendations
    };
  }

  /**
   * Group profiles by platform for efficient batch processing
   */
  private groupProfilesByPlatform(profiles: ProfilePriority[]): Record<string, ProfilePriority[]> {
    const groups: Record<string, ProfilePriority[]> = {};
    
    profiles.forEach(profile => {
      if (!groups[profile.platform]) {
        groups[profile.platform] = [];
      }
      groups[profile.platform].push(profile);
    });

    // Sort each platform group by priority
    Object.keys(groups).forEach(platform => {
      groups[platform].sort((a, b) => b.priority - a.priority);
    });

    return groups;
  }

  /**
   * Scrape profiles for a specific platform
   */
  private async scrapePlatformProfiles(
    profiles: ProfilePriority[],
    platform: string,
    scrapingFunction: (profiles: any[], platform: string, params: any) => Promise<any[]>,
    searchParams: any
  ): Promise<any[]> {
    const profileUrls = profiles.map(p => ({ url: p.url, platform: p.platform }));
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Scraping timeout')), this.config.timeoutMs);
    });

    const scrapingPromise = scrapingFunction(profileUrls, platform, searchParams);

    try {
      const results = await Promise.race([scrapingPromise, timeoutPromise]) as any[];
      
      // Enhance results with priority information
      return results.map(result => {
        const priorityInfo = profiles.find(p => 
          this.extractUsername(p.url) === result.username
        );
        
        return {
          ...result,
          priorityScore: priorityInfo?.priority || 50,
          qualityScore: priorityInfo?.qualityScore || 50,
          estimatedRelevance: priorityInfo?.estimatedRelevance || 50
        };
      });

    } catch (error) {
      if (this.config.retryAttempts > 0) {
        console.log(`🔄 Retrying ${platform} scraping (${this.config.retryAttempts} attempts left)...`);
        // Recursive retry with reduced config
        const retryConfig = { ...this.config, retryAttempts: this.config.retryAttempts - 1 };
        const retryManager = new SmartScrapingManager(retryConfig);
        return retryManager.scrapePlatformProfiles(profiles, platform, scrapingFunction, searchParams);
      }
      throw error;
    }
  }

  /**
   * Create fallback profiles when scraping fails
   */
  private async createFallbackProfiles(profiles: ProfilePriority[], platform: string): Promise<any[]> {
    return profiles.map(profile => ({
      username: this.extractUsername(profile.url),
      platform: profile.platform,
      url: profile.url,
      followers: this.estimateFollowers(profile.qualityScore),
      engagementRate: this.estimateEngagement(profile.qualityScore),
      isFallback: true,
      priorityScore: profile.priority,
      qualityScore: profile.qualityScore,
      estimatedRelevance: profile.estimatedRelevance
    }));
  }

  /**
   * Analyze username quality
   */
  private analyzeUsernameQuality(username: string): number {
    let score = 50;

    // Length check
    if (username.length >= 3 && username.length <= 20) score += 20;
    else if (username.length > 20) score -= 10;

    // Character composition
    const hasNumbers = /\d/.test(username);
    const hasSpecialChars = /[._-]/.test(username);
    const isAllNumbers = /^\d+$/.test(username);

    if (isAllNumbers) score -= 30;
    else if (hasNumbers && hasSpecialChars) score += 10;
    else if (hasNumbers) score += 5;

    // Avoid generic patterns
    const genericPatterns = ['user', 'profile', 'account', 'test', 'temp', 'admin'];
    if (genericPatterns.some(pattern => username.toLowerCase().includes(pattern))) {
      score -= 25;
    }

    // Brand/business indicators
    if (username.toLowerCase().includes('official') || username.toLowerCase().includes('brand')) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Analyze platform relevance
   */
  private analyzePlatformRelevance(platform: string, searchParams: any): number {
    const platformPreferences: Record<string, number> = {
      'instagram': 90,
      'tiktok': 85,
      'youtube': 80,
      'twitter': 70
    };

    let score = platformPreferences[platform.toLowerCase()] || 50;

    // Adjust based on search parameters
    if (searchParams.platforms && searchParams.platforms.includes(platform.toLowerCase())) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Analyze brand relevance
   */
  private analyzeBrandRelevance(username: string, brandName: string): number {
    const profile = username.toLowerCase();
    const brand = brandName.toLowerCase();

    let score = 40;

    // Direct brand mention
    if (profile.includes(brand)) score += 30;

    // Brand category keywords
    const brandCategories: Record<string, string[]> = {
      'ikea': ['home', 'interior', 'design', 'decor', 'style'],
      'nike': ['fitness', 'sport', 'athletic', 'gym', 'workout'],
      'sephora': ['beauty', 'makeup', 'skincare', 'cosmetic'],
      'food': ['chef', 'cook', 'recipe', 'kitchen', 'food']
    };

    const keywords = brandCategories[brand] || [];
    const matchingKeywords = keywords.filter(keyword => profile.includes(keyword));
    score += matchingKeywords.length * 8;

    return Math.min(100, score);
  }

  /**
   * Analyze niche alignment
   */
  private analyzeNicheAlignment(username: string, niches: string[]): number {
    const profile = username.toLowerCase();
    let score = 30;

    const nicheKeywords: Record<string, string[]> = {
      'home': ['home', 'interior', 'decor', 'design', 'house', 'living'],
      'fitness': ['fit', 'gym', 'workout', 'health', 'strong', 'athlete'],
      'beauty': ['beauty', 'makeup', 'skin', 'cosmetic', 'glam', 'pretty'],
      'food': ['food', 'recipe', 'cook', 'chef', 'kitchen', 'eat'],
      'fashion': ['fashion', 'style', 'outfit', 'clothing', 'wear', 'look'],
      'travel': ['travel', 'trip', 'adventure', 'explore', 'journey', 'wander']
    };

    niches.forEach(niche => {
      const keywords = nicheKeywords[niche.toLowerCase()] || [niche.toLowerCase()];
      const matches = keywords.filter(keyword => profile.includes(keyword));
      score += matches.length * 12;
    });

    return Math.min(100, score);
  }

  /**
   * Analyze geographic relevance
   */
  private analyzeGeographicRelevance(username: string, location: string): number {
    const profile = username.toLowerCase();
    const loc = location.toLowerCase();

    let score = 40;

    // Direct location mention
    if (profile.includes(loc)) score += 30;

    // Country/region codes
    const locationCodes: Record<string, string[]> = {
      'spain': ['es', 'esp', 'madrid', 'barcelona', 'spanish', 'espana'],
      'usa': ['us', 'usa', 'america', 'american', 'ny', 'la', 'nyc'],
      'uk': ['uk', 'london', 'british', 'england', 'britain'],
      'france': ['fr', 'paris', 'french', 'france']
    };

    const codes = locationCodes[loc] || [];
    const matchingCodes = codes.filter(code => profile.includes(code));
    score += matchingCodes.length * 10;

    return Math.min(100, score);
  }

  /**
   * Analyze verification indicators
   */
  private analyzeVerificationIndicators(username: string): number {
    let score = 50;

    // Professional indicators
    if (username.toLowerCase().includes('official')) score += 25;
    if (username.toLowerCase().includes('verified')) score += 20;
    if (username.toLowerCase().includes('real')) score += 15;

    // Avoid fake indicators
    if (username.toLowerCase().includes('fake')) score -= 30;
    if (username.toLowerCase().includes('spam')) score -= 30;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQualityScore(): number {
    if (this.scrapedProfiles.length === 0) return 0;

    const totalQuality = this.scrapedProfiles.reduce((sum, profile) => {
      return sum + (profile.qualityScore || 50);
    }, 0);

    return Math.round(totalQuality / this.scrapedProfiles.length);
  }

  /**
   * Generate recommendations based on scraping results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.stats.successRate < 0.5) {
      recommendations.push('⚠️ Low success rate - consider using comprehensive mode for better results');
    }

    if (this.stats.totalScraped < 10) {
      recommendations.push('📈 Few profiles found - try broader search criteria or unlimited mode');
    }

    if (this.stats.timeSpent > 120000) {
      recommendations.push('⏰ Long processing time - consider economy mode for faster results');
    }

    const highQualityProfiles = this.scrapedProfiles.filter(p => p.qualityScore > 80).length;
    if (highQualityProfiles > this.scrapedProfiles.length * 0.7) {
      recommendations.push('🌟 High-quality results - excellent profile selection');
    }

    if (this.config.mode === 'economy' && this.stats.successRate > 0.8) {
      recommendations.push('💡 Consider balanced mode for more comprehensive results');
    }

    return recommendations;
  }

  /**
   * Extract username from profile URL
   */
  private extractUsername(url: string): string {
    const match = url.match(/\/([^\/\?]+)\/?$/);
    return match ? match[1] : url;
  }

  /**
   * Estimate followers based on quality score
   */
  private estimateFollowers(qualityScore: number): number {
    // Rough estimation based on quality
    if (qualityScore > 80) return Math.floor(Math.random() * 500000) + 100000;
    if (qualityScore > 60) return Math.floor(Math.random() * 100000) + 50000;
    return Math.floor(Math.random() * 50000) + 10000;
  }

  /**
   * Estimate engagement based on quality score
   */
  private estimateEngagement(qualityScore: number): number {
    // Rough estimation based on quality
    if (qualityScore > 80) return Math.random() * 0.05 + 0.03;
    if (qualityScore > 60) return Math.random() * 0.03 + 0.02;
    return Math.random() * 0.02 + 0.01;
  }
}

/**
 * Factory function to create appropriate scraping manager
 */
export function createSmartScrapingManager(
  mode: 'economy' | 'balanced' | 'comprehensive' | 'unlimited' = 'balanced',
  customConfig?: Partial<ScrapingConfig>
): SmartScrapingManager {
  const baseConfig = SCRAPING_CONFIGS[mode];
  const finalConfig = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
  
  return new SmartScrapingManager(finalConfig);
}

/**
 * Enhanced search function with smart scraping
 */
export async function searchWithSmartScraping(
  searchParams: any,
  scrapingMode: 'economy' | 'balanced' | 'comprehensive' | 'unlimited' = 'balanced',
  customConfig?: Partial<ScrapingConfig>
): Promise<{
  results: any[];
  scrapingStats: ScrapingResult;
  recommendations: string[];
}> {
  const manager = createSmartScrapingManager(scrapingMode, customConfig);
  
  console.log(`🧠 Starting smart search with ${scrapingMode} mode`);
  
  // This would integrate with your existing discovery function
  // For now, we'll assume you have a discovery function that returns profile URLs
  const discoveredProfiles = []; // Replace with actual discovery logic
  
  const prioritizedProfiles = await manager.prioritizeProfiles(discoveredProfiles, searchParams);
  
  // Replace with your actual scraping function
  const scrapingFunction = async (profiles: any[], platform: string, params: any) => {
    // This would call your existing Apify scraping logic
    return [];
  };
  
  const scrapingResult = await manager.executeScraping(
    prioritizedProfiles,
    scrapingFunction,
    searchParams
  );
  
  return {
    results: scrapingResult.profiles,
    scrapingStats: scrapingResult,
    recommendations: [
      ...scrapingResult.recommendations,
      `📊 Quality score: ${scrapingResult.qualityScore}%`,
      `⏱️ Processing time: ${(scrapingResult.resourceUsage.timeSpent / 1000).toFixed(1)}s`
    ]
  };
} 