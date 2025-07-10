import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithTwoTierDiscovery, type ApifySearchParams, type SearchResults } from '@/lib/apifyService';
import { searchMemory } from '@/lib/database';

/**
 * Final deduplication across premium and discovery results
 */
function deduplicateSearchResults(results: SearchResults): SearchResults {
  const allUsernames = new Set<string>();
  const finalPremiumResults = [];
  const finalDiscoveryResults = [];
  
  // Process premium results first (higher priority)
  for (const premiumResult of results.premiumResults) {
    const normalizedUsername = premiumResult.username.toLowerCase().replace(/[._-]/g, '');
    const platformKey = `${normalizedUsername}_${premiumResult.platform.toLowerCase()}`;
    
    if (!allUsernames.has(platformKey)) {
      allUsernames.add(platformKey);
      finalPremiumResults.push(premiumResult);
    } else {
      console.log(`🔍 Removed premium duplicate: ${premiumResult.username}`);
    }
  }
  
  // Process discovery results, excluding those already in premium
  for (const discoveryResult of results.discoveryResults) {
    const normalizedUsername = discoveryResult.username.toLowerCase().replace(/[._-]/g, '');
    const platformKey = `${normalizedUsername}_${discoveryResult.platform.toLowerCase()}`;
    
    if (!allUsernames.has(platformKey)) {
      allUsernames.add(platformKey);
      finalDiscoveryResults.push(discoveryResult);
    } else {
      console.log(`🔍 Removed discovery duplicate: ${discoveryResult.username}`);
    }
  }
  
  return {
    premiumResults: finalPremiumResults,
    discoveryResults: finalDiscoveryResults,
    totalFound: finalPremiumResults.length + finalDiscoveryResults.length
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      platforms = ['instagram'], 
      niches = [], 
      minFollowers = 0, 
      maxFollowers = 10000000, 
      location, 
      gender,
      sessionId,
      userId,
      userQuery = '',
      specificHandle,
      verified = false,
      maxResults = 30, // Reduced from 50 to prevent UI overload
      campaignId,
      campaignStatus,
      brandName
    } = body;

    console.log('🔍 Search request:', { platforms, niches, minFollowers, maxFollowers, location, gender, specificHandle });

    // Enhance search query for specific handles
    let enhancedQuery = userQuery;
    if (specificHandle) {
      enhancedQuery = `${specificHandle} ${platforms[0]} influencer profile followers engagement rate`;
      console.log(`🎯 Searching for specific handle: ${specificHandle}`);
    }

    const searchParams: ApifySearchParams = {
      platforms,
      niches,
      minFollowers,
      maxFollowers,
      location,
      gender,
      verified,
      maxResults,
      userQuery: enhancedQuery,
      specificHandle, // Pass through for targeted search
    };

    // Perform the search
    const searchResults = await searchInfluencersWithTwoTierDiscovery(searchParams);

    // Final deduplication check across both result types
    const finalResults = deduplicateSearchResults(searchResults);
    console.log(`🔍 Final deduplication: ${searchResults.totalFound} → ${finalResults.totalFound} results`);

    // Save search to memory with campaign context (fix userId issue)
    const searchId = await searchMemory.saveSearch({
      userId: userId || `user_${sessionId || Date.now()}`, // Provide fallback userId
      sessionId: sessionId || `session_${Date.now()}`,
      query: userQuery,
      searchParams: {
        platforms,
        niches,
        minFollowers,
        maxFollowers,
        location: location || undefined,
        gender: gender || undefined,
        userQuery,
      },
      results: {
        totalFound: finalResults.totalFound,
        premiumResults: finalResults.premiumResults,
        discoveryResults: finalResults.discoveryResults,
      },
      campaignId: campaignId || undefined,
      campaignStatus: campaignStatus || undefined,
      brandName: brandName || undefined,
    });

         // Get campaign-aware learning insights
     const insights = await searchMemory.getLearningInsights(
       userQuery || '',
       {
         brandName: brandName || undefined,
         activeCampaigns: campaignId ? [campaignId] : undefined,
       }
     );

    console.log(`💾 Saved search with ID: ${searchId}`);
    console.log('✅ Search completed and saved to memory with campaign context');
    console.log('🧠 Learning insights:', insights.campaignSpecificInsights);

    return NextResponse.json({
      success: true,
      premiumResults: finalResults.premiumResults,
      discoveryResults: finalResults.discoveryResults,
      totalFound: finalResults.totalFound,
      searchId, // Return searchId for feedback
      learningInsights: insights.campaignSpecificInsights || [],
      metadata: {
        totalFound: finalResults.totalFound,
        premiumCount: finalResults.premiumResults.length,
        discoveryCount: finalResults.discoveryResults.length,
        searchParams: { platforms, niches, minFollowers, maxFollowers, location, gender },
        originalTotal: searchResults.totalFound,
        duplicatesRemoved: searchResults.totalFound - finalResults.totalFound
      }
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
    return NextResponse.json({
      success: true,
    apifyConfigured: true,
    message: 'Apify service ready with two-tier discovery system',
  });
} 