# LAYAI - Influencer Marketing Platform

A comprehensive Next.js application for influencer discovery, campaign management, and proposal generation with AI-powered insights.

## 🚀 Recent Major Updates

### Version 2.3.1 - Critical Bug Fixes ✅
- **Search Results Display**: Fixed issue where discovery results weren't showing in UI
- **Infinite Loop Fix**: Resolved ProposalGenerator console spam and performance issues
- **Enhanced Display**: Now properly shows all found influencers (premium + discovery)
- **Improved Performance**: Added caching and memoization to prevent redundant computations

### Version 2.3.0 - Complete UI Overhaul ✨
- **Professional Design System**: Modern gradient-based UI with enhanced visual hierarchy
- **Enhanced Components**: All components redesigned with better UX and animations
- **Improved Accessibility**: Better focus states, contrast ratios, and responsive design
- **Modern Interactions**: Smooth hover effects, micro-animations, and visual feedback

### Version 2.2.0 - Critical Fixes Resolved ✅
- **Text Direction Issue**: Fixed backward text input in notes (replaced contentEditable with textarea)
- **Proposal Generation**: Restored complete proposal viewer with full functionality
- **Documentation**: Comprehensive updates across all documentation files
- **Performance**: Improved error handling and user feedback systems

## ✨ Key Features

### 🔍 **AI-Powered Influencer Discovery**
- **Smart Search**: Natural language queries for finding perfect influencers
- **Real-time Data**: Live Instagram profile scraping via Apify integration
- **Web Discovery**: Comprehensive search across social platforms
- **Advanced Filtering**: Location, follower count, engagement rate, and niche targeting

### 📊 **Campaign Proposal Generation**
- **AI Brand Research**: Automatic brand analysis and compatibility scoring
- **Personalized Bios**: Custom influencer biographies tailored to your brand
- **Match Reasoning**: Detailed explanations for why each influencer fits your campaign
- **Professional Templates**: Export-ready proposals in multiple formats

### 📝 **Notes & Campaign Management**
- **Organized Notes**: Searchable note-taking system for campaign planning
- **Campaign Tracking**: Manage multiple campaigns with detailed metrics
- **Collaboration Tools**: Share and organize campaign information

### 📈 **Advanced Analytics**
- **Engagement Metrics**: Real-time engagement rate calculations
- **Audience Demographics**: Detailed follower analysis and insights
- **Performance Predictions**: Estimated reach and interaction forecasts
- **ROI Calculations**: Cost-per-engagement and value assessments

## 🛠️ Technical Stack

### **Frontend**
- **Next.js 15**: Latest React framework with app router
- **TypeScript**: Full type safety and enhanced developer experience
- **TailwindCSS**: Modern utility-first CSS framework
- **Professional UI**: Gradient-based design system with micro-interactions

### **Backend & APIs**
- **Apify Integration**: Real-time Instagram profile scraping
- **Serply API**: Web search for influencer discovery
- **JSON Database**: Efficient local data storage
- **RESTful APIs**: Clean, documented API endpoints

### **Key Integrations**
- **Instagram Data**: Live follower counts, engagement rates, and profile information
- **Web Search**: Comprehensive influencer discovery across platforms
- **Export Systems**: CSV, PDF, and custom format generation
- **Brand Research**: Automated brand analysis and compatibility scoring

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Apify API key for Instagram scraping
- Serply API key for web search

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LAYAI.git
   cd LAYAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   ```env
   APIFY_API_TOKEN=your_apify_token_here
   SERPLY_API_KEY=your_serply_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### **Finding Influencers**
1. **Start a Search**: Use natural language like "Find Spanish influencers with 300k+ followers for IKEA"
2. **Review Results**: Browse through premium verified profiles and discovery results
3. **Analyze Profiles**: Check engagement rates, audience demographics, and content style
4. **Select Candidates**: Choose influencers that match your campaign goals

### **Generating Proposals**
1. **Navigate to Proposals**: Click "Generate Proposal" in the sidebar
2. **Enter Campaign Details**: Brand name, campaign name, budget, and requirements
3. **Select Influencers**: Choose from your search results or add manual handles
4. **Generate & Review**: AI creates personalized proposals with detailed reasoning
5. **Export**: Download in CSV, PDF, or custom formats

### **Managing Campaigns**
1. **Campaign Overview**: Track all your active and completed campaigns
2. **Notes System**: Organize thoughts, feedback, and campaign strategies
3. **Performance Tracking**: Monitor engagement and ROI metrics
4. **Collaboration**: Share proposals and campaign data with team members

## 🔧 API Endpoints

### **Search & Discovery**
- `POST /api/search-apify` - Advanced influencer search with AI matching
- `POST /api/scrape-instagram-profiles` - Real-time Instagram profile data
- `POST /api/web-search` - Web-based influencer discovery

### **Campaign Management**
- `GET/POST /api/database/campaigns` - Campaign CRUD operations
- `GET/POST /api/database/notes` - Notes management system
- `POST /api/chat` - AI-powered search query processing

### **Data & Analytics**
- `POST /api/export` - Generate and download campaign reports
- `GET /api/analytics` - Campaign performance metrics
- `POST /api/feedback` - Search result quality feedback

## 🎯 Use Cases

### **Marketing Agencies**
- **Client Campaigns**: Create professional proposals for client brands
- **Influencer Vetting**: Verify authenticity and engagement quality
- **ROI Reporting**: Generate detailed performance and cost analysis
- **Scalable Workflows**: Manage multiple campaigns simultaneously

### **Brand Managers**
- **Campaign Planning**: Research and select optimal influencer partnerships
- **Budget Optimization**: Calculate cost-per-engagement and reach efficiency
- **Competitor Analysis**: Discover influencers working with similar brands
- **Performance Tracking**: Monitor campaign success and engagement metrics

### **Content Creators**
- **Collaboration Discovery**: Find brands and fellow creators for partnerships
- **Market Research**: Analyze successful campaigns in your niche
- **Rate Benchmarking**: Understand market rates for your follower tier
- **Network Building**: Connect with relevant brands and creators

## 🔒 Security & Privacy

- **API Key Protection**: Secure environment variable management
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Privacy Compliance**: GDPR and CCPA compliant data handling
- **Rate Limiting**: API protection against abuse and overuse

## 📊 Performance

- **Fast Search**: Sub-second influencer discovery with caching
- **Real-time Data**: Live Instagram metrics and engagement rates
- **Optimized UI**: Smooth animations and responsive design
- **Scalable Architecture**: Handles thousands of influencer profiles efficiently

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/LAYAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/LAYAI/discussions)

---

**Built with ❤️ for the influencer marketing community** 