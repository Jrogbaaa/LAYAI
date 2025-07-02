import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'LAYAI - AI-Powered Influencer Discovery',
  description: 'Discover, match, and collaborate with the perfect influencers using advanced AI technology. Transform your brand campaigns with data-driven influencer partnerships.',
  keywords: 'AI influencer marketing, influencer discovery, brand campaigns, social media marketing',
  authors: [{ name: 'LAYAI Team' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const htmlClasses = `${inter.variable} ${spaceGrotesk.variable}`;
  
  return (
    <html lang="en" className={`${htmlClasses} h-full`}>
      <body className={`${inter.className} h-full`}>
        <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div 
            className="absolute inset-0 opacity-50" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239CA3AF' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
          
          {/* Main content */}
          <div className="relative z-10 h-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
} 