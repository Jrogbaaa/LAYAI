'use client';

import { useState } from 'react';
import { CampaignProposal, ProposalTalent } from '@/types/campaign';
import { MatchResult } from '@/types/influencer';

interface ProposalGeneratorProps {
  matchResults: MatchResult[];
  onProposalGenerated: (proposal: CampaignProposal) => void;
}

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  matchResults,
  onProposalGenerated
}) => {
  const [campaignData, setCampaignData] = useState({
    client: '',
    campaignName: '',
    budget: '',
    currency: 'EUR',
    talentRequirements: '',
  });

  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set());
  const [customCommitments, setCustomCommitments] = useState<{ [key: string]: string }>({});

  const handleTalentSelection = (influencerId: string) => {
    const newSelected = new Set(selectedTalents);
    if (newSelected.has(influencerId)) {
      newSelected.delete(influencerId);
    } else {
      newSelected.add(influencerId);
    }
    setSelectedTalents(newSelected);
  };

  const handleCommitmentChange = (influencerId: string, commitment: string) => {
    setCustomCommitments(prev => ({
      ...prev,
      [influencerId]: commitment
    }));
  };

  const convertMatchToProposalTalent = (match: MatchResult): ProposalTalent => {
    const influencer = match.influencer;
    
    return {
      id: influencer.id,
      name: influencer.name,
      category: influencer.niche[0] || 'Lifestyle',
      territory: influencer.location,
      biography: `${influencer.name} is a ${influencer.platform} creator with ${(influencer.followerCount / 1000).toFixed(0)}K followers, specializing in ${influencer.niche.join(', ')}. Known for ${influencer.contentStyle.join(', ')} content with a ${(influencer.engagementRate * 100).toFixed(1)}% engagement rate.`,
      reasonWhy: match.matchReasons.join('. '),
      commitment: customCommitments[influencer.id] || '2 reels + 4 stories + paid media rights (2 weeks) + exclusivity (3 months)',
      fee: match.estimatedCost,
      url: `https://www.instagram.com/${influencer.handle}`,
      
      // Instagram metrics
      instagramFollowers: influencer.followerCount,
      instagramStoryImpressions: Math.floor(influencer.followerCount * 0.15),
      instagramReelImpressions: Math.floor(influencer.followerCount * influencer.engagementRate * 8),
      instagramInteractions: Math.floor(influencer.followerCount * influencer.engagementRate),
      instagramER: influencer.engagementRate * 100,
      instagramCredibility: 85, // Default value
      instagramSpainIP: 75, // Default value
      instagramGenderSplit: influencer.audienceDemographics.gender,
      instagramAgeDistribution: influencer.audienceDemographics.ageGroups,
      
      // Additional fields
      pastCollaborations: influencer.pastCollaborations.map(collab => collab.brandName),
      estimatedTotalImpressions: match.potentialReach,
      availability: 'unconfirmed'
    };
  };

  const generateProposal = () => {
    if (!campaignData.client || !campaignData.campaignName || selectedTalents.size === 0) {
      alert('Please fill in all required fields and select at least one talent.');
      return;
    }

    const selectedMatches = matchResults.filter(match => 
      selectedTalents.has(match.influencer.id)
    );

    const proposalTalents = selectedMatches.map(convertMatchToProposalTalent);

    const proposal: CampaignProposal = {
      id: `proposal-${Date.now()}`,
      client: campaignData.client,
      campaignName: campaignData.campaignName,
      budget: parseInt(campaignData.budget) || 0,
      currency: campaignData.currency,
      talentRequirements: campaignData.talentRequirements,
      createdAt: new Date(),
      status: 'draft',
      confirmedTalents: [],
      unconfirmedTalents: proposalTalents
    };

    onProposalGenerated(proposal);
  };

  const defaultCommitments = [
    '2 reels + 4 stories + paid media rights (2 weeks) + exclusivity (3 months)',
    '1 reel + 2 stories + paid media rights (1 week)',
    '3 reels + 6 stories + paid media rights (1 month) + exclusivity (6 months)',
    '2 reels + 2 TikTok + 4 stories + paid media rights (2 weeks)',
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Generate Campaign Proposal
      </h2>

      {/* Campaign Information */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Name *
          </label>
          <input
            type="text"
            value={campaignData.client}
            onChange={(e) => setCampaignData(prev => ({ ...prev, client: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Orange, IKEA, Samsung"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            value={campaignData.campaignName}
            onChange={(e) => setCampaignData(prev => ({ ...prev, campaignName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., TODO Days, Spring Collection"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget
          </label>
          <div className="flex">
            <input
              type="number"
              value={campaignData.budget}
              onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100000"
            />
            <select
              value={campaignData.currency}
              onChange={(e) => setCampaignData(prev => ({ ...prev, currency: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Talent Requirements
          </label>
          <input
            type="text"
            value={campaignData.talentRequirements}
            onChange={(e) => setCampaignData(prev => ({ ...prev, talentRequirements: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1 new talent, Premium lifestyle influencers"
          />
        </div>
      </div>

      {/* Talent Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Talents for Proposal ({selectedTalents.size} selected)
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {matchResults.map((match) => (
            <div 
              key={match.influencer.id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedTalents.has(match.influencer.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedTalents.has(match.influencer.id)}
                    onChange={() => handleTalentSelection(match.influencer.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{match.influencer.name}</h4>
                    <p className="text-sm text-gray-600">@{match.influencer.handle}</p>
                    <p className="text-sm text-gray-500">
                      {(match.influencer.followerCount / 1000).toFixed(0)}K followers • 
                      {(match.matchScore * 100).toFixed(0)}% match • 
                      €{match.estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">
                    €{match.estimatedCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedTalents.has(match.influencer.id) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment Details
                  </label>
                  <select
                    value={customCommitments[match.influencer.id] || defaultCommitments[0]}
                    onChange={(e) => handleCommitmentChange(match.influencer.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {defaultCommitments.map((commitment, index) => (
                      <option key={index} value={commitment}>
                        {commitment}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Total estimated cost: €{
            matchResults
              .filter(match => selectedTalents.has(match.influencer.id))
              .reduce((sum, match) => sum + match.estimatedCost, 0)
              .toLocaleString()
          }
        </div>
        
        <button
          onClick={generateProposal}
          disabled={selectedTalents.size === 0}
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generate Proposal Document
        </button>
      </div>
    </div>
  );
}; 