'use client';

import React, { useState, useEffect } from 'react';
import { SplashCursor } from '@/components/ui/splash-cursor';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent } from '@/components/ui/enhanced-card';
import SmartTooltip from '@/components/ui/smart-tooltip';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    // Trigger animations in sequence
    const timer1 = setTimeout(() => setIsVisible(true), 1000);
    const timer2 = setTimeout(() => setShowFeatures(true), 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Cycle through features for demonstration
  useEffect(() => {
    if (showFeatures) {
      const interval = setInterval(() => {
        setCurrentFeature(prev => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showFeatures]);

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Discovery',
      description: 'Find perfect influencers using advanced AI algorithms',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: '⚡',
      title: 'Real-time Analytics',
      description: 'Get instant insights and performance metrics',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: '🎯',
      title: 'Smart Matching',
      description: 'Connect with influencers that align with your brand',
      color: 'from-pink-500 to-red-600'
    }
  ];

  const trustSignals = [
    { metric: '10K+', label: 'Influencers Matched' },
    { metric: '500+', label: 'Successful Campaigns' },
    { metric: '98%', label: 'Client Satisfaction' },
    { metric: '24/7', label: 'AI Support' }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Enhanced Fluid Animation Background */}
      <SplashCursor />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-6xl">
        
        {/* Hero Section */}
        <div className="mb-12">
          {/* Main Title */}
          <h1 
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-none transition-all duration-[4000ms] ease-in-out text-white mb-6',
              isVisible 
                ? 'opacity-100 transform translate-y-0 scale-100' 
                : 'opacity-0 transform translate-y-16 scale-95'
            )}
            style={{
              fontFamily: '"Edu VIC WA NT Hand", "Dancing Script", "Brush Script MT", cursive',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.1))'
            }}
          >
            Buenas Clara
          </h1>

          {/* Subtitle with modern styling */}
          <div 
            className={cn(
              'transition-all duration-[2000ms] delay-[2000ms] ease-in-out',
              isVisible 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-8'
            )}
          >
            <p className="text-lg md:text-xl text-white/90 mb-4 font-medium">
              AI-Powered Influencer Discovery Platform
            </p>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              Transform your brand campaigns with intelligent influencer matching, 
              real-time analytics, and data-driven insights
            </p>
          </div>
        </div>

        {/* Trust Signals */}
        {showFeatures && (
          <div className="mb-8 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {trustSignals.map((signal, index) => (
                <Card 
                  key={index}
                  variant="glass" 
                  padding="sm"
                  className={cn(
                    'text-center transition-all duration-500',
                    'hover:scale-105 animate-float'
                  )}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold text-white mb-1">
                      {signal.metric}
                    </div>
                    <div className="text-xs text-white/70">
                      {signal.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Feature Showcase - Rotating */}
        {showFeatures && (
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Card variant="glass" className="max-w-md mx-auto backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl',
                    'bg-gradient-to-br transition-all duration-1000',
                    features[currentFeature].color
                  )}>
                    {features[currentFeature].icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {features[currentFeature].title}
                </h3>
                <p className="text-white/70 text-sm">
                  {features[currentFeature].description}
                </p>
                
                {/* Feature indicators */}
                <div className="flex justify-center mt-4 gap-2">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all duration-300',
                        index === currentFeature 
                          ? 'bg-white scale-125' 
                          : 'bg-white/30'
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Call to Action */}
        <div 
          className={cn(
            'transition-all duration-[2000ms] delay-[3000ms] ease-in-out flex flex-col items-center',
            isVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-8'
          )}
        >
          {/* Primary CTA */}
          <SmartTooltip 
            content="Start discovering perfect influencers for your brand in seconds"
            position="top"
            helpType="success"
          >
            <Button 
              onClick={onGetStarted}
              variant="gradient"
              size="xl"
              className="mb-4 floating-action animate-pulse-glow"
              leftIcon="🚀"
            >
              Start Free Discovery
            </Button>
          </SmartTooltip>

          {/* Secondary messaging */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Setup in 60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>AI-powered matching</span>
            </div>
          </div>

          {/* Social proof snippet */}
          {showFeatures && (
            <div className="mt-6 animate-slide-up" style={{ animationDelay: '1s' }}>
              <p className="text-white/50 text-xs mb-2">Trusted by leading brands worldwide</p>
              <div className="flex items-center justify-center gap-4 opacity-60">
                {/* Placeholder brand logos - replace with actual logos */}
                <div className="w-8 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
                <div className="w-8 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
                <div className="w-8 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
                <div className="w-8 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white/15 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-white/15 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-white/25 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 right-1/6 w-2 h-2 bg-white/15 rounded-full animate-float" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Additional ambient elements */}
        <div className="absolute top-20 left-20 w-1 h-1 bg-blue-300/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-purple-300/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-40 w-1 h-1 bg-pink-300/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Bottom gradient overlay for better text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default LandingPage; 