'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'interactive' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, glow = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl border transition-all duration-200';
    
    const variants = {
      default: 'bg-white border-gray-200 shadow-sm hover:shadow-md',
      glass: 'glass-card',
      elevated: 'bg-white border-gray-200 shadow-lg hover:shadow-xl',
      interactive: 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer',
      gradient: 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg'
    };
    
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hover && 'hover:scale-[1.02]',
          glow && 'animate-pulse-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, icon, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between mb-4', className)}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg text-blue-600">
              {icon}
            </div>
          )}
          <div className="flex-1">{children}</div>
        </div>
        {action && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-gray-600', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = 'start', children, ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-4 pt-4 border-t border-gray-100',
          justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

// Progress Card for loading states
export interface ProgressCardProps extends CardProps {
  progress?: number;
  title?: string;
  description?: string;
}

const ProgressCard = React.forwardRef<HTMLDivElement, ProgressCardProps>(
  ({ className, progress = 0, title, description, ...props }, ref) => {
    return (
      <Card ref={ref} variant="glass" className={cn('overflow-hidden', className)} {...props}>
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gray-200 rounded-t-xl">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          
          <div className="pt-3">
            {title && (
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">Progress</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
ProgressCard.displayName = 'ProgressCard';

export { Card, CardHeader, CardContent, CardFooter, ProgressCard };

interface MobileOptimizedCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  mobileCollapsible?: boolean;
  compactMode?: boolean;
}

/**
 * Mobile-first enhanced card component with responsive design
 * Optimized for touch interactions and small screens
 */
export const EnhancedCard: React.FC<MobileOptimizedCardProps> = ({
  title,
  subtitle,
  children,
  variant = 'default',
  mobileCollapsible = false,
  compactMode = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!mobileCollapsible);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getVariantStyles = () => {
    const baseStyles = "bg-white border rounded-lg shadow-sm";
    
    switch (variant) {
      case 'success':
        return `${baseStyles} border-green-200 bg-green-50`;
      case 'warning':
        return `${baseStyles} border-yellow-200 bg-yellow-50`;
      case 'info':
        return `${baseStyles} border-blue-200 bg-blue-50`;
      default:
        return `${baseStyles} border-gray-200`;
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📊';
    }
  };

  return (
    <div className={`${getVariantStyles()} transition-all duration-300 ${
      isMobile ? 'mx-2' : ''
    }`}>
      {/* Header */}
      <div
        className={`p-4 ${mobileCollapsible && isMobile ? 'cursor-pointer' : ''} ${
          compactMode ? 'p-3' : ''
        }`}
        onClick={() => {
          if (mobileCollapsible && isMobile) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getVariantIcon()}</span>
            <div>
              <h3 className={`font-semibold text-gray-900 ${
                compactMode ? 'text-sm' : isMobile ? 'text-base' : 'text-lg'
              }`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-gray-600 ${
                  compactMode ? 'text-xs' : 'text-sm'
                } ${isMobile ? 'line-clamp-1' : ''}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Mobile collapse indicator */}
          {mobileCollapsible && isMobile && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isExpanded ? 'Contraer' : 'Expandir'}
              </span>
              <div className={`transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`transition-all duration-300 overflow-hidden ${
        mobileCollapsible && !isExpanded ? 'max-h-0' : 'max-h-none'
      }`}>
        <div className={`${compactMode ? 'px-3 pb-3' : 'px-4 pb-4'} ${
          isMobile ? 'text-sm' : ''
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile-optimized metrics grid component
 */
interface MobileMetricsGridProps {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: number;
    icon?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }>;
  columns?: 2 | 3 | 4;
}

export const MobileMetricsGrid: React.FC<MobileMetricsGridProps> = ({
  metrics,
  columns = 2
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getColorStyles = (color: string = 'blue') => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      red: 'text-red-600 bg-red-50',
      purple: 'text-purple-600 bg-purple-50'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const mobileColumns = isMobile ? Math.min(columns, 2) : columns;

  return (
    <div className={`grid gap-3 ${
      mobileColumns === 2 ? 'grid-cols-2' :
      mobileColumns === 3 ? 'grid-cols-3' : 'grid-cols-4'
    }`}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border border-gray-100 ${getColorStyles(metric.color)} ${
            isMobile ? 'text-center' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            {metric.icon && <span className="text-sm">{metric.icon}</span>}
            <div className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
              {metric.value}
            </div>
          </div>
          <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} leading-tight`}>
            {metric.label}
          </div>
          {metric.change !== undefined && (
            <div className={`mt-1 text-xs flex items-center justify-center gap-1 ${
              metric.change > 0 ? 'text-green-600' : 
              metric.change < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              <span>{metric.change > 0 ? '↗' : metric.change < 0 ? '↘' : '→'}</span>
              <span>{Math.abs(metric.change)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Mobile-optimized progress bar component
 */
interface MobileProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'small' | 'medium' | 'large';
}

export const MobileProgressBar: React.FC<MobileProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'medium'
}) => {
  const getColorStyles = () => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };
    return colors[color];
  };

  const getSizeStyles = () => {
    const sizes = {
      small: 'h-1',
      medium: 'h-2',
      large: 'h-3'
    };
    return sizes[size];
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${getSizeStyles()}`}>
        <div
          className={`${getSizeStyles()} rounded-full transition-all duration-500 ease-out ${getColorStyles()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Mobile-optimized toast notification component
 */
interface MobileToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const MobileToast: React.FC<MobileToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    const styles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    };
    return styles[type];
  };

  const getTypeIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type];
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`rounded-lg px-4 py-3 shadow-lg ${getTypeStyles()}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{getTypeIcon()}</span>
          <span className="flex-1 text-sm font-medium">{message}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Export all components
export default {
  EnhancedCard,
  MobileMetricsGrid,
  MobileProgressBar,
  MobileToast
}; 