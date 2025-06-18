import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithTwoTierDiscovery, type ApifySearchParams } from '@/lib/apifyService';

interface EnhancedSearchRequest {
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
  enableSpanishDetection?: boolean;
  enableAgeEstimation?: boolean;
  maxResults?: number;
}

// Simplified Spanish location detection
function detectSpanishLocation(profile: any): {
  isSpanish: boolean;
  confidence: number;
  indicators: string[];
} {
  const spanishCities = [
    'madrid', 'barcelona', 'valencia', 'sevilla', 'seville', 'bilbao', 'málaga', 'malaga'
  ];
  
  const spanishIndicators = [
    'españa', 'spain', 'spanish', 'española', 'español'
  ];
  
  const allText = [
    profile.bio || '',
    profile.location || '',
    profile.fullName || '',
    profile.username || ''
  ].join(' ').toLowerCase();
  
  let confidence = 0;
  const indicators: string[] = [];
  
  // Check location field
  if (profile.location) {
    const location = profile.location.toLowerCase();
    for (const city of spanishCities) {
      if (location.includes(city)) {
        confidence += 40;
        indicators.push(`Spanish city: ${city}`);
        break;
      }
    }
    
    for (const indicator of spanishIndicators) {
      if (location.includes(indicator)) {
        confidence += 30;
        indicators.push(`Spanish indicator: ${indicator}`);
        break;
      }
    }
  }
  
  // Check bio and other text
  for (const indicator of spanishIndicators) {
    if (allText.includes(indicator)) {
      confidence += 15;
      indicators.push(`Text contains: ${indicator}`);
    }
  }
  
  return {
    isSpanish: confidence >= 30,
    confidence: Math.min(confidence, 100),
    indicators
  };
}

