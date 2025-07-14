import { ProcessedBrief, MatchingCriteria } from './briefProcessor';
import { InfluencerMatcher } from '@/utils/matchingAlgorithm';
import { calculateDynamicBrandCompatibility } from './enhancedCompatibilityEngine';
import { searchVettedInfluencers } from './vettedInfluencersService';
import { searchInfluencersWithApify } from './apifyService';
import { analyzeBrand, generateInfluencerCriteria } from './brandIntelligence';
import { AdvancedFilteringSystem } from './advancedFilteringSystem';

export interface EnhancedMatchResult {
  influencer: any;
  scores: {
    overall: number;
    brandCompatibility: number;
    demographicMatch: number;
    contentAlignment: number;
    engagementQuality: number;
    audienceOverlap: number;
    riskScore: number;
  };
  explanations: {
    whyGoodMatch: string[];
    potentialConcerns: string[];
    recommendations: string[];
  };
  predictions: {
    estimatedCPM: number;
    estimatedReach: number;
    estimatedEngagement: number;
    campaignFitScore: number;
  };
  metadata: {
    source: 'database' | 'realtime' | 'hybrid';
    confidence: number;
    lastUpdated: Date;
  };
}

export interface MatchingResults {
  matches: EnhancedMatchResult[];
  summary: {
    totalFound: number;
    averageScore: number;
    topCategories: string[];
    budgetAnalysis: {
      withinBudget: number;
      overBudget: number;
      averageCost: number;
    };
  };
  suggestions: {
    expandSearch: string[];
    adjustCriteria: string[];
    alternativeNiches: string[];
  };
}

export class EnhancedMatchingService {
  
  /**
   * Main matching function that processes briefs and finds optimal influencers
   */
  static async findMatches(
    brief: ProcessedBrief,
    searchStrategy: 'exact' | 'broad' | 'discovery' = 'broad'
  ): Promise<MatchingResults> {
    
    console.log(`🎯 Starting enhanced matching for ${brief.brandName} with ${searchStrategy} strategy`);
    
    // Step 1: Convert brief to matching criteria
    const criteria = this.briefToMatchingCriteria(brief, searchStrategy);
    
    // Step 2: Multi-source search
    const [databaseResults, realtimeResults] = await Promise.allSettled([
      this.searchDatabase(criteria),
      this.searchRealtime(criteria)
    ]);
    
    // Step 3: Combine and score results
    let allInfluencers: any[] = [];
    
    if (databaseResults.status === 'fulfilled') {
      allInfluencers.push(...databaseResults.value.map(inf => ({ ...inf, source: 'database' })));
    }
    
    if (realtimeResults.status === 'fulfilled') {
      allInfluencers.push(...realtimeResults.value.map(inf => ({ ...inf, source: 'realtime' })));
    }
    
    // Step 4: Remove duplicates and enhance with scoring
    const uniqueInfluencers = this.deduplicateInfluencers(allInfluencers);
    const enhancedResults = await this.enhanceWithScoring(uniqueInfluencers, criteria);
    
    // Step 5: Apply intelligent filtering and ranking
    const filteredResults = this.applyIntelligentFiltering(enhancedResults, criteria);
    const rankedResults = this.rankByRelevance(filteredResults, criteria);
    
    // Step 6: Generate insights and suggestions
    const summary = this.generateSummary(rankedResults, criteria);
    const suggestions = this.generateSuggestions(rankedResults, criteria);
    
    console.log(`✅ Found ${rankedResults.length} matches with average score ${summary.averageScore}`);
    
    return {
      matches: rankedResults.slice(0, criteria.maxResults),
      summary,
      suggestions
    };
  }
  
  /**
   * Convert brief to detailed matching criteria
   */
  private static briefToMatchingCriteria(
    brief: ProcessedBrief,
    strategy: 'exact' | 'broad' | 'discovery'
  ): MatchingCriteria {
    
    // Calculate dynamic weights based on brief completeness and strategy
    const weights = this.calculateDynamicWeights(brief, strategy);
    
    return {
      ...brief,
      weights,
      searchStrategy: strategy,
      maxResults: this.getMaxResults(strategy, brief)
    };
  }
  
