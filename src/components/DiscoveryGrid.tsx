import React from 'react';

interface BasicInfluencerProfile {
  username: string;
  fullName: string;
  followers: number;
  platform: string;
  niche: string;
  profileUrl: string;
  source: 'verified-discovery';
}

interface DiscoveryGridProps {
  discoveryInfluencers: BasicInfluencerProfile[];
}

const DiscoveryGrid: React.FC<DiscoveryGridProps> = ({ discoveryInfluencers }) => {
  console.log('DiscoveryGrid received:', discoveryInfluencers?.length, 'influencers');
  
  if (!discoveryInfluencers || discoveryInfluencers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No discovery results found.</p>
      </div>
    );
  }
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '📷';
      case 'tiktok':
        return '🎵';
      case 'youtube':
        return '📺';
      case 'twitter':
        return '🐦';
      default:
        return '🌐';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'from-pink-500 to-purple-500';
      case 'tiktok':
        return 'from-red-500 to-pink-500';
      case 'youtube':
        return 'from-red-600 to-red-700';
      case 'twitter':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Discovery Results ({discoveryInfluencers.length} found)
        </h2>
        <p className="text-gray-600 mt-1">
          Influencers discovered through web search - upgrade for detailed analytics
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {discoveryInfluencers.map((influencer, index) => (
        <div
          key={`${influencer.username}-${influencer.platform}-${index}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getPlatformColor(influencer.platform)} p-4 rounded-t-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getPlatformIcon(influencer.platform)}</span>
                <span className="text-white font-semibold text-sm">
                  {influencer.platform.toUpperCase()}
                </span>
              </div>
              <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                <span className="text-white text-xs font-medium">Discovery</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="font-bold text-gray-900 text-lg truncate">
                {influencer.fullName}
              </h3>
              <p className="text-gray-600 text-sm">@{influencer.username.replace(/\.$/, '')}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Followers</span>
                <span className="font-semibold text-gray-900">{formatFollowers(influencer.followers)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Niche</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {influencer.niche}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex space-x-2">
              <a
                href={influencer.profileUrl.replace(/\.$/, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                View Profile
              </a>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                onClick={() => {
                  // Clean username and log
                  const cleanUsername = influencer.username.replace(/\.$/, '');
                  console.log('Add to contacts:', cleanUsername);
                  // TODO: Add to contacts or upgrade to premium analysis
                }}
              >
                Contact
              </button>
            </div>

            {/* Upgrade hint */}
            <div className="mt-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800 text-center">
                🚀 Get full analytics, audience data & contact info
              </p>
            </div>
          </div>
        </div>
              ))}
      </div>
    </div>
  );
};

export default DiscoveryGrid; 