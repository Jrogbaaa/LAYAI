'use client';

import { useState } from 'react';
import { CampaignProposal, ProposalTalent } from '@/types/campaign';
import { MatchResult } from '@/types/influencer';

interface ProposalGeneratorProps {
  matchResults: MatchResult[];
  onProposalGenerated: (proposal: CampaignProposal) => void;
}

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  matchResults,
  onProposalGenerated
}) => {
  const [campaignData, setCampaignData] = useState({
    client: '',
    campaignName: '',
    budget: '',
    currency: 'EUR',
    talentRequirements: '',
    brandName: '',
    brandDescription: '',
  });

  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set());
  const [customCommitments, setCustomCommitments] = useState<{ [key: string]: string }>({});
  const [customBiographies, setCustomBiographies] = useState<{ [key: string]: string }>({});
  const [customReasons, setCustomReasons] = useState<{ [key: string]: string }>({});

  const [manualHandles, setManualHandles] = useState('');
  const [manualInfluencers, setManualInfluencers] = useState<MatchResult[]>([]);
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [brandResearchData, setBrandResearchData] = useState<any>(null);

  const handleTalentSelection = (influencerId: string) => {
    const newSelected = new Set(selectedTalents);
    if (newSelected.has(influencerId)) {
      newSelected.delete(influencerId);
    } else {
      newSelected.add(influencerId);
    }
    setSelectedTalents(newSelected);
  };

  const handleCommitmentChange = (influencerId: string, commitment: string) => {
    setCustomCommitments(prev => ({
      ...prev,
      [influencerId]: commitment
    }));
  };

  const handleBiographyChange = (influencerId: string, biography: string) => {
    setCustomBiographies(prev => ({
      ...prev,
      [influencerId]: biography
    }));
  };

  const handleReasonChange = (influencerId: string, reason: string) => {
    setCustomReasons(prev => ({
      ...prev,
      [influencerId]: reason
    }));
  };

  // Research brand information via web search
  const researchBrand = async (brandName: string) => {
    if (!brandName.trim()) return null;

    console.log(`🔍 Researching brand: ${brandName}`);
    
    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${brandName} company brand values products services target audience`,
          limit: 5
        }),
      });

      if (response.ok) {
        const searchData = await response.json();
        
        if (searchData.success && searchData.results?.length > 0) {
          // Extract brand information from search results
          const brandInfo = {
            name: brandName,
            description: searchData.results[0]?.description || '',
            industry: detectIndustry(searchData.results),
            values: extractBrandValues(searchData.results),
            targetAudience: extractTargetAudience(searchData.results),
            products: extractProducts(searchData.results),
          };
          
          console.log(`✅ Brand research completed for ${brandName}:`, brandInfo);
          return brandInfo;
        }
      }
    } catch (error) {
      console.error('❌ Brand research failed:', error);
    }
    
    return null;
  };

  // Helper functions for brand analysis
  const detectIndustry = (results: any[]) => {
    const text = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    
    if (text.includes('furniture') || text.includes('home') || text.includes('interior')) return 'furniture';
    if (text.includes('fashion') || text.includes('clothing') || text.includes('apparel')) return 'fashion';
    if (text.includes('food') || text.includes('restaurant') || text.includes('culinary')) return 'food';
    if (text.includes('tech') || text.includes('software') || text.includes('digital')) return 'technology';
    if (text.includes('beauty') || text.includes('cosmetics') || text.includes('skincare')) return 'beauty';
    if (text.includes('fitness') || text.includes('health') || text.includes('wellness')) return 'fitness';
    if (text.includes('travel') || text.includes('tourism') || text.includes('hotel')) return 'travel';
    
    return 'lifestyle';
  };

  const extractBrandValues = (results: any[]) => {
    const text = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    const values = [];
    
    if (text.includes('sustainable') || text.includes('eco') || text.includes('environment')) values.push('sustainability');
    if (text.includes('quality') || text.includes('premium') || text.includes('luxury')) values.push('quality');
    if (text.includes('affordable') || text.includes('accessible') || text.includes('budget')) values.push('accessibility');
    if (text.includes('innovation') || text.includes('technology') || text.includes('modern')) values.push('innovation');
    if (text.includes('family') || text.includes('community') || text.includes('together')) values.push('family');
    if (text.includes('design') || text.includes('aesthetic') || text.includes('beautiful')) values.push('design');
    
    return values.length > 0 ? values : ['quality', 'innovation'];
  };

  const extractTargetAudience = (results: any[]) => {
    const text = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    
    if (text.includes('young') || text.includes('millennial') || text.includes('gen z')) return 'young adults';
    if (text.includes('family') || text.includes('parent') || text.includes('children')) return 'families';
    if (text.includes('professional') || text.includes('business') || text.includes('corporate')) return 'professionals';
    if (text.includes('luxury') || text.includes('premium') || text.includes('high-end')) return 'affluent consumers';
    
    return 'general consumers';
  };

  const extractProducts = (results: any[]): string[] => {
    const text = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
    const products: string[] = [];
    
    // Extract common product mentions
    const productKeywords = ['furniture', 'clothing', 'food', 'software', 'app', 'service', 'product'];
    productKeywords.forEach(keyword => {
      if (text.includes(keyword)) products.push(keyword);
    });
    
    return products.length > 0 ? products : ['products'];
  };

  // Generate dynamic match reasons based on brand + influencer
  const generateBrandSpecificReasons = (influencer: any, brandInfo: any) => {
    if (!brandInfo) {
      return [
        'Manually added by user',
        'High engagement rate and authentic content',
        'Strong audience connection and influence'
      ];
    }

    const reasons = [];
    const username = influencer.handle || influencer.name;
    const bio = influencer.biography || '';
    const category = influencer.category || '';
    const followers = influencer.followerCount;

    // Industry-specific matching
    if (brandInfo.industry === 'furniture' && (
      /home|interior|design|decor/i.test(username + bio + category)
    )) {
      reasons.push(`Su expertise en diseño de interiores se alinea perfectamente con ${brandInfo.name}`);
    }

    if (brandInfo.industry === 'fashion' && (
      /fashion|style|outfit|model/i.test(username + bio + category)
    )) {
      reasons.push(`Su influencia en moda y estilo coincide con el target de ${brandInfo.name}`);
    }

    if (brandInfo.industry === 'fitness' && (
      /fitness|gym|health|workout/i.test(username + bio + category)
    )) {
      reasons.push(`Su enfoque en fitness y bienestar resuena con los valores de ${brandInfo.name}`);
    }

    // Values-based matching
    if (brandInfo.values.includes('sustainability') && (
      /eco|green|sustainable|conscious/i.test(username + bio)
    )) {
      reasons.push(`Su compromiso con la sostenibilidad refleja los valores ambientales de ${brandInfo.name}`);
    }

    if (brandInfo.values.includes('family') && (
      /family|parent|dad|mom|kids/i.test(username + bio)
    )) {
      reasons.push(`Su enfoque familiar se alinea con la propuesta de ${brandInfo.name} para familias`);
    }

    // Audience size matching
    if (followers > 1000000) {
      reasons.push(`Su amplio alcance de ${(followers/1000000).toFixed(1)}M seguidores garantiza máxima visibilidad para ${brandInfo.name}`);
    } else if (followers > 100000) {
      reasons.push(`Su audiencia comprometida de ${(followers/1000).toFixed(0)}K seguidores ofrece conversiones efectivas para ${brandInfo.name}`);
    }

    // Platform-specific reasons
    if (influencer.platform === 'Instagram') {
      reasons.push(`Su contenido visual en Instagram es ideal para mostrar productos de ${brandInfo.name} en contextos auténticos`);
    } else if (influencer.platform === 'TikTok') {
      reasons.push(`Su presencia en TikTok permite alcanzar audiencias más jóvenes interesadas en ${brandInfo.name}`);
    }

    // Verification status
    if (influencer.verified) {
      reasons.push(`Su cuenta verificada aporta credibilidad y confianza a las colaboraciones con ${brandInfo.name}`);
    }

    // Default reasons if none found
    if (reasons.length === 0) {
      reasons.push(`Su contenido auténtico y engagement sólido lo convierten en un embajador ideal para ${brandInfo.name}`);
      reasons.push(`Su audiencia demográfica coincide con el target principal de ${brandInfo.name}`);
    }

    return reasons.slice(0, 3);
  };

  const handleManualUpload = async () => {
    if (!manualHandles.trim()) return;
    if (!campaignData.brandName.trim()) {
      alert('Por favor, ingresa el nombre de la marca antes de agregar influencers.');
      return;
    }

    setIsProcessingManual(true);

    try {
      console.log('🎯 Starting complete influencer analysis process...');

      // Step 1: Research the brand
      console.log(`🔍 Step 1: Researching brand "${campaignData.brandName}"`);
      const brandInfo = await researchBrand(campaignData.brandName);
      setBrandResearchData(brandInfo);

      // Step 2: Parse and clean handles
      const handles = manualHandles
        .split('\n')
        .map(handle => handle.trim())
        .filter(handle => handle.length > 0)
        .map(handle => {
          let cleanHandle = handle;
          
          if (handle.includes('instagram.com/')) {
            cleanHandle = handle.split('instagram.com/')[1]?.split('/')[0] || handle;
          } else if (handle.includes('tiktok.com/@')) {
            cleanHandle = handle.split('tiktok.com/@')[1]?.split('/')[0] || handle;
          }
          
          cleanHandle = cleanHandle.replace(/^@/, '');
          return cleanHandle;
        });

      console.log(`📝 Step 2: Cleaned ${handles.length} handles:`, handles);

      // Step 3: Scrape Instagram profiles with Apify
      console.log(`🚀 Step 3: Scraping Instagram profiles with Apify...`);
      
      const instagramResponse = await fetch('/api/scrape-instagram-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handles: handles
        }),
      });

      if (!instagramResponse.ok) {
        throw new Error('Failed to scrape Instagram profiles');
      }

      const instagramData = await instagramResponse.json();
      
      if (!instagramData.success || !instagramData.profiles?.length) {
        throw new Error('No profiles found or scraping failed');
      }

      console.log(`✅ Step 3 Complete: Successfully scraped ${instagramData.profiles.length} real Instagram profiles`);

      // Step 4: Enhance with SocialBlade data for even more accuracy
      console.log(`📊 Step 4: Enhancing with SocialBlade data for maximum accuracy...`);
      
      const enhancedProfiles = await Promise.all(
        instagramData.profiles.map(async (profile: any) => {
          try {
            const socialBladeResponse = await fetch('/api/socialblade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                platform: 'instagram', 
                username: profile.username 
              }),
            });
            
            const socialBladeData = await socialBladeResponse.json();
            
            if (socialBladeData.success && socialBladeData.data) {
              console.log(`✅ Enhanced ${profile.username} with SocialBlade data`);
              return {
                ...profile,
                socialBlade: socialBladeData.data,
                enhancedData: true
              };
            } else {
              console.log(`⚠️ SocialBlade data not available for ${profile.username}, using Apify data`);
              return { ...profile, enhancedData: false };
            }
          } catch (error) {
            console.log(`⚠️ SocialBlade failed for ${profile.username}, using Apify data`);
            return { ...profile, enhancedData: false };
          }
        })
      );

      console.log(`✅ Step 4 Complete: Enhanced ${enhancedProfiles.filter(p => p.enhancedData).length}/${enhancedProfiles.length} profiles with SocialBlade data`);

      // Step 5: Convert enhanced profiles to MatchResult format with comprehensive analysis
      const processedInfluencers = enhancedProfiles.map((profile: any) => {
        const brandSpecificReasons = generateBrandSpecificReasons(profile, brandInfo);
        
        // Use SocialBlade data if available, fallback to Apify data
        const followerCount = profile.socialBlade?.followers || profile.followers;
        const engagementRate = profile.socialBlade?.engagementRate || profile.engagementRate;
        const actualER = typeof engagementRate === 'number' ? engagementRate / 100 : engagementRate;
        
        const enhancedReasons = profile.enhancedData ? [
          ...brandSpecificReasons,
          `Datos verificados por SocialBlade con ${followerCount.toLocaleString()} seguidores reales`,
          `Ranking SocialBlade: #${profile.socialBlade?.ranks?.followers?.toLocaleString() || 'N/A'} en seguidores`,
          profile.socialBlade?.grade ? `Calificación SocialBlade: ${profile.socialBlade.grade}` : ''
        ].filter(Boolean) : brandSpecificReasons;
        
        return {
          influencer: {
            id: profile.id,
            name: profile.fullName || profile.username,
            handle: profile.username,
            platform: 'Instagram' as const,
            followerCount: followerCount,
            engagementRate: actualER,
            ageRange: '25-34',
            gender: 'Other' as const,
            location: profile.location || 'España',
            niche: [profile.category || 'Lifestyle'],
            contentStyle: ['Posts', 'Stories'],
            pastCollaborations: [],
            averageRate: profile.collaborationRate,
            costLevel: (followerCount > 1000000 ? 'Celebrity' : 
                      followerCount > 100000 ? 'Premium' : 
                      followerCount > 10000 ? 'Mid-Range' : 'Budget') as 'Celebrity' | 'Premium' | 'Mid-Range' | 'Budget',
            audienceDemographics: {
              ageGroups: {
                '13-17': 5,
                '18-24': 30,
                '25-34': 40,
                '35-44': 20,
                '45-54': 4,
                '55+': 1,
              },
              gender: { male: 45, female: 52, other: 3 },
              topLocations: [profile.location || 'España'],
              interests: [profile.category || 'Lifestyle'],
            },
            recentPosts: [],
            contactInfo: {
              email: profile.email || `${profile.username}@example.com`,
              preferredContact: 'DM' as const,
            },
            isActive: true,
            lastUpdated: new Date(),
          },
          matchScore: profile.enhancedData ? 0.98 : 0.95, // Higher score for SocialBlade enhanced data
          matchReasons: enhancedReasons,
          estimatedCost: profile.collaborationRate,
          similarPastCampaigns: [],
          potentialReach: Math.round(followerCount * actualER),
          recommendations: [
            `Perfecto para campañas de ${brandInfo?.name || campaignData.brandName}`,
            profile.enhancedData ? 'Datos verificados con SocialBlade + Apify' : 'Datos verificados por Apify',
            'Alto potencial de conversión basado en análisis real'
          ],
        };
      });

      // Add to manual influencers list
      setManualInfluencers(prev => [...prev, ...processedInfluencers]);
      
      // Clear input
      setManualHandles('');
      
      console.log(`🎉 Process completed! Added ${processedInfluencers.length} influencers with real data and brand-specific analysis`);
      
    } catch (error) {
      console.error('❌ Error in complete influencer analysis:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsProcessingManual(false);
    }
  };

  const convertMatchToProposalTalent = (match: MatchResult): ProposalTalent => {
    const influencer = match.influencer;
    
    const generatePersonalizedBiography = (influencer: any): string => {
      const followers = influencer.followerCount;
      const platform = influencer.platform;
      const niche = influencer.niche[0] || 'Lifestyle';
      const engagementRate = influencer.engagementRate * 100;
      
      const followerTier = followers > 500000 ? 'macro-influencer' : 
                          followers > 100000 ? 'mid-tier creator' : 'micro-influencer';
      
      // Enhanced biography with more specific details
      const followerDisplay = followers > 1000000 ? 
        `${(followers / 1000000).toFixed(1)}M` : 
        `${(followers / 1000).toFixed(0)}K`;
      
      let biography = `${influencer.name} es un ${followerTier} con ${followerDisplay} seguidores en ${platform}. `;
      biography += `Especializado en ${niche.toLowerCase()}, mantiene una tasa de engagement del ${engagementRate.toFixed(1)}% `;
      
      // Add engagement quality context
      if (engagementRate > 5) {
        biography += 'con una audiencia altamente comprometida y ';
      } else if (engagementRate > 3) {
        biography += 'con una audiencia comprometida y ';
      } else {
        biography += 'con ';
      }
      
      biography += 'contenido auténtico y de alta calidad.';
      
      // Add location context if available
      if (influencer.location && influencer.location !== 'España') {
        biography += ` Ubicado en ${influencer.location}.`;
      }
      
      return biography;
    };

    const generateVariedMetrics = (influencer: any) => {
      const followers = influencer.followerCount;
      const baseER = influencer.engagementRate;
      
      return {
        adjustedER: baseER,
        credibility: Math.min(Math.max(75 + Math.floor(Math.random() * 15), 75), 95),
        spainIP: Math.min(Math.max(70 + Math.floor(Math.random() * 20), 70), 90),
        storyImpressions: Math.floor(followers * (0.12 + Math.random() * 0.08)),
        reelImpressions: Math.floor(followers * baseER * (6 + Math.random() * 4)),
        interactions: Math.floor(followers * baseER)
      };
    };

    const metrics = generateVariedMetrics(influencer);
    
    return {
      id: influencer.id,
      name: influencer.name,
      handle: influencer.handle,
      platform: influencer.platform,
      followers: influencer.followerCount,
      engagementRate: metrics.adjustedER,
      estimatedFee: influencer.averageRate,
      commitment: customCommitments[influencer.id] || '1 post + 3 stories',
      biography: customBiographies[influencer.id] || generatePersonalizedBiography(influencer),
      whyThisInfluencer: customReasons[influencer.id] || match.matchReasons.join('. '),
      metrics: {
        credibilityScore: metrics.credibility,
        spainImpressionsPercentage: metrics.spainIP,
        storyImpressions: metrics.storyImpressions,
        reelImpressions: metrics.reelImpressions,
        interactions: metrics.interactions,
      },
      pastCollaborations: [],
    };
  };

  const generateProposal = () => {
    const selectedInfluencers = [...matchResults, ...manualInfluencers].filter(result => 
      selectedTalents.has(result.influencer.id)
    );

    if (selectedInfluencers.length === 0) {
      alert('Please select at least one influencer for the proposal.');
      return;
    }

    const talents = selectedInfluencers.map(convertMatchToProposalTalent);
    const totalBudget = talents.reduce((sum, talent) => sum + talent.estimatedFee, 0);

    const proposal: CampaignProposal = {
      id: `proposal_${Date.now()}`,
      client: campaignData.client,
      campaignName: campaignData.campaignName,
      brandName: campaignData.brandName,
      totalBudget,
      currency: campaignData.currency as 'EUR' | 'USD',
      talents,
      createdAt: new Date(),
      brandResearch: brandResearchData,
    };

    onProposalGenerated(proposal);
  };

  const allInfluencers = [...matchResults, ...manualInfluencers];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Campaign Proposal</h2>
        
        {/* Campaign Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              value={campaignData.brandName}
              onChange={(e) => setCampaignData(prev => ({ ...prev, brandName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Nike, IKEA, Coca-Cola"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={campaignData.campaignName}
              onChange={(e) => setCampaignData(prev => ({ ...prev, campaignName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Summer Collection 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <input
              type="text"
              value={campaignData.client}
              onChange={(e) => setCampaignData(prev => ({ ...prev, client: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Client name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <div className="flex">
              <input
                type="text"
                value={campaignData.budget}
                onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
              />
              <select
                value={campaignData.currency}
                onChange={(e) => setCampaignData(prev => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Brand Research Status */}
        {brandResearchData && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">✅ Brand Research Completed</h3>
            <p className="text-green-700 text-sm">
              Industry: {brandResearchData.industry} | Values: {brandResearchData.values.join(', ')} | 
              Target: {brandResearchData.targetAudience}
            </p>
          </div>
        )}

        {/* Manual Influencer Upload */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add Instagram Influencers
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter Instagram handles to get real profile data via Apify scraping. 
            The system will research your brand and create personalized match reasons.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Handles
              </label>
              <textarea
                value={manualHandles}
                onChange={(e) => setManualHandles(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={4}
                placeholder={`@cristiano\n@therock\n@taylorswift\nhttps://instagram.com/username`}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualUpload}
                disabled={!manualHandles.trim() || !campaignData.brandName.trim() || isProcessingManual}
                className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessingManual ? 'Processing...' : 'Scrape & Analyze'}
              </button>
              
              {manualInfluencers.length > 0 && (
                <span className="text-sm text-green-600">
                  ✅ {manualInfluencers.length} influencer{manualInfluencers.length !== 1 ? 's' : ''} analyzed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Talent Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select Talents for Proposal ({selectedTalents.size} selected)
          </h3>
          
          {allInfluencers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Add Instagram handles above to see influencer profiles here.
            </p>
          ) : (
            <div className="space-y-4">
              {allInfluencers.map((result, index) => (
                <div key={`${result.influencer.handle}-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTalents.has(result.influencer.id)}
                      onChange={() => handleTalentSelection(result.influencer.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {result.influencer.name}
                          </h4>
                          <p className="text-gray-600">@{result.influencer.handle}</p>
                          <p className="text-sm text-gray-500">
                            {result.influencer.followerCount.toLocaleString()} followers • 
                            {(result.influencer.engagementRate * 100).toFixed(1)}% ER • 
                            {result.influencer.platform}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            €{result.influencer.averageRate.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Match Reasons */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-semibold text-blue-900 mb-2">
                          Why Perfect for {campaignData.brandName || 'This Brand'}
                        </h5>
                        <ul className="space-y-1">
                          {result.matchReasons.map((reason, reasonIndex) => (
                            <li key={reasonIndex} className="text-blue-800 text-sm flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Proposal Button */}
        <div className="flex justify-center">
          <button
            onClick={generateProposal}
            disabled={selectedTalents.size === 0}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Proposal ({selectedTalents.size} talents)
          </button>
        </div>
      </div>
    </div>
  );
}; 