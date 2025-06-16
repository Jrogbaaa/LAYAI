# LAYAI - Influencer Marketing Platform

A comprehensive Next.js application for influencer discovery, campaign management, and proposal generation with AI-powered insights.

## 🚀 Recent Major Updates

### Version 2.3.0 - Complete UI Overhaul ✨
- **Professional Design System**: Modern gradient-based UI with enhanced visual hierarchy
- **Enhanced Components**: All components redesigned with better UX and animations
- **Improved Accessibility**: Better focus states, contrast ratios, and responsive design
- **Modern Interactions**: Smooth hover effects, micro-animations, and visual feedback

### Version 2.2.0 - Critical Fixes Resolved ✅
- **Text Direction Issue**: Fixed backward text input in notes (replaced contentEditable with textarea)
- **Proposal Generation**: Restored complete proposal viewer with full biography and metrics
- **Enhanced Navigation**: Improved flow between proposal generator and viewer

## ✨ Key Features

### 🔍 **AI-Powered Influencer Discovery**
- Intelligent search using natural language queries
- Real-time Instagram profile scraping via Apify
- Advanced filtering and matching algorithms
- Celebrity recognition system with personalized analysis

### 📊 **Professional Proposal Generation**
- AI-powered brand research and compatibility analysis
- Automated influencer-brand matching with detailed reasoning
- Professional proposal templates with comprehensive metrics
- Multi-format export (CSV, PDF, Excel) for client presentations

### 🎯 **Campaign Management**
- Brand research with target audience analysis
- Influencer selection with engagement rate calculations
- Budget planning and cost estimation
- Performance metrics and ROI projections

### 📝 **Notes & Organization**
- Integrated notes management system
- Campaign planning and strategy documentation
- Search and organization capabilities
- Auto-save functionality

### 🎨 **Modern User Interface**
- Professional gradient-based design system
- Responsive layout for all devices
- WebGL fluid animation landing page
- Enhanced accessibility and user experience

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS with custom design system
- **Animation**: WebGL shaders, CSS transitions
- **APIs**: Apify (Instagram), Serply (Web Search)
- **Data**: JSON-based storage with API endpoints

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Apify API key for Instagram scraping
- Serply API key for web search

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LAYAI.git
   cd LAYAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file:
   ```env
   APIFY_API_TOKEN=your_apify_token_here
   SERPLY_API_KEY=your_serply_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Navigate to `http://localhost:3000`

## 🎯 Usage Guide

### Getting Started
1. **Landing Page**: Experience the WebGL fluid animation and click "Get Started"
2. **Influencer Search**: Use natural language to find influencers (e.g., "Find fashion influencers with 100k+ followers")
3. **Proposal Generation**: Add Instagram handles, set campaign details, and generate professional proposals
4. **Notes Management**: Document campaign strategies and ideas
5. **Export & Share**: Download proposals in multiple formats for client presentations

### Example Searches
- "Find tech YouTubers in California with high engagement"
- "Show me beauty influencers with 50k-500k followers"
- "Find Spanish lifestyle influencers for home decor brand"

## 🏗️ Architecture

### Component Structure
```
src/
├── components/           # UI Components
│   ├── Chatbot.tsx      # AI search interface
│   ├── ProposalGenerator.tsx  # Campaign creation
│   ├── ProposalViewer.tsx     # Proposal display
│   ├── NotesManager.tsx       # Notes system
│   ├── Sidebar.tsx           # Navigation
│   └── InfluencerCard.tsx    # Influencer display
├── app/                 # Next.js app router
├── lib/                 # Utilities and helpers
└── types/              # TypeScript definitions
```

### API Endpoints
- `/api/scrape-instagram-profiles` - Instagram data fetching
- `/api/web-search` - Brand research and web search
- `/api/database/notes` - Notes management
- `/api/database/campaigns` - Campaign storage

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradients (#3B82F6 to #1D4ED8)
- **Secondary**: Purple gradients (#8B5CF6 to #7C3AED)
- **Success**: Green gradients (#10B981 to #059669)
- **Warning**: Orange gradients (#F59E0B to #D97706)

### Typography
- **Headers**: Bold, large sizes with proper hierarchy
- **Body**: System fonts with optimal line height
- **Interactive**: Medium weight with hover states

### Components
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Gradient backgrounds, smooth transitions
- **Forms**: Clean inputs with focus states
- **Navigation**: Interactive sidebar with animations

## 🔧 Troubleshooting

### Common Issues

**Text appearing backward in notes:**
- ✅ **Fixed in v2.2.0** - Replaced contentEditable with textarea

**Proposal not showing after generation:**
- ✅ **Fixed in v2.2.0** - Enhanced navigation flow

**API timeout errors:**
- Check internet connection and API key validity
- Verify environment variables are properly set

**Missing influencer data:**
- Ensure Instagram handles are public profiles
- Check Apify API quota and status

### Environment Variables
Ensure all required environment variables are set:
```bash
# Check if variables are loaded
echo $APIFY_API_TOKEN
echo $SERPLY_API_KEY
```

## 📈 Performance

### Optimization Features
- **Parallel API Calls**: Concurrent influencer research
- **Efficient Rendering**: Optimized React components
- **Memory Management**: Proper cleanup and garbage collection
- **Caching**: Strategic data caching for better performance

### WebGL Animation
- **60fps Rendering**: Smooth fluid simulation
- **Mouse Interaction**: Real-time response to user input
- **Performance Monitoring**: Automatic quality adjustment

## 🔒 Security

### Data Protection
- **Environment Variables**: Secure API key management
- **Input Validation**: Comprehensive data sanitization
- **Error Handling**: Graceful failure without data exposure

### API Security
- **Rate Limiting**: Prevents API abuse
- **Timeout Protection**: Prevents hanging requests
- **Error Logging**: Secure debugging information

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automated code formatting
- **Component Structure**: Functional components with hooks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Apify**: Instagram profile scraping capabilities
- **Serply**: Web search and brand research API
- **Next.js Team**: Amazing React framework
- **TailwindCSS**: Utility-first CSS framework
- **WebGL Community**: Shader and animation resources

## 📞 Support

For support, email support@layai.com or create an issue in this repository.

---

**Version**: 2.3.0  
**Last Updated**: January 3, 2025  
**Status**: ✅ All systems operational 