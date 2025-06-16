'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SmartTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus' | 'auto';
  delay?: number;
  className?: string;
  showArrow?: boolean;
  maxWidth?: string;
  contextual?: boolean; // For AI-driven contextual tips
  helpType?: 'info' | 'tutorial' | 'warning' | 'success';
}

const SmartTooltip: React.FC<SmartTooltipProps> = ({
  children,
  content,
  position = 'top',
  trigger = 'hover',
  delay = 200,
  className,
  showArrow = true,
  maxWidth = '320px',
  contextual = false,
  helpType = 'info'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-900'
  };

  const helpTypeStyles = {
    info: 'bg-gray-900 text-white',
    tutorial: 'bg-blue-600 text-white',
    warning: 'bg-amber-600 text-white',
    success: 'bg-green-600 text-white'
  };

  const helpTypeIcons = {
    info: '💡',
    tutorial: '🎯',
    warning: '⚠️',
    success: '✅'
  };

  const handleShow = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      checkPosition();
    }, trigger === 'hover' ? delay : 0);
  };

  const handleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, trigger === 'hover' ? 100 : 0);
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
      if (!isVisible) {
        checkPosition();
      }
    }
  };

  const checkPosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip goes outside viewport and adjust position
    switch (position) {
      case 'top':
        if (triggerRect.top - tooltipRect.height < 0) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (triggerRect.bottom + tooltipRect.height > viewport.height) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (triggerRect.left - tooltipRect.width < 0) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (triggerRect.right + tooltipRect.width > viewport.width) {
          newPosition = 'left';
        }
        break;
    }

    setActualPosition(newPosition);
  };

  // Auto-trigger for contextual tooltips
  useEffect(() => {
    if (contextual && trigger === 'auto') {
      const timer = setTimeout(() => {
        handleShow();
      }, 2000); // Show after 2 seconds for contextual help

      return () => clearTimeout(timer);
    }
  }, [contextual, trigger]);

  // Handle outside clicks for click-triggered tooltips
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (trigger === 'click' && isVisible && 
          tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [trigger, isVisible]);

  const triggerProps: any = {};
  
  if (trigger === 'hover') {
    triggerProps.onMouseEnter = handleShow;
    triggerProps.onMouseLeave = handleHide;
  } else if (trigger === 'click') {
    triggerProps.onClick = handleClick;
  } else if (trigger === 'focus') {
    triggerProps.onFocus = handleShow;
    triggerProps.onBlur = handleHide;
  }

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div {...triggerProps}>
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-sm font-medium rounded-lg shadow-lg transition-all duration-200 animate-scale-in',
            positionClasses[actualPosition],
            helpTypeStyles[helpType],
            className
          )}
          style={{ maxWidth }}
        >
          {/* Contextual help header */}
          {contextual && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
              <span>{helpTypeIcons[helpType]}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">
                Smart Tip
              </span>
            </div>
          )}
          
          {/* Content */}
          <div className="relative z-10">
            {content}
          </div>
          
          {/* Arrow */}
          {showArrow && (
            <div 
              className={cn('absolute w-0 h-0', arrowClasses[actualPosition])}
              style={{ zIndex: -1 }}
            />
          )}
          
          {/* Close button for contextual tooltips */}
          {contextual && (
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded text-xs"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Contextual Help Hook for AI-driven assistance
export const useContextualHelp = (feature: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner') => {
  const [shouldShowHelp, setShouldShowHelp] = useState(false);
  const [helpContent, setHelpContent] = useState<string>('');

  const contextualTips: Record<string, Record<string, string>> = {
    'campaign-creation': {
      beginner: "💡 Tip: Start by defining your target audience and campaign goals. This helps the AI find better matches!",
      intermediate: "🎯 Pro tip: Use specific keywords and demographics for more precise influencer matching.",
      advanced: "⚡ Advanced: Consider seasonal trends and competitor analysis when setting your campaign parameters."
    },
    'influencer-selection': {
      beginner: "🌟 New to influencer marketing? Look for engagement rates over follower counts for better results.",
      intermediate: "📊 Check the influencer's audience demographics to ensure alignment with your target market.",
      advanced: "🔍 Analyze past campaign performance and content authenticity before making selections."
    },
    'proposal-generation': {
      beginner: "📝 First proposal? Use our templates and let AI guide you through the process step by step.",
      intermediate: "💼 Customize proposals based on influencer tier and audience size for better acceptance rates.",
      advanced: "🚀 Leverage data insights to create compelling value propositions and performance metrics."
    }
  };

  useEffect(() => {
    const tips = contextualTips[feature];
    if (tips && tips[userLevel]) {
      setHelpContent(tips[userLevel]);
      setShouldShowHelp(true);
    }
  }, [feature, userLevel]);

  return { shouldShowHelp, helpContent, setShouldShowHelp };
};

export default SmartTooltip; 