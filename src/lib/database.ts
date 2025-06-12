// Database schema for search memory and reinforcement learning
export interface SearchHistory {
  id: string;
  userId?: string;
  sessionId: string;
  query: string;
  searchParams: {
    platforms: string[];
    niches: string[];
    minFollowers: number;
    maxFollowers: number;
    location?: string;
    gender?: string;
    userQuery: string;
  };
  results: {
    totalFound: number;
    premiumResults: any[];
    discoveryResults: any[];
  };
  timestamp: Date;
  feedback?: UserFeedback;
}

export interface UserFeedback {
  id: string;
  searchId: string;
  userId?: string;
  sessionId: string;
  overallRating: 1 | 2 | 3 | 4 | 5; // 1-5 stars
  feedback: 'good' | 'bad' | 'needs_improvement';
  specificFeedback?: {
    tooManyMales?: boolean;
    tooManyFemales?: boolean;
    wrongNiche?: boolean;
    wrongLocation?: boolean;
    followerCountOff?: boolean;
    notRelevant?: boolean;
    perfectMatch?: boolean;
  };
  improvedQuery?: string; // User's suggested better search
  likedProfiles?: string[]; // Profile URLs user liked
  dislikedProfiles?: string[]; // Profile URLs user disliked
  timestamp: Date;
}

export interface LearningPattern {
  id: string;
  pattern: string; // e.g., "fitness + male + spain"
  successfulQueries: string[];
  failedQueries: string[];
  bestSources: string[]; // URLs that consistently provide good results
  avgRating: number;
  totalSearches: number;
  lastUpdated: Date;
}

// In-memory storage for now (can be replaced with real database)
class SearchMemoryStore {
  private searchHistory: SearchHistory[] = [];
  private userFeedback: UserFeedback[] = [];
  private learningPatterns: LearningPattern[] = [];

  // Store search results
  saveSearch(search: Omit<SearchHistory, 'id' | 'timestamp'>): string {
    const searchRecord: SearchHistory = {
      ...search,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    this.searchHistory.push(searchRecord);
    console.log(`💾 Saved search: ${searchRecord.id}`);
    return searchRecord.id;
  }

  // Store user feedback
  saveFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): string {
    const feedbackRecord: UserFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    this.userFeedback.push(feedbackRecord);
    
    // Update the corresponding search with feedback
    const searchIndex = this.searchHistory.findIndex(s => s.id === feedback.searchId);
    if (searchIndex !== -1) {
      this.searchHistory[searchIndex] = {
        ...this.searchHistory[searchIndex],
        feedback: feedbackRecord
      };
    }
    
    // Update learning patterns
    this.updateLearningPatterns(feedbackRecord);
    
    console.log(`📝 Saved feedback: ${feedbackRecord.id} (rating: ${feedback.overallRating})`);
    return feedbackRecord.id;
  }

  // Get search history for analysis
  getSearchHistory(sessionId?: string, userId?: string): SearchHistory[] {
    return this.searchHistory.filter(search => 
      (!sessionId || search.sessionId === sessionId) &&
      (!userId || search.userId === userId)
    );
  }

  // Get learning insights for improving searches
  getLearningInsights(query: string): {
    suggestedQueries: string[];
    bestSources: string[];
    avgSuccessRate: number;
  } {
    const relevantPatterns = this.learningPatterns.filter(pattern => 
      query.toLowerCase().includes(pattern.pattern.toLowerCase()) ||
      pattern.pattern.toLowerCase().includes(query.toLowerCase())
    );

    if (relevantPatterns.length === 0) {
      return { suggestedQueries: [], bestSources: [], avgSuccessRate: 0 };
    }

    const bestPattern = relevantPatterns.reduce((best, current) => 
      current.avgRating > best.avgRating ? current : best
    );

    return {
      suggestedQueries: bestPattern.successfulQueries.slice(0, 3),
      bestSources: bestPattern.bestSources.slice(0, 5),
      avgSuccessRate: bestPattern.avgRating,
    };
  }

  // Update learning patterns based on feedback
  private updateLearningPatterns(feedback: UserFeedback): void {
    const search = this.searchHistory.find(s => s.id === feedback.searchId);
    if (!search) return;

    const patternKey = this.generatePatternKey(search.searchParams);
    let pattern = this.learningPatterns.find(p => p.pattern === patternKey);

    if (!pattern) {
      pattern = {
        id: `pattern_${Date.now()}`,
        pattern: patternKey,
        successfulQueries: [],
        failedQueries: [],
        bestSources: [],
        avgRating: 0,
        totalSearches: 0,
        lastUpdated: new Date(),
      };
      this.learningPatterns.push(pattern);
    }

    // Update pattern based on feedback
    pattern.totalSearches++;
    pattern.avgRating = ((pattern.avgRating * (pattern.totalSearches - 1)) + feedback.overallRating) / pattern.totalSearches;
    pattern.lastUpdated = new Date();

    if (feedback.overallRating >= 4) {
      pattern.successfulQueries.push(search.query);
      // Extract sources from successful searches (would need to track this)
    } else if (feedback.overallRating <= 2) {
      pattern.failedQueries.push(search.query);
    }

    console.log(`🧠 Updated learning pattern: ${patternKey} (avg rating: ${pattern.avgRating.toFixed(2)})`);
  }

  private generatePatternKey(params: SearchHistory['searchParams']): string {
    return [
      params.niches[0] || 'general',
      params.gender || 'any',
      params.location || 'global',
      params.platforms[0] || 'instagram'
    ].join(' + ');
  }

  // Get statistics for admin/debugging
  getStats(): {
    totalSearches: number;
    totalFeedback: number;
    avgRating: number;
    topPatterns: LearningPattern[];
  } {
    const avgRating = this.userFeedback.length > 0 
      ? this.userFeedback.reduce((sum, f) => sum + f.overallRating, 0) / this.userFeedback.length
      : 0;

    return {
      totalSearches: this.searchHistory.length,
      totalFeedback: this.userFeedback.length,
      avgRating: Number(avgRating.toFixed(2)),
      topPatterns: this.learningPatterns
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5),
    };
  }
}

// Export singleton instance
export const searchMemory = new SearchMemoryStore();

// Helper function to generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 