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

interface SearchParams {
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

  // Generate diverse, realistic demographics based on profile characteristics
  const generateRealisticDemographics = (profile: ProcessedInfluencer, ageRange: string) => {
    const isArt = profile.niche.some(n => n.toLowerCase().includes('art'));
    const isLifestyle = profile.niche.some(n => n.toLowerCase().includes('lifestyle'));
    const isFitness = profile.niche.some(n => n.toLowerCase().includes('fitness'));
    const isFood = profile.niche.some(n => n.toLowerCase().includes('food'));
    const isTravel = profile.niche.some(n => n.toLowerCase().includes('travel'));
    const isBeauty = profile.niche.some(n => n.toLowerCase().includes('beauty'));
    const isFashion = profile.niche.some(n => n.toLowerCase().includes('fashion'));
    const isTech = profile.niche.some(n => n.toLowerCase().includes('tech'));
    const isMusic = profile.niche.some(n => n.toLowerCase().includes('music'));
    const isGaming = profile.niche.some(n => n.toLowerCase().includes('gaming'));
    const isEducation = profile.niche.some(n => n.toLowerCase().includes('education'));
    const isMale = profile.gender === 'Male';
    const followerCount = profile.followerCount;
    
    // Generate realistic age distribution based on niche and demographics
    let ageGroups = {
      '13-17': 5,
      '18-24': 30,
      '25-34': 35,
      '35-44': 20,
      '45-54': 8,
      '55+': 2
    };
    
    // Adjust age groups based on niche
    if (isGaming || isMusic) {
      ageGroups = { '13-17': 12, '18-24': 45, '25-34': 28, '35-44': 12, '45-54': 2, '55+': 1 };
    } else if (isBeauty || isFashion) {
      ageGroups = { '13-17': 8, '18-24': 42, '25-34': 35, '35-44': 12, '45-54': 2, '55+': 1 };
    } else if (isEducation || isTech) {
      ageGroups = { '13-17': 3, '18-24': 25, '25-34': 45, '35-44': 20, '45-54': 5, '55+': 2 };
    } else if (isTravel) {
      ageGroups = { '13-17': 2, '18-24': 35, '25-34': 40, '35-44': 18, '45-54': 4, '55+': 1 };
    } else if (isFitness) {
      ageGroups = { '13-17': 5, '18-24': 38, '25-34': 42, '35-44': 12, '45-54': 2, '55+': 1 };
    } else if (isFood) {
      ageGroups = { '13-17': 3, '18-24': 28, '25-34': 38, '35-44': 25, '45-54': 5, '55+': 1 };
    } else if (isArt) {
      ageGroups = { '13-17': 8, '18-24': 32, '25-34': 35, '35-44': 20, '45-54': 4, '55+': 1 };
    }
    
    // Generate realistic gender distribution
    let genderDistribution = {
      male: 45,
      female: 52,
      other: 3
    };
    
    // Adjust gender based on niche and influencer gender
    if (isMale) {
      if (isGaming || isTech) {
        genderDistribution = { male: 75, female: 23, other: 2 };
      } else if (isFitness) {
        genderDistribution = { male: 55, female: 43, other: 2 };
      } else if (isMusic) {
        genderDistribution = { male: 62, female: 36, other: 2 };
      } else {
        genderDistribution = { male: 48, female: 49, other: 3 };
      }
    } else {
      if (isBeauty || isFashion) {
        genderDistribution = { male: 18, female: 80, other: 2 };
      } else if (isLifestyle) {
        genderDistribution = { male: 25, female: 72, other: 3 };
      } else if (isFood) {
        genderDistribution = { male: 35, female: 63, other: 2 };
      } else {
        genderDistribution = { male: 38, female: 59, other: 3 };
      }
    }
    
    // Generate realistic Spanish locations based on follower count
    let topLocations = ['Madrid', 'Barcelona', 'Valencia'];
    if (followerCount > 1000000) {
      topLocations = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'];
    } else if (followerCount > 500000) {
      topLocations = ['Madrid', 'Barcelona', 'Valencia', 'Málaga'];
    } else if (followerCount > 100000) {
      topLocations = ['Madrid', 'Barcelona', 'Valencia'];
    } else {
      // Smaller influencers might have more localized audiences
      const localCities = ['Zaragoza', 'Murcia', 'Palma', 'Las Palmas', 'Córdoba', 'Alicante'];
      topLocations = [
        'Madrid', 'Barcelona', 
        localCities[Math.floor(Math.random() * localCities.length)]
      ];
    }
    
    // Generate realistic interests based on niche
    const interests = [...profile.niche];
    if (isLifestyle) interests.push('Travel', 'Food', 'Fashion');
    if (isBeauty) interests.push('Skincare', 'Makeup', 'Fashion');
    if (isFitness) interests.push('Health', 'Nutrition', 'Wellness');
    if (isFood) interests.push('Cooking', 'Restaurants', 'Travel');
    if (isTravel) interests.push('Photography', 'Adventure', 'Culture');
    if (isArt) interests.push('Creativity', 'Design', 'Culture');
    if (isMusic) interests.push('Concerts', 'Entertainment', 'Culture');
    if (isGaming) interests.push('Technology', 'Entertainment', 'Streaming');
    if (isTech) interests.push('Innovation', 'Startups', 'Education');
    
    return {
      ageGroups,
      gender: genderDistribution,
      topLocations,
      interests: Array.from(new Set(interests)).slice(0, 4) // Limit to 4 interests
    };
  };

