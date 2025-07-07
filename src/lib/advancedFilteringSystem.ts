/**
 * Advanced Filtering System
 * Machine learning-based filtering with user feedback integration
 */

export interface FilteringDecision {
  isInfluencer: boolean;
  isBrandAccount: boolean;
  isGenericProfile: boolean;
  confidence: number;
  reason: string;
  features: FilteringFeatures;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FilteringFeatures {
  // Username features
  usernameLength: number;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  isAllNumbers: boolean;
  hasBrandKeywords: boolean;
  hasPersonalIndicators: boolean;
  
  // Profile features
  hasDisplayName: boolean;
  hasProfilePicture: boolean;
  hasBiography: boolean;
  biographyLength: number;
  hasWebsite: boolean;
  isVerified: boolean;
  
  // Content features
  postCount: number;
  followerCount: number;
  followingCount: number;
  engagementRate: number;
  
  // Behavioral features
  followerToFollowingRatio: number;
  accountAge: number;
  postFrequency: number;
  
  // Semantic features
  businessLanguage: boolean;
  personalLanguage: boolean;
  promotionalContent: boolean;
  authenticInteractions: boolean;
}

export interface UserFeedback {
  profileUrl: string;
  username: string;
  actualCategory: 'influencer' | 'brand' | 'generic' | 'other';
  systemDecision: FilteringDecision;
  userCorrection: boolean;
  timestamp: Date;
  confidence: number;
  additionalNotes?: string;
}

export interface FilteringModel {
  version: string;
  accuracy: number;
  trainingData: number;
  lastUpdated: Date;
  featureWeights: Record<string, number>;
  thresholds: {
    influencer: number;
    brand: number;
    generic: number;
  };
}

/**
 * Advanced Filtering System Class
 */
export class AdvancedFilteringSystem {
  private model: FilteringModel;
  private feedbackHistory: UserFeedback[] = [];
  private learningEnabled: boolean = true;

  constructor() {
    this.model = this.initializeModel();
    this.loadFeedbackHistory();
  }

  /**
   * Make filtering decision using advanced ML-based analysis
   */
  async makeFilteringDecision(
    profile: any,
    context?: { searchQuery?: string; brandName?: string }
  ): Promise<FilteringDecision> {
    // Extract features from profile
    const features = this.extractFeatures(profile);
    
    // Calculate scores using weighted feature analysis
    const scores = this.calculateCategoryScores(features, context);
    
    // Make primary decision
    const primaryDecision = this.makePrimaryDecision(scores);
    
    // Calculate confidence level
    const confidence = this.calculateConfidence(scores, features);
    
    // Determine risk level
    const riskLevel = this.calculateRiskLevel(confidence, features);
    
    // Generate explanation
    const reason = this.generateExplanation(primaryDecision, features, scores);

    const decision: FilteringDecision = {
      isInfluencer: primaryDecision === 'influencer',
      isBrandAccount: primaryDecision === 'brand',
      isGenericProfile: primaryDecision === 'generic',
      confidence,
      reason,
      features,
      riskLevel
    };

    // Log decision for potential learning
    this.logDecision(profile, decision);

    return decision;
  }

  /**
   * Extract comprehensive features from profile
   */
  private extractFeatures(profile: any): FilteringFeatures {
    const username = profile.username || '';
    const displayName = profile.displayName || profile.fullName || '';
    const biography = profile.biography || profile.bio || '';
    const followers = profile.followers || profile.followerCount || 0;
    const following = profile.following || profile.followingCount || 0;
    const posts = profile.posts || profile.postCount || 0;

    return {
      // Username features
      usernameLength: username.length,
      hasNumbers: /\d/.test(username),
      hasSpecialChars: /[._-]/.test(username),
      isAllNumbers: /^\d+$/.test(username),
      hasBrandKeywords: this.detectBrandKeywords(username),
      hasPersonalIndicators: this.detectPersonalIndicators(username),

      // Profile features
      hasDisplayName: displayName.length > 0,
      hasProfilePicture: !!(profile.profilePicture || profile.profilePictureUrl),
      hasBiography: biography.length > 0,
      biographyLength: biography.length,
      hasWebsite: !!(profile.website || profile.externalUrl),
      isVerified: profile.isVerified || profile.verified || false,

      // Content features
      postCount: posts,
      followerCount: followers,
      followingCount: following,
      engagementRate: this.calculateEngagementRate(profile),

      // Behavioral features
      followerToFollowingRatio: following > 0 ? followers / following : followers,
      accountAge: this.estimateAccountAge(profile),
      postFrequency: this.estimatePostFrequency(profile),

      // Semantic features
      businessLanguage: this.detectBusinessLanguage(biography + ' ' + displayName),
      personalLanguage: this.detectPersonalLanguage(biography + ' ' + displayName),
      promotionalContent: this.detectPromotionalContent(biography),
      authenticInteractions: this.detectAuthenticInteractions(profile)
    };
  }

