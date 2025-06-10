'use client';

import { CampaignProposal, ProposalTalent } from '@/types/campaign';

interface ProposalViewerProps {
  proposal: CampaignProposal;
  onExport: (format: 'csv' | 'pdf') => void;
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
    return [...proposal.confirmedTalents, ...proposal.unconfirmedTalents]
      .reduce((sum, talent) => sum + talent.fee, 0);
  };

  const TalentCard: React.FC<{ talent: ProposalTalent; isConfirmed: boolean }> = ({
    talent,
    isConfirmed
  }) => (
    <div className={`border rounded-lg p-4 ${isConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{talent.name}</h4>
          <p className="text-sm text-gray-600">{talent.category}</p>
          <a 
            href={talent.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {talent.url}
          </a>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(talent.fee)}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            isConfirmed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isConfirmed ? 'Confirmed' : 'To Confirm'}
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
          <p className="text-sm text-gray-600">{talent.reasonWhy}</p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="font-medium text-gray-700 mb-2">Commitment</h5>
        <p className="text-sm text-gray-600">{talent.commitment}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h5 className="font-medium text-gray-700 mb-2">Instagram Metrics</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Followers:</span>
              <span className="font-medium">{formatNumber(talent.instagramFollowers)}</span>
            </div>
            <div className="flex justify-between">
              <span>ER:</span>
              <span className="font-medium">{formatPercentage(talent.instagramER)}</span>
            </div>
            <div className="flex justify-between">
              <span>Credibility:</span>
              <span className="font-medium">{formatPercentage(talent.instagramCredibility)}</span>
            </div>
            <div className="flex justify-between">
              <span>Spain IP:</span>
              <span className="font-medium">{formatPercentage(talent.instagramSpainIP)}</span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-700 mb-2">Impressions</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Stories:</span>
              <span className="font-medium">{formatNumber(talent.instagramStoryImpressions)}</span>
            </div>
            <div className="flex justify-between">
              <span>Reels:</span>
              <span className="font-medium">{formatNumber(talent.instagramReelImpressions)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Est:</span>
              <span className="font-medium text-green-600">{formatNumber(talent.estimatedTotalImpressions)}</span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-700 mb-2">Demographics</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Male:</span>
              <span className="font-medium">{formatPercentage(talent.instagramGenderSplit.male)}</span>
            </div>
            <div className="flex justify-between">
              <span>Female:</span>
              <span className="font-medium">{formatPercentage(talent.instagramGenderSplit.female)}</span>
            </div>
            <div className="flex justify-between">
              <span>25-34:</span>
              <span className="font-medium">{formatPercentage(talent.instagramAgeDistribution['25-34'])}</span>
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

      {talent.comments && (
        <div className="mt-4">
          <h5 className="font-medium text-gray-700 mb-2">Comments</h5>
          <p className="text-sm text-orange-600 font-medium">{talent.comments}</p>
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
              {formatCurrency(proposal.budget)}
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
            <span className="text-gray-500">Status:</span>
            <div className={`font-medium ${
              proposal.status === 'approved' ? 'text-green-600' :
              proposal.status === 'rejected' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Total Talents:</span>
            <div className="font-medium">
              {proposal.confirmedTalents.length + proposal.unconfirmedTalents.length}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Estimated Cost:</span>
            <div className="font-medium text-green-600">
              {formatCurrency(getTotalBudget())}
            </div>
          </div>
        </div>

        {proposal.talentRequirements && (
          <div className="mt-4">
            <span className="text-sm text-gray-500">Requirements:</span>
            <p className="text-sm font-medium">{proposal.talentRequirements}</p>
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
            onClick={onEdit}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Edit Proposal
          </button>
        </div>
      </div>

      {/* Confirmed Talents */}
      {proposal.confirmedTalents.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Confirmed Talents ({proposal.confirmedTalents.length})
          </h2>
          <div className="space-y-6">
            {proposal.confirmedTalents.map((talent) => (
              <TalentCard key={talent.id} talent={talent} isConfirmed={true} />
            ))}
          </div>
        </div>
      )}

      {/* Unconfirmed Talents */}
      {proposal.unconfirmedTalents.length > 0 && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Talents to Confirm ({proposal.unconfirmedTalents.length})
          </h2>
          <div className="space-y-6">
            {proposal.unconfirmedTalents.map((talent) => (
              <TalentCard key={talent.id} talent={talent} isConfirmed={false} />
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
                [...proposal.confirmedTalents, ...proposal.unconfirmedTalents]
                  .reduce((sum, talent) => sum + talent.instagramFollowers, 0)
              )}
            </div>
            <div className="text-sm text-gray-600">Total Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(
                [...proposal.confirmedTalents, ...proposal.unconfirmedTalents]
                  .reduce((sum, talent) => sum + talent.estimatedTotalImpressions, 0)
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