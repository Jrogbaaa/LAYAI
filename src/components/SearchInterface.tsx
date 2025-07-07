'use client';

import React, { useState } from 'react';
import { MessageSquare, Sliders, Sparkles } from 'lucide-react';
import { Chatbot } from './Chatbot';
import { DropdownSearch } from './DropdownSearch';

interface SearchInterfaceProps {
  onSendMessage: (message: string, history: any[]) => Promise<any>;
  onPDFAnalyzed: (context: any) => void;
  isLoading?: boolean;
}

type SearchMode = 'chat' | 'dropdown';

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ 
  onSendMessage, 
  onPDFAnalyzed, 
  isLoading = false 
}) => {
  const [activeMode, setActiveMode] = useState<SearchMode>('chat');

  const handleDropdownSearch = async (searchParams: any) => {
    // Convert dropdown search params to structured search format
    const structuredQuery = `STRUCTURED_SEARCH:${JSON.stringify(searchParams)}`;
    return await onSendMessage(structuredQuery, []);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">🤖</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 lg:mb-3">
              Asistente de IA para Influencers
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Encuentra los creadores perfectos para tus campañas
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="flex bg-gray-100 rounded-lg p-1 w-full max-w-md">
              <button
                onClick={() => setActiveMode('chat')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeMode === 'chat'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat IA
                {activeMode === 'chat' && (
                  <Sparkles className="ml-2 h-3 w-3 text-blue-500" />
                )}
              </button>
              
              <button
                onClick={() => setActiveMode('dropdown')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeMode === 'dropdown'
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sliders className="mr-2 h-4 w-4" />
                Filtros
                {activeMode === 'dropdown' && (
                  <Sparkles className="ml-2 h-3 w-3 text-purple-500" />
                )}
              </button>
            </div>
          </div>

          {/* Mode Description */}
          <div className="mt-4 text-center">
            {activeMode === 'chat' ? (
              <p className="text-sm text-gray-600">
                💬 Busca con lenguaje natural, sube PDFs y verifica colaboraciones
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                🎯 Búsqueda estructurada con filtros específicos y investigación automática de marcas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search Interface Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {activeMode === 'chat' ? (
          <div className="space-y-4">
            {/* Chat Interface Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Funciones del Chat IA:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Búsqueda natural:</strong> "Encuentra influencers de fitness femeninos en Madrid"</p>
                <p>• <strong>Análisis PDF:</strong> Sube propuestas para búsqueda personalizada</p>
                <p>• <strong>Verificación:</strong> "¿Ha trabajado Cristiano con Nike?"</p>
                <p>• <strong>Refinamiento:</strong> Haz preguntas de seguimiento</p>
              </div>
            </div>
            
            <Chatbot 
              onSendMessage={onSendMessage}
              onPDFAnalyzed={onPDFAnalyzed}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dropdown Interface Help */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-2">🎯 Búsqueda con Filtros:</h3>
              <div className="text-xs text-purple-700 space-y-1">
                <p>• <strong>Investigación automática:</strong> Escribe una marca y se investigará automáticamente</p>
                <p>• <strong>Filtros precisos:</strong> Género, edad, ubicación, nichos, plataformas</p>
                <p>• <strong>Rangos personalizables:</strong> Seguidores, engagement, y más</p>
                <p>• <strong>Resultados instantáneos:</strong> Búsqueda estructurada y rápida</p>
              </div>
            </div>

            <DropdownSearch 
              onSearch={handleDropdownSearch}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* Features Comparison Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="flex items-start space-x-2">
            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-blue-700">Chat IA:</span> Ideal para búsquedas complejas, análisis de PDFs, verificación de colaboraciones y consultas en lenguaje natural.
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Sliders className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-purple-700">Filtros:</span> Perfecto para búsquedas rápidas y precisas con criterios específicos e investigación automática de marcas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 