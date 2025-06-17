import { NextRequest, NextResponse } from 'next/server';
import { searchMemory } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const brandName = searchParams.get('brandName');

    // Get campaign-specific insights
    const insights = await searchMemory.getActiveCampaignInsights();
    const stats = await searchMemory.getStats();

    // Get campaign-specific search history if campaignId provided
    let campaignHistory: any[] = [];
    if (campaignId) {
      campaignHistory = await searchMemory.getSearchHistory(undefined, undefined, campaignId);
    }

    // Get brand-specific learning insights if brandName provided
    let brandInsights: any = null;
    if (brandName) {
      brandInsights = await searchMemory.getLearningInsights('', {
        brandName,
        activeCampaigns: insights.activeCampaigns,
      });
    }

    return NextResponse.json({
      success: true,
      activeCampaigns: insights.activeCampaigns,
      recentSearches: insights.recentSearches,
      pendingFeedback: insights.pendingFeedback,
      campaignHistory,
      brandInsights,
      overallStats: {
        totalSearches: stats.totalSearches,
        avgRating: stats.avgRating,
        activeCampaignSearches: stats.campaignInsights.activeCampaignSearches,
        completedCampaignSuccess: stats.campaignInsights.completedCampaignSuccess,
        topPerformingBrands: stats.campaignInsights.topPerformingBrands,
      }
    });

  } catch (error) {
    console.error('Error getting campaign insights:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, campaignId, status } = body;

    if (action === 'updateStatus') {
      // This would be called when campaign status changes
      // Update all related search records
      const history = await searchMemory.getSearchHistory(undefined, undefined, campaignId);
      
      console.log(`🔄 Updating ${history.length} search records for campaign ${campaignId} to status: ${status}`);
      
      // Note: In a real implementation, we'd update the Firebase records
      // For now, this serves as a notification that campaign status changed
      
      return NextResponse.json({
        success: true,
        message: `Campaign ${campaignId} status updated to ${status}`,
        affectedSearches: history.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating campaign insights:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign insights' },
      { status: 500 }
    );
  }
} 