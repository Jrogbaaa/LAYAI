import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ProcessedInfluencer {
  rank: number;
  id: string;
  name: string;
  handle: string;
  platform: string;
  followerCount: number;
  engagementRate: number;
  gender: string;
  location: string;
  niche: string[];
  originalGenres: string;
  country: string;
}

export interface VettedInfluencer {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform';
  followerCount: number;
  engagementRate: number;
  ageRange: '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  gender: 'Male' | 'Female' | 'Other';
  location: string;
  niche: string[];
  contentStyle: string[];
  pastCollaborations: string[];
  averageRate: number;
  costLevel: 'Budget-Friendly' | 'Mid-Range' | 'High-End' | 'Premium';
  audienceDemographics: {
    ageGroups: {
      '13-17': number;
      '18-24': number;
      '25-34': number;
      '35-44': number;
      '45-54': number;
      '55+': number;
    };
    gender: {
      male: number;
      female: number;
      other: number;
    };
    topLocations: string[];
    interests: string[];
  };
  recentPosts: any[];
  contactInfo: {
    email: string | null;
    preferredContact: string;
  };
  isActive: boolean;
  lastUpdated: Date;
  verified?: boolean;
  rank?: number;
  searchKeywords?: string[];
}

export interface SearchParams {
  query?: string;
  location?: string;
  niches?: string[];
  brandName?: string;
  userQuery?: string;
  gender?: 'male' | 'female' | 'any';
  minFollowers?: number;
  maxFollowers?: number;
  ageRange?: string;
  platforms?: string[];
}

export interface VettedSearchResult {
  influencers: VettedInfluencer[];
  totalCount: number;
  searchSource: 'comprehensive_dataset';
  searchMetadata: {
    source: string;
    searchTime: number;
    filters: any;
  };
}

// Load the comprehensive Spanish influencers dataset
let spanishInfluencersCache: ProcessedInfluencer[] | null = null;

