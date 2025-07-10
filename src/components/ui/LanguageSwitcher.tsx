'use client';

import React, { useState } from 'react';
import { useLanguage, Language } from '@/lib/languageContext';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  variant?: 'compact' | 'full';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  position = 'top-right', 
  variant = 'compact',
  className = ''
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en' as Language, name: t('language.english'), flag: '🇺🇸' },
    { code: 'es' as Language, name: t('language.spanish'), flag: '🇪🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (variant === 'compact') {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm hover:bg-white/95 border border-gray-200/50 rounded-xl px-3 py-2 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
            title={t('language.switch')}
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {currentLanguage?.code.toUpperCase()}
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown */}
              <div className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl min-w-[160px] z-50">
                <div className="p-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                        language === lang.code 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                      {language === lang.code && (
                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full variant for sidebar integration
  return (
    <div className={`${className}`}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            <Globe className="w-4 h-4 text-white/70" />
            <span className="text-sm font-medium text-white/90">
              {t('language.switch')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentLanguage?.flag}</span>
            <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl z-50">
              <div className="p-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                      language === lang.code 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher; 