'use client';

import React, { useState } from 'react';
import { MessageSquare, Sliders, Sparkles, Info, Search, Zap } from 'lucide-react';
import { Chatbot } from './Chatbot';
import { DropdownSearch } from './DropdownSearch';
import { useLanguage } from '@/lib/languageContext';

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
  const { t } = useLanguage();
  const [activeMode, setActiveMode] = useState<SearchMode>('chat');

  const handleDropdownSearch = async (searchParams: any) => {
    // Convert dropdown search params to structured search format
    const structuredQuery = `STRUCTURED_SEARCH:${JSON.stringify(searchParams)}`;
    return await onSendMessage(structuredQuery, []);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
      {/* Enhanced Header with Animated Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b border-gray-200/50">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="relative px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Compact Hero Section */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-md mb-3 animate-pulse-glow">
              <span className="text-xl sm:text-2xl">🤖</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-2">
              {t('ai.assistant.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              {t('ai.assistant.subtitle')}
            </p>
          </div>

          {/* Compact Tab Navigation */}
          <div className="flex justify-center mb-3">
            <div className="flex bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-md border border-gray-200/50 w-full max-w-sm">
              <button
                onClick={() => setActiveMode('chat')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeMode === 'chat'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                aria-label="Change to Chat IA mode"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Chat IA</span>
                <span className="sm:hidden">IA</span>
                {activeMode === 'chat' && (
                  <Sparkles className="ml-2 h-3 w-3 animate-pulse" />
                )}
              </button>
              
              <button
                onClick={() => setActiveMode('dropdown')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeMode === 'dropdown'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                aria-label="Change to Filters mode"
              >
                <Sliders className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filters</span>
                {activeMode === 'dropdown' && (
                  <Sparkles className="ml-2 h-3 w-3 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Compact Mode Description */}
          <div className="text-center">
            <div className="inline-flex items-center bg-white/70 backdrop-blur-sm rounded-md px-3 py-1 shadow-sm border border-gray-200/50">
              <Info className="h-3 w-3 mr-2 text-gray-500" />
            {activeMode === 'chat' ? (
                <p className="text-xs text-gray-600">
                💬 Search with natural language, upload PDFs, and verify collaborations
              </p>
            ) : (
                <p className="text-xs text-gray-600">
                  🎯 Structured search with specific filters
              </p>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search Interface Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="transition-all duration-500 ease-in-out">
        {activeMode === 'chat' ? (
            <div className="space-y-6">
              {/* Enhanced Chat Interface Help */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3">{t('search.chat.functions')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-blue-700">
                      <div className="flex items-start space-x-2">
                        <Search className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>{t('search.natural.search')}</strong> {t('search.natural.example')}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>{t('search.pdf.analysis')}</strong> {t('search.pdf.example')}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>{t('search.verification')}</strong> {t('search.verification.example')}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>{t('search.refinement')}</strong> {t('search.refinement.example')}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
            
            <Chatbot 
              onSendMessage={onSendMessage}
              onPDFAnalyzed={onPDFAnalyzed}
            />
          </div>
        ) : (
            <div className="space-y-6">
              {/* Enhanced Dropdown Interface Help */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sliders className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-purple-800 mb-3">🎯 Search with Filters:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-purple-700">
                      <div className="flex items-start space-x-2">
                        <Search className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Automatic Research:</strong> Write a brand and it will be researched automatically
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Sliders className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Precise Filters:</strong> Gender, age, location, niches, platforms
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Customizable Ranges:</strong> Followers, engagement, and more
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Instant Results:</strong> Structured and quick search
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            <DropdownSearch 
              onSearch={handleDropdownSearch}
              isLoading={isLoading}
            />
          </div>
        )}
        </div>
      </div>

      {/* Enhanced Features Comparison Footer */}
      <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
          <div className="flex items-start space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div>
              <span className="font-semibold text-blue-700">Chat IA:</span> Ideal for complex searches, PDF analysis, collaboration verification, and natural language queries.
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sliders className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div>
              <span className="font-semibold text-purple-700">Filters:</span> Perfect for quick and precise searches with specific criteria and automatic brand research.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 