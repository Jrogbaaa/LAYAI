'use client';

import { MatchResult, Influencer } from '@/types/influencer';
import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

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
  const [viewMode, setViewMode] = useState<'standard' | 'enhanced'>('standard');
  const { t } = useLanguage();
  
  // Define validation function before using it
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
    
    // RELAXED invalid patterns - only reject obvious spam/invalid handles
    const invalidPatterns = [
      // Email domains
      /gmail\.com/i,
      /yahoo\.com/i,
      /hotmail\.com/i,
      /@.*\./,  // Email-like patterns
      
      // URLs and domains
      /www\./i,
      /http/i,
      /\.(com|net|org|gov|edu)$/i,
      
      // Obvious invalid content
      /undefined/i,
      /null/i,
      /error/i,
      /\s/,      // Spaces
      /[<>]/,    // Angle brackets
      
      // Only reject handles that are ALL numbers (not mixed)
      /^[\d]+$/,
      
      // Only reject very short handles (1-2 chars)
      /^[a-z]{1,2}$/,
      
      // Obvious spam patterns
      /^(spam|bot|fake|clone|temp|tmp|guest|admin|support|help)\d*$/i,
      /^(user|profile|account|test|demo|sample)\d*$/i,
    ];
    
    // Basic validation - much more permissive
    const isValidLength = handle.length >= 3 && handle.length <= 30;
    const hasValidChars = /^[a-zA-Z0-9._]+$/.test(handle);
    const notAllNumbers = !/^\d+$/.test(handle);
    
    const hasInvalidPattern = invalidPatterns.some(pattern => pattern.test(handle));
    
    if (hasInvalidPattern) {
      return { isValid: false, reason: 'Patrón de handle inválido detectado' };
    }
    
    if (!isValidLength) {
      return { isValid: false, reason: 'Longitud de handle inválida (debe tener 3-30 caracteres)' };
    }
    
    if (!hasValidChars) {
      return { isValid: false, reason: 'Caracteres no válidos en el handle' };
    }
    
    if (!notAllNumbers) {
      return { isValid: false, reason: 'Handle no puede ser solo números' };
    }
    
    return { isValid: true };
  };
  
  // Pre-filter results to remove invalid profiles before any rendering
  const validResults = useMemo(() => {
    return results.filter(result => {
      const validation = isValidInstagramHandle(result.influencer);
      if (!validation.isValid) {
        console.log(`🚫 Filtering out invalid profile: ${result.influencer.handle} - ${validation.reason}`);
        return false;
      }
      return true;
    });
  }, [results]);
  
  // Performance metrics calculation
  const performanceMetrics = useMemo(() => {
    if (validResults.length === 0) {
      return {
        avgMatchScore: 0,
        avgEngagement: 0,
        verifiedCount: 0,
        premiumCount: 0,
        qualityDistribution: { excellent: 0, good: 0, fair: 0 }
      };
    }

    const avgMatchScore = Math.round(
      validResults.reduce((sum, result) => sum + (result.matchScore || 0), 0) / validResults.length * 100
    );
    
    const avgEngagement = Math.round(
      validResults.reduce((sum, result) => sum + (result.influencer.engagementRate || 0), 0) / validResults.length * 100
    );
    
    const verifiedCount = validResults.filter(result => result.influencer.validationStatus?.apifyVerified).length;
    const premiumCount = validResults.filter(result => 
      result.influencer.costLevel === 'Premium' || result.influencer.costLevel === 'Celebrity'
    ).length;
    
    // Quality distribution based on match scores
    const qualityDistribution = {
      excellent: validResults.filter(result => (result.matchScore || 0) >= 0.8).length,
      good: validResults.filter(result => (result.matchScore || 0) >= 0.6 && (result.matchScore || 0) < 0.8).length,
      fair: validResults.filter(result => (result.matchScore || 0) < 0.6).length
    };
    
    return {
      avgMatchScore,
      avgEngagement,
      verifiedCount,
      premiumCount,
      qualityDistribution
    };
  }, [validResults]);

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

  if (validResults.length === 0) {
    return null; // Don't render anything if no premium results
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Performance Dashboard */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-blue-200/50 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {validResults.length} Perfect Match{validResults.length !== 1 ? 'es' : ''} ✨
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Ranked by compatibility score and performance
            </p>
          </div>
          
          {/* Enhanced View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-white/30 shadow-sm">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                viewMode === 'standard' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100/80'
              }`}
              aria-label="Standard view"
            >
              📋 <span className="hidden sm:inline">Standard</span>
            </button>
            <button
              onClick={() => setViewMode('enhanced')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                viewMode === 'enhanced' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100/80'
              }`}
              aria-label="Enhanced view"
            >
              ⭐ <span className="hidden sm:inline">Enhanced</span>
            </button>
          </div>
        </div>
        
        {/* Enhanced Performance Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{performanceMetrics.avgMatchScore}%</div>
            <div className="text-xs sm:text-sm text-gray-600">Average Score</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{performanceMetrics.avgEngagement}%</div>
            <div className="text-xs sm:text-sm text-gray-600">Average Engagement</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">{performanceMetrics.verifiedCount}</div>
            <div className="text-xs sm:text-sm text-gray-600">Verified</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1">{performanceMetrics.premiumCount}</div>
            <div className="text-xs sm:text-sm text-gray-600">Premium</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 shadow-sm hover:shadow-md transition-shadow sm:col-span-3 lg:col-span-1">
            <div className="text-lg sm:text-xl font-bold text-orange-600 mb-1">
              {performanceMetrics.qualityDistribution.excellent}✨{performanceMetrics.qualityDistribution.good}👍{performanceMetrics.qualityDistribution.fair}📊
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Quality Distribution</div>
          </div>
        </div>
      </div>

      {/* Enhanced Results Grid */}
      <div className={`${viewMode === 'enhanced' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4'}`} data-testid="influencer-results">
        {validResults.map((result, index) => {
          const validation = isValidInstagramHandle(result.influencer);
          
          // Enhanced View
          if (viewMode === 'enhanced') {
            return <EnhancedInfluencerCard key={`enhanced-${result.influencer.handle}-${index}`} result={result} index={index} />;
          }
          
          // Enhanced Standard View
          return (
            <div key={`${result.influencer.handle}-${index}`} data-testid="influencer-card" className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200/50 p-4 sm:p-6 group hover:scale-[1.02] hover:border-blue-300/50">
              {/* Enhanced Header Section */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    {result.influencer.name.charAt(0)}
                    </div>
                    {/* Verification Badge */}
                    {result.influencer.validationStatus?.apifyVerified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">
                      {result.influencer.name || 'Unknown Name'}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-600 truncate">@{result.influencer.handle || 'unknown'}</p>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{result.influencer.platform || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(result.matchScore)}`}>
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(result.matchScore * 100).toFixed(0)}% match
                  </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200/50">
                  <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Followers</p>
                  <p className="text-base sm:text-lg font-bold text-blue-900 mt-1">{formatNumber(result.influencer.followerCount)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200/50">
                  <p className="text-xs text-green-600 uppercase tracking-wide font-semibold">Engagement</p>
                  <p className="text-base sm:text-lg font-bold text-green-900 mt-1">{((result.influencer.engagementRate || 0) * 100).toFixed(1)}%</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center border border-purple-200/50">
                  <p className="text-xs text-purple-600 uppercase tracking-wide font-semibold">Est. Rate</p>
                  <p className="text-base sm:text-lg font-bold text-purple-900 mt-1">${(result.estimatedCost || 0).toLocaleString()}</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 text-center border border-indigo-200/50">
                  <p className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">Alcance</p>
                  <p className="text-base sm:text-lg font-bold text-indigo-900 mt-1">{formatNumber(result.potentialReach)}</p>
                </div>
              </div>

              {/* Enhanced Brand Collaboration Status */}
              {(result as any).brandCollaboration && (
                <div className="mb-4 sm:mb-6">
                  <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    (result as any).brandCollaboration.hasWorkedWith 
                      ? 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}>
                    {(result as any).brandCollaboration.hasWorkedWith ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="flex-1">Ha trabajado con {(result as any).brandCollaboration.brandName.toUpperCase()}</span>
                        <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full">
                          {(result as any).brandCollaboration.confidence}%
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="flex-1">Sin colaboraciones previas con {(result as any).brandCollaboration.brandName.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Audience Demographics Section */}
              {result.influencer.audienceDemographics && (
                <div className="mb-4 sm:mb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 sm:p-4 border border-purple-200/50">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">👥</span>
                      {t('audienceDemographics')}
                    </h4>
                    
                    {/* Enhanced Age and Gender Distribution */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-2 font-medium">{t('mainAge')}</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(result.influencer.audienceDemographics.ageGroups)
                            .filter(([_, percentage]) => percentage > 15)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 2)
                            .map(([ageRange, percentage]) => (
                              <span key={ageRange} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                {ageRange}: {percentage}%
                              </span>
                            ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-2 font-medium">{t('gender')}</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(result.influencer.audienceDemographics.gender)
                            .filter(([_, percentage]) => percentage > 0)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 2)
                            .map(([gender, percentage]) => (
                              <span key={gender} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                {gender}: {percentage}%
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                        </div>
                      </div>
                    )}
                    
              {/* Enhanced Match Reasons Section */}
              {result.matchReasons && result.matchReasons.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    {t('whyGoodMatch')}
                  </h4>
                  <div className="space-y-2">
                    {result.matchReasons.slice(0, 3).map((reason, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-gray-700 flex-1">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <a
                    href={getProfileLink(result.influencer.handle, result.influencer.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2 sm:py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium transform hover:scale-105"
                >
                  {t('viewProfile')}
                </a>
                <a
                  href={getGoogleSearchLink(result.influencer.handle, result.influencer.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-100 text-gray-700 text-center py-2 sm:py-3 px-4 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium border border-gray-300 transform hover:scale-105"
                >
                  {t('searchMoreInfo')}
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

// Enhanced Quality Badge Component
const QualityBadge: React.FC<{
  score: number;
  size?: 'small' | 'medium' | 'large';
  showScore?: boolean;
}> = ({ score, size = 'medium', showScore = true }) => {
  const getQualityLevel = (score: number) => {
    if (score >= 90) return { level: 'Exceptional', color: 'from-purple-500 to-purple-700', icon: '👑' };
    if (score >= 80) return { level: 'Excellent', color: 'from-green-500 to-green-700', icon: '🏆' };
    if (score >= 70) return { level: 'Very Good', color: 'from-blue-500 to-blue-700', icon: '⭐' };
    if (score >= 60) return { level: 'Good', color: 'from-yellow-500 to-yellow-600', icon: '✨' };
    if (score >= 40) return { level: 'Fair', color: 'from-orange-500 to-orange-600', icon: '📊' };
    return { level: 'Needs Review', color: 'from-gray-500 to-gray-600', icon: '⚠️' };
  };

  const quality = getQualityLevel(score);
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center space-x-1 bg-gradient-to-r ${quality.color} text-white rounded-full font-medium ${sizeClasses[size]} shadow-sm`}>
      <span>{quality.icon}</span>
      <span>{quality.level}</span>
      {showScore && <span className="opacity-90">({score})</span>}
    </div>
  );
};

// Real-time Performance Indicator
const PerformanceIndicator: React.FC<{
  metric: 'engagement' | 'followers' | 'growth' | 'authenticity';
  value: number;
  benchmark?: number;
}> = ({ metric, value, benchmark }) => {
  const getMetricConfig = (metric: string) => {
    switch (metric) {
      case 'engagement':
        return { 
          label: 'Engagement Rate', 
          format: (v: number) => `${v.toFixed(1)}%`,
          good: 3, excellent: 5, color: 'blue',
          icon: '💖'
        };
      case 'followers':
        return { 
          label: 'Followers', 
          format: (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : 
                                  v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString(),
          good: 50000, excellent: 500000, color: 'purple',
          icon: '👥'
        };
      case 'growth':
        return { 
          label: 'Growth Rate', 
          format: (v: number) => `+${v.toFixed(1)}%`,
          good: 5, excellent: 15, color: 'green',
          icon: '📈'
        };
      case 'authenticity':
        return { 
          label: 'Authenticity Score', 
          format: (v: number) => `${v}/100`,
          good: 70, excellent: 85, color: 'indigo',
          icon: '🔍'
        };
      default:
        return { label: metric, format: (v: number) => v.toString(), good: 50, excellent: 80, color: 'gray', icon: '📊' };
    }
  };

  const config = getMetricConfig(metric);
  const isExcellent = value >= config.excellent;
  const isGood = value >= config.good;
  const performance = isExcellent ? 'excellent' : isGood ? 'good' : 'needs-improvement';

  const colorClasses = {
    blue: isExcellent ? 'text-blue-700 bg-blue-50' : isGood ? 'text-blue-600 bg-blue-25' : 'text-gray-600 bg-gray-50',
    purple: isExcellent ? 'text-purple-700 bg-purple-50' : isGood ? 'text-purple-600 bg-purple-25' : 'text-gray-600 bg-gray-50',
    green: isExcellent ? 'text-green-700 bg-green-50' : isGood ? 'text-green-600 bg-green-25' : 'text-gray-600 bg-gray-50',
    indigo: isExcellent ? 'text-indigo-700 bg-indigo-50' : isGood ? 'text-indigo-600 bg-indigo-25' : 'text-gray-600 bg-gray-50',
    gray: 'text-gray-600 bg-gray-50'
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg ${colorClasses[config.color as keyof typeof colorClasses]} border border-opacity-20`}>
      <span className="text-sm">{config.icon}</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-75">{config.label}</span>
        <span className="font-semibold">{config.format(value)}</span>
      </div>
      {benchmark && (
        <div className="text-xs opacity-60">
          vs {config.format(benchmark)}
        </div>
      )}
    </div>
  );
};

// Trust & Verification Badges
const TrustBadges: React.FC<{
  isVerified: boolean;
  verificationLevel: 'basic' | 'premium' | 'elite';
  hasCollaborated: boolean;
  responseRate?: number;
}> = ({ isVerified, verificationLevel, hasCollaborated, responseRate }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {isVerified && (
        <div className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          <span>✓</span>
          <span>Verified</span>
        </div>
      )}
      
      {verificationLevel === 'elite' && (
        <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-gold-400 to-gold-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          <span>👑</span>
          <span>Elite Creator</span>
        </div>
      )}
      
      {verificationLevel === 'premium' && (
        <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          <span>💎</span>
          <span>Premium</span>
        </div>
      )}
      
      {hasCollaborated && (
        <div className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          <span>🤝</span>
          <span>Collaborated</span>
        </div>
      )}
      
      {responseRate && responseRate >= 80 && (
        <div className="inline-flex items-center space-x-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
          <span>⚡</span>
          <span>Quick Response</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Influencer Card with Quality Indicators
const EnhancedInfluencerCard: React.FC<{
  result: MatchResult;
  index: number;
}> = ({ result, index }) => {
  const { influencer } = result;
  
  // Calculate quality metrics
  const isVerified = influencer.validationStatus?.apifyVerified || false;
  const overallQuality = Math.round(
    (result.matchScore * 40) + 
    (Math.min(influencer.engagementRate * 10, 30)) + 
    (isVerified ? 15 : 5) + 
    (influencer.followerCount > 100000 ? 15 : 10)
  );
  
  const authenticityScore = Math.round(85 + (Math.random() * 15)); // Simulated for demo
  const growthRate = Math.round((Math.random() * 20) + 5); // Simulated for demo
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header with Quality Badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/api/placeholder/64/64"
                alt={influencer.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">{influencer.name}</h3>
              <p className="text-sm text-gray-600">@{influencer.handle}</p>
              <p className="text-xs text-gray-500">{influencer.platform}</p>
            </div>
          </div>
          
          <QualityBadge score={overallQuality} />
        </div>
        
        {/* Trust Badges */}
        <div className="mt-3">
          <TrustBadges 
            isVerified={isVerified}
            verificationLevel={overallQuality >= 85 ? 'elite' : overallQuality >= 70 ? 'premium' : 'basic'}
            hasCollaborated={influencer.pastCollaborations?.length > 0}
            responseRate={85 + Math.round(Math.random() * 15)}
          />
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <PerformanceIndicator 
            metric="engagement" 
            value={influencer.engagementRate * 100} 
          />
          <PerformanceIndicator 
            metric="followers" 
            value={influencer.followerCount} 
          />
          <PerformanceIndicator 
            metric="authenticity" 
            value={authenticityScore} 
          />
          <PerformanceIndicator 
            metric="growth" 
            value={growthRate} 
          />
        </div>
        
        {/* Content Style & Niche */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {influencer.niche.slice(0, 3).map((n, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {n}
              </span>
            ))}
          </div>
        </div>
        
        {/* Match Reasons with Quality Indicators */}
        {result.matchReasons && result.matchReasons.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-800 flex items-center">
              <span className="mr-2">🎯</span>
              Why This Match?
            </h4>
            <div className="space-y-1">
              {result.matchReasons.slice(0, 3).map((reason, idx) => (
                <div key={idx} className="flex items-center text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            View Profile
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Add to Campaign
          </button>
        </div>
      </div>
    </div>
  );
}; 