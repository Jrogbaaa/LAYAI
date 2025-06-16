# LAYAI - AI-Powered Influencer Discovery Platform 🚀

> **Transform your brand campaigns with intelligent influencer matching, real-time analytics, and data-driven insights**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.14-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ What's New - Major UI Overhaul 2.0

LAYAI has been completely transformed with a modern, AI-driven interface that adapts to your needs and optimizes for conversion. Our latest update introduces cutting-edge UI/UX principles for an unparalleled user experience.

### 🎨 **Modern Design System**
- **Glass Morphism Effects**: Beautiful translucent cards with backdrop blur
- **Enhanced Typography**: Premium Space Grotesk + optimized Inter fonts
- **Micro-animations**: Smooth float, pulse-glow, slide-up animations
- **Design Tokens**: Centralized CSS variables for consistent styling

### 🤖 **AI-Driven Interactive Elements**
- **Smart Tooltips**: Context-aware help that appears when you need guidance
- **Adaptive Navigation**: Interface reorders based on your usage patterns
- **Progressive Disclosure**: Advanced features revealed as you gain experience
- **Contextual Help System**: Tailored guidance for beginner/intermediate/advanced users

### 🎯 **Conversion-Optimized Features**
- **Enhanced Landing Page**: Trust signals, social proof, compelling CTAs
- **Strategic Button Placement**: "Start Free Discovery" with trust indicators
- **Progress Indicators**: Visual feedback during AI processing
- **Reduced Friction**: Smart tooltips eliminate confusion points

## 🌟 Key Features

### 🔍 **AI-Powered Discovery**
- **Natural Language Search**: Describe your ideal influencer in plain English
- **Real-time Matching**: Advanced algorithms find perfect brand-influencer fits
- **Multi-platform Support**: Instagram, TikTok, YouTube, Twitter integration
- **Smart Filtering**: Advanced demographics, engagement, and niche targeting

### 📊 **Advanced Analytics Dashboard**
- **Performance Metrics**: Real-time engagement rates and audience insights
- **ROI Tracking**: Campaign performance and conversion analytics
- **Audience Demographics**: Detailed breakdowns by age, location, interests
- **Competitive Analysis**: Market trends and competitor insights

### 📝 **Campaign Management**
- **Proposal Generator**: AI-assisted campaign proposal creation
- **Template Library**: Pre-built templates for different industries
- **Collaboration Tools**: Share proposals and track negotiations
- **Export Options**: CSV, PDF, and custom format exports

### 🎨 **Modern User Experience**
- **Adaptive Interface**: Personalizes based on your usage patterns
- **Contextual Help**: Smart tooltips and guidance when you need it
- **Glass Morphism Design**: Modern, elegant visual aesthetics
- **Responsive Design**: Perfect experience across all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/layai.git
   cd layai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   APIFY_API_TOKEN=your_apify_api_token
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

### 1. **AI Discovery Chat**
- Start by describing your ideal influencer campaign
- Use natural language: "Find fashion influencers in NYC with 50k+ followers"
- AI will process your request and find matching influencers

### 2. **Review Results**
- **Premium Matches**: High-quality influencers with detailed analytics
- **Discovery Results**: Additional influencers found through real-time search
- Use filters to refine your search results

### 3. **Generate Proposals**
- Select influencers you're interested in
- Use our AI-powered proposal generator
- Customize templates for your specific campaign needs

### 4. **Manage Campaigns**
- Track ongoing campaigns and negotiations
- Monitor performance metrics and ROI
- Export data in multiple formats

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15.3.3**: React framework with App Router
- **React 19.0.0**: Latest React with concurrent features
- **TypeScript 5.7.2**: Type-safe development
- **Tailwind CSS 3.4.14**: Utility-first CSS framework

### **UI/UX**
- **Glass Morphism**: Modern translucent design elements
- **Custom Animations**: Smooth micro-interactions
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliant

### **Backend Integration**
- **Apify**: Web scraping and data collection
- **Firebase**: Real-time database and authentication
- **RESTful APIs**: Clean, documented endpoints

### **Development Tools**
- **ESLint**: Code linting and quality
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing
- **TypeScript**: Static type checking

## 📁 Project Structure

```
layai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Enhanced global styles
│   │   ├── layout.tsx         # Root layout with modern design
│   │   └── page.tsx           # Main application page
│   ├── components/            # React components
│   │   ├── ui/               # Enhanced UI components
│   │   │   ├── enhanced-button.tsx      # Modern button with interactions
│   │   │   ├── enhanced-card.tsx        # Glass morphism cards
│   │   │   ├── smart-tooltip.tsx        # AI-driven contextual help
│   │   │   ├── adaptive-sidebar.tsx     # Personalized navigation
│   │   │   └── splash-cursor.tsx        # Animated background
│   │   ├── Chatbot.tsx        # AI chat interface
│   │   ├── InfluencerResults.tsx       # Search results display
│   │   ├── ProposalGenerator.tsx       # Campaign proposal creation
│   │   ├── CampaignManager.tsx         # Campaign management
│   │   └── LandingPage.tsx    # Enhanced landing page
│   ├── lib/                   # Utility libraries
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper functions
├── tests/                     # Test files
├── docs/                      # Documentation
└── public/                    # Static assets
```

## 🎨 Design System

### **Color Palette**
```css
/* Primary Colors */
--primary-50: 240 249 255;
--primary-500: 59 130 246;
--primary-600: 37 99 235;

/* Glass Morphism */
--surface-glass: rgba(255, 255, 255, 0.7);
--surface-glass-dark: rgba(255, 255, 255, 0.1);

/* Shadows */
--shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-glow: 0 0 20px rgba(59, 130, 246, 0.1);
```

### **Typography**
- **Space Grotesk**: Modern geometric sans-serif for headings
- **Inter**: Optimized for readability in body text
- **Responsive scaling**: Fluid typography across all screen sizes

### **Components**
- **Enhanced Buttons**: Multiple variants with ripple effects
- **Smart Cards**: Glass morphism with hover animations
- **Adaptive Navigation**: Personalizes based on usage patterns
- **Contextual Tooltips**: AI-driven help system

## 🧪 Testing

### **Run Tests**
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage

# All tests
npm run test:all
```

### **Test Structure**
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and data flow testing
- **E2E Tests**: Complete user journey testing
- **Visual Tests**: UI component screenshot testing

## 📊 Performance

### **Core Web Vitals**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### **Optimization Features**
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Dynamic imports for better performance
- **Caching**: Intelligent caching strategies
- **Compression**: Gzip/Brotli compression enabled

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

### **Docker**
```bash
docker build -t layai .
docker run -p 3000:3000 layai
```

### **Environment Variables**
Ensure all environment variables are configured in your deployment platform.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### **Code Standards**
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Follow semantic commit conventions

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/layai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/layai/discussions)

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Vercel**: For deployment and hosting platform
- **Open Source Community**: For the incredible ecosystem

---

<div align="center">

**Built with ❤️ by the LAYAI Team**

[Website](https://layai.com) • [Documentation](docs/) • [API Reference](API_DOCUMENTATION.md)

</div> 