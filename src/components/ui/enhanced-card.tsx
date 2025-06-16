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