'use client';

import React, { useState, useEffect } from 'react';
import { AdvancedFilteringSystem } from '@/lib/advancedFilteringSystem';
import { MatchResult } from '@/types/influencer';
import DataSourceInfo from './DataSourceInfo';

interface BrandCompatibilityScore {
  overall: number;
  factors: {
    audienceAlignment: number;
    contentStyle: number;
    brandValues: number;
    pastCollaborations: number;
    engagement: number;
    authenticity: number;
  };
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

interface BrandProfile {
  name: string;
  industry: string;
  values: string[];
  targetAudience: {
    age: string;
    gender: string;
    interests: string[];
    location: string;
  };
  tone: string;
  budgetRange: string;
  campaignObjectives: string[];
}

interface EnhancedBrandCompatibilityEngineProps {
  influencers: MatchResult[];
  brandProfile?: BrandProfile;
  onCompatibilityUpdate?: (results: { [key: string]: BrandCompatibilityScore }) => void;
}

const EnhancedBrandCompatibilityEngine: React.FC<EnhancedBrandCompatibilityEngineProps> = ({
  influencers,
  brandProfile,
  onCompatibilityUpdate
}) => {
  const [compatibilityScores, setCompatibilityScores] = useState<{ [key: string]: BrandCompatibilityScore }>({});
  const [filteringSystem] = useState(() => new AdvancedFilteringSystem());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(brandProfile || null);

  const defaultBrandProfile: BrandProfile = {
    name: 'Sample Brand',
    industry: 'fitness',
    values: ['health', 'wellness', 'authenticity', 'sustainability'],
    targetAudience: {
      age: '25-34',
      gender: 'female',
      interests: ['fitness', 'wellness', 'lifestyle'],
      location: 'Spain'
    },
    tone: 'authentic',
    budgetRange: '$10,000-$50,000',
    campaignObjectives: ['brand_awareness', 'engagement', 'conversions']
  };

  useEffect(() => {
    if (influencers.length > 0) {
      calculateCompatibilityScores();
    }
  }, [influencers, selectedBrand]);

  const calculateCompatibilityScores = async () => {
    setIsLoading(true);
    const brand = selectedBrand || defaultBrandProfile;
    const scores: { [key: string]: BrandCompatibilityScore } = {};

    for (const matchResult of influencers) {
      // Extract influencer data from MatchResult with comprehensive field mapping
      const influencer = matchResult.influencer || matchResult;
      const score = await calculateIndividualCompatibility(influencer, brand);
      // Use consistent key generation for score storage
      const scoreKey = influencer.id || influencer.handle || influencer.username || influencer.user_name || influencer.instagram_username || influencer.tiktok_username || `influencer_${Date.now()}`;
      scores[scoreKey] = score;
    }

    setCompatibilityScores(scores);
    if (onCompatibilityUpdate) {
      onCompatibilityUpdate(scores);
    }
    setIsLoading(false);
  };

  const calculateIndividualCompatibility = async (
    influencer: any,
    brand: BrandProfile
  ): Promise<BrandCompatibilityScore> => {
    // Audience alignment analysis
    const audienceAlignment = calculateAudienceAlignment(influencer, brand);
    
    // Content style compatibility
    const contentStyle = calculateContentStyleCompatibility(influencer, brand);
    
    // Brand values alignment
    const brandValues = calculateBrandValuesAlignment(influencer, brand);
    
    // Past collaborations analysis
    const pastCollaborations = calculatePastCollaborationsScore(influencer, brand);
    
    // Engagement quality
    const engagement = calculateEngagementScore(influencer);
    
    // Authenticity assessment
    const authenticity = await calculateAuthenticityScore(influencer);

    // Calculate overall score
    const overall = (
      audienceAlignment * 0.25 +
      contentStyle * 0.20 +
      brandValues * 0.20 +
      pastCollaborations * 0.15 +
      engagement * 0.15 +
      authenticity * 0.05
    );

    // Generate recommendations
    const recommendations = generateRecommendations(influencer, brand, {
      audienceAlignment,
      contentStyle,
      brandValues,
      pastCollaborations,
      engagement,
      authenticity
    });

    // Identify risks
    const risks = identifyRisks(influencer, brand, {
      audienceAlignment,
      contentStyle,
      brandValues,
      pastCollaborations,
      engagement,
      authenticity
    });

    // Identify opportunities
    const opportunities = identifyOpportunities(influencer, brand, {
      audienceAlignment,
      contentStyle,
      brandValues,
      pastCollaborations,
      engagement,
      authenticity
    });

    return {
      overall,
      factors: {
        audienceAlignment,
        contentStyle,
        brandValues,
        pastCollaborations,
        engagement,
        authenticity
      },
      recommendations,
      risks,
      opportunities
    };
  };

  const calculateAudienceAlignment = (influencer: MatchResult, brand: BrandProfile): number => {
    let score = 0;
    
    // Demographics alignment
    if (influencer.demographics?.age === brand.targetAudience.age) score += 0.3;
    if (influencer.demographics?.gender === brand.targetAudience.gender) score += 0.2;
    if (influencer.location === brand.targetAudience.location) score += 0.2;
    
    // Interests alignment
    const commonInterests = influencer.interests?.filter(interest => 
      brand.targetAudience.interests.includes(interest)
    ) || [];
    score += (commonInterests.length / brand.targetAudience.interests.length) * 0.3;
    
    return Math.min(score, 1.0);
  };

  const calculateContentStyleCompatibility = (influencer: MatchResult, brand: BrandProfile): number => {
    let score = 0.7; // Base score
    
    // Tone alignment
    if (influencer.contentStyle?.tone === brand.tone) score += 0.2;
    
    // Content format compatibility
    if (influencer.contentStyle?.formats?.includes('video') && brand.industry === 'fitness') score += 0.1;
    
    return Math.min(score, 1.0);
  };

  const calculateBrandValuesAlignment = (influencer: MatchResult, brand: BrandProfile): number => {
    let score = 0.6; // Base score
    
    // Values alignment (simplified)
    if (brand.values.includes('authenticity') && influencer.engagement && influencer.engagement > 3) {
      score += 0.2;
    }
    
    if (brand.values.includes('sustainability') && influencer.interests?.includes('environment')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  };

  const calculatePastCollaborationsScore = (influencer: MatchResult, brand: BrandProfile): number => {
    // Mock past collaborations analysis
    const baseScore = 0.7;
    
    // Bonus for relevant industry collaborations
    if (brand.industry === 'fitness' && influencer.categories?.includes('fitness')) {
      return Math.min(baseScore + 0.2, 1.0);
    }
    
    return baseScore;
  };

  const calculateEngagementScore = (influencer: MatchResult): number => {
    if (!influencer.engagement) return 0.5;
    
    // Normalize engagement rate (assuming 1-10% range)
    const normalizedEngagement = Math.min(influencer.engagement / 10, 1.0);
    
    // Higher engagement rates get bonus
    if (influencer.engagement > 5) return Math.min(normalizedEngagement + 0.2, 1.0);
    
    return normalizedEngagement;
  };

  const calculateAuthenticityScore = async (influencer: MatchResult): Promise<number> => {
    // Mock authenticity calculation
    let score = 0.8; // Base authenticity score
    
    // Bonus for verified accounts
    if (influencer.verified) score += 0.1;
    
    // Penalty for very low or very high follower counts (potential fake accounts)
    if (influencer.followers && (influencer.followers < 1000 || influencer.followers > 10000000)) {
      score -= 0.1;
    }
    
    return Math.min(Math.max(score, 0), 1.0);
  };

  const generateRecommendations = (
    influencer: MatchResult,
    brand: BrandProfile,
    scores: any
  ): string[] => {
    const recommendations = [];
    
    if (scores.audienceAlignment < 0.7) {
      recommendations.push('Consider audience alignment - demographics may not match target perfectly');
    }
    
    if (scores.engagement > 0.8) {
      recommendations.push('Excellent engagement rate - ideal for authentic brand partnerships');
    }
    
    if (scores.contentStyle > 0.8) {
      recommendations.push('Content style highly compatible - perfect for brand messaging');
    }
    
    if (influencer.followers && influencer.followers > 100000) {
      recommendations.push('Large reach potential - great for brand awareness campaigns');
    }
    
    return recommendations;
  };

  const identifyRisks = (
    influencer: MatchResult,
    brand: BrandProfile,
    scores: any
  ): string[] => {
    const risks = [];
    
    if (scores.audienceAlignment < 0.5) {
      risks.push('Low audience alignment - may not reach target demographic effectively');
    }
    
    if (scores.engagement < 0.3) {
      risks.push('Low engagement rate - potential authenticity concerns');
    }
    
    if (scores.authenticity < 0.6) {
      risks.push('Authenticity concerns - recommend thorough verification');
    }
    
    return risks;
  };

  const identifyOpportunities = (
    influencer: MatchResult,
    brand: BrandProfile,
    scores: any
  ): string[] => {
    const opportunities = [];
    
    if (scores.contentStyle > 0.8) {
      opportunities.push('Strong content style match - ideal for co-creation opportunities');
    }
    
    if (scores.brandValues > 0.8) {
      opportunities.push('High brand values alignment - perfect for long-term partnerships');
    }
    
    if (influencer.demographics?.age === brand.targetAudience.age) {
      opportunities.push('Perfect age demographic match - high conversion potential');
    }
    
    return opportunities;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (influencers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Influencers to Analyze</h3>
          <p className="text-gray-600 mb-4">Perform a search first to analyze brand compatibility</p>
          <button 
            onClick={() => window.location.href = '#search'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Brand Compatibility Engine</h3>
              <p className="text-indigo-100 text-sm">AI-powered brand-influencer matching</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-indigo-100 text-sm">
              {influencers.length} influencers analyzed
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <DataSourceInfo type="compatibility" />
        
        {/* Brand Profile Summary */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Brand Profile</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Industry:</span>
              <span className="ml-2 font-medium">{selectedBrand?.industry || defaultBrandProfile.industry}</span>
            </div>
            <div>
              <span className="text-gray-600">Target Age:</span>
              <span className="ml-2 font-medium">{selectedBrand?.targetAudience.age || defaultBrandProfile.targetAudience.age}</span>
            </div>
            <div>
              <span className="text-gray-600">Target Gender:</span>
              <span className="ml-2 font-medium">{selectedBrand?.targetAudience.gender || defaultBrandProfile.targetAudience.gender}</span>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <span className="ml-2 font-medium">{selectedBrand?.targetAudience.location || defaultBrandProfile.targetAudience.location}</span>
            </div>
          </div>
        </div>

        {/* Compatibility Results */}
        <div className="space-y-2">
          {influencers.map((matchResult, index) => {
            // Extract influencer data from MatchResult with comprehensive field mapping
            const influencer = matchResult.influencer || matchResult;
            // Use consistent key generation for score lookup
            const scoreKey = influencer.id || influencer.handle || influencer.username || influencer.user_name || influencer.instagram_username || influencer.tiktok_username || `influencer_${Date.now()}`;
            const score = compatibilityScores[scoreKey];
            if (!score) return null;

            // Comprehensive field mapping for different data structures
            const displayName = influencer.name || influencer.fullName || influencer.displayName || influencer.username || 'Unknown';
            const handleName = influencer.handle || influencer.username || influencer.user_name || influencer.instagram_username || influencer.tiktok_username || 'unknown';
            const firstLetter = displayName.charAt(0).toUpperCase() || '?';

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-2">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {firstLetter}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{displayName}</h4>
                      <p className="text-sm text-gray-500">@{handleName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score.overall)}`}>
                      {(score.overall * 100).toFixed(0)}% • {getScoreLabel(score.overall)}
                    </div>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {Object.entries(score.factors).map(([factor, value]) => (
                    <div key={factor} className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1 capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {(value * 100).toFixed(0)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            value >= 0.8 ? 'bg-green-600' : 
                            value >= 0.6 ? 'bg-yellow-600' : 
                            'bg-red-600'
                          }`}
                          style={{ width: `${value * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendations, Risks, Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Recommendations</h5>
                    <div className="space-y-1">
                      {score.recommendations.map((rec, idx) => (
                        <div key={idx} className="text-sm text-green-700 bg-green-50 rounded p-2">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-800 mb-2">Risks</h5>
                    <div className="space-y-1">
                      {score.risks.map((risk, idx) => (
                        <div key={idx} className="text-sm text-red-700 bg-red-50 rounded p-2">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Opportunities</h5>
                    <div className="space-y-1">
                      {score.opportunities.map((opp, idx) => (
                        <div key={idx} className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                          {opp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Compatibility Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(compatibilityScores).filter(s => s.overall >= 0.8).length}
              </div>
              <div className="text-sm text-gray-600">Excellent Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(compatibilityScores).filter(s => s.overall >= 0.6 && s.overall < 0.8).length}
              </div>
              <div className="text-sm text-gray-600">Good Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(compatibilityScores).filter(s => s.overall < 0.6).length}
              </div>
              <div className="text-sm text-gray-600">Poor Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(compatibilityScores).length > 0 ? 
                  (Object.values(compatibilityScores).reduce((sum, s) => sum + s.overall, 0) / Object.values(compatibilityScores).length * 100).toFixed(0) : 
                  0
                }%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBrandCompatibilityEngine;