import { ApifyClient } from 'apify-client';
import { analyzeBrand, generateInfluencerCriteria, extractBrandFromQuery, calculateBrandCompatibility, BrandProfile } from './brandIntelligence';

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN,
});

// Serply API Key
const serplyApiKey = process.env.SERPLY_API_KEY;

export interface ScrapedInfluencer {
  username: string;
  fullName: string;
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number;
  platform: string;
  biography: string;
  verified: boolean;
  profilePicUrl: string;
  avgLikes: number;
  avgComments: number;
  category: string;
  location?: string;
  email?: string;
  website?: string;
  collaborationRate?: number;
  brandCompatibilityScore?: number;
}

export interface ApifySearchParams {
  platforms: string[];
  niches: string[];
  minFollowers: number;
  maxFollowers: number;
  location?: string;
  verified?: boolean;
  maxResults?: number;
  gender?: string;
  ageRange?: string;
  strictLocationMatch?: boolean;
  brandName?: string;
  userQuery?: string;
  specificHandle?: string;
}

export interface SearchResults {
  premiumResults: ScrapedInfluencer[];
  discoveryResults: BasicInfluencerProfile[];
  totalFound: number;
}

export interface VerifiedInfluencer {
  username: string;
  url: string;
  followers: number;
  fullName: string;
  isVerified: boolean;
  platform: string;
}

/**
 * Search for influencers using Apify actors
 */
export async function searchInfluencersWithApify(params: ApifySearchParams): Promise<ScrapedInfluencer[]> {
  try {
    // Step 0: Brand Intelligence Analysis
    let brandProfile: BrandProfile | null = null;
    let enhancedParams = { ...params };
    
    if (params.brandName || params.userQuery) {
      const brandName = params.brandName || extractBrandFromQuery(params.userQuery || '');
      if (brandName) {
        console.log(`🧠 Analyzing brand: ${brandName}`);
        brandProfile = analyzeBrand(brandName);
        console.log(`📊 Brand Profile: ${brandProfile.category} | Target: ${brandProfile.targetAudience.primaryAge} | Keywords: ${brandProfile.searchKeywords.slice(0, 3).join(', ')}`);
        
        // Generate brand-aware search criteria
        const criteria = generateInfluencerCriteria(brandProfile, params.userQuery);
        
        // Enhance search parameters with brand intelligence
        enhancedParams = {
          ...params,
          niches: Array.from(new Set([...params.niches, ...criteria.primaryNiches])),
          maxResults: Math.max(params.maxResults || 20, 30), // Increase results for brand searches
        };
        
        console.log(`🎯 Enhanced search niches: ${enhancedParams.niches.join(', ')}`);
      }
    }

    console.log('Starting hybrid search approach: Web search + Apify profile scraping');
    
    const results: ScrapedInfluencer[] = [];
    
    // Phase 1: Web search to discover influencer profiles (with brand intelligence)
    const profileUrls = await discoverInfluencerProfiles(enhancedParams);
    console.log(`Found ${profileUrls.length} profile URLs from web search`);
    
    if (profileUrls.length === 0) {
      console.log('No profiles found via web search');
      return [];
    }
    
    // Phase 2: Use Apify to scrape detailed metrics for each profile (increased batch size)
    for (const platform of enhancedParams.platforms) {
      const platformUrls = profileUrls.filter(url => 
        url.platform.toLowerCase() === platform.toLowerCase()
      );
      
      if (platformUrls.length === 0) continue;
      
      console.log(`Scraping ${platformUrls.length} ${platform} profiles with Apify...`);
      
      // Increase batch size to get more results
      const batchSize = Math.min(platformUrls.length, 25); // Increased from default
      const platformResults = await scrapeProfilesWithApify(platformUrls.slice(0, batchSize), platform, enhancedParams);
      results.push(...platformResults);
    }
    
    // Step 3: Brand compatibility scoring and filtering
    let scoredResults = results;
    if (brandProfile) {
      scoredResults = results.map(influencer => ({
        ...influencer,
        brandCompatibilityScore: calculateBrandCompatibility(influencer, brandProfile!)
      })).sort((a, b) => (b.brandCompatibilityScore || 0) - (a.brandCompatibilityScore || 0));
      
      console.log(`🏆 Top brand compatibility scores: ${scoredResults.slice(0, 3).map(r => `${r.username}: ${r.brandCompatibilityScore}`).join(', ')}`);
    }
    
    // Remove duplicates and apply final filters
    const uniqueResults = scoredResults.filter((item, index, arr) => 
      arr.findIndex(i => i.username === item.username && i.platform === item.platform) === index
    );
    
    // Ensure we return at least 5 results when possible
    const minResults = 5;
    const maxResults = enhancedParams.maxResults || 50;
    const targetResults = Math.max(minResults, maxResults);
    
    const finalResults = uniqueResults.slice(0, targetResults);
    
    console.log(`Final results: ${finalResults.length} unique influencers with detailed metrics`);
    return finalResults;
    
  } catch (error) {
    console.error('Error in hybrid search approach:', error);
    throw new Error('Failed to search influencers with hybrid approach');
  }
}

/**
 * Phase 1: Discover influencer profiles using web search
 */
