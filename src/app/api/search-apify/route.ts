import { NextRequest, NextResponse } from 'next/server';
import { searchInfluencersWithTwoTierDiscovery, type ApifySearchParams } from '@/lib/apifyService';
import { searchMemory } from '@/lib/database';

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
      maxResults = 50
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

    // Save search to memory for learning
    const searchId = searchMemory.saveSearch({
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      query: userQuery,
      searchParams: {
        platforms,
        niches,
        minFollowers,
        maxFollowers,
        location,
        gender,
        userQuery,
      },
      results: {
        totalFound: searchResults.totalFound,
        premiumResults: searchResults.premiumResults,
        discoveryResults: searchResults.discoveryResults,
      },
    });

    console.log(`💾 Saved search with ID: ${searchId}`);

    return NextResponse.json({
      success: true,
      premiumResults: searchResults.premiumResults,
      discoveryResults: searchResults.discoveryResults,
      totalFound: searchResults.totalFound,
      searchId, // Return searchId for feedback
      metadata: {
        totalFound: searchResults.totalFound,
        premiumCount: searchResults.premiumResults.length,
        discoveryCount: searchResults.discoveryResults.length,
        searchParams: { platforms, niches, minFollowers, maxFollowers, location, gender },
      }
    });

  } catch (error) {
    console.error('Search error:', error);
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