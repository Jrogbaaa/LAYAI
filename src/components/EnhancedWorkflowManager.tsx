'use client';

import React, { useState, useEffect } from 'react';
import { MatchResult } from '@/types/influencer';
import CampaignPerformancePredictionPanel from './CampaignPerformancePredictionPanel';
import EnhancedBrandCompatibilityEngine from './EnhancedBrandCompatibilityEngine';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  icon: string;
  component?: React.ComponentType<any>;
  data?: any;
}

interface EnhancedWorkflowManagerProps {
  searchResults?: MatchResult[];
  onWorkflowComplete?: (data: any) => void;
  currentCampaign?: any;
}

const EnhancedWorkflowManager: React.FC<EnhancedWorkflowManagerProps> = ({
  searchResults = [],
  onWorkflowComplete,
  currentCampaign
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<any>({});
  const [selectedInfluencers, setSelectedInfluencers] = useState<MatchResult[]>([]);

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'search',
      title: 'Search & Discovery',
      description: 'Find and filter influencers based on your criteria',
      status: searchResults.length > 0 ? 'completed' : 'pending',
      icon: '🔍',
      data: { results: searchResults }
    },
    {
      id: 'selection',
      title: 'Influencer Selection',
      description: 'Choose the best influencers for your campaign',
      status: 'pending',
      icon: '✅'
    },
    {
      id: 'compatibility',
      title: 'Brand Compatibility',
      description: 'Analyze brand-influencer compatibility',
      status: 'pending',
      icon: '🎯'
    },
    {
      id: 'prediction',
      title: 'Performance Prediction',
      description: 'Analyze predicted campaign performance',
      status: 'pending',
      icon: '📊'
    },
    {
      id: 'optimization',
      title: 'Campaign Optimization',
      description: 'Optimize budget, timeline, and messaging',
      status: 'pending',
      icon: '⚡'
    },
    {
      id: 'approval',
      title: 'Final Approval',
      description: 'Review and approve the campaign setup',
      status: 'pending',
      icon: '✨'
    }
  ]);

  useEffect(() => {
    if (searchResults.length > 0) {
      updateStepStatus('search', 'completed');
      if (currentStep === 0) {
        setCurrentStep(1);
      }
    }
  }, [searchResults]);

  useEffect(() => {
    if (selectedInfluencers.length > 0) {
      updateStepStatus('selection', 'completed');
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [selectedInfluencers]);

  const updateStepStatus = (stepId: string, status: WorkflowStep['status']) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleStepClick = (stepIndex: number) => {
    const step = workflowSteps[stepIndex];
    if (step.status === 'completed' || stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleInfluencerSelection = (matchResult: MatchResult, selected: boolean) => {
    if (selected) {
      setSelectedInfluencers((prev: MatchResult[]) => [...prev, matchResult]);
    } else {
      setSelectedInfluencers((prev: MatchResult[]) => prev.filter(inf => inf.influencer.id !== matchResult.influencer.id));
    }
  };

  const handleNextStep = () => {
    if (currentStep < workflowSteps.length - 1) {
      updateStepStatus(workflowSteps[currentStep].id, 'completed');
      setCurrentStep(currentStep + 1);
      updateStepStatus(workflowSteps[currentStep + 1].id, 'in_progress');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      updateStepStatus(workflowSteps[currentStep].id, 'pending');
      setCurrentStep(currentStep - 1);
      updateStepStatus(workflowSteps[currentStep - 1].id, 'in_progress');
    }
  };

  const handleWorkflowComplete = () => {
    const completedData = {
      selectedInfluencers,
      workflowData,
      campaign: currentCampaign,
      completedAt: new Date().toISOString()
    };
    
    if (onWorkflowComplete) {
      onWorkflowComplete(completedData);
    }
    
    updateStepStatus('approval', 'completed');
  };

  const getStepColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 border-blue-500 text-blue-700';
      case 'pending':
        return 'bg-gray-100 border-gray-300 text-gray-600';
      case 'skipped':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const renderStepContent = () => {
    const currentStepData = workflowSteps[currentStep];
    
    switch (currentStepData.id) {
      case 'search':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Found {searchResults.length} influencer{searchResults.length !== 1 ? 's' : ''} matching your criteria
                </div>
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {searchResults.slice(0, 5).map((result) => (
                    <div key={result.influencer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          @{result.influencer.handle || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.influencer.followerCount.toLocaleString()} followers
                          {result.influencer.engagementRate && 
                            ` • ${(result.influencer.engagementRate * 100).toFixed(1)}% engagement`
                          }
                        </div>
                      </div>
                      <div className="text-sm text-blue-600 bg-blue-50 rounded px-2 py-1">
                        Score: {(result.matchScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  {searchResults.length > 5 && (
                    <div className="text-sm text-gray-500 text-center">
                      ...and {searchResults.length - 5} more results
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No search results available. Please perform a search first.
              </div>
            )}
          </div>
        );

      case 'selection':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Influencers</h3>
            <div className="text-sm text-gray-600 mb-4">
              Choose the best influencers for your campaign ({selectedInfluencers.length} selected)
            </div>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {searchResults.map((matchResult) => (
                <div key={matchResult.influencer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedInfluencers.some(selected => selected.influencer.id === matchResult.influencer.id)}
                      onChange={(e) => handleInfluencerSelection(matchResult, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        @{matchResult.influencer.handle || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {matchResult.influencer.followerCount.toLocaleString()} followers
                        {matchResult.influencer.engagementRate && 
                          ` • ${(matchResult.influencer.engagementRate * 100).toFixed(1)}% engagement`
                        }
                      </div>
                      {matchResult.influencer.location && (
                        <div className="text-xs text-gray-500">📍 {matchResult.influencer.location}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600 bg-blue-50 rounded px-2 py-1">
                      Score: {(matchResult.matchScore * 100).toFixed(0)}%
                    </div>
                    {matchResult.estimatedCost && (
                      <div className="text-xs text-gray-500 mt-1">
                        Est: ${matchResult.estimatedCost.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {matchResult.matchReasons && matchResult.matchReasons.length > 0 && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded p-2">
                      {matchResult.matchReasons[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'compatibility':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Brand Compatibility Analysis</h3>
            {selectedInfluencers.length > 0 ? (
              <EnhancedBrandCompatibilityEngine
                influencers={selectedInfluencers}
                onCompatibilityUpdate={(results) => {
                  setWorkflowData(prev => ({ ...prev, compatibility: results }));
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Please select influencers first to analyze brand compatibility.
              </div>
            )}
          </div>
        );

      case 'prediction':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Prediction</h3>
            {selectedInfluencers.length > 0 ? (
              <CampaignPerformancePredictionPanel
                influencers={selectedInfluencers}
                campaignData={currentCampaign}
                onPredictionUpdate={(prediction) => {
                  setWorkflowData(prev => ({ ...prev, prediction }));
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Please select influencers first to generate predictions.
              </div>
            )}
          </div>
        );

      case 'optimization':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Optimization</h3>
            {workflowData.prediction ? (
              <div className="space-y-6">
                {/* Budget Optimization */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">💰 Budget Optimization</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Current Budget</div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${(workflowData.prediction.estimatedMetrics?.totalCost || currentCampaign?.budget || 25000).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Optimized Budget</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${workflowData.prediction.optimizationSuggestions?.budget?.recommended?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {workflowData.prediction.optimizationSuggestions?.budget?.savings && 
                          `Save $${workflowData.prediction.optimizationSuggestions.budget.savings.toLocaleString()}`
                        }
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      💡 <strong>Recommendation:</strong> {workflowData.prediction.optimizationSuggestions?.budget?.reasoning || 'Distribute budget across mix of micro and nano influencers for optimal ROI'}
                    </div>
                  </div>
                </div>

                {/* Timeline Optimization */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">⏰ Timeline Optimization</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                      <div className="text-sm text-gray-600 mb-2">Launch Phase</div>
                      <div className="text-lg font-bold text-gray-900">Days 1-7</div>
                      <div className="text-xs text-gray-500">Initial outreach & content creation</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                      <div className="text-sm text-gray-600 mb-2">Peak Phase</div>
                      <div className="text-lg font-bold text-gray-900">Days 8-21</div>
                      <div className="text-xs text-gray-500">Content publishing & engagement</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                      <div className="text-sm text-gray-600 mb-2">Conversion Phase</div>
                      <div className="text-lg font-bold text-gray-900">Days 22-30</div>
                      <div className="text-xs text-gray-500">Drive conversions & measure ROI</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-800">
                      💡 <strong>Optimal Duration:</strong> {workflowData.prediction.optimizationSuggestions?.timeline?.recommended || '30'} days for maximum engagement and conversion tracking
                    </div>
                  </div>
                </div>

                {/* Content Optimization */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">🎨 Content Strategy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Content Mix</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Video Content</span>
                          <span className="font-medium">60%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Image Posts</span>
                          <span className="font-medium">25%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Stories</span>
                          <span className="font-medium">15%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Posting Schedule</div>
                      <div className="space-y-2">
                        <div className="text-sm">📅 Mon/Wed/Fri optimal</div>
                        <div className="text-sm">🕕 6-8 PM peak engagement</div>
                        <div className="text-sm">📱 Stories daily</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Key Messages</div>
                      <div className="space-y-1">
                        <div className="text-xs bg-purple-100 text-purple-800 rounded px-2 py-1">Authenticity</div>
                        <div className="text-xs bg-pink-100 text-pink-800 rounded px-2 py-1">Lifestyle Integration</div>
                        <div className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1">Community Focus</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Tracking */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📊 Performance Tracking Setup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-800">Key Metrics to Track</h5>
                      <div className="space-y-2">
                        {[
                          { metric: 'Reach & Impressions', target: `${workflowData.prediction.estimatedMetrics?.reach?.toLocaleString() || '500K'}+ reach` },
                          { metric: 'Engagement Rate', target: `${workflowData.prediction.estimatedMetrics?.engagementRate || '4.2'}%+ average` },
                          { metric: 'Conversions', target: `${workflowData.prediction.estimatedMetrics?.conversions || '150'}+ conversions` },
                          { metric: 'ROI', target: `${workflowData.prediction.estimatedMetrics?.roi || '3.1'}x return` }
                        ].map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                            <span className="text-sm font-medium">{item.metric}</span>
                            <span className="text-sm text-green-600">{item.target}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-800">Monitoring Schedule</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                          <span>Daily engagement monitoring</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                          <span>Weekly performance reports</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                          <span>Mid-campaign optimization</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                          <span>Final ROI analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Please complete the performance prediction step first.
              </div>
            )}
          </div>
        );

      case 'approval':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">📋 Final Campaign Review</h3>
            
            {/* Campaign Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Campaign Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Selected Influencers</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedInfluencers.length}</div>
                  <div className="text-xs text-gray-500">
                    Total Reach: {selectedInfluencers.reduce((sum, inf) => sum + (inf.influencer.followerCount || inf.influencer.followers || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Estimated Budget</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${workflowData.prediction?.optimizationSuggestions?.budget?.recommended?.toLocaleString() || (currentCampaign?.budget || 25000).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Optimized allocation</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Expected ROI</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {workflowData.prediction?.estimatedMetrics?.roi || '3.1'}x
                  </div>
                  <div className="text-xs text-gray-500">Return on investment</div>
                </div>
              </div>
            </div>

            {/* Selected Influencers Review */}
            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Selected Influencer Review</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedInfluencers.map((influencer, index) => (
                  <div key={influencer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">@{influencer.influencer.handle || influencer.influencer.username}</div>
                        <div className="text-sm text-gray-600">
                          {(influencer.influencer.followerCount || influencer.influencer.followers || 0).toLocaleString()} followers
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        Compatibility: {workflowData.compatibility?.[influencer.id]?.overall ? (workflowData.compatibility[influencer.id].overall * 100).toFixed(0) : '85'}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Est. Cost: ${influencer.influencer.estimatedCost?.toLocaleString() || '2,500'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Checklist */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-4">✅ Pre-Launch Checklist</h4>
              <div className="space-y-3">
                {[
                  { item: 'Influencers selected and contacted', status: true },
                  { item: 'Content guidelines and brand kit shared', status: true },
                  { item: 'Posting schedule and deadlines confirmed', status: true },
                  { item: 'Tracking codes and analytics setup', status: true },
                  { item: 'Legal agreements and contracts signed', status: false },
                  { item: 'Budget allocation and payment terms confirmed', status: false },
                ].map((checkItem, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={checkItem.status}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      readOnly
                    />
                    <span className={`text-sm ${checkItem.status ? 'text-green-700' : 'text-gray-600'}`}>
                      {checkItem.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleWorkflowComplete}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <span>✅</span>
                <span>Approve & Launch Campaign</span>
              </button>
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                🔙 Review Previous Step
              </button>
            </div>

            {/* Campaign Launch Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>🚀 What happens after approval?</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Influencer outreach and contract finalization</li>
                  <li>Content creation and approval workflow activation</li>
                  <li>Real-time performance monitoring begins</li>
                  <li>Weekly optimization reports and recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step content not found</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Enhanced Campaign Workflow</h2>
        <p className="text-gray-600 text-sm">Follow these steps to create an optimized influencer campaign</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              <button
                onClick={() => handleStepClick(index)}
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  getStepColor(step.status)
                } ${index <= currentStep ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-50'}`}
              >
                <span className="text-lg">{step.icon}</span>
              </button>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < workflowSteps.length - 1 && (
                <div className="hidden md:block w-8 h-px bg-gray-300 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-4">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <button
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {workflowSteps.length}
        </div>
        
        <button
          onClick={handleNextStep}
          disabled={currentStep === workflowSteps.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default EnhancedWorkflowManager;