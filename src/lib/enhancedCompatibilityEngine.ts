/**
 * Enhanced Brand Compatibility Engine
 * Multi-dimensional scoring with transparency and aesthetic understanding
 * LAYAI v2.18.0 - Dynamic Brand Intelligence System
 */

import { 
  getBrandProfile, 
  getAestheticProfile, 
  detectAesthetics, 
  areCompetitors,
  BrandProfile, 
  CompatibilityScore,
  AESTHETIC_PROFILES 
} from './brandDatabase';
import { VettedInfluencer } from './vettedInfluencersService';

/**
 * Calculate comprehensive brand compatibility with transparency
 */
export function calculateDynamicBrandCompatibility(
  influencer: VettedInfluencer, 
  brandName: string
): CompatibilityScore {
  const brandProfile = getBrandProfile(brandName);
  
  if (!brandProfile) {
    // Fallback to universal scoring for unknown brands
    return calculateUniversalCompatibility(influencer, brandName);
  }

  console.log(`🧠 Calculating dynamic compatibility for ${influencer.username} x ${brandProfile.brandName}`);

  // 1. Category Match Analysis
  const categoryMatch = analyzeCategoryCompatibility(influencer, brandProfile);
  
  // 2. Audience Alignment Analysis
  const audienceAlignment = analyzeAudienceCompatibility(influencer, brandProfile);
  
  // 3. Aesthetic Compatibility Analysis
  const aestheticCompatibility = analyzeAestheticCompatibility(influencer, brandProfile);
  
  // 4. Risk Assessment Analysis
  const riskAssessment = analyzeRiskFactors(influencer, brandProfile);
  
  // 5. Generate Transparency Information
  const transparency = generateTransparencyInfo(
    influencer,
    brandProfile,
    categoryMatch,
    audienceAlignment,
    aestheticCompatibility,
    riskAssessment
  );

  // Calculate weighted overall score using brand-specific weightings
  const overallScore = Math.round(
    categoryMatch.score * brandProfile.weightings.categoryMatch +
    audienceAlignment.score * brandProfile.weightings.audienceAlignment +
    aestheticCompatibility.score * brandProfile.weightings.aestheticCompatibility +
    riskAssessment.score * brandProfile.weightings.riskAssessment
  );

  console.log(`📊 ${influencer.username} compatibility: ${overallScore}/100 (Category: ${categoryMatch.score}, Audience: ${audienceAlignment.score}, Aesthetic: ${aestheticCompatibility.score}, Risk: ${riskAssessment.score})`);

  return {
    overallScore,
    categoryMatch,
    audienceAlignment,
    aestheticCompatibility,
    riskAssessment,
    transparency
  };
}

/**
 * Analyze how well influencer's niche matches brand's category
 */
function analyzeCategoryCompatibility(
  influencer: VettedInfluencer,
  brandProfile: BrandProfile
): CompatibilityScore['categoryMatch'] {
  let score = 0;
  const reasons: string[] = [];
  let matchType: 'perfect' | 'strong' | 'moderate' | 'weak' | 'none' = 'none';

  // Check genre alignment with brand's content themes
  const genreMatches = influencer.genres.filter(genre => 
    brandProfile.contentThemes.some(theme => 
      genre.toLowerCase().includes(theme.toLowerCase()) ||
      theme.toLowerCase().includes(genre.toLowerCase())
    )
  );

  if (genreMatches.length > 0) {
    const matchPercentage = (genreMatches.length / influencer.genres.length) * 100;
    
    if (matchPercentage >= 80) {
      score = 95;
      matchType = 'perfect';
      reasons.push(`Perfect niche alignment: ${genreMatches.join(', ')} matches ${brandProfile.category}`);
    } else if (matchPercentage >= 60) {
      score = 85;
      matchType = 'strong';
      reasons.push(`Strong niche overlap: ${genreMatches.join(', ')} aligns with brand themes`);
    } else if (matchPercentage >= 40) {
      score = 70;
      matchType = 'moderate';
      reasons.push(`Moderate niche relevance: Some content overlap with brand category`);
    } else {
      score = 50;
      matchType = 'weak';
      reasons.push(`Weak niche alignment: Limited content overlap`);
    }
  }

  // Bonus for verified accounts in premium brand categories
  if (influencer.isVerified && ['luxury', 'premium'].some(keyword => 
    brandProfile.aestheticKeywords.includes(keyword))) {
    score += 10;
    reasons.push('Verified account bonus for premium brand');
  }

  // Check username and display name for brand values
  const profileText = (influencer.username + ' ' + influencer.displayName).toLowerCase();
  const profileMatches = brandProfile.brandValues.filter(value => 
    profileText.includes(value.toLowerCase())
  );

  if (profileMatches.length > 0) {
    score += Math.min(15, profileMatches.length * 5);
    reasons.push(`Profile mentions brand values: ${profileMatches.join(', ')}`);
  }

  return {
    score: Math.min(100, score),
    matchType,
    reasons
  };
}

