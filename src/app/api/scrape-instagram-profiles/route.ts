import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handles } = body;

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No handles provided' },
        { status: 400 }
      );
    }

    console.log(`🎯 Scraping ${handles.length} Instagram profiles:`, handles);

    // Clean and validate handles
    const cleanHandles = handles.map(handle => {
      let cleanHandle = handle.trim();
      
      // Remove @ symbol if present
      cleanHandle = cleanHandle.replace(/^@/, '');
      
      // Extract username from Instagram URLs
      if (cleanHandle.includes('instagram.com/')) {
        const match = cleanHandle.match(/instagram\.com\/([^\/\?]+)/);
        cleanHandle = match ? match[1] : cleanHandle;
      }
      
      return cleanHandle;
    }).filter(handle => handle.length > 0);

    console.log(`📝 Cleaned handles:`, cleanHandles);

    if (cleanHandles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid handles found' },
        { status: 400 }
      );
    }

    // Use Apify Instagram Profile Scraper
    const actorId = 'apify/instagram-profile-scraper';
    
    console.log(`🚀 Starting Apify Instagram Profile Scraper for ${cleanHandles.length} profiles...`);

    const run = await apifyClient.actor(actorId).call({
      usernames: cleanHandles,
      resultsType: 'profiles',
      resultsLimit: cleanHandles.length,
      searchType: 'user',
      searchLimit: 1,
    });

    console.log(`⏳ Apify run started with ID: ${run.id}`);

    // Get the results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`📊 Apify returned ${items.length} profile results`);

    // Transform Apify results to our format
    const transformedResults = items.map((item: any) => {
      console.log(`🔄 Processing profile: ${item.username}`);
      
      return {
        id: `apify_${item.username}_${Date.now()}`,
        username: item.username,
        fullName: item.fullName || item.username,
        followers: item.followersCount || 0,
        following: item.followsCount || 0,
        postsCount: item.postsCount || 0,
        engagementRate: calculateEngagementRate(item),
        platform: 'Instagram',
        biography: item.biography || '',
        verified: item.isVerified || false,
        profilePicUrl: item.profilePicUrl || '',
        avgLikes: item.avgLikes || 0,
        avgComments: item.avgComments || 0,
        category: item.businessCategoryName || detectCategoryFromBio(item.biography || ''),
        location: item.city || item.country || '',
        email: item.publicEmail || '',
        website: item.externalUrl || '',
        collaborationRate: calculateCollaborationRate(item.followersCount || 0),
        brandCompatibilityScore: calculateBrandCompatibilityScore(item),
        url: `https://instagram.com/${item.username}`,
        source: 'apify-scraper',
        scrapedAt: new Date().toISOString(),
      };
    });

    console.log(`✅ Successfully transformed ${transformedResults.length} profiles`);

    return NextResponse.json({
      success: true,
      profiles: transformedResults,
      totalFound: transformedResults.length,
      source: 'apify-instagram-scraper',
      scrapedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Instagram scraping error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape Instagram profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateEngagementRate(profile: any): number {
  const followers = profile.followersCount || 0;
  const avgLikes = profile.avgLikes || 0;
  const avgComments = profile.avgComments || 0;
  
  if (followers === 0) return 0;
  
  const totalEngagement = avgLikes + avgComments;
  const engagementRate = (totalEngagement / followers) * 100;
  
  // Cap at reasonable maximum (20%)
  return Math.min(engagementRate, 20);
}

function detectCategoryFromBio(bio: string): string {
  const categories = {
    'fitness': ['fitness', 'gym', 'workout', 'training', 'health', 'muscle', 'bodybuilding'],
    'fashion': ['fashion', 'style', 'outfit', 'designer', 'model', 'beauty'],
    'food': ['food', 'chef', 'cooking', 'recipe', 'restaurant', 'culinary'],
    'travel': ['travel', 'wanderlust', 'adventure', 'explore', 'journey'],
    'lifestyle': ['lifestyle', 'life', 'daily', 'inspiration', 'motivation'],
    'tech': ['tech', 'technology', 'developer', 'coding', 'startup'],
    'business': ['entrepreneur', 'business', 'ceo', 'founder', 'company'],
    'entertainment': ['actor', 'musician', 'artist', 'entertainment', 'performer'],
    'sports': ['athlete', 'sports', 'football', 'basketball', 'soccer', 'tennis'],
  };
  
  const lowerBio = bio.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerBio.includes(keyword))) {
      return category;
    }
  }
  
  return 'lifestyle';
}

function calculateCollaborationRate(followers: number): number {
  // Base rate calculation based on follower count
  if (followers < 10000) return 50; // $50 for micro-influencers
  if (followers < 100000) return Math.floor(followers / 100); // ~$100-1000
  if (followers < 1000000) return Math.floor(followers / 50); // ~$2000-20000
  return Math.floor(followers / 25); // $40000+ for mega-influencers
}

function calculateBrandCompatibilityScore(profile: any): number {
  let score = 50; // Base score
  
  // Boost for verification
  if (profile.isVerified) score += 20;
  
  // Boost for good engagement
  const engagementRate = calculateEngagementRate(profile);
  if (engagementRate > 3) score += 15;
  if (engagementRate > 6) score += 10;
  
  // Boost for complete profile
  if (profile.biography && profile.biography.length > 50) score += 10;
  if (profile.externalUrl) score += 5;
  if (profile.publicEmail) score += 5;
  
  // Boost for active posting
  if (profile.postsCount > 100) score += 10;
  
  return Math.min(score, 100);
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Instagram Profile Scraper API ready',
    supportedPlatforms: ['Instagram'],
  });
} 