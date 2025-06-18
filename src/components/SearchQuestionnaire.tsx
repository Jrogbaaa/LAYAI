'use client';

import { useState } from 'react';

interface SearchQuestionnaireProps {
  initialQuery: string;
  onSearchWithContext: (query: string, context: SearchContext) => void;
  onSkipQuestionnaire: (query: string) => void;
}

interface SearchContext {
  brandName?: string;
  campaignType?: string;
  targetAudience?: {
    ageRange?: string;
    gender?: string;
    interests?: string[];
  };
  budget?: {
    min?: number;
    max?: number;
  };
  contentTypes?: string[];
  campaignGoals?: string[];
  preferredPlatforms?: string[];
  geographicFocus?: string;
  urgency?: string;
}

const SearchQuestionnaire: React.FC<SearchQuestionnaireProps> = ({
  initialQuery,
  onSearchWithContext,
  onSkipQuestionnaire,
}) => {
  const [context, setContext] = useState<SearchContext>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onSearchWithContext(initialQuery, context);
    }
  };

  const handleSkip = () => {
    onSkipQuestionnaire(initialQuery);
  };

  const updateContext = (updates: Partial<SearchContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand & Campaign Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name (if applicable)
                  </label>
                  <input
                    type="text"
                    value={context.brandName || ''}
                    onChange={(e) => updateContext({ brandName: e.target.value })}
                    placeholder="e.g., IKEA, Nike, Local Restaurant..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geographic Focus
                  </label>
                  <input
                    type="text"
                    value={context.geographicFocus || ''}
                    onChange={(e) => updateContext({ geographicFocus: e.target.value })}
                    placeholder="e.g., Spain, United States, Global..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Goals (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Brand awareness',
                      'Product launch',
                      'Drive sales',
                      'Build community',
                      'Educational content',
                      'Entertainment'
                    ].map((goal) => (
                      <label key={goal} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={context.campaignGoals?.includes(goal) || false}
                          onChange={(e) => {
                            const goals = context.campaignGoals || [];
                            if (e.target.checked) {
                              updateContext({ campaignGoals: [...goals, goal] });
                            } else {
                              updateContext({ campaignGoals: goals.filter(g => g !== goal) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Range
                  </label>
                  <select
                    value={context.targetAudience?.ageRange || ''}
                    onChange={(e) => updateContext({ 
                      targetAudience: { ...context.targetAudience, ageRange: e.target.value }
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any age range</option>
                    <option value="18-24">18-24 (Gen Z)</option>
                    <option value="25-34">25-34 (Millennials)</option>
                    <option value="35-44">35-44 (Millennials/Gen X)</option>
                    <option value="45+">45+ (Gen X/Boomers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender Focus
                  </label>
                  <select
                    value={context.targetAudience?.gender || ''}
                    onChange={(e) => updateContext({ 
                      targetAudience: { ...context.targetAudience, gender: e.target.value }
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="any">No preference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Interests
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Tech',
                      'Home/Decor', 'Lifestyle', 'Business', 'Entertainment', 'Health', 'Education'
                    ].map((interest) => (
                      <label key={interest} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={context.targetAudience?.interests?.includes(interest) || false}
                          onChange={(e) => {
                            const interests = context.targetAudience?.interests || [];
                            if (e.target.checked) {
                              updateContext({ 
                                targetAudience: { 
                                  ...context.targetAudience, 
                                  interests: [...interests, interest] 
                                }
                              });
                            } else {
                              updateContext({ 
                                targetAudience: { 
                                  ...context.targetAudience, 
                                  interests: interests.filter(i => i !== interest) 
                                }
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform & Budget</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Platforms
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn', 'Twitch'].map((platform) => (
                      <label key={platform} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={context.preferredPlatforms?.includes(platform) || false}
                          onChange={(e) => {
                            const platforms = context.preferredPlatforms || [];
                            if (e.target.checked) {
                              updateContext({ preferredPlatforms: [...platforms, platform] });
                            } else {
                              updateContext({ preferredPlatforms: platforms.filter(p => p !== platform) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Search Summary</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Query:</strong> {initialQuery}</p>
                    {context.brandName && <p><strong>Brand:</strong> {context.brandName}</p>}
                    {context.geographicFocus && <p><strong>Location:</strong> {context.geographicFocus}</p>}
                    {context.targetAudience?.ageRange && <p><strong>Age:</strong> {context.targetAudience.ageRange}</p>}
                    {context.targetAudience?.gender && <p><strong>Gender:</strong> {context.targetAudience.gender}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Improve Search Accuracy</h2>
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Skip questionnaire →
          </button>
        </div>
        <p className="text-gray-600">
          Answer a few quick questions to get more targeted influencer recommendations.
        </p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {renderStep()}

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {currentStep === totalSteps ? 'Search with Context' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SearchQuestionnaire; 