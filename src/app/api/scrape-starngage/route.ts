import { NextRequest, NextResponse } from 'next/server';
import { starngageService } from '@/lib/starngageService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const username = searchParams.get('username');
    const country = searchParams.get('country') || 'spain';
    const category = searchParams.get('category') || 'celebrities';
    const platform = searchParams.get('platform') || 'instagram';
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log(`🔍 StarNgage API called with action: ${action}`);

    switch (action) {
      case 'list':
        console.log(`📋 Scraping influencer list for ${country}/${category}`);
        const influencers = await starngageService.scrapeInfluencerList(
          country,
          category,
          platform,
          limit
        );
        
        // If real scraping fails, provide mock data
        if (influencers.length === 0) {
          console.log('🔄 Real scraping failed, using mock influencer list');
          const mockInfluencers = [
            {
              name: 'Eva Jarit',
              username: 'evajarit',
              followers: 2100000,
              engagementRate: 3.25,
              country: 'spain',
              topics: ['Fashion', 'Lifestyle', 'Beauty'],
              profileUrl: 'https://starngage.com/plus/en-us/influencers/instagram/evajarit'
            },
            {
              name: 'María Pombo',
              username: 'mariapombo',
              followers: 1800000,
              engagementRate: 4.1,
              country: 'spain',
              topics: ['Lifestyle', 'Fashion', 'Travel'],
              profileUrl: 'https://starngage.com/plus/en-us/influencers/instagram/mariapombo'
            },
            {
              name: 'Dulceida',
              username: 'dulceida',
              followers: 2900000,
              engagementRate: 2.8,
              country: 'spain',
              topics: ['Fashion', 'LGBTQ+', 'Lifestyle'],
              profileUrl: 'https://starngage.com/plus/en-us/influencers/instagram/dulceida'
            }
          ];
          
          return NextResponse.json({
            success: true,
            data: mockInfluencers,
            count: mockInfluencers.length,
            message: `Found ${mockInfluencers.length} influencers from StarNgage (mock data)`,
            isMockData: true
          });
        }
        
        return NextResponse.json({
          success: true,
          data: influencers,
          count: influencers.length,
          message: `Found ${influencers.length} influencers from StarNgage`
        });

      case 'profile':
        if (!username) {
          return NextResponse.json({
            success: false,
            error: 'Username is required for profile scraping'
          }, { status: 400 });
        }

        console.log(`👤 Scraping profile details for @${username}`);
        const profileDetails = await starngageService.scrapeInfluencerProfile(username);
        
        if (!profileDetails) {
          console.log(`🔄 Real scraping failed, using mock data for @${username}`);
          const mockData = starngageService.createMockData(username);
          
          return NextResponse.json({
            success: true,
            data: mockData,
            message: `Mock profile details for @${username} (real scraping failed)`,
            isMockData: true
          });
        }

        return NextResponse.json({
          success: true,
          data: profileDetails,
          message: `Profile details scraped for @${username}`
        });

      case 'enhance':
        if (!username) {
          return NextResponse.json({
            success: false,
            error: 'Username is required for enhancement'
          }, { status: 400 });
        }

        console.log(`✨ Enhancing influencer @${username} with StarNgage data`);
        const enhancedData = await starngageService.enhanceInfluencerWithDemographics(username);
        
        if (!enhancedData) {
          console.log(`🔄 Real enhancement failed, using mock data for @${username}`);
          const mockData = starngageService.createMockData(username);
          
          return NextResponse.json({
            success: true,
            data: {
              demographics: mockData.demographics,
              engagementRate: mockData.engagementRate,
              averageLikes: mockData.averageLikes,
              averageComments: mockData.averageComments,
              topics: mockData.topics
            },
            message: `Mock enhanced data for @${username} (real scraping failed)`,
            isMockData: true
          });
        }

        return NextResponse.json({
          success: true,
          data: enhancedData,
          message: `Enhanced data retrieved for @${username}`
        });

      case 'search':
        const keyword = searchParams.get('keyword');
        if (!keyword) {
          return NextResponse.json({
            success: false,
            error: 'Keyword is required for search'
          }, { status: 400 });
        }

        console.log(`🔍 Searching StarNgage for keyword: ${keyword}`);
        const searchResults = await starngageService.searchInfluencers(keyword, platform, limit);
        
        return NextResponse.json({
          success: true,
          data: searchResults,
          count: searchResults.length,
          message: `Found ${searchResults.length} influencers for keyword: ${keyword}`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: list, profile, enhance, or search'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ StarNgage API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, usernames, country, category, platform } = body;

    console.log(`🔍 StarNgage batch API called with action: ${action}`);

    switch (action) {
      case 'batch-enhance':
        if (!usernames || !Array.isArray(usernames)) {
          return NextResponse.json({
            success: false,
            error: 'Usernames array is required for batch enhancement'
          }, { status: 400 });
        }

        console.log(`✨ Batch enhancing ${usernames.length} influencers`);
        const enhancedResults = await Promise.allSettled(
          usernames.map(username => 
            starngageService.enhanceInfluencerWithDemographics(username)
          )
        );

        const successful = enhancedResults
          .map((result, index) => ({
            username: usernames[index],
            success: result.status === 'fulfilled' && result.value !== null,
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
          }))
          .filter(result => result.success);

        return NextResponse.json({
          success: true,
          data: successful,
          count: successful.length,
          total: usernames.length,
          message: `Enhanced ${successful.length}/${usernames.length} influencers`
        });

      case 'batch-profiles':
        if (!usernames || !Array.isArray(usernames)) {
          return NextResponse.json({
            success: false,
            error: 'Usernames array is required for batch profiles'
          }, { status: 400 });
        }

        console.log(`👥 Batch scraping ${usernames.length} profiles`);
        const profileResults = await Promise.allSettled(
          usernames.map(username => 
            starngageService.scrapeInfluencerProfile(username)
          )
        );

        const successfulProfiles = profileResults
          .map((result, index) => ({
            username: usernames[index],
            success: result.status === 'fulfilled' && result.value !== null,
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
          }))
          .filter(result => result.success);

        return NextResponse.json({
          success: true,
          data: successfulProfiles,
          count: successfulProfiles.length,
          total: usernames.length,
          message: `Scraped ${successfulProfiles.length}/${usernames.length} profiles`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: batch-enhance or batch-profiles'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ StarNgage batch API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 