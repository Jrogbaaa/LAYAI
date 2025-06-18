import React, { useState } from 'react';

interface EnhancedSearchRequest {
  query: string;
  location?: string;
  gender?: 'male' | 'female' | 'any';
  minAge?: number;
  maxAge?: number;
  minFollowers?: number;
  maxFollowers?: number;
  niches?: string[];
  brandName?: string;
  platforms?: string[];
  enableSpanishDetection?: boolean;
  enableAgeEstimation?: boolean;
  maxResults?: number;
}

interface EnhancedInfluencer {
  username: string;
  fullName?: string;
  followers: number;
  platform: string;
  score?: number;
  enhancedScore?: number;
  scoreAdjustment?: number;
  enhancements?: string[];
  spanishValidation?: {
    isSpanish: boolean;
    confidence: number;
    indicators: string[];
  };
  ageEstimation?: {
    estimatedAge?: number;
    confidence: number;
    method: string;
  };
}

interface SearchResults {
  success: boolean;
  results: EnhancedInfluencer[];
  metadata: {
    totalFound: number;
    spanishValidated: number;
    ageEstimated: number;
    processingTime: number;
    enhancementsApplied: {
      spanishDetection: boolean;
      ageEstimation: boolean;
    };
  };
  recommendations: string[];
}

const EnhancedSearchDemo: React.FC = () => {
  const [searchParams, setSearchParams] = useState<EnhancedSearchRequest>({
    query: '',
    location: 'Spain',
    enableSpanishDetection: true,
    enableAgeEstimation: true,
    minAge: 18,
    maxAge: 35,
    minFollowers: 10000,
    maxFollowers: 1000000,
    niches: ['lifestyle', 'fashion'],
    platforms: ['instagram', 'tiktok']
  });

  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/enhanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          🇪🇸 Enhanced Spanish Influencer Search
        </h2>
        
        {/* Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={searchParams.location || ''}
              onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Spain, Madrid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={searchParams.minAge || ''}
                onChange={(e) => setSearchParams({...searchParams, minAge: parseInt(e.target.value) || undefined})}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
              <input
                type="number"
                value={searchParams.maxAge || ''}
                onChange={(e) => setSearchParams({...searchParams, maxAge: parseInt(e.target.value) || undefined})}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follower Range
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={searchParams.minFollowers || ''}
                onChange={(e) => setSearchParams({...searchParams, minFollowers: parseInt(e.target.value) || undefined})}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
              <input
                type="number"
                value={searchParams.maxFollowers || ''}
                onChange={(e) => setSearchParams({...searchParams, maxFollowers: parseInt(e.target.value) || undefined})}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {/* Enhancement Options */}
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={searchParams.enableSpanishDetection}
              onChange={(e) => setSearchParams({...searchParams, enableSpanishDetection: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">🇪🇸 Spanish Location Detection</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={searchParams.enableAgeEstimation}
              onChange={(e) => setSearchParams({...searchParams, enableAgeEstimation: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">🎂 Age Estimation</span>
          </label>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isLoading ? 'Searching...' : 'Search Enhanced'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Search Results</h3>
            
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{results.metadata.totalFound}</div>
                <div className="text-sm text-blue-800">Total Found</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{results.metadata.spanishValidated}</div>
                <div className="text-sm text-green-800">Spanish Validated</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{results.metadata.ageEstimated}</div>
                <div className="text-sm text-purple-800">Age Estimated</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">{results.metadata.processingTime}ms</div>
                <div className="text-sm text-gray-800">Processing Time</div>
              </div>
            </div>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className="text-yellow-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Influencer Results */}
          <div className="space-y-4">
            {results.results.map((influencer, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">@{influencer.username}</h4>
                    {influencer.fullName && (
                      <p className="text-gray-600">{influencer.fullName}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {influencer.platform} • {influencer.followers.toLocaleString()} followers
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {influencer.enhancedScore && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Score:</span>
                        <span className="font-bold text-lg text-blue-600">{influencer.enhancedScore}</span>
                                                 {influencer.scoreAdjustment !== undefined && influencer.scoreAdjustment !== 0 && (
                           <span className={`text-sm ${influencer.scoreAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                             ({influencer.scoreAdjustment > 0 ? '+' : ''}{influencer.scoreAdjustment})
                           </span>
                         )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Spanish Validation */}
                {influencer.spanishValidation && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🇪🇸</span>
                      <span className={`font-semibold ${influencer.spanishValidation.isSpanish ? 'text-green-600' : 'text-red-600'}`}>
                        {influencer.spanishValidation.isSpanish ? 'Spanish Location Confirmed' : 'Not Spanish'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({influencer.spanishValidation.confidence}% confidence)
                      </span>
                    </div>
                    {influencer.spanishValidation.indicators.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Indicators: {influencer.spanishValidation.indicators.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Age Estimation */}
                {influencer.ageEstimation && influencer.ageEstimation.estimatedAge && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🎂</span>
                      <span className="font-semibold text-purple-600">
                        Estimated Age: {influencer.ageEstimation.estimatedAge}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({influencer.ageEstimation.confidence}% confidence, {influencer.ageEstimation.method})
                      </span>
                    </div>
                  </div>
                )}

                {/* Enhancements */}
                {influencer.enhancements && influencer.enhancements.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-semibold text-gray-700 mb-2">Enhancements Applied:</h5>
                    <ul className="space-y-1">
                      {influencer.enhancements.map((enhancement, enhIndex) => (
                        <li key={enhIndex} className="text-sm text-gray-600">
                          {enhancement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchDemo; 