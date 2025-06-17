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
import MemoryDashboard from '@/components/MemoryDashboard';
import { MatchResult } from '@/types/influencer';
import { CampaignProposal } from '@/types/campaign';
import { exportProposalToCSV, exportProposalToPDF } from '@/utils/exportUtils';
import { exportHibikiStyleCSV, exportOrangeStyleCSV } from '@/lib/newExportUtils';
import { generateSessionId } from '@/lib/database';
import Sidebar, { PageView } from '@/components/Sidebar';

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
        
        const searchResponse = await fetch('/api/search-apify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            ...data.data,  // Spread the search parameters directly
            sessionId: sessionId,
            // TODO: Add campaign context when available
            // campaignId: currentCampaignId,
            // campaignStatus: currentCampaignStatus,
            // brandName: data.data.brandName
          }),
        });

        const searchData = await searchResponse.json();
        
        if (searchData.success) {
          // Convert the results to MatchResult format
          const convertedResults = convertToMatchResults(searchData.premiumResults || []);
          console.log('Search results received:', {
            premiumResults: searchData.premiumResults?.length || 0,
            discoveryResults: searchData.discoveryResults?.length || 0,
            totalFound: searchData.totalFound || 0
          });
          
          // Check if this is a follow-up search (if we already have results)
          if (searchResults && searchResults.premiumResults.length > 0) {
            // Accumulate results - combine with existing results
            const existingDiscoveryUrls = new Set(searchResults.premiumResults.map(r => r.influencer.handle));
            const newDiscoveryResults = (searchData.discoveryResults || []).filter(
              (result: any) => !existingDiscoveryUrls.has(result.handle)
            );
            
            setSearchResults({
              premiumResults: [...searchResults.premiumResults, ...convertedResults, ...newDiscoveryResults],
              discoveryResults: searchData.discoveryResults || [],
              totalFound: searchData.totalFound || 0
            });
            
            console.log(`🔄 Follow-up search: Added ${newDiscoveryResults.length} new discovery results`);
          } else {
            // First search - set results normally
            setSearchResults({
              premiumResults: [...convertedResults, ...searchData.premiumResults || []],
              discoveryResults: searchData.discoveryResults || [],
              totalFound: searchData.totalFound || 0
            });
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
        return { type: 'chat', data: 'Sorry, I received an unexpected response. Please try again.' };
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, something went wrong. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please try again.';
        } else if (error.message.includes('API failed')) {
          errorMessage = 'There was an issue with the API. Please try again in a moment.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      return { type: 'chat', data: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Convert ScrapedInfluencer to MatchResult for existing components
  const convertToMatchResults = (influencers: any[]): MatchResult[] => {
    return influencers.map((influencer) => ({
      influencer: {
        id: influencer.id,
        name: influencer.fullName || influencer.username,
        handle: influencer.username,
        platform: influencer.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
        followerCount: influencer.followers,
        engagementRate: (influencer.engagementRate || 2.5) / 100,
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
      matchScore: (influencer.brandCompatibilityScore || 85) / 100,
      matchReasons: [
        'Real-time data from social media',
        `Active in ${influencer.category || 'lifestyle'} niche`,
        `${influencer.followers.toLocaleString()} followers`,
      ],
      estimatedCost: 1000,
      similarPastCampaigns: [],
      potentialReach: Math.round(influencer.followers * ((influencer.engagementRate || 2.5) / 100)),
      recommendations: ['Consider this influencer for authentic content'],
    }));
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
          <div className="min-h-screen space-y-6 p-6">
            <Chatbot onSendMessage={handleSendMessage} />
            {searchResults && (searchResults.premiumResults.length > 0 || searchResults.discoveryResults.length > 0) && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Search Results ({(searchResults.premiumResults.length + searchResults.discoveryResults.length)} total)
                  </h2>
                  <button
                    onClick={handleClearResults}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🗑️ Clear Results
                  </button>
                </div>
                {searchResults.premiumResults.length > 0 && (
                  <InfluencerResults 
                    results={searchResults.premiumResults}
                  />
                )}
                {searchResults.discoveryResults.length > 0 && (
                  <DiscoveryGrid 
                    discoveryInfluencers={searchResults.discoveryResults}
                  />
                )}
                {currentSearchId && (
                  <FeedbackPanel 
                    searchId={currentSearchId}
                    sessionId={sessionId} 
                  />
                )}
              </>
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
      case 'memory':
        return <MemoryDashboard />;
      default:
        return <Chatbot onSendMessage={handleSendMessage} />;
    }
  };

  // If on landing page, don't show sidebar
  if (currentView === 'landing') {
    return renderContent();
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar 
        currentView={currentView === 'chat' ? 'search' : currentView as PageView} 
        onViewChange={handleSidebarViewChange} 
      />
      
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
} 