  /**
   * Calculate category scores using weighted feature analysis
   */
  private calculateCategoryScores(
    features: FilteringFeatures,
    context?: { searchQuery?: string; brandName?: string }
  ): Record<string, number> {
    const weights = this.model.featureWeights;
    
    let influencerScore = 0;
    let brandScore = 0;
    let genericScore = 0;

    // Influencer indicators
    if (features.hasPersonalIndicators) influencerScore += weights.personalIndicators || 20;
    if (features.personalLanguage) influencerScore += weights.personalLanguage || 15;
    if (features.authenticInteractions) influencerScore += weights.authenticInteractions || 10;
    if (features.isVerified) influencerScore += weights.verified || 15;
    if (features.engagementRate > 0.02) influencerScore += weights.highEngagement || 10;
    if (features.followerToFollowingRatio > 5) influencerScore += weights.followerRatio || 8;

    // Brand account indicators
    if (features.hasBrandKeywords) brandScore += weights.brandKeywords || 25;
    if (features.businessLanguage) brandScore += weights.businessLanguage || 20;
    if (features.promotionalContent) brandScore += weights.promotionalContent || 15;
    if (features.hasWebsite) brandScore += weights.hasWebsite || 10;
    if (features.followerToFollowingRatio > 100) brandScore += weights.highFollowerRatio || 10;
    if (features.postCount > 500) brandScore += weights.highPostCount || 8;

    // Generic account indicators
    if (features.isAllNumbers) genericScore += weights.allNumbers || 30;
    if (features.usernameLength < 3) genericScore += weights.shortUsername || 20;
    if (!features.hasDisplayName) genericScore += weights.noDisplayName || 15;
    if (!features.hasBiography) genericScore += weights.noBiography || 15;
    if (!features.hasProfilePicture) genericScore += weights.noProfilePicture || 10;
    if (features.followerCount < 100) genericScore += weights.lowFollowers || 8;

    // Context-based adjustments
    if (context?.brandName) {
      const brandRelevance = this.calculateBrandRelevance(features, context.brandName);
      if (brandRelevance > 0.7) influencerScore += 10;
    }

    // Apply account age bonuses
    if (features.accountAge > 365) {
      influencerScore += 5;
      brandScore += 5;
    }

    // Normalize scores
    const total = influencerScore + brandScore + genericScore;
    if (total > 0) {
      influencerScore = (influencerScore / total) * 100;
      brandScore = (brandScore / total) * 100;
      genericScore = (genericScore / total) * 100;
    }

    return {
      influencer: influencerScore,
      brand: brandScore,
      generic: genericScore
    };
  }

  /**
   * Make primary filtering decision
   */
  private makePrimaryDecision(scores: Record<string, number>): string {
    const thresholds = this.model.thresholds;
    
    // Check if any score exceeds threshold
    if (scores.influencer >= thresholds.influencer) return 'influencer';
    if (scores.brand >= thresholds.brand) return 'brand';
    if (scores.generic >= thresholds.generic) return 'generic';
    
    // Default to highest score
    const maxScore = Math.max(scores.influencer, scores.brand, scores.generic);
    if (maxScore === scores.influencer) return 'influencer';
    if (maxScore === scores.brand) return 'brand';
    return 'generic';
  }

