'use client';

import React, { useState, useEffect } from 'react';
import { CampaignPerformancePrediction, CampaignPredictionInput, PerformancePrediction } from '@/lib/campaignPerformancePrediction';

interface CampaignPerformancePredictionPanelProps {
  influencers: any[];
  campaignData?: any;
  onPredictionUpdate?: (prediction: PerformancePrediction) => void;
}

const CampaignPerformancePredictionPanel: React.FC<CampaignPerformancePredictionPanelProps> = ({
  influencers,
  campaignData,
  onPredictionUpdate
}) => {
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionSystem] = useState(() => new CampaignPerformancePrediction());

  useEffect(() => {
    if (influencers.length > 0) {
      generatePrediction();
    }
  }, [influencers, campaignData]);

  const generatePrediction = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create mock campaign data if not provided
      const mockCampaignData = campaignData || {
        budget: 25000,
        duration: 30,
        objectives: ['brand_awareness', 'engagement'],
        targetAudience: {
          age: '25-34',
          gender: 'female',
          location: 'Spain',
          interests: ['fitness', 'lifestyle', 'wellness']
        },
        brand: {
          name: 'FitLife',
          industry: 'fitness',
          values: ['health', 'wellness', 'authenticity'],
          previousCampaigns: [
            { success: true, metrics: { roi: 3.2 }, influencerTier: 'micro' },
            { success: true, metrics: { roi: 2.8 }, influencerTier: 'nano' }
          ]
        },
        contentRequirements: {
          format: ['video', 'image', 'story'],
          messaging: ['authentic', 'lifestyle', 'wellness'],
          deliverables: 3
        }
      };

      // Transform influencers data to match prediction input format
      const transformedInfluencers = influencers.map(inf => ({
        username: inf.username || inf.name || 'unknown',
        platform: inf.platform || 'instagram',
        followers: inf.followers || inf.follower_count || 0,
        engagement: inf.engagement || inf.engagement_rate || 0,
        demographics: {
          age: inf.demographics?.age || '25-34',
          gender: inf.demographics?.gender || 'female',
          location: inf.location || 'Spain',
          interests: inf.interests || ['lifestyle']
        },
        pastPerformance: {
          avgViews: inf.avgViews || Math.floor(inf.followers * 0.1),
          avgLikes: inf.avgLikes || Math.floor(inf.followers * 0.05),
          avgComments: inf.avgComments || Math.floor(inf.followers * 0.01),
          brandCollaborations: inf.brandCollaborations || Math.floor(Math.random() * 10)
        },
        contentStyle: {
          format: inf.contentFormat || ['image', 'video'],
          topics: inf.topics || ['lifestyle', 'wellness'],
          tone: inf.tone || 'authentic'
        }
      }));

      const predictionInput: CampaignPredictionInput = {
        influencers: transformedInfluencers,
        campaign: mockCampaignData
      };

      const result = await predictionSystem.predictCampaignPerformance(predictionInput);
      setPrediction(result);
      
      if (onPredictionUpdate) {
        onPredictionUpdate(result);
      }
    } catch (err) {
      setError('Failed to generate performance prediction');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (impact: string): string => {
    if (impact === 'high') return 'text-red-600 bg-red-100';
    if (impact === 'medium') return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h3 className="text-red-800 font-semibold mb-2">Prediction Error</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={generatePrediction}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prediction Available</h3>
          <p className="text-gray-600 mb-3">Add influencers to generate performance prediction</p>
          <button 
            onClick={generatePrediction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Prediction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Campaign Performance Prediction</h3>
              <p className="text-blue-100 text-sm">AI-powered success forecasting</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(prediction.overallScore)}`}>
              {(prediction.overallScore * 100).toFixed(1)}% Success Score
            </div>
            <div className="text-blue-100 text-sm mt-1">
              {(prediction.confidence * 100).toFixed(0)}% Confidence
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Estimated Metrics */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Estimated Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{formatNumber(prediction.estimatedMetrics.reach)}</div>
              <div className="text-sm text-gray-600">Reach</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{formatNumber(prediction.estimatedMetrics.engagement)}</div>
              <div className="text-sm text-gray-600">Engagement</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{formatNumber(prediction.estimatedMetrics.conversions)}</div>
              <div className="text-sm text-gray-600">Conversions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{prediction.estimatedMetrics.roi.toFixed(1)}x</div>
              <div className="text-sm text-gray-600">ROI</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">{(prediction.estimatedMetrics.brandAwareness * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Brand Awareness</div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {prediction.riskFactors.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Risk Analysis</h4>
            <div className="space-y-2">
              {prediction.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.impact)}`}>
                    {risk.impact.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{risk.factor}</div>
                    <div className="text-sm text-gray-600 mt-1">{risk.mitigation}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(risk.probability * 100).toFixed(0)}% probability
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Optimization Recommendations</h4>
          <div className="space-y-2">
            {prediction.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {rec.priority.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{rec.category}</div>
                  <div className="text-sm text-gray-600 mt-1">{rec.suggestion}</div>
                </div>
                <div className="text-sm text-gray-500">
                  +{(rec.expectedImpact * 100).toFixed(0)}% impact
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Influencer Scores */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Influencer Performance Scores</h4>
          <div className="space-y-2">
            {prediction.influencerScores.map((score, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getScoreColor(score.individualScore)}`}>
                    {(score.individualScore * 100).toFixed(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">@{score.username}</div>
                    <div className="text-sm text-gray-600">
                      {score.strengths.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {(score.fit * 100).toFixed(0)}% fit
                  </div>
                  {score.concerns.length > 0 && (
                    <div className="text-xs text-red-600">
                      {score.concerns[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Conditions */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Market Conditions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Trending Topics</div>
                <div className="space-y-1">
                  {prediction.marketConditions.trends.map((trend, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Opportunities</div>
                <div className="space-y-1">
                  {prediction.marketConditions.opportunities.map((opportunity, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Suggestions */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Budget & Timeline Optimization</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Budget</div>
              <div className="text-lg font-bold text-gray-900">
                ${prediction.optimizationSuggestions.budget.recommended.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {prediction.optimizationSuggestions.budget.reasoning}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Timeline</div>
              <div className="text-lg font-bold text-gray-900">
                {prediction.optimizationSuggestions.timeline.recommended} days
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {prediction.optimizationSuggestions.timeline.reasoning}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Influencer Mix</div>
              <div className="text-lg font-bold text-gray-900">
                {prediction.optimizationSuggestions.influencerMix.recommended}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {prediction.optimizationSuggestions.influencerMix.reasoning}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-gray-200">
          <button 
            onClick={generatePrediction}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Update Prediction
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignPerformancePredictionPanel;