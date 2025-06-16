import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 5 } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Web search for brand research: "${query}"`);

    const serplyApiKey = process.env.SERPLY_API_KEY;
    if (!serplyApiKey || serplyApiKey.includes('%') || serplyApiKey.length < 10) {
      console.error('❌ Invalid or missing SERPLY_API_KEY');
      return NextResponse.json(
        { success: false, error: 'Search service unavailable' },
        { status: 500 }
      );
    }

    const searchResponse = await fetch('https://api.serply.io/v1/search/q', {
      method: 'POST',
      headers: {
        'X-API-KEY': serplyApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        location: 'Spain',
        hl: 'es',
        num: limit,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Serply API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const results = searchData.results.map((result: any) => ({
        title: result.title || '',
        description: result.description || result.snippet || '',
        url: result.link || result.url || '',
      }));

      console.log(`✅ Found ${results.length} search results for brand research`);
      
      return NextResponse.json({
        success: true,
        results,
        query,
      });
    } else {
      console.log('⚠️ No search results found');
      return NextResponse.json({
        success: false,
        error: 'No search results found',
        results: [],
      });
    }

  } catch (error) {
    console.error('❌ Web search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
      },
      { status: 500 }
    );
  }
} 