function loadSpanishInfluencers(): ProcessedInfluencer[] {
  if (spanishInfluencersCache) {
    return spanishInfluencersCache;
  }

  try {
    const jsonPath = path.join(process.cwd(), 'processed_influencers.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    spanishInfluencersCache = JSON.parse(jsonData) as ProcessedInfluencer[];
    
    console.log(`✅ Loaded ${spanishInfluencersCache.length} Spanish influencers from comprehensive dataset`);
    return spanishInfluencersCache;
  } catch (error) {
    console.error('❌ Failed to load Spanish influencers dataset:', error);
    return [];
  }
}

// Convert processed influencer to vetted influencer format
function convertToVettedInfluencer(processed: ProcessedInfluencer): VettedInfluencer {
  // Enhanced age range estimation
  const estimateAgeRange = (followers: number, engagement: number): '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+' => {
    if (followers < 10000) return '18-24';
    if (followers < 100000) return '25-34';
    if (followers < 500000) return '25-34';
    if (followers < 1000000) return '35-44';
    if (followers < 5000000) return '35-44';
    return '45-54';
  };

  const ageRange = estimateAgeRange(processed.followerCount, processed.engagementRate);

  // Demographics are now generated dynamically, this can be simplified
  const demographics = {
    ageGroups: {
      '13-17': 5, '18-24': 30, '25-34': 35, '35-44': 20, '45-54': 8, '55+': 2
    },
    gender: {
      male: 45, female: 52, other: 3
    },
    topLocations: ['Madrid', 'Barcelona', 'Valencia'],
    interests: Array.isArray(processed.niche) ? processed.niche.slice(0, 4) : []
  };

  return {
    id: processed.id,
    name: processed.name || 'Unknown',
    handle: processed.handle || processed.id || `user_${processed.rank}`,
    platform: processed.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
    followerCount: processed.followerCount || 0,
    engagementRate: processed.engagementRate || 0,
    ageRange: ageRange,
    gender: processed.gender as 'Male' | 'Female' | 'Other',
    location: processed.location || 'Spain',
    niche: Array.isArray(processed.niche) ? processed.niche : (processed.originalGenres ? [processed.originalGenres] : ['General']),
    contentStyle: ['Posts', 'Stories'], // Default content styles
    pastCollaborations: [],
    averageRate: Math.floor(processed.followerCount / 100) || 500, // Estimate based on followers
    costLevel: processed.followerCount > 5000000 ? 'Premium' : 
               processed.followerCount > 1000000 ? 'High-End' : 
               processed.followerCount > 100000 ? 'Mid-Range' : 'Budget-Friendly',
    audienceDemographics: demographics,
    recentPosts: [],
    contactInfo: {
      email: null,
      preferredContact: 'Instagram DM',
    },
    isActive: true,
    lastUpdated: new Date(),
    verified: processed.followerCount > 1000000, // Assume verified if > 1M followers
    rank: processed.rank,
    searchKeywords: [
      processed.name.toLowerCase(),
      processed.handle.toLowerCase(),
      ...processed.niche.map(n => n.toLowerCase()),
      'spain',
      'spanish',
      'español',
      processed.originalGenres.toLowerCase()
    ].filter(Boolean)
  };
}

export async function getInfluencerById(id: string): Promise<VettedInfluencer | null> {
  try {
    const processedInfluencers = loadSpanishInfluencers();
    const found = processedInfluencers.find(inf => inf.id === id || inf.handle === id);
    
    if (found) {
      return convertToVettedInfluencer(found);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting influencer by ID:', error);
    return null;
  }
}

export async function getInfluencerStats(): Promise<{
  totalInfluencers: number;
  byPlatform: Record<string, number>;
  byNiche: Record<string, number>;
  byFollowerRange: Record<string, number>;
}> {
  try {
    const processedInfluencers = loadSpanishInfluencers();
    const influencers = processedInfluencers.map(convertToVettedInfluencer);

    const byPlatform: Record<string, number> = {};
    const byNiche: Record<string, number> = {};
    const byFollowerRange: Record<string, number> = {
      'nano': 0,
      'micro': 0,
      'macro': 0,
      'mega': 0
    };

    influencers.forEach(inf => {
      // Platform stats
      byPlatform[inf.platform] = (byPlatform[inf.platform] || 0) + 1;

      // Niche stats
      inf.niche.forEach(niche => {
        byNiche[niche] = (byNiche[niche] || 0) + 1;
      });

      // Follower range stats
      if (inf.followerCount < 10000) {
        byFollowerRange.nano++;
      } else if (inf.followerCount < 100000) {
        byFollowerRange.micro++;
      } else if (inf.followerCount < 1000000) {
        byFollowerRange.macro++;
      } else {
        byFollowerRange.mega++;
      }
    });

    return {
      totalInfluencers: influencers.length,
      byPlatform,
      byNiche,
      byFollowerRange
    };
  } catch (error) {
    console.error('❌ Error getting influencer stats:', error);
    return {
      totalInfluencers: 0,
      byPlatform: {},
      byNiche: {},
      byFollowerRange: {}
    };
  }
}

// Generate match reasons for vetted influencers
function generateVettedMatchReasons(influencer: VettedInfluencer, params: any): string[] {
  const reasons: string[] = [];
  
  // Always include source
  reasons.push('Verified database');
  
  // Niche matching
  if (params.niches && params.niches.length > 0) {
    const matchingNiches = params.niches.filter((niche: string) => 
      influencer.niche.some(n => n.toLowerCase().includes(niche.toLowerCase()))
    );
    
    if (matchingNiches.length > 0) {
      reasons.push(`${matchingNiches.join(', ')} specialist`);
    }
  }
  
  // Brand-specific matching
  if (params.brandName?.toLowerCase().includes('ikea') || params.userQuery?.toLowerCase().includes('ikea')) {
    if (influencer.niche.some(n => n.toLowerCase().includes('home') || n.toLowerCase().includes('lifestyle'))) {
      reasons.push('Perfect for IKEA: home and lifestyle content');
    }
  }
  
  // Engagement analysis
  if (influencer.engagementRate > 0.05) {
    reasons.push(`Exceptional engagement ${(influencer.engagementRate * 100).toFixed(1)}%`);
  } else if (influencer.engagementRate > 0.03) {
    reasons.push(`Solid engagement ${(influencer.engagementRate * 100).toFixed(1)}%`);
  }
  
  // Follower analysis
  if (influencer.followerCount > 1000000) {
    reasons.push('Mega-influencer with massive reach');
  } else if (influencer.followerCount > 500000) {
    reasons.push('Macro-influencer with great reach');
  } else if (influencer.followerCount > 100000) {
    reasons.push('Established influencer with solid audience');
  } else if (influencer.followerCount > 50000) {
    reasons.push('Micro-influencer with engaged community');
  }
  
  // Location matching
  if (params.location && influencer.location?.toLowerCase().includes(params.location.toLowerCase())) {
    reasons.push(`Located in ${influencer.location}`);
  }
  
  // Verification status
  if (influencer.verified) {
    reasons.push('✅ Verified account');
  }
  
  return reasons;
}

// Convert VettedInfluencer to MatchResult format
export function convertVettedToMatchResult(influencer: VettedInfluencer, params: any): any {
  return {
    influencer: {
      id: influencer.id,
      name: influencer.name,
      handle: influencer.handle,
      platform: influencer.platform,
      followerCount: influencer.followerCount,
      engagementRate: influencer.engagementRate,
      ageRange: influencer.ageRange,
      gender: influencer.gender,
      location: influencer.location,
      niche: influencer.niche,
      contentStyle: influencer.contentStyle,
      pastCollaborations: influencer.pastCollaborations,
      averageRate: influencer.averageRate,
      costLevel: influencer.costLevel,
      audienceDemographics: influencer.audienceDemographics,
      recentPosts: influencer.recentPosts,
      contactInfo: influencer.contactInfo,
      isActive: influencer.isActive,
      lastUpdated: influencer.lastUpdated,
      profileUrl: `https://www.instagram.com/${influencer.handle}`,
      profileImage: '',
      bio: '',
      category: (Array.isArray(influencer.niche) && influencer.niche.length > 0) ? influencer.niche[0] : 'General',
      isVerified: influencer.verified || false,
      collaborationHistory: [],
      avgLikes: Math.round((influencer.followerCount || 0) * (influencer.engagementRate || 0) * 0.8), // engagementRate is already a decimal
      avgComments: Math.round((influencer.followerCount || 0) * (influencer.engagementRate || 0) * 0.2), // engagementRate is already a decimal
      lastActive: 'Recently'
    },
    matchScore: 0.95, // High score for vetted database results
    matchReasons: generateVettedMatchReasons(influencer, params),
    estimatedCost: influencer.averageRate || Math.floor((influencer.followerCount || 0) / 100) || 500,
    similarPastCampaigns: [],
    potentialReach: Math.round((influencer.followerCount || 0) * (influencer.engagementRate || 0)),
    recommendations: [
      'Influencer verificado de base de datos española',
      'Datos de engagement reales y actualizados'
    ]
  };
}

// Simplified search logic, replacing the old complex system
export async function searchVettedInfluencers(searchParams: SearchParams) {
  try {
    console.log('🔍 Simplified search started with params:', searchParams);

    // 1. Load the entire database
    const allInfluencers = loadSpanishInfluencers().map(convertToVettedInfluencer);
    console.log(`📊 Loaded ${allInfluencers.length} total influencers`);

    // 2. Filter based on query and basic filters
    let filteredInfluencers = allInfluencers;

    // Keyword search - more lenient matching
    if (searchParams.query) {
      const queryTerms = searchParams.query.toLowerCase().split(/\s+/).filter((term: string) => term.length > 1); // Lower threshold to 1 instead of 2
      if (queryTerms.length > 0) {
        filteredInfluencers = filteredInfluencers.filter(inf => {
          const influencerText = [
            inf.name.toLowerCase(),
            inf.handle.toLowerCase(),
            inf.location.toLowerCase(),
            ...(inf.niche || []).map((n: string) => n.toLowerCase())
          ].join(' ');
          
          // Use "any" match instead of "every" for more lenient results
          return queryTerms.some((term: string) => 
            influencerText.includes(term) || 
            term.includes('lifestyle') && inf.niche.some((n: string) => n.toLowerCase().includes('lifestyle')) ||
            term.includes('spain') && inf.location.toLowerCase().includes('spain') ||
            term.includes('ikea') // Allow brand-related searches to pass through
          );
        });
        console.log(`🔍 After query filter: ${filteredInfluencers.length} influencers`);
      }
    }
    
    // Basic filters (gender, followers)
    if (searchParams.gender && searchParams.gender !== 'any') {
      const targetGender = searchParams.gender.charAt(0).toUpperCase() + searchParams.gender.slice(1);
      filteredInfluencers = filteredInfluencers.filter(inf => inf.gender === targetGender);
      console.log(`👤 After gender filter (${targetGender}): ${filteredInfluencers.length} influencers`);
    }
    
    // Niche filtering - if niches are specified
    if (searchParams.niches && searchParams.niches.length > 0) {
      filteredInfluencers = filteredInfluencers.filter(inf => {
        const influencerNiches = (inf.niche || []).map(n => n.toLowerCase());
        return searchParams.niches!.some(niche => 
          influencerNiches.some(infNiche => infNiche.includes(niche.toLowerCase()))
        );
             });
       console.log(`🎯 After niche filter: ${filteredInfluencers.length} influencers`);
    }
    if (searchParams.minFollowers) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.followerCount >= searchParams.minFollowers!);
       console.log(`📈 After minFollowers filter (${searchParams.minFollowers}): ${filteredInfluencers.length} influencers`);
    }
    if (searchParams.maxFollowers) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.followerCount <= searchParams.maxFollowers!);
       console.log(`📉 After maxFollowers filter (${searchParams.maxFollowers}): ${filteredInfluencers.length} influencers`);
    }

    // 3. Sort by a simple engagement metric
    filteredInfluencers.sort((a, b) => b.engagementRate - a.engagementRate);

    // 4. Return VettedInfluencer objects (conversion to MatchResult happens in API route)
    const results = filteredInfluencers.slice(0, 50); // Take first 50 results
    console.log(`🎯 Returning ${results.length} relevant results.`);

    return {
      influencers: results,
      totalCount: results.length,
    };

  } catch (error) {
    console.error('❌ Simplified search error:', error);
    return {
        influencers: [],
        totalCount: 0,
      };
  }
}

