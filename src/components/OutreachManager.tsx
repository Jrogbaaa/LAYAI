'use client';

import React, { useState, useEffect } from 'react';
import { MatchResult } from '@/types/influencer';
import { 
  automatedOutreachService, 
  OutreachCampaign, 
  OutreachMessage, 
  OutreachTemplate 
} from '@/lib/automatedOutreachService';

interface OutreachManagerProps {
  selectedInfluencers: MatchResult[];
  campaignName?: string;
  brandName?: string;
  onOutreachLaunched?: (campaign: OutreachCampaign) => void;
}

export const OutreachManager: React.FC<OutreachManagerProps> = ({
  selectedInfluencers,
  campaignName = 'New Campaign',
  brandName = 'Your Brand',
  onOutreachLaunched
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'templates' | 'campaign' | 'analytics'>('setup');
  const [currentCampaign, setCurrentCampaign] = useState<OutreachCampaign | null>(null);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Partial<OutreachCampaign['templates']>>({});

  useEffect(() => {
    if (currentCampaign) {
      const campaignMessages = automatedOutreachService.getCampaignMessages(currentCampaign.id);
      setMessages(campaignMessages);
    }
  }, [currentCampaign]);

  const handleCreateCampaign = async () => {
    setIsLoading(true);
    try {
      const campaign = await automatedOutreachService.createOutreachCampaign(
        campaignName,
        brandName,
        selectedInfluencers,
        customTemplates
      );
      
      setCurrentCampaign(campaign);
      setActiveTab('campaign');
      
      if (onOutreachLaunched) {
        onOutreachLaunched(campaign);
      }
      
      console.log('📧 Outreach campaign created successfully');
    } catch (error) {
      console.error('Failed to create outreach campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMessages = async (templateType: OutreachTemplate['type'] = 'initial_contact') => {
    if (!currentCampaign) return;
    
    setIsLoading(true);
    try {
      const newMessages = await automatedOutreachService.generateCampaignMessages(
        currentCampaign.id,
        templateType
      );
      setMessages(prev => [...prev, ...newMessages]);
      console.log(`📝 Generated ${newMessages.length} ${templateType} messages`);
    } catch (error) {
      console.error('Failed to generate messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleFollowUps = async () => {
    if (!currentCampaign) return;
    
    setIsLoading(true);
    try {
      const followUpMessages = await automatedOutreachService.scheduleFollowUps(currentCampaign.id);
      setMessages(prev => [...prev, ...followUpMessages]);
      console.log(`📅 Scheduled ${followUpMessages.length} follow-up messages`);
    } catch (error) {
      console.error('Failed to schedule follow-ups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaignAnalytics = () => {
    if (!currentCampaign) return null;
    return automatedOutreachService.getCampaignAnalytics(currentCampaign.id);
  };

  const renderSetupTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Automated Outreach Setup</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">Campaign Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Campaign Name:</span>
                <span className="font-medium">{campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Brand:</span>
                <span className="font-medium">{brandName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Influencers:</span>
                <span className="font-medium">{selectedInfluencers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Reach:</span>
                <span className="font-medium">
                  {selectedInfluencers.reduce((sum, inf) => sum + inf.influencer.followerCount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">Outreach Strategy</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Personalized initial contact</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Automatic follow-ups (3 days)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Campaign proposals</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Content guidelines</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Selected Influencers Preview</h4>
          <div className="grid gap-3 max-h-48 overflow-y-auto">
            {selectedInfluencers.slice(0, 5).map((influencer) => (
              <div key={influencer.influencer.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {influencer.influencer.name?.[0] || influencer.influencer.handle[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">@{influencer.influencer.handle}</div>
                    <div className="text-sm text-gray-600">
                      {influencer.influencer.followerCount.toLocaleString()} followers
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    ${influencer.estimatedCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {influencer.influencer.contactInfo?.email ? '📧 Email' : '📱 Contact via DM'}
                  </div>
                </div>
              </div>
            ))}
            {selectedInfluencers.length > 5 && (
              <div className="text-center text-sm text-gray-500 py-2">
                ...and {selectedInfluencers.length - 5} more influencers
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCreateCampaign}
            disabled={isLoading || selectedInfluencers.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Campaign...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Launch Outreach Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Email Templates</h3>
        
        <div className="grid gap-4">
          {[
            {
              type: 'initial_contact',
              title: 'Initial Contact',
              description: 'First outreach message to introduce your brand',
              icon: '👋',
              color: 'blue'
            },
            {
              type: 'follow_up',
              title: 'Follow-Up',
              description: 'Gentle reminder for unresponded initial messages',
              icon: '📞',
              color: 'green'
            },
            {
              type: 'collaboration_proposal',
              title: 'Collaboration Proposal',
              description: 'Detailed proposal with campaign specifics',
              icon: '🤝',
              color: 'purple'
            },
            {
              type: 'content_guidelines',
              title: 'Content Guidelines',
              description: 'Guidelines and requirements for content creation',
              icon: '📋',
              color: 'orange'
            }
          ].map((template) => (
            <div key={template.type} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${template.color}-100 rounded-lg flex items-center justify-center text-lg`}>
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  Customize
                </button>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                <div className="font-medium mb-1">Available Variables:</div>
                <div className="flex flex-wrap gap-1">
                  {['influencerName', 'brandName', 'followerCount', 'estimatedCost', 'matchScore'].map((variable) => (
                    <span key={variable} className="bg-white px-2 py-1 rounded border">
                      {`{${variable}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCampaignTab = () => {
    if (!currentCampaign) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No active campaign</div>
          <button 
            onClick={() => setActiveTab('setup')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Go to Setup
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🚀 Active Campaign: {currentCampaign.name}</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentCampaign.status === 'active' ? 'bg-green-100 text-green-800' :
              currentCampaign.status === 'draft' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {currentCampaign.status.charAt(0).toUpperCase() + currentCampaign.status.slice(1)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Total Messages</div>
              <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Sent Messages</div>
              <div className="text-2xl font-bold text-blue-600">
                {messages.filter(m => ['sent', 'delivered', 'opened', 'replied'].includes(m.status)).length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Response Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {getCampaignAnalytics()?.responseRate.toFixed(1) || 0}%
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => handleGenerateMessages('initial_contact')}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              📧 Generate Initial Messages
            </button>
            <button
              onClick={handleScheduleFollowUps}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              📅 Schedule Follow-ups
            </button>
            <button
              onClick={() => handleGenerateMessages('collaboration_proposal')}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
            >
              🤝 Generate Proposals
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Messages Overview</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No messages generated yet. Click "Generate Initial Messages" to start.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {messages.slice(0, 10).map((message) => (
                    <div key={message.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-gray-900">@{message.influencerHandle}</div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            message.status === 'replied' ? 'bg-green-100 text-green-800' :
                            message.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {message.status}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {message.scheduledAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-900 font-medium mb-1">{message.subject}</div>
                      <div className="text-sm text-gray-600 truncate">{message.content.substring(0, 100)}...</div>
                    </div>
                  ))}
                  {messages.length > 10 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      ...and {messages.length - 10} more messages
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    const analytics = getCampaignAnalytics();
    
    if (!analytics) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No analytics available</div>
          <div className="text-sm text-gray-400">Create a campaign first to view analytics</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Campaign Analytics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalMessages}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.sentMessages}</div>
              <div className="text-sm text-gray-600">Sent Messages</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.openRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Open Rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.responseRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Messages Opened</span>
                  <span className="font-medium">{analytics.openedMessages}/{analytics.sentMessages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Messages Replied</span>
                  <span className="font-medium">{analytics.repliedMessages}/{analytics.sentMessages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-medium">{analytics.averageResponseTime.toFixed(1)}h</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Campaign Health</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${analytics.responseRate >= 15 ? 'bg-green-500' : analytics.responseRate >= 8 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    Response Rate: {analytics.responseRate >= 15 ? 'Excellent' : analytics.responseRate >= 8 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${analytics.openRate >= 25 ? 'bg-green-500' : analytics.openRate >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    Open Rate: {analytics.openRate >= 25 ? 'Excellent' : analytics.openRate >= 15 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Campaign Status: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📧 Automated Outreach Manager</h2>
        <p className="text-gray-600">Manage personalized outreach campaigns for your selected influencers</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'setup', label: 'Setup', icon: '⚙️' },
            { id: 'templates', label: 'Templates', icon: '📝' },
            { id: 'campaign', label: 'Campaign', icon: '🚀' },
            { id: 'analytics', label: 'Analytics', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'setup' && renderSetupTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'campaign' && renderCampaignTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
}; 