import { CampaignProposal, ProposalTalent } from './campaign';

// Historical campaign data for machine learning
export interface HistoricalCampaign {
  id: string;
  client: string;
  campaignName: string;
  budget: number;
  currency: string;
  industry: string; // e.g., "telecommunications", "luxury spirits", "home goods"
  campaignType: string; // e.g., "brand awareness", "product launch", "seasonal"
  
  // Success metrics
  status: 'successful' | 'partially_successful' | 'unsuccessful';
  successScore: number; // 0-100 based on KPIs
  actualReach: number;
  actualEngagement: number;
  actualConversions?: number;
  roi?: number;
  
  // Campaign metadata
  createdDate: Date;
  launchDate?: Date;
  endDate?: Date;
  agencyName: string; // "TSL", "Hibiki", etc.
  
  // Talent data
  talents: HistoricalTalent[];
  
  // Learning data
  successFactors: string[]; // What made this campaign successful
  lessonsLearned: string[];
  targetAudience: AudienceProfile;
}

export interface HistoricalTalent {
  // Basic info
  name: string;
  handle: string;
  category: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
  
  // Performance data
  followerCount: number;
  engagementRate: number;
  credibilityScore: number;
  audienceQuality: number;
  
  // Campaign specific
  fee: number;
  commitment: string;
  wasConfirmed: boolean;
  performanceRating: number; // 1-10 how well they performed
  
  // Demographics
  audienceDemographics: {
    gender: { male: number; female: number };
    ageGroups: { [key: string]: number };
    geography: { [country: string]: number };
  };
  
  // Collaboration data
  previousBrands: string[];
  contentStyle: string[];
  niche: string[];
  
  // Success metrics for this campaign
  actualImpressions?: number;
  actualEngagement?: number;
  clickThroughRate?: number;
  conversionRate?: number;
}

export interface AudienceProfile {
  primaryAge: string;
  secondaryAge: string;
  genderSplit: { male: number; female: number };
  interests: string[];
  behaviors: string[];
  geography: string[];
  spendingPower: 'low' | 'medium' | 'high' | 'luxury';
}

// Machine learning data
export interface MatchingPattern {
  id: string;
  patternType: 'successful_combination' | 'budget_optimization' | 'audience_alignment';
  
  // Pattern data
  brandIndustry: string;
  budgetRange: { min: number; max: number };
  talentCategories: string[];
  successRate: number;
  
  // What made it work
  keyFactors: string[];
  optimalCommitments: string[];
  
  // Usage tracking
  timesUsed: number;
  successCount: number;
  lastUsed: Date;
  
  // Source campaigns
  sourceCampaigns: string[]; // Campaign IDs this pattern was derived from
}

// Campaign intelligence
export interface CampaignIntelligence {
  id: string;
  
  // Market insights
  industryTrends: {
    category: string;
    averageBudget: number;
    successfulTalentTypes: string[];
    optimalTiming: string[];
    commonCommitments: string[];
  }[];
  
  // Talent insights
  talentPerformance: {
    talentId: string;
    successRate: number;
    averagePerformance: number;
    bestIndustries: string[];
    optimalBudgetRange: { min: number; max: number };
    reliabilityScore: number;
  }[];
  
  // Pricing intelligence
  marketRates: {
    category: string;
    followerRange: string;
    averageFee: number;
    feeRange: { min: number; max: number };
    lastUpdated: Date;
  }[];
  
  // Success predictors
  successPredictors: {
    factor: string;
    weight: number;
    description: string;
  }[];
}

// Import helpers
export interface CSVImportResult {
  campaignsImported: number;
  talentsImported: number;
  errors: string[];
  warnings: string[];
  patternsGenerated: number;
}

export interface ImportedCampaignData {
  rawData: any[];
  parsedCampaign: HistoricalCampaign;
  confidence: number; // How confident we are in the parsing
  needsReview: boolean;
} 