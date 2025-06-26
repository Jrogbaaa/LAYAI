import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithApify, type ApifySearchParams } from '@/lib/apifyService';
import { searchVettedInfluencers, convertVettedToMatchResult } from '@/lib/vettedInfluencersService';

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

export async function POST(req: Request) {
  try {
    const searchParams: ApifySearchParams = await req.json();
    
    console.log('🔍 Enhanced search started with params:', searchParams);
    
    // Initialize results
    let allResults: any[] = [];
    let totalFound = 0;
    let searchSources: string[] = [];
    
    // 1. Search vetted influencers database first (only for Spain-related queries)
    console.log('📊 Searching vetted influencers database...');
    const vettedResults = await searchVettedInfluencers(searchParams);
    
    if (vettedResults.influencers.length > 0) {
      const convertedVetted = vettedResults.influencers.map(convertVettedToMatchResult);
      allResults.push(...convertedVetted);
      totalFound += vettedResults.totalCount;
      searchSources.push('Base de datos verificada');
      
      console.log(`✅ Found ${vettedResults.influencers.length} vetted influencers`);
    } else {
      console.log('📍 No vetted influencers found, proceeding with other sources');
    }
    
    // 2. Always search Apify API for real-time results
    console.log('🌐 Searching Apify API...');
    try {
      const apifyInfluencers = await searchInfluencersWithApify(searchParams);
      
      if (apifyInfluencers && apifyInfluencers.length > 0) {
        // Convert ScrapedInfluencer[] to MatchResult[] format
        const convertedApify = apifyInfluencers.map(influencer => ({
          influencer: {
            id: influencer.username,
            name: influencer.fullName || influencer.username,
            handle: influencer.username,
            platform: influencer.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
            followerCount: influencer.followers,
            engagementRate: influencer.engagementRate / 100,
            ageRange: '25-34' as const,
            gender: 'Other' as const,
            location: influencer.location || 'Unknown',
            niche: [influencer.category || 'Lifestyle'],
            contentStyle: ['Posts'] as const,
            pastCollaborations: [],
            averageRate: Math.floor(influencer.followers / 100) || 500,
            costLevel: 'Mid-Range' as const,
            audienceDemographics: {
              ageGroups: {
                '13-17': 5,
                '18-24': 30,
                '25-34': 40,
                '35-44': 20,
                '45-54': 4,
                '55+': 1,
              },
              gender: {
                male: 45,
                female: 52,
                other: 3,
              },
              topLocations: [influencer.location || 'Unknown'],
              interests: [influencer.category || 'Lifestyle'],
            },
            recentPosts: [],
            contactInfo: {
              email: influencer.email,
              preferredContact: 'Email' as const,
            },
            isActive: true,
            lastUpdated: new Date(),
          },
          matchScore: vettedResults.influencers.length > 0 ? 
            (influencer.brandCompatibilityScore || 75) / 100 * 0.8 : // Lower score if we have vetted results
            (influencer.brandCompatibilityScore || 75) / 100, // Higher score if no vetted results
          matchReasons: [
            'Búsqueda en tiempo real',
            `${(influencer.followers || 0).toLocaleString()} seguidores`,
            `${(influencer.engagementRate || 0).toFixed(1)}% engagement rate`,
            influencer.verified ? '✅ Cuenta verificada' : 'Cuenta activa'
          ],
          estimatedCost: Math.floor(influencer.followers / 100) || 500,
          similarPastCampaigns: [],
          potentialReach: Math.round(influencer.followers * (influencer.engagementRate / 100)),
          recommendations: ['Influencer encontrado mediante búsqueda en tiempo real'],
        }));
        
        allResults.push(...convertedApify);
        totalFound += apifyInfluencers.length;
        searchSources.push('Búsqueda en tiempo real');
        
        console.log(`✅ Found ${apifyInfluencers.length} Apify results`);
      } else {
        console.log('⚠️ No Apify results found');
      }
    } catch (error) {
      console.warn('⚠️ Apify search failed:', error);
    }
    
    // Remove duplicates based on handle/username
    const uniqueResults = allResults.filter((result, index, array) => {
      return array.findIndex(r => 
        r.influencer.handle?.toLowerCase() === result.influencer.handle?.toLowerCase() ||
        r.influencer.name?.toLowerCase() === result.influencer.name?.toLowerCase()
      ) === index;
    });
    
    // Sort with sophisticated prioritization:
    // 1. Vetted database results first (highest match scores)
    // 2. Within each group, sort by engagement rate then follower count
    uniqueResults.sort((a, b) => {
      // Primary sort: Match score (vetted results have 0.95 score)
      const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
      if (Math.abs(scoreDiff) > 0.1) {
        return scoreDiff;
      }
      
      // Secondary sort: Engagement rate (higher is better)
      const engagementA = a.influencer.engagementRate || 0;
      const engagementB = b.influencer.engagementRate || 0;
      const engagementDiff = engagementB - engagementA;
      if (Math.abs(engagementDiff) > 0.001) {
        return engagementDiff;
      }
      
      // Tertiary sort: Follower count (higher is better)
      const followersA = a.influencer.followerCount || 0;
      const followersB = b.influencer.followerCount || 0;
      return followersB - followersA;
    });
    
    // Apply result limit
    const limitedResults = uniqueResults.slice(0, searchParams.maxResults || 20);
    
    console.log(`🎯 Returning ${limitedResults.length} unique results from sources: ${searchSources.join(', ')}`);
    
    // Enhanced response format
    return NextResponse.json({
      success: true,
      data: {
        premiumResults: limitedResults,
        totalFound: uniqueResults.length,
        searchSources,
        searchMetadata: {
          vettedCount: vettedResults.influencers.length,
          apifyCount: allResults.length - vettedResults.influencers.length,
          query: searchParams.platforms?.join(', ') || 'Enhanced search',
          location: searchParams.location,
          platforms: searchParams.platforms,
          filters: {
            minFollowers: searchParams.minFollowers,
            maxFollowers: searchParams.maxFollowers,
            niches: searchParams.niches
          }
        },
        recommendations: generateRecommendations(limitedResults, searchParams),
        searchStrategy: searchSources.length > 1 ? 
          'hybrid_search' : 
          searchSources.includes('Base de datos verificada') ? 'vetted_only' : 'realtime_only'
      }
    });
    
  } catch (error) {
    console.error('❌ Enhanced search error:', error);
    
    // Fallback to basic Apify search
    try {
      console.log('🔄 Falling back to basic Apify search...');
      // Don't try to parse request body again - use basic fallback params
      const fallbackResults = await searchInfluencersWithApify({
        platforms: ['Instagram'],
        niches: ['lifestyle', 'fashion'],
        location: 'Spain',
        minFollowers: 10000,
        maxFollowers: 1000000,
        maxResults: 10
      });
      
      return NextResponse.json({
        success: true,
        data: {
          premiumResults: fallbackResults.map(influencer => ({
            influencer: {
              id: influencer.username,
              name: influencer.fullName || influencer.username,
              handle: influencer.username,
              platform: influencer.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
              followerCount: influencer.followers,
              engagementRate: influencer.engagementRate / 100,
              location: influencer.location || 'Unknown',
              niche: [influencer.category || 'Lifestyle'],
              isActive: true,
              lastUpdated: new Date(),
            },
            matchScore: (influencer.brandCompatibilityScore || 75) / 100,
            matchReasons: ['Búsqueda básica'],
          })),
          totalFound: fallbackResults.length,
          searchSources: ['Búsqueda de respaldo'],
          searchStrategy: 'fallback'
        }
      });
    } catch (fallbackError) {
      console.error('❌ Fallback search also failed:', fallbackError);
      
      return NextResponse.json({
        success: false,
        error: 'Lo siento, no se pudieron encontrar influencers en este momento. Por favor, inténtalo de nuevo.',
        data: {
          premiumResults: [],
          totalFound: 0,
          searchSources: [],
          searchStrategy: 'failed'
        }
      });
    }
  }
}

function generateRecommendations(results: any[], searchParams: any): string[] {
  const recommendations: string[] = [];
  
  if (results.length === 0) {
    recommendations.push('Intenta ampliar los criterios de búsqueda');
    recommendations.push('Considera buscar en plataformas adicionales');
    return recommendations;
  }
  
  if (results.length < 5) {
    recommendations.push('Considera ampliar el rango de seguidores para más opciones');
  }
  
  const platforms = Array.from(new Set(results.map(r => r.influencer.platform)));
  if (platforms.length === 1) {
    recommendations.push('Considera buscar en otras plataformas para mayor diversidad');
  }
  
  const vettedCount = results.filter(r => 
    r.matchReasons && r.matchReasons.some((reason: string) => reason.includes('verificado'))
  ).length;
  
  if (vettedCount > 0) {
    recommendations.push(`${vettedCount} influencers pre-verificados encontrados para mayor seguridad de marca`);
  }
  
  return recommendations;
} 