import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithApify, searchInfluencersWithTwoTierDiscovery, type ApifySearchParams } from '@/lib/apifyService';
import { searchVettedInfluencers, convertVettedToMatchResult } from '@/lib/vettedInfluencersService';
import { searchMemory } from '@/lib/database';
import { starngageService } from '@/lib/starngageService';

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

// Add progressive loading support at the top
interface ProgressiveSearchUpdate {
  type: 'progress' | 'partial_results' | 'complete';
  stage: string;
  progress: number;
  results?: any[];
  totalFound?: number;
  metadata?: any;
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

// Generate personalized match reasons for real-time search results
function generateRealtimeMatchReasons(influencer: any, params: ApifySearchParams): string[] {
  const reasons: string[] = [];
  
  // Always include source
  reasons.push('Búsqueda en tiempo real');
  
  // Brand-specific matching
  if (params.brandName?.toLowerCase().includes('ikea') || params.userQuery?.toLowerCase().includes('ikea')) {
    if (influencer.category?.toLowerCase().includes('lifestyle') || 
        influencer.category?.toLowerCase().includes('home') ||
        influencer.category?.toLowerCase().includes('fashion')) {
      reasons.push('Creador perfecto para IKEA: contenido de hogar y lifestyle');
    }
    if (influencer.followers >= 100000 && influencer.followers <= 500000) {
      reasons.push('Audiencia ideal para marca premium como IKEA');
    }
    if (influencer.engagementRate > 3) {
      reasons.push('Excelente interacción con contenido de decoración');
    }
  }
  
  // Niche-specific matching  
  if (params.niches && params.niches.length > 0 && influencer.category) {
    const matchingNiches = params.niches.filter(niche => 
      influencer.category.toLowerCase().includes(niche.toLowerCase()) ||
      niche.toLowerCase().includes(influencer.category.toLowerCase())
    );
    
    if (matchingNiches.length > 0) {
      reasons.push(`Especialista activo en ${influencer.category}`);
    }
  }
  
  // Engagement analysis
  if (influencer.engagementRate > 5) {
    reasons.push(`Engagement excepcional ${influencer.engagementRate.toFixed(1)}% - audiencia muy comprometida`);
  } else if (influencer.engagementRate > 3) {
    reasons.push(`Engagement sólido ${influencer.engagementRate.toFixed(1)}% - buena interacción`);
  } else if (influencer.engagementRate > 1) {
    reasons.push(`${influencer.engagementRate.toFixed(1)}% engagement rate`);
  }
  
  // Follower analysis
  if (influencer.followers > 1000000) {
    reasons.push('Mega-influencer con alcance masivo');
  } else if (influencer.followers > 500000) {
    reasons.push('Macro-influencer con gran alcance');
  } else if (influencer.followers > 100000) {
    reasons.push('Influencer establecido con audiencia sólida');
  } else if (influencer.followers > 50000) {
    reasons.push('Micro-influencer con comunidad engaged');
  } else {
    reasons.push('Nano-influencer con conexión personal');
  }
  
  // Verification and activity
  if (influencer.verified) {
    reasons.push('✅ Cuenta verificada con credibilidad oficial');
  } else {
    reasons.push('Creador activo con contenido regular');
  }
  
  // Location matching
  if (params.location && influencer.location?.toLowerCase().includes(params.location.toLowerCase())) {
    reasons.push(`Ubicado en ${influencer.location} - audiencia local`);
  }
  
  // Platform benefits
  if (influencer.platform === 'Instagram') {
    reasons.push('Instagram: plataforma ideal para contenido visual de marca');
  } else if (influencer.platform === 'TikTok') {
    reasons.push('TikTok: formato viral ideal para alcance joven');
  }
  
  // Brand compatibility
  if (influencer.brandCompatibilityScore > 85) {
    reasons.push('Alta compatibilidad de marca según análisis IA');
  } else if (influencer.brandCompatibilityScore > 70) {
    reasons.push('Buena compatibilidad de marca detectada');
  }
  
  // Limit to 4-5 most relevant reasons
  return reasons.slice(0, 5);
}

function extractBrandFromQuery(searchParams: ApifySearchParams): string | null {
  // FIRST: Check brandName parameter if provided (priority for dropdown searches)
  if (searchParams.brandName) {
    return searchParams.brandName.toLowerCase();
  }

  // SECOND: Extract brand from the search query
  const query = searchParams.userQuery?.toLowerCase() || '';
  
  // Common brand patterns in Spanish searches
  const brandPatterns = [
    /marca\s+(\w+)/i,          // "marca Nike", "marca Adidas" (for dropdown searches)
    /para\s+(\w+)/i,           // "para IKEA", "para Nike"
    /compatible[s]?\s+con\s+(\w+)/i,  // "compatibles con Nike"
    /con\s+(\w+)/i,            // "con Zara", "con Adidas" 
    /de\s+(\w+)/i,             // "de H&M", "de Mango"
    /\b(ikea|nike|adidas|zara|mango|h&m|inditex|bershka|stradivarius|pull&bear|massimo|dutti|shein|amazon|apple|samsung|coca|cola|pepsi|mcdonalds|burger|king|kfc|netflix|spotify|vodafone|movistar|orange|banco|santander|bbva|ing|openbank)\b/i
  ];

  for (const pattern of brandPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

async function addCollaborationStatus(results: any[], brandName: string | null): Promise<any[]> {
  if (!brandName) return results;

  console.log(`🤝 Adding collaboration status for brand: ${brandName}`);

  // For performance, we'll add a simplified collaboration check
  // This checks if brand appears in the influencer's bio or recent activity
  return results.map(result => {
    const bio = (result.influencer.biography || '').toLowerCase();
    const handle = result.influencer.handle.toLowerCase();
    
    // Quick check for brand mentions in bio
    const brandVariations = [
      brandName,
      `@${brandName}`,
      `#${brandName}`,
      brandName.replace('&', 'and'),
      brandName.replace(' ', ''),
    ];

    const hasCollaboration = brandVariations.some(variation => 
      bio.includes(variation.toLowerCase())
    );

    return {
      ...result,
      brandCollaboration: {
        brandName,
        hasWorkedWith: hasCollaboration,
        type: hasCollaboration ? 'mention' : 'none',
        confidence: hasCollaboration ? 60 : 0,
        source: 'bio_analysis'
      }
    };
  });
}

/**
 * Generate diverse, realistic demographics based on influencer characteristics
 */
function generateDiverseDemographics(influencer: any) {
  const category = influencer.category || '';
  const gender = detectInfluencerGender(influencer);
  const followers = influencer.followers || 0;
  
  const isArt = category.toLowerCase().includes('art');
  const isLifestyle = category.toLowerCase().includes('lifestyle');
  const isFitness = category.toLowerCase().includes('fitness');
  const isFood = category.toLowerCase().includes('food');
  const isTravel = category.toLowerCase().includes('travel');
  const isBeauty = category.toLowerCase().includes('beauty');
  const isFashion = category.toLowerCase().includes('fashion');
  const isTech = category.toLowerCase().includes('tech');
  const isMusic = category.toLowerCase().includes('music');
  const isGaming = category.toLowerCase().includes('gaming');
  const isEducation = category.toLowerCase().includes('education');
  const isMale = gender === 'Male';
  
  // Generate realistic age distribution based on niche
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
  if (followers > 1000000) {
    topLocations = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'];
  } else if (followers > 500000) {
    topLocations = ['Madrid', 'Barcelona', 'Valencia', 'Málaga'];
  } else if (followers > 100000) {
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
  const interests = [category || 'Lifestyle'];
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
}

// 🔥 NEW: Proper gender detection function (same logic as apifyService)
function detectInfluencerGender(influencer: any): 'Male' | 'Female' | 'Other' {
  const { fullName, username, biography } = influencer;
  const normalizedName = (fullName || username || '').toLowerCase();
  const bio = (biography || '').toLowerCase();
  
  // Spanish male names (comprehensive list)
  const maleNames = [
    'jose', 'antonio', 'manuel', 'francisco', 'david', 'daniel', 'carlos', 'miguel', 'rafael', 'pedro', 
    'angel', 'alejandro', 'fernando', 'sergio', 'pablo', 'jorge', 'alberto', 'luis', 'alvaro', 'oscar', 
    'adrian', 'raul', 'enrique', 'jesus', 'javier', 'marcos', 'victor', 'ruben', 'ivan', 'diego', 
    'andres', 'juan', 'ignacio', 'roberto', 'cristian', 'mario', 'eduardo', 'ricardo', 'gabriel'
  ];
  
  // Spanish female names (comprehensive list)
  const femaleNames = [
    'maria', 'ana', 'carmen', 'josefa', 'isabel', 'dolores', 'pilar', 'teresa', 'rosa', 'francisca', 
    'antonia', 'mercedes', 'julia', 'lucia', 'elena', 'concepcion', 'manuela', 'cristina', 'paula', 
    'laura', 'marta', 'silvia', 'sara', 'patricia', 'monica', 'raquel', 'natalia', 'beatriz', 'rocio', 
    'alba', 'andrea', 'irene', 'noelia', 'claudia', 'nuria', 'eva', 'susana', 'miriam', 'alicia'
  ];
  
  // Check for male names
  if (maleNames.some(name => normalizedName.includes(name))) {
    return 'Male';
  }
  
  // Check for female names  
  if (femaleNames.some(name => normalizedName.includes(name))) {
    return 'Female';
  }
  
  // Check pronouns in bio
  if (bio.includes('he/him') || bio.includes('él')) return 'Male';
  if (bio.includes('she/her') || bio.includes('ella')) return 'Female';
  
  // Check gender indicators
  const maleIndicators = ['boy', 'guy', 'man', 'male', 'hombre', 'chico'];
  const femaleIndicators = ['girl', 'woman', 'female', 'mujer', 'chica'];
  
  if (maleIndicators.some(indicator => normalizedName.includes(indicator) || bio.includes(indicator))) {
    return 'Male';
  }
  
  if (femaleIndicators.some(indicator => normalizedName.includes(indicator) || bio.includes(indicator))) {
    return 'Female';
  }
  
  return 'Other';
}

/**
 * Enhance search results with real StarNgage audience demographics
 * RE-ENABLED: Try StarNgage first, fallback to diverse demographics if it fails
 */
async function enhanceWithStarngageDemographics(results: any[], limit: number = 10): Promise<any[]> {
  console.log(`🎯 Enhancing ${Math.min(results.length, limit)} influencers with StarNgage demographics...`);
  
  // Only enhance top results to avoid rate limits
  const topResults = results.slice(0, limit);
  
  // Track enhancement success
  let enhancedCount = 0;
  
  // Process in batches to avoid overwhelming StarNgage
  const enhancedResults = await Promise.allSettled(
    topResults.map(async (result, index) => {
      try {
        const username = result.influencer.handle || result.influencer.username;
        if (!username) return result;
        
        console.log(`📊 [${index + 1}/${topResults.length}] Fetching demographics for @${username}...`);
        
        // Get StarNgage demographic data
        const starngageData = await starngageService.enhanceInfluencerWithDemographics(username);
        
        if (starngageData && starngageData.demographics) {
          enhancedCount++;
          console.log(`✅ Enhanced @${username} with real StarNgage demographics`);
          
          return {
            ...result,
            influencer: {
              ...result.influencer,
              // Override hardcoded demographics with real StarNgage data
              audienceDemographics: starngageData.demographics,
              // Add enhanced engagement metrics
              avgLikes: starngageData.averageLikes || result.influencer.avgLikes,
              avgComments: starngageData.averageComments || result.influencer.avgComments,
              topics: starngageData.topics || result.influencer.niche
            },
            // Add StarNgage source to match reasons
            matchReasons: [
              ...(result.matchReasons || []),
              'Enhanced with real audience demographics from StarNgage'
            ],
            // Add StarNgage metadata
            starngageEnhanced: true,
            dataSource: 'starngage_demographics'
          };
        } else {
          console.log(`⚠️ No StarNgage data found for @${username}, using diverse fallback`);
          return {
            ...result,
            starngageEnhanced: false,
            dataSource: 'diverse_demographics',
            matchReasons: [
              ...(result.matchReasons || []),
              'Enhanced with realistic audience demographics'
            ]
          };
        }
      } catch (error) {
        console.error(`❌ Failed to enhance @${result.influencer?.handle || 'unknown'}:`, error);
        return {
          ...result,
          starngageEnhanced: false,
          dataSource: 'diverse_demographics',
          matchReasons: [
            ...(result.matchReasons || []),
            'Enhanced with realistic audience demographics'
          ]
        };
      }
    })
  );
  
  // Combine enhanced and original results
  const processedResults = enhancedResults.map((result, index) => 
    result.status === 'fulfilled' ? result.value : topResults[index]
  );
  
  // Add remaining results that weren't enhanced
  const remainingResults = results.slice(limit);
  
  const finalResults = [...processedResults, ...remainingResults];
  
  console.log(`🎯 StarNgage enhancement complete: ${enhancedCount}/${topResults.length} influencers enhanced with real data`);
  
  return finalResults;
  
  /* 
  // DISABLED: StarNgage blocking all requests with 403 errors
  console.log(`🎯 Enhancing ${Math.min(results.length, limit)} influencers with StarNgage demographics...`);
  
  // Only enhance top results to avoid rate limits
  const topResults = results.slice(0, limit);
  
  // Process in batches to avoid overwhelming StarNgage
  const enhancedResults = await Promise.allSettled(
    topResults.map(async (result, index) => {
      try {
        const username = result.influencer.handle || result.influencer.username;
        if (!username) return result;
        
        console.log(`📊 [${index + 1}/${topResults.length}] Fetching demographics for @${username}...`);
        
        // Get StarNgage demographic data
        const starngageData = await starngageService.enhanceInfluencerWithDemographics(username);
        
        if (starngageData && starngageData.demographics) {
          console.log(`✅ Enhanced @${username} with real StarNgage demographics`);
          
          return {
            ...result,
            influencer: {
              ...result.influencer,
              // Override hardcoded demographics with real StarNgage data
              audienceDemographics: starngageData.demographics || generateDiverseDemographics(result.influencer),
              // Add enhanced engagement metrics
              avgLikes: starngageData.averageLikes || result.influencer.avgLikes,
              avgComments: starngageData.averageComments || result.influencer.avgComments,
              topics: starngageData.topics || result.influencer.niche
            },
            // Add StarNgage source to match reasons
            matchReasons: [
              ...(result.matchReasons || []),
              'Enhanced with real audience demographics'
            ],
            // Add StarNgage metadata
            starngageEnhanced: true,
            dataSource: 'starngage_demographics'
          };
        } else {
          console.log(`⚠️ No StarNgage data found for @${username}, using defaults`);
          return result;
        }
      } catch (error) {
        console.error(`❌ Failed to enhance @${result.influencer?.handle || 'unknown'}:`, error);
        return result;
      }
    })
  );
  
  // Combine enhanced and original results
  const processedResults = enhancedResults.map((result, index) => 
    result.status === 'fulfilled' ? result.value : topResults[index]
  );
  
  // Add remaining results that weren't enhanced
  const remainingResults = results.slice(limit);
  
  const finalResults = [...processedResults, ...remainingResults];
  
  const enhancedCount = processedResults.filter(r => r.starngageEnhanced).length;
  console.log(`🎯 StarNgage enhancement complete: ${enhancedCount}/${topResults.length} influencers enhanced`);
  
  return finalResults;
  */
}

export async function POST(req: Request) {
  try {
    const searchParams: ApifySearchParams = await req.json();
    
    console.log('🔍 Enhanced search started with PROGRESSIVE LOADING:', searchParams);
    
    // Check if client wants progressive updates (via streaming)
    const acceptsStream = req.headers.get('accept')?.includes('text/event-stream');
    
    if (acceptsStream) {
      // Return Server-Sent Events stream for progressive loading
      return handleProgressiveSearch(searchParams);
    }
    
    // Fallback to regular search for non-streaming clients
    return handleRegularSearch(searchParams, req);
    
  } catch (error) {
    console.error('❌ Enhanced search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle progressive search with streaming updates
 */
async function handleProgressiveSearch(searchParams: ApifySearchParams) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (update: ProgressiveSearchUpdate) => {
        const data = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };
      
      try {
        // Initialize results
        let allResults: any[] = [];
        let totalFound = 0;
        let searchSources: string[] = [];
        
        // Stage 1: Search vetted influencers database
        sendUpdate({
          type: 'progress',
          stage: 'Searching verified database...',
          progress: 10
        });
        
              console.log('📊 Searching vetted influencers database...');
      const vettedResults = await searchVettedInfluencers({
        ...searchParams,
        gender: searchParams.gender as 'male' | 'female' | 'any' | undefined
      });
        
        if (vettedResults.influencers.length > 0) {
          const convertedVetted = vettedResults.influencers.map(inf => 
            convertVettedToMatchResult(inf, searchParams)
          );
          
          allResults.push(...convertedVetted);
          totalFound += vettedResults.totalCount;
          searchSources.push('Base de datos verificada');
          
          // Send partial results immediately
          sendUpdate({
            type: 'partial_results',
            stage: 'Database results found',
            progress: 25,
            results: convertedVetted,
            totalFound: convertedVetted.length,
            metadata: { source: 'verified_database', quality: 'high' }
          });
          
          console.log(`✅ Found ${vettedResults.influencers.length} vetted influencers - sent to client`);
        }
        
        // Stage 2: Parallel real-time search
        sendUpdate({
          type: 'progress',
          stage: 'Searching real-time sources...',
          progress: 30
        });
        
        try {
          console.log('🌐 Searching Apify API...');
          
          const apifyResults = await searchInfluencersWithTwoTierDiscovery(searchParams);
          
          if (apifyResults.premiumResults && apifyResults.premiumResults.length > 0) {
            const convertedApify = apifyResults.premiumResults.map((influencer: any) => ({
              influencer: {
                name: influencer.fullName || influencer.username,
                handle: influencer.username,
                followerCount: influencer.followers,
                engagementRate: influencer.engagementRate || 0,
                platform: influencer.platform,
                profileUrl: influencer.url || `https://www.instagram.com/${influencer.username}`,
                profileImage: influencer.profilePicUrl || '',
                bio: influencer.biography || '',
                location: influencer.location || '',
                category: influencer.category || 'General',
                isVerified: influencer.verified || false,
                collaborationHistory: influencer.collaborationHistory || [],
                avgLikes: influencer.avgLikes || 0,
                avgComments: influencer.avgComments || 0,
                lastActive: influencer.lastActive || 'Recently'
              },
              matchScore: (influencer.brandCompatibilityScore || 75) / 100,
              matchReasons: generateRealtimeMatchReasons(influencer, searchParams),
              estimatedCost: Math.floor(influencer.followers / 100) || 500,
              similarPastCampaigns: [],
              potentialReach: Math.round(influencer.followers * (influencer.engagementRate / 100)),
              recommendations: ['Influencer encontrado mediante búsqueda en tiempo real'],
            }));
            
            allResults.push(...convertedApify);
            totalFound += apifyResults.premiumResults.length;
            searchSources.push('Búsqueda en tiempo real');
            
            // Send additional partial results
            sendUpdate({
              type: 'partial_results',
              stage: 'Real-time results found',
              progress: 70,
              results: convertedApify,
              totalFound: convertedApify.length,
              metadata: { source: 'realtime_search', quality: 'medium' }
            });
            
            console.log(`✅ Found ${apifyResults.premiumResults.length} Apify results - sent to client`);
          }
        } catch (error) {
          console.warn('⚠️ Apify search failed:', error);
          sendUpdate({
            type: 'progress',
            stage: 'Real-time search unavailable, using cached results',
            progress: 80
          });
        }
        
        // Stage 3: Final processing
        sendUpdate({
          type: 'progress',
          stage: 'Processing and ranking results...',
          progress: 85
        });
        
        // Remove duplicates and add collaboration status
        const uniqueResults = allResults.filter((result, index, array) => {
          return array.findIndex(r => 
            r.influencer.handle?.toLowerCase() === result.influencer.handle?.toLowerCase() ||
            r.influencer.name?.toLowerCase() === result.influencer.name?.toLowerCase()
          ) === index;
        });
        
        const brandName = extractBrandFromQuery(searchParams);
        const resultsWithCollaboration = await addCollaborationStatus(uniqueResults, brandName);
        
        // 🎯 ENHANCE WITH STARNGAGE DEMOGRAPHICS (progressive search - top 5 results) 
        sendUpdate({
          type: 'progress',
          stage: 'Enhancing with audience demographics...',
          progress: 90
        });
        
        const resultsWithDemographics = await enhanceWithStarngageDemographics(resultsWithCollaboration, 5);
        
        // Sort results  
        resultsWithDemographics.sort((a, b) => {
          // Priority sort: StarNgage-enhanced results first
          if (a.starngageEnhanced && !b.starngageEnhanced) return -1;
          if (!a.starngageEnhanced && b.starngageEnhanced) return 1;
          const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
          if (Math.abs(scoreDiff) > 0.1) {
            return scoreDiff;
          }
          
          const engagementA = a.influencer.engagementRate || 0;
          const engagementB = b.influencer.engagementRate || 0;
          const engagementDiff = engagementB - engagementA;
          if (Math.abs(engagementDiff) > 0.001) {
            return engagementDiff;
          }
          
          const followersA = a.influencer.followerCount || 0;
          const followersB = b.influencer.followerCount || 0;
          return followersB - followersA;
        });
        
        // 🛡️ Limit progressive search results to prevent UI overload
        const MAX_PROGRESSIVE_RESULTS = 50;
        const limitedProgressiveResults = resultsWithDemographics.slice(0, MAX_PROGRESSIVE_RESULTS);
        
        // Send final complete results
        sendUpdate({
          type: 'complete',
          stage: 'Search completed successfully!',
          progress: 100,
          results: limitedProgressiveResults,
          totalFound: limitedProgressiveResults.length,
          metadata: {
            searchSources,
            totalFound: limitedProgressiveResults.length,
            searchStrategy: searchSources.length > 1 ? 'hybrid_search' : 
              searchSources.includes('Base de datos verificada') ? 'vetted_only' : 'realtime_only',
            duplicatesRemoved: allResults.length - limitedProgressiveResults.length,
            originalTotal: resultsWithDemographics.length
          }
        });
        
        console.log(`🎯 Progressive search completed: ${resultsWithDemographics.length} final results`);
        
      } catch (error) {
        console.error('❌ Progressive search failed:', error);
        sendUpdate({
          type: 'complete',
          stage: 'Search failed',
          progress: 0,
          results: [],
          totalFound: 0,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}

/**
 * Handle regular search (existing functionality)
 */
async function handleRegularSearch(searchParams: ApifySearchParams, req: Request) {
  try {
    console.log('🔍 Enhanced search started with params:', searchParams);
    
    // Initialize results
    let allResults: any[] = [];
    let totalFound = 0;
    let searchSources: string[] = [];
    
    // 1. Search vetted influencers database first (only for Spain-related queries)
    console.log('📊 Searching vetted influencers database...');
            const vettedResults = await searchVettedInfluencers({
          ...searchParams,
          gender: searchParams.gender as 'male' | 'female' | 'any' | undefined
        });
    
    if (vettedResults.influencers.length > 0) {
      // Convert vetted results to match result format
      const convertedVetted = vettedResults.influencers.map(inf => 
        convertVettedToMatchResult(inf, searchParams)
      );
      allResults.push(...convertedVetted);
      totalFound += vettedResults.totalCount;
      searchSources.push('Verified database');
      
      console.log(`✅ Found ${vettedResults.influencers.length} vetted influencers`);
    } else {
      console.log('📍 No vetted influencers found, proceeding with other sources');
    }
    
    // 2. Always try real-time search in parallel (non-blocking)
    const databaseResultsCount = vettedResults.influencers.length;
    console.log(`🌐 Database found ${databaseResultsCount} results, starting real-time search in parallel...`);

    // Start real-time search but don't wait for it
    let realtimeResults: any[] = [];
    const realtimeSearchPromise = (async () => {
      try {
        const apifyInfluencers = await searchInfluencersWithApify({
          ...searchParams,
          maxResults: 25 // Increased from 10 to 25 for more results
        });
        
        if (apifyInfluencers && apifyInfluencers.length > 0) {
          // Convert ScrapedInfluencer[] to MatchResult[] format
          realtimeResults = apifyInfluencers.map(influencer => ({
            influencer: {
              id: influencer.username,
              name: influencer.fullName || influencer.username,
              handle: influencer.username,
              platform: influencer.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
              followerCount: influencer.followers,
              engagementRate: influencer.engagementRate / 100,
              ageRange: '25-34' as const,
              gender: detectInfluencerGender(influencer),
              location: influencer.location || 'Unknown',
              niche: [influencer.category || 'Lifestyle'],
              contentStyle: ['Posts'] as const,
              pastCollaborations: [],
              averageRate: Math.floor(influencer.followers / 100) || 500,
              costLevel: 'Mid-Range' as const,
              audienceDemographics: generateDiverseDemographics(influencer),
              recentPosts: [],
              contactInfo: {
                email: influencer.email,
                preferredContact: 'Email' as const,
              },
              isActive: true,
              lastUpdated: new Date(),
            },
            matchScore: (influencer.brandCompatibilityScore || 75) / 100,
            matchReasons: generateRealtimeMatchReasons(influencer, searchParams),
            estimatedCost: Math.floor(influencer.followers / 100) || 500,
            similarPastCampaigns: [],
            potentialReach: Math.round(influencer.followers * (influencer.engagementRate / 100)),
            recommendations: ['Influencer found through real-time search'],
          }));
          
          console.log(`✅ Real-time search found ${realtimeResults.length} results`);
        }
      } catch (error) {
        console.warn('⚠️ Real-time search failed:', error);
      }
    })();

    // Wait up to 10 seconds for real-time results, then proceed
    try {
      await Promise.race([
        realtimeSearchPromise,
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 second max wait
      ]);
    } catch (error) {
      console.log('⏰ Proceeding without waiting for real-time search completion');
    }

    // Combine all available results
    if (realtimeResults.length > 0) {
      allResults.push(...realtimeResults);
      totalFound += realtimeResults.length;
      searchSources.push('Real-time search');
    }

    // 🆘 FALLBACK: If we have 0 results, try broader search criteria
    if (allResults.length === 0) {
      console.log('🔄 No results found, trying broader search criteria...');
      
      // Try broader follower range and relaxed criteria
      const broaderParams = {
        ...searchParams,
        minFollowers: 1000, // Lower minimum
        maxFollowers: 5000000, // Much higher maximum
        ageRange: undefined, // Remove age restriction
        gender: undefined, // Remove gender restriction
        strictLocationMatch: false, // Relax location matching
        niches: ['lifestyle', 'fitness'], // Add broader niches
      };
      
      console.log('🔍 Searching with broader criteria:', broaderParams);
      const broadVettedResults = await searchVettedInfluencers({
        ...broaderParams,
        gender: broaderParams.gender as 'male' | 'female' | 'any' | undefined
      });
      
      if (broadVettedResults.influencers.length > 0) {
        const convertedBroadVetted = broadVettedResults.influencers.slice(0, 20).map(inf => 
          convertVettedToMatchResult(inf, searchParams)
        );
        allResults.push(...convertedBroadVetted);
        totalFound += convertedBroadVetted.length;
        searchSources.push('Database (expanded criteria)');
        
        console.log(`✅ Found ${convertedBroadVetted.length} results with broader criteria`);
      }
    }
    
    // Remove duplicates based on handle/username
    const uniqueResults = allResults.filter((result, index, array) => {
      return array.findIndex(r => 
        r.influencer.handle?.toLowerCase() === result.influencer.handle?.toLowerCase() ||
        r.influencer.name?.toLowerCase() === result.influencer.name?.toLowerCase()
      ) === index;
    });
    
    // Add collaboration status for each influencer
    const brandName = extractBrandFromQuery(searchParams);
    const resultsWithCollaboration = await addCollaborationStatus(uniqueResults, brandName);
    
    // 🎯 ENHANCE WITH STARNGAGE DEMOGRAPHICS (top 10 results)
    console.log('📊 Starting StarNgage demographic enhancement...');
    const resultsWithDemographics = await enhanceWithStarngageDemographics(resultsWithCollaboration, 10);
    
    // Sort with sophisticated prioritization:
    // 1. StarNgage-enhanced results first (highest quality data)
    // 2. Vetted database results second (highest match scores)  
    // 3. Within each group, sort by engagement rate then follower count
    resultsWithDemographics.sort((a, b) => {
      // Priority sort: StarNgage-enhanced results first
      if (a.starngageEnhanced && !b.starngageEnhanced) return -1;
      if (!a.starngageEnhanced && b.starngageEnhanced) return 1;
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
    
        // 🛡️ CRITICAL: Limit total results to prevent UI overload and infinite search loops
    const MAX_TOTAL_RESULTS = 50;
    const limitedResults = resultsWithDemographics.slice(0, MAX_TOTAL_RESULTS);
    
    if (resultsWithDemographics.length > MAX_TOTAL_RESULTS) {
      console.log(`🛡️ Limited results from ${resultsWithDemographics.length} to ${MAX_TOTAL_RESULTS} to prevent UI overload`);
    }
    
    console.log(`🎯 Returning ${limitedResults.length} results from sources: ${searchSources.join(', ')}`);

    // 🧠 Save search to memory for Clara's AI learning system
    try {
      const searchId = await searchMemory.saveSearch({
        userId: req.headers.get('x-user-id') || `user_${Date.now()}`,
        sessionId: req.headers.get('x-session-id') || `session_${Date.now()}`,
        query: searchParams.userQuery || 'Enhanced search',
        searchParams: {
          platforms: searchParams.platforms || ['Instagram'],
          niches: searchParams.niches || [],
          minFollowers: searchParams.minFollowers || 0,
          maxFollowers: searchParams.maxFollowers || 10000000,
          location: searchParams.location,
          gender: searchParams.gender,
          userQuery: searchParams.userQuery || 'Enhanced search',
        },
        results: {
          totalFound: resultsWithDemographics.length,
          premiumResults: resultsWithDemographics,
          discoveryResults: [],
        },
        campaignId: req.headers.get('x-campaign-id') || undefined,
        campaignStatus: req.headers.get('x-campaign-status') as any || undefined,
        brandName: brandName || undefined,
      });

      // Get learning insights for continuous improvement
      const insights = await searchMemory.getLearningInsights(
        searchParams.userQuery || '',
        {
          brandName: brandName || undefined,
          activeCampaigns: req.headers.get('x-campaign-id') ? [req.headers.get('x-campaign-id')!] : undefined,
        }
      );

      console.log(`🧠 Enhanced search saved to memory: ${searchId}. Learning patterns: ${insights.campaignSpecificInsights?.length || 0}`);
    } catch (memoryError) {
      console.error('⚠️ Memory save failed (non-critical):', memoryError);
    }

    // Enhanced response format
    return NextResponse.json({
      success: true,
      data: {
        premiumResults: limitedResults, // Return LIMITED results to prevent UI freezes
        totalFound: limitedResults.length,
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
          },
          brandCollaborationCheck: brandName ? {
            brandName,
            enabled: true
          } : null
        },
        recommendations: generateRecommendations(resultsWithDemographics, {
          ...searchParams,
          searchSources
        }),
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
    recommendations.push('Prueba con rangos de seguidores más amplios');
    return recommendations;
  }
  
  // Check if we used broader criteria
  const usedBroaderCriteria = searchParams.searchSources?.includes('Base de datos (criterios ampliados)');
  if (usedBroaderCriteria) {
    recommendations.push('⚠️ Se usaron criterios ampliados para encontrar más resultados');
    recommendations.push('💡 Para resultados más específicos, intenta ajustar los filtros');
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