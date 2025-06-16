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
import AdaptiveSidebar, { SidebarItem } from '@/components/ui/adaptive-sidebar';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardHeader, CardContent, ProgressCard } from '@/components/ui/enhanced-card';
import SmartTooltip, { useContextualHelp } from '@/components/ui/smart-tooltip';
import { MatchResult } from '@/types/influencer';
import { CampaignProposal } from '@/types/campaign';
import { exportProposalToCSV, exportProposalToPDF } from '@/utils/exportUtils';
import { exportHibikiStyleCSV, exportOrangeStyleCSV } from '@/lib/newExportUtils';
import { generateSessionId } from '@/lib/database';
import { cn } from '@/lib/utils';

type PageView = 'landing' | 'chat' | 'generate' | 'campaigns' | 'notes';

interface SearchResults {
  premiumResults: MatchResult[];
  discoveryResults: any[];
  totalFound: number;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<CampaignProposal | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Contextual help for the current view
  const { shouldShowHelp, helpContent, setShouldShowHelp } = useContextualHelp(
    currentView === 'chat' ? 'influencer-selection' : 
    currentView === 'generate' ? 'proposal-generation' : 'campaign-creation',
    userLevel
  );

  useEffect(() => {
    setSessionId(generateSessionId());
    
    // Simulate user level detection (in real app, this would come from user data)
    const detectedLevel = localStorage.getItem('userLevel') as any || 'beginner';
    setUserLevel(detectedLevel);
  }, []);

