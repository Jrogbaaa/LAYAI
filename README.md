# LAYAI - Social Media Talent Matcher

A Next.js 15 platform for creative agencies to discover, match, and engage with social media influencers using AI-powered search and real-time data scraping.

![LAYAI Platform](https://img.shields.io/badge/Platform-Next.js%2015-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-06B6D4?style=flat-square&logo=tailwindcss)

## 🚀 Features

### Core Functionality
- **Real-time Influencer Discovery**: Hybrid search combining web scraping and social media API integration
- **Advanced Filtering**: Filter by platform, niche, location, demographics, and engagement metrics
- **Professional Proposal Generation**: Create agency-style campaign proposals with multiple export formats
- **Live Data Integration**: Real-time follower counts, engagement rates, and profile information
- **Multi-Platform Support**: Instagram, TikTok, YouTube, Twitter coverage

### Technical Highlights
- **Apify Integration**: Real-time Instagram/TikTok profile scraping
- **Firecrawl API**: Intelligent web search for influencer discovery
- **Serverless Architecture**: No database required - powered by external APIs
- **Enhanced Data Processing**: Follower count normalization, location matching, gender detection
- **Export Capabilities**: CSV (Standard & Hibiki-style), PDF proposals

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **APIs**: Apify (profile scraping), Firecrawl (web search)
- **Testing**: Playwright E2E testing
- **Deployment**: Vercel-ready serverless

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Apify API token
- Firecrawl API token

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jrogbaaa/LAYAI.git
   cd LAYAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` with your API keys:
   ```env
   APIFY_API_TOKEN=your_apify_token_here
   FIRECRAWL_API_KEY=your_firecrawl_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### Basic Search Flow

1. **Set Search Criteria**
   - Platform: Instagram, TikTok, YouTube, etc.
   - Niche: Fashion, Beauty, Fitness, Technology, etc.
   - Follower Range: 1K - 10M+ followers
   - Demographics: Location, gender, age range

2. **Review Results**
   - Real-time follower counts and engagement rates
   - Profile verification status
   - Estimated collaboration costs
   - Match scores based on criteria

3. **Generate Proposals**
   - Professional campaign proposals
   - Customizable content commitments
   - Multiple export formats (CSV, PDF)

### Advanced Features

- **Hibiki-Style Export**: Luxury brand proposal formatting
- **Orange/TSL Export**: Standard agency CSV format
- **Match Scoring**: AI-powered relevance scoring
- **Location Intelligence**: Spanish influencer recognition

## 🔍 API Integration Details

### Apify Integration
- **Service**: `apify/instagram-profile-scraper`
- **Purpose**: Real-time profile data extraction
- **Data Points**: Followers, engagement, bio analysis, verification status

### Firecrawl Integration  
- **Service**: Web search and scraping
- **Purpose**: Influencer discovery via search engines
- **Capabilities**: Profile URL extraction, enhanced search results

### Data Processing Pipeline
1. **Web Search**: Firecrawl discovers potential influencer profiles
2. **Profile Scraping**: Apify extracts detailed social media data
3. **Data Enhancement**: Follower normalization, location/gender detection
4. **Filtering**: Apply user criteria to return relevant matches
5. **UI Display**: Present results with match scores and recommendations

## 📊 Project Evolution

### Phase 1: Foundation (Completed)
- ✅ Next.js 15 setup with TypeScript
- ✅ Tailwind CSS styling system
- ✅ Basic search form and results UI
- ✅ Mock data system for development

### Phase 2: API Integration (Completed)
- ✅ Apify API integration for profile scraping
- ✅ Firecrawl API for web search
- ✅ Hybrid search approach implementation
- ✅ Real-time data processing pipeline

### Phase 3: Data Enhancement (Completed)
- ✅ Follower count normalization (1.2M, 500K format)
- ✅ Location matching with Spanish influencer support
- ✅ Gender detection from bios and names
- ✅ Enhanced filtering algorithms

### Phase 4: UI/UX & Testing (Completed)
- ✅ Comprehensive E2E testing with Playwright
- ✅ Error handling and loading states
- ✅ Search form validation and defaults
- ✅ Responsive design implementation

### Phase 5: Export & Proposals (Completed)
- ✅ Professional proposal generation
- ✅ Multiple export formats (CSV, PDF)
- ✅ Agency-style formatting
- ✅ Hibiki luxury brand export option

## 🧪 Testing

### Run E2E Tests
```bash
# Run all tests
npm run test:e2e

# Run specific test
npx playwright test tests/e2e/search-integration.spec.ts

# Run with UI (visual testing)
npx playwright test --ui
```

### Test Coverage
- ✅ Full search flow integration
- ✅ API error handling
- ✅ Form validation
- ✅ Multi-platform selection
- ✅ Proposal generation workflow
- ✅ Export functionality

## 🔧 Configuration

### Search Form Defaults
- **Platforms**: Auto-selects Instagram if none chosen
- **Niches**: Auto-selects Fashion if none chosen  
- **Follower Range**: 1K - 10M (optimized for real influencer data)
- **Max Results**: 20 per search

### API Rate Limits
- **Apify**: Respects API quotas automatically
- **Firecrawl**: Built-in rate limiting
- **Search Optimization**: Hybrid approach reduces API calls

## 🐛 Troubleshooting

### Common Issues

**"No results found"**
- Check follower range (default: 1K-10M)
- Verify platform/niche combinations
- Ensure API keys are valid

**"API timeout errors"**
- Apify searches can take 15-30 seconds
- Firecrawl searches typically complete in 5-10 seconds
- Check network connectivity

**"Test failures"**
- E2E tests require localhost:3000 to be running
- Ensure dev server is started before testing
- Check for any console errors in browser

### Performance Optimization
- Search results are limited to 20 per query
- Duplicate profiles are automatically filtered
- Memory usage optimized by removing test connections

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables (Production)
```env
APIFY_API_TOKEN=your_production_apify_token
FIRECRAWL_API_KEY=your_production_firecrawl_key
```

## 📈 Analytics & Monitoring

### Key Metrics Tracked
- Search completion rates
- API response times
- Match score accuracy
- User engagement with results

### Logging
- Comprehensive server-side logging
- API response monitoring
- Error tracking and debugging
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 Development Notes

### Key Technical Decisions
- **No Database**: Serverless approach using external APIs
- **Real-time Data**: Prioritizes fresh data over cached results
- **Hybrid Search**: Combines multiple data sources for comprehensive results
- **TypeScript First**: Full type safety throughout application

### Architecture Decisions
- **API Routes**: Server-side processing for sensitive operations
- **Component Structure**: Modular, reusable React components
- **State Management**: React hooks for local state
- **Error Boundaries**: Graceful error handling

### Future Enhancements
- [ ] Additional platform support (Snapchat, Pinterest)
- [ ] Advanced analytics dashboard
- [ ] Campaign performance tracking
- [ ] Bulk export capabilities
- [ ] API rate limiting dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Apify** for robust profile scraping capabilities
- **Firecrawl** for intelligent web search
- **Next.js team** for the excellent framework
- **Tailwind CSS** for rapid UI development

---

**Built with ❤️ for creative agencies and influencer marketing professionals** 