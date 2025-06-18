'use client';

import { MatchResult, Influencer } from '@/types/influencer';

interface InfluencerResultsProps {
  results: MatchResult[];
}

interface VerificationData {
  verified: boolean;
  confidence: number;
  overallScore: number;
  matchAnalysis: {
    nicheAlignment: {
      score: number;
      matchedKeywords: string[];
      explanation: string;
    };
    demographicMatch: {
      score: number;
      locationMatch: boolean;
      explanation: string;
    };
    brandCompatibility: {
      score: number;
      reasons: string[];
      redFlags: string[];
    };
    followerValidation: {
      score: number;
      inRange: boolean;
      quality: 'low' | 'medium' | 'high';
      explanation: string;
    };
  };
}

// Add verification data to the influencer interface
interface InfluencerWithVerification extends Influencer {
  verificationData?: VerificationData;
}

// Extended MatchResult with verification
interface MatchResultWithVerification extends MatchResult {
  influencer: InfluencerWithVerification;
}

export const InfluencerResults: React.FC<InfluencerResultsProps> = ({ results }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCostLevelColor = (costLevel: string): string => {
    switch (costLevel.toLowerCase()) {
      case 'budget': return 'text-green-600 bg-green-100';
      case 'mid-range': return 'text-blue-600 bg-blue-100';
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'celebrity': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (results.length === 0) {
    return null; // Don't render anything if no premium results
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Found {results.length} Perfect Match{results.length !== 1 ? 'es' : ''}
        </h2>
        <p className="text-gray-600 mt-1">
          Ranked by compatibility score and past campaign performance
        </p>
      </div>

      <div className="grid gap-6">
        {results.map((result, index) => (
          <div key={`${result.influencer.handle}-${index}`} data-testid="influencer-card" className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
              {/* Profile Section */}
              <div className="flex-shrink-0 mb-6 lg:mb-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {result.influencer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {result.influencer.name}
                    </h3>
                    <p className="text-gray-600">@{result.influencer.handle}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-medium text-blue-600">
                        #{index + 1} Match
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(result.matchScore)}`}>
                        {(result.matchScore * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="flex-grow">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Platform & Stats */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Platform & Reach</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform:</span>
                          <span className="font-medium platform-badge">{result.influencer.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Followers:</span>
                          <span className="font-medium follower-count">{formatNumber(result.influencer.followerCount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Engagement:</span>
                          <span className="font-medium engagement-rate">{(result.influencer.engagementRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Reach:</span>
                          <span className="font-medium text-green-600">{formatNumber(result.potentialReach)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Demographics */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Demographics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium">{result.influencer.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age Range:</span>
                          <span className="font-medium">{result.influencer.ageRange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{result.influencer.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Pricing */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average Rate:</span>
                          <span className="font-bold text-lg">${result.estimatedCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost Level:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostLevelColor(result.influencer.costLevel)}`}>
                            {result.influencer.costLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Niches */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Content Niches</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.influencer.niche.map((niche, nicheIndex) => (
                          <span 
                            key={`${niche}-${nicheIndex}`}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {niche}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Past Collaborations */}
                    {result.influencer.pastCollaborations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Brand Partnerships:</span>
                            <span className="font-medium">{result.influencer.pastCollaborations.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg. Rating:</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg 
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.round(result.influencer.pastCollaborations.reduce((sum, collab) => sum + collab.rating, 0) / result.influencer.pastCollaborations.length)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Why This Match Works</h4>
                  <ul className="space-y-1">
                    {result.matchReasons.map((reason, reasonIndex) => (
                      <li key={`${reason}-${reasonIndex}`} className="text-green-700 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition-colors">
                    Contact Influencer
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors">
                    Save for Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add verification summary component
const VerificationSummary: React.FC<{
  results: InfluencerWithVerification[];
}> = ({ results }) => {
  const verificationStats = results.reduce((acc, result) => {
    if (result.verificationData) {
      acc.verified++;
      acc.totalScore += result.verificationData.overallScore;
      if (result.verificationData.overallScore >= 80) acc.highQuality++;
      else if (result.verificationData.overallScore >= 60) acc.mediumQuality++;
      else acc.lowQuality++;
    }
    return acc;
  }, { 
    verified: 0, 
    totalScore: 0, 
    highQuality: 0, 
    mediumQuality: 0, 
    lowQuality: 0 
  });

  const averageScore = verificationStats.verified > 0 ? 
    Math.round(verificationStats.totalScore / verificationStats.verified) : 0;

  if (verificationStats.verified === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Verification Summary</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600">{averageScore}</span>
          <span className="text-sm text-gray-600">/100 avg</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{verificationStats.highQuality}</div>
          <div className="text-sm text-gray-600">High Quality</div>
          <div className="text-xs text-gray-500">80+ score</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{verificationStats.mediumQuality}</div>
          <div className="text-sm text-gray-600">Medium Quality</div>
          <div className="text-xs text-gray-500">60-79 score</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{verificationStats.lowQuality}</div>
          <div className="text-sm text-gray-600">Low Quality</div>
          <div className="text-xs text-gray-500">&lt;60 score</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{verificationStats.verified}</div>
          <div className="text-sm text-gray-600">Total Verified</div>
          <div className="text-xs text-gray-500">of {results.length} profiles</div>
        </div>
      </div>
    </div>
  );
}; 