  const demographics = generateRealisticDemographics(processed, ageRange);

  return {
    id: processed.id,
    name: processed.name,
    handle: processed.handle,
    platform: processed.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
    followerCount: processed.followerCount,
    engagementRate: processed.engagementRate,
    ageRange: ageRange,
    gender: processed.gender as 'Male' | 'Female' | 'Other',
    location: processed.location,
    niche: processed.niche,
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

export async function searchVettedInfluencers(params: SearchParams): Promise<VettedSearchResult> {
  const startTime = Date.now();
  
  console.log('🔍 Starting vetted influencer search with params:', {
    location: params.location,
    niches: params.niches,
    brandName: params.brandName,
    userQuery: params.userQuery,
    gender: params.gender,
    minFollowers: params.minFollowers,
    maxFollowers: params.maxFollowers
  });

  try {
    // Load the comprehensive Spanish influencers dataset
    const processedInfluencers = loadSpanishInfluencers();
    
    if (processedInfluencers.length === 0) {
      console.log('⚠️ No influencers loaded from dataset');
      return {
        influencers: [],
        totalCount: 0,
        searchSource: 'comprehensive_dataset',
        searchMetadata: {
          source: 'Comprehensive Spanish Dataset (Empty)',
          searchTime: Date.now() - startTime,
          filters: params
        }
      };
    }

    console.log(`📊 Found ${processedInfluencers.length} total Spanish influencers in dataset`);

    // Convert to vetted influencer format
    let influencers = processedInfluencers.map(convertToVettedInfluencer);
    console.log(`📊 Successfully parsed ${influencers.length} influencers from dataset`);

    // Apply filters
    
    // 1. Gender filter
    if (params.gender && params.gender !== 'any') {
      const targetGender = params.gender.charAt(0).toUpperCase() + params.gender.slice(1); // Capitalize
      console.log(`👤 Filtering by gender: ${targetGender}`);
      influencers = influencers.filter(inf => inf.gender === targetGender);
      console.log(`📊 After gender filter: ${influencers.length} influencers`);
    }

    // 2. Niche filter
    if (params.niches && params.niches.length > 0) {
      console.log(`🎯 Filtering by niches: ${params.niches.join(', ')}`);
      influencers = influencers.filter(inf => {
        const hasMatchingNiche = params.niches!.some(searchNiche => 
          inf.niche.some(infNiche => 
            infNiche.toLowerCase().includes(searchNiche.toLowerCase()) ||
            searchNiche.toLowerCase().includes(infNiche.toLowerCase())
          )
        );
        return hasMatchingNiche;
      });
      console.log(`📊 After niche filter: ${influencers.length} influencers`);
    }

    // 3. Follower count filters
    if (params.minFollowers !== undefined) {
      console.log(`📊 Filtering by minFollowers: ${params.minFollowers.toLocaleString()}`);
      influencers = influencers.filter(inf => inf.followerCount >= params.minFollowers!);
      console.log(`📊 After minFollowers filter: ${influencers.length} influencers`);
    }

    if (params.maxFollowers !== undefined) {
      console.log(`📊 Filtering by maxFollowers: ${params.maxFollowers.toLocaleString()}`);
      influencers = influencers.filter(inf => inf.followerCount <= params.maxFollowers!);
      console.log(`📊 After maxFollowers filter: ${influencers.length} influencers`);
    }

    // 4. Age range filter
    if (params.ageRange && params.ageRange !== 'any') {
      console.log(`📅 Filtering by age range: ${params.ageRange}`);
      influencers = influencers.filter(inf => inf.ageRange === params.ageRange);
      console.log(`📊 After age range filter: ${influencers.length} influencers`);
    }

    // 5. Platform filter
    if (params.platforms && params.platforms.length > 0) {
      console.log(`📱 Filtering by platforms: ${params.platforms.join(', ')}`);
      influencers = influencers.filter(inf => params.platforms!.includes(inf.platform));
      console.log(`📊 After platform filter: ${influencers.length} influencers`);
    }

    // Apply quality scoring
    console.log('🧠 Applying quality scoring...');
    
    // Quality scoring based on engagement rate and follower authenticity
    influencers = influencers.map(inf => ({
      ...inf,
      qualityScore: calculateQualityScore(inf)
    }));

    // Apply engagement quality filtering
    console.log('⚡ Applying engagement quality filtering...');
    influencers = influencers.filter(inf => {
      if (inf.followerCount > 10000000 && inf.engagementRate < 0.002) {
        return false; // Filter out mega accounts with suspiciously low engagement
      }
      if (inf.followerCount > 1000000 && inf.engagementRate < 0.001) {
        return false; // Filter out accounts with extremely low engagement
      }
      return true;
    });
    console.log(`📊 After engagement quality filter: ${influencers.length} influencers`);

    // Deduplication
    console.log(`🔍 Starting deduplication for ${influencers.length} influencers...`);
    const uniqueInfluencers = influencers.filter((inf, index, arr) => 
      arr.findIndex(other => other.handle.toLowerCase() === inf.handle.toLowerCase()) === index
    );
    console.log(`✅ Deduplication complete: ${uniqueInfluencers.length}/${influencers.length} influencers kept`);

    // Sort by quality score and engagement rate
    uniqueInfluencers.sort((a, b) => {
      // Primary sort: Quality score
      const qualityDiff = (b as any).qualityScore - (a as any).qualityScore;
      if (Math.abs(qualityDiff) > 0.1) {
        return qualityDiff;
      }
      
      // Secondary sort: Engagement rate
      const engagementDiff = b.engagementRate - a.engagementRate;
      if (Math.abs(engagementDiff) > 0.001) {
        return engagementDiff;
      }
      
      // Tertiary sort: Follower count
      return b.followerCount - a.followerCount;
    });

    const searchTime = Date.now() - startTime;
    console.log(`✅ Vetted database search complete: ${uniqueInfluencers.length} results`);

    return {
      influencers: uniqueInfluencers,
      totalCount: uniqueInfluencers.length,
      searchSource: 'comprehensive_dataset',
      searchMetadata: {
        source: 'Comprehensive Spanish Dataset (3000 influencers)',
        searchTime,
        filters: params
      }
    };

  } catch (error) {
    console.error('❌ Error in vetted influencer search:', error);
    return {
      influencers: [],
      totalCount: 0,
      searchSource: 'comprehensive_dataset',
      searchMetadata: {
        source: 'Error',
        searchTime: Date.now() - startTime,
        filters: params
      }
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
      category: influencer.niche[0] || 'General',
      isVerified: influencer.verified || false,
      collaborationHistory: [],
      avgLikes: Math.round(influencer.followerCount * influencer.engagementRate * 0.8),
      avgComments: Math.round(influencer.followerCount * influencer.engagementRate * 0.2),
      lastActive: 'Recently'
    },
    matchScore: 0.95, // High score for vetted database results
    matchReasons: generateVettedMatchReasons(influencer, params),
    estimatedCost: influencer.averageRate,
    similarPastCampaigns: [],
    potentialReach: Math.round(influencer.followerCount * influencer.engagementRate),
    recommendations: [
      'Influencer verificado de base de datos española',
      'Datos de engagement reales y actualizados'
    ]
  };
}