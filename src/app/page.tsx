'use client';

import React, { useState, useEffect, useRef } from 'react';
import LandingPage from '@/components/LandingPage';
import { SearchInterface } from '@/components/SearchInterface';
import { ProposalGenerator } from '@/components/ProposalGenerator';
import { ProposalViewer } from '@/components/ProposalViewer';
import { InfluencerResults } from '@/components/InfluencerResults';
import { EnhancedCampaignManager } from '@/components/EnhancedCampaignManager';
import NotesManager from '@/components/NotesManager';
import Sidebar, { PageView } from '@/components/Sidebar';
import EnhancedFeedbackPanel from '@/components/EnhancedFeedbackPanel';
import { MatchResult } from '@/types/influencer';
import { CampaignProposal } from '@/types/campaign';
import { exportProposalToCSV, exportProposalToPDF } from '@/utils/exportUtils';
import { exportHibikiStyleCSV, exportOrangeStyleCSV } from '@/lib/newExportUtils';
import { generateSessionId } from '@/lib/database';
import { campaignService } from '@/lib/enhancedCampaignService';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/lib/languageContext';

type ExtendedPageView = PageView | 'landing' | 'chat' | 'campaigns' | 'proposal';

interface SearchResults {
  premiumResults: MatchResult[];
  discoveryResults: any[];
  totalFound: number;
}

