# 🚀 LAYAI - AI-Powered Influencer Marketing Platform

**📱 Version 2.19.1** | **🌐 Live Production**: [https://layai.vercel.app/](https://layai.vercel.app/)

> 🔍 **MAJOR: Dynamic Brand Research Engine** - Universal brand support with real-time web search for ANY brand, not just pre-configured ones!
> 🎯 **PREVIOUS: Enhanced Brand Compatibility Engine** - Dynamic multi-dimensional brand-influencer matching with 50+ brand profiles and aesthetic intelligence!
> 🚨 **PREVIOUS: Follower Count Filtering Restored** - Fixed broken parsing for "under 500,000 followers" - now 100% accurate!
> ✅ **PREVIOUS: Test Reliability Enhanced** - Fixed flaky E2E tests with multi-strategy timeout handling and 148/148 tests now passing consistently!

## 🚀 Latest Updates (January 2025)

### Major System Improvements
- **✅ Enhanced Dropdown Search**: Complete tabbed interface with chat and structured search
- **✅ Automatic Brand Research**: Dynamic brand investigation with real-time parameter adjustment  
- **✅ Comprehensive Campaign Saving**: Both search types now save to campaigns automatically
- **✅ Massive Database Upgrade**: 3,000 top Spanish influencers with complete metadata
- **✅ Performance Optimization**: 22ms search speed (vs previous 30+ seconds)
- **✅ Validation System Fix**: 99%+ legitimate profiles now pass validation

## 🎯 Platform Overview

LAYAI is a comprehensive AI-powered influencer marketing platform designed to streamline the process of finding, analyzing, and managing influencer partnerships. The platform combines advanced AI capabilities with real-time data scraping and intelligent matching algorithms.

### 🔥 Key Features

#### 🤖 Dual Search Interface
- **Chat IA**: Natural language search with PDF analysis and collaboration verification
- **Búsqueda con Filtros**: Structured search with 8+ filter categories and automatic brand research
- **Seamless Switching**: Tabbed interface for optimal user experience

#### 📊 Comprehensive Database
- **3,000 Spanish Influencers**: Complete dataset with verified profiles
- **Real-time Scraping**: Live data from Instagram, TikTok, YouTube
- **Quality Scoring**: Authenticity checks and engagement validation
- **Demographic Data**: Age, gender, location, interests, and audience insights

#### 🎯 Advanced Matching
- **Multi-Niche Support**: OR logic for complex searches (lifestyle + fitness + fashion)
- **Brand Compatibility**: AI-powered brand-influencer matching
- **Intelligent Fallback**: Broader criteria when no results found
- **Parameter Validation**: Automatic correction of extreme values

#### 📚 Campaign Management
- **Automatic Saving**: All searches save to campaigns with proper brand association
- **Descriptive Queries**: Human-readable search descriptions
- **Search History**: Complete audit trail of all activities
- **Enhanced Metadata**: Comprehensive campaign data structure

## 🛠️ Technical Architecture

### Core Components
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express-like API routes
- **Database**: Local JSON for performance + Firebase for campaigns
- **AI Integration**: OpenAI GPT-4 for natural language processing
- **Data Sources**: Apify, Serply, and custom web scraping

### Performance Metrics
- **Search Speed**: 22ms average response time
- **Database Size**: 2,996 processed influencers
- **Validation Success**: 99%+ legitimate profiles
- **Campaign Saving**: 100% success rate

## 🔍 Search Capabilities

### Chat Search Features
- **Natural Language**: "Encuentra influencers de fitness femeninos en Madrid"
- **PDF Analysis**: Upload proposals for personalized search
- **Collaboration Verification**: "¿Ha trabajado Cristiano con Nike?"
- **Follow-up Questions**: Conversational refinement

### Dropdown Search Features
- **Gender Filtering**: Male, Female, Non-Binary, Any
- **Age Ranges**: 13-17, 18-24, 25-34, 35-44, 45-54, 55+
- **Location**: Spanish-speaking countries and major cities
- **Multi-Niche**: Lifestyle, fashion, fitness, food, travel, tech, etc.
- **Platform Selection**: Instagram, TikTok, YouTube, Twitter
- **Follower Ranges**: Nano (1K-10K) to Mega (1M+) with presets
- **Engagement Rates**: Customizable ranges with validation
- **Results Limits**: 25, 50, 100, 200 options

## 📋 Search Results

### Database Performance
- **Lifestyle + Fitness + Fashion**: 1,198 influencers found
- **Follower Range 10K-500K**: Comprehensive coverage
- **Quality Filtering**: Only authentic, active profiles
- **Engagement Validation**: Verified engagement rates

### Real-time Enhancement
- **Live Web Scraping**: 7+ additional profiles per search
- **Brand Account Filtering**: Removes non-personal accounts
- **Duplicate Removal**: Intelligent deduplication
- **Quality Scoring**: Credibility and authenticity metrics

## 🎨 User Experience

### Interface Design
- **Responsive Layout**: Mobile-first design
- **Tabbed Navigation**: Smooth switching between search modes
- **Visual Feedback**: Loading states and progress indicators
- **Accessibility**: ARIA compliance and keyboard navigation

### Results Display
- **Audience Demographics**: Age, gender, location breakdowns
- **Engagement Metrics**: Detailed performance statistics
- **Contact Information**: Email and preferred contact methods
- **Visual Cards**: Rich media and profile information

## 🔧 Recent Bug Fixes

### Critical Issues Resolved
1. **Campaign Saving Bug**: Dropdown searches were being excluded from campaign saving
2. **Validation System**: Overly restrictive rules filtering out 99% of legitimate influencers
3. **Search Results**: Users seeing only 6 results instead of 1,198 available
4. **Brand Extraction**: Improved brand detection for both search types

### Performance Improvements
- **Database Migration**: From Firebase to local JSON for speed
- **Validation Relaxation**: Balanced security with usability
- **Error Handling**: Better timeout management and fallback strategies
- **Logging Enhancement**: Comprehensive debugging and monitoring

## 📊 Data Sources & Quality

### Primary Database
- **Source**: Top 3,000 Spanish influencers CSV
- **Processing**: Automated parsing and validation
- **Quality Checks**: Engagement authenticity and profile verification
- **Updates**: Regular refresh cycles for data accuracy

### Real-time Sources
- **Apify**: Instagram profile scraping and verification
- **Serply**: Web search for influencer discovery
- **Custom APIs**: Brand research and collaboration verification

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Environment variables (see .env.example)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/layai.git
cd layai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Environment Variables
```
OPENAI_API_KEY=your_openai_api_key
APIFY_API_KEY=your_apify_api_key
SERPLY_API_KEY=your_serply_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## 📚 Documentation

### Available Documentation
- **[Technical Documentation](./TECHNICAL_DOCUMENTATION.md)**: Comprehensive system architecture
- **[API Documentation](./API_DOCUMENTATION.md)**: Complete API reference
- **[Changelog](./CHANGELOG.md)**: Detailed version history
- **[Performance Guide](./PERFORMANCE_UX_OPTIMIZATION_SUMMARY.md)**: Optimization strategies

### Key Guides
- **[Search Improvements](./SEARCH_IMPROVEMENTS.md)**: Search system enhancements
- **[Spanish Localization](./SPANISH_LOCALIZATION_GUIDE.md)**: Localization implementation
- **[Verification System](./VERIFICATION_SYSTEM_DOCUMENTATION.md)**: Profile verification process

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Core functionality and utilities
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows with Playwright
- **Performance Tests**: Load testing and optimization validation

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## 🔮 Future Roadmap

### Planned Features
- **Multi-language Support**: Expand beyond Spanish market
- **Advanced Analytics**: Deeper campaign performance insights
- **Automated Outreach**: AI-powered influencer communication
- **Contract Management**: Complete campaign lifecycle management

### Technical Improvements
- **GraphQL API**: More efficient data fetching
- **Real-time Updates**: WebSocket implementation
- **Advanced Caching**: Redis integration for performance
- **Microservices**: Scalable architecture evolution

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Code style and standards
- Pull request process
- Issue reporting
- Development setup

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Issues**: GitHub Issues for bug reports and feature requests
- **Documentation**: Comprehensive guides in the `/docs` directory
- **Community**: Join our Discord server for discussions

---

**Built with ❤️ by the LAYAI Team**

*Empowering brands to find their perfect influencer matches through AI-powered intelligence.*
