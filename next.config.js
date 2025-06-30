/** @type {import('next').NextConfig} */
const nextConfig = {
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
    
    return config;
  },
};

module.exports = nextConfig; 