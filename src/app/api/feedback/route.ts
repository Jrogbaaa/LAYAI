import { NextRequest, NextResponse } from 'next/server';
import { searchMemory } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      searchId, 
      sessionId, 
      userId, 
      overallRating, 
      feedback, 
      specificFeedback,
      improvedQuery,
      likedProfiles,
      dislikedProfiles 
    } = body;

    // Validate required fields
    if (!searchId || !sessionId || !overallRating || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: searchId, sessionId, overallRating, feedback' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: 'overallRating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Save feedback
    const feedbackId = await searchMemory.saveFeedback({
      searchId,
      sessionId,
      userId,
      overallRating,
      feedback,
      specificFeedback,
      improvedQuery,
      likedProfiles,
      dislikedProfiles,
    });

    // Get updated learning insights
    const insights = await searchMemory.getLearningInsights(improvedQuery || '');
    const stats = await searchMemory.getStats();

    return NextResponse.json({
      success: true,
      feedbackId,
      message: 'Feedback saved successfully',
      learningInsights: insights,
      stats: {
        totalFeedback: stats.totalFeedback,
        avgRating: stats.avgRating,
      }
    });

  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const query = searchParams.get('query');

    if (query) {
      // Get learning insights for a specific query
      const insights = searchMemory.getLearningInsights(query);
      return NextResponse.json({
        success: true,
        insights,
      });
    }

    // Get search history and stats
    const history = await searchMemory.getSearchHistory(sessionId || undefined, userId || undefined);
    const stats = await searchMemory.getStats();

    return NextResponse.json({
      success: true,
      searchHistory: history.slice(-10), // Last 10 searches
      stats,
    });

  } catch (error) {
    console.error('Error retrieving feedback data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback data' },
      { status: 500 }
    );
  }
} 