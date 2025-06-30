export interface CampaignProposal {
  id: string;
  client: string;
  campaignName: string;
  brandName: string;
  totalBudget: number;
  currency: 'EUR' | 'USD';
  talents: ProposalTalent[];
  createdAt: Date;
  brandResearch?: any;
}

export interface ProposalTalent {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagementRate: number;
  estimatedFee: number;
  commitment: string;
  biography: string;
  whyThisInfluencer: string;
  metrics: {
    credibilityScore: number;
    spainImpressionsPercentage: number;
    storyImpressions: number;
    reelImpressions: number;
    interactions: number;
  };
  pastCollaborations: string[];
}

// Legacy types for backward compatibility
export interface LegacyProposalTalent {
  id: string;
  name: string;
  category: string;
  territory: string;
  biography: string;
  reasonWhy: string;
  commitment: string;
  fee: number;
  feeWithoutPaidMedia?: number;
  url: string;
  
  // Instagram metrics
  instagramFollowers: number;
  instagramStoryImpressions: number;
  instagramReelImpressions: number;
  instagramInteractions: number;
  instagramER: number;
  instagramCredibility: number;
  instagramSpainIP: number;
  instagramGenderSplit: GenderSplit;
  instagramAgeDistribution: AgeDistribution;
  
  // TikTok metrics (optional)
  tiktokFollowers?: number;
  tiktokImpressions?: number;
  tiktokInteractions?: number;
  tiktokER?: number;
  tiktokSpainIP?: number;
  tiktokGenderSplit?: GenderSplit;
  tiktokAgeDistribution?: AgeDistribution;
  
  // Additional fields
  pastCollaborations?: string[];
  estimatedTotalImpressions: number;
  comments?: string;
  availability: 'confirmed' | 'unconfirmed' | 'not_available' | 'not_interested';
}

export interface GenderSplit {
  male: number;
  female: number;
}

export interface AgeDistribution {
  '13-17': number;
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45-54': number;
  '55+': number;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  defaultCommitment: string;
  targetCategories: string[];
  budgetRange: {
    min: number;
    max: number;
  };
}

export interface ProposalExportSettings {
  includeUnconfirmed: boolean;
  format: 'csv' | 'pdf' | 'excel';
  language: 'es' | 'en';
  customFields: string[];
}

// Enhanced Campaign Management Types
export interface SavedSearch {
  id: string;
  query: string;
  brandName: string;
  timestamp: Date;
  parameters: {
    niches?: string[];
    location?: string;
    gender?: string;
    minFollowers?: number;
    maxFollowers?: number;
    platform?: string[];
  };
  resultsCount: number;
  influencerIds: string[]; // IDs of influencers found in this search
}

export interface SavedInfluencer {
  id: string;
  campaignId: string;
  influencerData: {
    name: string;
    handle: string;
    platform: string;
    followers: number;
    engagementRate: number;
    location?: string;
    niche: string[];
    estimatedCost: number;
    validationStatus?: {
      isValidProfile: boolean;
      isBrandAccount: boolean;
      validationReason?: string;
      apifyVerified: boolean;
    };
  };
  savedAt: Date;
  notes?: string;
  status: 'saved' | 'contacted' | 'confirmed' | 'rejected';
  tags: string[];
}

export interface EnhancedCampaign {
  id: string;
  name: string;
  brandName: string;
  owner: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Paused';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  endDate: string;
  budget: number;
  platform: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced fields
  savedSearches: SavedSearch[];
  savedInfluencers: SavedInfluencer[];
  searchHistory: SearchHistoryEntry[];
  autoCreatedFromSearch?: boolean;
  originalSearchQuery?: string;
  customTimeline?: string; // Custom timeline text field
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  brandName: string;
  timestamp: Date;
  resultsCount: number;
  savedToExistingCampaign?: string; // Campaign ID if added to existing campaign
  createdNewCampaign?: string; // Campaign ID if created new campaign
}

export interface CampaignSearchStats {
  totalSearches: number;
  uniqueBrands: number;
  totalInfluencersFound: number;
  totalInfluencersSaved: number;
  averageResultsPerSearch: number;
  mostSearchedBrand: string;
  recentActivity: SearchHistoryEntry[];
} 