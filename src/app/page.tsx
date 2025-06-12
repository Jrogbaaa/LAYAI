'use client';

import { useState, useEffect } from 'react';
import { Chatbot, Message } from '@/components/Chatbot';
import { InfluencerResults } from '@/components/InfluencerResults';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { ProposalGenerator } from '@/components/ProposalGenerator';
import { ProposalViewer } from '@/components/ProposalViewer';
import { MatchCriteria, MatchResult } from '@/types/influencer';
import { CampaignProposal } from '@/types/campaign';
import { findInfluencerMatches } from '@/lib/matching';
import { exportProposalToCSV, exportHibikiStyleCSV, exportProposalToPDF } from '@/utils/exportUtils';
import { generateSessionId } from '@/lib/database';
import DiscoveryGrid from '@/components/DiscoveryGrid';

type PageView = 'search' | 'proposal-generator' | 'proposal-viewer';

interface SearchResults {
  premiumResults: ScrapedInfluencer[];
  discoveryResults: BasicInfluencerProfile[];
  totalFound: number;
}

interface ScrapedInfluencer {
  id: string;
  username: string;
  fullName: string;
  biography: string;
  url: string;
  followers: number;
  following: number;
  posts: number;
  verified: boolean;
  isPrivate: boolean;
  platform: string;
  category: string;
  location: string;
  email?: string;
  engagementRate?: number;
  brandCompatibilityScore?: number;
}

interface BasicInfluencerProfile {
  username: string;
  fullName: string;
  followers: number;
  platform: string;
  niche: string;
  profileUrl: string;
  source: 'verified-discovery';
}

