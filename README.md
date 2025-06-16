# LAYAI - AI-Powered Influencer Marketing Platform

LAYAI is a comprehensive influencer marketing platform that leverages AI to discover, analyze, and generate professional proposals for influencer collaborations. Built with Next.js, TypeScript, and modern web technologies.

## 🚀 Features

### Core Functionality
- **AI-Powered Search**: Intelligent influencer discovery using natural language queries
- **Multi-Platform Support**: Instagram, TikTok, YouTube, and Twitter integration
- **Real Instagram Data**: Authentic profile data via Apify Instagram Profile Scraper
- **Manual Upload**: Add specific influencers by handle with automatic data enrichment
- **Professional Proposals**: Generate detailed collaboration proposals in Spanish
- **Export Capabilities**: CSV and Excel export matching industry templates
- **Colorful Landing Page**: Interactive particle animation with mouse responsiveness

### Advanced Features
- **Brand Intelligence**: Automated brand research and industry-specific matching
- **SocialBlade Integration**: Enhanced analytics with verified statistics and rankings
- **Personalized Content**: Unique Spanish biographies and brand-specific match reasons
- **Multi-Step Enhancement**: 5-step process from brand research to personalized proposals
- **Graceful Fallbacks**: System continues working even when APIs are unavailable
- **Real-Time Validation**: Profile verification and data quality assurance

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Next.js API routes, Node.js
- **Data Sources**: Apify, Serply API, Web scraping
- **Export**: CSV/Excel generation with Spanish localization
- **AI**: OpenAI integration for content generation

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- API Keys:
  - `APIFY_API_TOKEN` - For Instagram profile scraping (Required)
  - `SERPLY_API_KEY` - For brand research (Required)
  - `FIRECRAWL_API_KEY` - For web scraping (Required)
  - `SOCIALBLADE_CLIENT_ID` & `SOCIALBLADE_TOKEN` - For enhanced analytics (Optional)
  - Firebase configuration variables (Required)

## ⚠️ Current Status & Known Issues

### Working Features ✅
- **Landing Page Animation**: Beautiful interactive particle system
- **Real Instagram Data**: Apify integration providing authentic profiles
- **Brand Research**: Automated brand intelligence and analysis
- **Personalized Proposals**: Brand-specific match reasons and biographies
- **Professional Export**: CSV/Excel with Spanish localization

### Known Issues 🔧
- **SocialBlade API**: Currently returning 402 errors (payment/quota exceeded)
  - System gracefully falls back to Apify data
  - All functionality remains operational
- **Web Search API**: Serply occasionally returns 405 errors
  - Brand research may fail intermittently
  - System uses fallback brand analysis

### Impact
The system is fully functional even with these API issues. You'll still get:
- Real Instagram profile data via Apify
- Personalized brand-specific analysis
- Professional Spanish proposals
- Complete export functionality

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/layai.git
   cd layai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```
   APIFY_API_TOKEN=your_apify_token
   SERPLY_API_KEY=your_serply_key
   OPENAI_API_KEY=your_openai_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Basic Search
1. Enter a natural language query like "Find female fitness influencers from Spain with 10K-100K followers"
2. The AI will parse your requirements and perform targeted searches
3. Review discovered influencers with real-time data
4. Select influencers for your campaign

### Manual Upload
1. Click "Add Manual Influencers" 
2. Enter Instagram/TikTok handles (one per line):
   ```
   @username
   https://instagram.com/username
   https://tiktok.com/@username
   username
   ```
3. The system will automatically search for real profile data
4. Fallback profiles are created if search fails

### Proposal Generation
1. Select influencers from search results or manual uploads
2. Customize biographies and collaboration reasons (editable fields)
3. Click "Generate Proposal"
4. Export as CSV or Excel in professional Spanish format

## 🔧 Configuration

### Search Parameters
- **Platforms**: Instagram, TikTok, YouTube, Twitter
- **Follower Range**: 1K - 10M+ followers
- **Gender**: Male, Female, Non-Binary, Other
- **Location**: Country/region targeting
- **Niches**: 20+ categories including Fashion, Fitness, Tech, etc.

### Export Formats
- **Hibiki Style**: Single-platform CSV format
- **Orange Style**: Multi-platform CSV with detailed metrics
- **Excel**: XLSX format with Spanish localization

## 🏗️ Architecture

### Frontend Components
- `src/app/page.tsx` - Main application interface
- `src/components/ProposalGenerator.tsx` - Core proposal functionality
- `src/components/DiscoveryGrid.tsx` - Search results display
- `src/components/ui/` - Reusable UI components

### Backend Services
- `src/lib/apifyService.ts` - Web scraping and data collection
- `src/lib/exportUtils.ts` - CSV/Excel generation
- `src/lib/brandIntelligence.ts` - AI brand analysis
- `src/app/api/search-apify/route.ts` - Search API endpoint

### Data Flow
1. User query → AI parsing → Search parameters
2. Web search → Profile discovery → Data enrichment
3. Manual uploads → Real-time verification → Profile creation
4. Selection → Proposal generation → Export

## 🔍 Search Quality Features

### Profile Validation
- Filters out video IDs, domain names, corporate accounts
- Blocks long numeric IDs and invalid formats
- Converts TikTok video URLs to profile URLs
- Comprehensive logging for transparency

### Gender Detection
- Spanish name database with 1000+ entries
- Username pattern analysis
- Fallback handling for unknown genders
- 60% allowance for uncertain profiles

### Data Personalization
- Unique Spanish biographies per influencer
- IKEA-specific collaboration reasons
- Varied metrics based on niche and platform
- Realistic past collaboration history

## 📊 Export Templates

### Hibiki Style (Single Platform)
```csv
Influencer,Followers,Engagement Rate,Cost,Platform,Bio,Reason
@username,50000,3.2%,€1000,Instagram,Bio personalizada,Razón específica
```

### Orange Style (Multi Platform)
```csv
Influencer,Instagram,TikTok,Total Followers,Spain IP %,Engagement,Cost
@username,50000,25000,75000,85%,3.2%,€1500
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APIFY_API_TOKEN` | Apify web scraping service | Yes |
| `SERPLY_API_KEY` | Search API for profile discovery | Yes |
| `OPENAI_API_KEY` | AI content generation | Optional |
| `NODE_ENV` | Environment (development/production) | Auto |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/layai/issues)
- **Documentation**: This README and inline code comments
- **Email**: support@layai.com

## 🎯 Roadmap

- [ ] Multi-language support (English, French, German)
- [ ] Advanced analytics dashboard
- [ ] Campaign performance tracking
- [ ] Automated outreach templates
- [ ] Integration with major social media APIs
- [ ] Machine learning recommendation engine

## 📈 Performance

- **Search Speed**: ~30-60 seconds for comprehensive results
- **Data Accuracy**: Real-time web scraping with fallback handling
- **Export Speed**: Instant CSV/Excel generation
- **Scalability**: Handles 100+ influencers per search

---

Built with ❤️ by the LAYAI team. Empowering brands to find their perfect influencer matches through AI-powered discovery and analysis. 