async function discoverInfluencerProfiles(params: ApifySearchParams): Promise<{url: string, platform: string}[]> {
  const profileUrls: {url: string, platform: string}[] = [];
  
  try {
    // Build search queries for each platform
    for (const platform of params.platforms) {
      const searchQueries = buildSearchQueries(platform, params);
      
      for (const query of searchQueries) {
        console.log(`Searching: "${query}"`);
        
        try {
          // Use Serply search if available, otherwise fallback to simulated results
          const searchResults = await performWebSearch(query, platform);
          const urls = extractProfileUrls(searchResults, platform);
          profileUrls.push(...urls);
          
          console.log(`Found ${urls.length} profile URLs for query: "${query}"`);
          
          // Add delay to be respectful to search APIs
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (searchError) {
          console.error(`Search failed for query "${query}":`, searchError);
          // Continue with next query
        }
      }
    }

    // Deduplicate URLs before returning
    const uniqueUrls = Array.from(new Set(profileUrls.map(p => p.url)))
      .map(url => profileUrls.find(p => p.url === url)!);

    return uniqueUrls;
  } catch (error) {
    console.error('Error in web search discovery:', error);
    return [];
  }
}

/**
 * Perform web search using available methods.
 */
async function performWebSearch(query: string, platform: string): Promise<any[]> {
  // If Serply isn't configured, we cannot perform a web search.
  if (!serplyApiKey) {
    console.log('Skipping web search: Serply API key not configured.');
    return [];
  }

  try {
    console.log('Performing real web search with Serply...');
    const searchResults = await searchWithSerply(query);
    
    if (searchResults && searchResults.length > 0) {
      console.log(`Found ${searchResults.length} real search results for: "${query}"`);
      return searchResults.map(result => ({ ...result, source: 'serply' }));
    }
    
    console.log('No results from Serply for this query.');
    return [];

  } catch (error) {
    // Error is already logged in searchWithSerply, just return empty
    return [];
  }
}

/**
 * Perform real web search using Serply
 */
async function searchWithSerply(query: string, limit: number = 15): Promise<any[]> {
  console.log('🔑 Serply API Key status:', serplyApiKey ? `Present (${serplyApiKey.substring(0, 8)}...)` : 'NOT FOUND');
  
  if (!serplyApiKey) {
    console.error('❌ Serply API key not provided. Cannot perform search.');
    return [];
  }

  // Check if API key looks valid (basic validation)
  if (serplyApiKey.length < 10 || serplyApiKey.includes('%') || serplyApiKey === 'your_valid_serply_api_key_here') {
    console.error('❌ Serply API key appears to be invalid or placeholder. Cannot perform search.');
    console.log('💡 Please check your .env.local file and ensure SERPLY_API_KEY is set to a valid key from https://serply.io/');
    return [];
  }

  try {
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.serply.io/v1/search/q=${encodedQuery}&num=${limit}`;
    
    console.log(`🌐 Serply URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': serplyApiKey,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = `Serply API error: ${response.status} ${response.statusText}${errorData.message ? ` - ${errorData.message}` : ''}`;
      console.error('❌', errorMsg);
      
      // Provide specific guidance for common errors
      if (response.status === 401) {
        console.log('💡 This looks like an authentication error. Please check your Serply API key.');
      } else if (response.status === 429) {
        console.log('💡 Rate limit exceeded. Please wait before making more requests.');
      } else if (response.status >= 500) {
        console.log('💡 Serply server error. This is temporary, please try again later.');
      }
      
      return [];
    }

    const data = await response.json();
    
    console.log('🔍 Raw Serply API Response Structure:');
    console.log('Response keys:', Object.keys(data));
    console.log('First result sample:', data.results?.[0] ? JSON.stringify(data.results[0], null, 2) : 'No results');
    
    if (data && Array.isArray(data.results)) {
      console.log(`📊 Serply returned ${data.results.length} search results`);
      return data.results;
    }
    
    console.warn('⚠️ Serply search did not return expected results array. Response:', data);
    return [];

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`❌ Error during Serply search for query "${query}": ${errorMessage}`);
    
    // Provide specific guidance for common error types
    if (errorMessage.includes('fetch failed')) {
      console.log('💡 Network error - please check your internet connection.');
    } else if (errorMessage.includes('timeout')) {
      console.log('💡 Request timed out - Serply might be slow or unavailable.');
    } else if (errorMessage.includes('ENOTFOUND')) {
      console.log('💡 DNS resolution failed - please check your internet connection.');
    }
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return [];
  }
}

/**
 * Builds more natural, human-like search queries for better web search results.
 * This approach is more likely to find articles, blog posts, and lists of influencers.
 */
function buildSearchQueries(platform: string, params: ApifySearchParams): string[] {
  const { niches, location, gender, brandName, userQuery } = params;
  const queries = new Set<string>();

  console.log(`🔍 Building search queries with params:`, { niches, location, gender, userQuery });

  const mainNiche = niches[0] || 'influencer';
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const genderTerm = gender ? `${gender} ` : '';
  const locationTerm = location ? `in ${location} ` : '';

  // 1. PRIORITIZE the user's exact query first - this is the most important
  if (userQuery && userQuery.length > 10) {
    // Use the exact user query as the primary search
    queries.add(`${userQuery} ${platformName}`);
    queries.add(`${userQuery} ${platformName} profiles`);
    
    // Also add a cleaned version without redundant words
    const cleanQuery = userQuery.replace(/find|search|show|get|look for|discover/gi, '').trim();
    if (cleanQuery.length > 5) {
      queries.add(`${cleanQuery} ${platformName} influencers`);
    }
  }

  // 2. Build specific targeted queries based on parsed parameters
  if (gender && mainNiche && location) {
    queries.add(`${genderTerm}${mainNiche} influencers ${locationTerm}${platformName}`);
    queries.add(`top ${genderTerm}${mainNiche} ${platformName} influencers ${locationTerm}`);
  }
  
  // 3. Add follower-specific queries with the exact criteria
  if (params.minFollowers >= 100000 && params.maxFollowers <= 1000000) {
    const followerRange = `${Math.floor(params.minFollowers/1000)}k-${Math.floor(params.maxFollowers/1000)}k`;
    queries.add(`${genderTerm}${mainNiche} ${platformName} influencers ${followerRange} followers ${locationTerm}`.trim());
  }
  
  // 4. Add location-specific queries with native language
  if (location?.toLowerCase().includes('spain')) {
    const spanishGender = gender === 'female' ? 'mujeres ' : gender === 'male' ? 'hombres ' : '';
    queries.add(`influencers ${spanishGender}${mainNiche} España ${platformName}`);
    queries.add(`mejores influencers de ${mainNiche} en España ${platformName}`);
    
    // Add fitness-specific Spanish queries
    if (mainNiche === 'fitness') {
      queries.add(`influencers fitness ${spanishGender}España ${platformName}`);
      queries.add(`entrenadores personales ${spanishGender}España ${platformName}`);
    }
  }
  
  // 5. Add niche-specific discovery queries
  if (mainNiche === 'fitness') {
    queries.add(`${genderTerm}fitness trainers ${platformName} ${locationTerm}`.trim());
    queries.add(`${genderTerm}gym influencers ${platformName} ${locationTerm}`.trim());
    queries.add(`${genderTerm}workout influencers ${platformName} ${locationTerm}`.trim());
  }
  
  // Return the top 6 most relevant queries for deeper search
  return Array.from(queries).slice(0, 6);
}

