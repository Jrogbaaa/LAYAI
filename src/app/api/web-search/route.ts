import { NextRequest, NextResponse } from 'next/server';
import { getWebSearchBreaker, CircuitBreakerOpenError } from '@/lib/circuitBreaker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 5, type = 'brand' } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Web search for ${type} research: "${query}"`);

    const serplyApiKey = process.env.SERPLY_API_KEY;
    if (!serplyApiKey) {
      console.log('⚠️ SERPLY_API_KEY not configured, using fallback data');
      
      // Return fallback data when API key is not available
      const fallbackData = type === 'influencer' 
        ? generateFallbackInfluencerData(query)
        : generateFallbackBrandData(query);
      
      return NextResponse.json({
        success: true,
        results: fallbackData,
        source: 'fallback'
      });
    }

    const webSearchBreaker = getWebSearchBreaker();

    try {
      const results = await webSearchBreaker.executeWithTimeout(async () => {
      // Use correct Serply API endpoint format from official documentation
      const searchUrl = `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}&num=${limit}&gl=us&hl=en`;

      console.log(`🌐 Making Serply API request to: ${searchUrl}`);

      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
      headers: {
        'X-API-KEY': serplyApiKey,
          'User-Agent': 'LAYAI/1.0',
      },
      });

      console.log(`📡 Serply API response status: ${searchResponse.status}`);

    if (!searchResponse.ok) {
        throw new Error(`Serply API error: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
      console.log(`✅ Serply API response received:`, JSON.stringify(searchData, null, 2));
    
    if (searchData.results && searchData.results.length > 0) {
          const processedResults = searchData.results.slice(0, limit).map((result: any) => ({
        title: result.title || '',
        description: result.description || result.snippet || '',
        url: result.link || result.url || '',
          domain: result.cite?.domain || new URL(result.link || result.url || 'https://example.com').hostname,
      }));

          console.log(`✅ Successfully processed ${processedResults.length} Serply results`);
          return processedResults;
        } else {
          throw new Error('No results found in Serply response');
        }
      }, 30000, async () => {
        // Fallback when circuit breaker is open
        console.log('🔄 Web search circuit breaker fallback');
        return type === 'influencer' 
          ? generateFallbackInfluencerData(query)
          : generateFallbackBrandData(query);
      });
      
      return NextResponse.json({
        success: true,
        results,
          source: 'serply'
      });

    } catch (serplyError) {
      if (serplyError instanceof CircuitBreakerOpenError) {
        console.log('⚡ Web search blocked by circuit breaker - using fallback');
        const fallbackData = type === 'influencer' 
          ? generateFallbackInfluencerData(query)
          : generateFallbackBrandData(query);
        
        return NextResponse.json({
          success: true,
          results: fallbackData,
          source: 'circuit-breaker-fallback',
          note: 'Search service temporarily unavailable'
        });
      }
      console.error('❌ Serply API failed:', serplyError);
      
      // Fallback to local data when Serply fails
      console.log('🔄 Using fallback data due to Serply failure');
      const fallbackData = type === 'influencer' 
        ? generateFallbackInfluencerData(query)
        : generateFallbackBrandData(query);
      
      return NextResponse.json({
        success: true,
        results: fallbackData,
        source: 'fallback',
        note: 'Serply API unavailable, using fallback data'
      });
    }

  } catch (error) {
    console.error('❌ Web search error:', error);
    return NextResponse.json(
      { success: false, error: 'Web search failed' },
      { status: 500 }
    );
  }
}

function generateFallbackBrandData(query: string) {
  const brands: { [key: string]: any } = {
    'coke': {
      title: 'Coca-Cola Official Website',
      description: 'The Coca-Cola Company is a beverage corporation and manufacturer, retailer, and marketer of non-alcoholic beverage concentrates and syrups.',
      url: 'https://www.coca-cola.com',
      domain: 'coca-cola.com'
    },
    'coca-cola': {
      title: 'Coca-Cola Official Website', 
      description: 'The Coca-Cola Company is a beverage corporation and manufacturer, retailer, and marketer of non-alcoholic beverage concentrates and syrups.',
      url: 'https://www.coca-cola.com',
      domain: 'coca-cola.com'
    },
    'nike': {
      title: 'Nike Official Website',
      description: 'Nike, Inc. is an American multinational corporation that designs, develops, manufactures, and markets footwear, apparel, equipment, accessories, and services.',
      url: 'https://www.nike.com',
      domain: 'nike.com'
    },
    'adidas': {
      title: 'Adidas Official Website',
      description: 'Adidas AG is a German multinational corporation that designs and manufactures shoes, clothing and accessories.',
      url: 'https://www.adidas.com',
      domain: 'adidas.com'
    }
  };

  const queryLower = query.toLowerCase();
  const brandData = brands[queryLower] || {
    title: `${query} Official Website`,
    description: `${query} is a leading brand in their industry, known for quality products and innovative marketing.`,
    url: `https://www.${query.toLowerCase().replace(/\s+/g, '')}.com`,
    domain: `${query.toLowerCase().replace(/\s+/g, '')}.com`
  };

  return [brandData];
}

function generateFallbackInfluencerData(query: string) {
  // Enhanced fallback data for specific influencers
  const queryLower = query.toLowerCase();
  
  // Specific influencer fallback data
  if (queryLower.includes('taylor swift')) {
    return [{
      title: 'Taylor Swift - Global Music Superstar',
      description: 'Taylor Swift is a Grammy-winning singer-songwriter and global music icon. Known for record-breaking album releases, massive fanbase loyalty, and cultural influence across generations.',
      url: 'https://www.taylorswift.com',
      domain: 'taylorswift.com'
    }];
  }
  
  if (queryLower.includes('cristiano ronaldo')) {
    return [{
      title: 'Cristiano Ronaldo - Football Legend',
      description: 'Cristiano Ronaldo is a Portuguese professional footballer and global sports icon. Known for his philanthropic efforts, business ventures, and massive social media influence.',
      url: 'https://www.instagram.com/cristiano',
      domain: 'instagram.com'
    }];
  }
  
  if (queryLower.includes('kylie jenner')) {
    return [{
      title: 'Kylie Jenner - Beauty Mogul',
      description: 'Kylie Jenner is a beauty entrepreneur and social media influencer. Known for her cosmetics empire, trendsetting style, and massive young demographic following.',
      url: 'https://www.kyliecosmetics.com',
      domain: 'kyliecosmetics.com'
    }];
  }
  
  // Generic fallback for other influencers
  const influencerData = {
    title: `${query} - Social Media Profile Research`,
    description: `${query} is a content creator and influencer with a strong social media presence. Known for engaging content and authentic brand partnerships.`,
    url: `https://www.instagram.com/${query.toLowerCase().replace(/\s+/g, '')}`,
    domain: 'instagram.com'
  };

  return [influencerData];
} 