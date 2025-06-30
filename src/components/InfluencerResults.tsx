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
  const isValidInstagramHandle = (influencer: any): { isValid: boolean; reason?: string } => {
    // First check if we have Apify validation data (most reliable)
    if (influencer.validationStatus) {
      return {
        isValid: influencer.validationStatus.isValidProfile && !influencer.validationStatus.isBrandAccount,
        reason: influencer.validationStatus.validationReason
      };
    }

    // Fallback to frontend validation if no backend data
    const handle = influencer.handle;
    if (!handle || typeof handle !== 'string') {
      return { isValid: false, reason: 'Handle no disponible' };
    }
    
    // Check for obvious invalid patterns
    const invalidPatterns = [
      /techblockproject/i,
      /gmail\.com/i,
      /yahoo\.com/i,
      /hotmail\.com/i,
      /[./]/,
      /undefined/i,
      /null/i,
      /error/i,
      /test/i,
      /example/i,
      /sample/i,
      /^[a-z]{1,2}$/,
      /^[\d]+$/,
      /\s/,
      /[<>]/,
      /www\./i,
      /http/i,
      /\.com/i,
      /\.net/i,
      /\.org/i,
      // Common invalid usernames from search results
      /reserved/i,
      /global_mrm/i,
      /worldarchitecturedesign/i,
      /studiomcgee/i,
      /westwingcom/i,
      /pullandbear/i,
      /patrikssontalent/i
    ];
    
    // Must be reasonable length and contain valid characters
    const isValidLength = handle.length > 2 && handle.length < 30;
    const hasValidChars = /^[a-zA-Z0-9._]+$/.test(handle);
    const noConsecutiveDots = !handle.includes('..');
    const notStartsWithDot = !handle.startsWith('.');
    const notEndsWithDot = !handle.endsWith('.');
    
    const hasInvalidPattern = invalidPatterns.some(pattern => pattern.test(handle));
    
    if (hasInvalidPattern) {
      return { isValid: false, reason: 'Patrón de handle inválido detectado' };
    }
    
    if (!isValidLength || !hasValidChars || !noConsecutiveDots || !notStartsWithDot || !notEndsWithDot) {
      return { isValid: false, reason: 'Formato de handle inválido' };
    }
    
    return { isValid: true };
  };

  const getProfileLink = (handle: string, name: string): string => {
    // Clean the handle and create Instagram URL
    const cleanHandle = handle?.replace('@', '') || '';
    return `https://instagram.com/${cleanHandle}`;
  };

  const getGoogleSearchLink = (handle: string, name: string): string => {
    return `https://google.com/search?q=${encodeURIComponent(`${name} ${handle} Instagram influencer`)}`;
  };

  const formatNumber = (num: number | undefined | null): string => {
    // Handle undefined, null, or non-numeric values
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    
    const numValue = Number(num);
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    return numValue.toString();
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-700 bg-green-100';
    if (score >= 0.6) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getCostLevelColor = (costLevel: string): string => {
    switch (costLevel.toLowerCase()) {
      case 'budget': return 'text-green-700 bg-green-100';
      case 'mid-range': return 'text-blue-700 bg-blue-100';
      case 'premium': return 'text-purple-700 bg-purple-100';
      case 'celebrity': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (results.length === 0) {
    return null; // Don't render anything if no premium results
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {results.length} Coincidencia{results.length !== 1 ? 's' : ''} Perfecta{results.length !== 1 ? 's' : ''} Encontrada{results.length !== 1 ? 's' : ''}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">
          Clasificados por puntuación de compatibilidad y rendimiento de campañas anteriores
        </p>
        

      </div>

      <div className="grid gap-3" data-testid="influencer-results">
        {results.map((result, index) => {
          const validation = isValidInstagramHandle(result.influencer);
          
          return (
            <div key={`${result.influencer.handle}-${index}`} data-testid="influencer-card" className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-5">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {result.influencer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {result.influencer.name || 'Unknown Name'}
                    </h3>
                    <p className="text-sm text-gray-600">@{result.influencer.handle || 'unknown'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(result.matchScore)}`}>
                    #{index + 1} • {(result.matchScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Stats Grid - Fixed Height for Consistency */}
              <div className="grid grid-cols-4 gap-4 mb-4 py-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Seguidores</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{formatNumber(result.influencer.followerCount)}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Engagement</p>
                  <p className="text-base font-bold text-green-600 mt-1">{((result.influencer.engagementRate || 0) * 100).toFixed(1)}%</p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tarifa Est.</p>
                  <p className="text-base font-bold text-blue-600 mt-1">${(result.estimatedCost || 0).toLocaleString()}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Plataforma</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{result.influencer.platform || 'Unknown'}</p>
                </div>
              </div>

              {/* Brand Collaboration Status */}
              {(result as any).brandCollaboration && (
                <div className="mb-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    (result as any).brandCollaboration.hasWorkedWith 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                    {(result as any).brandCollaboration.hasWorkedWith ? (
                      <>
                        <span className="text-green-600">✅</span>
                        <span>Ha trabajado con {(result as any).brandCollaboration.brandName.toUpperCase()}</span>
                        <span className="text-green-600 text-xs">
                          ({(result as any).brandCollaboration.confidence}% confianza)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">❌</span>
                        <span>Sin colaboraciones previas con {(result as any).brandCollaboration.brandName.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tags Row - Fixed Height */}
              <div className="flex flex-wrap items-center gap-2 mb-4 min-h-[2rem]">
                {/* Niches */}
                {(result.influencer.niche || []).slice(0, 2).map((niche, nicheIndex) => (
                  <span 
                    key={`${niche}-${nicheIndex}`}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                  >
                    {niche}
                  </span>
                ))}
                
                {/* Location */}
                {result.influencer.location && (
                  <span className="text-xs text-gray-600 flex items-center">
                    📍 {result.influencer.location}
                  </span>
                )}
                
                {/* Cost Level */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostLevelColor(result.influencer.costLevel || 'budget')}`}>
                  {result.influencer.costLevel || 'Budget'}
                </span>
              </div>

              {/* Match Reason - Fixed Height */}
              <div className="mb-4 min-h-[2.5rem] flex items-center">
                {(result.matchReasons || []).length > 0 && (
                  <div className="w-full p-2 bg-green-50 rounded-md border border-green-200">
                    <p className="text-xs text-green-700 flex items-center">
                      <svg className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {result.matchReasons[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Fixed Alignment */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                {validation.isValid ? (
                  <a
                    href={getProfileLink(result.influencer.handle, result.influencer.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2.5 rounded-md font-medium hover:from-pink-600 hover:to-purple-700 transition-all text-sm flex items-center justify-center shadow-sm"
                    title="Ver perfil de Instagram"
                  >
                    📸 Instagram
                  </a>
                ) : (
                  <div className="flex-1">
                    <span className="w-full bg-gray-300 text-gray-500 px-4 py-2.5 rounded-md text-sm cursor-not-allowed flex items-center justify-center" title={validation.reason}>
                      ⚠️ Perfil No Válido
                    </span>
                  </div>
                )}
                
                <a
                  href={getGoogleSearchLink(result.influencer.handle, result.influencer.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-gray-700 transition-colors text-sm flex items-center justify-center shadow-sm"
                  title="Buscar en Google"
                >
                  🔍 Buscar
                </a>
              </div>
            </div>
          );
        })}
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