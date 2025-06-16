# LAYAI - AI-Powered Influencer Campaign Management

An intelligent platform for discovering, analyzing, and managing influencer marketing campaigns with real-time data integration and personalized analysis.

## 🚀 Key Features

- **Smart Influencer Discovery**: AI-powered matching with personalized analysis for major celebrities
- **Real-time Profile Scraping**: Live Instagram data via Apify integration
- **Enhanced Web Research**: Intelligent brand and influencer research with fallback systems
- **Personalized Campaign Proposals**: Unique, data-driven proposals for each influencer
- **Celebrity Recognition**: Specialized analysis for major influencers (Cristiano Ronaldo, Taylor Swift, etc.)
- **Professional CSV Export**: IKEA-format export for client presentations
- **Multi-language Support**: Spanish and English interface
- **Beautiful UI**: Modern design with WebGL fluid simulation

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Data Sources**: Apify (Instagram scraping), Serply (web search)
- **Styling**: TailwindCSS, Shadcn/ui components
- **Animation**: WebGL fluid simulation with mouse interaction

## 📋 Prerequisites

- Node.js 18+ and npm
- Apify account and API token
- Serply API key for enhanced web search

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Required - Apify Integration
APIFY_API_TOKEN=your_apify_token_here

# Required - Web Search Integration
SERPLY_API_KEY=your_serply_key_here
```

### Getting API Keys

1. **Apify**: Sign up at [apify.com](https://apify.com) and get your API token from the console
2. **Serply**: Get your API key from [serply.io](https://serply.io) for web search functionality

## 🚀 Installation & Setup

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
   # Edit .env.local with your API keys
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How It Works

### Enhanced Data Processing Pipeline

#### Step 1: Brand Research
- Automated web search via Serply API to understand brand values and target audience
- Intelligent fallback system when API is unavailable
- Contextual analysis for better influencer matching

#### Step 2: Instagram Profile Scraping
- Real-time data extraction via Apify's Instagram scraper
- Comprehensive profile data including followers, engagement, bio, and verification status
- Enhanced error handling and data validation

#### Step 3: Personalized Analysis
- **Celebrity Recognition**: Specialized analysis for major influencers
- **Custom Biographies**: Unique descriptions based on real career achievements
- **Brand-Specific Matching**: Tailored reasons why each influencer fits the brand
- **Professional Metrics**: Accurate engagement rates and performance indicators

### Celebrity Recognition System

The platform provides specialized analysis for major influencers:

- **Cristiano Ronaldo**: Football legend analysis with philanthropic focus
- **Taylor Swift**: Music industry icon with cross-generational appeal
- **Jaime Lorente**: Spanish entertainment star (Money Heist, Elite)
- **Fabrizio Romano**: Football journalism authority
- **Kylie Jenner**: Beauty mogul and trendsetter
- **Lionel Messi**: Football excellence and family values
- **Selena Gomez**: Multi-platform entertainer and mental health advocate

## 🎯 Usage

1. **Start a Campaign**: Click "Get Started" on the landing page
2. **Enter Campaign Details**: Fill in brand name, budget, and requirements
3. **Add Influencers**: Paste Instagram handles (one per line)
4. **Review Enhanced Profiles**: See personalized analysis with real data
5. **Generate Proposal**: Create professional campaign proposals
6. **Export to CSV**: Download IKEA-format spreadsheet for client presentations

## 🔍 Example Output

### Cristiano Ronaldo Analysis
```
Biography: "Cristiano Ronaldo is a Portuguese professional footballer and global sports icon with 658M followers. Five-time Ballon d'Or winner known for his athletic excellence, philanthropic efforts, and massive business ventures."

Why This Match:
- "Global football icon with unmatched influence - perfect ambassador for Coca-Cola's worldwide reach"
- "Philanthropic efforts and business ventures align with Coca-Cola's values of making a positive impact"
- "Massive social media presence extends far beyond football, ideal for Coca-Cola's diverse audience"
```

### Taylor Swift Analysis
```
Biography: "Taylor Swift is a Grammy-winning singer-songwriter and global music icon with 281M followers. Known for record-breaking album releases, storytelling mastery, and unprecedented fan loyalty."

Why This Match:
- "Global music icon with record-breaking album releases - perfect for Coca-Cola's worldwide brand recognition"
- "Swiftie fanbase loyalty and cultural influence create unmatched brand advocacy for Coca-Cola"
- "Cross-generational appeal and storytelling mastery align with Coca-Cola's timeless brand values"
```

## 🛡️ Error Handling & Reliability

- **API Timeout Protection**: 30-second timeouts prevent hanging requests
- **Intelligent Fallbacks**: Curated data when external APIs fail
- **Enhanced Logging**: Comprehensive error tracking and debugging
- **Graceful Degradation**: System continues working even with partial API failures

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

## 🚨 Security Notes

- **Never commit API keys** to version control
- Use environment variables for all sensitive data
- Regularly rotate API tokens
- Monitor API usage and costs
- GitGuardian integration for secret detection

## 📊 Export Features

- **Professional CSV Export**: IKEA-format with 35+ columns
- **Campaign Metrics**: Detailed performance indicators
- **Client-Ready Format**: Professional presentation structure
- **Comprehensive Data**: All influencer and campaign information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@layai.com or create an issue in this repository.

---

**Built with ❤️ for the influencer marketing community** 