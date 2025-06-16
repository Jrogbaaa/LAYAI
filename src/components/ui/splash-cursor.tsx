"use client";
import { useEffect, useRef } from "react";

function SplashCursor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create animated particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full opacity-70 animate-pulse';
      
      // Random size
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random color
      const hue = Math.random() * 360;
      particle.style.backgroundColor = `hsl(${hue}, 70%, 60%)`;
      
      // Random animation duration
      particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
      
      container.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 5000);
    };

    // Create particles continuously
    const interval = setInterval(createParticle, 200);
    
    // Initial burst of particles
    for (let i = 0; i < 20; i++) {
      setTimeout(createParticle, i * 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 z-0 pointer-events-none w-screen h-screen overflow-hidden">
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)
          `
        }}
      >
        {/* Animated flowing background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-teal-500/20 via-green-500/20 to-yellow-500/20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-orange-500/20 to-pink-500/20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    </div>
  );
}

export { SplashCursor }; 