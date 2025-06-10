export interface CampaignProposal {
  id: string;
  client: string;
  campaignName: string;
  budget: number;
  currency: string;
  talentRequirements: string;
  createdAt: Date;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  confirmedTalents: ProposalTalent[];
  unconfirmedTalents: ProposalTalent[];
}

export interface ProposalTalent {
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