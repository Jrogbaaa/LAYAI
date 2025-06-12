'use client';

import React, { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  owner: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Paused';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  timeline: string;
  budget: number;
  influencerCount: number;
  platform: string[];
  dependency?: string;
}

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'IKEA Home Decor Launch',
      owner: 'Marketing Team',
      status: 'Active',
      priority: 'High',
      timeline: 'Jan 15 - 30',
      budget: 25000,
      influencerCount: 12,
      platform: ['Instagram', 'TikTok'],
      dependency: 'Content Creation'
    },
    {
      id: '2',
      name: 'Spring Fashion Collection',
      owner: 'Brand Manager',
      status: 'Planning',
      priority: 'Critical',
      timeline: 'Feb 1 - 14',
      budget: 45000,
      influencerCount: 8,
      platform: ['Instagram', 'YouTube'],
    },
    {
      id: '3',
      name: 'Tech Product Review',
      owner: 'Product Team',
      status: 'Completed',
      priority: 'Medium',
      timeline: 'Dec 10 - 25',
      budget: 15000,
      influencerCount: 5,
      platform: ['YouTube', 'TikTok'],
    }
  ]);

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{campaignId: string, field: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const updateCampaign = (campaignId: string, field: keyof Campaign, value: any) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, [field]: value }
        : campaign
    ));
  };

  const handleCellClick = (campaignId: string, field: string, currentValue: any) => {
    if (field === 'status' || field === 'priority') {
      const dropdownId = `${field}-${campaignId}`;
      setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
    } else if (field === 'name' || field === 'budget') {
      setEditingCell({ campaignId, field });
      setTempValue(currentValue.toString());
    }
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    const { campaignId, field } = editingCell;
    let value: any = tempValue;
    
    if (field === 'budget') {
      value = parseInt(tempValue) || 0;
    }
    
    updateCampaign(campaignId, field as keyof Campaign, value);
    setEditingCell(null);
    setTempValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'Planning': return 'bg-orange-500 text-white';
      case 'Active': return 'bg-green-500 text-white';
      case 'Completed': return 'bg-blue-500 text-white';
      case 'Paused': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: Campaign['priority']) => {
    switch (priority) {
      case 'Low': return 'bg-blue-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'High': return 'bg-purple-500 text-white';
      case 'Critical': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(budget);
  };

  const StatusCell = ({ campaign }: { campaign: Campaign }) => {
    const dropdownId = `status-${campaign.id}`;
    const isOpen = openDropdown === dropdownId;
    const statuses: Campaign['status'][] = ['Planning', 'Active', 'Completed', 'Paused'];

    return (
      <div className="dropdown-container relative h-full">
        <div
          onClick={() => handleCellClick(campaign.id, 'status', campaign.status)}
          className={`h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded text-sm font-medium ${getStatusColor(campaign.status)}`}
        >
          {campaign.status}
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation();
                  updateCampaign(campaign.id, 'status', status);
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md text-gray-900 font-medium"
              >
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                  {status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PriorityCell = ({ campaign }: { campaign: Campaign }) => {
    const dropdownId = `priority-${campaign.id}`;
    const isOpen = openDropdown === dropdownId;
    const priorities: Campaign['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

    return (
      <div className="dropdown-container relative h-full">
        <div
          onClick={() => handleCellClick(campaign.id, 'priority', campaign.priority)}
          className={`h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded text-sm font-medium ${getPriorityColor(campaign.priority)}`}
        >
          {campaign.priority}
          {campaign.priority === 'Critical' && <span className="ml-1">⚠️</span>}
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]">
            {priorities.map((priority) => (
              <button
                key={priority}
                onClick={(e) => {
                  e.stopPropagation();
                  updateCampaign(campaign.id, 'priority', priority);
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md text-gray-900 font-medium"
              >
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
                  {priority}
                  {priority === 'Critical' && <span className="ml-1">⚠️</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <h1 className="text-xl font-semibold text-gray-900">Campaign Management</h1>
            </div>
            <span className="text-sm text-gray-500">
              {campaigns.length} campaigns • {campaigns.filter(c => c.status === 'Active').length} active
            </span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Campaign
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Structure */}
          <table className="w-full">
            {/* Header Row */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaigns(campaigns.map(c => c.id));
                      } else {
                        setSelectedCampaigns([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-80">Campaign</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Owner</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-28">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-28">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-40">Timeline</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-28">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-28">Influencers</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Dependency</th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  {/* Checkbox Cell */}
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => toggleCampaignSelection(campaign.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>

                  {/* Campaign Name Cell */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {campaign.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        {editingCell?.campaignId === campaign.id && editingCell?.field === 'name' ? (
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave();
                              if (e.key === 'Escape') handleCancel();
                            }}
                            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white text-gray-900"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleCellClick(campaign.id, 'name', campaign.name)}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            <div className="font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                              {campaign.platform.map((platform, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Owner Cell */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                        {campaign.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-gray-700">{campaign.owner}</span>
                    </div>
                  </td>

                  {/* Status Cell */}
                  <td className="px-4 py-4 h-16">
                    <StatusCell campaign={campaign} />
                  </td>

                  {/* Priority Cell */}
                  <td className="px-4 py-4 h-16">
                    <PriorityCell campaign={campaign} />
                  </td>

                  {/* Timeline Cell */}
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm text-gray-900 mb-2">{campaign.timeline}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            campaign.status === 'Completed' ? 'bg-green-500' :
                            campaign.status === 'Active' ? 'bg-blue-500' :
                            campaign.status === 'Planning' ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`}
                          style={{ 
                            width: campaign.status === 'Completed' ? '100%' :
                                   campaign.status === 'Active' ? '65%' :
                                   campaign.status === 'Planning' ? '25%' : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Budget Cell */}
                  <td className="px-4 py-4">
                    {editingCell?.campaignId === campaign.id && editingCell?.field === 'budget' ? (
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave();
                          if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white text-gray-900"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleCellClick(campaign.id, 'budget', campaign.budget)}
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block"
                      >
                        {formatBudget(campaign.budget)}
                      </span>
                    )}
                  </td>

                  {/* Influencer Count Cell */}
                  <td className="px-4 py-4">
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-900">{campaign.influencerCount}</span>
                      <div className="text-xs text-gray-500">influencers</div>
                    </div>
                  </td>

                  {/* Dependency Cell */}
                  <td className="px-4 py-4">
                    {campaign.dependency && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        {campaign.dependency}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Bar */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
              <div className="text-sm text-gray-500">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{campaigns.filter(c => c.status === 'Active').length}</div>
              <div className="text-sm text-gray-500">Active Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatBudget(campaigns.reduce((sum, c) => sum + c.budget, 0))}
              </div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {campaigns.reduce((sum, c) => sum + c.influencerCount, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Influencers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignManager; 