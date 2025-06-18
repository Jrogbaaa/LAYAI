import { NextRequest, NextResponse } from 'next/server';
import { ProfileVerificationService, type ProfileVerificationRequest, type VerificationResult } from '@/lib/profileVerificationService';

interface VerifyProfilesRequest {
  profiles: Array<{
    url: string;
    platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
    discoveryData?: {
      username: string;
      followers?: number;
      category?: string;
      location?: string;
    };
  }>;
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
  verificationLevel?: 'basic' | 'full'; // basic = quick validation, full = complete scraping
}

interface VerifyProfilesResponse {
  success: boolean;
  results: VerificationResult[];
  summary: {
    totalProfiles: number;
    verifiedProfiles: number;
    averageScore: number;
    highQualityMatches: number; // Score >= 80
    mediumQualityMatches: number; // Score 60-79
    lowQualityMatches: number; // Score < 60
    processingTimeMs: number;
  };
  recommendations: string[];
  errors?: string[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: VerifyProfilesRequest = await request.json();
    const { profiles, searchCriteria, verificationLevel = 'basic' } = body;

    console.log(`🔍 Starting profile verification for ${profiles.length} profiles (${verificationLevel} mode)`);

    // Validate input
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No profiles provided for verification'
      }, { status: 400 });
    }

    if (profiles.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 50 profiles can be verified at once'
      }, { status: 400 });
    }

    const verificationService = new ProfileVerificationService();
    
    // Convert profiles to verification requests
    const verificationRequests: ProfileVerificationRequest[] = profiles.map(profile => ({
      profileUrl: profile.url,
      platform: profile.platform,
      searchCriteria
    }));

    let results: VerificationResult[] = [];
    const errors: string[] = [];

    if (verificationLevel === 'basic') {
      // Basic verification - use existing discovery data + quick validation
      results = await performBasicVerification(profiles, searchCriteria);
    } else {
      // Full verification - complete scraping and analysis
      try {
        results = await verificationService.verifyProfiles(verificationRequests);
      } catch (error) {
        errors.push(`Verification service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Verification service failed:', error);
        
        // Fallback to basic verification
        console.log('🔄 Falling back to basic verification...');
        results = await performBasicVerification(profiles, searchCriteria);
      }
    }

    // Generate summary and recommendations
    const summary = generateSummary(results, Date.now() - startTime);
    const recommendations = generateRecommendations(results, searchCriteria);

    const response: VerifyProfilesResponse = {
      success: true,
      results: results.sort((a, b) => b.overallScore - a.overallScore), // Sort by score desc
      summary,
      recommendations,
      ...(errors.length > 0 && { errors })
    };

    console.log(`✅ Profile verification completed: ${summary.verifiedProfiles}/${summary.totalProfiles} verified`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Profile verification API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during profile verification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Basic verification using existing discovery data + heuristic analysis
 */
async function performBasicVerification(
  profiles: VerifyProfilesRequest['profiles'],
  searchCriteria: VerifyProfilesRequest['searchCriteria']
): Promise<VerificationResult[]> {
  
  console.log('🔍 Performing basic verification using discovery data...');
  
  return profiles.map(profile => {
    const extractedData = {
      username: profile.discoveryData?.username || extractUsernameFromUrl(profile.url),
      followerCount: profile.discoveryData?.followers,
      location: profile.discoveryData?.location,
      bio: profile.discoveryData?.category,
    };

    // Basic scoring using available data
    const matchAnalysis = analyzeBasicMatch(extractedData, searchCriteria);
    const overallScore = calculateBasicScore(matchAnalysis);

    return {
      profileUrl: profile.url,
      platform: profile.platform,
      verified: overallScore >= 60, // Lower threshold for basic verification
      confidence: Math.min(overallScore / 100 * 0.7, 1), // Max 70% confidence for basic
      extractedData,
      matchAnalysis,
      overallScore,
      scrapedAt: new Date(),
      errors: ['Basic verification - limited data available']
    } as VerificationResult;
  });
}

/**
 * Basic match analysis using limited discovery data
 */
function analyzeBasicMatch(
  extractedData: any,
  criteria: VerifyProfilesRequest['searchCriteria']
) {
  // Niche alignment based on category/bio
  const nicheAlignment = analyzeBasicNiche(extractedData, criteria);
  
  // Demographic match based on available data
  const demographicMatch = analyzeBasicDemographics(extractedData, criteria);
  
  // Brand compatibility - generic scoring
  const brandCompatibility = {
    score: 70, // Neutral score for basic verification
    reasons: ['Basic verification - brand compatibility not fully analyzed'],
    redFlags: []
  };
  
  // Follower validation
  const followerValidation = validateBasicFollowers(extractedData, criteria);

  return {
    nicheAlignment,
    demographicMatch,
    brandCompatibility,
    followerValidation
  };
}

function analyzeBasicNiche(extractedData: any, criteria: VerifyProfilesRequest['searchCriteria']) {
  const bio = (extractedData.bio || '').toLowerCase();
  const targetNiches = criteria.niches || [];
  
  let score = 0;
  const matchedKeywords: string[] = [];
  
  // Basic keyword matching
  const nicheKeywords: Record<string, string[]> = {
    'home': ['home', 'interior', 'decor', 'furniture', 'design'],
    'lifestyle': ['lifestyle', 'life', 'wellness', 'daily'],
    'fashion': ['fashion', 'style', 'outfit', 'clothing'],
    'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics'],
    'fitness': ['fitness', 'workout', 'gym', 'health'],
    'food': ['food', 'cooking', 'recipe', 'chef'],
    'travel': ['travel', 'trip', 'vacation', 'explore'],
    'tech': ['tech', 'technology', 'digital', 'app']
  };
  
  for (const niche of targetNiches) {
    const keywords = nicheKeywords[niche.toLowerCase()] || [];
    const matches = keywords.filter(keyword => bio.includes(keyword));
    matchedKeywords.push(...matches);
    score += matches.length * 15;
  }
  
  // Brand-specific bonus
  if (criteria.brandName && bio.includes(criteria.brandName.toLowerCase())) {
    score += 25;
    matchedKeywords.push(criteria.brandName.toLowerCase());
  }
  
  score = Math.min(score, 100);
  
  return {
    score,
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    explanation: `Basic niche analysis: ${matchedKeywords.length} relevant keywords found`
  };
}

function analyzeBasicDemographics(extractedData: any, criteria: VerifyProfilesRequest['searchCriteria']) {
  let score = 50; // Start with neutral score
  const explanations: string[] = [];
  
  // Location matching
  let locationMatch = false;
  if (criteria.location && extractedData.location) {
    const targetLocation = criteria.location.toLowerCase();
    const profileLocation = extractedData.location.toLowerCase();
    locationMatch = profileLocation.includes(targetLocation) || targetLocation.includes(profileLocation);
    
    if (locationMatch) {
      score += 30;
      explanations.push(`Location matches: ${extractedData.location}`);
    } else {
      score -= 10;
      explanations.push(`Location mismatch: ${extractedData.location} vs ${criteria.location}`);
    }
  } else if (!criteria.location) {
    score += 20; // No location requirement
    locationMatch = true;
  }
  
  // Age/Gender - can't determine from basic data
  score += 20; // Don't penalize for missing demographic data
  explanations.push('Age and gender could not be determined from basic data');
  
  return {
    score: Math.max(0, Math.min(100, score)),
    locationMatch,
    explanation: explanations.join('; ')
  };
}

function validateBasicFollowers(extractedData: any, criteria: VerifyProfilesRequest['searchCriteria']) {
  const followerCount = extractedData.followerCount || 0;
  let score = 100;
  let inRange = true;
  const explanations: string[] = [];
  
  if (criteria.minFollowers && followerCount > 0 && followerCount < criteria.minFollowers) {
    score -= 40;
    inRange = false;
    explanations.push(`Below minimum: ${followerCount} < ${criteria.minFollowers}`);
  }
  
  if (criteria.maxFollowers && followerCount > criteria.maxFollowers) {
    score -= 40;
    inRange = false;
    explanations.push(`Above maximum: ${followerCount} > ${criteria.maxFollowers}`);
  }
  
  if (followerCount === 0) {
    score = 60; // Neutral score when follower count unknown
    explanations.push('Follower count not available in discovery data');
  } else {
    explanations.push(`${followerCount.toLocaleString()} followers`);
  }
  
  return {
    score: Math.max(0, score),
    inRange,
    quality: 'medium' as const,
    explanation: explanations.join('; ')
  };
}

function calculateBasicScore(analysis: any): number {
  const weights = {
    nicheAlignment: 0.4,      // Higher weight for niche in basic verification
    followerValidation: 0.3,  // Follower count importance
    demographicMatch: 0.2,    // Demographics
    brandCompatibility: 0.1   // Lower weight since we can't analyze properly
  };
  
  return Math.round(
    analysis.nicheAlignment.score * weights.nicheAlignment +
    analysis.followerValidation.score * weights.followerValidation +
    analysis.demographicMatch.score * weights.demographicMatch +
    analysis.brandCompatibility.score * weights.brandCompatibility
  );
}

function generateSummary(results: VerificationResult[], processingTimeMs: number) {
  const totalProfiles = results.length;
  const verifiedProfiles = results.filter(r => r.verified).length;
  const scores = results.map(r => r.overallScore);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  
  const highQualityMatches = results.filter(r => r.overallScore >= 80).length;
  const mediumQualityMatches = results.filter(r => r.overallScore >= 60 && r.overallScore < 80).length;
  const lowQualityMatches = results.filter(r => r.overallScore < 60).length;
  
  return {
    totalProfiles,
    verifiedProfiles,
    averageScore: Math.round(averageScore),
    highQualityMatches,
    mediumQualityMatches,
    lowQualityMatches,
    processingTimeMs
  };
}

function generateRecommendations(
  results: VerificationResult[], 
  searchCriteria: VerifyProfilesRequest['searchCriteria']
): string[] {
  const recommendations: string[] = [];
  
  const highQualityCount = results.filter(r => r.overallScore >= 80).length;
  const lowQualityCount = results.filter(r => r.overallScore < 60).length;
  
  if (highQualityCount === 0) {
    recommendations.push('⚠️ No high-quality matches found. Consider broadening your search criteria.');
  } else if (highQualityCount < 3) {
    recommendations.push('💡 Consider searching for more profiles to increase your options.');
  }
  
  if (lowQualityCount > results.length * 0.7) {
    recommendations.push('🔍 Many profiles have low match scores. Try refining your search parameters.');
  }
  
  // Analyze common issues
  const followerIssues = results.filter(r => !r.matchAnalysis.followerValidation.inRange).length;
  if (followerIssues > results.length * 0.5) {
    recommendations.push('📊 Many profiles fall outside your follower range. Consider adjusting min/max followers.');
  }
  
  const nicheIssues = results.filter(r => r.matchAnalysis.nicheAlignment.score < 50).length;
  if (nicheIssues > results.length * 0.5) {
    recommendations.push('🎯 Poor niche alignment detected. Try different keywords or niche categories.');
  }
  
  if (searchCriteria.location) {
    const locationMismatches = results.filter(r => !r.matchAnalysis.demographicMatch.locationMatch).length;
    if (locationMismatches > results.length * 0.7) {
      recommendations.push('🌍 Location targeting appears too restrictive. Consider broader geographic areas.');
    }
  }
  
  // Positive recommendations
  if (highQualityCount >= 5) {
    recommendations.push('✅ Great results! You have multiple high-quality matches to choose from.');
  }
  
  return recommendations;
}

function extractUsernameFromUrl(url: string): string {
  const match = url.match(/@([^/?\s]+)/);
  return match ? match[1] : url.split('/').pop() || '';
} 