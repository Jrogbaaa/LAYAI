'use client';

import { useState } from 'react';
import { StarngageInfluencer, StarngageInfluencerDetails } from '@/lib/starngageService';

interface StarngageTestProps {
  className?: string;
}

export const StarngageTest: React.FC<StarngageTestProps> = ({ className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<'list' | 'profile' | 'search' | 'enhance'>('list');
  const [username, setUsername] = useState('evajarit');
  const [keyword, setKeyword] = useState('lifestyle');

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let url = '';
      
      switch (testType) {
        case 'list':
          url = '/api/scrape-starngage?action=list&country=spain&category=celebrities&limit=10';
          break;
        case 'profile':
          url = `/api/scrape-starngage?action=profile&username=${username}`;
          break;
        case 'search':
          url = `/api/scrape-starngage?action=search&keyword=${encodeURIComponent(keyword)}&limit=5`;
          break;
        case 'enhance':
          url = `/api/scrape-starngage?action=enhance&username=${username}`;
          break;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    switch (testType) {
      case 'list':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Influencer List ({results.count} found)</h3>
            <div className="grid gap-4">
              {results.data.map((influencer: StarngageInfluencer, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">@{influencer.username}</h4>
                      <p className="text-sm text-gray-600">{influencer.name}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{influencer.followers.toLocaleString()} followers</p>
                      <p>{influencer.engagementRate}% engagement</p>
                    </div>
                  </div>
                  {influencer.topics.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Topics: {influencer.topics.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        const profile = results.data as StarngageInfluencerDetails;
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Details for @{profile.username}</h3>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">{profile.name}</h4>
                  <p className="text-sm text-gray-600">@{profile.username}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Followers:</strong> {profile.followers.toLocaleString()}</p>
                    <p><strong>Following:</strong> {profile.following.toLocaleString()}</p>
                    <p><strong>Posts:</strong> {profile.posts.toLocaleString()}</p>
                    <p><strong>Engagement Rate:</strong> {profile.engagementRate}%</p>
                    <p><strong>Average Likes:</strong> {profile.averageLikes.toLocaleString()}</p>
                    <p><strong>Average Comments:</strong> {profile.averageComments.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Demographics</h5>
                  <div className="text-sm space-y-1">
                    <p><strong>Gender:</strong></p>
                    <p>• Female: {profile.demographics.gender.female}%</p>
                    <p>• Male: {profile.demographics.gender.male}%</p>
                    
                    {profile.demographics.topLocations.length > 0 && (
                      <>
                        <p><strong>Top Locations:</strong></p>
                        <p>{profile.demographics.topLocations.join(', ')}</p>
                      </>
                    )}
                    
                    {profile.demographics.interests.length > 0 && (
                      <>
                        <p><strong>Interests:</strong></p>
                        <p>{profile.demographics.interests.join(', ')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {profile.topics.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Topics</h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.topics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Search Results for "{keyword}" ({results.count} found)</h3>
            <div className="grid gap-4">
              {results.data.map((influencer: StarngageInfluencer, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">@{influencer.username}</h4>
                      <p className="text-sm text-gray-600">{influencer.name}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{influencer.followers.toLocaleString()} followers</p>
                      <p>{influencer.engagementRate}% engagement</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'enhance':
        const enhanced = results.data;
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enhanced Data for @{username}</h3>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Metrics</h5>
                  <div className="text-sm space-y-1">
                    <p><strong>Engagement Rate:</strong> {enhanced.engagementRate}%</p>
                    <p><strong>Average Likes:</strong> {enhanced.averageLikes.toLocaleString()}</p>
                    <p><strong>Average Comments:</strong> {enhanced.averageComments.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Demographics</h5>
                  <div className="text-sm space-y-1">
                    <p><strong>Gender:</strong></p>
                    <p>• Female: {enhanced.demographics.gender.female}%</p>
                    <p>• Male: {enhanced.demographics.gender.male}%</p>
                  </div>
                </div>
              </div>
              
              {enhanced.topics.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Topics</h5>
                  <div className="flex flex-wrap gap-2">
                    {enhanced.topics.map((topic: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4">StarNgage Scraper Test</h2>
      
      <div className="space-y-4">
        {/* Test Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Test Type</label>
          <select 
            value={testType} 
            onChange={(e) => setTestType(e.target.value as any)}
            className="w-full p-2 border rounded-md"
          >
            <option value="list">List Influencers</option>
            <option value="profile">Profile Details</option>
            <option value="search">Search Influencers</option>
            <option value="enhance">Enhance Profile</option>
          </select>
        </div>

        {/* Username Input */}
        {(testType === 'profile' || testType === 'enhance') && (
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., evajarit"
              className="w-full p-2 border rounded-md"
            />
          </div>
        )}

        {/* Keyword Input */}
        {testType === 'search' && (
          <div>
            <label className="block text-sm font-medium mb-2">Search Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., lifestyle, fashion, fitness"
              className="w-full p-2 border rounded-md"
            />
          </div>
        )}

        {/* Test Button */}
        <button
          onClick={handleTest}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-medium">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-6">
          {renderResults()}
        </div>
      )}
    </div>
  );
}; 