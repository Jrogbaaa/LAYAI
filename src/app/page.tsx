'use client';

import { useState, useEffect } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { InfluencerResults } from '@/components/InfluencerResults';
import { ProposalGenerator } from '@/components/ProposalGenerator';
import { ProposalViewer } from '@/components/ProposalViewer';
import { MatchCriteria, MatchResult } from '@/types/influencer';
import { CampaignProposal } from '@/types/campaign';
import { findInfluencerMatches } from '@/lib/matching';
import { exportProposalToCSV, exportHibikiStyleCSV, exportProposalToPDF } from '@/utils/exportUtils';

type PageView = 'search' | 'proposal-generator' | 'proposal-viewer';

export default function Home() {
  const [view, setView] = useState<PageView>('search');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentProposal, setCurrentProposal] = useState<CampaignProposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);



  const handleSearch = async (criteria: MatchCriteria) => {
    setIsLoading(true);
    try {
      // First, try to get additional data from Apify if configured
      let apifyResults: any[] = [];
      
      if (criteria.platform.length > 0 && criteria.niche.length > 0) {
        try {
          const apifyResponse = await fetch('/api/search-apify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              platforms: criteria.platform,
              niches: criteria.niche,
              minFollowers: criteria.followerRange.min,
              maxFollowers: criteria.followerRange.max,
              maxResults: 20,
              location: criteria.location?.[0],
              gender: criteria.gender,
              ageRange: criteria.ageRange,
              strictLocationMatch: false,
            }),
          });

          if (apifyResponse.ok) {
            const apifyData = await apifyResponse.json();
            console.log('Apify API Response:', apifyData);
            if (apifyData.success) {
              apifyResults = apifyData.data;
              console.log(`Found ${apifyResults.length} influencers via Apify:`, apifyResults);
              if (apifyResults.length === 0) {
                console.warn('Apify returned success=true but empty data array');
              }
            } else {
              console.log('Apify returned success: false', apifyData);
            }
          } else {
            console.log('Apify search not available, using local data only');
          }
        } catch (apifyError) {
          console.log('Apify search failed, using local data only:', apifyError);
        }
      }

      // Local matching algorithm (now returns empty array since mock data removed)
      const results = await findInfluencerMatches(criteria);
      
      // Use Apify results as primary data source since mock data has been removed
      const enhancedResults = [...results];
      
      // Add Apify results that don't duplicate existing ones
      console.log(`Processing ${apifyResults.length} Apify results for UI display`);
      apifyResults.forEach((apifyInfluencer) => {
        
        const existsInLocal = results.some(result => 
          result.influencer.handle.toLowerCase() === apifyInfluencer.username.toLowerCase() &&
          result.influencer.platform.toLowerCase() === apifyInfluencer.platform.toLowerCase()
        );
        
        if (!existsInLocal) {
          try {
            // Convert Apify result to MatchResult format
            const matchResult = {
             influencer: {
               id: `apify-${apifyInfluencer.platform}-${apifyInfluencer.username}`,
               name: apifyInfluencer.fullName || apifyInfluencer.username,
               handle: apifyInfluencer.username,
               platform: apifyInfluencer.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
               followerCount: apifyInfluencer.followers,
               engagementRate: apifyInfluencer.engagementRate || 2.5,
               ageRange: '25-34',
               gender: 'Other' as 'Male' | 'Female' | 'Non-Binary' | 'Other',
               location: apifyInfluencer.location || 'Unknown',
               niche: [apifyInfluencer.category],
               contentStyle: ['Posts'],
               pastCollaborations: [],
               averageRate: apifyInfluencer.collaborationRate || 1000,
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
                 topLocations: [apifyInfluencer.location || 'Unknown'],
                 interests: [apifyInfluencer.category],
               },
               recentPosts: [],
               contactInfo: {
                 email: apifyInfluencer.email,
                 preferredContact: 'Email' as 'Email' | 'Phone' | 'DM' | 'Management',
               },
               isActive: true,
               lastUpdated: new Date(),
             },
             matchScore: 85, // Default good match score for Apify results
             matchReasons: [
               'Real-time data from social media',
               `Active in ${apifyInfluencer.category} niche`,
               `${apifyInfluencer.followers.toLocaleString()} followers`,
             ],
             estimatedCost: apifyInfluencer.collaborationRate || 1000,
             similarPastCampaigns: [],
             potentialReach: Math.round(apifyInfluencer.followers * ((apifyInfluencer.engagementRate || 2.5) / 100)),
             recommendations: ['Consider this influencer for authentic content'],
            };
            
            enhancedResults.push(matchResult);
          } catch (conversionError) {
            console.error(`Error converting Apify result for ${apifyInfluencer.username}:`, conversionError);
          }
        }
      });
      
      console.log(`Final enhanced results: ${enhancedResults.length} matches to display in UI`);
      console.log('Enhanced results sample:', enhancedResults[0]?.influencer?.name);
      console.log('About to call setMatches...');
      setMatches(enhancedResults);
      console.log('setMatches called successfully');
    } catch (error) {
      console.error('Search failed with error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Set empty results on error
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposalGenerated = (proposal: CampaignProposal) => {
    setCurrentProposal(proposal);
    setView('proposal-viewer');
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
    setView('proposal-generator');
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
                onClick={() => setView('search')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Search Influencers
              </button>
              <button
                onClick={() => setView('proposal-generator')}
                disabled={matches.length === 0}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'proposal-generator'
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
                  onClick={() => setView('proposal-viewer')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'proposal-viewer'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {view === 'search' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Find Perfect Influencer Matches
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Search real-time influencer data from Instagram, TikTok, and other platforms using our Apify integration. 
                Generate professional proposals in the style of top agencies like TSL and Hibiki.
              </p>
            </div>
            
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            

            
            {matches.length > 0 && (
              <div data-testid="search-results">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Search Results ({matches.length} matches)
                  </h3>
                  <button
                    onClick={() => setView('proposal-generator')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Proposal from Results
                  </button>
                </div>
                <InfluencerResults results={matches} />
              </div>
            )}
          </div>
        )}

        {view === 'proposal-generator' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Generate Campaign Proposal
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Create professional campaign proposals in the style of leading agencies. 
                Select talents, customize commitments, and export in multiple formats.
              </p>
            </div>
            
            {matches.length > 0 ? (
              <ProposalGenerator 
                matchResults={matches} 
                onProposalGenerated={handleProposalGenerated}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No search results available.</p>
                <button
                  onClick={() => setView('search')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Start New Search
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'proposal-viewer' && currentProposal && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Campaign Proposal Preview
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Review your campaign proposal and export in professional formats 
                compatible with industry standards.
              </p>
            </div>
            
            <ProposalViewer 
              proposal={currentProposal}
              onExport={handleExport}
              onEdit={handleEditProposal}
            />
          </div>
        )}
      </main>

      {/* Help Section */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">How to Use</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>1. Search for influencers using our advanced filters</li>
                <li>2. Review match scores and detailed analytics</li>
                <li>3. Generate professional campaign proposals</li>
                <li>4. Export in CSV or PDF formats</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Export Formats</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Standard CSV (Orange/TSL style)</li>
                <li>• Hibiki CSV (Luxury brand style)</li>
                <li>• PDF Summary Report</li>
                <li>• Detailed Analytics</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• AI-powered matching algorithm</li>
                <li>• Detailed audience demographics</li>
                <li>• Engagement rate analysis</li>
                <li>• Cost estimation</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 