/**
 * Analyze audience demographic alignment
 */
function analyzeAudienceCompatibility(
  influencer: VettedInfluencer,
  brandProfile: BrandProfile
): CompatibilityScore['audienceAlignment'] {
  let totalScore = 0;
  
  // Age compatibility (assume influencer age correlates with audience)
  let ageCompatibility = 50; // Base score
  
  // Follower count as age indicator (rough heuristic)
  const followers = influencer.followerCount;
  let estimatedInfluencerAge = 25; // Default
  
  if (followers < 50000) estimatedInfluencerAge = 22; // Likely younger
  else if (followers > 500000) estimatedInfluencerAge = 30; // Likely older/established
  
  const [primaryAgeMin, primaryAgeMax] = brandProfile.targetAudience.primaryAge;
  if (estimatedInfluencerAge >= primaryAgeMin && estimatedInfluencerAge <= primaryAgeMax) {
    ageCompatibility = 90;
  } else if (estimatedInfluencerAge >= primaryAgeMin - 5 && estimatedInfluencerAge <= primaryAgeMax + 5) {
    ageCompatibility = 75;
  }

  // Gender compatibility (based on username and display name analysis)
  let genderCompatibility = 80; // Default mixed
  if (brandProfile.targetAudience.gender !== 'mixed') {
    // Simple profile analysis for gender indicators
    const profileText = (influencer.username + ' ' + influencer.displayName).toLowerCase();
    const femaleIndicators = ['she', 'her', 'mother', 'mom', 'girl', 'woman', 'female'];
    const maleIndicators = ['he', 'him', 'father', 'dad', 'guy', 'man', 'male'];
    
    const hasFemaleIndicators = femaleIndicators.some(indicator => profileText.includes(indicator));
    const hasMaleIndicators = maleIndicators.some(indicator => profileText.includes(indicator));
    
    if (brandProfile.targetAudience.gender === 'female' && hasFemaleIndicators) {
      genderCompatibility = 95;
    } else if (brandProfile.targetAudience.gender === 'male' && hasMaleIndicators) {
      genderCompatibility = 95;
    } else if ((brandProfile.targetAudience.gender === 'female' && hasMaleIndicators) ||
               (brandProfile.targetAudience.gender === 'male' && hasFemaleIndicators)) {
      genderCompatibility = 40;
    }
  }

  // Interest overlap (based on genres and profile text)
  const allInfluencerContent = [...influencer.genres, influencer.username, influencer.displayName].join(' ').toLowerCase();
  const interestMatches = brandProfile.targetAudience.interests.filter(interest =>
    allInfluencerContent.includes(interest.toLowerCase())
  );
  
  const interestOverlap = interestMatches.length > 0 ? 
    Math.min(100, (interestMatches.length / brandProfile.targetAudience.interests.length) * 100 + 20) : 40;

  totalScore = (ageCompatibility + genderCompatibility + interestOverlap) / 3;

  return {
    score: Math.round(totalScore),
    ageCompatibility: Math.round(ageCompatibility),
    genderCompatibility: Math.round(genderCompatibility),
    interestOverlap: Math.round(interestOverlap)
  };
}

/**
 * Analyze aesthetic and content style compatibility
 */
function analyzeAestheticCompatibility(
  influencer: VettedInfluencer,
  brandProfile: BrandProfile
): CompatibilityScore['aestheticCompatibility'] {
  let score = 50; // Base score
  
  // Detect aesthetics from influencer content
  const allContent = [
    influencer.username,
    influencer.displayName,
    ...influencer.genres,
  ].join(' ');
  
  const detectedAesthetics = detectAesthetics(allContent);
  
  // Check alignment with brand aesthetic keywords
  let aestheticMatches = 0;
  let contentStyle = 'general';
  let visualAesthetic = 'mixed';
  
  detectedAesthetics.forEach(aesthetic => {
    if (brandProfile.aestheticKeywords.some(keyword => 
      keyword.toLowerCase().includes(aesthetic.toLowerCase()) ||
      aesthetic.toLowerCase().includes(keyword.toLowerCase())
    )) {
      aestheticMatches++;
      contentStyle = aesthetic;
    }
  });

  if (aestheticMatches > 0) {
    score += aestheticMatches * 15;
    visualAesthetic = detectedAesthetics[0] || 'mixed';
  }

  // Professionalism level based on verification and engagement
  let professionalismLevel = 50;
  if (influencer.isVerified) professionalismLevel += 25;
  if (influencer.engagementRate > 0.03) professionalismLevel += 15;
  if (influencer.followerCount > 100000) professionalismLevel += 10;

  // Adjust for brand risk tolerance
  if (brandProfile.riskTolerance === 'low' && professionalismLevel < 60) {
    score -= 20; // Penalize unprofessional accounts for conservative brands
  } else if (brandProfile.riskTolerance === 'high' && professionalismLevel > 80) {
    score -= 10; // Penalize overly polished accounts for edgy brands
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    contentStyle,
    visualAesthetic,
    professionalismLevel: Math.min(100, professionalismLevel)
  };
}

