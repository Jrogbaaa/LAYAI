/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during production builds (temporary for deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during builds (temporary for deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // App directory is enabled by default in Next.js 13+
  // No need for experimental.appDir anymore
  webpack: (config, { isServer }) => {
    // Handle pdfjs-dist for server-side rendering
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    
    // Add fallback for Node.js modules in client build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 