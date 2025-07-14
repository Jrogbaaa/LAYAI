// Enhanced Campaign Service for Search and Influencer Management
import { 
  EnhancedCampaign, 
  SavedSearch, 
  SavedInfluencer, 
  SearchHistoryEntry,
  CampaignSearchStats 
} from '@/types/campaign';
import { MatchResult } from '@/types/influencer';

export class EnhancedCampaignService {
  private static instance: EnhancedCampaignService;

  static getInstance(): EnhancedCampaignService {
    if (!EnhancedCampaignService.instance) {
      EnhancedCampaignService.instance = new EnhancedCampaignService();
    }
    return EnhancedCampaignService.instance;
  }

  /**
   * Save search results and automatically create/update campaign
   */
  async saveSearchResults(
    query: string,
    brandName: string,
    results: MatchResult[],
    searchParameters: any,
    userChoice?: 'new_campaign' | 'existing_campaign' | 'just_save',
    existingCampaignId?: string,
    autoSaveInfluencers: boolean = true // New parameter to auto-save influencers
  ): Promise<{ campaignId: string; searchId: string; action: string }> {
    try {
      console.log(`📝 Saving search results for brand: ${brandName}, results: ${results.length}`);
      
      // 🚧 TEMPORARILY DISABLE CAMPAIGN CREATION TO FIX FIREBASE PERMISSIONS ISSUE
      console.log(`🚧 Campaign creation temporarily disabled to prevent Firebase errors`);
      return { 
        campaignId: '', 
        searchId: `search_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`, 
        action: 'search_saved_without_campaign' 
      };
      
      // Create saved search entry
      const savedSearch: SavedSearch = {
        id: this.generateId(),
        query,
        brandName,
        timestamp: new Date(),
        resultsCount: results.length,
        parameters: searchParameters,
        influencerIds: results.map(r => r.influencer.id)
      };

      // Create search history entry
      const historyEntry: SearchHistoryEntry = {
        id: this.generateId(),
        query,
        brandName,
        timestamp: new Date(),
        resultsCount: results.length
      };

      let campaignId = '';
      let action = '';

      // Auto-create campaign for brand searches or use existing logic
      if (brandName && brandName !== 'Unknown') {
        // 🔍 ALWAYS check for existing campaign first (prevents duplicates)
        const existingCampaignId = await this.findExistingCampaign(brandName);
        
        if (existingCampaignId) {
          // ✅ Found existing campaign - add search to it
          campaignId = existingCampaignId;
          await this.addSearchToExistingCampaign(campaignId, savedSearch, historyEntry);
          action = 'added_to_existing';
          console.log(`📚 Adding search to existing ${brandName} campaign: ${campaignId}`);
          
          // 🚀 AUTO-SAVE INFLUENCERS to existing campaign (avoid duplicates) - TEMPORARILY DISABLED
          if (false && autoSaveInfluencers && results.length > 0) {
            // 🛡️ SAFETY LIMIT: Prevent UI freeze by limiting auto-saves
            const SAFE_AUTO_SAVE_LIMIT = 10;
            const resultsToSave = results.slice(0, SAFE_AUTO_SAVE_LIMIT);
            
            console.log(`🤖 Auto-saving ${resultsToSave.length} of ${results.length} influencers to existing campaign ${campaignId}`);
            if (results.length > SAFE_AUTO_SAVE_LIMIT) {
              console.log(`🛡️ Limited to ${SAFE_AUTO_SAVE_LIMIT} saves to prevent system overload. Additional ${results.length - SAFE_AUTO_SAVE_LIMIT} results available in search.`);
            }
            
            const existingInfluencers = await this.getSavedInfluencers(campaignId);
            let newInfluencersCount = 0;
            let errorCount = 0;
            
            for (const result of resultsToSave) {
              try {
                // Check if influencer is already saved to avoid duplicates
                const alreadySaved = existingInfluencers.some(
                  inf => inf.influencerData.handle === result.influencer.handle
                );
                
                if (!alreadySaved) {
                  await this.saveInfluencerToCampaign(
                    campaignId,
                    result,
                    `Auto-saved from search: "${query}"`,
                    ['auto-saved', 'search-result']
                  );
                  newInfluencersCount++;
                  
                  // Rate limiting: Small delay between saves
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              } catch (error) {
                console.error(`Failed to auto-save influencer ${result.influencer.name}:`, error);
                errorCount++;
                
                // Stop auto-saving if too many errors occur
                if (errorCount >= 3) {
                  console.warn(`🚨 Too many errors (${errorCount}). Stopping auto-save to prevent system issues.`);
                  break;
                }
              }
            }
            
            console.log(`✅ Added ${newInfluencersCount} new influencers to existing ${brandName} campaign`);
            if (errorCount > 0) {
              console.warn(`⚠️ ${errorCount} influencers failed to save due to errors`);
            }
            action = 'added_search_with_influencers';
          }
        } else if (userChoice === 'new_campaign' || userChoice === undefined) {
          // ✨ No existing campaign found - create new one
          campaignId = await this.createCampaignFromSearch(brandName, query, savedSearch, historyEntry);
          action = 'created_new_campaign';
          console.log(`🆕 Created new ${brandName} campaign: ${campaignId}`);
          
          // 🚀 AUTO-SAVE ALL INFLUENCERS to the newly created campaign - TEMPORARILY DISABLED
          if (false && autoSaveInfluencers && results.length > 0) {
            // 🛡️ SAFETY LIMIT: Prevent UI freeze by limiting auto-saves
            const SAFE_AUTO_SAVE_LIMIT = 10;
            const resultsToSave = results.slice(0, SAFE_AUTO_SAVE_LIMIT);
            
            console.log(`🤖 Auto-saving ${resultsToSave.length} of ${results.length} influencers to new campaign ${campaignId}`);
            if (results.length > SAFE_AUTO_SAVE_LIMIT) {
              console.log(`🛡️ Limited to ${SAFE_AUTO_SAVE_LIMIT} saves to prevent system overload. Additional ${results.length - SAFE_AUTO_SAVE_LIMIT} results available in search.`);
            }
            
            let savedCount = 0;
            let errorCount = 0;
            
            for (const result of resultsToSave) {
              try {
                await this.saveInfluencerToCampaign(
                  campaignId,
                  result,
                  `Auto-saved from search: "${query}"`,
                  ['auto-saved', 'search-result']
                );
                savedCount++;
                
                // Rate limiting: Small delay between saves
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                console.error(`Failed to auto-save influencer ${result.influencer.name}:`, error);
                errorCount++;
                
                // Stop auto-saving if too many errors occur
                if (errorCount >= 3) {
                  console.warn(`🚨 Too many errors (${errorCount}). Stopping auto-save to prevent system issues.`);
                  break;
                }
              }
            }
            
            console.log(`✅ Auto-saved ${savedCount} influencers to new ${brandName} campaign`);
            if (errorCount > 0) {
              console.warn(`⚠️ ${errorCount} influencers failed to save due to errors`);
            }
            action = 'created_campaign_with_influencers';
          }
        }
      } else {
        // Just save search without campaign association
        await this.saveStandaloneSearch(savedSearch, historyEntry);
        action = 'saved_search_only';
        return { campaignId: '', searchId: savedSearch.id, action };
      }

      // Note: Search history is already saved to campaigns via add_search or create_enhanced actions
      // No need for additional standalone save since it's included in campaign data
      
      console.log(`✅ Search saved successfully. Campaign: ${campaignId}, Action: ${action}`);
      return { campaignId, searchId: savedSearch.id, action };

    } catch (error) {
      console.error('Error saving search results:', error);
      throw error;
    }
  }

  /**
   * Save individual influencer to campaign
   */
  async saveInfluencerToCampaign(
    campaignId: string,
    influencer: MatchResult,
    notes?: string,
    tags: string[] = []
  ): Promise<SavedInfluencer> {
    const savedInfluencer: SavedInfluencer = {
      id: this.generateId(),
      campaignId,
      influencerData: {
        name: influencer.influencer.name,
        handle: influencer.influencer.handle,
        platform: influencer.influencer.platform,
        followers: influencer.influencer.followerCount,
        engagementRate: influencer.influencer.engagementRate,
        location: influencer.influencer.location,
        niche: influencer.influencer.niche,
        estimatedCost: influencer.estimatedCost,
        validationStatus: influencer.influencer.validationStatus
      },
      savedAt: new Date(),
      notes,
      status: 'saved',
      tags
    };

    // Update campaign with saved influencer
    await this.addInfluencerToCampaign(campaignId, savedInfluencer);
    
    console.log(`👤 Saved influencer ${influencer.influencer.name} to campaign ${campaignId}`);
    return savedInfluencer;
  }

  /**
   * Get all campaigns with search and influencer data
   */
  async getAllCampaigns(): Promise<EnhancedCampaign[]> {
    try {
      const response = await fetch('/api/database/campaigns');
      const data = await response.json();
      
      if (data.success) {
        return data.campaigns.map((campaign: any) => this.enhanceCampaignData(campaign));
      }
      return [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  /**
   * Get campaign search statistics
   */
  async getCampaignStats(): Promise<CampaignSearchStats> {
    try {
      const campaigns = await this.getAllCampaigns();
      const allSearches = campaigns.flatMap(c => c.searchHistory);
      
      const brands = Array.from(new Set(allSearches.map(s => s.brandName)));
      const brandCounts = brands.map(brand => ({
        brand,
        count: allSearches.filter(s => s.brandName === brand).length
      }));

      const totalInfluencersFound = allSearches.reduce((sum, s) => sum + s.resultsCount, 0);
      const totalInfluencersSaved = campaigns.reduce((sum, c) => sum + c.savedInfluencers.length, 0);

      return {
        totalSearches: allSearches.length,
        uniqueBrands: brands.length,
        totalInfluencersFound,
        totalInfluencersSaved,
        averageResultsPerSearch: allSearches.length > 0 ? totalInfluencersFound / allSearches.length : 0,
        mostSearchedBrand: brandCounts.sort((a, b) => b.count - a.count)[0]?.brand || '',
        recentActivity: allSearches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
      };
    } catch (error) {
      console.error('Error calculating campaign stats:', error);
      return {
        totalSearches: 0,
        uniqueBrands: 0,
        totalInfluencersFound: 0,
        totalInfluencersSaved: 0,
        averageResultsPerSearch: 0,
        mostSearchedBrand: '',
        recentActivity: []
      };
    }
  }

  /**
   * Get saved influencers for a campaign
   */
  async getSavedInfluencers(campaignId: string): Promise<SavedInfluencer[]> {
    try {
      const campaigns = await this.getAllCampaigns();
      const campaign = campaigns.find(c => c.id === campaignId);
      return campaign?.savedInfluencers || [];
    } catch (error) {
      console.error('Error fetching saved influencers:', error);
      return [];
    }
  }

  /**
   * Update influencer status in campaign
   */
  async updateInfluencerStatus(
    campaignId: string, 
    influencerId: string, 
    status: SavedInfluencer['status'],
    notes?: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/database/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_influencer_status',
          campaignId,
          influencerId,
          status,
          notes
        })
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating influencer status:', error);
      return false;
    }
  }

  // Private helper methods
  private async createCampaignFromSearch(
    brandName: string, 
    query: string, 
    savedSearch: SavedSearch, 
    historyEntry: SearchHistoryEntry
  ): Promise<string> {
    const newCampaign: Partial<EnhancedCampaign> = {
      name: `${brandName} Campaign`,
      brandName,
      owner: 'Clara',
      status: 'Planning',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 25000,
      platform: ['Instagram'],
      notes: `Auto-created from search: "${query}"`,
      savedSearches: [savedSearch],
      savedInfluencers: [],
      searchHistory: [historyEntry],
      autoCreatedFromSearch: true,
      originalSearchQuery: query
    };

    const response = await fetch('/api/database/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_enhanced',
        campaign: newCampaign
      })
    });

    const data = await response.json();
    if (data.success) {
      return data.campaign.id;
    }
    throw new Error('Failed to create campaign');
  }

  private async findExistingCampaign(brandName: string): Promise<string | null> {
    try {
      const campaigns = await this.getAllCampaigns();
      const brandLower = brandName.toLowerCase();
      
      // 🎯 Flexible matching: find campaigns that contain the brand name in either:
      // - brandName field
      // - campaign name field  
      // - original search query
      const existing = campaigns.find(c => {
        if (c.status === 'Completed') return false;
        
        const matchesBrandName = c.brandName && c.brandName.toLowerCase().includes(brandLower);
        const matchesCampaignName = c.name && c.name.toLowerCase().includes(brandLower);
        const matchesOriginalQuery = c.originalSearchQuery && c.originalSearchQuery.toLowerCase().includes(brandLower);
        
        return matchesBrandName || matchesCampaignName || matchesOriginalQuery;
      });
      
      if (existing) {
        console.log(`🎯 Found existing campaign for "${brandName}": ${existing.name} (${existing.brandName})`);
      }
      
      return existing?.id || null;
    } catch (error) {
      console.error('Error finding existing campaign:', error);
      return null;
    }
  }

  private async addSearchToExistingCampaign(
    campaignId: string, 
    savedSearch: SavedSearch, 
    historyEntry: SearchHistoryEntry
  ): Promise<void> {
    await fetch('/api/database/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_search',
        campaignId,
        savedSearch,
        historyEntry
      })
    });
  }

  private async addInfluencerToCampaign(campaignId: string, savedInfluencer: SavedInfluencer): Promise<void> {
    await fetch('/api/database/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_influencer',
        campaignId,
        savedInfluencer
      })
    });
  }

  private async saveStandaloneSearch(savedSearch: SavedSearch, historyEntry: SearchHistoryEntry): Promise<void> {
    await fetch('/api/database/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_standalone_search',
        savedSearch,
        historyEntry
      })
    });
  }

  private extractBrandFromQuery(query: string): string {
    // Simple brand extraction logic - can be enhanced
    const brandKeywords = ['ikea', 'nike', 'adidas', 'zara', 'h&m', 'mango'];
    const lowerQuery = query.toLowerCase();
    
    for (const brand of brandKeywords) {
      if (lowerQuery.includes(brand)) {
        return brand.toUpperCase();
      }
    }
    
    // Fallback to first word if no known brand
    return query.split(' ')[0] || 'Unknown Brand';
  }

  private enhanceCampaignData(campaign: any): EnhancedCampaign {
    return {
      ...campaign,
      savedSearches: campaign.savedSearches || [],
      savedInfluencers: campaign.savedInfluencers || [],
      searchHistory: campaign.searchHistory || [],
      createdAt: new Date(campaign.createdAt || Date.now()),
      updatedAt: new Date(campaign.updatedAt || Date.now())
    };
  }

  private async saveToDB(collection: string, data: any): Promise<void> {
    await fetch('/api/database/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_to_collection',
        collection,
        data
      })
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

export const campaignService = EnhancedCampaignService.getInstance(); 