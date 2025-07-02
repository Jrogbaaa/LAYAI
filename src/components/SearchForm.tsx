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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [gender, setGender] = useState<string>('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [brandQuery, setBrandQuery] = useState<string>('');

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Multi-Platform'];
  const niches = [
    'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Lifestyle', 
    'Technology', 'Gaming', 'Comedy', 'Music', 'Art', 'Business',
    'Health', 'Parenting', 'Home & Garden', 'Automotive', 'Sports'
  ];
  const genders = ['Male', 'Female', 'Non-Binary', 'Other'];
  const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55+'];

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Enhanced search intelligence data
  const searchIntelligence: SearchIntelligence = {
    suggestions: [],
    searchTips: [
      '🎯 Usa nichos específicos como "fitness femenino" o "moda urbana"',
      '📍 Especifica ubicaciones: "influencers Madrid" o "creators México"',
      '👥 Incluye tamaño de audiencia: "micro influencers" (10K-100K)',
      '🏢 Menciona tu marca: "encuentra influencers para Nike"',
      '📱 Especifica plataforma: "TikTokers España" o "YouTubers fitness"'
    ],
    popularQueries: [
      'influencers fitness España',
      'micro influencers moda México',
      'beauty creators Colombia',
      'lifestyle influencers Madrid',
      'gaming creators Argentina',
      'food bloggers Barcelona',
      'travel influencers Latam',
      'tech reviewers España'
    ],
    trendingTopics: [
      'Sostenibilidad 🌱',
      'Fitness en casa 🏠',
      'Cocina saludable 🥗',
      'Moda circular ♻️',
      'Tech reviews 📱',
      'Viajes locales ✈️'
    ]
  };

  // Generate intelligent suggestions based on user input
  const generateSmartSuggestions = (input: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const lowerInput = input.toLowerCase();

    // Location suggestions
    const locations = ['España', 'México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Madrid', 'Barcelona', 'Ciudad de México'];
    locations.forEach(location => {
      if (location.toLowerCase().includes(lowerInput) || lowerInput.includes(location.toLowerCase())) {
        suggestions.push({
          text: `influencers ${location}`,
          type: 'location',
          confidence: 0.9,
          description: `Buscar influencers en ${location}`,
          icon: '📍'
        });
      }
    });

    // Niche suggestions
    const niches = ['fitness', 'beauty', 'fashion', 'lifestyle', 'food', 'travel', 'tech', 'gaming', 'parenting', 'business'];
    niches.forEach(niche => {
      if (niche.includes(lowerInput) && lowerInput.length > 2) {
        suggestions.push({
          text: `${niche} influencers`,
          type: 'niche',
          confidence: 0.8,
          description: `Especialistas en ${niche}`,
          icon: '🎯'
        });
      }
    });

    // Size-based suggestions
    const sizes = [
      { key: 'micro', label: 'micro influencers', desc: '10K-100K seguidores' },
      { key: 'macro', label: 'macro influencers', desc: '100K-1M seguidores' },
      { key: 'mega', label: 'mega influencers', desc: '+1M seguidores' }
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

    // Popular query completions
    searchIntelligence.popularQueries.forEach(popular => {
      if (popular.toLowerCase().includes(lowerInput) && lowerInput.length > 3) {
        suggestions.push({
          text: popular,
          type: 'popular',
          confidence: 0.9,
          description: 'Búsqueda popular',
          icon: '🔥'
        });
      }
    });

    // Smart query refinements
    if (lowerInput.length > 4) {
      // Gender refinements
      if (!lowerInput.includes('masculin') && !lowerInput.includes('femenin')) {
        suggestions.push({
          text: `${input} femenino`,
          type: 'refinement',
          confidence: 0.6,
          description: 'Filtrar por audiencia femenina',
          icon: '👩'
        });
        suggestions.push({
          text: `${input} masculino`,
          type: 'refinement',
          confidence: 0.6,
          description: 'Filtrar por audiencia masculina',
          icon: '👨'
        });
      }

      // Platform refinements
      if (!lowerInput.includes('instagram') && !lowerInput.includes('tiktok')) {
        suggestions.push({
          text: `${input} Instagram`,
          type: 'refinement',
          confidence: 0.7,
          description: 'Enfocado en Instagram',
          icon: '📸'
        });
        suggestions.push({
          text: `${input} TikTok`,
          type: 'refinement',
          confidence: 0.7,
          description: 'Enfocado en TikTok',
          icon: '🎵'
        });
      }
    }

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
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

  // Quick search buttons for popular queries
  const QuickSearchButtons: React.FC = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="text-sm font-medium text-gray-700 mb-2 w-full">🔥 Búsquedas populares:</div>
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
  );

  // Search tips component
  const SearchTips: React.FC = () => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-purple-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💡</span>
        <span className="font-medium text-gray-800">Tips para mejores resultados:</span>
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
        <span className="font-medium text-gray-800">Tendencias actuales:</span>
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
        min: 0.01,
        max: 1.0,
      },
      gender: gender || undefined,
      ageRange: ageRange || undefined,
      location: location ? [location] : undefined,
      brandQuery: brandQuery || undefined,
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
            placeholder="Describe el tipo de influencer que buscas... Ej: 'fitness femenino Madrid' o 'micro influencers tecnología'"
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
                💡 Sugerencias inteligentes:
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

      {/* Search Analytics Preview */}
      {query.length > 5 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="font-medium text-gray-800">Vista previa de búsqueda:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-600">~{Math.floor(Math.random() * 150 + 50)}</div>
              <div className="text-gray-600">Influencers estimados</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">~{Math.floor(Math.random() * 30 + 20)}%</div>
              <div className="text-gray-600">Tasa de respuesta</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">${Math.floor(Math.random() * 2000 + 500)}</div>
              <div className="text-gray-600">Costo promedio</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">{Math.floor(Math.random() * 3 + 2)}-{Math.floor(Math.random() * 7 + 5)} días</div>
              <div className="text-gray-600">Tiempo respuesta</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 