export default function Home() {
  const [currentView, setCurrentView] = useState<PageView>('search');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentProposal, setCurrentProposal] = useState<CampaignProposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [premiumInfluencers, setPremiumInfluencers] = useState<ScrapedInfluencer[]>([]);
  const [discoveryInfluencers, setDiscoveryInfluencers] = useState<BasicInfluencerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session on component mount
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    console.log('🆔 Generated session ID:', newSessionId);
  }, []);

  const handleSendMessage = async (message: string, history: Message[]) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.type === 'search') {
          console.log('🤖 AI parsed search query:', data.data);
          await handleSearch(data.data);
        }
        return data;
      } else {
        console.error('Chatbot API error:', data.error);
        return { type: 'chat', data: 'Sorry, something went wrong with the AI assistant.' };
      }
    } catch (error) {
      console.error('Error sending message to chatbot API:', error);
      return { type: 'chat', data: 'Sorry, I had trouble processing your request. Please try again.' };
    }
  };

  const handleFeedbackSubmitted = (feedbackData: any) => {
    console.log('📝 Feedback submitted:', feedbackData);
    
    // Show learning insights if available
    if (feedbackData.learningInsights?.suggestedQueries?.length > 0) {
      console.log('🧠 Learning insights:', feedbackData.learningInsights);
    }
  };

  const renderMainContent = () => {
    if (currentView === 'search') {
      return (
        <div>
          <Chatbot onSendMessage={handleSendMessage} />
          {hasSearched && (
            loading ? (
              <div className="text-center p-8">
                <p className="text-lg font-semibold text-gray-700">🔍 AI is searching for influencers...</p>
                <div className="mt-4 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Using Serply web search + Apify data extraction</p>
              </div>
            ) : (
              (premiumInfluencers.length > 0 || discoveryInfluencers.length > 0) ? (
                <div className="mt-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          ✨ Found {totalFound} influencers matching your criteria!
                        </h3>
                        <div className="mt-1 text-sm text-green-700">
                          {premiumInfluencers.length} premium profiles with full analytics + {discoveryInfluencers.length} discovery matches
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Panel */}
                  {currentSearchId && (
                    <FeedbackPanel
                      searchId={currentSearchId}
                      sessionId={sessionId}
                      onFeedbackSubmitted={handleFeedbackSubmitted}
                    />
                  )}
                  
                  <InfluencerResults results={convertToMatchResults(premiumInfluencers)} />
                  <DiscoveryGrid discoveryInfluencers={discoveryInfluencers} />
                </div>
              ) : (
                <div className="text-center p-8 mt-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-lg font-semibold text-yellow-800">🤔 No influencers found for your criteria</p>
                    <p className="text-yellow-700 mt-2">Try asking for different criteria like:</p>
                    <ul className="text-sm text-yellow-600 mt-2 space-y-1">
                      <li>• Different platforms (Instagram, TikTok, YouTube)</li>
                      <li>• Broader follower ranges</li>
                      <li>• Different niches or locations</li>
                      <li>• Less specific requirements</li>
                    </ul>
                  </div>
                </div>
              )
            )
          )}
        </div>
      );
    }
    if (currentView === 'proposal-generator') {
      return <ProposalGenerator matchResults={matches} onProposalGenerated={handleProposalGenerated} />;
    }
    if (currentView === 'proposal-viewer' && currentProposal) {
      return <ProposalViewer proposal={currentProposal!} onExport={handleExport} onEdit={handleEditProposal} />;
    }
    return null;
  };

  const handleSearch = async (criteria: any) => {
    setLoading(true);
    setHasSearched(true);
    setPremiumInfluencers([]);
    setDiscoveryInfluencers([]);
    setCurrentSearchId(null);
    
        try {
      const response = await fetch('/api/search-apify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...criteria,
              sessionId,
              userQuery: criteria.userQuery || '',
            }),
          });

      const data = await response.json();
      
      if (data.success) {
        setPremiumInfluencers(data.premiumResults || []);
        setDiscoveryInfluencers(data.discoveryResults || []);
        setTotalFound(data.totalFound || 0);
        setCurrentSearchId(data.searchId);
        console.log(`Received ${data.premiumResults?.length || 0} premium results and ${data.discoveryResults?.length || 0} discovery results`);
        console.log('🆔 Search ID for feedback:', data.searchId);
            } else {
        console.error('Search failed:', data.error);
        }
    } catch (error) {
      console.error('Error searching influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalGenerated = (proposal: CampaignProposal) => {
    setCurrentProposal(proposal);
    setCurrentView('proposal-viewer');
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!currentProposal) return;

    if (format === 'csv') {
      // Show both export options
      const exportType = confirm(
        'Choose export format:\nOK for Standard CSV\nCancel for Hibiki-style CSV'
      );
      if (exportType) {
        exportProposalToCSV(currentProposal);
      } else {
        exportHibikiStyleCSV(currentProposal);
      }
    } else {
      exportProposalToPDF(currentProposal);
    }
  };

  const handleEditProposal = () => {
    setCurrentView('proposal-generator');
  };

  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">
              Social Media Talent Matcher
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('search')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Search Influencers
              </button>
              <button
                onClick={() => setCurrentView('proposal-generator')}
                disabled={matches.length === 0}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'proposal-generator'
                    ? 'bg-blue-100 text-blue-700'
                    : matches.length === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Generate Proposal
              </button>
              {currentProposal && (
                <button
                  onClick={() => setCurrentView('proposal-viewer')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'proposal-viewer'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  View Proposal
                </button>
              )}
            </div>
          </div>
          
          {matches.length > 0 && (
            <div className="text-sm text-gray-600">
              {matches.length} matches found
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  // Convert ScrapedInfluencer to MatchResult for existing components
  const convertToMatchResults = (influencers: ScrapedInfluencer[]): MatchResult[] => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="text-center py-16 px-4 bg-white shadow-lg rounded-xl max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Find the <span className="text-blue-600">Perfect Influencer</span>
                </h1>
            <p className="mt-4 text-xl text-gray-600">
          Our AI-powered platform helps you discover and match with influencers for your brand campaigns.
            </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {renderNavigation()}
        {renderMainContent()}
      </main>
    </div>
  );
} 