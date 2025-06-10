import { NextResponse } from 'next/server';
import { searchInfluencersWithApify, testApifyConnection, type ApifySearchParams } from '@/lib/apifyService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      platforms, 
      niches, 
      minFollowers, 
      maxFollowers, 
      location, 
      verified = false, 
      maxResults = 50,
      gender,
      ageRange,
      strictLocationMatch = false
    } = body;

    // Validate required fields
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Platforms array is required' },
        { status: 400 }
      );
    }

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      return NextResponse.json(
        { error: 'Niches array is required' },
        { status: 400 }
      );
    }

    // Skip connection test to avoid memory limits
    console.log('Proceeding with search (connection test disabled)');

    const searchParams: ApifySearchParams = {
      platforms,
      niches,
      minFollowers: minFollowers || 1000,
      maxFollowers: maxFollowers || 1000000,
      location,
      verified,
      maxResults,
      gender,
      ageRange,
      strictLocationMatch,
    };

    console.log('Starting Apify search with params:', searchParams);

    const results = await searchInfluencersWithApify(searchParams);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      searchParams,
    });

  } catch (error) {
    console.error('Error in /api/search-apify:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search influencers', 
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
    message: 'Apify service ready (connection test disabled to avoid memory limits)',
  });
} 