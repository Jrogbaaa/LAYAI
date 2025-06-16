'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon, 
    rightIcon, 
    tooltip,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring relative overflow-hidden group';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300',
      ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      glass: 'glass-button text-gray-700',
      gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-3 text-base rounded-lg gap-2',
      xl: 'px-8 py-4 text-lg rounded-xl gap-3'
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return;
      
      // Add ripple effect
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.4s ease-out;
        pointer-events: none;
      `;
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
      
      props.onClick?.(e);
    };

    return (
      <div className="relative group">
        <button
          ref={ref}
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            (isLoading || disabled) && 'opacity-60 cursor-not-allowed',
            className
          )}
          disabled={isLoading || disabled}
          onClick={handleClick}
          {...props}
        >
          {/* Loading spinner */}
          {isLoading && (
            <div className="spinner mr-2" />
          )}
          
          {/* Left icon */}
          {leftIcon && !isLoading && (
            <span className="flex-shrink-0">{leftIcon}</span>
          )}
          
          {/* Button content */}
          <span className="relative z-10">{children}</span>
          
          {/* Right icon */}
          {rightIcon && (
            <span className="flex-shrink-0">{rightIcon}</span>
          )}
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-inherit" />
        </button>
        
        {/* Tooltip */}
        {tooltip && (
          <div className="tooltip bottom-full left-1/2 transform -translate-x-1/2 mb-2">
            {tooltip}
          </div>
        )}
      </div>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// Add ripple animation to global styles if not already present
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      from {
        transform: scale(0);
        opacity: 1;
      }
      to {
        transform: scale(1);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
} 