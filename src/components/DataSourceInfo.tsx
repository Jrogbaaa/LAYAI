'use client';

import React, { useState } from 'react';

interface DataSourceInfoProps {
  type: 'analytics' | 'compatibility';
}

const DataSourceInfo: React.FC<DataSourceInfoProps> = ({ type }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDataSourceInfo = () => {
    switch (type) {
      case 'analytics':
        return {
          title: 'Audience Analytics Data Sources',
          sources: [
            {
              name: 'Recent Search Results',
              description: 'Data from your recent influencer searches',
              icon: '🔍',
              coverage: 'Real-time',
              accuracy: 'High'
            },
            {
              name: 'Campaign Database',
              description: 'Saved influencers from your campaigns',
              icon: '🎯',
              coverage: 'Historical',
              accuracy: 'High'
            },
            {
              name: 'Enhanced Demographics',
              description: 'AI-enhanced demographic data from 2996 Spanish influencers',
              icon: '📊',
              coverage: 'Comprehensive',
              accuracy: 'Very High'
            },
            {
              name: 'Performance Metrics',
              description: 'Real-time engagement and audience analytics',
              icon: '⚡',
              coverage: 'Live',
              accuracy: 'High'
            }
          ],
          note: 'Analytics update automatically when you perform searches or save influencers to campaigns.'
        };
      case 'compatibility':
        return {
          title: 'Brand Compatibility Data Sources',
          sources: [
            {
              name: 'Advanced Filtering System',
              description: 'ML-powered profile analysis with 6 compatibility factors',
              icon: '🎯',
              coverage: 'Real-time',
              accuracy: 'Very High'
            },
            {
              name: 'Audience Demographics',
              description: 'Age, gender, location, and interest alignment analysis',
              icon: '👥',
              coverage: 'Comprehensive',
              accuracy: 'High'
            },
            {
              name: 'Content Style Analysis',
              description: 'Tone, format, and messaging compatibility scoring',
              icon: '✨',
              coverage: 'Dynamic',
              accuracy: 'High'
            },
            {
              name: 'Brand Intelligence',
              description: 'Industry-specific brand matching and collaboration history',
              icon: '🧠',
              coverage: 'Historical',
              accuracy: 'High'
            }
          ],
          note: 'Compatibility scores are calculated in real-time based on your selected influencers and brand profile.'
        };
      default:
        return { title: '', sources: [], note: '' };
    }
  };

  const info = getDataSourceInfo();

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span>ℹ️</span>
        <span>Data Sources</span>
        <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {showDetails && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">{info.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {info.sources.map((source, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{source.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{source.name}</div>
                  <div className="text-sm text-gray-600">{source.description}</div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-blue-600">Coverage: {source.coverage}</span>
                    <span className="text-xs text-green-600">Accuracy: {source.accuracy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-blue-700 bg-blue-100 rounded p-3">
            <strong>Note:</strong> {info.note}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceInfo;