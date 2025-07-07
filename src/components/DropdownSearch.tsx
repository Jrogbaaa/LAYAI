'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, MapPin, Users, Target, Smartphone, Building2, User, Calendar } from 'lucide-react';

interface DropdownSearchProps {
  onSearch: (searchParams: any) => void;
  isLoading?: boolean;
}

interface SearchParams {
  gender: string;
  ageRange: string;
  location: string;
  niche: string[];
  platforms: string[];
  brandName: string;
  minFollowers: number;
  maxFollowers: number;
  minEngagement: number;
  maxEngagement: number;
  maxResults: number;
  userQuery: string;
  aestheticKeywords: string[];
}

interface BrandInfo {
  name: string;
  category: string;
  industry: string;
  targetAudience: {
    ageRange: string;
    gender: string;
    interests: string[];
  };
  brandValues: string[];
  contentThemes: string[];
  aestheticKeywords: string[];
}

export const DropdownSearch: React.FC<DropdownSearchProps> = ({ onSearch, isLoading = false }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    gender: 'any',
    ageRange: 'any',
    location: '',
    niche: [],
    platforms: ['Instagram'],
    brandName: '',
    minFollowers: 10000,
    maxFollowers: 500000,
    minEngagement: 1,
    maxEngagement: 15,
    maxResults: 100,
    userQuery: '',
    aestheticKeywords: []
  });

  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [isResearchingBrand, setIsResearchingBrand] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

  // Gender options
  const genderOptions = [
    { value: 'any', label: 'Cualquier género' },
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'non-binary', label: 'No binario' }
  ];

  // Age range options
  const ageRangeOptions = [
    { value: 'any', label: 'Cualquier edad' },
    { value: '13-17', label: '13-17 años' },
    { value: '18-24', label: '18-24 años' },
    { value: '25-34', label: '25-34 años' },
    { value: '35-44', label: '35-44 años' },
    { value: '45-54', label: '45-54 años' },
    { value: '55+', label: '55+ años' }
  ];

  // Platform options
  const platformOptions = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'Twitter', label: 'Twitter' }
  ];

  // Niche options
  const nicheOptions = [
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'fashion', label: 'Moda' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'food', label: 'Comida' },
    { value: 'travel', label: 'Viajes' },
    { value: 'tech', label: 'Tecnología' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'music', label: 'Música' },
    { value: 'sports', label: 'Deportes' },
    { value: 'business', label: 'Negocios' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'home', label: 'Hogar' },
    { value: 'parenting', label: 'Paternidad' },
    { value: 'education', label: 'Educación' }
  ];

  // Location options (popular Spanish-speaking regions)
  const locationOptions = [
    'España',
    'Madrid',
    'Barcelona',
    'Valencia',
    'Sevilla',
    'México',
    'Ciudad de México',
    'Guadalajara',
    'Monterrey',
    'Colombia',
    'Bogotá',
    'Medellín',
    'Argentina',
    'Buenos Aires',
    'Chile',
    'Santiago',
    'Perú',
    'Lima',
    'Ecuador',
    'Quito',
    'Venezuela',
    'Caracas',
    'Uruguay',
    'Montevideo'
  ];

  // Research brand when brand name changes
  useEffect(() => {
    const researchBrandAutomatically = async () => {
      if (searchParams.brandName.trim() && searchParams.brandName.length > 2) {
        setIsResearchingBrand(true);
        setBrandError(null);
        
        try {
          const response = await fetch('/api/web-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `${searchParams.brandName} company brand values products services target audience`,
              limit: 5
            }),
          });

          if (response.ok) {
            const searchData = await response.json();
            
            if (searchData.success && searchData.results?.length > 0) {
              // Extract brand information from search results
              const brandInfo: BrandInfo = {
                name: searchParams.brandName,
                category: detectCategory(searchData.results),
                industry: detectIndustry(searchData.results),
                targetAudience: {
                  ageRange: extractTargetAge(searchData.results),
                  gender: extractTargetGender(searchData.results),
                  interests: extractInterests(searchData.results)
                },
                brandValues: extractBrandValues(searchData.results),
                contentThemes: extractContentThemes(searchData.results),
                aestheticKeywords: extractAestheticKeywords(searchData.results)
              };
              
              setBrandInfo(brandInfo);
              
              // Auto-update search parameters based on brand research
              if (brandInfo.targetAudience.ageRange && brandInfo.targetAudience.ageRange !== 'any') {
                setSearchParams(prev => ({ ...prev, ageRange: brandInfo.targetAudience.ageRange }));
              }
              if (brandInfo.targetAudience.gender && brandInfo.targetAudience.gender !== 'any') {
                setSearchParams(prev => ({ ...prev, gender: brandInfo.targetAudience.gender }));
              }
              
            } else {
              setBrandError('No se pudo investigar la marca. Verifica el nombre.');
            }
          } else {
            setBrandError('Error al investigar la marca.');
          }
        } catch (error) {
          setBrandError('Error de conexión al investigar la marca.');
        } finally {
          setIsResearchingBrand(false);
        }
      } else {
        setBrandInfo(null);
        setBrandError(null);
      }
    };

    const timeoutId = setTimeout(researchBrandAutomatically, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchParams.brandName]);

  // Brand research helper functions
  const detectCategory = (results: any[]): string => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    
    if (/fashion|clothing|apparel|style|wear/i.test(content)) return 'Fashion & Beauty';
    if (/food|restaurant|beverage|drink|cuisine/i.test(content)) return 'Food & Beverage';
    if (/tech|software|digital|app|platform/i.test(content)) return 'Technology';
    if (/sport|fitness|athletic|gym|training/i.test(content)) return 'Sports & Fitness';
    if (/home|furniture|decor|interior|living/i.test(content)) return 'Home & Living';
    if (/car|automotive|vehicle|transport/i.test(content)) return 'Automotive';
    if (/travel|tourism|hotel|vacation/i.test(content)) return 'Travel & Tourism';
    
    return 'Lifestyle';
  };

  const detectIndustry = (results: any[]): string => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    
    if (/retail|store|shop|commerce/i.test(content)) return 'Retail';
    if (/saas|software|service/i.test(content)) return 'Technology';
    if (/manufacturing|production|factory/i.test(content)) return 'Manufacturing';
    if (/financial|bank|investment|finance/i.test(content)) return 'Financial Services';
    
    return 'Consumer Goods';
  };

  const extractTargetAge = (results: any[]): string => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    
    if (/young|teen|student|generation z|gen z/i.test(content)) return '18-24';
    if (/millennial|professional|young adult/i.test(content)) return '25-34';
    if (/family|parent|adult|mature/i.test(content)) return '35-44';
    if (/senior|older|retirement/i.test(content)) return '45-54';
    
    return 'any';
  };

  const extractTargetGender = (results: any[]): string => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    
    if (/women|female|ladies|girls/i.test(content) && !/men|male|guys/i.test(content)) return 'female';
    if (/men|male|guys|boys/i.test(content) && !/women|female|ladies/i.test(content)) return 'male';
    
    return 'any';
  };

  const extractInterests = (results: any[]): string[] => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    const interests: string[] = [];
    
    if (/fashion|style|clothing/i.test(content)) interests.push('fashion');
    if (/beauty|makeup|skincare/i.test(content)) interests.push('beauty');
    if (/fitness|health|workout/i.test(content)) interests.push('fitness');
    if (/food|cooking|recipe/i.test(content)) interests.push('food');
    if (/travel|vacation|adventure/i.test(content)) interests.push('travel');
    if (/tech|technology|digital/i.test(content)) interests.push('tech');
    if (/lifestyle|living/i.test(content)) interests.push('lifestyle');
    if (/home|decor|interior/i.test(content)) interests.push('home');
    
    return interests;
  };

  const extractBrandValues = (results: any[]): string[] => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    const values: string[] = [];
    
    if (/sustainable|eco|green|environment/i.test(content)) values.push('sustainability');
    if (/premium|luxury|high-end|exclusive/i.test(content)) values.push('premium');
    if (/affordable|budget|accessible|value/i.test(content)) values.push('affordable');
    if (/innovative|cutting-edge|advanced/i.test(content)) values.push('innovation');
    if (/authentic|genuine|real|honest/i.test(content)) values.push('authenticity');
    if (/quality|excellent|superior/i.test(content)) values.push('quality');
    
    return values;
  };

  const extractContentThemes = (results: any[]): string[] => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    const themes: string[] = [];
    
    if (/lifestyle|daily|routine/i.test(content)) themes.push('lifestyle content');
    if (/tutorial|how-to|guide/i.test(content)) themes.push('educational content');
    if (/behind|backstage|process/i.test(content)) themes.push('behind-the-scenes');
    if (/review|unboxing|test/i.test(content)) themes.push('product reviews');
    if (/inspiration|motivat/i.test(content)) themes.push('inspirational content');
    
    return themes;
  };

  const extractAestheticKeywords = (results: any[]): string[] => {
    const content = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    const keywords: string[] = [];
    
    if (/bold|modern|athletic/i.test(content)) keywords.push('Bold', 'Modern', 'Athletic');
    if (/sustainable|eco|green|environment/i.test(content)) keywords.push('Sustainable', 'Eco-Friendly', 'Environmentally Conscious');
    if (/premium|luxury|high-end|exclusive/i.test(content)) keywords.push('Premium', 'Luxury', 'High-End');
    if (/affordable|budget|accessible|value/i.test(content)) keywords.push('Affordable', 'Budget-Friendly', 'Value');
    if (/innovative|cutting-edge|advanced/i.test(content)) keywords.push('Innovative', 'Cutting-Edge', 'Advanced');
    if (/authentic|genuine|real|honest/i.test(content)) keywords.push('Authentic', 'Genuine', 'Real', 'Honest');
    if (/quality|excellent|superior/i.test(content)) keywords.push('Quality', 'Excellent', 'Superior');
    
    return keywords;
  };

  const handleInputChange = (field: keyof SearchParams, value: any) => {
    // Validate follower ranges to prevent extreme values
    if (field === 'minFollowers') {
      const numValue = parseInt(value);
      // If minimum is too high, reset to reasonable range
      if (numValue > 500000) {
        console.warn(`⚠️ Min followers too high (${numValue}), resetting to 10K`);
        setSearchParams(prev => ({ ...prev, minFollowers: 10000 }));
        return;
      }
    }
    
    if (field === 'maxFollowers') {
      const numValue = parseInt(value);
      // If maximum is extremely high, reset to reasonable range
      if (numValue > 10000000) {
        console.warn(`⚠️ Max followers too high (${numValue}), resetting to 2M`);
        setSearchParams(prev => ({ ...prev, maxFollowers: 2000000 }));
        return;
      }
    }
    
    setSearchParams(prev => ({ ...prev, [field]: value }));
  };

  const handleNicheToggle = (niche: string) => {
    setSearchParams(prev => ({
      ...prev,
      niche: prev.niche.includes(niche)
        ? prev.niche.filter(n => n !== niche)
        : [...prev.niche, niche]
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setSearchParams(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSearch = () => {
    // Convert dropdown search params to enhanced search API format
    const enhancedSearchParams = {
      platforms: searchParams.platforms,
      niches: searchParams.niche, // Convert 'niche' array to 'niches' array
      minFollowers: searchParams.minFollowers,
      maxFollowers: searchParams.maxFollowers,
      maxFollowersInclusive: true,
      location: searchParams.location || undefined,
      verified: false,
      maxResults: searchParams.maxResults,
      gender: searchParams.gender !== 'any' ? searchParams.gender : undefined,
      ageRange: searchParams.ageRange !== 'any' ? searchParams.ageRange : undefined,
      strictLocationMatch: searchParams.location ? true : false,
      brandName: searchParams.brandName || undefined,
      aestheticKeywords: searchParams.aestheticKeywords || [],
      userQuery: searchParams.userQuery || `Búsqueda con filtros: ${[
        searchParams.brandName && `marca ${searchParams.brandName}`,
        searchParams.niche.length > 0 && `nichos ${searchParams.niche.join(', ')}`,
        searchParams.location && `ubicación ${searchParams.location}`,
        searchParams.gender !== 'any' && `género ${searchParams.gender}`,
        searchParams.ageRange !== 'any' && `edad ${searchParams.ageRange}`,
        `plataformas ${searchParams.platforms.join(', ')}`
      ].filter(Boolean).join(', ')}`
    };
    
    console.log('🎯 Dropdown search params converted to enhanced search format:', enhancedSearchParams);
    onSearch(enhancedSearchParams);
  };

  const resetFilters = () => {
    setSearchParams({
      gender: 'any',
      ageRange: 'any',
      location: '',
      niche: [],
      platforms: ['Instagram'],
      brandName: '',
      minFollowers: 10000,
      maxFollowers: 500000,
      minEngagement: 1,
      maxEngagement: 15,
      maxResults: 100,
      userQuery: '',
      aestheticKeywords: []
    });
    setBrandInfo(null);
    setBrandError(null);
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const handleBrandResearch = async () => {
    if (!searchParams.brandName || searchParams.brandName.trim().length < 2) {
      setBrandInfo(null);
      return;
    }

    setIsResearchingBrand(true);
    try {
      // Mock brand research - in real implementation, this would call the brand research API
      const mockBrandInfo: BrandInfo = {
        name: searchParams.brandName,
        category: 'Fashion & Sports',
        industry: 'Retail',
        targetAudience: {
          ageRange: '18-34',
          gender: 'Mixed',
          interests: ['Sports', 'Fashion', 'Lifestyle']
        },
        brandValues: ['Innovation', 'Performance', 'Style'],
        contentThemes: ['Athletic', 'Urban', 'Lifestyle'],
        aestheticKeywords: ['Bold', 'Modern', 'Athletic']
      };
      
      setBrandInfo(mockBrandInfo);
    } catch (error) {
      console.error('Brand research failed:', error);
      setBrandInfo(null);
    } finally {
      setIsResearchingBrand(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
          <Target className="mr-2 h-5 w-5 text-blue-600" />
          Búsqueda con Filtros
        </h2>
        <p className="text-gray-600 text-sm">
          Utiliza los filtros específicos para encontrar influencers que se ajusten perfectamente a tus criterios
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Brand Name */}
          <div>
            <label htmlFor="brand-input" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              Nombre de Marca
            </label>
            <input
              id="brand-input"
              name="brandName"
              type="text"
              value={searchParams.brandName}
              onChange={(e) => handleInputChange('brandName', e.target.value.trim())}
              onBlur={handleBrandResearch}
              placeholder="Ej: Nike, Zara, Apple..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
            
            {/* Brand Research Results */}
            {brandInfo && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Investigación de marca completada ✅
                    </p>
                    <div className="text-xs text-green-700 mt-1 space-y-1">
                      <p><strong>Categoría:</strong> {brandInfo.category}</p>
                      {brandInfo.brandValues.length > 0 && (
                        <p><strong>Valores:</strong> {brandInfo.brandValues.slice(0, 3).join(', ')}</p>
                      )}
                      {brandInfo.aestheticKeywords.length > 0 && (
                        <p><strong>Estilo:</strong> {brandInfo.aestheticKeywords.slice(0, 3).join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {brandError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{brandError}</p>
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="mr-2 h-4 w-4" />
              Género
            </label>
            <select
              id="gender-select"
              name="gender"
              value={searchParams.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="any">Sin preferencia</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="non-binary">No binario</option>
            </select>
          </div>

          {/* Age Range */}
          <div>
            <label htmlFor="age-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Rango de Edad
            </label>
            <select
              id="age-select"
              name="ageRange"
              value={searchParams.ageRange}
              onChange={(e) => handleInputChange('ageRange', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="any">Cualquier edad</option>
              <option value="13-17">13-17 años</option>
              <option value="18-24">18-24 años</option>
              <option value="25-34">25-34 años</option>
              <option value="35-44">35-44 años</option>
              <option value="45-54">45-54 años</option>
              <option value="55+">55+ años</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Ubicación
            </label>
            <select
              id="location-select"
              name="location"
              value={searchParams.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">Cualquier ubicación</option>
              <option value="España">España</option>
              <option value="Madrid">Madrid</option>
              <option value="Barcelona">Barcelona</option>
              <option value="Valencia">Valencia</option>
              <option value="Sevilla">Sevilla</option>
              <option value="México">México</option>
              <option value="Argentina">Argentina</option>
              <option value="Colombia">Colombia</option>
              <option value="Chile">Chile</option>
              <option value="Perú">Perú</option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Platforms */}
          <div>
            <label htmlFor="platform-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Smartphone className="mr-2 h-4 w-4" />
              Plataformas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Instagram', 'TikTok', 'YouTube', 'Twitter'].map((platform) => (
                <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="platforms"
                    value={platform}
                    checked={searchParams.platforms.includes(platform)}
                    onChange={(e) => {
                      const updatedPlatforms = e.target.checked
                        ? [...searchParams.platforms, platform]
                        : searchParams.platforms.filter(p => p !== platform);
                      handleInputChange('platforms', updatedPlatforms);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Niche Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Nichos (selecciona múltiples)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {[
                { value: 'lifestyle', label: 'Estilo de vida' },
                { value: 'fashion', label: 'Moda' },
                { value: 'fitness', label: 'Fitness' },
                { value: 'food', label: 'Comida' },
                { value: 'travel', label: 'Viajes' },
                { value: 'tech', label: 'Tecnología' },
                { value: 'gaming', label: 'Gaming' },
                { value: 'music', label: 'Música' },
                { value: 'entertainment', label: 'Entretenimiento' },
                { value: 'beauty', label: 'Belleza' },
                { value: 'sports', label: 'Deportes' },
                { value: 'education', label: 'Educación' },
                { value: 'business', label: 'Negocios' },
                { value: 'art', label: 'Arte' },
                { value: 'photography', label: 'Fotografía' }
              ].map((niche) => (
                <label key={niche.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="niches"
                    value={niche.value}
                    checked={searchParams.niche.includes(niche.value)}
                    onChange={(e) => {
                      const updatedNiches = e.target.checked
                        ? [...searchParams.niche, niche.value]
                        : searchParams.niche.filter(n => n !== niche.value);
                      handleInputChange('niche', updatedNiches);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{niche.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Follower Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Rango de Seguidores
            </label>
            
            {/* Quick preset buttons */}
            <div className="mb-3 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  handleInputChange('minFollowers', 1000);
                  handleInputChange('maxFollowers', 10000);
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Nano (1K-10K)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInputChange('minFollowers', 10000);
                  handleInputChange('maxFollowers', 100000);
                }}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Micro (10K-100K)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInputChange('minFollowers', 100000);
                  handleInputChange('maxFollowers', 1000000);
                }}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              >
                Macro (100K-1M)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInputChange('minFollowers', 1000000);
                  handleInputChange('maxFollowers', 10000000);
                }}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Mega (1M+)
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Mínimo: {formatFollowerCount(searchParams.minFollowers)}</label>
                <input
                  type="range"
                  min="1000"
                  max="2000000"
                  step="5000"
                  value={Math.min(searchParams.minFollowers, 2000000)}
                  onChange={(e) => handleInputChange('minFollowers', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1K</span>
                  <span>500K</span>
                  <span>1M</span>
                  <span>2M</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Máximo: {formatFollowerCount(searchParams.maxFollowers)}</label>
                <input
                  type="range"
                  min="10000"
                  max="20000000"
                  step="25000"
                  value={Math.min(searchParams.maxFollowers, 20000000)}
                  onChange={(e) => handleInputChange('maxFollowers', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10K</span>
                  <span>1M</span>
                  <span>5M</span>
                  <span>20M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Engagement (%)
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Mínimo: {searchParams.minEngagement}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={searchParams.minEngagement}
                  onChange={(e) => handleInputChange('minEngagement', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Máximo: {searchParams.maxEngagement}%</label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={searchParams.maxEngagement}
                  onChange={(e) => handleInputChange('maxEngagement', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Results Limit */}
          <div>
            <label htmlFor="results-limit" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Máximo de Resultados
            </label>
            <select
              id="results-limit"
              name="maxResults"
              value={searchParams.maxResults}
              onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value={25}>25 influencers</option>
              <option value={50}>50 influencers</option>
              <option value={100}>100 influencers</option>
              <option value={200}>200 influencers</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Más resultados pueden tardar más tiempo en cargar</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
        >
          Limpiar Filtros
        </button>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            Máx. resultados: {searchParams.maxResults}
          </span>
          <button
            onClick={handleSearch}
            disabled={isLoading || searchParams.platforms.length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Buscar Influencers</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Summary */}
      {(searchParams.brandName || searchParams.niche.length > 0 || searchParams.location || searchParams.gender !== 'any') && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-1">Resumen de búsqueda:</p>
          <p className="text-sm text-blue-700">
            {searchParams.brandName && `Marca: ${searchParams.brandName} • `}
            {searchParams.niche.length > 0 && `Nichos: ${searchParams.niche.join(', ')} • `}
            {searchParams.location && `Ubicación: ${searchParams.location} • `}
            {searchParams.gender !== 'any' && `Género: ${searchParams.gender} • `}
            {searchParams.ageRange !== 'any' && `Edad: ${searchParams.ageRange} • `}
            Plataformas: {searchParams.platforms.join(', ')} • 
            Seguidores: {formatFollowerCount(searchParams.minFollowers)} - {formatFollowerCount(searchParams.maxFollowers)}
          </p>
        </div>
      )}
    </div>
  );
}; 