// Simplified age estimation
function estimateAge(profile: any): {
  estimatedAge?: number;
  confidence: number;
  method: string;
} {
  const allText = [
    profile.bio || '',
    profile.fullName || ''
  ].join(' ');
  
  // Look for direct age mentions
  const agePattern = /(\d{1,2})\s*(?:años?|years?|yo|y\.?o\.?|age)/i;
  const match = allText.match(agePattern);
  
  if (match) {
    const age = parseInt(match[1]);
    if (age >= 13 && age <= 80) {
      return {
        estimatedAge: age,
        confidence: 85,
        method: 'direct_mention'
      };
    }
  }
  
  // Basic heuristics based on username patterns
  const username = profile.username?.toLowerCase() || '';
  if (username.includes('teen') || username.includes('young')) {
    return {
      estimatedAge: 19,
      confidence: 40,
      method: 'username_heuristic'
    };
  }
  
  return {
    confidence: 0,
    method: 'unknown'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancedSearchRequest = await request.json();
    
    console.log('🚀 Enhanced search request:', {
      query: body.query,
      location: body.location,
      spanishDetection: body.enableSpanishDetection,
      ageEstimation: body.enableAgeEstimation
    });

    // Prepare search parameters
    const searchParams: ApifySearchParams = {
      niches: body.niches || [],
      location: body.location,
      minFollowers: body.minFollowers || 1000,
      maxFollowers: body.maxFollowers || 10000000,
      gender: body.gender,
      platforms: body.platforms || ['instagram', 'tiktok', 'youtube'],
      brandName: body.brandName
    };

    // Perform initial search
    console.log('🔍 Phase 1: Initial discovery...');
    const searchResults = await searchInfluencersWithTwoTierDiscovery(searchParams);

    if ((!searchResults.premiumResults || searchResults.premiumResults.length === 0) && 
        (!searchResults.discoveryResults || searchResults.discoveryResults.length === 0)) {
      return NextResponse.json({
        success: false,
        results: [],
        message: 'No influencers found matching the criteria',
        metadata: {
          totalFound: 0,
          spanishValidated: 0,
          ageEstimated: 0,
          processingTime: 0
        }
      });
    }

    // Combine all results
    const allResults = [...searchResults.premiumResults, ...searchResults.discoveryResults];
    console.log(`✅ Discovery found ${allResults.length} profiles (${searchResults.premiumResults.length} premium + ${searchResults.discoveryResults.length} discovery)`);

    // Phase 2: Enhanced validation
    const startTime = Date.now();
    let spanishValidatedCount = 0;
    let ageEstimatedCount = 0;

    const enhancedResults = allResults.map((influencer: any) => {
      try {
        let enhancedInfluencer = { ...influencer };
        let scoreAdjustment = 0;
        const enhancements: string[] = [];

        // Spanish location detection
        if (body.enableSpanishDetection) {
          console.log(`🇪🇸 Analyzing Spanish location for: ${influencer.username}`);
          const spanishResult = detectSpanishLocation(influencer);
          
          enhancedInfluencer.spanishValidation = {
            isSpanish: spanishResult.isSpanish,
            confidence: spanishResult.confidence,
            indicators: spanishResult.indicators.slice(0, 3)
          };

          if (spanishResult.isSpanish) {
            spanishValidatedCount++;
          }

          // Adjust score if looking for Spanish influencers
          const isLookingForSpanish = body.location && (
            body.location.toLowerCase().includes('spain') ||
            body.location.toLowerCase().includes('spanish') ||
            body.location.toLowerCase().includes('españa')
          );

          if (isLookingForSpanish) {
            if (spanishResult.isSpanish) {
              scoreAdjustment += 25;
              enhancements.push(`✅ Spanish location confirmed (${spanishResult.confidence}% confidence)`);
            } else {
              scoreAdjustment -= 15;
              enhancements.push(`❌ No Spanish location indicators found`);
            }
          }
        }

        // Age estimation
        if (body.enableAgeEstimation) {
          console.log(`🎂 Estimating age for: ${influencer.username}`);
          const ageResult = estimateAge(influencer);
          
          enhancedInfluencer.ageEstimation = {
            estimatedAge: ageResult.estimatedAge,
            confidence: ageResult.confidence,
            method: ageResult.method
          };

          if (ageResult.estimatedAge) {
            ageEstimatedCount++;
          }

          // Validate against age criteria
          if (body.minAge || body.maxAge) {
            const ageToCheck = ageResult.estimatedAge;
            
            if (ageToCheck) {
              let ageMatch = true;
              if (body.minAge && ageToCheck < body.minAge) ageMatch = false;
              if (body.maxAge && ageToCheck > body.maxAge) ageMatch = false;

              if (ageMatch) {
                scoreAdjustment += 15;
                enhancements.push(`✅ Age ${ageToCheck} matches criteria`);
              } else {
                scoreAdjustment -= 10;
                enhancements.push(`❌ Age ${ageToCheck} outside criteria (${body.minAge}-${body.maxAge})`);
              }
            }
          }
        }

        // Apply score adjustments
        if (scoreAdjustment !== 0) {
          enhancedInfluencer.originalScore = influencer.score || 50;
          enhancedInfluencer.enhancedScore = Math.max(0, Math.min(100, (influencer.score || 50) + scoreAdjustment));
          enhancedInfluencer.scoreAdjustment = scoreAdjustment;
          enhancedInfluencer.enhancements = enhancements;
        }

        return enhancedInfluencer;

      } catch (error) {
        console.error(`❌ Error enhancing profile ${influencer.username}:`, error);
        return influencer; // Return original if enhancement fails
      }
    });

    // Sort by enhanced score if available, otherwise by original score
    enhancedResults.sort((a: any, b: any) => {
      const scoreA = a.enhancedScore || a.score || 50;
      const scoreB = b.enhancedScore || b.score || 50;
      return scoreB - scoreA;
    });

    const processingTime = Date.now() - startTime;

    console.log(`✅ Enhanced search completed:`);
    console.log(`   📊 Total found: ${enhancedResults.length}`);
    console.log(`   🇪🇸 Spanish validated: ${spanishValidatedCount}`);
    console.log(`   🎂 Age estimated: ${ageEstimatedCount}`);
    console.log(`   ⏱️ Processing time: ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      results: enhancedResults,
      metadata: {
        totalFound: enhancedResults.length,
        spanishValidated: spanishValidatedCount,
        ageEstimated: ageEstimatedCount,
        processingTime,
        enhancementsApplied: {
          spanishDetection: body.enableSpanishDetection || false,
          ageEstimation: body.enableAgeEstimation || false
        },
        searchCriteria: {
          location: body.location,
          minAge: body.minAge,
          maxAge: body.maxAge,
          gender: body.gender,
          niches: body.niches
        }
      },
      recommendations: generateRecommendations(enhancedResults, body)
    });

  } catch (error) {
    console.error('❌ Enhanced search API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Enhanced search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(results: any[], searchParams: EnhancedSearchRequest): string[] {
  const recommendations: string[] = [];
  
  if (results.length === 0) {
    recommendations.push('No results found. Try broadening your search criteria.');
    return recommendations;
  }

  // Spanish-specific recommendations
  if (searchParams.enableSpanishDetection) {
    const spanishCount = results.filter(r => r.spanishValidation?.isSpanish).length;
    const spanishPercentage = (spanishCount / results.length) * 100;
    
    if (spanishPercentage < 30) {
      recommendations.push(`Only ${spanishPercentage.toFixed(0)}% of results are from Spain. Consider using Spanish keywords or location terms.`);
    } else {
      recommendations.push(`Good Spanish coverage: ${spanishPercentage.toFixed(0)}% of results are from Spain.`);
    }
  }

  // Age-specific recommendations
  if (searchParams.enableAgeEstimation) {
    const ageEstimatedCount = results.filter(r => r.ageEstimation?.estimatedAge).length;
    const agePercentage = (ageEstimatedCount / results.length) * 100;
    
    if (agePercentage < 50) {
      recommendations.push(`Age could only be estimated for ${agePercentage.toFixed(0)}% of profiles. Consider profiles with more biographical information.`);
    }
  }

  // Score-based recommendations
  const highScoreCount = results.filter(r => (r.enhancedScore || r.score || 0) >= 70).length;
  if (highScoreCount < results.length * 0.3) {
    recommendations.push('Consider refining your search criteria for better matches.');
  }

  return recommendations;
} 