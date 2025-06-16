'use client';

import React, { useState, useEffect } from 'react';
import { SplashCursor } from '@/components/ui/splash-cursor';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slow fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Fluid Animation Background */}
      <SplashCursor />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-4xl">
        {/* Animated "Buenas Clara" Text - Darker cursive */}
        <div className="mb-20">
          <h1 
            className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-none transition-all duration-[4000ms] ease-in-out text-white ${
              isVisible 
                ? 'opacity-100 transform translate-y-0 scale-100' 
                : 'opacity-0 transform translate-y-16 scale-95'
            }`}
            style={{
              fontFamily: '"Edu VIC WA NT Hand", "Dancing Script", "Brush Script MT", cursive',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.1))'
            }}
          >
            Buenas Clara
          </h1>
        </div>

        {/* Call to Action */}
        <div 
          className={`transition-all duration-[2000ms] delay-[3000ms] ease-in-out ${
            isVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-8'
          }`}
        >
          <button 
            onClick={onGetStarted}
            className="group relative px-16 py-6 bg-white/90 backdrop-blur-sm text-gray-800 font-medium text-lg rounded-full border border-white/50 hover:bg-white hover:border-white transition-all duration-500 transform hover:scale-105 hover:shadow-xl"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100/20 to-gray-200/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
        </div>

        {/* Floating Orbs - More subtle */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-gray-500/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-gray-400/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-gray-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/6 w-0.5 h-0.5 bg-gray-400/30 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-1/6 w-1 h-1 bg-gray-500/20 rounded-full animate-ping"></div>
      </div>
    </div>
  );
};

export default LandingPage; 