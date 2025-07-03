import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithApify, searchInfluencersWithTwoTierDiscovery, type ApifySearchParams } from '@/lib/apifyService';
import { searchVettedInfluencers, convertVettedToMatchResult } from '@/lib/vettedInfluencersService';
import { searchMemory } from '@/lib/database';

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
  // Extract brand from the search query
  const query = searchParams.userQuery?.toLowerCase() || '';
  
  // Common brand patterns in Spanish searches
  const brandPatterns = [
    /para\s+(\w+)/i,           // "para IKEA", "para Nike"
    /con\s+(\w+)/i,            // "con Zara", "con Adidas" 
    /de\s+(\w+)/i,             // "de H&M", "de Mango"
    /compatible[s]?\s+con\s+(\w+)/i,  // "compatibles con Nike"
    /\b(ikea|nike|adidas|zara|mango|h&m|inditex|bershka|stradivarius|pull&bear|massimo|dutti|shein|amazon|apple|samsung|coca|cola|pepsi|mcdonalds|burger|king|kfc|netflix|spotify|vodafone|movistar|orange|banco|santander|bbva|ing|openbank)\b/i
  ];

  for (const pattern of brandPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  // Also check brandName if provided
  if (searchParams.brandName) {
    return searchParams.brandName.toLowerCase();
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
        const vettedResults = await searchVettedInfluencers(searchParams);
        
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
        
        // Sort results
        resultsWithCollaboration.sort((a, b) => {
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
        
        // Send final complete results
        sendUpdate({
          type: 'complete',
          stage: 'Search completed successfully!',
          progress: 100,
          results: resultsWithCollaboration,
          totalFound: resultsWithCollaboration.length,
          metadata: {
            searchSources,
            totalFound: resultsWithCollaboration.length,
            searchStrategy: searchSources.length > 1 ? 'hybrid_search' : 
              searchSources.includes('Base de datos verificada') ? 'vetted_only' : 'realtime_only',
            duplicatesRemoved: allResults.length - resultsWithCollaboration.length
          }
        });
        
        console.log(`🎯 Progressive search completed: ${resultsWithCollaboration.length} final results`);
        
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
    const vettedResults = await searchVettedInfluencers(searchParams);
    
    if (vettedResults.influencers.length > 0) {
      // Convert vetted results to match result format
      const convertedVetted = vettedResults.influencers.map(inf => 
        convertVettedToMatchResult(inf, searchParams)
      );
      allResults.push(...convertedVetted);
      totalFound += vettedResults.totalCount;
      searchSources.push('Base de datos verificada');
      
      console.log(`✅ Found ${vettedResults.influencers.length} vetted influencers`);
    } else {
      console.log('📍 No vetted influencers found, proceeding with other sources');
    }
    
    // 2. Only search Apify API if we need more results (conditional real-time search)
    const databaseResultsCount = vettedResults.influencers.length;
    const targetResults = searchParams.maxResults || 20;
    const shouldDoRealtimeSearch = databaseResultsCount < Math.max(5, targetResults * 0.3); // Only if we have fewer than 30% of target or less than 5 results
    
    if (shouldDoRealtimeSearch) {
      console.log(`🌐 Database found ${databaseResultsCount} results, supplementing with real-time search...`);
      try {
        // Add timeout protection for real-time search
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Real-time search timeout')), 30000) // 30 second timeout
        );
        
        const searchPromise = searchInfluencersWithApify({
          ...searchParams,
          maxResults: Math.min(10, targetResults - databaseResultsCount) // Limit real-time results
        });
        
        const apifyInfluencers = await Promise.race([searchPromise, timeoutPromise]) as any[];
        
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
            gender: detectInfluencerGender(influencer),
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
          matchReasons: generateRealtimeMatchReasons(influencer, searchParams),
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
        console.warn('⚠️ Real-time search failed or timed out:', error);
      }
    } else {
      console.log(`✅ Database provided sufficient results (${databaseResultsCount}/${targetResults}), skipping real-time search`);
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
    
    // Sort with sophisticated prioritization:
    // 1. Vetted database results first (highest match scores)
    // 2. Within each group, sort by engagement rate then follower count
    resultsWithCollaboration.sort((a, b) => {
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
    
    // Don't limit results here - let frontend handle pagination
    console.log(`🎯 Returning ${resultsWithCollaboration.length} unique results from sources: ${searchSources.join(', ')}`);
    
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
          totalFound: resultsWithCollaboration.length,
          premiumResults: resultsWithCollaboration,
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
        premiumResults: resultsWithCollaboration, // Return ALL results for frontend pagination
        totalFound: resultsWithCollaboration.length,
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
        recommendations: generateRecommendations(resultsWithCollaboration, searchParams),
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