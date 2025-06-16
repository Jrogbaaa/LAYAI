'use client';

import { CampaignProposal, ProposalTalent } from '@/types/campaign';
import { exportHibikiStyleCSV, exportOrangeStyleCSV, exportToExcel, ExportOptions } from '@/lib/newExportUtils';

interface ProposalViewerProps {
  proposal: CampaignProposal;
  onExport: (format: 'csv' | 'pdf' | 'hibiki' | 'orange') => void;
  onEdit: () => void;
}

export const ProposalViewer: React.FC<ProposalViewerProps> = ({
  proposal,
  onExport,
  onEdit
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return `${proposal.currency === 'EUR' ? '€' : '$'}${formatNumber(amount)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTotalBudget = (): number => {
    return proposal.talents.reduce((sum, talent) => sum + talent.estimatedFee, 0);
  };

  // Enhanced export functions
  const handleExportHibikiCSV = () => {
    exportHibikiStyleCSV(proposal, { 
      format: 'hibiki', 
      includeUnconfirmed: true 
    });
  };

  const handleExportOrangeCSV = () => {
    exportOrangeStyleCSV(proposal, { 
      format: 'orange', 
      includeUnconfirmed: true 
    });
  };

  const handleExportHibikiExcel = () => {
    exportToExcel(proposal, 'hibiki', { 
      format: 'hibiki', 
      includeUnconfirmed: true 
    });
  };

  const handleExportOrangeExcel = () => {
    exportToExcel(proposal, 'orange', { 
      format: 'orange', 
      includeUnconfirmed: true 
    });
  };

  const TalentCard: React.FC<{ talent: ProposalTalent }> = ({ talent }) => (
    <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{talent.name}</h4>
          <p className="text-sm text-gray-600">@{talent.handle} • {talent.platform}</p>
          <a 
            href={`https://www.instagram.com/${talent.handle}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View Profile
          </a>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(talent.estimatedFee)}
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            {formatNumber(talent.followers)} followers
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-gray-700 mb-2">Biography</h5>
          <p className="text-sm text-gray-600">{talent.biography}</p>
        </div>
        <div>
          <h5 className="font-medium text-gray-700 mb-2">Why This Match</h5>
          <p className="text-sm text-gray-600">{talent.whyThisInfluencer}</p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="font-medium text-gray-700 mb-2">Commitment</h5>
        <p className="text-sm text-gray-600">{talent.commitment}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h5 className="font-medium text-gray-700 mb-2">Metrics</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Followers:</span>
              <span className="font-medium">{formatNumber(talent.followers)}</span>
            </div>
            <div className="flex justify-between">
              <span>ER:</span>
              <span className="font-medium">{formatPercentage(talent.engagementRate * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Credibility:</span>
              <span className="font-medium">{formatPercentage(talent.metrics.credibilityScore)}</span>
            </div>
            <div className="flex justify-between">
              <span>Spain IP:</span>
              <span className="font-medium">{formatPercentage(talent.metrics.spainImpressionsPercentage)}</span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-700 mb-2">Impressions</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Stories:</span>
              <span className="font-medium">{formatNumber(talent.metrics.storyImpressions)}</span>
            </div>
            <div className="flex justify-between">
              <span>Reels:</span>
              <span className="font-medium">{formatNumber(talent.metrics.reelImpressions)}</span>
            </div>
            <div className="flex justify-between">
              <span>Interactions:</span>
              <span className="font-medium text-green-600">{formatNumber(talent.metrics.interactions)}</span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-700 mb-2">Platform</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Platform:</span>
              <span className="font-medium">{talent.platform}</span>
            </div>
            <div className="flex justify-between">
              <span>Handle:</span>
              <span className="font-medium">@{talent.handle}</span>
            </div>
          </div>
        </div>
      </div>

      {talent.pastCollaborations && talent.pastCollaborations.length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium text-gray-700 mb-2">Past Collaborations</h5>
          <div className="flex flex-wrap gap-2">
            {talent.pastCollaborations.map((brand, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.campaignName}</h1>
              <p className="text-gray-600 mt-1">Campaign Proposal for {proposal.brandName}</p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Generator</span>
            </div>
          </button>
        </div>

        {/* Campaign Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
              <h3 className="font-semibold text-blue-900">Budget</h3>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(proposal.totalBudget)}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
              <h3 className="font-semibold text-green-900">Talents</h3>
            </div>
            <p className="text-2xl font-bold text-green-800">{proposal.talents.length}</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
              <h3 className="font-semibold text-purple-900">Total Reach</h3>
            </div>
            <p className="text-2xl font-bold text-purple-800">
              {formatNumber(proposal.talents.reduce((sum, talent) => sum + talent.followers, 0))}
            </p>
          </div>
        </div>

        {/* Client Info */}
        {proposal.client && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Client Information</h3>
            <p className="text-gray-700">{proposal.client}</p>
          </div>
        )}
      </div>

      {/* Brand Research */}
      {proposal.brandResearch && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Brand Research</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Industry</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{proposal.brandResearch.industry}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Target Audience</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{proposal.brandResearch.targetAudience}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Brand Values</h3>
                <div className="flex flex-wrap gap-2">
                  {proposal.brandResearch.values?.map((value: string, index: number) => (
                    <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Talents */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-pink-700 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">⭐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Selected Talents</h2>
        </div>
        
        <div className="space-y-6">
          {proposal.talents.map((talent, index) => (
            <div key={talent.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{talent.name}</h3>
                  <p className="text-gray-600 font-medium">@{talent.handle}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                      {talent.followers.toLocaleString()} followers
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {(talent.engagementRate * 100).toFixed(1)}% ER
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                      {talent.platform}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(talent.estimatedFee)}
                  </div>
                  <div className="text-sm text-gray-500">Estimated fee</div>
                </div>
              </div>
              
              {/* Biography */}
              {talent.biography && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Biography</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{talent.biography}</p>
                </div>
              )}
              
              {/* Why This Influencer */}
              {talent.whyThisInfluencer && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Why Perfect for {proposal.brandName}
                  </h4>
                  <p className="text-blue-800 text-sm leading-relaxed">{talent.whyThisInfluencer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Metrics</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 text-center">
            <div className="text-3xl font-bold text-blue-800 mb-2">
              {formatNumber(proposal.talents.reduce((sum, talent) => sum + talent.followers, 0))}
            </div>
            <div className="text-blue-700 font-medium">Total Reach</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200 text-center">
            <div className="text-3xl font-bold text-green-800 mb-2">
              {(proposal.talents.reduce((sum, talent) => sum + talent.engagementRate, 0) / proposal.talents.length * 100).toFixed(1)}%
            </div>
            <div className="text-green-700 font-medium">Avg Engagement</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 text-center">
            <div className="text-3xl font-bold text-purple-800 mb-2">
              {formatCurrency(getTotalBudget())}
            </div>
            <div className="text-purple-700 font-medium">Total Cost</div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 text-center">
            <div className="text-3xl font-bold text-orange-800 mb-2">
              {formatCurrency(getTotalBudget() / (proposal.talents.reduce((sum, talent) => sum + talent.followers, 0) / 1000))}
            </div>
            <div className="text-orange-700 font-medium">CPM</div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Export Proposal</h3>
            <p className="text-gray-600">Download your proposal in different formats</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => onExport('pdf')}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </div>
            </button>
            
            <button
              onClick={() => onExport('csv')}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 