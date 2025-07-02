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
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Enhanced Fluid Animation Background */}
      <SplashCursor 
        DENSITY_DISSIPATION={2.8}
        VELOCITY_DISSIPATION={1.8}
        PRESSURE={0.15}
        CURL={4}
        SPLAT_RADIUS={0.25}
        SPLAT_FORCE={7000}
        COLOR_UPDATE_SPEED={8}
        BACK_COLOR={{ r: 0.1, g: 0.2, b: 0.4 }}
        TRANSPARENT={true}
      />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 w-full max-w-5xl">
        {/* Brand Logo/Title */}
        <div className="mb-6 sm:mb-8">
          <div 
            className={`transition-all duration-[2000ms] ease-out ${
              isVisible 
                ? 'opacity-100 transform translate-y-0 scale-100' 
                : 'opacity-0 transform translate-y-8 scale-95'
            }`}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              buenas clara
            </h1>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Tagline */}
        <div 
          className={`mb-8 sm:mb-10 md:mb-12 transition-all duration-[2000ms] delay-[800ms] ease-out ${
            isVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-6'
          }`}
        >
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 font-light leading-relaxed max-w-3xl">
            Plataforma de Marketing de Influencers Potenciada por IA
          </p>
          <p className="text-base sm:text-lg md:text-xl text-white/70 font-light mt-3 sm:mt-4 max-w-2xl">
            Descubre, analiza y conecta con los influencers perfectos para tu marca
          </p>
        </div>

        {/* Call to Action */}
        <div 
          className={`transition-all duration-[2000ms] delay-[1600ms] ease-out ${
            isVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-8'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
          <button 
            onClick={onGetStarted}
              className="group relative px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg sm:text-xl rounded-xl border border-white/20 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 w-full max-w-xs sm:max-w-sm md:max-w-none md:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                Comenzar Búsqueda
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          </div>
          
          <div className="mt-6 sm:mt-8 text-white/60 text-base sm:text-lg max-w-3xl mx-auto text-center">
            <p className="mb-2 sm:mb-3">
              🔍 <strong>Búsqueda Inteligente:</strong> Chat con IA + subida de propuestas PDF
            </p>
            <p>
              💡 <strong>Todo en uno:</strong> Encuentra influencers, genera propuestas y gestiona campañas
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div 
          className={`mt-12 sm:mt-14 md:mt-16 transition-all duration-[2000ms] delay-[2400ms] ease-out ${
            isVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-8'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Descubrimiento Inteligente</h3>
              <p className="text-white/70 text-xs sm:text-sm">Búsqueda y emparejamiento de influencers potenciado por IA</p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Análisis en Tiempo Real</h3>
              <p className="text-white/70 text-xs sm:text-sm">Datos en vivo e insights de rendimiento</p>
            </div>
            
            <div className="text-center sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Gestión de Campañas</h3>
              <p className="text-white/70 text-xs sm:text-sm">Generación profesional de propuestas</p>
            </div>
          </div>
        </div>

        {/* Floating Elements - More subtle and professional */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-pulse hidden sm:block"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-400/15 rounded-full animate-bounce hidden sm:block"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-300/20 rounded-full animate-ping hidden sm:block"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-purple-300/15 rounded-full animate-pulse hidden sm:block"></div>
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-blue-400/25 rounded-full animate-bounce hidden md:block"></div>
        <div className="absolute top-1/2 right-1/6 w-2 h-2 bg-purple-400/20 rounded-full animate-ping hidden md:block"></div>
      </div>
    </div>
  );
};

export default LandingPage; 