/**
 * Analyze risk factors for brand safety
 */
function analyzeRiskFactors(
  influencer: VettedInfluencer,
  brandProfile: BrandProfile
): CompatibilityScore['riskAssessment'] {
  let score = 80; // Start with good score
  const brandSafetyFactors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Check for competitor collaborations (simplified)
  let competitorCollaborations = 0;
  const profileText = (influencer.username + ' ' + influencer.displayName).toLowerCase();
  
  brandProfile.competitorBrands.forEach(competitor => {
    if (profileText.includes(competitor.toLowerCase())) {
      competitorCollaborations++;
      score -= 15;
      brandSafetyFactors.push(`Previous mention of competitor: ${competitor}`);
    }
  });

  // Engagement authenticity check
  const expectedEngagement = getExpectedEngagementRate(influencer.followerCount);
  const engagementRatio = influencer.engagementRate / expectedEngagement;
  
  if (engagementRatio < 0.3) {
    score -= 25;
    riskLevel = 'high';
    brandSafetyFactors.push('Suspiciously low engagement rate may indicate fake followers');
  } else if (engagementRatio > 3.0) {
    score -= 15;
    riskLevel = 'medium';
    brandSafetyFactors.push('Unusually high engagement rate needs verification');
  }

  // Account verification and age
  if (!influencer.isVerified && influencer.followerCount > 100000) {
    score -= 10;
    brandSafetyFactors.push('Large unverified account carries higher risk');
  }

  // Risk tolerance adjustment
  if (brandProfile.riskTolerance === 'low' && riskLevel !== 'low') {
    score -= 20; // Conservative brands penalize any risk
  } else if (brandProfile.riskTolerance === 'high' && riskLevel === 'low') {
    score += 5; // Edgy brands prefer some risk
  }

  if (score < 60 && riskLevel === 'low') riskLevel = 'medium';
  if (score < 40) riskLevel = 'high';

  return {
    score: Math.min(100, Math.max(0, score)),
    riskLevel,
    competitorCollaborations,
    brandSafetyFactors
  };
}

/**
 * Generate transparency information explaining the match
 */
function generateTransparencyInfo(
  influencer: VettedInfluencer,
  brandProfile: BrandProfile,
  categoryMatch: CompatibilityScore['categoryMatch'],
  audienceAlignment: CompatibilityScore['audienceAlignment'],
  aestheticCompatibility: CompatibilityScore['aestheticCompatibility'],
  riskAssessment: CompatibilityScore['riskAssessment']
): CompatibilityScore['transparency'] {
  const matchReasons: string[] = [];
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';

  // Add category reasons
  if (categoryMatch.matchType === 'perfect' || categoryMatch.matchType === 'strong') {
    matchReasons.push(`Excellent ${brandProfile.category} niche alignment`);
    confidenceLevel = 'high';
  } else if (categoryMatch.matchType === 'moderate') {
    matchReasons.push(`Moderate content relevance to ${brandProfile.brandName}`);
  }

  // Add audience reasons
  if (audienceAlignment.score > 80) {
    matchReasons.push(`Target audience demographics align well with ${brandProfile.brandName}'s customer base`);
  } else if (audienceAlignment.score > 60) {
    matchReasons.push(`Decent audience overlap with brand target market`);
  }

  // Add aesthetic reasons
  if (aestheticCompatibility.score > 80) {
    matchReasons.push(`Content aesthetic matches ${brandProfile.brandName}'s ${brandProfile.aestheticKeywords.join(', ')} style`);
  } else if (aestheticCompatibility.score < 40) {
    matchReasons.push(`Content style may not align with brand aesthetic preferences`);
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
  }

  // Add risk reasons
  if (riskAssessment.riskLevel === 'high') {
    matchReasons.push(`⚠️ Higher risk profile - requires additional verification`);
    confidenceLevel = 'low';
  } else if (riskAssessment.riskLevel === 'low' && brandProfile.riskTolerance === 'low') {
    matchReasons.push(`✅ Low risk profile suitable for conservative brand`);
  }

  // Add follower range reason
  const { min, max } = brandProfile.optimalFollowerRange;
  if (influencer.followerCount >= min && influencer.followerCount <= max) {
    matchReasons.push(`Follower count (${influencer.followerCount.toLocaleString()}) in optimal range for ${brandProfile.brandName}`);
  }

  const scoringBreakdown = {
    'Category Match': categoryMatch.score,
    'Audience Alignment': audienceAlignment.score,
    'Aesthetic Compatibility': aestheticCompatibility.score,
    'Risk Assessment': riskAssessment.score
  };

  return {
    matchReasons,
    confidenceLevel,
    scoringBreakdown
  };
}

