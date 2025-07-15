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

  const handleInfluencerSelection = (influencer: MatchResult, selected: boolean) => {
    if (selected) {
      setSelectedInfluencers(prev => [...prev, influencer]);
    } else {
      setSelectedInfluencers(prev => prev.filter(inf => inf.id !== influencer.id));
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
    const step = workflowSteps[currentStep];
    
    switch (step.id) {
      case 'search':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              <span className="text-sm text-gray-500">
                {searchResults.length} influencers found
              </span>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {searchResults.slice(0, 10).map((influencer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {influencer.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{influencer.name || influencer.username || 'Unknown'}</h4>
                        <p className="text-sm text-gray-500">@{influencer.handle || influencer.username || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {influencer.followers?.toLocaleString()} followers • {influencer.engagement?.toFixed(1)}% engagement
                    </div>
                  </div>
                ))}
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Influencers</h3>
              <span className="text-sm text-gray-500">
                {selectedInfluencers.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {searchResults.map((influencer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedInfluencers.some(inf => inf.id === influencer.id)}
                      onChange={(e) => handleInfluencerSelection(influencer, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {influencer.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{influencer.name || influencer.username || 'Unknown'}</h4>
                      <p className="text-sm text-gray-500">@{influencer.handle || influencer.username || 'unknown'}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {influencer.followers?.toLocaleString()} followers • {influencer.engagement?.toFixed(1)}% engagement
                  </div>
                  {influencer.matchReason && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded p-2">
                      {influencer.matchReason}
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Optimization</h3>
            {workflowData.prediction ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Budget Optimization</h4>
                    <div className="text-sm text-gray-600">
                      <p>Recommended: ${workflowData.prediction.optimizationSuggestions?.budget?.recommended?.toLocaleString() || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {workflowData.prediction.optimizationSuggestions?.budget?.reasoning || 'No recommendations available'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Timeline Optimization</h4>
                    <div className="text-sm text-gray-600">
                      <p>Recommended: {workflowData.prediction.optimizationSuggestions?.timeline?.recommended || 'N/A'} days</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {workflowData.prediction.optimizationSuggestions?.timeline?.reasoning || 'No recommendations available'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Influencer Mix</h4>
                    <div className="text-sm text-gray-600">
                      <p>{workflowData.prediction.optimizationSuggestions?.influencerMix?.recommended || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {workflowData.prediction.optimizationSuggestions?.influencerMix?.reasoning || 'No recommendations available'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-3">Key Recommendations</h4>
                  <div className="space-y-2">
                    {workflowData.prediction.recommendations?.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{rec.category}</div>
                          <div className="text-sm text-gray-600">{rec.suggestion}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Please complete the prediction step first.
              </div>
            )}
          </div>
        );

      case 'approval':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Final Approval</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Campaign Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Selected Influencers</div>
                  <div className="text-lg font-bold text-gray-900">{selectedInfluencers.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Predicted Success Score</div>
                  <div className="text-lg font-bold text-gray-900">
                    {workflowData.prediction ? 
                      `${(workflowData.prediction.overallScore * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Estimated Reach</div>
                  <div className="text-lg font-bold text-gray-900">
                    {workflowData.prediction ? 
                      workflowData.prediction.estimatedMetrics.reach.toLocaleString() : 
                      'N/A'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Estimated ROI</div>
                  <div className="text-lg font-bold text-gray-900">
                    {workflowData.prediction ? 
                      `${workflowData.prediction.estimatedMetrics.roi.toFixed(1)}x` : 
                      'N/A'
                    }
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleWorkflowComplete}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Approve Campaign
                </button>
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