export default function Home() {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ExtendedPageView>('landing');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<CampaignProposal | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [pdfAnalysisContext, setPdfAnalysisContext] = useState<any>(null);
  
  // Ref for auto-scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  // Auto-scroll to results when search results are updated
  useEffect(() => {
    if (searchResults && searchResults.premiumResults.length > 0 && resultsRef.current) {
      // Small delay to ensure the results are rendered and loading state is complete
      setTimeout(() => {
        if (resultsRef.current) {
          console.log('🔄 Auto-scrolling to search results...');
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
          
          // Add a subtle highlight effect to draw attention to results
          resultsRef.current.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
          setTimeout(() => {
            if (resultsRef.current) {
              resultsRef.current.style.boxShadow = '';
            }
          }, 2000);
        }
      }, 300); // Increased delay to ensure everything is rendered
    }
  }, [searchResults]);

  // Helper function to extract brand name from search message OR PDF context
  const extractBrandFromMessage = (message: string): string => {
    // 🎯 PRIORITY 1: Use brand name from PDF analysis if available
    if (pdfAnalysisContext?.brandName) {
      console.log(`📄 Using brand from PDF analysis: ${pdfAnalysisContext.brandName}`);
      return pdfAnalysisContext.brandName;
    }

    // 🎯 PRIORITY 2: Extract from chat message as fallback
    const brandKeywords = ['ikea', 'nike', 'adidas', 'zara', 'h&m', 'mango', 'inditex', 'pull&bear', 'bershka', 'stradivarius'];
    const lowerMessage = message.toLowerCase();
    
    for (const brand of brandKeywords) {
      if (lowerMessage.includes(brand)) {
        console.log(`💬 Extracted brand from message: ${brand.toUpperCase()}`);
        return brand.toUpperCase();
      }
    }
    
    // Try to extract from common patterns like "influencers para X" or "X style influencers"
    const patterns = [
      /influencers?\s+(?:para|for|de|del|como|estilo)\s+([a-zA-Z][a-zA-Z0-9&\s]+?)(?:\s|$)/i,
      /([a-zA-Z][a-zA-Z0-9&\s]+?)\s+(?:influencers?|style|compatible|brand)/i,
      /estilo\s+([a-zA-Z][a-zA-Z0-9&\s]+?)(?:\s|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        console.log(`📝 Extracted brand from pattern: ${match[1].trim().toUpperCase()}`);
        return match[1].trim().toUpperCase();
      }
    }
    
    // 🎯 PRIORITY 3: If we have PDF context but no brandName, try to extract from summary
    if (pdfAnalysisContext?.summary) {
      const summaryBrandMatch = pdfAnalysisContext.summary.match(/para\s+([A-Z][A-Z0-9&\s]*?)(?:\s|$)/i);
      if (summaryBrandMatch && summaryBrandMatch[1]) {
        console.log(`📋 Extracted brand from PDF summary: ${summaryBrandMatch[1].trim()}`);
        return summaryBrandMatch[1].trim();
      }
    }
    
    // 🎯 LAST RESORT: Only if no PDF context available
    const words = message.split(' ').filter(word => word.length > 3);
    const fallback = words[0] || 'UNKNOWN_BRAND';
    console.log(`⚠️ Using fallback brand extraction: ${fallback}`);
    return fallback;
  };

  const handleSendMessage = async (message: string, history: any[]) => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Sending message to chat API:', message);
      
      // Skip campaign saving for partial results messages
      const isPartialResultsMessage = message.startsWith('PARTIAL_RESULTS:');
      const isStructuredSearchMessage = message.startsWith('STRUCTURED_SEARCH:');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        throw new Error(`Chat API failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔄 Chat API response:', data);

      if (data.type === 'search') {
        console.log('🔍 Processing search request with params:', data.data);
        
        const searchResponse = await fetch('/api/enhanced-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.data), // Use the enhanced search API
        });

        const searchData = await searchResponse.json();
        
        if (searchData.success) {
          // Enhanced search API returns data in .data property
          const results = searchData.data?.premiumResults || searchData.premiumResults || [];
          const convertedResults = convertToMatchResults(results);
          console.log('🔍 Raw search response:', searchData);
          console.log('🔍 Extracted results:', results);
          console.log('🔍 Converted results:', convertedResults);
          console.log('Search results received:', {
            premiumResults: results.length,
            discoveryResults: searchData.data?.discoveryResults?.length || 0,
            totalFound: searchData.data?.totalFound || searchData.totalFound || 0
          });
          console.log('🔍 Premium results length for pagination:', results.length, 'Show button:', results.length > 20);
          
          // Check if this is a follow-up search (if we already have results)
          if (searchResults && searchResults.premiumResults.length > 0) {
            // Accumulate results - combine with existing results
            const existingDiscoveryUrls = new Set(searchResults.premiumResults.map(r => r.influencer.handle));
            const discoveryResults = searchData.data?.discoveryResults || searchData.discoveryResults || [];
            const newDiscoveryResults = discoveryResults.filter(
              (result: any) => !existingDiscoveryUrls.has(result.handle)
            );
            
            setSearchResults({
              premiumResults: [...searchResults.premiumResults, ...convertedResults, ...newDiscoveryResults],
              discoveryResults: discoveryResults,
              totalFound: searchData.data?.totalFound || searchData.totalFound || 0
            });
            
            console.log(`🔄 Follow-up search: Added ${newDiscoveryResults.length} new discovery results`);
          } else {
            // First search - set results normally
            const discoveryResults = searchData.data?.discoveryResults || searchData.discoveryResults || [];
            setSearchResults({
              premiumResults: convertedResults,
              discoveryResults: discoveryResults,
              totalFound: searchData.data?.totalFound || searchData.totalFound || 0
            });
            setShowAllResults(false); // Reset expanded view for new search
            
            // 📚 Automatically save search to campaigns (for both chat and dropdown searches)
            if (!isPartialResultsMessage && message.trim().length > 0) {
              try {
                let brandName: string;
                let searchQuery: string;
                
                // Handle structured search (dropdown) vs chat search
                if (isStructuredSearchMessage) {
                  // Extract brand name from structured search parameters
                  const structuredParams = JSON.parse(message.replace('STRUCTURED_SEARCH:', ''));
                  brandName = structuredParams.brandName || 'Unknown Brand';
                  
                  // Create a descriptive query for dropdown searches
                  const filters = [];
                  if (structuredParams.gender && structuredParams.gender !== 'any') filters.push(`género: ${structuredParams.gender}`);
                  if (structuredParams.ageRange && structuredParams.ageRange !== 'any') filters.push(`edad: ${structuredParams.ageRange}`);
                  if (structuredParams.location) filters.push(`ubicación: ${structuredParams.location}`);
                  if (structuredParams.niche && structuredParams.niche.length > 0) filters.push(`nichos: ${structuredParams.niche.join(', ')}`);
                  if (structuredParams.platforms && structuredParams.platforms.length > 0) filters.push(`plataformas: ${structuredParams.platforms.join(', ')}`);
                  if (structuredParams.minFollowers && structuredParams.maxFollowers) {
                    filters.push(`seguidores: ${structuredParams.minFollowers.toLocaleString()}-${structuredParams.maxFollowers.toLocaleString()}`);
                  }
                  
                  searchQuery = `Búsqueda con filtros para ${brandName}${filters.length > 0 ? ` (${filters.join(', ')})` : ''}`;
                  
                  console.log(`📋 Dropdown search detected - Brand: ${brandName}, Query: ${searchQuery}`);
                } else {
                  // Regular chat search
                  brandName = extractBrandFromMessage(message);
                  searchQuery = message;
                  
                  console.log(`💬 Chat search detected - Brand: ${brandName}, Query: ${searchQuery}`);
                }
                
                const searchParams = data.data; // Enhanced search parameters
                const allResults = [...convertedResults, ...discoveryResults];
                
                // Additional validation to prevent saving invalid data
                if (brandName && !brandName.includes('{') && !brandName.includes('PARTIAL_RESULTS') && brandName.length < 100) {
                  const saveResult = await campaignService.saveSearchResults(
                    searchQuery,
                    brandName,
                    allResults,
                    searchParams
                  );
                  
                  console.log(`📚 Search automatically saved: ${saveResult.action} for ${brandName}`, saveResult);
                } else {
                  console.log('📚 Skipped saving search due to invalid brand name:', brandName);
                }
              } catch (error) {
                console.error('Error saving search to campaigns:', error);
                // Non-blocking error - search results still work
              }
            } else {
              console.log('📚 Skipped saving search (partial results message)');
            }
          }
          
          setCurrentSearchId(searchData.searchId);
        } else {
          console.error('❌ Search API failed:', searchData);
        }

        return { type: 'search', data: searchData };
      } else if (data.type === 'chat') {
        console.log('💬 Processing chat response:', data.data);
        return { type: 'chat', data: data.data };
      } else {
        console.error('❌ Unexpected response type:', data);
        return { type: 'chat', data: 'Lo siento, recibí una respuesta inesperada. Por favor, inténtalo de nuevo.' };
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Provide more specific error messages in Spanish
      let errorMessage = 'Lo siento, algo salió mal. Por favor, inténtalo de nuevo.';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'La solicitud se agotó. Por favor, inténtalo de nuevo.';
        } else if (error.message.includes('API failed')) {
          errorMessage = 'Hubo un problema con la API. Por favor, inténtalo de nuevo en un momento.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      return { type: 'chat', data: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Convert enhanced search results to MatchResult format for existing components
  const convertToMatchResults = (influencers: any[]): MatchResult[] => {
    return influencers.map((result) => {
      // Handle both direct influencer objects and result objects with influencer property
      const influencer = result.influencer || result;
      
      return {
        influencer: {
          id: influencer.id || influencer.username,
          name: influencer.name || influencer.fullName || influencer.displayName || influencer.username,
          handle: influencer.handle || influencer.username,
          platform: influencer.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
          followerCount: influencer.followerCount || influencer.followers,
          engagementRate: influencer.engagementRate || (influencer.engagementRate || 2.5) / 100,
          ageRange: '25-34',
          gender: 'Other' as 'Male' | 'Female' | 'Non-Binary' | 'Other',
          location: influencer.location || 'Unknown',
          niche: [influencer.category || 'Lifestyle'],
          contentStyle: ['Posts'],
          pastCollaborations: [],
          averageRate: 1000,
          costLevel: 'Mid-Range' as 'Budget' | 'Mid-Range' | 'Premium' | 'Celebrity',
          audienceDemographics: influencer.audienceDemographics || {
            ageGroups: {
              '13-17': 0,
              '18-24': 30,
              '25-34': 40,
              '35-44': 20,
              '45-54': 8,
              '55+': 2,
            },
            gender: {
              male: 50,
              female: 48,
              other: 2,
            },
            topLocations: [influencer.location || 'Unknown'],
            interests: [influencer.category || 'Lifestyle'],
          },
          recentPosts: [],
          contactInfo: {
            email: influencer.email,
            preferredContact: 'Email' as 'Email' | 'Phone' | 'DM' | 'Management',
          },
          isActive: true,
          lastUpdated: new Date(),
        },
        matchScore: result.matchScore || (influencer.brandCompatibilityScore || 85) / 100,
        matchReasons: result.matchReasons || [
          'Real-time data from social media',
          `Active in ${influencer.category || 'lifestyle'} niche`,
          `${(influencer.followerCount || influencer.followers || 0).toLocaleString()} followers`,
        ],
        estimatedCost: result.estimatedCost || 1000,
        similarPastCampaigns: result.similarPastCampaigns || [],
        potentialReach: result.potentialReach || Math.round((influencer.followerCount || influencer.followers || 0) * (influencer.engagementRate || 0.025)),
        recommendations: result.recommendations || ['Consider this influencer for authentic content'],
      };
    });
  };

  // Convert discovery results to MatchResult format
  const convertDiscoveryToMatchResults = (discoveryResults: any[]): MatchResult[] => {
    return discoveryResults.map((profile) => ({
      influencer: {
        id: profile.id || profile.handle || profile.username,
        name: profile.name || profile.handle || profile.username,
        handle: profile.handle || profile.username,
        platform: profile.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
        followerCount: profile.followers || profile.followerCount || 50000,
        engagementRate: (profile.engagementRate || 3.2) / 100,
        ageRange: '25-34',
        gender: profile.detectedGender === 'male' ? 'Male' : profile.detectedGender === 'female' ? 'Female' : 'Other',
        location: profile.location || 'Unknown',
        niche: [profile.category || profile.niche || 'Lifestyle'],
        contentStyle: ['Posts', 'Stories'],
        pastCollaborations: [],
        averageRate: Math.floor(profile.followers / 50) || 1000,
        costLevel: 'Mid-Range' as 'Budget' | 'Mid-Range' | 'Premium' | 'Celebrity',
        audienceDemographics: profile.audienceDemographics || {
          ageGroups: {
            '13-17': 5,
            '18-24': 35,
            '25-34': 40,
            '35-44': 15,
            '45-54': 4,
            '55+': 1,
          },
          gender: {
            male: 45,
            female: 52,
            other: 3,
          },
          topLocations: [profile.location || 'Unknown'],
          interests: [profile.category || profile.niche || 'Lifestyle'],
        },
        recentPosts: [],
        contactInfo: {
          email: profile.email,
          preferredContact: 'DM' as 'Email' | 'Phone' | 'DM' | 'Management',
        },
        isActive: true,
        lastUpdated: new Date(),
      },
      matchScore: (profile.brandCompatibilityScore || 75) / 100,
      matchReasons: [
        'Discovered through real-time search',
        `${profile.followers?.toLocaleString() || 'Active'} followers`,
        `${profile.category || profile.niche || 'Lifestyle'} content creator`,
      ],
      estimatedCost: Math.floor((profile.followers || 50000) / 50) || 1000,
      similarPastCampaigns: [],
      potentialReach: Math.round((profile.followers || 50000) * ((profile.engagementRate || 3.2) / 100)),
      recommendations: ['Consider for authentic content creation'],
    }));
  };

  const handleGenerateProposal = (selectedInfluencers: MatchResult[]) => {
    setCurrentView('generate');
  };

  const handleProposalGenerated = (proposal: CampaignProposal) => {
    setCurrentProposal(proposal);
    setCurrentView('proposal');
  };

  const handleEditProposal = () => {
    setCurrentView('generate');
  };

  const handleExport = (format: 'csv' | 'pdf' | 'hibiki' | 'orange') => {
    if (!currentProposal) return;

    switch (format) {
      case 'csv':
        exportProposalToCSV(currentProposal);
        break;
      case 'pdf':
        exportProposalToPDF(currentProposal);
        break;
      case 'hibiki':
        exportHibikiStyleCSV(currentProposal);
        break;
      case 'orange':
        exportOrangeStyleCSV(currentProposal);
        break;
    }
  };

  const handleGetStarted = () => {
    setCurrentView('search');
    setShowSidebar(true);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setShowSidebar(false);
  };

  const handleClearResults = () => {
    setSearchResults(null);
    setCurrentSearchId(null);
    setShowAllResults(false);
  };

  const handleSidebarViewChange = (view: PageView) => {
      setCurrentView(view);
    setShowSidebar(false); // Close mobile sidebar
  };

  const renderContent = () => {
    if (currentView === 'landing') {
        return <LandingPage onGetStarted={handleGetStarted} />;
    }

        return (
      <div className="flex-1 flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100 min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 min-h-0 space-y-6">
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200/50 max-w-sm mx-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search.loading')}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t('search.loading.desc')}</p>
                  <div className="flex space-x-1 justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'search' && (
            <>
              {/* Enhanced Search Interface */}
              <div className="transform transition-all duration-500 ease-out">
                <SearchInterface 
                  onSendMessage={handleSendMessage}
                  onPDFAnalyzed={setPdfAnalysisContext}
                  isLoading={isLoading}
                />
              </div>
                    
              {/* Enhanced Results Section */}
              {searchResults && (
                <div 
                  ref={resultsRef}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 transition-all duration-500 ease-out transform hover:shadow-2xl"
                >
                  {/* Enhanced Results Header */}
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                      📊 Resultados de Búsqueda
                          <span className="ml-3 text-base font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            {searchResults.premiumResults.length}
                          </span>
                    </h2>
                        <p className="text-sm sm:text-base text-gray-600">
                          {searchResults.premiumResults.length} influencers perfectos encontrados
                      {searchResults.totalFound > searchResults.premiumResults.length && 
                            ` de ${searchResults.totalFound} total disponibles`
                      }
                    </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleClearResults}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          Limpiar resultados
                        </button>
                        {searchResults.premiumResults.length > 0 && (
                          <button
                            onClick={() => handleGenerateProposal(searchResults.premiumResults)}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                          >
                            Generar propuesta
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <InfluencerResults 
                    results={searchResults.premiumResults}
                  />
                </div>
              )}

              {/* Empty State */}
              {!searchResults && !isLoading && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 sm:p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Comienza tu búsqueda
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Usa el chat IA o los filtros para encontrar los influencers perfectos para tu campaña
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">💬</span>
                        Chat: "Busca influencers de fitness en Madrid"
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">🎯</span>
                        Filtros: Criterios específicos
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {currentView === 'generate' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 transition-all duration-500 ease-out">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  📄 {t('proposal.title')}
                </h2>
                <p className="text-gray-600">
                  {t('proposal.subtitle')}
                </p>
              </div>
              
              {currentProposal ? (
                <ProposalViewer
                  proposal={currentProposal}
                  onEdit={handleEditProposal}
                  onExport={handleExport}
                />
              ) : (
                <ProposalGenerator 
                  matchResults={searchResults?.premiumResults || []}
                  onProposalGenerated={handleProposalGenerated}
                />
                    )}
                  </div>
                )}

          {currentView === 'campaigns' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 transition-all duration-500 ease-out">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  🎯 {t('campaigns.title')}
                </h2>
                <p className="text-gray-600">
                  {t('campaigns.subtitle')}
                </p>
              </div>
              
              <EnhancedCampaignManager />
                  </div>
                )}

          {currentView === 'notes' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-500 ease-out h-full">
              <div className="p-6 border-b border-gray-200/50">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  📝 {t('notes.title')}
                </h2>
                <p className="text-gray-600">
                  {t('notes.subtitle')}
                </p>
              </div>
              
              <div className="h-full">
              <NotesManager />
              </div>
              </div>
            )}
          </div>

        {/* Enhanced Feedback Panel - Desktop Only */}
        {currentSearchId && (
          <div className="hidden xl:block w-80 p-4 lg:p-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 h-full overflow-hidden">
              <div className="p-6 border-b border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  📊 Search Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Real-time feedback and metrics
                </p>
              </div>
              
              <div className="flex-1 overflow-hidden">
              <EnhancedFeedbackPanel 
                searchId={currentSearchId}
                sessionId={sessionId}
                searchQuery="Recent search"
                resultCount={searchResults?.premiumResults.length || 0}
              />
              </div>
            </div>
          </div>
        )}
          </div>
        );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Switcher - Always visible */}
      <LanguageSwitcher position="top-right" />
      
      {currentView === 'landing' ? (
        // Landing page without sidebar
        renderContent()
      ) : (
        // Main app with sidebar
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Sidebar */}
      <Sidebar 
            currentView={currentView as PageView} 
        onViewChange={handleSidebarViewChange} 
      />
      
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
        {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
} 