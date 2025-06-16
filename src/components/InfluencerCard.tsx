import React from 'react';

interface InfluencerCardProps {
  influencer: {
    id: string;
    name: string;
    handle: string;
    platform: string;
    followerCount: number;
    engagementRate: number;
    averageRate: number;
    category?: string;
    location?: string;
    profilePicture?: string;
    verified?: boolean;
    bio?: string;
  };
  onSelect?: (influencer: any) => void;
  isSelected?: boolean;
}

const InfluencerCard: React.FC<InfluencerCardProps> = ({ 
  influencer, 
  onSelect, 
  isSelected = false 
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
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
        return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'from-pink-500 to-purple-600';
      case 'tiktok':
        return 'from-black to-gray-800';
      case 'youtube':
        return 'from-red-500 to-red-600';
      case 'twitter':
        return 'from-blue-400 to-blue-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 0.05) return 'text-green-600 bg-green-100';
    if (rate >= 0.03) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group overflow-hidden ${
        isSelected 
          ? 'border-blue-500 ring-4 ring-blue-100 transform scale-[1.02]' 
          : 'border-gray-200 hover:border-gray-300 hover:scale-[1.01]'
      }`}
      onClick={() => onSelect?.(influencer)}
    >
      {/* Header with Platform Badge */}
      <div className="relative p-6 pb-4">
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r ${getPlatformColor(influencer.platform)}`}>
          <span className="mr-1">{getPlatformIcon(influencer.platform)}</span>
          {influencer.platform}
        </div>
        
        {/* Profile Section */}
        <div className="flex items-start space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              {influencer.profilePicture ? (
                <img 
                  src={influencer.profilePicture} 
                  alt={influencer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-gray-600">👤</span>
              )}
            </div>
            {influencer.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {influencer.name}
            </h3>
            <p className="text-gray-600 font-medium">@{influencer.handle}</p>
            {influencer.location && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="mr-1">📍</span>
                {influencer.location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {influencer.bio && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {influencer.bio}
            </p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600">👥</span>
              <span className="text-xs font-medium text-blue-800 uppercase tracking-wide">Followers</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatNumber(influencer.followerCount)}
            </p>
          </div>
          
          <div className={`p-4 rounded-xl border ${getEngagementColor(influencer.engagementRate)}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span>💫</span>
              <span className="text-xs font-medium uppercase tracking-wide">Engagement</span>
            </div>
            <p className="text-2xl font-bold">
              {(influencer.engagementRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Category & Rate Section */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {influencer.category && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {influencer.category}
              </span>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Estimated Rate</p>
            <p className="text-xl font-bold text-green-600">
              €{influencer.averageRate.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default InfluencerCard; 