  /**
   * Search database sources (Spanish vetted influencers)
   */
  private static async searchDatabase(criteria: MatchingCriteria): Promise<any[]> {
    try {
      console.log('🔍 Searching vetted database...');
      
      const searchParams = {
        query: criteria.niche.join(' '),
        gender: criteria.demographics.gender,
        minFollowers: criteria.followerRange.min,
        maxFollowers: criteria.followerRange.max,
        platforms: criteria.platforms,
        location: criteria.geography[0],
        brandName: criteria.brandName
      };
      
      const results = await searchVettedInfluencers(searchParams);
      console.log(`📊 Database search found ${results.length} results`);
      
      return results.map(result => result.influencer);
    } catch (error) {
      console.error('Database search failed:', error);
      return [];
    }
  }
  
  /**
   * Search real-time sources (Apify, web scraping)
   */
  private static async searchRealtime(criteria: MatchingCriteria): Promise<any[]> {
    try {
      console.log('🌐 Searching real-time sources...');
      
      const apifyParams = {
        platforms: criteria.platforms,
        niches: criteria.niche,
        minFollowers: criteria.followerRange.min,
        maxFollowers: criteria.followerRange.max,
        location: criteria.geography[0],
        verified: criteria.verified,
        maxResults: Math.min(criteria.maxResults * 2, 50), // Get more for filtering
        gender: criteria.demographics.gender,
        ageRange: criteria.demographics.ageRange,
        brandName: criteria.brandName,
        userQuery: `${criteria.brandName} ${criteria.niche.join(' ')} influencers`
      };
      
      const results = await searchInfluencersWithApify(apifyParams);
      console.log(`🌐 Real-time search found ${results.length} results`);
      
      return results;
    } catch (error) {
      console.error('Real-time search failed:', error);
      return [];
    }
  }
  
