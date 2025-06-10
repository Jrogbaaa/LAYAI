'use client';

import { useState } from 'react';
import { MatchCriteria } from '@/types/influencer';

interface SearchFormProps {
  onSearch: (criteria: MatchCriteria) => void;
  isLoading: boolean;
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

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Multi-Platform'];
  const niches = [
    'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Lifestyle', 
    'Technology', 'Gaming', 'Comedy', 'Music', 'Art', 'Business',
    'Health', 'Parenting', 'Home & Garden', 'Automotive', 'Sports'
  ];
  const genders = ['Male', 'Female', 'Non-Binary', 'Other'];
  const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55+'];

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
    };

    onSearch(searchCriteria);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Your Perfect Influencer Match</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Budget Range (USD)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Min budget"
              value={budgetRange.min}
              onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <input
              type="number"
              placeholder="Max budget"
              value={budgetRange.max}
              onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {/* Platforms */}
        <div>
          <label htmlFor="platform-select" className="block text-sm font-medium text-gray-900 mb-2">
            Platform
          </label>
          <select
            id="platform-select"
            multiple
            value={selectedPlatforms}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedPlatforms(selectedOptions);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple platforms</p>
        </div>

        {/* Niches */}
        <div>
          <label htmlFor="niche-select" className="block text-sm font-medium text-gray-900 mb-2">
            Niche
          </label>
          <select
            id="niche-select"
            multiple
            value={selectedNiches}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedNiches(selectedOptions);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {niches.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple niches</p>
        </div>

        {/* Follower Range */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Follower Count Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              id="min-followers"
              aria-label="Min Followers"
              type="number"
              placeholder="Min followers"
              value={followerRange.min}
              onChange={(e) => setFollowerRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <input
              id="max-followers"
              aria-label="Max Followers"
              type="number"
              placeholder="Max followers"
              value={followerRange.max}
              onChange={(e) => setFollowerRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location-select" className="block text-sm font-medium text-gray-900 mb-2">
            Location
          </label>
          <select
            id="location-select"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Any Location</option>
            <option value="Spain">Spain</option>
            <option value="Madrid">Madrid</option>
            <option value="Barcelona">Barcelona</option>
            <option value="Valencia">Valencia</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="France">France</option>
            <option value="Germany">Germany</option>
            <option value="Italy">Italy</option>
          </select>
        </div>

        {/* Demographics */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gender-select" className="block text-sm font-medium text-gray-900 mb-2">
              Gender
            </label>
            <select
              id="gender-select"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Any Gender</option>
              {genders.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="age-range-select" className="block text-sm font-medium text-gray-900 mb-2">
              Age Range
            </label>
            <select
              id="age-range-select"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Any Age</option>
              {ageRanges.map((age) => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            'Find Influencers'
          )}
        </button>
      </form>
    </div>
  );
}; 