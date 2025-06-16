import { NextRequest, NextResponse } from 'next/server';

const SOCIALBLADE_BASE_URL = 'https://matrix.sbapis.com/b';

interface SocialBladeResponse {
  status: {
    success: boolean;
    status: number;
    error?: string;
  };
  info?: {
    access: {
      seconds_to_expire: number;
    };
    credits: {
      available: number;
    };
  };
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const { platform, username, history = 'default' } = await request.json();

    if (!platform || !username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Platform and username are required' 
      }, { status: 400 });
    }

    const clientId = process.env.SOCIALBLADE_CLIENT_ID;
    const token = process.env.SOCIALBLADE_TOKEN;

    if (!clientId || !token) {
      console.log('⚠️ SocialBlade API credentials not configured, using fallback data');
      return NextResponse.json({ 
        success: false, 
        error: 'SocialBlade API credentials not configured',
        fallback: true
      }, { status: 200 });
    }

    const cleanUsername = username.replace('@', '');
    const url = `${SOCIALBLADE_BASE_URL}/${platform.toLowerCase()}/statistics`;
    
    console.log(`🔍 Fetching SocialBlade data for ${platform}/${cleanUsername}`);

    const response = await fetch(`${url}?query=${encodeURIComponent(cleanUsername)}&history=${history}`, {
      method: 'GET',
      headers: {
        'clientid': clientId,
        'token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ SocialBlade API error: ${response.status}`);
      return NextResponse.json({ 
        success: false, 
        error: `SocialBlade API error: ${response.status}`,
        fallback: true
      }, { status: 200 });
    }

    const data: SocialBladeResponse = await response.json();

    if (!data.status.success) {
      console.error(`❌ SocialBlade API failed:`, data.status.error);
      return NextResponse.json({ 
        success: false, 
        error: data.status.error || 'SocialBlade API failed',
        fallback: true
      }, { status: 200 });
    }

    console.log(`✅ SocialBlade data retrieved for ${platform}/${cleanUsername}`);
    
    // Transform SocialBlade data to our format
    const transformedData = transformSocialBladeData(data.data, platform);

    return NextResponse.json({
      success: true,
      data: transformedData,
      credits: data.info?.credits,
      platform,
      username: cleanUsername
    });

  } catch (error) {
    console.error('❌ SocialBlade API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      fallback: true
    }, { status: 200 });
  }
}

const transformSocialBladeData = (data: any, platform: string) => {
  if (!data) return null;

  const baseData = {
    id: data.id?.id || '',
    username: data.id?.username || data.id?.display_name || '',
    displayName: data.id?.display_name || '',
    platform: platform,
    avatar: data.general?.branding?.avatar || '',
    website: data.general?.branding?.website || '',
  };

  switch (platform.toLowerCase()) {
    case 'instagram':
      return {
        ...baseData,
        followers: data.statistics?.total?.followers || 0,
        following: data.statistics?.total?.following || 0,
        posts: data.statistics?.total?.media || 0,
        engagementRate: data.statistics?.total?.engagement_rate || 0,
        grade: data.misc?.grade?.grade || '',
        gradeColor: data.misc?.grade?.color || '',
        verified: data.misc?.sb_verified || false,
        ranks: data.ranks || {},
        growth: data.statistics?.growth || {},
        recentMedia: data.general?.media?.recent || [],
      };

    case 'youtube':
      return {
        ...baseData,
        subscribers: data.statistics?.total?.subscribers || 0,
        views: data.statistics?.total?.views || 0,
        uploads: data.statistics?.total?.uploads || 0,
        grade: data.misc?.grade?.grade || '',
        gradeColor: data.misc?.grade?.color || '',
        verified: data.misc?.sb_verified || false,
        country: data.general?.geo?.country || '',
        channelType: data.general?.channel_type || '',
        ranks: data.ranks || {},
        growth: data.statistics?.growth || {},
        social: data.general?.branding?.social || {},
      };

    case 'tiktok':
      return {
        ...baseData,
        followers: data.statistics?.total?.followers || 0,
        following: data.statistics?.total?.following || 0,
        likes: data.statistics?.total?.likes || 0,
        uploads: data.statistics?.total?.uploads || 0,
        grade: data.misc?.grade?.grade || '',
        gradeColor: data.misc?.grade?.color || '',
        verified: data.misc?.sb_verified || false,
        ranks: data.ranks || {},
        growth: {},
      };

    default:
      return baseData;
  }
};

// Helper function to get multiple profiles at once
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const usernames = searchParams.get('usernames')?.split(',') || [];

  if (!platform || usernames.length === 0) {
    return NextResponse.json({ 
      success: false, 
      error: 'Platform and usernames are required' 
    }, { status: 400 });
  }

  try {
    const results = await Promise.allSettled(
      usernames.map(async (username) => {
        const response = await fetch(`${request.nextUrl.origin}/api/socialblade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, username: username.trim() }),
        });
        const data = await response.json();
        return { username: username.trim(), ...data };
      })
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(result => result.success);

    return NextResponse.json({
      success: true,
      results: successfulResults,
      total: successfulResults.length,
      platform
    });

  } catch (error) {
    console.error('❌ Batch SocialBlade error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 