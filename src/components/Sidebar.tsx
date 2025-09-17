import React, { useState, useEffect } from 'react';
import { X, Menu, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export type PageView = 'search' | 'generate' | 'notes' | 'campaigns' | 'analytics' | 'compatibility';

interface SidebarProps {
  currentView: PageView;
  onViewChange: (view: PageView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasSearchData, setHasSearchData] = useState(false);
  const { t } = useLanguage();

  // Check if we have search data for analytics/compatibility
  useEffect(() => {
    const checkSearchData = () => {
      try {
        const searchData = localStorage.getItem('recentSearchResults');
        setHasSearchData(!!searchData && JSON.parse(searchData).length > 0);
      } catch {
        setHasSearchData(false);
      }
    };
    
    checkSearchData();
    
    // Check periodically for updates
    const interval = setInterval(checkSearchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      id: 'search' as PageView,
      label: t('nav.search'),
      shortLabel: t('nav.search'),
      icon: '🔍',
      description: t('nav.search.desc'),
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700'
    },
    {
      id: 'generate' as PageView,
      label: t('nav.generate'),
      shortLabel: t('nav.generate'),
      icon: '📄',
      description: t('nav.generate.desc'),
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700'
    },
    {
      id: 'campaigns' as PageView,
      label: t('nav.campaigns'),
      shortLabel: t('nav.campaigns'),
      icon: '🎯',
      description: t('nav.campaigns.desc'),
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'from-green-600 to-green-700'
    },
    {
      id: 'notes' as PageView,
      label: t('nav.notes'),
      shortLabel: t('nav.notes'),
      icon: '📝',
      description: t('nav.notes.desc'),
      gradient: 'from-orange-500 to-orange-600',
      hoverGradient: 'from-orange-600 to-orange-700'
    },
    {
      id: 'analytics' as PageView,
      label: 'Analytics',
      shortLabel: 'Analytics',
      icon: '📊',
      description: 'Audience insights and performance analytics',
      gradient: 'from-indigo-500 to-indigo-600',
      hoverGradient: 'from-indigo-600 to-indigo-700',
      hasData: hasSearchData
    },
    {
      id: 'compatibility' as PageView,
      label: 'Brand Compatibility',
      shortLabel: 'Compatibility',
      icon: '🎯',
      description: 'AI-powered brand-influencer matching',
      gradient: 'from-pink-500 to-rose-600',
      hoverGradient: 'from-pink-600 to-rose-700',
      hasData: hasSearchData
    }
  ];

  const handleMenuItemClick = (viewId: PageView) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <>
      {/* Enhanced Mobile Header with Hamburger Menu */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 p-4 flex items-center justify-between relative z-50 sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-lg">🚀</span>
          </div>
          <div>
          <h1 className="text-lg font-bold text-gray-900">LAY-AI</h1>
          </div>
        </div>
        
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-gray-100/80 backdrop-blur-sm hover:bg-gray-200/80 transition-all duration-200 transform hover:scale-105 active:scale-95"
          aria-label="Toggle menu"
        >
            {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
            ) : (
            <Menu className="w-6 h-6 text-gray-600" />
            )}
        </button>
      </div>

      {/* Enhanced Mobile Slide-out Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
            {/* Enhanced Mobile Menu Header */}
            <div className="relative p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">LAY-AI</h1>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
              </div>
            </div>

            {/* Enhanced Mobile Menu Items */}
            <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                        isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-[1.02]`
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01]'
                      }`}
                    >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-white/20 backdrop-blur-sm' 
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                        <span className="text-lg">{item.icon}</span>
                        </div>
                        <div>
                          <h3 className={`font-semibold transition-colors duration-300 ${
                            isActive ? 'text-white' : 'text-gray-900 group-hover:text-gray-800'
                          }`}>
                            {item.shortLabel}
                          </h3>
                        </div>
                      </div>
                      
                      <ChevronRight className={`w-5 h-5 transition-all duration-300 ${
                        isActive ? 'text-white/70' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    </div>
                    
                    {/* Hover effect background */}
                    {!isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}></div>
                    )}
                    </button>
                  );
                })}
            </nav>

            {/* Mobile Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  {t('main.version')}
                </p>
                <div className="flex justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-gray-500">{t('main.status')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden lg:flex w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-gray-200/50 flex-col min-h-screen">
        {/* Enhanced Header */}
        <div className="relative p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
            <span className="text-2xl">🚀</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">LAY-AI</h1>
          </div>
        </div>
            
        </div>
      </div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 p-6 space-y-3">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-[1.02]`
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01]'
                }`}
                aria-label={`Go to ${item.label}`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                      <span className="text-xl">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                      <h3 className={`font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-900 group-hover:text-gray-800'
                    }`}>
                      {item.label}
                    </h3>
                  </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                    <ChevronRight className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'text-white/70' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  </div>
                </div>
                
                {/* Hover effect background */}
                {!isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}></div>
                )}
              </button>
            );
          })}
      </nav>

        {/* Enhanced Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              {t('main.version')}
            </p>
            <div className="flex justify-center items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-500">{t('main.status')}</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar; 