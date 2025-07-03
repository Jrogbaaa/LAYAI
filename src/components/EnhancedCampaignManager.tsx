'use client';

import React, { useState, useEffect } from 'react';
import { campaignService } from '@/lib/enhancedCampaignService';
import { EnhancedCampaign, SavedSearch, SavedInfluencer } from '@/types/campaign';

export const EnhancedCampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{campaignId: string, field: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState<{campaignId: string, notes: string} | null>(null);
  const [showSearchesModal, setShowSearchesModal] = useState<{campaignId: string, searches: SavedSearch[]} | null>(null);
  const [showInfluencersModal, setShowInfluencersModal] = useState<{campaignId: string, influencers: SavedInfluencer[]} | null>(null);

  // 🔥 NEW: Add request deduplication to prevent API spam
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    // 🛡️ SPAM PROTECTION: Prevent multiple simultaneous requests
    if (isLoadingCampaigns) {
      console.log('⚠️ Campaign load already in progress, skipping...');
      return;
    }
    
    try {
      setIsLoadingCampaigns(true);
      setIsLoading(true);
      const campaignList = await campaignService.getAllCampaigns();
      
      // Filter and sanitize campaigns to prevent display of invalid data
      const validCampaigns = campaignList.filter(campaign => {
        // Filter out campaigns with invalid names (JSON strings, partial results, etc.)
        const isValidName = campaign.name && 
          !campaign.name.includes('PARTIAL_RESULTS') && 
          !campaign.name.includes('{') && 
          !campaign.name.includes('"influencer"') &&
          campaign.name.length < 200;
          
        const isValidBrand = campaign.brandName && 
          !campaign.brandName.includes('PARTIAL_RESULTS') && 
          !campaign.brandName.includes('{') && 
          !campaign.brandName.includes('"influencer"') &&
          campaign.brandName.length < 200;
          
        return isValidName && isValidBrand;
      }).map(campaign => {
        // Sanitize campaign data
        return {
          ...campaign,
          name: campaign.name || 'Unnamed Campaign',
          brandName: campaign.brandName || 'Unknown Brand',
          notes: campaign.notes && campaign.notes.includes('PARTIAL_RESULTS') ? '' : campaign.notes
        };
      });
      
      setCampaigns(validCampaigns);
      console.log(`📊 Loaded ${validCampaigns.length} valid campaigns (filtered from ${campaignList.length} total)`);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingCampaigns(false);
    }
  };

  const saveCampaign = async (campaignId: string, field: keyof EnhancedCampaign, value: any) => {
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
        brandName: 'New Brand',
        owner: 'Clara',
        status: 'Planning' as const,
        priority: 'Medium' as const,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 10000,
        platform: ['Instagram'],
        notes: ''
      };

      const response = await fetch('/api/database/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_enhanced',
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
    if (!confirm('¿Estás seguro de que quieres eliminar esta campaña?')) return;

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

  const updateCampaign = async (campaignId: string, field: keyof EnhancedCampaign, value: any) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, [field]: value }
        : campaign
    ));
    
    await saveCampaign(campaignId, field, value);
  };

  const handleCellClick = (campaignId: string, field: string, currentValue: any) => {
    if (field === 'status' || field === 'priority') {
      const dropdownId = `${field}-${campaignId}`;
      setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
    } else if (['name', 'brandName', 'budget', 'timeline'].includes(field)) {
      setEditingCell({ campaignId, field });
      setTempValue(currentValue.toString());
    } else if (field === 'notes') {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setShowNotesModal({ campaignId, notes: campaign.notes });
      }
    } else if (field === 'savedSearches') {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setShowSearchesModal({ campaignId, searches: campaign.savedSearches || [] });
      }
    } else if (field === 'savedInfluencers') {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setShowInfluencersModal({ campaignId, influencers: campaign.savedInfluencers || [] });
      }
    }
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    const { campaignId, field } = editingCell;
    let value: any = tempValue;
    let fieldToUpdate: keyof EnhancedCampaign = field as keyof EnhancedCampaign;
    
    if (field === 'budget') {
      value = parseInt(tempValue) || 0;
    } else if (field === 'timeline') {
      fieldToUpdate = 'customTimeline';
      value = tempValue;
    }
    
    updateCampaign(campaignId, fieldToUpdate, value);
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
      setShowNotesModal(null);
    }
  };

  const removeInfluencerFromCampaign = async (campaignId: string, influencerId: string) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const influencerToRemove = campaign.savedInfluencers?.find(inf => inf.id === influencerId);
      if (!influencerToRemove) return;

      // Show detailed confirmation
      const confirmMessage = `¿Eliminar a ${influencerToRemove.influencerData.name} (@${influencerToRemove.influencerData.handle}) de la campaña "${campaign.name}"?\n\nEsta acción no se puede deshacer.`;
      
      if (!window.confirm(confirmMessage)) return;

      // Remove the influencer from the saved influencers list
      const updatedInfluencers = (campaign.savedInfluencers || []).filter(
        inf => inf.id !== influencerId
      );

      // Update the campaign with the new influencers list
      await updateCampaign(campaignId, 'savedInfluencers', updatedInfluencers);
      
      // Update the modal state if it's currently showing
      if (showInfluencersModal && showInfluencersModal.campaignId === campaignId) {
        if (updatedInfluencers.length === 0) {
          // Close modal if no influencers remain
          setShowInfluencersModal(null);
        } else {
          setShowInfluencersModal({
            campaignId,
            influencers: updatedInfluencers
          });
        }
      }

      console.log(`🗑️ Removed influencer ${influencerToRemove.influencerData.name} from campaign ${campaign.name}`);
      
      // Show success feedback (optional - you could add a toast notification here)
      
    } catch (error) {
      console.error('Error removing influencer from campaign:', error);
      alert('Error al eliminar el influencer. Por favor, inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCell && !(e.target as Element).closest('.editing-cell')) {
        handleSave();
      }
      if (openDropdown && !(e.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingCell, openDropdown]);

  const getStatusColor = (status: EnhancedCampaign['status']) => {
    switch (status) {
      case 'Planning': return 'bg-yellow-100 text-yellow-800';
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Paused': return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: EnhancedCampaign['priority']) => {
    switch (priority) {
      case 'Low': return 'bg-gray-100 text-gray-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
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
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  };

  const StatusCell = ({ campaign }: { campaign: EnhancedCampaign }) => {
    const dropdownId = `status-${campaign.id}`;
    const isOpen = openDropdown === dropdownId;
    const [buttonRect, setButtonRect] = React.useState<DOMRect | null>(null);

    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
      if (isOpen && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    }, [isOpen]);

    return (
      <div className="dropdown-container">
        <button
          ref={buttonRef}
          onClick={() => setOpenDropdown(isOpen ? null : dropdownId)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)} hover:opacity-80 transition-opacity`}
        >
          {campaign.status}
        </button>
        {isOpen && buttonRect && (
          <div 
            className="fixed bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-[120px] max-w-[200px]"
            style={{
              top: `${buttonRect.bottom + window.scrollY + 4}px`,
              left: `${buttonRect.left + window.scrollX}px`
            }}
          >
            {(['Planning', 'Active', 'Completed', 'Paused'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  updateCampaign(campaign.id, 'status', status);
                  setOpenDropdown(null);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PriorityCell = ({ campaign }: { campaign: EnhancedCampaign }) => {
    const dropdownId = `priority-${campaign.id}`;
    const isOpen = openDropdown === dropdownId;
    const [buttonRect, setButtonRect] = React.useState<DOMRect | null>(null);

    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
      if (isOpen && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    }, [isOpen]);

    return (
      <div className="dropdown-container">
        <button
          ref={buttonRef}
          onClick={() => setOpenDropdown(isOpen ? null : dropdownId)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(campaign.priority)} hover:opacity-80 transition-opacity`}
        >
          {campaign.priority}
        </button>
        {isOpen && buttonRect && (
          <div 
            className="fixed bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-[120px] max-w-[200px]"
            style={{
              top: `${buttonRect.bottom + window.scrollY + 4}px`,
              left: `${buttonRect.left + window.scrollX}px`
            }}
          >
            {(['Low', 'Medium', 'High', 'Critical'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => {
                  updateCampaign(campaign.id, 'priority', priority);
                  setOpenDropdown(null);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                {priority}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const EditableCell = ({ 
    campaign, 
    field, 
    value, 
    className = "",
    placeholder = ""
  }: { 
    campaign: EnhancedCampaign; 
    field: string; 
    value: string; 
    className?: string;
    placeholder?: string;
  }) => {
    const isEditing = editingCell?.campaignId === campaign.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="editing-cell">
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={placeholder}
            autoFocus
          />
        </div>
      );
    }

    return (
      <div
        onClick={() => handleCellClick(campaign.id, field, value)}
        className={`cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors ${className}`}
        title="Haz clic para editar"
      >
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </div>
    );
  };

    return (
    <div className="p-6 bg-white">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando campañas...</p>
        </div>
      </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!isLoading && (
        <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Gestión de Campañas</h1>
            <p className="text-gray-600 mt-1">Gestiona todas tus campañas, búsquedas guardadas e influencers</p>
          </div>
          <button
            onClick={createCampaign}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span>Nueva Campaña</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
            <div className="text-sm text-blue-700">Total Campañas</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {campaigns.reduce((sum, c) => sum + (c.savedSearches?.length || 0), 0)}
            </div>
            <div className="text-sm text-green-700">Búsquedas Guardadas</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {campaigns.reduce((sum, c) => sum + (c.savedInfluencers?.length || 0), 0)}
            </div>
            <div className="text-sm text-purple-700">Influencers Guardados</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {campaigns.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-orange-700">Campañas Activas</div>
          </div>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto relative">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-2 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaigns(campaigns.map(c => c.id));
                      } else {
                        setSelectedCampaigns([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">
                   Campaña
                 </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-20">
                   Propietario
                 </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
                  Estado
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-20">
                  Prioridad
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                  Cronograma
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
                  Presupuesto
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-20 text-center">
                  Búsquedas
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-20 text-center">
                  Influencers
                </th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-12 text-center">
                  Notas
                </th>
                <th className="w-12 px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className={`hover:bg-gray-50 ${selectedCampaigns.includes(campaign.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => toggleCampaignSelection(campaign.id)}
                    />
                  </td>
                  <td className="px-2 py-3">
                     <EditableCell 
                       campaign={campaign} 
                       field="name" 
                       value={campaign.name}
                      className="font-medium text-gray-900 text-sm"
                       placeholder="Nombre de campaña"
                     />
                   </td>
                  <td className="px-2 py-3 text-sm text-gray-700">
                     {campaign.owner}
                   </td>
                  <td className="px-2 py-3">
                    <StatusCell campaign={campaign} />
                  </td>
                  <td className="px-2 py-3">
                    <PriorityCell campaign={campaign} />
                  </td>
                  <td className="px-2 py-3">
                     <EditableCell 
                       campaign={campaign} 
                       field="timeline" 
                       value={campaign.customTimeline || formatDateRange(campaign.startDate, campaign.endDate)}
                      className="text-gray-700 text-sm"
                      placeholder="Jun 2025"
                     />
                   </td>
                  <td className="px-2 py-3">
                    <EditableCell 
                      campaign={campaign} 
                      field="budget" 
                      value={formatBudget(campaign.budget)}
                      className="text-gray-700 text-sm"
                      placeholder="0 €"
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => handleCellClick(campaign.id, 'savedSearches', null)}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      <span>🔍</span>
                      <span>{campaign.savedSearches?.length || 0}</span>
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => handleCellClick(campaign.id, 'savedInfluencers', null)}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors"
                    >
                      <span>👥</span>
                      <span>{campaign.savedInfluencers?.length || 0}</span>
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => handleCellClick(campaign.id, 'notes', campaign.notes)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Ver/editar notas"
                    >
                      📝
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/database/campaigns', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'delete',
                                  campaignId: campaign.id
                                })
                              });
                              
                              const data = await response.json();
                              if (data.success) {
                                setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                              }
                            } catch (error) {
                              console.error('Error deleting campaign:', error);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar campaña"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

              {/* Empty State */}
        {campaigns.length === 0 && (
          <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay campañas</h3>
                  <p className="text-gray-500 mb-4">Crea tu primera campaña para comenzar</p>
            <button
              onClick={createCampaign}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
                    + Nueva Campaña
            </button>
          </div>
        )}
      </div>
          </div>
        </>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">Editar Notas de Campaña</h3>
            <textarea
              className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe tus notas aquí..."
              defaultValue={showNotesModal.notes}
              id="notes-textarea"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNotesModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
                  handleNotesUpdate(textarea.value);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches Modal */}
      {showSearchesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Búsquedas Guardadas</h3>
            {showSearchesModal.searches.length > 0 ? (
              <div className="space-y-4">
                {showSearchesModal.searches.map((search) => (
                  <div key={search.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{search.query}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(search.timestamp).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Marca: {search.brandName}</span>
                      <span>{search.resultsCount} resultados</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                <p className="text-gray-500">No hay búsquedas guardadas para esta campaña</p>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSearchesModal(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Influencers Modal */}
      {showInfluencersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[80vh] flex flex-col">
            {/* Sticky Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200 bg-white rounded-t-lg">
              <h3 className="text-lg font-semibold">Influencers Guardados</h3>
              <button
                onClick={() => setShowInfluencersModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                title="Cerrar"
              >
                ×
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 pt-4 overflow-y-auto flex-1">
            {showInfluencersModal.influencers.length > 0 ? (
              <div className="space-y-4">
                {showInfluencersModal.influencers.map((savedInfluencer) => (
                  <div key={savedInfluencer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {savedInfluencer.influencerData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{savedInfluencer.influencerData.name}</h4>
                          <p className="text-sm text-gray-600">@{savedInfluencer.influencerData.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-sm text-gray-500">
                          Guardado: {new Date(savedInfluencer.savedAt).toLocaleDateString('es-ES')}
                        </span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            savedInfluencer.status === 'saved' ? 'bg-blue-100 text-blue-800' :
                            savedInfluencer.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                            savedInfluencer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            savedInfluencer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {savedInfluencer.status}
                          </span>
                        </div>
                        </div>
                        <button
                          onClick={() => {
                            removeInfluencerFromCampaign(showInfluencersModal.campaignId, savedInfluencer.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar influencer de la campaña"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {(savedInfluencer.influencerData.followers || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Seguidores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {((savedInfluencer.influencerData.engagementRate || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {savedInfluencer.influencerData.platform}
                        </div>
                        <div className="text-xs text-gray-500">Plataforma</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          €{(savedInfluencer.influencerData.estimatedCost || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Coste Estimado</div>
                      </div>
                    </div>

                    {savedInfluencer.influencerData.location && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">📍 {savedInfluencer.influencerData.location}</span>
                      </div>
                    )}

                    {savedInfluencer.influencerData.niche && savedInfluencer.influencerData.niche.length > 0 && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {savedInfluencer.influencerData.niche.map((niche, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {niche}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {savedInfluencer.tags && savedInfluencer.tags.length > 0 && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {savedInfluencer.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {savedInfluencer.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{savedInfluencer.notes}</p>
                      </div>
                    )}

                    <div className="mt-3 flex space-x-2">
                      <a
                        href={`https://instagram.com/${savedInfluencer.influencerData.handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
                      >
                        📸 Ver Perfil
                      </a>
                      <button className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                        📧 Contactar
                      </button>
                      <button
                        onClick={() => {
                          removeInfluencerFromCampaign(showInfluencersModal.campaignId, savedInfluencer.id);
                        }}
                        className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1 border border-red-700 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👥</div>
                <p className="text-gray-500">No hay influencers guardados para esta campaña</p>
                <p className="text-gray-400 text-sm mt-2">
                  Los influencers aparecerán aquí cuando los guardes desde los resultados de búsqueda
                </p>
              </div>
            )}
            </div>
            
            {/* Sticky Footer */}
            <div className="p-6 pt-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {showInfluencersModal.influencers.length > 0 && (
                    <span>Total: {showInfluencersModal.influencers.length} influencer{showInfluencersModal.influencers.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  {showInfluencersModal.influencers.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de que quieres eliminar TODOS los ${showInfluencersModal.influencers.length} influencers de esta campaña?`)) {
                          updateCampaign(showInfluencersModal.campaignId, 'savedInfluencers', []);
                          setShowInfluencersModal({
                            campaignId: showInfluencersModal.campaignId,
                            influencers: []
                          });
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      🗑️ Eliminar Todos
                    </button>
                  )}
                <button
                  onClick={() => setShowInfluencersModal(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 