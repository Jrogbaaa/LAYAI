// Database schema for search memory and reinforcement learning
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

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
  // NEW: Campaign context
  campaignId?: string;
  campaignStatus?: 'Planning' | 'Active' | 'Completed' | 'Paused';
  brandName?: string;
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
  // NEW: Campaign context
  campaignId?: string;
  wasUsedInCampaign?: boolean;
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
  // NEW: Campaign success tracking
  successfulCampaigns: string[];
  campaignIndustries: string[];
  brandNames: string[];
}

// Enhanced memory store with Firebase integration
class SearchMemoryStore {
  private searchHistory: SearchHistory[] = [];
  private userFeedback: UserFeedback[] = [];
  private learningPatterns: LearningPattern[] = [];
  private isInitialized = false;

  // Initialize by loading from Firebase
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🔄 Initializing SearchMemoryStore from Firebase...');
      
      // Load search history
      const searchQuery = query(
        collection(db, 'search_history'),
        orderBy('timestamp', 'desc'),
        limit(100) // Load last 100 searches
      );
      const searchSnapshot = await getDocs(searchQuery);
      this.searchHistory = searchSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
        id: doc.id,
          ...data,
          timestamp: data.timestamp && typeof data.timestamp.toDate === 'function' 
            ? data.timestamp.toDate() 
            : (data.timestamp instanceof Date ? data.timestamp : new Date()),
        } as SearchHistory;
      });

      // Load feedback
      const feedbackQuery = query(
        collection(db, 'user_feedback'),
        orderBy('timestamp', 'desc'),
        limit(200) // Load last 200 feedback entries
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      this.userFeedback = feedbackSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
        id: doc.id,
          ...data,
          timestamp: data.timestamp && typeof data.timestamp.toDate === 'function' 
            ? data.timestamp.toDate() 
            : (data.timestamp instanceof Date ? data.timestamp : new Date()),
        } as UserFeedback;
      });

      // Load learning patterns
      const patternsQuery = query(
        collection(db, 'learning_patterns'),
        orderBy('lastUpdated', 'desc')
      );
      const patternsSnapshot = await getDocs(patternsQuery);
      this.learningPatterns = patternsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
        id: doc.id,
          ...data,
          lastUpdated: data.lastUpdated && typeof data.lastUpdated.toDate === 'function' 
            ? data.lastUpdated.toDate() 
            : (data.lastUpdated instanceof Date ? data.lastUpdated : new Date()),
        } as LearningPattern;
      });

      this.isInitialized = true;
      console.log(`✅ Loaded ${this.searchHistory.length} searches, ${this.userFeedback.length} feedback, ${this.learningPatterns.length} patterns`);
    } catch (error) {
      console.error('❌ Error initializing SearchMemoryStore:', error);
      // Continue with in-memory only if Firebase fails
      this.isInitialized = true;
    }
  }

  // Store search results with Firebase persistence
  async saveSearch(search: Omit<SearchHistory, 'id' | 'timestamp'>): Promise<string> {
    await this.initialize();
    
    const searchRecord: SearchHistory = {
      ...search,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    // Add to in-memory store
    this.searchHistory.push(searchRecord);
    
    // Persist to Firebase
    try {
      // Clean data by removing undefined values (Firebase doesn't allow them)
      const cleanData = this.removeUndefinedValues({
        ...searchRecord,
        timestamp: Timestamp.fromDate(searchRecord.timestamp),
      });
      const docRef = await addDoc(collection(db, 'search_history'), cleanData);
      searchRecord.id = docRef.id; // Use Firebase ID
      console.log(`💾 Saved search to Firebase: ${searchRecord.id}`);
    } catch (error) {
      console.error('❌ Error saving search to Firebase:', error);
      console.log(`💾 Saved search in-memory only: ${searchRecord.id}`);
    }
    
    return searchRecord.id;
  }

  // Store user feedback with Firebase persistence
  async saveFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<string> {
    await this.initialize();
    
    const feedbackRecord: UserFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    // Add to in-memory store
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
    await this.updateLearningPatterns(feedbackRecord);
    
    // Persist to Firebase
    try {
      const docData = {
        ...feedbackRecord,
        timestamp: Timestamp.fromDate(feedbackRecord.timestamp),
      };
      const docRef = await addDoc(collection(db, 'user_feedback'), docData);
      feedbackRecord.id = docRef.id; // Use Firebase ID
      console.log(`📝 Saved feedback to Firebase: ${feedbackRecord.id} (rating: ${feedback.overallRating})`);
    } catch (error) {
      console.error('❌ Error saving feedback to Firebase:', error);
      console.log(`📝 Saved feedback in-memory only: ${feedbackRecord.id} (rating: ${feedback.overallRating})`);
    }
    
    return feedbackRecord.id;
  }

  // Get campaign-aware search history
  async getSearchHistory(sessionId?: string, userId?: string, campaignId?: string): Promise<SearchHistory[]> {
    await this.initialize();
    
    return this.searchHistory.filter(search => 
      (!sessionId || search.sessionId === sessionId) &&
      (!userId || search.userId === userId) &&
      (!campaignId || search.campaignId === campaignId)
    );
  }

  // Get learning insights with campaign context
  async getLearningInsights(query: string, campaignContext?: {
    brandName?: string;
    industry?: string;
    activeCampaigns?: string[];
  }): Promise<{
    suggestedQueries: string[];
    bestSources: string[];
    avgSuccessRate: number;
    campaignSpecificInsights?: string[];
  }> {
    await this.initialize();
    
    const relevantPatterns = this.learningPatterns.filter(pattern => {
      const queryMatch = query.toLowerCase().includes(pattern.pattern.toLowerCase()) ||
                         pattern.pattern.toLowerCase().includes(query.toLowerCase());
      
      // Boost patterns from same brand or industry
      const brandMatch = campaignContext?.brandName && 
                        pattern.brandNames.includes(campaignContext.brandName);
      const industryMatch = campaignContext?.industry &&
                           pattern.campaignIndustries.includes(campaignContext.industry);
      
      return queryMatch || brandMatch || industryMatch;
    });

    if (relevantPatterns.length === 0) {
      return { 
        suggestedQueries: [], 
        bestSources: [], 
        avgSuccessRate: 0,
        campaignSpecificInsights: []
      };
    }

    const bestPattern = relevantPatterns.reduce((best, current) => 
      current.avgRating > best.avgRating ? current : best
    );

    // Generate campaign-specific insights
    const campaignSpecificInsights: string[] = [];
    if (campaignContext?.brandName) {
      const brandPatterns = relevantPatterns.filter(p => 
        p.brandNames.includes(campaignContext.brandName!)
      );
      if (brandPatterns.length > 0) {
        campaignSpecificInsights.push(
          `Previous ${campaignContext.brandName} campaigns performed best with: ${brandPatterns[0].pattern}`
        );
      }
    }

    return {
      suggestedQueries: bestPattern.successfulQueries.slice(0, 3),
      bestSources: bestPattern.bestSources.slice(0, 5),
      avgSuccessRate: bestPattern.avgRating,
      campaignSpecificInsights
    };
  }

  // Enhanced learning patterns with campaign context
  private async updateLearningPatterns(feedback: UserFeedback): Promise<void> {
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
        successfulCampaigns: [],
        campaignIndustries: [],
        brandNames: [],
      };
      this.learningPatterns.push(pattern);
    }

    // Update pattern based on feedback
    pattern.totalSearches++;
    pattern.avgRating = ((pattern.avgRating * (pattern.totalSearches - 1)) + feedback.overallRating) / pattern.totalSearches;
    pattern.lastUpdated = new Date();

    // Track campaign context
    if (search.campaignId && feedback.overallRating >= 4) {
      if (!pattern.successfulCampaigns.includes(search.campaignId)) {
        pattern.successfulCampaigns.push(search.campaignId);
      }
    }
    
    if (search.brandName && !pattern.brandNames.includes(search.brandName)) {
      pattern.brandNames.push(search.brandName);
    }

    if (feedback.overallRating >= 4) {
      pattern.successfulQueries.push(search.query);
    } else if (feedback.overallRating <= 2) {
      pattern.failedQueries.push(search.query);
    }

    // Persist to Firebase
    try {
      const patternData = {
        ...pattern,
        lastUpdated: Timestamp.fromDate(pattern.lastUpdated),
      };
      
      if (pattern.id.startsWith('pattern_')) {
        // New pattern - create document
        const docRef = await addDoc(collection(db, 'learning_patterns'), patternData);
        pattern.id = docRef.id;
      } else {
        // Existing pattern - update document
        await updateDoc(doc(db, 'learning_patterns', pattern.id), patternData);
      }
      
      console.log(`🧠 Updated learning pattern in Firebase: ${patternKey} (avg rating: ${pattern.avgRating.toFixed(2)})`);
    } catch (error) {
      console.error('❌ Error updating pattern in Firebase:', error);
      console.log(`🧠 Updated learning pattern in-memory: ${patternKey} (avg rating: ${pattern.avgRating.toFixed(2)})`);
    }
  }

  private generatePatternKey(params: SearchHistory['searchParams']): string {
    return [
      params.niches[0] || 'general',
      params.gender || 'any',
      params.location || 'global',
      params.platforms[0] || 'instagram'
    ].join(' + ');
  }

  // Helper method to remove undefined values from objects before saving to Firebase
  private removeUndefinedValues(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.removeUndefinedValues(value);
      }
    }
    return cleaned;
  }

  // Get statistics with campaign insights
  async getStats(): Promise<{
    totalSearches: number;
    totalFeedback: number;
    avgRating: number;
    topPatterns: LearningPattern[];
    campaignInsights: {
      activeCampaignSearches: number;
      completedCampaignSuccess: number;
      topPerformingBrands: string[];
    };
  }> {
    await this.initialize();
    
    const avgRating = this.userFeedback.length > 0 
      ? this.userFeedback.reduce((sum, f) => sum + f.overallRating, 0) / this.userFeedback.length
      : 0;

    // Campaign-specific insights
    const activeCampaignSearches = this.searchHistory.filter(s => 
      s.campaignStatus === 'Active'
    ).length;
    
    const completedCampaignFeedback = this.userFeedback.filter(f => {
      const search = this.searchHistory.find(s => s.id === f.searchId);
      return search?.campaignStatus === 'Completed';
    });
    
    const completedCampaignSuccess = completedCampaignFeedback.length > 0
      ? completedCampaignFeedback.filter(f => f.overallRating >= 4).length / completedCampaignFeedback.length
      : 0;

    // Top performing brands
    const brandPerformance = new Map<string, number[]>();
    this.userFeedback.forEach(f => {
      const search = this.searchHistory.find(s => s.id === f.searchId);
      if (search?.brandName) {
        if (!brandPerformance.has(search.brandName)) {
          brandPerformance.set(search.brandName, []);
        }
        brandPerformance.get(search.brandName)!.push(f.overallRating);
      }
    });
    
    const topPerformingBrands = Array.from(brandPerformance.entries())
      .map(([brand, ratings]) => ({
        brand,
        avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3)
      .map(item => item.brand);

    return {
      totalSearches: this.searchHistory.length,
      totalFeedback: this.userFeedback.length,
      avgRating: Number(avgRating.toFixed(2)),
      topPatterns: this.learningPatterns
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5),
      campaignInsights: {
        activeCampaignSearches,
        completedCampaignSuccess: Number(completedCampaignSuccess.toFixed(2)),
        topPerformingBrands
      }
    };
  }

  // NEW: Get insights for active campaigns
  async getActiveCampaignInsights(): Promise<{
    activeCampaigns: string[];
    recentSearches: SearchHistory[];
    pendingFeedback: number;
  }> {
    await this.initialize();
    
    const activeCampaigns = Array.from(new Set(
      this.searchHistory
        .filter(s => s.campaignStatus === 'Active')
        .map(s => s.campaignId)
        .filter((id): id is string => Boolean(id))
    ));
    
    const recentSearches = this.searchHistory
      .filter(s => s.campaignStatus === 'Active')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    const pendingFeedback = this.searchHistory.filter(s => 
      s.campaignStatus === 'Active' && !s.feedback
    ).length;
    
    return {
      activeCampaigns,
      recentSearches,
      pendingFeedback
    };
  }
}

// Export singleton instance
export const searchMemory = new SearchMemoryStore();

// Helper function to generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 