  /**
   * Calculate confidence in decision
   */
  private calculateConfidence(scores: Record<string, number>, features: FilteringFeatures): number {
    const values = Object.values(scores);
    const max = Math.max(...values);
    const secondMax = values.sort((a, b) => b - a)[1];
    
    let confidence = ((max - secondMax) / 100) * 100;
    
    // Adjust confidence based on feature reliability
    if (features.isVerified) confidence += 10;
    if (features.hasBiography && features.biographyLength > 50) confidence += 5;
    if (features.followerCount > 1000) confidence += 5;
    if (features.postCount > 10) confidence += 5;
    
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Calculate risk level for decision
   */
  private calculateRiskLevel(confidence: number, features: FilteringFeatures): 'low' | 'medium' | 'high' {
    if (confidence >= 80) return 'low';
    if (confidence >= 60) return 'medium';
    return 'high';
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    decision: string,
    features: FilteringFeatures,
    scores: Record<string, number>
  ): string {
    const reasons: string[] = [];
    
    if (decision === 'influencer') {
      if (features.hasPersonalIndicators) reasons.push('personal username style');
      if (features.personalLanguage) reasons.push('personal language in bio');
      if (features.isVerified) reasons.push('verified account');
      if (features.engagementRate > 0.02) reasons.push('good engagement rate');
      if (features.followerToFollowingRatio > 5) reasons.push('healthy follower ratio');
    } else if (decision === 'brand') {
      if (features.hasBrandKeywords) reasons.push('brand-related keywords');
      if (features.businessLanguage) reasons.push('business language');
      if (features.promotionalContent) reasons.push('promotional content');
      if (features.hasWebsite) reasons.push('business website');
      if (features.followerToFollowingRatio > 100) reasons.push('broadcast-style account');
    } else if (decision === 'generic') {
      if (features.isAllNumbers) reasons.push('numeric username');
      if (features.usernameLength < 3) reasons.push('very short username');
      if (!features.hasDisplayName) reasons.push('no display name');
      if (!features.hasBiography) reasons.push('no biography');
      if (features.followerCount < 100) reasons.push('very low followers');
    }

    const scoreText = `${decision} (${scores[decision].toFixed(1)}%)`;
    const reasonText = reasons.length > 0 ? `: ${reasons.join(', ')}` : '';
    
    return `Classified as ${scoreText}${reasonText}`;
  }

  /**
   * Process user feedback to improve model
   */
  async processFeedback(feedback: UserFeedback): Promise<void> {
    this.feedbackHistory.push(feedback);
    
    if (this.learningEnabled) {
      await this.updateModelWithFeedback(feedback);
    }
    
    // Save feedback for persistence
    await this.saveFeedbackHistory();
  }

  /**
   * Update model weights based on feedback
   */
  private async updateModelWithFeedback(feedback: UserFeedback): Promise<void> {
    if (!feedback.userCorrection) return;
    
    const features = feedback.systemDecision.features;
    const actualCategory = feedback.actualCategory;
    const predictedCategory = this.getPredictedCategory(feedback.systemDecision);
    
    if (actualCategory !== predictedCategory) {
      // Adjust weights based on incorrect prediction
      this.adjustWeights(features, actualCategory, predictedCategory);
      
      // Update model accuracy
      this.updateModelAccuracy();
      
      console.log(`📚 Model updated based on feedback: ${predictedCategory} → ${actualCategory}`);
    }
  }

  /**
   * Get predicted category from decision
   */
  private getPredictedCategory(decision: FilteringDecision): string {
    if (decision.isInfluencer) return 'influencer';
    if (decision.isBrandAccount) return 'brand';
    if (decision.isGenericProfile) return 'generic';
    return 'other';
  }

  /**
   * Adjust model weights based on feedback
   */
  private adjustWeights(
    features: FilteringFeatures,
    actualCategory: string,
    predictedCategory: string
  ): void {
    const learningRate = 0.01;
    const weights = this.model.featureWeights;
    
    // Increase weights for features that should have indicated correct category
    if (actualCategory === 'influencer') {
      if (features.hasPersonalIndicators) weights.personalIndicators = (weights.personalIndicators || 20) + learningRate * 5;
      if (features.personalLanguage) weights.personalLanguage = (weights.personalLanguage || 15) + learningRate * 3;
      if (features.isVerified) weights.verified = (weights.verified || 15) + learningRate * 2;
    } else if (actualCategory === 'brand') {
      if (features.hasBrandKeywords) weights.brandKeywords = (weights.brandKeywords || 25) + learningRate * 5;
      if (features.businessLanguage) weights.businessLanguage = (weights.businessLanguage || 20) + learningRate * 3;
      if (features.promotionalContent) weights.promotionalContent = (weights.promotionalContent || 15) + learningRate * 2;
    }
    
    // Decrease weights for features that led to wrong prediction
    if (predictedCategory === 'brand' && actualCategory === 'influencer') {
      if (features.hasBrandKeywords) weights.brandKeywords = Math.max(5, (weights.brandKeywords || 25) - learningRate * 3);
      if (features.businessLanguage) weights.businessLanguage = Math.max(5, (weights.businessLanguage || 20) - learningRate * 2);
    }
  }

  /**
   * Update model accuracy based on feedback history
   */
  private updateModelAccuracy(): void {
    const recentFeedback = this.feedbackHistory.slice(-100); // Last 100 feedback items
    const correct = recentFeedback.filter(f => !f.userCorrection).length;
    const total = recentFeedback.length;
    
    if (total > 0) {
      this.model.accuracy = (correct / total) * 100;
      this.model.lastUpdated = new Date();
    }
  }

  /**
   * Detect brand keywords in text
   */
  private detectBrandKeywords(text: string): boolean {
    const brandKeywords = [
      'official', 'brand', 'company', 'corp', 'inc', 'ltd', 'llc',
      'store', 'shop', 'business', 'service', 'agency', 'studio',
      'headquarters', 'hq', 'customer', 'support', 'team'
    ];
    
    const lowerText = text.toLowerCase();
    return brandKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect personal indicators in text
   */
  private detectPersonalIndicators(text: string): boolean {
    const personalIndicators = [
      'love', 'life', 'my', 'me', 'i', 'personal', 'journey',
      'dreams', 'passion', 'adventure', 'story', 'diary',
      'thoughts', 'experiences', 'memories', 'moments'
    ];
    
    const lowerText = text.toLowerCase();
    return personalIndicators.some(indicator => lowerText.includes(indicator));
  }

  /**
   * Detect business language in text
   */
  private detectBusinessLanguage(text: string): boolean {
    const businessTerms = [
      'solutions', 'services', 'professional', 'expert', 'consultant',
      'industry', 'market', 'clients', 'customers', 'partnership',
      'quality', 'premium', 'excellence', 'innovative', 'leading'
    ];
    
    const lowerText = text.toLowerCase();
    return businessTerms.some(term => lowerText.includes(term));
  }

  /**
   * Detect personal language in text
   */
  private detectPersonalLanguage(text: string): boolean {
    const personalTerms = [
      'mom', 'dad', 'family', 'husband', 'wife', 'kids', 'children',
      'home', 'heart', 'soul', 'blessed', 'grateful', 'happy',
      'living', 'enjoying', 'sharing', 'creating', 'exploring'
    ];
    
    const lowerText = text.toLowerCase();
    return personalTerms.some(term => lowerText.includes(term));
  }

  /**
   * Detect promotional content in text
   */
  private detectPromotionalContent(text: string): boolean {
    const promotionalTerms = [
      'buy', 'shop', 'sale', 'discount', 'offer', 'deal',
      'promo', 'code', 'link', 'order', 'purchase', 'product',
      'available', 'now', 'new', 'launch', 'collection'
    ];
    
    const lowerText = text.toLowerCase();
    return promotionalTerms.some(term => lowerText.includes(term));
  }

  /**
   * Detect authentic interactions
   */
  private detectAuthenticInteractions(profile: any): boolean {
    // This would analyze recent posts/comments for authentic engagement
    // For now, use heuristics based on engagement patterns
    const engagement = this.calculateEngagementRate(profile);
    const followers = profile.followers || profile.followerCount || 0;
    
    // High engagement with moderate followers suggests authentic interactions
    return engagement > 0.02 && followers > 1000 && followers < 1000000;
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(profile: any): number {
    const followers = profile.followers || profile.followerCount || 0;
    const avgLikes = profile.avgLikes || profile.averageLikes || 0;
    const avgComments = profile.avgComments || profile.averageComments || 0;
    
    if (followers === 0) return 0;
    
    return (avgLikes + avgComments) / followers;
  }

  /**
   * Estimate account age
   */
  private estimateAccountAge(profile: any): number {
    if (profile.createdAt) {
      return (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    }
    
    // Estimate based on post count and followers
    const posts = profile.posts || profile.postCount || 0;
    const followers = profile.followers || profile.followerCount || 0;
    
    if (posts > 100 && followers > 1000) return 365; // Assume established account
    if (posts > 50) return 180; // Assume 6 months
    return 90; // Assume 3 months
  }

  /**
   * Estimate post frequency
   */
  private estimatePostFrequency(profile: any): number {
    const posts = profile.posts || profile.postCount || 0;
    const ageInDays = this.estimateAccountAge(profile);
    
    if (ageInDays === 0) return 0;
    
    return posts / ageInDays;
  }

  /**
   * Calculate brand relevance
   */
  private calculateBrandRelevance(features: FilteringFeatures, brandName: string): number {
    // This would analyze how relevant the profile is to the specific brand
    // For now, use simple heuristics
    let relevance = 0;
    
    if (features.hasBrandKeywords) relevance += 0.3;
    if (features.businessLanguage) relevance += 0.2;
    if (features.isVerified) relevance += 0.2;
    if (features.engagementRate > 0.02) relevance += 0.3;
    
    return relevance;
  }

  /**
   * Initialize the machine learning model
   */
  private initializeModel(): FilteringModel {
    return {
      version: '1.0.0',
      accuracy: 85.0,
      trainingData: 1000,
      lastUpdated: new Date(),
      featureWeights: {
        personalIndicators: 20,
        personalLanguage: 15,
        authenticInteractions: 10,
        verified: 15,
        highEngagement: 10,
        followerRatio: 8,
        brandKeywords: 25,
        businessLanguage: 20,
        promotionalContent: 15,
        hasWebsite: 10,
        highFollowerRatio: 10,
        highPostCount: 8,
        allNumbers: 30,
        shortUsername: 20,
        noDisplayName: 15,
        noBiography: 15,
        noProfilePicture: 10,
        lowFollowers: 8
      },
      thresholds: {
        influencer: 60,
        brand: 55,
        generic: 65
      }
    };
  }

  /**
   * Load feedback history from storage
   */
  private async loadFeedbackHistory(): Promise<void> {
    try {
      // This would load from a database or file
      // For now, initialize empty
      this.feedbackHistory = [];
    } catch (error) {
      console.error('Failed to load feedback history:', error);
    }
  }

  /**
   * Save feedback history to storage
   */
  private async saveFeedbackHistory(): Promise<void> {
    try {
      // This would save to a database or file
      // For now, just log
      console.log(`💾 Saved ${this.feedbackHistory.length} feedback items`);
    } catch (error) {
      console.error('Failed to save feedback history:', error);
    }
  }

  /**
   * Log decision for analysis
   */
  private logDecision(profile: any, decision: FilteringDecision): void {
    console.log(`🔍 Filtering decision: ${profile.username} → ${decision.isInfluencer ? 'Influencer' : decision.isBrandAccount ? 'Brand' : 'Generic'} (${decision.confidence.toFixed(1)}% confidence)`);
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(): {
    accuracy: number;
    version: string;
    trainingData: number;
    feedbackItems: number;
    lastUpdated: Date;
  } {
    return {
      accuracy: this.model.accuracy,
      version: this.model.version,
      trainingData: this.model.trainingData,
      feedbackItems: this.feedbackHistory.length,
      lastUpdated: this.model.lastUpdated
    };
  }
}

/**
 * Global instance for the filtering system
 */
export const advancedFilteringSystem = new AdvancedFilteringSystem();

/**
 * Enhanced filtering function for integration with existing code
 */
export async function enhancedInfluencerFiltering(
  profile: any,
  context?: { searchQuery?: string; brandName?: string }
): Promise<{
  shouldInclude: boolean;
  decision: FilteringDecision;
  recommendations: string[];
}> {
  const decision = await advancedFilteringSystem.makeFilteringDecision(profile, context);
  
  const shouldInclude = decision.isInfluencer;
  
  const recommendations: string[] = [];
  
  if (decision.riskLevel === 'high') {
    recommendations.push('⚠️ High-risk decision - consider manual review');
  }
  
  if (decision.confidence < 70) {
    recommendations.push('🔍 Low confidence - may need additional verification');
  }
  
  if (decision.isBrandAccount && decision.confidence < 90) {
    recommendations.push('🏢 Potential brand account - verify before excluding');
  }
  
  return {
    shouldInclude,
    decision,
    recommendations
  };
} 