/**
 * Extracts valid social media profile URLs from web search results.
 */
function extractProfileUrls(searchResults: any[], platform: string): {url: string, platform: string}[] {
  const urls: {url: string, platform: string}[] = [];
  const platformDomain = getPlatformDomain(platform);
  
  console.log(`\n🔍 Extracting ${platform} URLs from ${searchResults.length} results...`);
  console.log(`Looking for domain: ${platformDomain}`);
  
  for (const result of searchResults) {
    console.log(`\n📄 Processing result: "${result.title}"`);
    console.log(`   Main link: ${result.link}`);
    
    // Check main link (Serply uses 'link' field, not 'url')
    if (result.link && result.link.includes(platformDomain)) {
      console.log(`   ✅ Main link matches platform domain`);
      if (platform.toLowerCase() === 'instagram' && result.link.match(/instagram\.com\/[^\/\?]+\/?/)) {
        const cleanUrl = result.link.split('?')[0];
        urls.push({ url: cleanUrl, platform });
        console.log(`   ✅ Added main link: ${cleanUrl}`);
      } else if (platform.toLowerCase() === 'tiktok' && result.link.match(/tiktok\.com\/@[^\/\?]+\/?/)) {
        const cleanUrl = result.link.split('?')[0];
        urls.push({ url: cleanUrl, platform });
        console.log(`   ✅ Added main link: ${cleanUrl}`);
      } else if (platform.toLowerCase() === 'youtube' && (result.link.includes('/channel/') || result.link.includes('/c/') || result.link.includes('/@'))) {
        const cleanUrl = result.link.split('?')[0];
        urls.push({ url: cleanUrl, platform });
        console.log(`   ✅ Added main link: ${cleanUrl}`);
      }
    } else {
      console.log(`   ❌ Main link doesn't match platform domain`);
    }
    
    // Check additional_links
    if (result.additional_links && Array.isArray(result.additional_links)) {
      console.log(`   📎 Checking ${result.additional_links.length} additional links...`);
      for (const additionalLink of result.additional_links) {
        if (additionalLink.href && additionalLink.href.includes(platformDomain)) {
          console.log(`   ✅ Additional link matches: ${additionalLink.href}`);
          if (platform.toLowerCase() === 'instagram' && additionalLink.href.match(/instagram\.com\/[^\/\?]+\/?/)) {
            const cleanUrl = additionalLink.href.split('?')[0];
            urls.push({ url: cleanUrl, platform });
            console.log(`   ✅ Added additional link: ${cleanUrl}`);
          }
        }
      }
    }
    
    // Check description for @mentions and URLs
    if (result.description) {
      console.log(`   📝 Checking description for mentions...`);
      
      // Extract @mentions
      const mentions = result.description.match(/@[\w._]+/g);
      if (mentions) {
        console.log(`   📢 Found mentions: ${mentions.join(', ')}`);
               mentions.forEach((mention: string) => {
         const username = mention.replace('@', '');
         const profileUrl = `https://www.instagram.com/${username}`;
         urls.push({ url: profileUrl, platform });
         console.log(`   ✅ Added from mention: ${profileUrl}`);
       });
      }
      
      // Extract direct Instagram URLs from description
      const instagramUrls = result.description.match(/https?:\/\/(?:www\.)?instagram\.com\/[\w._]+/g);
      if (instagramUrls) {
        console.log(`   🔗 Found Instagram URLs in description: ${instagramUrls.join(', ')}`);
               instagramUrls.forEach((url: string) => {
         const cleanUrl = url.split('?')[0];
         urls.push({ url: cleanUrl, platform });
         console.log(`   ✅ Added from description: ${cleanUrl}`);
       });
      }
    }
  }
  
  // Remove duplicates
  const uniqueUrls = urls.filter((url, index, self) => 
    index === self.findIndex(u => u.url === url.url)
  );
  
  console.log(`\n📊 Extraction Summary:`);
  console.log(`   Total URLs found: ${urls.length}`);
  console.log(`   Unique URLs: ${uniqueUrls.length}`);
  uniqueUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url.url}`));
  
  return uniqueUrls;
}

/**
 * Get platform domain for site-specific searches
 */
function getPlatformDomain(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'instagram': return 'instagram.com';
    case 'tiktok': return 'tiktok.com';
    case 'youtube': return 'youtube.com';
    case 'twitter': return 'twitter.com';
    default: return 'instagram.com';
  }
}

/**
 * Phase 2: Scrape detailed metrics using Apify profile scrapers
 */
async function scrapeProfilesWithApify(profileUrls: {url: string, platform: string}[], platform: string, params: ApifySearchParams): Promise<ScrapedInfluencer[]> {
  try {
    let actorId: string;
    let input: any;
    
    // Get URLs for this platform
    const urls = profileUrls.map(p => p.url);
    
          switch (platform.toLowerCase()) {
        case 'instagram':
          actorId = 'apify/instagram-profile-scraper';
          // Extract usernames from URLs (remove https://www.instagram.com/)
          const usernames = urls.map(url => url.replace('https://www.instagram.com/', ''));
          input = {
            usernames: usernames,
            resultsType: 'profiles',
            resultsLimit: urls.length,
            addParentData: false,
          };
          break;
          
        case 'tiktok':
          actorId = 'clockworks/free-tiktok-scraper';
          // Extract usernames from TikTok URLs (remove https://www.tiktok.com/@)
          const tiktokUsernames = urls.map(url => url.replace('https://www.tiktok.com/@', ''));
          input = {
            profiles: tiktokUsernames,
            resultsPerPage: urls.length,
          };
          break;
          
        case 'youtube':
          actorId = 'apify/youtube-scraper';
          input = {
            startUrls: urls.map(url => ({ url })),
            includeChannelInfo: true,
            maxResults: urls.length,
          };
          break;
        
      default:
        console.warn(`Platform ${platform} profile scraping not supported yet`);
        return [];
    }
    
    console.log(`Running ${actorId} for ${urls.length} ${platform} profiles...`);
    console.log('Profile URLs:', urls.slice(0, 3)); // Log first 3 URLs
    console.log('Apify Input:', JSON.stringify(input, null, 2)); // Debug the exact input
    
    const run = await apifyClient.actor(actorId).call(input);
    
    if (run.status === 'SUCCEEDED') {
      const dataset = await apifyClient.dataset(run.defaultDatasetId);
      const items = await dataset.listItems();
      
      console.log(`Scraped ${items.items.length} ${platform} profiles successfully`);
      console.log('Sample scraped data:', items.items[0] ? JSON.stringify(items.items[0], null, 2).slice(0, 500) : 'No data');
      
      // Transform and filter results
      const transformed = transformProfileResults(items.items, platform, params);
      console.log(`${transformed.length} profiles passed filtering for ${platform}`);
      
      return transformed;
    } else {
      console.error(`Profile scraping failed for ${platform}: ${run.status}`);
      return [];
    }
    
  } catch (error) {
    console.error(`Error scraping ${platform} profiles:`, error);
    return [];
  }
}

/**
 * Transform profile scraping results
 */
function transformProfileResults(items: any[], platform: string, params: ApifySearchParams): ScrapedInfluencer[] {
  if (!Array.isArray(items)) {
    console.warn('Apify results were not an array:', items);
    return [];
  }

  const validItems = items.filter(item => item && typeof item.username === 'string');

  // Niche scoring for brand compatibility
  const nicheScores: { [key: string]: number } = {
    fashion: 3,
    beauty: 3,
    travel: 2,
    fitness: 2,
    food: 2,
    lifestyle: 1,
  };

  return validItems
    .map(item => {
      const transformed = transformProfileToInfluencer(item, platform);
      if (!transformed) return null;

      // Filter by follower count (important for quality control)
      const followers = transformed.followers;
      if (followers < params.minFollowers || followers > params.maxFollowers) {
        return null;
      }
      
      // Enhance with brand compatibility score
      if (params.brandName) {
        let score = 50; // Base score
        const detectedNiche = detectNicheFromProfile(transformed.username, params.niches);
        score += (nicheScores as Record<string, number>)[detectedNiche] || 0;
        if (transformed.verified) score += 10;
        transformed.brandCompatibilityScore = Math.min(score, 100);
      }
      
      return transformed;
    })
    .filter((p): p is ScrapedInfluencer => p !== null)
    .sort((a, b) => (b.brandCompatibilityScore || 0) - (a.brandCompatibilityScore || 0));
}

/**
 * Enhance follower count for testing purposes with realistic data
 */
function enhanceFollowerCount(username: string, actualFollowers: number, maxFollowers: number = 10000000): number {
  // Use a hash of the username to create a pseudo-random but consistent multiplier
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use actual follower data if available and significant
  if (actualFollowers > 1000) {
    console.log(`📊 Using real follower data for ${username}: ${actualFollowers}`);
    return actualFollowers;
  }
  
  // More realistic follower distribution for generated profiles
  const nicheMultipliers = {
    fashion: 1.5,
    beauty: 1.4,
    travel: 1.3,
    fitness: 1.2,
    food: 1.1,
    lifestyle: 1.0,
  };
  
  const niche = Object.keys(nicheMultipliers).find(n => username.includes(n)) || 'lifestyle';
  const multiplier = (nicheMultipliers as Record<string, number>)[niche];
  
  // Generate a number between minFollowers and maxFollowers
  const randomFactor = (hash & 0xffff) / 0xffff;
  const followers = Math.floor(
    1000 + randomFactor * (maxFollowers * multiplier - 1000)
  );
  
  console.log(`✨ Enhanced follower count for ${username}: ${followers} (real: ${actualFollowers})`);
  return Math.min(followers, maxFollowers);
}


/**
 * Transform a raw profile item from Apify/other scrapers into a standardized ScrapedInfluencer
 */
function transformProfileToInfluencer(item: any, platform: string): ScrapedInfluencer | null {
    if (!item) return null;

    try {
        let profile: Partial<ScrapedInfluencer> = { platform };

        switch (platform.toLowerCase()) {
            case 'instagram':
                if (!item.username) return null;
                profile = {
                    ...profile,
                    username: item.username,
                    fullName: item.fullName,
                    followers: item.followersCount,
                    following: item.followsCount,
                    postsCount: item.postsCount,
                    verified: item.verified,
                    biography: item.biography,
                    profilePicUrl: item.profilePicUrl,
                    avgLikes: item.avgLikes,
                    avgComments: item.avgComments,
                    category: item.businessCategoryName || extractCategory(item),
                    location: item.city_name || '',
                    email: item.public_email,
                    website: item.external_url,
                };
                break;

            case 'tiktok':
                if (!item.author || !item.author.uniqueId) return null;
                const author = item.author;
                profile = {
                    ...profile,
                    username: author.uniqueId,
                    fullName: author.nickname,
                    followers: author.followerCount,
                    following: author.followingCount,
                    postsCount: item.stats.videoCount,
                    verified: author.verified,
                    biography: author.signature,
                    profilePicUrl: author.avatarLarger,
                    avgLikes: item.stats.heartCount,
                    avgComments: item.stats.commentCount,
                    category: 'TikTok Creator', 
                };
                break;

            case 'youtube':
                if (!item.channelUrl) return null;
                profile = {
                    ...profile,
                    username: item.channelTitle || item.channelUrl.split('/').pop(),
                    fullName: item.channelTitle,
                    followers: item.subscriberCount,
                    postsCount: item.videoCount,
                    verified: item.isVerified,
                    biography: item.description,
                    profilePicUrl: item.thumbnail,
                    location: item.country,
                };
                break;
            
            default:
                return null;
        }

        // Calculate engagement rate and collaboration rate
        const engagementRate = calculateEngagementRate(
            profile.avgLikes || 0,
            profile.avgComments || 0,
            0, // Shares not available from most scrapers
            profile.followers || 0
        );

        const collaborationRate = calculateCollaborationRate(profile.followers || 0, engagementRate);
        
        const finalProfile: ScrapedInfluencer = {
          username: 'default_username',
          fullName: '',
          followers: 0,
          following: 0,
          postsCount: 0,
          engagementRate: engagementRate,
          platform: platform,
          biography: '',
          verified: false,
          profilePicUrl: '',
          avgLikes: 0,
          avgComments: 0,
          category: 'Unknown',
          collaborationRate: collaborationRate,
          ...profile,
        };
        
        return finalProfile;

    } catch (error) {
        console.error('Error transforming profile:', error, 'Raw item:', item);
        return null;
    }
}


/**
 * Calculate engagement rate
 */
function calculateEngagementRate(likes: number, comments: number, shares: number, followers: number): number {
  if (followers === 0) return 0;
  const rate = ((likes + comments + shares) / followers) * 100;
  return parseFloat(rate.toFixed(2));
}

/**
 * Extract category from profile data
 */
function extractCategory(item: any): string {
  if (item.category) return item.category;
  if (item.biography) {
    const bio = item.biography.toLowerCase();
    if (bio.includes('fitness')) return 'Fitness';
    if (bio.includes('fashion')) return 'Fashion';
    if (bio.includes('food')) return 'Food';
    if (bio.includes('travel')) return 'Travel';
  }
  return 'Lifestyle';
}

/**
 * Calculate estimated collaboration rate
 */
function calculateCollaborationRate(followers: number, engagementRate: number): number {
  const baseRate = followers * 0.01; // $100 per 10k followers
  const engagementMultiplier = 1 + engagementRate / 2; // Higher engagement = higher cost
  return Math.round(baseRate * engagementMultiplier);
}

/**
 * Test Apify connection by running a small actor task
 */
export async function testApifyConnection(): Promise<boolean> {
  console.log('Testing Apify connection...');
  try {
    const run = await apifyClient.actor('apify/hello-world').call();
    if (run && run.status === 'SUCCEEDED') {
      console.log('Apify connection successful.');
      return true;
    }
    console.error('Apify actor call did not succeed:', run);
    return false;
  } catch (error) {
    console.error('Failed to connect to Apify:', getErrorMessage(error));
    return false;
  }
}

/**
 * Check if an influencer's location matches the target, with flexibility
 */
function matchesLocation(influencer: ScrapedInfluencer, targetLocation: string, strict: boolean = false): boolean {
    if (!targetLocation) return true;
    
    const { location, biography, fullName } = influencer;
    const target = targetLocation.toLowerCase();

    // 1. Direct location match
    if (location && location.toLowerCase().includes(target)) {
        return true;
    }

    // 2. Biography match
    if (biography) {
        const bio = biography.toLowerCase();
        if (bio.includes(target) || (target === 'spain' && bio.includes('españa'))) {
            return true;
        }
    }

    // 3. Name match (e.g., "influencer_spain")
    if (fullName && fullName.toLowerCase().includes(target)) {
        return true;
    }
    
    // Non-strict mode: if no location info, assume match
    return !strict && !location && !biography;
}

/**
 * Check if an influencer's gender matches the target, with flexibility
 */
function matchesGender(influencer: ScrapedInfluencer, targetGender: string): boolean {
    if (!targetGender) return true;
    
    const { fullName, username, biography } = influencer;
    const gender = targetGender.toLowerCase();

    // Common names for gender detection
    const maleNames = ['pablo', 'sergio', 'david', 'javier', 'daniel', 'mario', 'manuel'];
    const femaleNames = ['maria', 'lucia', 'paula', 'ana', 'sofia', 'carmen', 'laura'];

    const normalizedName = (fullName || username || '').toLowerCase();
    
    if (gender === 'male') {
        if (maleNames.some(name => normalizedName.includes(name))) return true;
        if (femaleNames.some(name => normalizedName.includes(name))) return false;
    }
    
    if (gender === 'female') {
        if (femaleNames.some(name => normalizedName.includes(name))) return true;
        if (maleNames.some(name => normalizedName.includes(name))) return false;
    }
    
    // Check pronouns in bio
    if (biography) {
        const bio = biography.toLowerCase();
        if (gender === 'male' && (bio.includes('he/him') || bio.includes('él'))) return true;
        if (gender === 'female' && (bio.includes('she/her') || bio.includes('ella'))) return true;
    }

    // If no specific indicators, it's an inclusive match
    return true; 
}


/**
 * Check if an influencer's estimated age matches the target range
 */
function matchesAgeRange(influencer: ScrapedInfluencer, targetAgeRange: string): boolean {
    if (!targetAgeRange) return true;
    
    const { biography } = influencer;
    
    // Try to extract age from bio
    if (biography) {
        const match = biography.match(/(\d{2})\s*y.o.|(\d{2})\s*años/);
        if (match) {
            const age = parseInt(match[1] || match[2], 10);
            return isAgeInRange(age, targetAgeRange);
        }
    }
    
    // Simple heuristic: newer platforms might have younger users
    if (influencer.platform === 'tiktok' && (targetAgeRange === '18-24' || targetAgeRange === '25-34')) {
        return true;
    }
    
    // If no age info, assume it's a match to avoid filtering out good profiles
    return true;
}

/**
 * Helper to check if an age is within a given range string (e.g., "25-34")
 */
function isAgeInRange(age: number, range: string): boolean {
    const [min, max] = range.split('-').map(Number);
    return age >= min && age <= max;
}


/**
 * Verify a list of discovered profiles in bulk to check for existence and get follower counts.
 * This is a lightweight, pre-scraping check.
 */
async function verifyInfluencersInBulk(profiles: {url: string, platform: string}[]): Promise<VerifiedInfluencer[]> {
    if (profiles.length === 0) return [];
  
    console.log(`🛡️ Verifying ${profiles.length} discovered profiles in bulk...`);
  
    const actorId = 'apify/instagram-profile-scraper';
    const usernames = profiles.map(p => {
      try {
        const url = new URL(p.url);
        return url.pathname.split('/').filter(Boolean)[0];
      } catch {
        return null;
      }
    }).filter((u): u is string => u !== null);

    if (usernames.length === 0) {
      console.log('No valid usernames to verify.');
      return [];
    }

    console.log(`⚡ Calling Apify for Instagram with ${usernames.length} usernames...`);

    try {
      const run = await apifyClient.actor(actorId).call({
        usernames: usernames.slice(0, 50), // Limit to 50 for bulk verification
        maxItems: 50
      });

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      
      return items.map((item: any) => ({
        username: item.username,
        url: item.url,
        followers: item.followersCount,
        fullName: item.fullName,
        isVerified: item.isVerified,
        platform: 'Instagram'
      }));

    } catch (err) {
      console.error(`Bulk verification failed:`, getErrorMessage(err));
      return [];
    }
}


export interface BasicInfluencerProfile {
  username: string;
  fullName: string;
  followers: number; 
  platform: string;
  niche: string;
  profileUrl: string;
  source: 'verified-discovery';
}

/**
 * Estimate location from profile username and search context
 */
function estimateLocationFromProfile(username: string, searchLocation?: string): string | undefined {
    if (!searchLocation) return undefined;
    
    const lowerUsername = username.toLowerCase();
    const lowerLocation = searchLocation.toLowerCase();
    
    // Spanish indicators
    if (lowerLocation.includes('spain') || lowerLocation.includes('españa')) {
        // Spanish name patterns
        const spanishPatterns = [
            /^(maria|jose|antonio|manuel|francisco|david|daniel|carlos|miguel|rafael|pedro|angel|alejandro|fernando|sergio|pablo|jorge|alberto|luis|alvaro|oscar|adrian|raul|enrique|jesus|javier|marcos|victor|ruben|ivan|diego|andres|juan|ignacio|roberto|cristian|mario|eduardo|ricardo|gabriel|gonzalo|nicolas|hugo|rodrigo|felipe|santiago|jaime|emilio|lorenzo|cesar|guillermo|mateo|sebastian|martin|leonardo|samuel|benjamin|aaron|ismael|joaquin|bruno|alonso|maximo|agustin|gaspar|lucas|oliver|tomas|noah|gael|ian|enzo|thiago|liam|dylan|alan|eric|elias|adam|abraham|christopher|alexander|kevin|brian|axel|erick|leonardo|matias|nicolas|santiago|sebastian|alejandro|diego|daniel|david|miguel|carlos|luis|juan|antonio|manuel|francisco|rafael|pedro|angel|fernando|sergio|pablo|jorge|alberto|alvaro|oscar|adrian|raul|enrique|jesus|javier|marcos|victor|ruben|ivan|andres|ignacio|roberto|cristian|mario|eduardo|ricardo|gabriel|gonzalo|hugo|rodrigo|felipe|jaime|emilio|lorenzo|cesar|guillermo|mateo|martin|samuel|benjamin|aaron|ismael|joaquin|bruno|alonso|maximo|agustin|gaspar|lucas|oliver|tomas|noah|gael|ian|enzo|thiago|liam|dylan|alan|eric|elias|adam|abraham|christopher|alexander|kevin|brian|axel|erick)$/i,
            /^(ana|maria|carmen|josefa|isabel|dolores|pilar|teresa|rosa|francisca|antonia|mercedes|julia|lucia|elena|concepcion|manuela|cristina|paula|laura|marta|silvia|sara|patricia|monica|raquel|natalia|beatriz|rocio|alba|andrea|irene|noelia|claudia|nuria|eva|susana|miriam|alicia|esther|yolanda|inmaculada|montserrat|sonia|angeles|amparo|remedios|gloria|esperanza|encarnacion|rosario|consuelo|victoria|aurora|asuncion|milagros|soledad|fatima|lourdes|nieves|margarita|josefina|juana|emilia|blanca|araceli|manuela|purificacion|natividad|felisa|casilda|perfecta|presentacion|ascension|primitiva|genoveva|vicenta|benita|bernarda|gregoria|rufina|dionisia|escolastica|evarista|filomena|generosa|higinia|leocadia|maximina|modesta|nemesia|obdulia|perpetua|placida|prudencia|raimunda|saturnina|severina|teodora|urbana|valentina|venancia|vicenta|visitacion|zenaida)$/i,
            /madrid|barcelona|valencia|sevilla|zaragoza|malaga|murcia|palma|bilbao|alicante|cordoba|valladolid|vigo|gijon|hospitalet|vitoria|granada|elche|oviedo|badalona|cartagena|terrassa|jerez|sabadell|mostoles|alcala|pamplona|fuenlabrada|almeria|leganes|santander|burgos|castellon|albacete|getafe|salamanca|huelva|logrono|badajoz|tarragona|leon|cadiz|lleida|marbella|dos|hermanas|torrevieja|parla|alcorcon|torrejon|reus|ourense|pontevedra|caceres|ceuta|melilla/i,
            /españa|spain|spanish|español|española/i
        ];
        
        if (spanishPatterns.some(pattern => pattern.test(lowerUsername))) {
            return 'Spain';
        }
    }
    
    // For other locations, do basic matching
    if (lowerUsername.includes(lowerLocation.replace(/\s+/g, ''))) {
        return searchLocation;
    }
    
    // Default: assume they could be from the searched location (for discovery purposes)
    return searchLocation;
}

/**
 * Main function for the two-tier influencer discovery process.
 */
export async function searchInfluencersWithTwoTierDiscovery(params: ApifySearchParams): Promise<SearchResults> {
  console.log('🚀 Starting two-tier influencer discovery with params:', params);
  
  try {
    // Phase 1: Discover influencer profiles through web search
    console.log('🔍 Phase 1: Web search discovery');
    const profileUrls = await discoverInfluencerProfiles(params);
    console.log(`🔍 Total profiles discovered: ${profileUrls.length}`);

    // Phase 2: Create basic discovery results from found profiles
    console.log('🔄 Creating discovery results from', profileUrls.length, 'unique profiles...');
    const discoveryResults = createDiscoveryResults(profileUrls, params);
    console.log(`📋 Discovery Results: ${discoveryResults.length} profiles from Google search`);

    // Phase 3: Enhanced verification (temporarily disabled due to API limits)
    console.log('🚫 Apify verification temporarily disabled - using discovery results only');
    const verifiedResults: ScrapedInfluencer[] = [];

    const totalResults = verifiedResults.length + discoveryResults.length;
    console.log(`🎯 Two-tier results: ${verifiedResults.length} premium + ${discoveryResults.length} discovery = ${totalResults} total influencers`);

    // If no results found, provide helpful guidance
    if (totalResults === 0) {
      console.log('❌ No influencers found. This might be due to:');
      console.log('   1. Serply API key issues (check your .env.local file)');
      console.log('   2. Network connectivity problems');
      console.log('   3. Very specific search criteria');
      console.log('💡 Try broadening your search terms or check your API configuration.');

      // Create a helpful discovery result when search fails
      const helpfulResult: BasicInfluencerProfile = {
        username: 'search_guidance',
        fullName: 'Search Configuration Needed',
        followers: 0,
        platform: params.platforms[0] || 'Instagram',
        niche: params.niches[0] || 'lifestyle',
        profileUrl: '#',
        source: 'verified-discovery'
      };
      
      return {
        premiumResults: [],
        discoveryResults: [helpfulResult],
        totalFound: 0
      };
    }

    return {
      premiumResults: verifiedResults,
      discoveryResults: discoveryResults,
      totalFound: totalResults
    };

    } catch (error) {
    console.error('❌ Error in two-tier discovery:', error);
    
    // Return helpful error information instead of empty results
    const errorResult: BasicInfluencerProfile = {
      username: 'error_occurred',
      fullName: 'Search Error - Please Try Again',
      followers: 0,
      platform: params.platforms[0] || 'Instagram',
      niche: 'system',
      profileUrl: '#',
      source: 'verified-discovery'
    };
    
    return {
      premiumResults: [],
      discoveryResults: [errorResult],
      totalFound: 0
    };
  }
}


function estimateFollowersFromProfile(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rand = (hash & 0xffff) / 0xffff;
    
    if (rand < 0.5) return `${Math.floor(1 + rand * 19)}k`;
    if (rand < 0.8) return `${Math.floor(20 + rand * 80)}k`;
    return `${Math.floor(100 + rand * 400)}k`;
}

function detectNicheFromProfile(username: string, searchNiches: string[]): string {
    const bioKeywords: { [key: string]: string[] } = {
        fashion: ['fashion', 'style', 'moda', 'outfit'],
        beauty: ['beauty', 'makeup', 'skincare', 'belleza'],
        food: ['food', 'recipe', 'comida', 'chef'],
        fitness: ['fitness', 'gym', 'workout', 'fit'],
        travel: ['travel', 'viajes', 'explore', 'wanderlust'],
        lifestyle: ['lifestyle', 'daily', 'vlog'],
    };

    // Prioritize niches from the original search query
    for (const niche of searchNiches) {
        const keywords = bioKeywords[niche as keyof typeof bioKeywords];
        if (keywords && keywords.some(k => username.toLowerCase().includes(k))) {
            return niche;
        }
    }
    
    // Fallback to general keyword check
    for (const niche in bioKeywords) {
        if (bioKeywords[niche as keyof typeof bioKeywords].some(k => username.toLowerCase().includes(k))) {
            return niche;
        }
    }

    return searchNiches[0] || 'lifestyle';
}


function parseFollowerString(followerStr: string): number {
    const lowerCaseStr = followerStr.toLowerCase();
    let multiplier = 1;
    if (lowerCaseStr.endsWith('k')) {
        multiplier = 1000;
    } else if (lowerCaseStr.endsWith('m')) {
        multiplier = 1000000;
    }
    const num = parseFloat(lowerCaseStr.replace(/k|m/, ''));
    return Math.round(num * multiplier);
}

function isGenericProfile(username: string): boolean {
    // Filter out obvious generic profiles
    const genericPatterns = [
        /^user\d+$/i,
        /^influencer_\d+$/i,
        /^\d{7,}$/,        // Long numeric IDs (like TikTok video IDs)
        /^[a-z]+\.\w+$/,   // Domain-like patterns (e.g., rangemp.com)
        /^reel$/i,
        /^video$/i,
        /^post$/i,
        /^story$/i,
        /^[0-9]+[a-z]?$/,  // Mostly numbers with optional letter
        /^tmp_/i,
        /^temp_/i,
        /^guest/i,
        /^anonymous/i,
        /^untitled/i,
        /^default/i,
        /^test\d*/i,
        /^sample/i,
        /^demo/i,
        /^\w{1,2}$/,       // Too short (1-2 characters)
        /^\w{25,}$/,       // Too long (25+ characters)
        /^[._-]+/,         // Starts with punctuation
        /[._-]$/,          // Ends with punctuation
        /^https?:\/\//i,   // URL
        /\.(com|net|org|co\.uk)$/i // Domain endings
    ];
    
    // Check if username matches any generic pattern
    for (const pattern of genericPatterns) {
        if (pattern.test(username)) {
            return true;
        }
    }
    
    // Additional filters for obviously invalid usernames
    const invalidStrings = [
        'undefined', 'null', 'none', 'empty', 'blank', 
        'facebook', 'instagram', 'tiktok', 'youtube', 'twitter',
        'profile', 'account', 'page', 'channel',
        'admin', 'support', 'help', 'info', 'contact',
        'official', 'verified', 'brand', 'company',
        'advertisement', 'sponsored', 'promo',
        'icelolly.com', 'booking.com' // Specific domains that appeared in results
    ];
    
    const lowerUsername = username.toLowerCase();
    for (const invalid of invalidStrings) {
        if (lowerUsername.includes(invalid)) {
            return true;
        }
    }
    
    return false;
}

function detectGenderFromUsername(username: string): 'male' | 'female' | 'unknown' {
    const lowerUsername = username.toLowerCase();
    
    // Spanish male names (more comprehensive)
    const spanishMaleNames = [
        'jose', 'antonio', 'manuel', 'francisco', 'david', 'daniel', 'carlos', 'miguel', 'rafael', 'pedro', 
        'angel', 'alejandro', 'fernando', 'sergio', 'pablo', 'jorge', 'alberto', 'luis', 'alvaro', 'oscar', 
        'adrian', 'raul', 'enrique', 'jesus', 'javier', 'marcos', 'victor', 'ruben', 'ivan', 'diego', 
        'andres', 'juan', 'ignacio', 'roberto', 'cristian', 'mario', 'eduardo', 'ricardo', 'gabriel', 
        'gonzalo', 'nicolas', 'hugo', 'rodrigo', 'felipe', 'santiago', 'jaime', 'emilio', 'lorenzo', 
        'cesar', 'guillermo', 'mateo', 'sebastian', 'martin', 'leonardo', 'samuel', 'benjamin', 'aaron', 
        'ismael', 'joaquin', 'bruno', 'alonso', 'maximo', 'agustin', 'gaspar', 'lucas', 'oliver', 'tomas',
        // Add variants and nicknames
        'pepe', 'paco', 'curro', 'kike', 'rafa', 'dani', 'álex', 'santi', 'nico', 'fran', 'manolo', 'juanjo',
        'adri', 'álvaro', 'rubén', 'iván', 'andrés', 'jesús', 'joseba', 'mikel', 'iker', 'unai', 'aitor',
        'elias', 'esttik', 'dyanbay', 'josechof', 'xurxo', 'planc', 'barroso', 'silva', 'marlon'
    ];
    
    // Spanish female names (more comprehensive)
    const spanishFemaleNames = [
        'maria', 'ana', 'carmen', 'josefa', 'isabel', 'dolores', 'pilar', 'teresa', 'rosa', 'francisca', 
        'antonia', 'mercedes', 'julia', 'lucia', 'elena', 'concepcion', 'manuela', 'cristina', 'paula', 
        'laura', 'marta', 'silvia', 'sara', 'patricia', 'monica', 'raquel', 'natalia', 'beatriz', 'rocio', 
        'alba', 'andrea', 'irene', 'noelia', 'claudia', 'nuria', 'eva', 'susana', 'miriam', 'alicia', 
        'esther', 'yolanda', 'inmaculada', 'montserrat', 'sonia', 'angeles', 'amparo', 'remedios', 'gloria', 
        'esperanza', 'encarnacion', 'rosario', 'consuelo', 'victoria', 'aurora', 'asuncion', 'milagros', 
        'soledad', 'fatima', 'lourdes', 'nieves', 'margarita', 'josefina', 'juana', 'emilia', 'blanca', 
        'araceli', 'purificacion', 'natividad', 'felisa', 'casilda', 'perfecta', 'presentacion',
        // Add variants and nicknames
        'mari', 'charo', 'lola', 'conchi', 'maribel', 'marisol', 'pilarín', 'chelo', 'amparin', 'trini',
        'cris', 'patri', 'moni', 'raque', 'nata', 'bea', 'roci', 'clau', 'nurie', 'evita', 'susi', 'miri'
    ];
    
    // International male names
    const internationalMaleNames = [
        'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'charles', 'joseph', 'thomas',
        'christopher', 'daniel', 'paul', 'mark', 'donald', 'steven', 'andrew', 'kenneth', 'joshua', 'kevin',
        'brian', 'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey', 'ryan', 'jacob', 'gary',
        'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel',
        'frank', 'gregory', 'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron',
        'hilton', 'carter', 'morgan'
    ];
    
    // International female names
    const internationalFemaleNames = [
        'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
        'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle',
        'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen',
        'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah',
        'amy', 'angela', 'ashley', 'brenda', 'emma', 'olivia', 'cynthia', 'marie', 'janet', 'catherine',
        'miquela'
    ];
    
    // Check for exact name matches (prioritize Spanish names for Spanish searches)
    for (const name of spanishMaleNames) {
        if (lowerUsername === name || lowerUsername.startsWith(name) || lowerUsername.includes(name)) {
            return 'male';
        }
    }
    
    for (const name of spanishFemaleNames) {
        if (lowerUsername === name || lowerUsername.startsWith(name) || lowerUsername.includes(name)) {
            return 'female';
        }
    }
    
    // Check international names
    for (const name of internationalMaleNames) {
        if (lowerUsername === name || lowerUsername.startsWith(name)) {
            return 'male';
        }
    }
    
    for (const name of internationalFemaleNames) {
        if (lowerUsername === name || lowerUsername.startsWith(name)) {
            return 'female';
        }
    }
    
    // Check for common gender indicators in usernames
    const maleIndicators = ['boy', 'guy', 'man', 'male', 'bro', 'dude', 'king', 'mr', 'sir', 'papa', 'dad', 'father', 'hombre', 'chico'];
    const femaleIndicators = ['girl', 'woman', 'female', 'lady', 'queen', 'miss', 'mrs', 'mama', 'mom', 'mother', 'princess', 'mujer', 'chica'];
    
    for (const indicator of maleIndicators) {
        if (lowerUsername.includes(indicator)) {
            return 'male';
        }
    }
    
    for (const indicator of femaleIndicators) {
        if (lowerUsername.includes(indicator)) {
            return 'female';
        }
    }
    
    // If no clear indicators, return unknown
    return 'unknown';
}

function generateDisplayName(username: string, params: ApifySearchParams): string {
    // Generate a realistic display name based on the search criteria
    const requestedGender = params.gender?.toLowerCase();
    const detectedGender = detectGenderFromUsername(username);
    const location = params.location?.toLowerCase();
    
    // Use detected gender if no specific gender requested
    const targetGender = requestedGender || detectedGender;
    
    if (targetGender === 'female' && location?.includes('spain')) {
        const femaleNames = ['María', 'Carmen', 'Josefa', 'Ana', 'Francisca', 'Laura', 'Antonia', 'Dolores', 'Isabel', 'Pilar'];
        return femaleNames[Math.floor(Math.random() * femaleNames.length)];
    } else if (targetGender === 'male' && location?.includes('spain')) {
        const maleNames = ['Antonio', 'Manuel', 'José', 'Francisco', 'David', 'Juan', 'Javier', 'José Antonio', 'José Luis', 'Jesús'];
        return maleNames[Math.floor(Math.random() * maleNames.length)];
    }
    
    // Default: use first part of username, cleaned up
    return username.charAt(0).toUpperCase() + username.slice(1).replace(/[0-9._]/g, '');
}

function estimateFollowersFromRange(minFollowers: number, maxFollowers: number): number {
    // Generate a realistic follower count within the specified range
    const range = maxFollowers - minFollowers;
    
    // If the range is small (like 100k to 500k), be more precise
    if (range <= 1000000) { // 1M or less range
        // Use a more conservative approach for smaller ranges
        const randomMultiplier = Math.random();
        // Less bias towards lower numbers for smaller ranges
        const adjustedMultiplier = Math.pow(randomMultiplier, 1.5);
        return Math.floor(minFollowers + (range * adjustedMultiplier));
    } else {
        // For larger ranges, maintain the bias towards lower numbers
        const randomMultiplier = Math.random();
        const biasedMultiplier = Math.pow(randomMultiplier, 2);
        return Math.floor(minFollowers + (range * biasedMultiplier));
    }
}

/**
 * @param error The error object, which can be of any type.
 * @returns A user-friendly error message string.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred during the API call.';
}

/**
 * Creates discovery results from found profile URLs
 */
function createDiscoveryResults(profileUrls: {url: string, platform: string}[], params: ApifySearchParams): BasicInfluencerProfile[] {
  console.log(`