/**
 * Fallback universal compatibility for unknown brands
 */
function calculateUniversalCompatibility(
  influencer: VettedInfluencer,
  brandName: string
): CompatibilityScore {
  // Simplified scoring for unknown brands
  const baseScore = 70;
  const engagementBonus = influencer.engagementRate > 0.03 ? 10 : 0;
  const verificationBonus = influencer.isVerified ? 10 : 0;
  const followerBonus = influencer.followerCount >= 10000 && influencer.followerCount <= 500000 ? 10 : 0;

  const overallScore = Math.min(100, baseScore + engagementBonus + verificationBonus + followerBonus);

  return {
    overallScore,
    categoryMatch: {
      score: 70,
      matchType: 'moderate' as const,
      reasons: [`General content compatibility with ${brandName}`]
    },
    audienceAlignment: {
      score: 70,
      ageCompatibility: 70,
      genderCompatibility: 80,
      interestOverlap: 60
    },
    aestheticCompatibility: {
      score: 70,
      contentStyle: 'general',
      visualAesthetic: 'mixed',
      professionalismLevel: influencer.isVerified ? 80 : 60
    },
    riskAssessment: {
      score: 80,
      riskLevel: 'low' as const,
      competitorCollaborations: 0,
      brandSafetyFactors: []
    },
    transparency: {
      matchReasons: [
        `General brand compatibility for ${brandName}`,
        `${influencer.engagementRate > 0.03 ? 'Good' : 'Moderate'} engagement rate`,
        influencer.isVerified ? 'Verified account adds credibility' : 'Unverified account'
      ],
      confidenceLevel: 'medium' as const,
      scoringBreakdown: {
        'General Compatibility': overallScore
      }
    }
  };
}

/**
 * Calculate expected engagement rate based on follower count
 */
function getExpectedEngagementRate(followers: number): number {
  if (followers < 1000) return 0.08;
  if (followers < 10000) return 0.06;
  if (followers < 100000) return 0.04;
  if (followers < 1000000) return 0.02;
  return 0.015;
}

/**
 * Enhanced query parsing for aesthetic keywords
 */
export function parseAestheticKeywords(query: string): string[] {
  const detectedAesthetics = detectAesthetics(query);
  const additionalKeywords: string[] = [];

  // Check for style-related terms
  const styleTerms = {
    'clean': 'minimalist',
    'simple': 'minimalist', 
    'elegant': 'luxury',
    'sophisticated': 'luxury',
    'casual': 'casual',
    'relaxed': 'casual',
    'creative': 'creative',
    'artistic': 'creative',
    'eco': 'sustainable',
    'green': 'sustainable',
    'business': 'professional',
    'corporate': 'professional'
  };

  Object.entries(styleTerms).forEach(([term, aesthetic]) => {
    if (query.toLowerCase().includes(term) && !detectedAesthetics.includes(aesthetic)) {
      additionalKeywords.push(aesthetic);
    }
  });

  return [...detectedAesthetics, ...additionalKeywords];
}

/**
 * Generate enhanced match reasons for search results
 */
export function generateEnhancedMatchReasons(
  influencer: VettedInfluencer,
  brandName: string,
  compatibilityScore?: CompatibilityScore
): string[] {
  if (compatibilityScore) {
    return compatibilityScore.transparency.matchReasons;
  }

  // Fallback reasons for backward compatibility
  const reasons: string[] = [];
  
  reasons.push(`Matched for ${brandName} based on content relevance`);
  
  if (influencer.engagementRate > 0.05) {
    reasons.push(`Excellent ${(influencer.engagementRate * 100).toFixed(1)}% engagement rate`);
  } else if (influencer.engagementRate > 0.03) {
    reasons.push(`Good ${(influencer.engagementRate * 100).toFixed(1)}% engagement rate`);
  }

  if (influencer.isVerified) {
    reasons.push('Verified account provides brand credibility');
  }

  if (influencer.followerCount >= 10000 && influencer.followerCount <= 500000) {
    reasons.push('Optimal follower range for authentic engagement');
  }

  return reasons;
} 