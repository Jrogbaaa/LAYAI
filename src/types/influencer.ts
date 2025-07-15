export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform';
  followerCount: number;
  engagementRate: number;
  ageRange: string;
  gender: 'Male' | 'Female' | 'Non-Binary' | 'Other';
  location: string;
  niche: string[];
  contentStyle: string[];
  pastCollaborations: BrandCollaboration[];
  averageRate: number;
  costLevel: 'Budget' | 'Mid-Range' | 'Premium' | 'Celebrity';
  audienceDemographics: AudienceDemographics;
  recentPosts: Post[];
  contactInfo: ContactInfo;
  isActive: boolean;
  lastUpdated: Date;
  // Enhanced fields for better filtering
  lastActiveDate?: Date;
  verificationLevel?: 'none' | 'basic' | 'verified' | 'premium';
  collaborationHistory?: 'never' | 'occasional' | 'frequent';
  contentTypes?: ('photo' | 'video' | 'story' | 'reel' | 'carousel')[];
  responsiveness?: 'low' | 'medium' | 'high';
  priceEstimate?: {
    post: number;
    story: number;
    reel: number;
  };
  
  // Validation status from Apify backend
  validationStatus?: {
    isValidProfile: boolean;
    isBrandAccount: boolean;
    validationReason?: string;
    apifyVerified: boolean;
  };
  
  // Brand collaboration status (extracted during scraping)
  brandCollaboration?: {
    brandName: string;
    hasWorkedWith: boolean;
    collaborationType: 'partnership' | 'mention' | 'none';
    confidence: number;
    evidence: string[];
    lastCollabDate?: string;
    source: 'bio_analysis' | 'posts_analysis' | 'combined';
  };
}

export interface BrandCollaboration {
  brandName: string;
  campaignType: string;
  dateCompleted: Date;
  performance: {
    reach: number;
    engagement: number;
    conversions?: number;
  };
  contentUrl?: string;
  rating: number; // 1-5 scale
}

export interface AudienceDemographics {
  ageGroups: {
    '13-17': number;
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55+': number;
  };
  gender: {
    male: number;
    female: number;
    other: number;
  };
  topLocations: string[];
  interests: string[];
}

export interface Post {
  id: string;
  url: string;
  caption: string;
  likes: number;
  comments: number;
  shares?: number;
  datePosted: Date;
  contentType: 'Image' | 'Video' | 'Carousel' | 'Reel' | 'Story';
  hashtags: string[];
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  managementCompany?: string;
  preferredContact: 'Email' | 'Phone' | 'DM' | 'Management';
}

export interface CampaignBrief {
  brandName: string;
  industry: string;
  campaignObjective: string;
  targetAudience: {
    ageRange: string;
    gender: string;
    interests: string[];
    locations: string[];
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  contentRequirements: {
    platforms: string[];
    contentTypes: string[];
    postCount: number;
    timeline: string;
  };
  brandValues: string[];
  excludedContent: string[];
  kpiMetrics: string[];
}

export interface MatchResult {
  influencer: Influencer;
  matchScore: number;
  matchReasons: string[];
  estimatedCost: number;
  similarPastCampaigns: BrandCollaboration[];
  potentialReach: number;
  recommendations: string[];
}

export interface MatchCriteria {
  budget: {
    min: number;
    max: number;
  };
  platform: string[];
  niche: string[];
  followerRange: {
    min: number;
    max: number;
  };
  engagementRate: {
    min: number;
    max: number;
  };
  gender?: string;
  ageRange?: string;
  location?: string[];
  excludeInfluencers?: string[];
  brandQuery?: string;
  
  // Enhanced search criteria
  verificationStatus?: boolean;
  lastActive?: '7d' | '30d' | '90d' | 'any';
  contentTypes?: ('photo' | 'video' | 'story' | 'reel' | 'carousel')[];
  collaborationHistory?: 'never' | 'occasional' | 'frequent' | 'any';
  responsiveness?: 'low' | 'medium' | 'high' | 'any';
  priceRange?: {
    min: number;
    max: number;
    contentType: 'post' | 'story' | 'reel';
  };
} 