'use client';

import React, { useState, useEffect } from 'react';

interface MemoryStats {
  totalSearches: number;
  totalFeedback: number;
  activeCampaigns: string[];
  recentSearches: any[];
  pendingFeedback: number;
  learningInsights: {
    topPerformingNiches: string[];
    preferredPlatforms: string[];
    budgetRanges: { min: number; max: number; frequency: number }[];
  };
}

const MemoryDashboard: React.FC = () => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMemoryStats();
  }, []);

  const loadMemoryStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/campaign-insights');
      const data = await response.json();
      
      if (data.success) {
        setMemoryStats(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load memory stats');
      }
    } catch (err) {
      setError('Failed to connect to memory system');
      console.error('Memory dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Memory System Error</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadMemoryStats}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Memory & Learning Dashboard</h1>
                <p className="text-gray-600 mt-1">AI memory system status and campaign insights</p>
              </div>
            </div>
            <button 
              onClick={loadMemoryStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Memory Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">🔍</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{memoryStats?.totalSearches || 0}</div>
                <div className="text-sm text-gray-500">Total Searches</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">💬</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{memoryStats?.totalFeedback || 0}</div>
                <div className="text-sm text-gray-500">Feedback Received</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">🎯</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{memoryStats?.activeCampaigns?.length || 0}</div>
                <div className="text-sm text-gray-500">Active Campaigns</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">⏳</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{memoryStats?.pendingFeedback || 0}</div>
                <div className="text-sm text-gray-500">Pending Feedback</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        {memoryStats?.activeCampaigns && memoryStats.activeCampaigns.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Campaigns</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {memoryStats.activeCampaigns.map((campaignId, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-green-800">Campaign {campaignId}</div>
                      <div className="text-sm text-green-600">Active & Learning</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {memoryStats?.recentSearches && memoryStats.recentSearches.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Memory Activity</h3>
            <div className="space-y-3">
              {memoryStats.recentSearches.slice(0, 5).map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">{search.query || 'Search Query'}</div>
                      <div className="text-sm text-gray-500">
                        {search.campaignId ? `Campaign: ${search.campaignId}` : 'No campaign context'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(search.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Insights */}
        {memoryStats?.learningInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Niches</h3>
              <div className="space-y-2">
                {memoryStats.learningInsights.topPerformingNiches?.map((niche, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{niche}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.max(20, 100 - index * 20)}%` }}
                      ></div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">No data available yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Platforms</h3>
              <div className="space-y-2">
                {memoryStats.learningInsights.preferredPlatforms?.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{platform}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.max(20, 100 - index * 15)}%` }}
                      ></div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">No data available yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-green-800">Memory System Status</h3>
          </div>
          <div className="text-green-700 text-sm space-y-1">
            <p>✅ Firebase integration active</p>
            <p>✅ Campaign status tracking enabled</p>
            <p>✅ User feedback learning system operational</p>
            <p>✅ Search history persistence active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryDashboard; 