  /**
   * Remove duplicate influencers across sources
   */
  private static deduplicateInfluencers(influencers: any[]): any[] {
    const seen = new Set();
    return influencers.filter(inf => {
      const key = `${inf.username || inf.handle}_${inf.platform}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Enhance influencers with comprehensive scoring
   */
  private static async enhanceWithScoring(
    influencers: any[],
    criteria: MatchingCriteria
  ): Promise<EnhancedMatchResult[]> {
    
    const enhanced: EnhancedMatchResult[] = [];
    
    for (const influencer of influencers) {
      try {
        // Calculate all score components
        const brandCompatibility = await this.calculateBrandScore(influencer, criteria);
        const demographicMatch = this.calculateDemographicScore(influencer, criteria);
        const contentAlignment = this.calculateContentScore(influencer, criteria);
        const engagementQuality = this.calculateEngagementScore(influencer, criteria);
        const audienceOverlap = this.calculateAudienceScore(influencer, criteria);
        const riskScore = this.calculateRiskScore(influencer, criteria);
        
        // Calculate weighted overall score
        const overall = this.calculateOverallScore({
          brandCompatibility,
          demographicMatch,
          contentAlignment,
          engagementQuality,
          audienceOverlap,
          riskScore
        }, criteria.weights);
        
        // Generate explanations
        const explanations = this.generateExplanations(influencer, criteria, {
          brandCompatibility,
          demographicMatch,
          contentAlignment,
          engagementQuality,
          audienceOverlap,
          riskScore
        });
        
        // Generate predictions
        const predictions = this.generatePredictions(influencer, criteria);
        
        enhanced.push({
          influencer,
          scores: {
            overall,
            brandCompatibility,
            demographicMatch,
            contentAlignment,
            engagementQuality,
            audienceOverlap,
            riskScore
          },
          explanations,
          predictions,
          metadata: {
            source: influencer.source || 'unknown',
            confidence: this.calculateConfidence(influencer, criteria),
            lastUpdated: new Date()
          }
        });
        
      } catch (error) {
        console.error(`Error scoring influencer ${influencer.username}:`, error);
      }
    }
    
    return enhanced;
  }
  
  /**
   * Calculate brand compatibility score using existing engine
   */
  private static async calculateBrandScore(
    influencer: any,
    criteria: MatchingCriteria
  ): Promise<number> {
    try {
      const compatibility = await calculateDynamicBrandCompatibility(
        influencer,
        criteria.brandName
      );
      return compatibility.overallScore;
    } catch (error) {
      // Fallback to basic brand scoring
      return this.fallbackBrandScore(influencer, criteria);
    }
  }
  
  /**
   * Calculate demographic alignment score
   */
  private static calculateDemographicScore(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    let score = 0;
    let factors = 0;
    
    // Gender match
    if (criteria.demographics.gender && criteria.demographics.gender !== 'any') {
      factors++;
      if (influencer.gender?.toLowerCase() === criteria.demographics.gender.toLowerCase()) {
        score += 100;
      } else if (influencer.audienceDemographics?.gender) {
        // Check if audience demographics match
        const audienceGender = influencer.audienceDemographics.gender;
        const targetGender = criteria.demographics.gender;
        
        if (targetGender === 'female' && audienceGender.female > 60) {
          score += 80;
        } else if (targetGender === 'male' && audienceGender.male > 60) {
          score += 80;
        } else {
          score += 40;
        }
      } else {
        score += 30; // No demographic data available
      }
    }
    
    // Age range match
    if (criteria.demographics.ageRange) {
      factors++;
      if (influencer.ageRange === criteria.demographics.ageRange) {
        score += 100;
      } else if (influencer.audienceDemographics?.age) {
        // Check audience age distribution
        score += this.calculateAgeOverlap(
          influencer.audienceDemographics.age,
          criteria.demographics.ageRange
        );
      } else {
        score += 50; // Default moderate score
      }
    }
    
    // Location match
    if (criteria.geography.length > 0) {
      factors++;
      const influencerLocation = influencer.location || influencer.country || '';
      const hasLocationMatch = criteria.geography.some(geo =>
        influencerLocation.toLowerCase().includes(geo.toLowerCase())
      );
      
      if (hasLocationMatch) {
        score += 100;
      } else if (influencer.audienceDemographics?.location) {
        // Check audience location distribution
        score += this.calculateLocationOverlap(
          influencer.audienceDemographics.location,
          criteria.geography
        );
      } else {
        score += 20; // Low score for no location data
      }
    }
    
    return factors > 0 ? score / factors : 70; // Default moderate score
  }
  
  /**
   * Calculate content alignment score
   */
  private static calculateContentScore(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    let score = 0;
    
    // Niche alignment
    const influencerNiches = influencer.niche || influencer.category || [];
    const nicheArray = Array.isArray(influencerNiches) ? influencerNiches : [influencerNiches];
    
    const nicheMatches = criteria.niche.filter(criteriaSeaglass =>
      nicheArray.some((infNiche: string) =>
        infNiche.toLowerCase().includes(criteriaSeaglass.toLowerCase()) ||
        criteriaSeaglass.toLowerCase().includes(infNiche.toLowerCase())
      )
    );
    
    const nicheScore = (nicheMatches.length / criteria.niche.length) * 100;
    score += nicheScore * 0.6; // 60% weight for niche
    
    // Platform alignment
    const platformMatch = criteria.platforms.includes(influencer.platform);
    score += (platformMatch ? 100 : 20) * 0.3; // 30% weight for platform
    
    // Content style/tone alignment
    if (criteria.tone && influencer.contentStyle) {
      const toneMatch = this.calculateToneAlignment(criteria.tone, influencer.contentStyle);
      score += toneMatch * 0.1; // 10% weight for tone
    } else {
      score += 50 * 0.1; // Default moderate score
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate engagement quality score
   */
  private static calculateEngagementScore(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    const engagementRate = influencer.engagementRate || 0;
    const minEngagement = criteria.engagementMin || 0.02;
    
    let score = 0;
    
    // Base engagement score
    if (engagementRate >= minEngagement) {
      if (engagementRate > 0.08) {
        score = 95; // Excellent engagement
      } else if (engagementRate > 0.05) {
        score = 85; // Good engagement
      } else if (engagementRate > 0.03) {
        score = 75; // Decent engagement
      } else {
        score = 60; // Meets minimum
      }
    } else {
      score = Math.max(0, (engagementRate / minEngagement) * 60);
    }
    
    // Bonus for consistency and authenticity indicators
    if (influencer.verified) score += 5;
    if (influencer.avgComments && influencer.avgLikes) {
      const commentRatio = influencer.avgComments / influencer.avgLikes;
      if (commentRatio > 0.05) score += 5; // Good comment-to-like ratio
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate audience overlap score
   */
  private static calculateAudienceScore(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    if (!influencer.audienceDemographics) {
      return 60; // Default moderate score for missing data
    }
    
    let score = 0;
    let factors = 0;
    
    const audience = influencer.audienceDemographics;
    
    // Interest overlap
    if (criteria.demographics.interests?.length > 0 && audience.interests) {
      factors++;
      const interestOverlap = this.calculateInterestOverlap(
        audience.interests,
        criteria.demographics.interests
      );
      score += interestOverlap;
    }
    
    // Geographic audience overlap
    if (criteria.geography.length > 0 && audience.location) {
      factors++;
      const locationOverlap = this.calculateLocationOverlap(
        audience.location,
        criteria.geography
      );
      score += locationOverlap;
    }
    
    // Age demographic overlap
    if (criteria.demographics.ageRange && audience.age) {
      factors++;
      const ageOverlap = this.calculateAgeOverlap(
        audience.age,
        criteria.demographics.ageRange
      );
      score += ageOverlap;
    }
    
    return factors > 0 ? score / factors : 60;
  }
  
  /**
   * Calculate risk assessment score
   */
  private static calculateRiskScore(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    let riskScore = 100; // Start with perfect score, deduct for risks
    
    // Engagement rate risks
    const engagementRate = influencer.engagementRate || 0;
    if (engagementRate > 0.15) {
      riskScore -= 30; // Suspiciously high engagement
    } else if (engagementRate < 0.01) {
      riskScore -= 20; // Very low engagement
    }
    
    // Follower quality risks
    if (influencer.followerCount) {
      const followerToFollowingRatio = influencer.followerCount / (influencer.followingCount || 1);
      if (followerToFollowingRatio < 2) {
        riskScore -= 15; // Poor follower ratio
      }
    }
    
    // Verification status
    if (!influencer.verified && influencer.followerCount > 100000) {
      riskScore -= 10; // Large unverified account
    }
    
    // Content consistency (if available)
    if (influencer.postCount && influencer.postCount < 10) {
      riskScore -= 15; // Very few posts
    }
    
    // Brand safety (basic check)
    const bio = (influencer.bio || influencer.biography || '').toLowerCase();
    const riskKeywords = ['controversy', 'scandal', 'inappropriate', 'offensive'];
    if (riskKeywords.some(keyword => bio.includes(keyword))) {
      riskScore -= 25;
    }
    
    return Math.max(0, riskScore);
  }
  
  /**
   * Calculate weighted overall score
   */
  private static calculateOverallScore(
    scores: Omit<EnhancedMatchResult['scores'], 'overall'>,
    weights: MatchingCriteria['weights']
  ): number {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    const weightedScore = 
      (scores.brandCompatibility * weights.brand) +
      (scores.demographicMatch * weights.audience) +
      (scores.contentAlignment * weights.niche) +
      (scores.engagementQuality * weights.engagement) +
      (scores.audienceOverlap * weights.audience * 0.5) + // Split audience weight
      (scores.riskScore * 10); // Fixed weight for risk
    
    return Math.round(weightedScore / (totalWeight + 10)); // +10 for risk weight
  }
  
  /**
   * Generate explanations for why influencer is good/bad match
   */
  private static generateExplanations(
    influencer: any,
    criteria: MatchingCriteria,
    scores: Omit<EnhancedMatchResult['scores'], 'overall'>
  ): EnhancedMatchResult['explanations'] {
    
    const whyGoodMatch: string[] = [];
    const potentialConcerns: string[] = [];
    const recommendations: string[] = [];
    
    // Brand compatibility explanations
    if (scores.brandCompatibility > 80) {
      whyGoodMatch.push(`Excellent brand alignment with ${criteria.brandName}`);
    } else if (scores.brandCompatibility < 50) {
      potentialConcerns.push(`Weak brand compatibility with ${criteria.brandName}`);
    }
    
    // Demographic explanations
    if (scores.demographicMatch > 80) {
      whyGoodMatch.push('Strong audience demographic alignment');
    } else if (scores.demographicMatch < 50) {
      potentialConcerns.push('Limited demographic overlap with target audience');
      recommendations.push('Consider if this audience expansion aligns with campaign goals');
    }
    
    // Content alignment explanations
    if (scores.contentAlignment > 80) {
      whyGoodMatch.push(`Perfect content fit for ${criteria.niche.join(', ')} niches`);
    } else if (scores.contentAlignment < 50) {
      potentialConcerns.push('Content niche may not align perfectly with campaign needs');
    }
    
    // Engagement explanations
    if (scores.engagementQuality > 80) {
      whyGoodMatch.push(`High engagement rate (${((influencer.engagementRate || 0) * 100).toFixed(1)}%)`);
    } else if (scores.engagementQuality < 50) {
      potentialConcerns.push('Below-average engagement rate for this follower count');
      recommendations.push('Consider engagement trends and audience quality');
    }
    
    // Risk explanations
    if (scores.riskScore < 70) {
      potentialConcerns.push('Some brand safety considerations detected');
      recommendations.push('Review content history and audience quality before proceeding');
    }
    
    // Add follower range feedback
    if (influencer.followerCount < criteria.followerRange.min) {
      potentialConcerns.push('Below minimum follower requirement');
    } else if (influencer.followerCount > criteria.followerRange.max) {
      recommendations.push('Above target follower range - consider budget implications');
    }
    
    return { whyGoodMatch, potentialConcerns, recommendations };
  }
  
  /**
   * Generate performance predictions
   */
  private static generatePredictions(
    influencer: any,
    criteria: MatchingCriteria
  ): EnhancedMatchResult['predictions'] {
    
    const followerCount = influencer.followerCount || 0;
    const engagementRate = influencer.engagementRate || 0.03;
    
    // Estimate CPM based on follower count and platform
    let baseCPM = 10; // Base CPM for Instagram
    if (influencer.platform === 'TikTok') baseCPM = 8;
    if (influencer.platform === 'YouTube') baseCPM = 15;
    
    const estimatedCPM = this.calculateCPM(followerCount, engagementRate, baseCPM);
    
    // Estimate reach (accounting for algorithm limitations)
    const reachMultiplier = influencer.platform === 'TikTok' ? 0.3 : 0.1; // TikTok has higher organic reach
    const estimatedReach = Math.round(followerCount * reachMultiplier);
    
    // Estimate engagement
    const estimatedEngagement = Math.round(estimatedReach * engagementRate);
    
    // Campaign fit score based on all factors
    const campaignFitScore = this.calculateCampaignFit(influencer, criteria);
    
    return {
      estimatedCPM,
      estimatedReach,
      estimatedEngagement,
      campaignFitScore
    };
  }
  
  // Helper methods
  private static calculateDynamicWeights(
    brief: ProcessedBrief,
    strategy: 'exact' | 'broad' | 'discovery'
  ): MatchingCriteria['weights'] {
    // Base weights
    const base = {
      geography: 15,
      niche: 25,
      audience: 20,
      budget: 15,
      engagement: 10,
      brand: 15
    };
    
    // Adjust based on strategy and brief specificity
    if (strategy === 'exact') {
      return {
        geography: brief.geography.length > 0 ? 25 : 5,
        niche: brief.niche.length > 1 ? 35 : 20,
        audience: brief.demographics.ageRange ? 25 : 15,
        budget: brief.budget.max > 0 ? 20 : 10,
        engagement: 15,
        brand: 20
      };
    }
    
    return base;
  }
  
  private static getMaxResults(
    strategy: 'exact' | 'broad' | 'discovery',
    brief: ProcessedBrief
  ): number {
    if (strategy === 'discovery') return 50;
    if (strategy === 'exact') return 15;
    return Math.max(20, brief.influencerCount * 3); // 3x desired count for filtering
  }
  
  private static applyIntelligentFiltering(
    results: EnhancedMatchResult[],
    criteria: MatchingCriteria
  ): EnhancedMatchResult[] {
    return results.filter(result => {
      // Minimum score threshold
      if (result.scores.overall < 30) return false;
      
      // Budget filter
      if (criteria.budget.max > 0) {
        if (result.predictions.estimatedCPM > criteria.budget.max * 1.5) {
          return false; // Way over budget
        }
      }
      
      // Risk filter
      if (result.scores.riskScore < 40) return false;
      
      return true;
    });
  }
  
  private static rankByRelevance(
    results: EnhancedMatchResult[],
    criteria: MatchingCriteria
  ): EnhancedMatchResult[] {
    return results.sort((a, b) => {
      // Primary sort by overall score
      if (Math.abs(a.scores.overall - b.scores.overall) > 5) {
        return b.scores.overall - a.scores.overall;
      }
      
      // Secondary sort by brand compatibility
      if (Math.abs(a.scores.brandCompatibility - b.scores.brandCompatibility) > 5) {
        return b.scores.brandCompatibility - a.scores.brandCompatibility;
      }
      
      // Tertiary sort by engagement quality
      return b.scores.engagementQuality - a.scores.engagementQuality;
    });
  }
  
  private static generateSummary(
    results: EnhancedMatchResult[],
    criteria: MatchingCriteria
  ): MatchingResults['summary'] {
    const totalFound = results.length;
    const averageScore = totalFound > 0 
      ? results.reduce((sum, r) => sum + r.scores.overall, 0) / totalFound 
      : 0;
    
    // Find top categories
    const categoryCount: Record<string, number> = {};
    results.forEach(result => {
      const category = result.influencer.niche?.[0] || result.influencer.category || 'General';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    // Budget analysis
    const costsInBudget = results.filter(r => 
      r.predictions.estimatedCPM <= criteria.budget.max
    ).length;
    
    const averageCost = totalFound > 0
      ? results.reduce((sum, r) => sum + r.predictions.estimatedCPM, 0) / totalFound
      : 0;
    
    return {
      totalFound,
      averageScore: Math.round(averageScore),
      topCategories,
      budgetAnalysis: {
        withinBudget: costsInBudget,
        overBudget: totalFound - costsInBudget,
        averageCost: Math.round(averageCost)
      }
    };
  }
  
  private static generateSuggestions(
    results: EnhancedMatchResult[],
    criteria: MatchingCriteria
  ): MatchingResults['suggestions'] {
    const suggestions: MatchingResults['suggestions'] = {
      expandSearch: [],
      adjustCriteria: [],
      alternativeNiches: []
    };
    
    // Analyze why we might have limited results
    if (results.length < 10) {
      if (criteria.followerRange.min > 50000) {
        suggestions.adjustCriteria.push('Consider lowering minimum follower requirement');
      }
      
      if (criteria.geography.length === 1 && criteria.geography[0] !== 'Spain') {
        suggestions.expandSearch.push('Expand geographic search to include Spain');
      }
      
      if (criteria.niche.length === 1) {
        suggestions.expandSearch.push('Consider related niches for broader reach');
      }
    }
    
    // Find alternative niches based on successful matches
    const successfulNiches = results
      .filter(r => r.scores.overall > 70)
      .map(r => r.influencer.niche || r.influencer.category)
      .flat()
      .filter(Boolean);
    
    const nicheCount: Record<string, number> = {};
    successfulNiches.forEach(niche => {
      if (typeof niche === 'string' && !criteria.niche.includes(niche)) {
        nicheCount[niche] = (nicheCount[niche] || 0) + 1;
      }
    });
    
    suggestions.alternativeNiches = Object.entries(nicheCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([niche]) => niche);
    
    return suggestions;
  }
  
  // Additional helper methods for specific calculations
  private static fallbackBrandScore(influencer: any, criteria: MatchingCriteria): number {
    // Simple fallback brand scoring when advanced engine fails
    const bio = (influencer.bio || influencer.biography || '').toLowerCase();
    const brandKeywords = criteria.brandName.toLowerCase().split(' ');
    
    let score = 50; // Base score
    
    // Check for brand mentions
    if (brandKeywords.some(keyword => bio.includes(keyword))) {
      score += 30;
    }
    
    // Check for industry alignment
    if (criteria.industry && bio.includes(criteria.industry.toLowerCase())) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
  
  private static calculateToneAlignment(criterTone: string, influencerStyle: string): number {
    const toneMap: Record<string, string[]> = {
      'professional': ['business', 'corporate', 'professional', 'formal'],
      'casual': ['casual', 'relaxed', 'informal', 'friendly'],
      'authentic': ['authentic', 'genuine', 'real', 'honest'],
      'luxury': ['luxury', 'premium', 'high-end', 'exclusive'],
      'playful': ['fun', 'playful', 'creative', 'energetic']
    };
    
    const criterionKeywords = toneMap[criterTone.toLowerCase()] || [criterTone.toLowerCase()];
    const styleText = influencerStyle.toLowerCase();
    
    const matches = criterionKeywords.filter(keyword => styleText.includes(keyword));
    return (matches.length / criterionKeywords.length) * 100;
  }
  
  private static calculateInterestOverlap(
    audienceInterests: string[],
    targetInterests: string[]
  ): number {
    if (!audienceInterests?.length || !targetInterests?.length) return 50;
    
    const matches = targetInterests.filter(target =>
      audienceInterests.some(audience =>
        audience.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(audience.toLowerCase())
      )
    );
    
    return (matches.length / targetInterests.length) * 100;
  }
  
  private static calculateLocationOverlap(
    audienceLocation: any,
    targetLocations: string[]
  ): number {
    if (!audienceLocation || !targetLocations.length) return 50;
    
    // Handle different audience location formats
    let locationScore = 0;
    
    if (typeof audienceLocation === 'object') {
      for (const target of targetLocations) {
        const targetKey = target.toLowerCase();
        const locationValue = audienceLocation[targetKey] || 
                             audienceLocation[target] ||
                             Object.entries(audienceLocation).find(([key]) => 
                               key.toLowerCase().includes(targetKey)
                             )?.[1];
        
        if (locationValue && typeof locationValue === 'number') {
          locationScore = Math.max(locationScore, locationValue);
        }
      }
    }
    
    return Math.min(100, locationScore);
  }
  
  private static calculateAgeOverlap(
    audienceAge: any,
    targetAgeRange: string
  ): number {
    if (!audienceAge || !targetAgeRange) return 50;
    
    const [targetMin, targetMax] = targetAgeRange.split('-').map(Number);
    if (isNaN(targetMin) || isNaN(targetMax)) return 50;
    
    let overlapScore = 0;
    
    if (typeof audienceAge === 'object') {
      // Sum percentages for age ranges that overlap with target
      Object.entries(audienceAge).forEach(([ageRange, percentage]) => {
        if (typeof percentage === 'number') {
          const [ageMin, ageMax] = ageRange.split('-').map(Number);
          if (!isNaN(ageMin) && !isNaN(ageMax)) {
            // Check if ranges overlap
            if (ageMin <= targetMax && ageMax >= targetMin) {
              overlapScore += percentage;
            }
          }
        }
      });
    }
    
    return Math.min(100, overlapScore);
  }
  
  private static calculateCPM(
    followerCount: number,
    engagementRate: number,
    baseCPM: number
  ): number {
    // Adjust CPM based on follower tiers
    let multiplier = 1;
    
    if (followerCount > 1000000) multiplier = 3; // Macro influencers
    else if (followerCount > 100000) multiplier = 2; // Mid-tier
    else if (followerCount > 10000) multiplier = 1.5; // Micro influencers
    else multiplier = 1; // Nano influencers
    
    // Adjust for engagement quality
    if (engagementRate > 0.08) multiplier *= 1.2; // Premium for high engagement
    else if (engagementRate < 0.02) multiplier *= 0.8; // Discount for low engagement
    
    return Math.round(baseCPM * multiplier);
  }
  
  private static calculateCampaignFit(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    // Holistic campaign fit based on multiple factors
    let fit = 0;
    
    // Content alignment (40%)
    fit += this.calculateContentScore(influencer, criteria) * 0.4;
    
    // Audience match (30%)
    fit += this.calculateAudienceScore(influencer, criteria) * 0.3;
    
    // Brand safety (20%)
    fit += this.calculateRiskScore(influencer, criteria) * 0.2;
    
    // Performance potential (10%)
    fit += this.calculateEngagementScore(influencer, criteria) * 0.1;
    
    return Math.round(fit);
  }
  
  private static calculateConfidence(
    influencer: any,
    criteria: MatchingCriteria
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on data availability
    if (influencer.engagementRate) confidence += 0.1;
    if (influencer.audienceDemographics) confidence += 0.15;
    if (influencer.verified) confidence += 0.1;
    if (influencer.bio || influencer.biography) confidence += 0.05;
    if (influencer.postCount && influencer.postCount > 50) confidence += 0.1;
    if (influencer.followerCount > 1000) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }
} 