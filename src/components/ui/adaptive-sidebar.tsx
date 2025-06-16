'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './enhanced-button';
import SmartTooltip, { useContextualHelp } from './smart-tooltip';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  count?: number;
  isNew?: boolean;
  disabled?: boolean;
  tooltip?: string;
  subItems?: SidebarItem[];
}

export interface AdaptiveSidebarProps {
  items: SidebarItem[];
  currentView: string;
  onNavigate: (viewId: string) => void;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  onToggle?: (collapsed: boolean) => void;
  className?: string;
}

const AdaptiveSidebar: React.FC<AdaptiveSidebarProps> = ({
  items,
  currentView,
  onNavigate,
  userLevel = 'beginner',
  onToggle,
  className
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});

  // Track feature usage for personalization
  const handleNavigation = (viewId: string) => {
    // Update usage stats
    setUsage(prev => ({
      ...prev,
      [viewId]: (prev[viewId] || 0) + 1
    }));

    // Update recent items
    setRecentItems(prev => {
      const filtered = prev.filter(id => id !== viewId);
      return [viewId, ...filtered].slice(0, 3);
    });

    onNavigate(viewId);
  };

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  // Sort items by usage for adaptive layout
  const adaptiveItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const aUsage = usage[a.id] || 0;
      const bUsage = usage[b.id] || 0;
      return bUsage - aUsage; // Most used first
    });
  }, [items, usage]);

  // Get contextual help for navigation
  const { shouldShowHelp, helpContent } = useContextualHelp('navigation', userLevel);

  return (
    <div className={cn(
      'flex flex-col glass-card border-r transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 font-space-grotesk">LayAI</h1>
              <p className="text-xs text-gray-500">AI-Powered Discovery</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="p-2"
          tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className={cn('transition-transform duration-200', collapsed && 'rotate-180')}>
            ←
          </span>
        </Button>
      </div>

      {/* Quick Actions for Frequent Users */}
      {!collapsed && recentItems.length > 0 && userLevel !== 'beginner' && (
        <div className="p-4 border-b border-white/20">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent
          </h3>
          <div className="space-y-1">
            {recentItems.slice(0, 2).map(itemId => {
              const item = items.find(i => i.id === itemId);
              if (!item) return null;
              
              return (
                <button
                  key={itemId}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigation(itemId);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {adaptiveItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={currentView === item.id}
              collapsed={collapsed}
              userLevel={userLevel}
              usageCount={usage[item.id] || 0}
              onClick={() => handleNavigation(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Contextual Help */}
      {shouldShowHelp && !collapsed && (
        <div className="p-4 border-t border-white/20">
          <SmartTooltip
            content={helpContent}
            trigger="auto"
            contextual
            helpType="tutorial"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <span>🎯</span>
                <span className="text-sm font-medium">Quick Tip</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Click for navigation tips
              </p>
            </div>
          </SmartTooltip>
        </div>
      )}

      {/* User Level Indicator (for advanced users) */}
      {!collapsed && userLevel === 'advanced' && (
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Advanced Mode</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        {!collapsed ? (
          <div className="text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Version 2.0.0</span>
              <span className="text-green-500">●</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Navigation Item Component
interface NavigationItemProps {
  item: SidebarItem;
  isActive: boolean;
  collapsed: boolean;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  usageCount: number;
  onClick: () => void;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isActive,
  collapsed,
  userLevel,
  usageCount,
  onClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const showUsageBadge = userLevel === 'advanced' && usageCount > 5;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.disabled) {
      onClick();
    }
  };

  const buttonContent = (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      type="button"
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
        isActive 
          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
        item.disabled && 'opacity-50 cursor-not-allowed',
        collapsed && 'justify-center px-2'
      )}
    >
      <div className="flex-shrink-0 text-lg">
        {item.icon}
      </div>
      
      {!collapsed && (
        <>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.label}</span>
              {item.isNew && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  New
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {item.count !== undefined && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {item.count}
              </span>
            )}
            {showUsageBadge && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
            {hasSubItems && (
              <span className={cn('text-gray-400 transition-transform', isExpanded && 'rotate-90')}>
                ▶
              </span>
            )}
          </div>
        </>
      )}
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l-full" />
      )}
    </button>
  );

  if (collapsed && item.tooltip) {
    return (
      <SmartTooltip content={item.tooltip} position="right">
        {buttonContent}
      </SmartTooltip>
    );
  }

  return (
    <div>
      {buttonContent}
      
      {/* Sub-items */}
      {hasSubItems && isExpanded && !collapsed && (
        <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-3">
          {item.subItems!.map(subItem => (
            <NavigationItem
              key={subItem.id}
              item={subItem}
              isActive={false}
              collapsed={false}
              userLevel={userLevel}
              usageCount={0}
              onClick={() => onClick()}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdaptiveSidebar; 