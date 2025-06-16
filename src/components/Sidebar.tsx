import React from 'react';

export type PageView = 'search' | 'generate' | 'notes';

interface SidebarProps {
  currentView: PageView;
  onViewChange: (view: PageView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    {
      id: 'search' as PageView,
      label: 'Influencer Search',
      icon: '🔍',
      description: 'Find and discover influencers',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'generate' as PageView,
      label: 'Generate Proposal',
      icon: '📄',
      description: 'Create campaign proposals',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'notes' as PageView,
      label: 'Notes',
      icon: '📝',
      description: 'Manage your notes',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col min-h-screen">
      {/* Header */}
      <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl">🚀</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">LAYAI</h1>
            <p className="text-gray-300 text-sm">Influencer Marketing Platform</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <p className="text-white/90 text-sm leading-relaxed">
            Discover, analyze, and collaborate with top influencers to create impactful campaigns.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-3">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-[1.02]`
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-gray-900 group-hover:text-gray-800'
                    }`}>
                      {item.label}
                    </h3>
                    <p className={`text-sm transition-colors duration-200 ${
                      isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {/* Hover effect background */}
                {!isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-xl`}></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button 
                onClick={() => onViewChange('search')}
                className="w-full text-left text-sm text-gray-600 hover:text-blue-600 transition-colors py-1"
              >
                → Start new search
              </button>
              <button 
                onClick={() => onViewChange('generate')}
                className="w-full text-left text-sm text-gray-600 hover:text-purple-600 transition-colors py-1"
              >
                → Create proposal
              </button>
              <button 
                onClick={() => onViewChange('notes')}
                className="w-full text-left text-sm text-gray-600 hover:text-orange-600 transition-colors py-1"
              >
                → Take notes
              </button>
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Version 2.3.0 • Built with ❤️
            </p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 