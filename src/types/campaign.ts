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