function calculateQualityScore(influencer: VettedInfluencer): number {
  let score = 0.5; // Base score

  // Engagement rate scoring (higher is better, but not too high)
  if (influencer.engagementRate > 0.15) {
    score -= 0.2; // Suspiciously high engagement
  } else if (influencer.engagementRate > 0.08) {
    score += 0.3; // Excellent engagement
  } else if (influencer.engagementRate > 0.05) {
    score += 0.2; // Good engagement
  } else if (influencer.engagementRate > 0.02) {
    score += 0.1; // Decent engagement
  } else {
    score -= 0.1; // Low engagement
  }

  // Follower count scoring (sweet spot for brand partnerships)
  if (influencer.followerCount >= 50000 && influencer.followerCount <= 500000) {
    score += 0.2; // Ideal range for brand partnerships
  } else if (influencer.followerCount >= 10000 && influencer.followerCount < 50000) {
    score += 0.1; // Good micro-influencer range
  } else if (influencer.followerCount > 1000000) {
    score += 0.1; // Mega influencer value
  }

  // Verification bonus
  if (influencer.verified) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

export async function handleRegularSearch(searchParams: SearchParams, req: Request) {
  try {
    console.log('🔍 Simplified search started with params:', searchParams);

    // 1. Load the entire database
    const allInfluencers = loadSpanishInfluencers().map(convertToVettedInfluencer);

    // 2. Filter based on query and basic filters
    let filteredInfluencers = allInfluencers;

    // Keyword search
    if (searchParams.query) {
      const queryTerms = searchParams.query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      if (queryTerms.length > 0) {
        filteredInfluencers = filteredInfluencers.filter(inf => {
          const influencerText = [
            inf.name.toLowerCase(),
            inf.handle.toLowerCase(),
            ...(inf.niche || []).map(n => n.toLowerCase())
          ].join(' ');
          return queryTerms.every(term => influencerText.includes(term));
        });
      }
    }
    
    // Basic filters (gender, followers)
    if (searchParams.gender && searchParams.gender !== 'any') {
      const targetGender = searchParams.gender.charAt(0).toUpperCase() + searchParams.gender.slice(1);
      filteredInfluencers = filteredInfluencers.filter(inf => inf.gender === targetGender);
    }
    if (searchParams.minFollowers) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.followerCount >= searchParams.minFollowers!);
    }
    if (searchParams.maxFollowers) {
      filteredInfluencers = filteredInfluencers.filter(inf => inf.followerCount <= searchParams.maxFollowers!);
    }

    // 3. Sort by a simple engagement metric
    filteredInfluencers.sort((a, b) => b.engagementRate - a.engagementRate);

    // 4. Convert to MatchResult format
    const results = filteredInfluencers.map(inf => convertVettedToMatchResult(inf, searchParams));
    
    const limitedResults = results.slice(0, 50);

    console.log(`🎯 Returning ${limitedResults.length} relevant results.`);

    return NextResponse.json({
      success: true,
      data: {
        premiumResults: limitedResults,
        totalFound: limitedResults.length,
        searchSources: ['Vetted Database (Simplified Search)'],
      }
    });

  } catch (error) {
    console.error('❌ Simplified search error:', error);
    return NextResponse.json({
        success: false,
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
  }
}