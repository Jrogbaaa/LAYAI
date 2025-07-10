import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithApify, ApifySearchParams } from '@/lib/apifyService';

interface ProfileAttributes {
  profession?: string;
  niche?: string[];
  nationality?: string;
  platform?: string[];
  followerRange?: {
    min: number;
    max: number;
  };
  engagementRange?: {
    min: number;
    max: number;
  };
  contentType?: string[];
  businessModel?: string[];
  expertise?: string[];
}

interface SimilaritySearchParams {
  profileDescription: string;
  limit?: number;
}

// Search database for existing influencers using web search
async function searchDatabaseInfluencers(searchParams: any, limit: number): Promise<any[]> {
  try {
    console.log('🔍 Searching database with web search integration...');
    
    // Build targeted search queries for finding similar profiles
    const searchQueries = buildSimilaritySearchQueries(searchParams);
    const allWebResults: any[] = [];

    // Use existing web search API to find similar profiles
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        
        const searchResponse = await fetch(`${baseUrl}/api/web-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            limit: Math.ceil(limit / searchQueries.length),
            type: 'influencer'
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.success && searchData.results) {
            // Transform web search results to profile format
            const profileResults = searchData.results
              .filter((result: any) => isInfluencerProfile(result))
              .map((result: any) => extractProfileFromWebResult(result))
              .filter((profile: any) => profile !== null);
            
            allWebResults.push(...profileResults);
            console.log(`✅ Found ${profileResults.length} profiles from query: "${query}"`);
          }
        }
      } catch (error) {
        console.error(`❌ Web search failed for query "${query}":`, error);
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = deduplicateProfileResults(allWebResults);
    console.log(`📊 Database search via web: ${allWebResults.length} total, ${uniqueResults.length} unique`);
    
    return uniqueResults.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Database search error:', error);
    return [];
  }
}

// Build targeted search queries for finding similar profiles
function buildSimilaritySearchQueries(searchParams: any): string[] {
  const queries: string[] = [];
  
  // Base query components
  const platforms = searchParams.platform || ['Instagram'];
  const niches = searchParams.niche || ['lifestyle'];
  const location = searchParams.location?.[0] || '';
  
  // Query 1: Niche + Platform + Location
  if (niches.length > 0) {
    const nicheQuery = `${niches[0]} ${platforms[0]} influencer ${location}`.trim();
    queries.push(nicheQuery);
  }
  
  // Query 2: Profession + Platform
  if (searchParams.profession) {
    const professionQuery = `${searchParams.profession} ${platforms[0]} content creator`;
    queries.push(professionQuery);
  }
  
  // Query 3: Follower range + Niche
  if (searchParams.followerRange && niches.length > 0) {
    const followerK = Math.round(searchParams.followerRange.min / 1000);
    const followerQuery = `${followerK}k followers ${niches[0]} influencer`;
    queries.push(followerQuery);
  }
  
  // Query 4: Multiple niches
  if (niches.length > 1) {
    const multiNicheQuery = `${niches.slice(0, 2).join(' ')} influencer ${platforms[0]}`;
    queries.push(multiNicheQuery);
  }
  
  // Default fallback query
  if (queries.length === 0) {
    queries.push(`${platforms[0]} influencer content creator`);
  }
  
  return queries;
}

// Check if web search result looks like an influencer profile
function isInfluencerProfile(result: any): boolean {
  const text = `${result.title || ''} ${result.description || ''}`.toLowerCase();
  
  const influencerKeywords = [
    'influencer', 'content creator', 'blogger', 'youtuber', 'tiktoker',
    'followers', 'instagram', 'tiktok', 'youtube', 'social media',
    'brand ambassador', 'lifestyle', 'fashion', 'fitness', 'travel'
  ];
  
  const platformKeywords = ['instagram.com', 'tiktok.com', 'youtube.com', '@'];
  
  const hasInfluencerKeywords = influencerKeywords.some(keyword => text.includes(keyword));
  const hasPlatformKeywords = platformKeywords.some(keyword => text.includes(keyword));
  
  return hasInfluencerKeywords || hasPlatformKeywords;
}

// Extract profile information from web search result
function extractProfileFromWebResult(result: any): any | null {
  try {
    const title = result.title || '';
    const description = result.description || '';
    const url = result.url || '';
    
    // Extract username from URL or title
    let username = '';
    if (url.includes('instagram.com/')) {
      username = url.split('instagram.com/')[1]?.split('/')[0] || '';
    } else if (url.includes('tiktok.com/@')) {
      username = url.split('tiktok.com/@')[1]?.split('/')[0] || '';
    } else if (title.includes('@')) {
      username = title.match(/@(\w+)/)?.[1] || '';
    }
    
    if (!username) return null;
    
    // Extract follower count if mentioned
    let followers = 0;
    const followerMatch = description.match(/(\d+(?:\.\d+)?)\s*([km])?\s*followers?/i);
    if (followerMatch) {
      const num = parseFloat(followerMatch[1]);
      const unit = followerMatch[2]?.toLowerCase();
      if (unit === 'k') followers = num * 1000;
      else if (unit === 'm') followers = num * 1000000;
      else followers = num;
    }
    
    // Determine platform
    let platform = 'Instagram';
    if (url.includes('tiktok.com')) platform = 'TikTok';
    else if (url.includes('youtube.com')) platform = 'YouTube';
    
    return {
      influencer: {
        username,
        fullName: title.replace(/@\w+/, '').trim(),
        followers: followers,
        platform: platform,
        biography: description,
        profilePicUrl: '',
        verified: false,
        engagementRate: 0,
        url: url
      }
    };
    
  } catch (error) {
    console.error('❌ Error extracting profile from web result:', error);
    return null;
  }
}

// Remove duplicate profiles from results
function deduplicateProfileResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    const username = result.influencer?.username?.toLowerCase();
    if (!username || seen.has(username)) return false;
    seen.add(username);
    return true;
  });
}

// Search web for new influencers using enhanced Apify integration
async function searchWebInfluencers(searchParams: any, limit: number): Promise<any[]> {
  try {
    console.log('🌐 Searching web for similar profiles with enhanced Apify...');
    
    // Use the existing Apify service for web search
    const searchResults = await searchInfluencersWithApify({
      platforms: searchParams.platform || ['Instagram'],
      niches: searchParams.niche || ['lifestyle'],
      minFollowers: searchParams.followerRange?.min || 1000,
      maxFollowers: searchParams.followerRange?.max || 10000000,
      location: searchParams.location?.[0],
      maxResults: limit * 2, // Request more to account for filtering
      gender: searchParams.gender,
      userQuery: buildApifyQuery(searchParams)
    });

    // Transform search results to match expected structure
    const transformedResults = (searchResults || []).map(influencer => ({
      influencer: {
        ...influencer,
        bio: influencer.biography || '',
        followerCount: influencer.followers || 0,
        handle: influencer.username || '',
        name: influencer.fullName || ''
      }
    }));

    console.log(`🔧 Transformed ${transformedResults.length} web search results`);
    return transformedResults.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Web search error:', error);
    return [];
  }
}

// Build optimized query for Apify search
function buildApifyQuery(searchParams: any): string {
  const components = [];
  
  if (searchParams.profession) {
    components.push(searchParams.profession);
  }
  
  if (searchParams.niche && searchParams.niche.length > 0) {
    components.push(...searchParams.niche.slice(0, 2));
  }
  
  if (searchParams.location && searchParams.location.length > 0) {
    components.push(searchParams.location[0]);
  }
  
  components.push('influencer', 'content creator');
  
  return components.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const { profileDescription, limit = 10 }: SimilaritySearchParams = await request.json();

    if (!profileDescription || profileDescription.trim().length < 20) {
      return NextResponse.json({
        success: false,
        error: 'Profile description must be at least 20 characters long'
      }, { status: 400 });
    }

    console.log('🔍 Profile Similarity Search initiated:', {
      descriptionLength: profileDescription.length,
      limit
    });

    // Extract attributes from the profile description
    const extractedAttributes = extractProfileAttributes(profileDescription);
    console.log('📋 Extracted attributes:', extractedAttributes);

    // Convert attributes to search parameters
    const searchParams = convertToSearchParameters(extractedAttributes);
    console.log('🎯 Search parameters:', searchParams);

    // Search both database and web for similar influencers
    const [databaseResults, webResults] = await Promise.allSettled([
      searchDatabaseInfluencers(searchParams, limit),
      searchWebInfluencers(searchParams, limit)
    ]);

    // Combine results from both sources
    let allResults: any[] = [];
    
    if (databaseResults.status === 'fulfilled' && databaseResults.value.length > 0) {
      console.log(`📊 Found ${databaseResults.value.length} matches in database`);
      allResults.push(...databaseResults.value);
    }
    
    if (webResults.status === 'fulfilled' && webResults.value.length > 0) {
      console.log(`🌐 Found ${webResults.value.length} matches from web search`);
      allResults.push(...webResults.value);
    }

    // Remove duplicates based on username/handle
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => {
        const rUsername = r.influencer?.username || r.influencer?.handle;
        const resultUsername = result.influencer?.username || result.influencer?.handle;
        return rUsername === resultUsername;
      })
    );

    if (uniqueResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No similar profiles found',
        details: 'Search returned no results from database or web'
      }, { status: 404 });
    }

    // Rank results by similarity to the provided profile
    console.log(`🔍 Ranking ${uniqueResults.length} results. Sample result structure:`, uniqueResults[0] ? {
      hasInfluencer: !!uniqueResults[0].influencer,
      influencerKeys: uniqueResults[0].influencer ? Object.keys(uniqueResults[0].influencer) : [],
      username: uniqueResults[0].influencer?.username,
      biography: uniqueResults[0].influencer?.biography
    } : 'No results');
    
    const rankedResults = rankBySimilarity(uniqueResults, extractedAttributes);
    
    // Limit results
    const limitedResults = rankedResults.slice(0, limit);

    console.log(`✅ Found ${limitedResults.length} similar profiles`);

    return NextResponse.json({
      success: true,
      data: {
        results: limitedResults,
        totalFound: limitedResults.length,
        extractedAttributes,
        searchStrategy: 'profile-similarity',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Profile similarity search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during profile similarity search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Extract key attributes from profile description using pattern matching
function extractProfileAttributes(description: string): ProfileAttributes {
  const lowerDesc = description.toLowerCase();
  const attributes: ProfileAttributes = {};

  // Extract profession/role
  const professionPatterns = [
    /(?:profession:|job:|role:|work as|works as)\s*([^.\n]+)/i,
    /(?:is a|is an)\s+([^,.\n]+?)(?:\s+(?:and|who|known|famous))/i,
    /(?:journalist|blogger|influencer|creator|chef|athlete|model|actor|actress|musician|artist|designer|photographer|coach|trainer|consultant|entrepreneur|ceo|founder)/gi
  ];

  for (const pattern of professionPatterns) {
    const match = description.match(pattern);
    if (match) {
      if (typeof match === 'object' && match[1]) {
        attributes.profession = match[1].trim();
      } else if (typeof match === 'string') {
        attributes.profession = match;
      }
      break;
    }
  }

  // Extract nationality
  const nationalityPattern = /(?:nationality:|from|born in|lives in|based in|italian|spanish|american|british|french|german|brazilian|mexican|colombian|argentinian)/gi;
  
  const nationalityMatch = description.match(nationalityPattern);
  if (nationalityMatch && nationalityMatch[0]) {
    attributes.nationality = nationalityMatch[0].toLowerCase();
  }

  // Extract follower count for range estimation
  const followerPatterns = [
    /(\d+(?:\.\d+)?)\s*million followers/i,
    /(\d+(?:\.\d+)?)\s*m followers/i,
    /(\d+(?:,\d+)?)\s*k followers/i,
    /(\d+(?:,\d+)*)\s*followers/i
  ];

  for (const pattern of followerPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const count = parseFollowerCount(match[1], match[0]);
      if (count > 0) {
        // Create a range around the detected follower count
        const lowerBound = Math.max(1000, Math.floor(count * 0.5));
        const upperBound = Math.floor(count * 2);
        attributes.followerRange = { min: lowerBound, max: upperBound };
        break;
      }
    }
  }

  // Extract niches/interests
  const nicheKeywords = [
    'football', 'soccer', 'sports', 'fitness', 'fashion', 'beauty', 'lifestyle',
    'food', 'cooking', 'travel', 'tech', 'technology', 'gaming', 'music',
    'art', 'design', 'business', 'entrepreneur', 'comedy', 'entertainment',
    'health', 'wellness', 'photography', 'education', 'news', 'journalism',
    'automotive', 'luxury', 'finance', 'crypto', 'real estate'
  ];

  const detectedNiches = nicheKeywords.filter(niche => 
    lowerDesc.includes(niche) || lowerDesc.includes(niche + 's')
  );

  if (detectedNiches.length > 0) {
    attributes.niche = detectedNiches.slice(0, 3); // Limit to top 3
  }

  // Extract platforms
  const platformPatterns = /(?:instagram|tiktok|youtube|twitter|facebook|linkedin|twitch)/gi;
  const platformMatches = description.match(platformPatterns);
  if (platformMatches) {
    const uniquePlatforms = Array.from(new Set(platformMatches.map(p => 
      p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )));
    attributes.platform = uniquePlatforms;
  }

  // Extract content types
  const contentKeywords = [
    'breaking news', 'transfer news', 'reviews', 'tutorials', 'vlogs',
    'interviews', 'behind-the-scenes', 'live streams', 'photos', 'videos',
    'stories', 'reels', 'shorts', 'posts'
  ];

  const detectedContent = contentKeywords.filter(content => lowerDesc.includes(content));
  if (detectedContent.length > 0) {
    attributes.contentType = detectedContent;
  }

  // Extract business indicators
  const businessPatterns = [
    'merchandise', 'brand ambassador', 'partnerships', 'collaborations',
    'sponsorships', 'business', 'company', 'agency', 'management'
  ];

  const detectedBusiness = businessPatterns.filter(business => lowerDesc.includes(business));
  if (detectedBusiness.length > 0) {
    attributes.businessModel = detectedBusiness;
  }

  return attributes;
}

// Convert profile attributes to search parameters
function convertToSearchParameters(attributes: ProfileAttributes): any {
  const params: any = {};

  // Map niches
  if (attributes.niche && attributes.niche.length > 0) {
    params.niche = attributes.niche;
  }

  // Map platforms
  if (attributes.platform && attributes.platform.length > 0) {
    params.platform = attributes.platform;
  }

  // Map follower range
  if (attributes.followerRange) {
    params.followerRange = attributes.followerRange;
  }

  // Map nationality to location
  if (attributes.nationality) {
    if (attributes.nationality.includes('italian')) params.location = ['Italy'];
    else if (attributes.nationality.includes('spanish')) params.location = ['Spain'];
    else if (attributes.nationality.includes('american')) params.location = ['United States'];
    else if (attributes.nationality.includes('british')) params.location = ['United Kingdom'];
    else if (attributes.nationality.includes('french')) params.location = ['France'];
    else if (attributes.nationality.includes('german')) params.location = ['Germany'];
    else if (attributes.nationality.includes('brazilian')) params.location = ['Brazil'];
    else if (attributes.nationality.includes('mexican')) params.location = ['Mexico'];
    else if (attributes.nationality.includes('colombian')) params.location = ['Colombia'];
    else if (attributes.nationality.includes('argentinian')) params.location = ['Argentina'];
  }

  // Create brand query from profession and content type
  const brandQueryParts = [];
  if (attributes.profession) brandQueryParts.push(attributes.profession);
  if (attributes.contentType) brandQueryParts.push(...attributes.contentType.slice(0, 2));
  
  if (brandQueryParts.length > 0) {
    params.brandQuery = brandQueryParts.join(' ');
  }

  return params;
}

// Parse follower count strings into numbers
function parseFollowerCount(countStr: string, fullMatch: string): number {
  const cleanCount = countStr.replace(/,/g, '');
  const num = parseFloat(cleanCount);
  
  if (fullMatch.toLowerCase().includes('million') || fullMatch.toLowerCase().includes(' m ')) {
    return num * 1000000;
  } else if (fullMatch.toLowerCase().includes('k')) {
    return num * 1000;
  } else {
    return num;
  }
}

// Infer niche from Instagram profile data
function inferNicheFromProfile(profile: any): string[] {
  const niches: string[] = [];
  
  // Check if profile exists and has valid structure
  if (!profile || typeof profile !== 'object') {
    return ['lifestyle']; // Default fallback
  }
  
  // Combine bio, full name, and description for analysis
  const textContent = [
    profile.biography || profile.bio || '',
    profile.fullName || profile.name || '',
    profile.username || profile.handle || ''
  ].join(' ').toLowerCase();
  
  // Define niche keywords
  const nicheKeywords = {
    'fitness': ['fitness', 'gym', 'workout', 'training', 'bodybuilding', 'health', 'wellness', 'crossfit', 'yoga', 'pilates', 'athlete', 'coach', 'trainer', 'muscle', 'strength'],
    'fashion': ['fashion', 'style', 'outfit', 'clothing', 'designer', 'model', 'runway', 'trends', 'wardrobe', 'accessories', 'luxury', 'boutique', 'stylist'],
    'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'hair', 'nails', 'salon', 'spa', 'aesthetic', 'glow', 'routine', 'skin', 'lips', 'eyes'],
    'food': ['food', 'chef', 'cooking', 'recipe', 'restaurant', 'culinary', 'kitchen', 'meals', 'nutrition', 'foodie', 'dining', 'cuisine', 'baking'],
    'travel': ['travel', 'wanderlust', 'adventure', 'explorer', 'journey', 'destinations', 'vacation', 'backpack', 'nomad', 'photography', 'culture', 'world'],
    'lifestyle': ['lifestyle', 'daily', 'life', 'living', 'home', 'family', 'personal', 'routine', 'blog', 'inspiration', 'motivation', 'happiness'],
    'tech': ['tech', 'technology', 'gadgets', 'software', 'coding', 'programming', 'digital', 'innovation', 'startup', 'entrepreneur', 'ai', 'data'],
    'sports': ['sports', 'football', 'soccer', 'basketball', 'tennis', 'golf', 'baseball', 'hockey', 'athlete', 'team', 'competition', 'championship'],
    'entertainment': ['entertainment', 'music', 'movies', 'tv', 'celebrity', 'comedy', 'performer', 'artist', 'actor', 'singer', 'dancer', 'show'],
    'business': ['business', 'entrepreneur', 'ceo', 'founder', 'startup', 'marketing', 'sales', 'finance', 'investment', 'leadership', 'strategy'],
    'education': ['education', 'teacher', 'student', 'learning', 'study', 'university', 'college', 'school', 'academic', 'research', 'knowledge'],
    'art': ['art', 'artist', 'creative', 'design', 'painting', 'drawing', 'sculpture', 'gallery', 'exhibition', 'photography', 'visual', 'creative'],
    'gaming': ['gaming', 'gamer', 'esports', 'twitch', 'youtube', 'streamer', 'console', 'pc', 'mobile', 'competitive', 'tournament'],
    'parenting': ['mom', 'dad', 'parent', 'family', 'kids', 'children', 'baby', 'motherhood', 'fatherhood', 'parenting', 'pregnancy'],
    'music': ['music', 'musician', 'singer', 'band', 'album', 'song', 'concert', 'tour', 'producer', 'dj', 'composer', 'artist']
  };

  // Check for niche keywords
  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    const matchCount = keywords.filter(keyword => textContent.includes(keyword)).length;
    if (matchCount > 0) {
      niches.push(niche);
    }
  }

  // If no specific niche found, try to infer from context
  if (niches.length === 0) {
    if (textContent.includes('influencer') || textContent.includes('creator') || textContent.includes('content')) {
      niches.push('lifestyle');
    }
  }

  return niches;
}

// Rank search results by similarity to the target profile
function rankBySimilarity(results: any[], targetAttributes: ProfileAttributes): any[] {
  return results.map(result => {
    let similarityScore = 0;
    let maxScore = 0;

    // Ensure result has proper structure
    if (!result || !result.influencer) {
      console.warn('⚠️ Invalid result structure:', result);
      return {
        ...result,
        similarityScore: 0,
        matchReasons: ['Invalid profile data']
      };
    }

    // Infer niche if not present
    if (!result.influencer.niche) {
      result.influencer.niche = inferNicheFromProfile(result.influencer);
    }

    // Check niche similarity
    if (targetAttributes.niche && result.influencer?.niche) {
      maxScore += 30;
      const targetNiches = targetAttributes.niche.map(n => n.toLowerCase());
      const resultNiches = Array.isArray(result.influencer.niche) 
        ? result.influencer.niche.map((n: string) => n.toLowerCase())
        : [result.influencer.niche.toLowerCase()];
      
      const matchingNiches = targetNiches.filter(tn => 
        resultNiches.some((rn: string) => rn.includes(tn) || tn.includes(rn))
      );
      similarityScore += (matchingNiches.length / targetNiches.length) * 30;
    }

    // Check platform similarity
    if (targetAttributes.platform && result.influencer?.platform) {
      maxScore += 20;
      const targetPlatforms = targetAttributes.platform.map(p => p.toLowerCase());
      const resultPlatform = result.influencer.platform.toLowerCase();
      
      if (targetPlatforms.includes(resultPlatform)) {
        similarityScore += 20;
      }
    }

    // Check follower range similarity
    if (targetAttributes.followerRange && result.influencer?.followerCount) {
      maxScore += 25;
      const targetMin = targetAttributes.followerRange.min;
      const targetMax = targetAttributes.followerRange.max;
      const resultFollowers = result.influencer.followerCount;
      
      if (resultFollowers >= targetMin && resultFollowers <= targetMax) {
        similarityScore += 25;
      } else {
        // Partial credit for being close to the range
        const targetCenter = (targetMin + targetMax) / 2;
        const distance = Math.abs(resultFollowers - targetCenter);
        const maxDistance = targetMax - targetMin;
        const proximity = Math.max(0, 1 - (distance / maxDistance));
        similarityScore += proximity * 25;
      }
    }

    // Check profession/content similarity
    if (targetAttributes.profession && result.influencer?.bio) {
      maxScore += 15;
      const targetProf = targetAttributes.profession.toLowerCase();
      const resultBio = result.influencer.bio.toLowerCase();
      
      if (resultBio.includes(targetProf)) {
        similarityScore += 15;
      } else {
        // Check for similar words
        const targetWords = targetProf.split(' ');
        const matchingWords = targetWords.filter(word => 
          word.length > 3 && resultBio.includes(word)
        );
        similarityScore += (matchingWords.length / targetWords.length) * 15;
      }
    }

    // Engagement rate bonus
    if (result.influencer?.engagementRate) {
      maxScore += 10;
      const engagementScore = Math.min(result.influencer.engagementRate * 100, 10);
      similarityScore += engagementScore;
    }

    const finalScore = maxScore > 0 ? (similarityScore / maxScore) : 0;
    
    return {
      ...result,
      similarityScore: Math.round(finalScore * 100) / 100,
      matchReasons: generateMatchReasons(targetAttributes, result.influencer)
    };
  }).sort((a, b) => b.similarityScore - a.similarityScore);
}

// Generate human-readable match reasons
function generateMatchReasons(target: ProfileAttributes, influencer: any): string[] {
  const reasons: string[] = [];

  // Check if influencer exists
  if (!influencer || typeof influencer !== 'object') {
    return ['No profile data available'];
  }

  // Infer niche if not present
  if (!influencer.niche) {
    influencer.niche = inferNicheFromProfile(influencer);
  }

  if (target.niche && influencer.niche && influencer.niche.length > 0) {
    const targetNiches = target.niche.map(n => n.toLowerCase());
    const resultNiches = Array.isArray(influencer.niche) 
      ? influencer.niche.map((n: string) => n.toLowerCase())
      : [influencer.niche.toLowerCase()];
    
    const matches = targetNiches.filter(tn => 
      resultNiches.some((rn: string) => rn.includes(tn) || tn.includes(rn))
    );
    
    if (matches.length > 0) {
      reasons.push(`Similar niche: ${matches.join(', ')}`);
    }
  }

  if (target.platform && influencer.platform) {
    const targetPlatforms = target.platform.map(p => p.toLowerCase());
    if (targetPlatforms.includes(influencer.platform.toLowerCase())) {
      reasons.push(`Same platform: ${influencer.platform}`);
    }
  }

  if (target.followerRange && influencer.followerCount) {
    const inRange = influencer.followerCount >= target.followerRange.min && 
                   influencer.followerCount <= target.followerRange.max;
    if (inRange) {
      reasons.push(`Similar audience size: ${Math.round(influencer.followerCount / 1000)}K followers`);
    }
  }

  if (target.profession && influencer.bio) {
    const bio = influencer.bio.toLowerCase();
    if (bio.includes(target.profession.toLowerCase())) {
      reasons.push(`Similar profession: ${target.profession}`);
    }
  }

  return reasons;
} 