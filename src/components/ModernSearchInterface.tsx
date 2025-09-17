'use client';

import React, { useState } from 'react';
import { MessageSquare, Sliders, Sparkles, Info, Search, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Chatbot } from './Chatbot';
import { DropdownSearch } from './DropdownSearch';
import { useLanguage } from '@/lib/languageContext';

interface ModernSearchInterfaceProps {
  onSendMessage: (message: string, history: any[]) => Promise<any>;
  onPDFAnalyzed: (context: any) => void;
  isLoading?: boolean;
}

type SearchMode = 'chat' | 'dropdown';

export const ModernSearchInterface: React.FC<ModernSearchInterfaceProps> = ({ 
  onSendMessage, 
  onPDFAnalyzed, 
  isLoading = false 
}) => {
  const { t } = useLanguage();
  const [activeMode, setActiveMode] = useState<SearchMode>('chat');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleDropdownSearch = async (searchParams: any) => {
    const structuredQuery = `STRUCTURED_SEARCH:${JSON.stringify(searchParams)}`;
    return await onSendMessage(structuredQuery, []);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Compact Header - Just Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200/50">
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeMode === 'chat'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat IA
            {activeMode === 'chat' && <Sparkles className="ml-2 h-3 w-3" />}
          </button>
          
          <button
            onClick={() => setActiveMode('dropdown')}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeMode === 'dropdown'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Sliders className="mr-2 h-4 w-4" />
            Filtros
            {activeMode === 'dropdown' && <Sparkles className="ml-2 h-3 w-3" />}
          </button>
        </div>

        {/* Advanced Options Toggle - Smaller */}
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-lg px-3 py-2 border border-gray-200/50"
        >
          <Info className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Opciones avanzadas</span>
          <span className="sm:hidden">Info</span>
          {showAdvancedOptions ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </button>
      </div>

      {/* Collapsible Advanced Options */}
      {showAdvancedOptions && (
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 mb-6 border border-blue-200/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                Chat IA
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Búsqueda con lenguaje natural</div>
                <div>• Análisis de PDFs automático</div>
                <div>• Verificación de colaboraciones</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Sliders className="h-4 w-4 mr-2 text-purple-600" />
                Filtros
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Filtros precisos por criterios</div>
                <div>• Investigación automática de marcas</div>
                <div>• Resultados instantáneos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Full Width */}
      <div className="w-full max-w-6xl mx-auto">
        {/* Primary Search Interface - Full Width */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/40 overflow-hidden">
          {/* Clean Interface Header */}
          <div className="px-6 py-4 bg-gray-50/30 border-b border-gray-200/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {activeMode === 'chat' ? (
                  <>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Asistente de IA</h3>
                      <p className="text-xs text-gray-600">Encuentra influencers con lenguaje natural</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sliders className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Filtros Avanzados</h3>
                      <p className="text-xs text-gray-600">Búsqueda con criterios específicos</p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">En línea</span>
              </div>
            </div>
          </div>

          {/* Interface Content */}
          <div className="h-full">
            {activeMode === 'chat' ? (
              <Chatbot 
                onSendMessage={onSendMessage}
                onPDFAnalyzed={onPDFAnalyzed}
              />
            ) : (
              <div className="p-6">
                <DropdownSearch 
                  onSearch={handleDropdownSearch}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
