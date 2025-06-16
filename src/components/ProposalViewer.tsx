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
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Campaign Proposal: {proposal.campaignName}
            </h1>
            <p className="text-lg text-gray-600 mt-1">Client: {proposal.client}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(proposal.totalBudget)}
            </div>
            <div className="text-sm text-gray-500">
              Total Budget
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Created:</span>
            <div className="font-medium">{proposal.createdAt.toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-gray-500">Brand:</span>
            <div className="font-medium text-blue-600">{proposal.brandName}</div>
          </div>
          <div>
            <span className="text-gray-500">Total Talents:</span>
            <div className="font-medium">{proposal.talents.length}</div>
          </div>
          <div>
            <span className="text-gray-500">Currency:</span>
            <div className="font-medium">{proposal.currency}</div>
          </div>
        </div>

        {proposal.brandResearch && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-blue-700 font-medium">Brand Research:</span>
            <div className="text-blue-600 text-sm mt-1">
              Industry: {proposal.brandResearch.industry} | Values: {proposal.brandResearch.values?.join(', ')} | Target: {proposal.brandResearch.targetAudience}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onExport('csv')}
            className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            Export as CSV
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Export as PDF
          </button>
          <button
            onClick={() => onExport('hibiki')}
            className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors"
          >
            Export as Hibiki CSV
          </button>
          <button
            onClick={() => onExport('orange')}
            className="bg-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-700 transition-colors"
          >
            Export as Orange CSV
          </button>
          <button
            onClick={onEdit}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Edit Proposal
          </button>
        </div>
      </div>

      {/* All Talents */}
      {proposal.talents.length > 0 && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Selected Talents ({proposal.talents.length})
          </h2>
          <div className="space-y-6">
            {proposal.talents.map((talent) => (
              <TalentCard key={talent.id} talent={talent} />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(
                proposal.talents.reduce((sum, talent) => sum + talent.followers, 0)
              )}
            </div>
            <div className="text-sm text-gray-600">Total Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(
                proposal.talents.reduce((sum, talent) => sum + talent.metrics.storyImpressions + talent.metrics.reelImpressions, 0)
              )}
            </div>
            <div className="text-sm text-gray-600">Estimated Impressions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(getTotalBudget())}
            </div>
            <div className="text-sm text-gray-600">Total Investment</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 