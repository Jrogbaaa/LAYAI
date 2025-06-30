'use client';

import { useState, useEffect } from 'react';
import { Chatbot } from '@/components/Chatbot';
import { InfluencerResults } from '@/components/InfluencerResults';
import { ProposalGenerator } from '@/components/ProposalGenerator';
import { ProposalViewer } from '@/components/ProposalViewer';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import CampaignManager from '@/components/CampaignManager';
import NotesManager from '@/components/NotesManager';
import LandingPage from '@/components/LandingPage';

import { MatchResult } from '@/types/influencer';
import { CampaignProposal } from '@/types/campaign';
import { exportProposalToCSV, exportProposalToPDF } from '@/utils/exportUtils';
import { exportHibikiStyleCSV, exportOrangeStyleCSV } from '@/lib/newExportUtils';
import { generateSessionId } from '@/lib/database';
import Sidebar, { PageView } from '@/components/Sidebar';
import EnhancedFeedbackPanel from '@/components/EnhancedFeedbackPanel';

type ExtendedPageView = PageView | 'landing' | 'chat' | 'campaigns' | 'proposal';

interface SearchResults {
  premiumResults: MatchResult[];
  discoveryResults: any[];
  totalFound: number;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ExtendedPageView>('landing');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<CampaignProposal | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  const handleSendMessage = async (message: string, history: any[]) => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Sending message to chat API:', message);
      
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
          audienceDemographics: {
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
        audienceDemographics: {
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
    setCurrentView('chat');
    setShowSidebar(true);
  };

  const handleClearResults = () => {
    setSearchResults(null);
    setCurrentSearchId(null);
    setShowAllResults(false);
  };

  const handleSidebarViewChange = (view: PageView) => {
    if (view === 'search') {
      setCurrentView('chat');
    } else {
      setCurrentView(view);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} />;
      case 'chat':
        return (
          <div className="min-h-screen overflow-y-auto bg-gray-50">
            {/* Chat Section - Always visible at top */}
            <div className="w-full max-w-4xl mx-auto px-6 py-8">
              <Chatbot onSendMessage={handleSendMessage} />
            </div>
            
            {/* Results Section - Flows naturally below chat */}
            {searchResults && (searchResults.premiumResults.length > 0 || searchResults.discoveryResults.length > 0) && (
              <div className="w-full max-w-7xl mx-auto px-6 pb-8">
                {/* Search Results Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Search Results ({(searchResults.premiumResults.length + searchResults.discoveryResults.length)} total)
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Found {searchResults.premiumResults.length} premium and {searchResults.discoveryResults.length} discovery results
                      </p>
                    </div>
                    <button
                      onClick={handleClearResults}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <span>🗑️</span>
                      <span>Clear Results</span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Feedback Panel - More Prominent */}
                {currentSearchId && (
                  <div className="mb-6">
                    <EnhancedFeedbackPanel 
                      searchId={currentSearchId}
                      sessionId={sessionId}
                      searchQuery={searchResults.premiumResults.length > 0 ? 'Recent search' : 'Discovery search'}
                      resultCount={searchResults.premiumResults.length + searchResults.discoveryResults.length}
                    />
                  </div>
                )}

                {/* Results Display with Pagination */}
                {searchResults.premiumResults.length > 0 && (() => {
                  console.log('🔍 Rendering results section. Premium count:', searchResults.premiumResults.length, 'Show all:', showAllResults, 'Should show button:', searchResults.premiumResults.length > 20 && !showAllResults);
                  return true;
                })() && (
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center space-x-2">
                        <span>⭐</span>
                        <span>Premium Results ({searchResults.premiumResults.length})</span>
                      </h3>
                      <p className="text-blue-700 text-sm mt-1">
                        Verified profiles with detailed analytics and contact information
                      </p>
                    </div>
                    
                    {/* Show first 20 results by default */}
                    <InfluencerResults 
                      results={showAllResults ? searchResults.premiumResults : searchResults.premiumResults.slice(0, 20)}
                    />
                    
                    {/* Show More Button - show when there are more than 20 results */}
                    {searchResults.premiumResults.length > 20 && !showAllResults && (
                      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 text-center border-2 border-dashed border-blue-200">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-3 bg-white rounded-full shadow-sm">
                            <span className="text-2xl">🔍</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {searchResults.premiumResults.length - 20} Influencers Adicionales Encontrados
                            </h3>
                            <p className="text-gray-600 text-sm max-w-md mx-auto">
                              Mostrando los primeros 20 resultados. Hay {searchResults.premiumResults.length - 20} influencers más que coinciden perfectamente con tu búsqueda.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              console.log('🔄 Expanding to show all results:', searchResults.premiumResults.length);
                              setShowAllResults(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm"
                          >
                            <span>👀</span>
                            <span>Mostrar Todos los {searchResults.premiumResults.length} Resultados</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Collapse Button - when showing all results */}
                    {showAllResults && searchResults.premiumResults.length > 20 && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setShowAllResults(false)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                        >
                          <span>▲</span>
                          <span>Mostrar Solo los Primeros 20</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Discovery Results (separate section if any) */}
                {searchResults.discoveryResults.length > 0 && (
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-purple-900 flex items-center space-x-2">
                        <span>🔍</span>
                        <span>Discovery Results ({searchResults.discoveryResults.length})</span>
                      </h3>
                      <p className="text-purple-700 text-sm mt-1">
                        Additional profiles found through web search
                      </p>
                    </div>
                    <DiscoveryGrid 
                      discoveryInfluencers={searchResults.discoveryResults}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'generate':
        // Convert discovery results to MatchResult format and combine with premium results
        const allResults = [
          ...searchResults?.premiumResults || [],
          ...convertDiscoveryToMatchResults(searchResults?.discoveryResults || [])
        ];
        return <ProposalGenerator 
          matchResults={allResults} 
          onProposalGenerated={handleProposalGenerated}
          // TODO: Add campaign context when user selects a specific campaign
          // campaignId={selectedCampaignId}
          // campaignStatus={selectedCampaignStatus}
        />;
      case 'proposal':
        return currentProposal ? (
          <div className="min-h-screen p-6">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('generate')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Back to Generator
              </button>
            </div>
            <ProposalViewer 
              proposal={currentProposal} 
              onExport={handleExport}
              onEdit={handleEditProposal}
            />
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">No proposal to display</p>
          </div>
        );
      case 'campaigns':
        return <CampaignManager />;
      case 'notes':
        return <NotesManager />;

      default:
        return <Chatbot onSendMessage={handleSendMessage} />;
    }
  };

  // If on landing page, don't show sidebar
  if (currentView === 'landing') {
    return renderContent();
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar 
        currentView={currentView === 'chat' ? 'search' : currentView as PageView} 
        onViewChange={handleSidebarViewChange} 
      />
      
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
} 