  // Define sidebar navigation items
  const sidebarItems: SidebarItem[] = [
    {
      id: 'chat',
      label: 'AI Discovery',
      icon: '🤖',
      tooltip: 'Chat with AI to discover influencers',
      count: searchResults?.totalFound || undefined
    },
    {
      id: 'generate',
      label: 'Create Proposal',
      icon: '📋',
      tooltip: searchResults?.premiumResults?.length 
        ? 'Generate campaign proposals' 
        : 'Find influencers first to create proposals',
      disabled: false // Always allow access to proposal tab
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: '📊',
      tooltip: 'Manage your campaigns',
      isNew: userLevel === 'beginner'
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: '📝',
      tooltip: 'Your campaign notes and ideas'
    }
  ];

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
            ...data.data,
            sessionId: sessionId
          }),
        });

        const searchData = await searchResponse.json();
        
        if (searchData.success) {
          const convertedResults = convertToMatchResults(searchData.premiumResults || []);
          console.log('Search results received:', {
            premiumResults: searchData.premiumResults?.length || 0,
            discoveryResults: searchData.discoveryResults?.length || 0,
            totalFound: searchData.totalFound || 0
          });
          
          if (searchResults && searchResults.discoveryResults.length > 0) {
            const existingDiscoveryUrls = new Set(searchResults.discoveryResults.map(r => r.profileUrl));
            const newDiscoveryResults = (searchData.discoveryResults || []).filter(
              (result: any) => !existingDiscoveryUrls.has(result.profileUrl)
            );
            
            setSearchResults({
              premiumResults: [...searchResults.premiumResults, ...convertedResults],
              discoveryResults: [...searchResults.discoveryResults, ...newDiscoveryResults],
              totalFound: searchResults.totalFound + (searchData.totalFound || 0)
            });
            
            console.log(`🔄 Follow-up search: Added ${newDiscoveryResults.length} new discovery results`);
          } else {
            setSearchResults({
              premiumResults: convertedResults,
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

  const convertDiscoveryToMatchResults = (discoveryResults: any[]): MatchResult[] => {
    return discoveryResults.map((profile: any) => ({
      influencer: {
        id: profile.id || profile.username || Math.random().toString(),
        name: profile.fullName || profile.displayName || profile.username,
        handle: profile.username,
        platform: profile.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
        followerCount: profile.followers || 0,
        engagementRate: (profile.engagementRate || 3.2) / 100,
        ageRange: '25-34',
        gender: 'Other' as 'Male' | 'Female' | 'Non-Binary' | 'Other',
        location: profile.location || 'Unknown',
        niche: [profile.category || profile.niche || 'Lifestyle'],
        contentStyle: ['Posts'],
        pastCollaborations: [],
        averageRate: Math.floor((profile.followers || 50000) / 50) || 1000,
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
          topLocations: [profile.location || 'Unknown'],
          interests: [profile.category || profile.niche || 'Lifestyle'],
        },
        recentPosts: [],
        contactInfo: {
          email: profile.email,
          preferredContact: 'Email' as 'Email' | 'Phone' | 'DM' | 'Management',
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
    setCurrentView('generate');
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

  const handleDirectSearch = async (handles: string[]) => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Direct handle search:', handles);
      
      // Use the existing Instagram scraping API
      const response = await fetch('/api/scrape-instagram-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handles: handles,
        }),
      });

      if (!response.ok) {
        throw new Error(`Instagram scraping failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.profiles?.length) {
        const convertedResults = convertToMatchResults(data.profiles);
        console.log('Direct search results:', {
          profiles: data.profiles.length,
          converted: convertedResults.length
        });
        
        // Merge with existing results if any
        if (searchResults) {
          setSearchResults({
            premiumResults: [...searchResults.premiumResults, ...convertedResults],
            discoveryResults: searchResults.discoveryResults,
            totalFound: searchResults.totalFound + convertedResults.length
          });
        } else {
          setSearchResults({
            premiumResults: convertedResults,
            discoveryResults: [],
            totalFound: convertedResults.length
          });
        }
        
        setCurrentSearchId(`direct_${Date.now()}`);
      } else {
        console.error('❌ Direct search failed:', data);
        throw new Error(data.error || 'No profiles found');
      }
    } catch (error) {
      console.error('❌ Direct search error:', error);
      throw error; // Re-throw to let chatbot handle the error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (viewId: string) => {
    // Prevent page scrolling when changing tabs
    setCurrentView(viewId as PageView);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} />;
      case 'chat':
        return (
          <div className="h-full flex flex-col">
            {/* Header with contextual help */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Discovery Chat</h1>
                  <p className="text-gray-600">Describe your ideal influencer and let AI find perfect matches</p>
                </div>
                
                {searchResults && (
                  <div className="flex items-center gap-3">
                    <SmartTooltip 
                      content="Clear current search results and start fresh"
                      position="bottom"
                    >
                      <Button
                        variant="secondary"
                        onClick={handleClearResults}
                        leftIcon="🗑️"
                      >
                        Clear Results
                      </Button>
                    </SmartTooltip>
                  </div>
                )}
              </div>
              
              {/* Progress indicator for search */}
              {isLoading && (
                <ProgressCard
                  progress={75}
                  title="Analyzing Requirements"
                  description="AI is processing your request and searching for matching influencers..."
                  className="mt-4"
                />
              )}
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                <Chatbot 
                  onSendMessage={handleSendMessage} 
                  onDirectSearch={handleDirectSearch}
                />
                
                {searchResults && (
                  <div className="space-y-6">
                    <Card variant="glass" hover>
                      <CardHeader 
                        icon="🎯"
                        action={
                          <span className="text-sm text-gray-500">
                            {searchResults.totalFound} total found
                          </span>
                        }
                      >
                        <h2 className="text-xl font-semibold text-gray-900">
                          Premium Matches
                        </h2>
                        <p className="text-gray-600 text-sm">
                          High-quality influencers with detailed analytics
                        </p>
                      </CardHeader>
                      <CardContent>
                        <InfluencerResults results={searchResults.premiumResults} />
                      </CardContent>
                    </Card>

                    <Card variant="glass" hover>
                      <CardHeader 
                        icon="🔍"
                        action={
                          <span className="text-sm text-gray-500">
                            {searchResults.discoveryResults.length} discovered
                          </span>
                        }
                      >
                        <h2 className="text-xl font-semibold text-gray-900">
                          Discovery Results
                        </h2>
                        <p className="text-gray-600 text-sm">
                          Additional influencers found through real-time search
                        </p>
                      </CardHeader>
                      <CardContent>
                        <DiscoveryGrid discoveryInfluencers={searchResults.discoveryResults} />
                      </CardContent>
                    </Card>

                    {currentSearchId && (
                      <Card variant="default">
                        <CardHeader icon="💬">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Feedback
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Help us improve by rating these results
                          </p>
                        </CardHeader>
                        <CardContent>
                          <FeedbackPanel 
                            searchId={currentSearchId}
                            sessionId={sessionId} 
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'generate':
        const allResults = [
          ...(searchResults?.premiumResults || []),
          ...convertDiscoveryToMatchResults(searchResults?.discoveryResults || [])
        ];
        
        // If no search results, show empty state with guidance
        if (allResults.length === 0) {
          return (
            <div className="h-full flex items-center justify-center p-6">
              <Card variant="glass" className="max-w-md text-center">
                <CardHeader icon="🔍">
                  <h2 className="text-xl font-semibold text-gray-900">
                    No Influencers Found
                  </h2>
                  <p className="text-gray-600">
                    Start by discovering influencers in the AI Discovery tab first
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                      <p>To create a proposal, you need to:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Use AI Discovery to find influencers</li>
                        <li>Review and select your matches</li>
                        <li>Return here to generate proposals</li>
                      </ol>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => setCurrentView('chat')}
                      leftIcon="🤖"
                      className="w-full"
                    >
                      Start AI Discovery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        
        return (
          <div className="h-full">
            <ProposalGenerator matchResults={allResults} onProposalGenerated={handleProposalGenerated} />
          </div>
        );
      case 'campaigns':
        return (
          <div className="h-full">
            <CampaignManager />
          </div>
        );
      case 'notes':
        return (
          <div className="h-full">
            <NotesManager />
          </div>
        );
      default:
        return <Chatbot onSendMessage={handleSendMessage} />;
    }
  };

  // Landing page doesn't need sidebar
  if (currentView === 'landing') {
    return renderContent();
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Adaptive Sidebar */}
      {showSidebar && (
        <div className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}>
          <AdaptiveSidebar
            items={sidebarItems}
            currentView={currentView}
            onNavigate={handleNavigation}
            userLevel={userLevel}
            onToggle={setSidebarCollapsed}
            className="h-full"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Contextual Help Banner */}
        {shouldShowHelp && showSidebar && (
          <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-600">💡</span>
                <p className="text-sm text-blue-800">{helpContent}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShouldShowHelp(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 