'use client';

import React, { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  owner: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Paused';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  endDate: string;
  budget: number;
  influencerCount: number;
  platform: string[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{campaignId: string, field: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState<{campaignId: string, notes: string} | null>(null);

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/database/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCampaign = async (campaignId: string, field: keyof Campaign, value: any) => {
    try {
      const response = await fetch('/api/database/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          campaignId,
          field,
          value
        })
      });

      const data = await response.json();
      if (data.success) {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? data.campaign : campaign
        ));
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const createCampaign = async () => {
    try {
      const newCampaign = {
        name: 'New Campaign',
        owner: 'Clara',
        status: 'Planning' as const,
        priority: 'Medium' as const,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 10000,
        influencerCount: 0,
        platform: ['Instagram'],
        notes: ''
      };

      const response = await fetch('/api/database/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          campaign: newCampaign
        })
      });

      const data = await response.json();
      if (data.success) {
        setCampaigns(prev => [data.campaign, ...prev]);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch('/api/database/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          campaignId
        })
      });

      const data = await response.json();
      if (data.success) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const updateCampaign = (campaignId: string, field: keyof Campaign, value: any) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, [field]: value }
        : campaign
    ));
    // Auto-save to database
    saveCampaign(campaignId, field, value);
  };

  const handleCellClick = (campaignId: string, field: string, currentValue: any) => {
    if (field === 'status' || field === 'priority') {
      const dropdownId = `${field}-${campaignId}`;
      setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
    } else if (['name', 'budget', 'influencerCount', 'timeline'].includes(field)) {
      setEditingCell({ campaignId, field });
      setTempValue(currentValue.toString());
    } else if (field === 'notes') {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setShowNotesModal({ campaignId, notes: campaign.notes });
      }
    }
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    const { campaignId, field } = editingCell;
    let value: any = tempValue;
    
    if (field === 'budget' || field === 'influencerCount') {
      value = parseInt(tempValue) || 0;
    } else if (field === 'timeline') {
      // For timeline, we just store the text as entered
      // In a real app, you might want to parse this and update startDate/endDate
      // For now, we'll just store it as notes or ignore it since it's display-only
      setEditingCell(null);
      setTempValue('');
      return;
    }
    
    updateCampaign(campaignId, field as keyof Campaign, value);
    setEditingCell(null);
    setTempValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const handleNotesUpdate = (notes: string) => {
    if (showNotesModal) {
      updateCampaign(showNotesModal.campaignId, 'notes', notes);
      setShowNotesModal({ ...showNotesModal, notes });
    }
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
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(budget);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    // If same month, show "Jun 16-30", otherwise "Jun 16 - Jul 30"
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  const getProgressPercentage = (status: Campaign['status'], startDate: string, endDate: string) => {
    if (status === 'Completed') return 100;
    if (status === 'Planning') return 0;
    if (status === 'Paused') return 50;
    
    // Calculate based on current date
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
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
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[200] min-w-[120px]">
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
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[200] min-w-[120px]">
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
          <button 
            onClick={createCampaign}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Campaign
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          {/* Table Structure */}
          <table className="w-full" style={{ position: 'relative', zIndex: 1 }}>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Notes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">Actions</th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign, index) => (
                <tr 
                  key={campaign.id} 
                  className="hover:bg-gray-50 transition-colors relative"
                  style={{ zIndex: campaigns.length - index + 10 }}
                >
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
                  <td className="px-4 py-4 h-16 relative">
                    <StatusCell campaign={campaign} />
                  </td>

                  {/* Priority Cell */}
                  <td className="px-4 py-4 h-16 relative">
                    <PriorityCell campaign={campaign} />
                  </td>

                  {/* Timeline Cell */}
                  <td className="px-4 py-4">
                    {editingCell?.campaignId === campaign.id && editingCell?.field === 'timeline' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                          }}
                          placeholder="Jun 16-30"
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white text-gray-900"
                          autoFocus
                        />
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            campaign.status === 'Completed' ? 'bg-green-500' :
                            campaign.status === 'Active' ? 'bg-blue-500' :
                            campaign.status === 'Planning' ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`}
                          style={{ 
                              width: `${getProgressPercentage(campaign.status, campaign.startDate, campaign.endDate)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          onClick={() => handleCellClick(campaign.id, 'timeline', formatDateRange(campaign.startDate, campaign.endDate))}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm font-medium text-gray-900"
                        >
                          {formatDateRange(campaign.startDate, campaign.endDate)}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              campaign.status === 'Completed' ? 'bg-green-500' :
                              campaign.status === 'Active' ? 'bg-blue-500' :
                              campaign.status === 'Planning' ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`}
                            style={{ 
                              width: `${getProgressPercentage(campaign.status, campaign.startDate, campaign.endDate)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
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
                    {editingCell?.campaignId === campaign.id && editingCell?.field === 'influencerCount' ? (
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
                      <div 
                        onClick={() => handleCellClick(campaign.id, 'influencerCount', campaign.influencerCount)}
                        className="text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                      <span className="text-sm font-medium text-gray-900">{campaign.influencerCount}</span>
                      <div className="text-xs text-gray-500">influencers</div>
                      </div>
                    )}
                  </td>

                  {/* Notes Cell */}
                  <td className="px-4 py-4 relative">
                    <div 
                      onClick={() => handleCellClick(campaign.id, 'notes', campaign.notes)}
                      className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      {campaign.notes ? (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Notes
                          </div>
                          <div className="text-sm text-gray-700">
                            {campaign.notes.length > 20 
                              ? `${campaign.notes.substring(0, 20)}...` 
                              : campaign.notes}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Notes</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions Cell */}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete Campaign"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first campaign</p>
              <button
                onClick={createCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Campaign
              </button>
            </div>
          )}
        </div>

        {/* Summary Bar */}
        {campaigns.length > 0 && (
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
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Notes</h3>
            </div>
            <div className="p-6">
              <textarea
                value={showNotesModal.notes}
                onChange={(e) => handleNotesUpdate(e.target.value)}
                placeholder="Add your campaign notes here..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNotesModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager; 