# LAYAI - AI-Powered Influencer Marketing Platform

![LAYAI Platform](https://img.shields.io/badge/LAYAI-v2.4.0-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Integration-orange?style=for-the-badge&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

**LAYAI** is a sophisticated AI-powered influencer marketing platform that helps brands discover, analyze, and collaborate with the perfect influencers for their campaigns. Built with Next.js, Firebase, and advanced AI integration.

## 🚀 Latest Features (v2.4.0)

### 🧠 **Firebase Memory Integration & Learning System**
- **Persistent Memory**: Complete Firebase integration for permanent storage of searches, feedback, and learning patterns
- **Campaign-Aware Learning**: Memory system tracks campaign statuses and learns from campaign-specific interactions
- **Smart Feedback Loop**: User feedback ("insufficient response") is permanently stored and used to improve future searches
- **Memory Dashboard**: Real-time insights into system learning and active campaigns

### 🎯 **Enhanced Campaign Management**
- **Status Tracking**: Campaign status changes automatically notify the memory system
- **Context-Aware Proposals**: Proposal generator now includes campaign context when available
- **Learning Integration**: System learns from campaign outcomes and user preferences

### 💡 **Improved User Experience**
- **Flexible Input**: Instagram influencer input now supports both comma AND newline separation
- **Real-time Insights**: Memory dashboard shows learning progress and system status
- **Campaign Context**: Visual indicators when working within specific campaign contexts

## ✨ Core Features

### 🔍 **Advanced Influencer Discovery**
- **Real-time Search**: Live Instagram profile scraping via Apify integration
- **Multi-tier Results**: Premium verified influencers + Discovery results from web search
- **AI-Powered Matching**: Intelligent compatibility scoring and recommendations
- **Multi-Platform Support**: Instagram, TikTok, YouTube, and Twitter integration

### 📊 **Professional Campaign Management**
- **Campaign Tracking**: Full CRUD operations with status management (Planning/Active/Completed/Paused)
- **Memory Integration**: Campaign status changes trigger learning system updates
- **Performance Analytics**: Track campaign performance and influencer success rates
- **Team Collaboration**: Shared campaign workspace with notes and feedback

### 🤖 **AI-Powered Intelligence**
- **Smart Chatbot**: Natural language search with context understanding
- **Brand Research**: Automated brand analysis and influencer alignment
- **Learning System**: Continuous improvement based on user feedback and campaign outcomes
- **Personalized Recommendations**: AI learns user preferences and campaign patterns

### 📄 **Professional Proposal Generation**
- **AI-Enhanced Biographies**: Context-aware influencer descriptions with brand alignment
- **Multiple Export Formats**: CSV, PDF, Hibiki, and Orange style exports
- **Brand Research Integration**: Automatic brand analysis and value alignment
- **Campaign Context**: Proposals include relevant campaign information when available

### 💾 **Persistent Memory & Learning**
- **Firebase Integration**: All data permanently stored in Firebase Firestore
- **Search History**: Complete search and feedback history with campaign context
- **Learning Patterns**: AI learns from user interactions and campaign outcomes
- **Real-time Insights**: Memory dashboard with system status and learning metrics

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.3.3, React, TypeScript
- **Styling**: Tailwind CSS with custom gradient design system
- **Database**: Firebase Firestore for persistent storage
- **AI Integration**: OpenAI GPT for intelligent search and recommendations
- **Data Sources**: Apify (Instagram), Serply (Web Search), Custom APIs
- **Animation**: WebGL fluid simulation for landing page
- **Authentication**: Firebase Auth ready (configurable)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- API keys for integrations

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

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # AI Integration
   OPENAI_API_KEY=your_openai_api_key

   # Data Sources
   APIFY_API_TOKEN=your_apify_token
   SERPLY_API_KEY=your_serply_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### 🔍 **Influencer Search**
1. Use the AI chatbot to describe your campaign needs
2. Get real-time results from multiple sources
3. Review premium verified and discovery influencers
4. Provide feedback to improve future searches

### 🎯 **Campaign Management**
1. Create campaigns with status tracking
2. Link searches to specific campaigns
3. Monitor campaign progress and status changes
4. View campaign-specific learning insights

### 📄 **Proposal Generation**
1. Select influencers from search results
2. Add campaign context if available
3. Generate AI-powered proposals with brand research
4. Export in multiple professional formats

### 🧠 **Memory & Learning**
1. Access the Memory Dashboard from the sidebar
2. View real-time learning insights and system status
3. Monitor active campaigns and recent activity
4. Track how the AI improves over time

## 🏗️ Architecture

### **Frontend Structure**
```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   ├── chat/          # AI chatbot endpoint
│   │   ├── search-apify/  # Influencer search
│   │   ├── feedback/      # User feedback collection
│   │   ├── campaign-insights/ # Memory system integration
│   │   └── database/      # Firebase operations
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main application
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Chatbot.tsx       # AI-powered search interface
│   ├── CampaignManager.tsx # Campaign management
│   ├── ProposalGenerator.tsx # Proposal creation
│   ├── MemoryDashboard.tsx # Memory system insights
│   └── ...
├── lib/                  # Utility libraries
│   ├── database.ts       # Firebase memory integration
│   ├── firebase.ts       # Firebase configuration
│   ├── apifyService.ts   # Instagram data fetching
│   └── ...
└── types/               # TypeScript type definitions
```

### **Memory System Architecture**
- **SearchMemoryStore**: Central memory management with Firebase persistence
- **Campaign Integration**: Automatic status tracking and learning
- **Feedback Loop**: User feedback drives continuous improvement
- **Real-time Insights**: Live dashboard with learning metrics

## 🔧 Configuration

### **Firebase Setup**
1. Create a Firebase project
2. Enable Firestore Database
3. Configure authentication (optional)
4. Add your configuration to `.env.local`

### **API Integrations**
- **Apify**: Instagram profile scraping
- **Serply**: Web search for influencer discovery
- **OpenAI**: AI-powered search and recommendations

## 📊 Memory System

The platform includes a sophisticated memory and learning system:

### **Features**
- **Persistent Storage**: All searches and feedback stored in Firebase
- **Campaign Awareness**: Memory linked to specific campaigns
- **Learning Algorithm**: AI improves based on user feedback
- **Real-time Insights**: Dashboard showing learning progress

### **How It Works**
1. **Search Tracking**: Every search is saved with campaign context
2. **Feedback Learning**: User feedback permanently stored and analyzed
3. **Pattern Recognition**: System learns successful influencer patterns
4. **Continuous Improvement**: AI gets smarter with each interaction

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our GitHub Discussions

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-user collaboration features
- [ ] Enhanced AI recommendations
- [ ] Additional platform integrations
- [ ] Performance optimization
- [ ] Mobile app development

---

**Built with ❤️ by the LAYAI Team**

*Empowering brands to create authentic connections with their perfect influencer matches through AI-powered intelligence and data-driven insights.* 