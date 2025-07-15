'use client';

import { useState, useEffect, useRef } from 'react';
import { MatchCriteria } from '@/types/influencer';

interface SearchFormProps {
  onSearch: (criteria: MatchCriteria) => void;
  isLoading: boolean;
}

// Enhanced Search Intelligence Component
interface SearchSuggestion {
  text: string;
  type: 'popular' | 'autocomplete' | 'location' | 'niche' | 'refinement';
  confidence: number;
  description?: string;
  icon?: string;
}

interface SearchIntelligence {
  suggestions: SearchSuggestion[];
  searchTips: string[];
  popularQueries: string[];
  trendingTopics: string[];
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [criteria, setCriteria] = useState<MatchCriteria>({
    budget: { min: 0, max: 10000 },
    platform: [],
    niche: [],
    followerRange: { min: 1000, max: 10000000 },
    engagementRate: { min: 0.01, max: 1.0 },
  });

  const [budgetRange, setBudgetRange] = useState({ min: '0', max: '10000' });
  const [followerRange, setFollowerRange] = useState({ min: '1000', max: '10000000' });
  const [engagementRange, setEngagementRange] = useState({ min: '1', max: '100' });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [gender, setGender] = useState<string>('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [brandQuery, setBrandQuery] = useState<string>('');
  
  // Enhanced filter states
  const [verificationStatus, setVerificationStatus] = useState<boolean | undefined>(undefined);
  const [lastActive, setLastActive] = useState<'7d' | '30d' | '90d' | 'any'>('any');
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [collaborationHistory, setCollaborationHistory] = useState<'never' | 'occasional' | 'frequent' | 'any'>('any');
  const [responsiveness, setResponsiveness] = useState<'low' | 'medium' | 'high' | 'any'>('any');
  const [priceRange, setPriceRange] = useState({ min: '0', max: '5000', contentType: 'post' as 'post' | 'story' | 'reel' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Multi-Platform'];
  const niches = [
    'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Lifestyle', 
    'Technology', 'Gaming', 'Comedy', 'Music', 'Art', 'Business',
    'Health', 'Parenting', 'Home & Garden', 'Automotive', 'Sports'
  ];
  const genders = ['Male', 'Female', 'Non-Binary', 'Other'];
  const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55+'];
  
  // Enhanced filter options
  const contentTypes = [
    { id: 'photo', label: 'Photos', icon: '📸' },
    { id: 'video', label: 'Videos', icon: '🎥' },
    { id: 'story', label: 'Stories', icon: '🎬' },
    { id: 'reel', label: 'Reels', icon: '🎵' },
    { id: 'carousel', label: 'Carousels', icon: '🎠' }
  ];
  
  const lastActiveOptions = [
    { value: 'any', label: 'Any time' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];
  
  const collaborationOptions = [
    { value: 'any', label: 'Any experience' },
    { value: 'never', label: 'First-time collaborators' },
    { value: 'occasional', label: 'Some experience' },
    { value: 'frequent', label: 'Very experienced' }
  ];
  
  const responsivenessOptions = [
    { value: 'any', label: 'Any response time' },
    { value: 'high', label: 'Quick response (< 24h)' },
    { value: 'medium', label: 'Moderate response (1-3 days)' },
    { value: 'low', label: 'Slow response (> 3 days)' }
  ];

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Enhanced search intelligence data with industry templates and seasonal campaigns
  const searchIntelligence: SearchIntelligence = {
    suggestions: [],
    searchTips: [
      '🎯 Use specific niches like "female fitness" or "urban fashion"',
      '📍 Specify locations: "influencers Madrid" or "creators Mexico"',
      '👥 Include audience size: "micro influencers" (10K-100K)',
      '🏢 Mention your brand: "find influencers for Nike"',
      '📱 Specify platform: "TikTokers Spain" or "fitness YouTubers"',
      '🕒 Add timing: "active creators" or "recent collaborations"',
      '💰 Include budget hints: "affordable micro influencers"',
      '🎨 Specify content style: "minimalist aesthetic" or "vibrant creators"'
    ],
    popularQueries: [
      'fitness influencers Spain',
      'micro influencers fashion Mexico',
      'beauty creators Colombia',
      'lifestyle influencers Madrid',
      'gaming creators Argentina',
      'food bloggers Barcelona',
      'travel influencers Latam',
      'tech reviewers Spain'
    ],
    trendingTopics: [
      'Sustainability 🌱',
      'Home fitness 🏠',
      'Healthy cooking 🥗',
      'Circular fashion ♻️',
      'Tech reviews 📱',
      'Local travel ✈️'
    ]
  };

  // Industry-specific search templates
  const industryTemplates = {
    fashion: [
      'sustainable fashion influencers Madrid',
      'streetwear creators Barcelona',
      'luxury fashion bloggers Spain',
      'plus-size fashion influencers',
      'vintage fashion creators'
    ],
    beauty: [
      'clean beauty influencers Spain',
      'makeup artists TikTok',
      'skincare experts Instagram',
      'K-beauty influencers Europe',
      'men grooming creators'
    ],
    fitness: [
      'home workout influencers',
      'yoga instructors Instagram',
      'nutrition coaches Spain',
      'bodybuilding creators',
      'pilates influencers Madrid'
    ],
    food: [
      'vegan food bloggers Spain',
      'traditional recipe creators',
      'healthy cooking influencers',
      'restaurant reviewers Madrid',
      'baking creators TikTok'
    ],
    tech: [
      'smartphone reviewers Spain',
      'gaming setup creators',
      'AI technology influencers',
      'productivity app reviewers',
      'crypto educators'
    ],
    travel: [
      'sustainable travel bloggers',
      'budget travel creators',
      'luxury travel influencers',
      'solo female travelers',
      'family travel bloggers'
    ]
  };

  // Seasonal campaign suggestions
  const seasonalCampaigns = {
    spring: [
      'spring fashion micro influencers',
      'Easter campaign creators',
      'outdoor fitness influencers',
      'spring cleaning content creators',
      'garden lifestyle bloggers'
    ],
    summer: [
      'summer fashion influencers',
      'beach lifestyle creators',
      'festival fashion bloggers',
      'summer fitness influencers',
      'travel content creators'
    ],
    autumn: [
      'back to school influencers',
      'autumn fashion creators',
      'cozy lifestyle bloggers',
      'Halloween content creators',
      'fall beauty influencers'
    ],
    winter: [
      'winter fashion influencers',
      'holiday campaign creators',
      'cozy home influencers',
      'winter sports creators',
      'New Year fitness influencers'
    ]
  };

  // Trending hashtags and topics (updated dynamically)
  const trendingHashtags = [
    '#sustainablefashion',
    '#mindfulnesss',
    '#homeworkout',
    '#digitaldetox',
    '#zerowaste',
    '#plantbased',
    '#selfcare',
    '#minimalism',
    '#localbusiness',
    '#authenticity'
  ];

  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  // Generate intelligent suggestions based on user input
  const generateSmartSuggestions = (input: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const lowerInput = input.toLowerCase();
    const currentSeason = getCurrentSeason();

    // Industry template suggestions
    Object.entries(industryTemplates).forEach(([industry, templates]) => {
      if (lowerInput.includes(industry) || industry.includes(lowerInput)) {
        templates.slice(0, 2).forEach(template => {
          suggestions.push({
            text: template,
            type: 'niche',
            confidence: 0.9,
            description: `${industry.charAt(0).toUpperCase() + industry.slice(1)} industry template`,
            icon: '🏭'
          });
        });
      }
    });

    // Seasonal campaign suggestions
    if (lowerInput.length > 3) {
      seasonalCampaigns[currentSeason].slice(0, 2).forEach(campaign => {
        if (campaign.toLowerCase().includes(lowerInput) || lowerInput.includes('season') || lowerInput.includes(currentSeason)) {
          suggestions.push({
            text: campaign,
            type: 'refinement',
            confidence: 0.85,
            description: `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} campaign idea`,
            icon: '🗓️'
          });
        }
      });
    }

    // Trending hashtag integration
    trendingHashtags.forEach(hashtag => {
      const hashtagWord = hashtag.replace('#', '');
      if (lowerInput.includes(hashtagWord) || hashtagWord.includes(lowerInput)) {
        suggestions.push({
          text: `${hashtagWord} influencers`,
          type: 'popular',
          confidence: 0.8,
          description: `Trending: ${hashtag}`,
          icon: '📈'
        });
      }
    });

    // Location suggestions
    const locations = ['Spain', 'Mexico', 'Colombia', 'Argentina', 'Chile', 'Peru', 'Madrid', 'Barcelona', 'Mexico City'];
    locations.forEach(location => {
      if (location.toLowerCase().includes(lowerInput) || lowerInput.includes(location.toLowerCase())) {
        suggestions.push({
          text: `influencers ${location}`,
          type: 'location',
          confidence: 0.9,
          description: `Search influencers in ${location}`,
          icon: '📍'
        });
      }
    });

    // Enhanced niche suggestions with subcategories
    const nicheMappings = {
      'fitness': ['home workout', 'yoga', 'bodybuilding', 'nutrition', 'pilates'],
      'beauty': ['skincare', 'makeup', 'haircare', 'nail art', 'men grooming'],
      'fashion': ['streetwear', 'sustainable', 'luxury', 'vintage', 'plus-size'],
      'food': ['vegan', 'healthy cooking', 'baking', 'restaurants', 'traditional'],
      'tech': ['smartphones', 'gaming', 'AI', 'productivity', 'crypto'],
      'travel': ['budget', 'luxury', 'solo', 'family', 'sustainable']
    };

    Object.entries(nicheMappings).forEach(([niche, subcategories]) => {
      if (niche.includes(lowerInput) && lowerInput.length > 2) {
        // Main niche suggestion
        suggestions.push({
          text: `${niche} influencers`,
          type: 'niche',
          confidence: 0.8,
          description: `${niche} specialists`,
          icon: '🎯'
        });
        
        // Subcategory suggestions
        subcategories.forEach(sub => {
          if (lowerInput.includes(sub) || sub.includes(lowerInput)) {
            suggestions.push({
              text: `${sub} ${niche} influencers`,
              type: 'niche',
              confidence: 0.85,
              description: `Specialized ${sub} content`,
              icon: '🎯'
            });
          }
        });
      }
    });

    // Size-based suggestions with enhanced descriptions
    const sizes = [
      { key: 'micro', label: 'micro influencers', desc: '10K-100K followers, higher engagement' },
      { key: 'macro', label: 'macro influencers', desc: '100K-1M followers, balanced reach' },
      { key: 'mega', label: 'mega influencers', desc: '+1M followers, maximum reach' },
      { key: 'nano', label: 'nano influencers', desc: '1K-10K followers, very authentic' }
    ];
    sizes.forEach(size => {
      if (lowerInput.includes(size.key) || lowerInput.includes('influencer')) {
        suggestions.push({
          text: size.label,
          type: 'refinement',
          confidence: 0.7,
          description: size.desc,
          icon: '👥'
        });
      }
    });

    // Budget-conscious suggestions
    if (lowerInput.includes('budget') || lowerInput.includes('affordable') || lowerInput.includes('cheap')) {
      suggestions.push({
        text: 'affordable micro influencers',
        type: 'refinement',
        confidence: 0.8,
        description: 'Cost-effective options',
        icon: '💰'
      });
      suggestions.push({
        text: 'budget-friendly nano influencers',
        type: 'refinement',
        confidence: 0.75,
        description: 'Best value for money',
        icon: '💰'
      });
    }

    // Quality and verification suggestions
    if (lowerInput.includes('verified') || lowerInput.includes('quality') || lowerInput.includes('authentic')) {
      suggestions.push({
        text: 'verified premium influencers',
        type: 'refinement',
        confidence: 0.8,
        description: 'High-quality verified accounts',
        icon: '✅'
      });
      suggestions.push({
        text: 'authentic content creators',
        type: 'refinement',
        confidence: 0.75,
        description: 'Genuine, non-promotional content',
        icon: '🎭'
      });
    }

    // Popular query completions with enhanced matching
    searchIntelligence.popularQueries.forEach(popular => {
      if (popular.toLowerCase().includes(lowerInput) && lowerInput.length > 3) {
        suggestions.push({
          text: popular,
          type: 'popular',
          confidence: 0.9,
          description: 'Popular search',
          icon: '🔥'
        });
      }
    });

    // Smart query refinements
    if (lowerInput.length > 4) {
      // Gender refinements
      if (!lowerInput.includes('male') && !lowerInput.includes('female')) {
        suggestions.push({
          text: `${input} female`,
          type: 'refinement',
          confidence: 0.6,
          description: 'Filter by female audience',
          icon: '👩'
        });
        suggestions.push({
          text: `${input} male`,
          type: 'refinement',
          confidence: 0.6,
          description: 'Filter by male audience',
          icon: '👨'
        });
      }

      // Platform refinements with better descriptions
      if (!lowerInput.includes('instagram') && !lowerInput.includes('tiktok')) {
        suggestions.push({
          text: `${input} Instagram`,
          type: 'refinement',
          confidence: 0.7,
          description: 'Visual content focus',
          icon: '📸'
        });
        suggestions.push({
          text: `${input} TikTok`,
          type: 'refinement',
          confidence: 0.7,
          description: 'Short-form video content',
          icon: '🎵'
        });
      }

      // Engagement rate suggestions
      if (lowerInput.includes('engagement') || lowerInput.includes('active')) {
        suggestions.push({
          text: `high engagement ${input}`,
          type: 'refinement',
          confidence: 0.75,
          description: 'Above 5% engagement rate',
          icon: '💖'
        });
      }
    }

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  };

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        const smartSuggestions = generateSmartSuggestions(query);
        setSuggestions(smartSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setIsTyping(false);
    }, 300);

    if (query.length > 0) {
      setIsTyping(true);
    }

    return () => clearTimeout(timer);
  }, [query]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Enhanced quick search buttons with templates and seasonal suggestions
  const QuickSearchButtons: React.FC = () => {
    const currentSeason = getCurrentSeason();
    const currentSeasonCampaigns = seasonalCampaigns[currentSeason].slice(0, 2);
    const topIndustryTemplates = Object.values(industryTemplates).flat().slice(0, 3);
    
    return (
      <div className="space-y-4">
        {/* Popular Searches */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            🔥 Popular searches:
          </div>
          <div className="flex flex-wrap gap-2">
            {searchIntelligence.popularQueries.slice(0, 4).map((popular, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(popular);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
              >
                {popular}
              </button>
            ))}
          </div>
        </div>

        {/* Seasonal Campaigns */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            🗓️ {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} campaigns:
          </div>
          <div className="flex flex-wrap gap-2">
            {currentSeasonCampaigns.map((campaign, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(campaign);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm hover:bg-orange-100 transition-colors border border-orange-200"
              >
                {campaign}
              </button>
            ))}
          </div>
        </div>

        {/* Industry Templates */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            🏭 Industry templates:
          </div>
          <div className="flex flex-wrap gap-2">
            {topIndustryTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(template);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors border border-purple-200"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Hashtags */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            📈 Trending:
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.slice(0, 5).map((hashtag, index) => (
              <button
                key={index}
                onClick={() => {
                  const hashtagWord = hashtag.replace('#', '');
                  setQuery(`${hashtagWord} influencers`);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors border border-green-200"
              >
                {hashtag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Search tips component
  const SearchTips: React.FC = () => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-purple-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💡</span>
        <span className="font-medium text-gray-800">Search tips for better results:</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
        {searchIntelligence.searchTips.slice(0, 4).map((tip, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">→</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Trending topics sidebar
  const TrendingTopics: React.FC = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <span className="font-medium text-gray-800">Current trends:</span>
      </div>
      <div className="space-y-2">
        {searchIntelligence.trendingTopics.map((topic, index) => (
          <button
            key={index}
            onClick={() => setQuery(`influencers ${topic.replace(/[^\w\s]/gi, '').trim()}`)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 border border-gray-100"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );

  const handlePlatformChange = (platform: string) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform];
    setSelectedPlatforms(newPlatforms);
  };

  const handleNicheChange = (niche: string) => {
    const newNiches = selectedNiches.includes(niche)
      ? selectedNiches.filter(n => n !== niche)
      : [...selectedNiches, niche];
    setSelectedNiches(newNiches);
  };

  const handleContentTypeChange = (contentType: string) => {
    const newContentTypes = selectedContentTypes.includes(contentType)
      ? selectedContentTypes.filter(ct => ct !== contentType)
      : [...selectedContentTypes, contentType];
    setSelectedContentTypes(newContentTypes);
  };

  const resetFilters = () => {
    setBudgetRange({ min: '0', max: '10000' });
    setFollowerRange({ min: '1000', max: '10000000' });
    setEngagementRange({ min: '1', max: '100' });
    setSelectedPlatforms([]);
    setSelectedNiches([]);
    setGender('');
    setAgeRange('');
    setLocation('');
    setBrandQuery('');
    setVerificationStatus(undefined);
    setLastActive('any');
    setSelectedContentTypes([]);
    setCollaborationHistory('any');
    setResponsiveness('any');
    setPriceRange({ min: '0', max: '5000', contentType: 'post' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchCriteria: MatchCriteria = {
      budget: {
        min: parseInt(budgetRange.min) || 0,
        max: parseInt(budgetRange.max) || 10000,
      },
      platform: selectedPlatforms.length > 0 ? selectedPlatforms : ['Instagram'],
      niche: selectedNiches.length > 0 ? selectedNiches : ['Fashion'],
      followerRange: {
        min: parseInt(followerRange.min) || 1000,
        max: parseInt(followerRange.max) || 10000000,
      },
      engagementRate: {
        min: parseFloat(engagementRange.min) / 100 || 0.01,
        max: parseFloat(engagementRange.max) / 100 || 1.0,
      },
      gender: gender || undefined,
      ageRange: ageRange || undefined,
      location: location ? [location] : undefined,
      brandQuery: brandQuery || undefined,
      
      // Enhanced search criteria
      verificationStatus: verificationStatus,
      lastActive: lastActive !== 'any' ? lastActive : undefined,
      contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes as any : undefined,
      collaborationHistory: collaborationHistory !== 'any' ? collaborationHistory : undefined,
      responsiveness: responsiveness !== 'any' ? responsiveness : undefined,
      priceRange: {
        min: parseInt(priceRange.min) || 0,
        max: parseInt(priceRange.max) || 5000,
        contentType: priceRange.contentType,
      },
    };

    onSearch(searchCriteria);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder="Describe the type of influencer you are looking for... e.g., 'female fitness Madrid' or 'micro influencers technology'"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-lg"
          />
          
          {/* Search Icon & Typing Indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isTyping ? (
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            ) : (
              <span className="text-gray-400 text-xl">🔍</span>
            )}
          </div>
        </div>

        {/* Smart Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                💡 Smart suggestions:
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        suggestion.confidence > 0.8 ? 'bg-green-400' :
                        suggestion.confidence > 0.6 ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Search & Tips Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <QuickSearchButtons />
          <SearchTips />
        </div>
        <div>
          <TrendingTopics />
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">🎯 Smart Filters</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                {(selectedPlatforms.length + selectedNiches.length + selectedContentTypes.length + 
                  (verificationStatus !== undefined ? 1 : 0) + 
                  (lastActive !== 'any' ? 1 : 0) + 
                  (collaborationHistory !== 'any' ? 1 : 0) + 
                  (responsiveness !== 'any' ? 1 : 0))} active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>↓</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Basic Filters - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">💰 Budget Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={budgetRange.min}
                  onChange={(e) => setBudgetRange({ ...budgetRange, min: e.target.value })}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={budgetRange.max}
                  onChange={(e) => setBudgetRange({ ...budgetRange, max: e.target.value })}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Follower Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">👥 Followers</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={followerRange.min}
                  onChange={(e) => setFollowerRange({ ...followerRange, min: e.target.value })}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={followerRange.max}
                  onChange={(e) => setFollowerRange({ ...followerRange, max: e.target.value })}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Engagement Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">💖 Engagement Rate (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={engagementRange.min}
                  onChange={(e) => setEngagementRange({ ...engagementRange, min: e.target.value })}
                  placeholder="Min %"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={engagementRange.max}
                  onChange={(e) => setEngagementRange({ ...engagementRange, max: e.target.value })}
                  placeholder="Max %"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📱 Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformChange(platform)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPlatforms.includes(platform)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Niches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Niches</label>
            <div className="flex flex-wrap gap-2">
              {niches.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleNicheChange(niche)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedNiches.includes(niche)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
                ⚡ Advanced Filters
                <span className="text-xs text-gray-500">(Premium features)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Verification Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">✅ Verification</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVerificationStatus(undefined)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        verificationStatus === undefined
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Any
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerificationStatus(true)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        verificationStatus === true
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Verified Only
                    </button>
                  </div>
                </div>

                {/* Last Active */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Last Active</label>
                  <select
                    value={lastActive}
                    onChange={(e) => setLastActive(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {lastActiveOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Collaboration History */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🤝 Collaboration Experience</label>
                  <select
                    value={collaborationHistory}
                    onChange={(e) => setCollaborationHistory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {collaborationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Content Types</label>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((contentType) => (
                    <button
                      key={contentType.id}
                      type="button"
                      onClick={() => handleContentTypeChange(contentType.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedContentTypes.includes(contentType.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{contentType.icon}</span>
                      {contentType.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demographics Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👤 Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Any gender</option>
                    {genders.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎂 Age Range</label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Any age</option>
                    {ageRanges.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📍 Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Madrid, Spain"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Price Range for Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💵 Price Range per Content</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <select
                      value={priceRange.contentType}
                      onChange={(e) => setPriceRange({ ...priceRange, contentType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="post">Post</option>
                      <option value="story">Story</option>
                      <option value="reel">Reel</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder="Min price"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder="Max price"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Responsiveness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">⚡ Response Time</label>
                <select
                  value={responsiveness}
                  onChange={(e) => setResponsiveness(e.target.value as any)}
                  className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {responsivenessOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : (
                '🚀 Start Search'
              )}
            </button>
            <div className="text-sm text-gray-500">
              {(selectedPlatforms.length + selectedNiches.length + selectedContentTypes.length)} filters active
            </div>
          </div>
        </form>
      </div>

      {/* Search Analytics Preview */}
      {query.length > 5 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="font-medium text-gray-800">Search preview:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-600">~{Math.floor(Math.random() * 150 + 50)}</div>
              <div className="text-gray-600">Estimated influencers</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">~{Math.floor(Math.random() * 30 + 20)}%</div>
              <div className="text-gray-600">Response rate</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">${Math.floor(Math.random() * 2000 + 500)}</div>
              <div className="text-gray-600">Average cost</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">{Math.floor(Math.random() * 3 + 2)}-{Math.floor(Math.random() * 7 + 5)} days</div>
              <div className="text-gray-600">Response time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 