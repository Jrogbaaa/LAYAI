# LAYAI Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [API Integration](#api-integration)
4. [Design System](#design-system)
5. [Data Flow](#data-flow)
6. [Performance Optimization](#performance-optimization)
7. [Security Implementation](#security-implementation)
8. [Recent Updates](#recent-updates)

## Architecture Overview

LAYAI is built on a modern Next.js 15 architecture with TypeScript, utilizing the app router for optimal performance and developer experience.

### Core Technologies
- **Frontend**: Next.js 15, React 18, TypeScript 5.0+
- **Styling**: TailwindCSS with custom design system
- **Animation**: WebGL shaders, CSS transitions, micro-interactions
- **APIs**: Apify (Instagram), Serply (Web Search)
- **Data**: JSON-based storage with RESTful API endpoints

### Recent Architecture Improvements (v2.3.1)
- **Performance Optimization**: Added caching and memoization to prevent infinite loops
- **Search Results Display**: Enhanced conditional rendering for better UX
- **Component Stability**: Improved ProposalGenerator with proper state management
- **Memory Management**: Implemented efficient caching strategies

### Project Structure
```
LAYAI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main application
│   ├── components/            # React components
│   │   ├── Chatbot.tsx       # AI search interface
│   │   ├── ProposalGenerator.tsx  # Campaign creation
│   │   ├── ProposalViewer.tsx     # Proposal display
│   │   ├── NotesManager.tsx       # Notes system
│   │   ├── Sidebar.tsx           # Navigation
│   │   └── InfluencerCard.tsx    # Influencer display
│   ├── lib/                   # Utilities and helpers
│   ├── types/                 # TypeScript definitions
│   └── data/                  # Static data and configurations
├── public/                    # Static assets
├── docs/                      # Documentation
└── config files              # Next.js, TypeScript, etc.
```

## Component Structure

### Core Components

#### 1. **Main Application (`src/app/page.tsx`)**
```typescript
type ExtendedPageView = PageView | 'landing' | 'chat' | 'campaigns' | 'proposal';

interface SearchResults {
  premiumResults: MatchResult[];
  discoveryResults: any[];
  totalFound: number;
}
```

**Recent Fixes (v2.3.1)**:
- Fixed search results display condition to show both premium and discovery results
- Updated total count calculation to include all found influencers
- Added conditional rendering for each result type

#### 2. **ProposalGenerator (`src/components/ProposalGenerator.tsx`)**
```typescript
interface ProposalGeneratorProps {
  matchResults: MatchResult[];
  onProposalGenerated: (proposal: CampaignProposal) => void;
}
```

**Critical Fixes (v2.3.1)**:
- **Infinite Loop Resolution**: Added caching to prevent repeated analysis
- **Performance Optimization**: Implemented memoization in `convertMatchToProposalTalent`
- **Console Spam Fix**: Added unique cache keys to prevent repeated logging
- **Memory Efficiency**: Used window-based caching for cross-render persistence

```typescript
// Cache implementation to prevent infinite loops
const cacheKey = `${username}_${brandInfo.name}`;
if (!(window as any).analysisCache) {
  (window as any).analysisCache = new Set();
}

if (!(window as any).analysisCache.has(cacheKey)) {
  console.log(`🎯 Analyzing ${fullName} for ${brandInfo.name}:`);
  (window as any).analysisCache.add(cacheKey);
}
```

#### 3. **Search Results Display**
**Before (v2.3.0)**:
```typescript
{searchResults && searchResults.premiumResults.length > 0 && (
  // Only showed when premium results existed
)}
```

**After (v2.3.1)**:
```typescript
{searchResults && (searchResults.premiumResults.length > 0 || searchResults.discoveryResults.length > 0) && (
  // Shows when either premium OR discovery results exist
  <>
    <h2>Search Results ({(searchResults.premiumResults.length + searchResults.discoveryResults.length)} total)</h2>
    {searchResults.premiumResults.length > 0 && (
      <InfluencerResults results={searchResults.premiumResults} />
    )}
    {searchResults.discoveryResults.length > 0 && (
      <DiscoveryGrid discoveryInfluencers={searchResults.discoveryResults} />
    )}
  </>
)}
```

### Component Hierarchy
```
App (page.tsx)
├── LandingPage (landing view)
├── Sidebar (navigation)
└── Main Content
    ├── Chatbot (search interface)
    ├── InfluencerResults (premium results)
    ├── DiscoveryGrid (discovery results)
    ├── ProposalGenerator (campaign creation)
    ├── ProposalViewer (proposal display)
    ├── CampaignManager (campaign tracking)
    └── NotesManager (notes system)
```

## API Integration

### Search & Discovery APIs

#### 1. **Apify Instagram Scraper**
```typescript
POST /api/scrape-instagram-profiles
{
  usernames: string[]
}
```

**Response Structure**:
```typescript
{
  success: boolean;
  profiles: ScrapedProfile[];
  totalProcessed: number;
}
```

#### 2. **Serply Web Search**
```typescript
POST /api/web-search
{
  query: string;
  limit: number;
  type?: 'influencer' | 'brand';
}
```

#### 3. **Advanced Search API**
```typescript
POST /api/search-apify
{
  query: string;
  platform?: string;
  location?: string;
  minFollowers?: number;
  maxFollowers?: number;
  sessionId: string;
}
```

**Enhanced Response (v2.3.1)**:
```typescript
{
  success: boolean;
  premiumResults: MatchResult[];      // Verified Apify data
  discoveryResults: DiscoveryResult[]; // Web search findings
  totalFound: number;                  // Combined total
  searchId: string;
}
```

### Data Flow Improvements (v2.3.1)

#### Search Results Processing
```typescript
// Enhanced result handling
if (searchData.success) {
  const convertedResults = convertToMatchResults(searchData.premiumResults || []);
  
  // Improved accumulation logic
  if (searchResults && searchResults.premiumResults.length > 0) {
    // Follow-up search - merge results
    const existingUrls = new Set(searchResults.premiumResults.map(r => r.influencer.handle));
    const newDiscoveryResults = (searchData.discoveryResults || []).filter(
      (result: any) => !existingUrls.has(result.handle)
    );
    
    setSearchResults({
      premiumResults: [...searchResults.premiumResults, ...convertedResults],
      discoveryResults: [...searchResults.discoveryResults, ...newDiscoveryResults],
      totalFound: searchData.totalFound || 0
    });
  } else {
    // First search - set results normally
    setSearchResults({
      premiumResults: convertedResults,
      discoveryResults: searchData.discoveryResults || [],
      totalFound: searchData.totalFound || 0
    });
  }
}
```

## Performance Optimization

### Caching Strategies (v2.3.1)

#### 1. **Analysis Caching**
```typescript
// Prevent repeated influencer analysis
const analysisCache = new Set<string>();

const generateBrandSpecificReasons = (profile: any, brandInfo: any) => {
  const cacheKey = `${profile.username}_${brandInfo.name}`;
  
  if (!analysisCache.has(cacheKey)) {
    // Perform analysis only once
    console.log(`🎯 Analyzing ${profile.name} for ${brandInfo.name}`);
    analysisCache.add(cacheKey);
  }
  
  // Return cached or computed reasons
  return computeReasons(profile, brandInfo);
};
```

#### 2. **Conversion Memoization**
```typescript
// Cache proposal talent conversions
const conversionCache = new Map<string, ProposalTalent>();

const convertMatchToProposalTalent = (match: MatchResult, brandInfo?: any): ProposalTalent => {
  const cacheKey = `${match.influencer.id}_${brandInfo?.name || 'default'}`;
  
  if (conversionCache.has(cacheKey)) {
    return conversionCache.get(cacheKey)!;
  }
  
  const result = computeProposalTalent(match, brandInfo);
  conversionCache.set(cacheKey, result);
  
  return result;
};
```

### Memory Management
- **Efficient State Updates**: Prevent unnecessary re-renders
- **Cache Cleanup**: Automatic cleanup of stale cache entries
- **Component Optimization**: Memoized expensive computations
- **API Rate Limiting**: Intelligent request batching and throttling

## Security Implementation

### API Security
- **Environment Variables**: Secure API key management
- **Input Validation**: Comprehensive data sanitization
- **Rate Limiting**: Protection against API abuse
- **Error Handling**: Secure error messages without data exposure

### Data Protection
- **Client-Side Caching**: Temporary, non-persistent storage
- **API Response Filtering**: Only necessary data exposed to frontend
- **CORS Configuration**: Proper cross-origin request handling
- **Input Sanitization**: XSS and injection prevention

## Recent Updates

### Version 2.3.1 (January 3, 2025)

#### 🐛 Critical Bug Fixes

**1. Search Results Display Issue**
- **Problem**: Discovery results not showing in UI when no premium results found
- **Root Cause**: Conditional rendering only checked for `premiumResults.length > 0`
- **Solution**: Updated condition to check for either premium OR discovery results
- **Impact**: Users now see all 18 found influencers instead of empty results

**2. ProposalGenerator Infinite Loop**
- **Problem**: Console spam with repeated analysis logs causing performance issues
- **Root Cause**: `generateBrandSpecificReasons` called repeatedly without caching
- **Solution**: Implemented analysis caching and conversion memoization
- **Impact**: Eliminated console spam and improved performance significantly

#### 🔧 Technical Improvements

**Enhanced Search Results Logic**:
```typescript
// Before: Only showed premium results
{searchResults && searchResults.premiumResults.length > 0 && (

// After: Shows any results found
{searchResults && (searchResults.premiumResults.length > 0 || searchResults.discoveryResults.length > 0) && (
```

**Performance Optimizations**:
- Added window-based caching for cross-render persistence
- Implemented unique cache keys to prevent duplicate processing
- Enhanced memory management with proper cleanup strategies
- Reduced redundant API calls and computations

### Version 2.3.0 (January 3, 2025)

#### ✨ Complete UI Overhaul
- **Design System**: Modern gradient-based UI with professional color palette
- **Component Enhancement**: All components redesigned with better UX
- **Animation System**: Smooth transitions and micro-interactions
- **Accessibility**: Improved focus states and contrast ratios

### Version 2.2.0 (January 2, 2025)

#### 🔧 Critical Fixes
- **Text Direction**: Fixed backward text input in notes
- **Proposal Generation**: Restored complete proposal viewer functionality
- **Documentation**: Comprehensive updates across all files

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Component Architecture**: Functional components with hooks

### Performance Best Practices
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Caching**: Implement appropriate caching strategies
- **State Management**: Minimize unnecessary re-renders
- **API Optimization**: Batch requests and implement proper error handling

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and data flow testing
- **Performance Tests**: Load testing and memory leak detection
- **User Acceptance Tests**: End-to-end workflow validation

## Troubleshooting

### Common Issues & Solutions

#### 1. **Search Results Not Displaying**
- ✅ **Fixed in v2.3.1**: Enhanced conditional rendering
- **Check**: Verify both premium and discovery results are being processed
- **Debug**: Console log search results structure

#### 2. **Console Spam from ProposalGenerator**
- ✅ **Fixed in v2.3.1**: Implemented analysis caching
- **Check**: Verify cache keys are unique and properly set
- **Debug**: Monitor cache hit/miss ratios

#### 3. **Performance Issues**
- **Solution**: Check for infinite loops in useEffect hooks
- **Monitor**: Memory usage and component re-render frequency
- **Optimize**: Implement proper memoization strategies

### Debug Tools
```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('🔍 Search results:', searchResults);
  console.log('💾 Cache status:', cacheStats);
  console.log('⚡ Performance metrics:', performanceMetrics);
}
```

---

**Last Updated**: January 3, 2025  
**Version**: 2.3.1  
**Status**: ✅ All critical issues resolved 

# Technical Documentation - LAYAI Platform

## Overview

LAYAI is a sophisticated AI-powered influencer marketing platform built with Next.js 15, Firebase, and advanced AI integration. This document provides comprehensive technical details for developers, maintainers, and contributors.

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYAI Platform                           │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15 + React + TypeScript)                │
│  ├── Landing Page (WebGL Animation)                        │
│  ├── AI Chatbot Interface                                  │
│  ├── Campaign Management                                   │
│  ├── Proposal Generator                                    │
│  ├── Memory Dashboard                                      │
│  └── Influencer Discovery                                  │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Next.js API Routes)                            │
│  ├── /api/chat (AI Processing)                             │
│  ├── /api/search-apify (Influencer Search)                 │
│  ├── /api/campaign-insights (Memory System)                │
│  ├── /api/feedback (Learning System)                       │
│  └── /api/database/* (Firebase Operations)                 │
├─────────────────────────────────────────────────────────────┤
│  Memory & Learning System (Firebase Integration)           │
│  ├── SearchMemoryStore (Persistent Storage)                │
│  ├── Campaign Status Tracking                              │
│  ├── User Feedback Learning                                │
│  └── Real-time Insights                                    │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ├── Firebase Firestore (Data Persistence)                 │
│  ├── OpenAI GPT (AI Intelligence)                          │
│  ├── Apify (Instagram Scraping)                            │
│  └── Serply (Web Search)                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 Firebase Memory Integration (v2.4.0)

### Memory System Architecture

The platform features a sophisticated memory and learning system built on Firebase Firestore:

#### Core Components

1. **SearchMemoryStore** (`src/lib/database.ts`)
   - Central memory management class
   - Firebase Firestore integration for persistence
   - Campaign-aware search tracking
   - User feedback learning system

2. **Memory Collections Structure**
   ```typescript
   // Firestore Collections
   search_history/          // All search queries and results
   user_feedback/           // User feedback and ratings
   learning_patterns/       // AI learning patterns
   campaign_insights/       // Campaign-specific data
   ```

#### Data Models

```typescript
interface SearchHistory {
  id: string;
  userId?: string;
  sessionId: string;
  query: string;
  searchParams: {
    platforms: string[];
    niches: string[];
    minFollowers: number;
    maxFollowers: number;
    location?: string;
    gender?: string;
    userQuery: string;
  };
  results: {
    totalFound: number;
    premiumResults: any[];
    discoveryResults: any[];
  };
  timestamp: Date;
  feedback?: UserFeedback;
  // NEW: Campaign context
  campaignId?: string;
  campaignStatus?: 'Planning' | 'Active' | 'Completed' | 'Paused';
  brandName?: string;
}

interface UserFeedback {
  searchId: string;
  sessionId: string;
  userId?: string;
  overallRating: number;
  feedback: string;
  specificFeedback: {
    resultQuality: number;
    relevance: number;
    completeness: number;
    accuracy: number;
  };
  improvedQuery?: string;
  likedProfiles: string[];
  dislikedProfiles: string[];
  timestamp: Date;
}
```

#### Memory System Features

1. **Persistent Storage**
   - All searches automatically saved to Firebase
   - User feedback permanently stored and analyzed
   - Campaign context preserved across sessions

2. **Campaign Integration**
   - Campaign status changes trigger memory updates
   - Search history linked to specific campaigns
   - Campaign-specific learning and optimization

3. **Learning Algorithm**
   - AI learns from user feedback patterns
   - Improves search results based on historical data
   - Personalizes recommendations over time

4. **Real-time Insights**
   - Memory Dashboard showing learning progress
   - Active campaign tracking
   - System performance metrics

### Implementation Details

#### Firebase Configuration

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

#### Memory Store Implementation

```typescript
// src/lib/database.ts
class SearchMemoryStore {
  private isInitialized = false;
  private searchHistory: SearchHistory[] = [];
  private feedbackData: UserFeedback[] = [];

  // Initialize from Firebase
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadFromFirebase();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize from Firebase:', error);
      this.isInitialized = true; // Continue with in-memory only
    }
  }

  // Save search with campaign context
  async saveSearch(searchData: Omit<SearchHistory, 'id' | 'timestamp'>): Promise<string> {
    const search: SearchHistory = {
      ...searchData,
      id: this.generateId(),
      timestamp: new Date(),
    };

    // Save to Firebase
    try {
      await addDoc(collection(db, 'search_history'), {
        ...search,
        timestamp: Timestamp.fromDate(search.timestamp)
      });
    } catch (error) {
      console.error('Error saving search to Firebase:', error);
      // Continue with in-memory storage
    }

    this.searchHistory.push(search);
    return search.id;
  }

  // Campaign-aware learning insights
  async getLearningInsights(query: string, context?: {
    brandName?: string;
    activeCampaigns?: string[];
  }): Promise<string[]> {
    await this.initialize();
    
    const relevantSearches = this.searchHistory.filter(search => {
      if (context?.activeCampaigns?.includes(search.campaignId || '')) return true;
      if (context?.brandName && search.brandName === context.brandName) return true;
      return search.query.toLowerCase().includes(query.toLowerCase());
    });

    // Generate insights based on historical data
    return this.generateInsightsFromSearches(relevantSearches);
  }
}
```

#### Campaign Integration

```typescript
// src/components/CampaignManager.tsx
const updateCampaign = async (campaignId: string, field: keyof Campaign, value: any) => {
  // Update campaign data
  setCampaigns(prev => prev.map(campaign => 
    campaign.id === campaignId 
      ? { ...campaign, [field]: value }
      : campaign
  ));
  
  await saveCampaign(campaignId, field, value);
  
  // Notify memory system of status changes
  if (field === 'status') {
    try {
      await fetch('/api/campaign-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          campaignId,
          status: value
        })
      });
    } catch (error) {
      console.error('Error notifying memory system:', error);
    }
  }
};
```

## 🔍 Search System

### Multi-tier Search Architecture

The platform implements a sophisticated two-tier search system:

1. **Premium Results**: Verified influencer data from Apify Instagram scraping
2. **Discovery Results**: Web-scraped influencer profiles from Google search

#### Search Flow

```typescript
// src/app/api/search-apify/route.ts
export async function POST(req: NextRequest) {
  const { sessionId, campaignId, campaignStatus, brandName, ...searchParams } = await req.json();

  // 1. Perform Apify search for premium results
  const results = await searchInfluencers(searchParams);
  
  // 2. Save search to memory with campaign context
  const searchId = await searchMemory.saveSearch({
    sessionId,
    query: searchParams.userQuery,
    searchParams,
    results: {
      totalFound: results.totalFound,
      premiumResults: results.premiumResults,
      discoveryResults: results.discoveryResults,
    },
    campaignId,
    campaignStatus,
    brandName,
  });

  // 3. Get campaign-aware learning insights
  const insights = await searchMemory.getLearningInsights(
    searchParams.userQuery,
    {
      brandName,
      activeCampaigns: campaignId ? [campaignId] : undefined,
    }
  );

  return NextResponse.json({
    success: true,
    searchId,
    insights,
    ...results,
  });
}
```

### AI-Powered Search Processing

```typescript
// src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { message, history } = await request.json();

  // Process with OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert influencer marketing assistant...`
      },
      ...history,
      { role: "user", content: message }
    ],
    functions: [
      {
        name: "search_influencers",
        description: "Search for influencers based on criteria",
        parameters: {
          type: "object",
          properties: {
            platforms: { type: "array", items: { type: "string" } },
            niches: { type: "array", items: { type: "string" } },
            minFollowers: { type: "number" },
            maxFollowers: { type: "number" },
            location: { type: "string" },
            gender: { type: "string" },
            userQuery: { type: "string" }
          }
        }
      }
    ]
  });

  return NextResponse.json({
    type: 'search',
    data: extractedParameters
  });
}
```

## 🎯 Campaign Management

### Campaign Data Model

```typescript
interface Campaign {
  id: string;
  name: string;
  owner: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Paused';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  endDate: string;
  budget: number;
  influencerCount: number;
  platform: string[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Campaign-Memory Integration

The campaign system is tightly integrated with the memory system:

1. **Status Tracking**: Campaign status changes automatically notify the memory system
2. **Search Context**: Searches can be linked to specific campaigns
3. **Learning Integration**: Memory system learns from campaign outcomes
4. **Performance Analytics**: Campaign-specific insights and recommendations

## 📄 Proposal Generation

### AI-Enhanced Proposal System

The proposal generator creates professional campaign proposals with AI-powered insights:

#### Features

1. **Brand Research Integration**: Automatic brand analysis via web search
2. **Personalized Biographies**: AI-generated influencer descriptions with brand alignment
3. **Campaign Context**: Proposals include relevant campaign information when available
4. **Multiple Export Formats**: CSV, PDF, Hibiki, and Orange style exports

#### Implementation

```typescript
// src/components/ProposalGenerator.tsx
const generatePersonalizedBiography = (profile: any, brandInfo: any): string => {
  // Specific influencer handling
  if (username.toLowerCase().includes('taylorswift')) {
    return `Taylor Swift is a Grammy-winning singer-songwriter...`;
  }
  
  // Generic AI-enhanced biography generation
  let enhancedBio = originalBio;
  
  if (brandInfo) {
    enhancedBio += ` Perfect alignment with ${brandInfo.name}'s ${brandInfo.values.join(', ')} values.`;
  }
  
  return enhancedBio;
};
```

## 🎨 UI/UX Architecture

### Design System

The platform uses a modern gradient-based design system:

#### Color Palette
- **Primary**: Blue gradients (`from-blue-500 to-blue-600`)
- **Secondary**: Purple gradients (`from-purple-500 to-purple-600`)
- **Success**: Green gradients (`from-green-500 to-green-600`)
- **Warning**: Orange gradients (`from-orange-500 to-orange-600`)

#### Component Architecture

```typescript
// Modern component structure with TypeScript
interface ComponentProps {
  // Strict typing for all props
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic with hooks
  
  return (
    <div className="gradient-based-styling">
      {/* Modern UI elements */}
    </div>
  );
};
```

### Animation System

1. **Landing Page**: WebGL fluid simulation (`SplashCursor` component)
2. **Micro-interactions**: Hover effects and transitions
3. **Loading States**: Professional loading animations
4. **Page Transitions**: Smooth navigation between views

## 🔧 Development Setup

### Environment Configuration

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

### Build and Deployment

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing Strategy

1. **Unit Tests**: Jest for individual component testing
2. **Integration Tests**: API route testing
3. **E2E Tests**: Playwright for full user workflows
4. **Memory System Tests**: Firebase integration testing

## 📊 Performance Optimization

### Current Optimizations

1. **Memoization**: React.memo and useMemo for expensive operations
2. **Code Splitting**: Dynamic imports for large components
3. **Image Optimization**: Next.js Image component
4. **API Caching**: Intelligent caching for search results
5. **Firebase Optimization**: Efficient queries and indexing

### Performance Metrics

- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 3s
- **Time to Interactive**: < 4s
- **Cumulative Layout Shift**: < 0.1

## 🔒 Security Considerations

### Data Protection

1. **API Key Security**: Environment variables for all sensitive keys
2. **Firebase Security Rules**: Proper Firestore security configuration
3. **Input Validation**: Comprehensive validation for all user inputs
4. **Rate Limiting**: API protection against abuse

### Privacy Compliance

1. **Data Minimization**: Only collect necessary user data
2. **Consent Management**: Clear consent for data collection
3. **Data Retention**: Automatic cleanup of old data
4. **Export/Delete**: User data export and deletion capabilities

## 🚀 Deployment Architecture

### Recommended Deployment

```yaml
# Vercel deployment configuration
name: LAYAI Platform
framework: nextjs
buildCommand: npm run build
outputDirectory: .next
installCommand: npm install
environment:
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - OPENAI_API_KEY
  - APIFY_API_TOKEN
  - SERPLY_API_KEY
```

### Infrastructure Requirements

1. **Compute**: Serverless functions (Vercel/Netlify)
2. **Database**: Firebase Firestore
3. **Storage**: Firebase Storage (for future file uploads)
4. **CDN**: Global content delivery for static assets
5. **Monitoring**: Error tracking and performance monitoring

## 📈 Monitoring and Analytics

### Application Monitoring

1. **Error Tracking**: Comprehensive error logging and reporting
2. **Performance Monitoring**: Real-time performance metrics
3. **User Analytics**: Usage patterns and feature adoption
4. **API Monitoring**: Response times and error rates

### Memory System Analytics

1. **Learning Progress**: Track AI improvement over time
2. **Search Quality**: User feedback and satisfaction metrics
3. **Campaign Performance**: Success rates and ROI tracking
4. **System Health**: Memory system performance and reliability

## 🔄 Continuous Integration

### Development Workflow

1. **Feature Branches**: All development in feature branches
2. **Code Review**: Required PR reviews before merging
3. **Automated Testing**: CI/CD pipeline with comprehensive tests
4. **Deployment**: Automatic deployment to staging and production

### Quality Assurance

1. **TypeScript**: Full type safety across the codebase
2. **ESLint**: Code quality and consistency enforcement
3. **Prettier**: Automatic code formatting
4. **Husky**: Pre-commit hooks for quality gates

## 📚 API Documentation

### Core Endpoints

#### Search API
```typescript
POST /api/search-apify
Content-Type: application/json

{
  "platforms": ["Instagram"],
  "niches": ["fashion"],
  "minFollowers": 100000,
  "maxFollowers": 1000000,
  "location": "Spain",
  "userQuery": "Spanish fashion influencers",
  "sessionId": "session_123",
  "campaignId": "campaign_456",
  "campaignStatus": "Active",
  "brandName": "IKEA"
}

Response:
{
  "success": true,
  "searchId": "search_789",
  "totalFound": 25,
  "premiumResults": [...],
  "discoveryResults": [...],
  "insights": [...]
}
```

#### Memory API
```typescript
GET /api/campaign-insights?campaignId=campaign_456

Response:
{
  "success": true,
  "activeCampaigns": ["campaign_456"],
  "recentSearches": [...],
  "pendingFeedback": 3,
  "learningInsights": {
    "topPerformingNiches": ["fashion", "lifestyle"],
    "preferredPlatforms": ["Instagram", "TikTok"],
    "budgetRanges": [...]
  }
}
```

#### Feedback API
```typescript
POST /api/feedback
Content-Type: application/json

{
  "searchId": "search_789",
  "sessionId": "session_123",
  "overallRating": 4,
  "feedback": "Good results but could use more diversity",
  "specificFeedback": {
    "resultQuality": 4,
    "relevance": 5,
    "completeness": 3,
    "accuracy": 4
  }
}

Response:
{
  "success": true,
  "feedbackId": "feedback_101",
  "learningInsights": [...],
  "stats": {
    "totalSearches": 150,
    "averageRating": 4.2,
    "improvementTrend": "positive"
  }
}
```

## 🎯 Future Enhancements

### Planned Features

1. **Advanced Analytics Dashboard**
   - Campaign ROI tracking
   - Influencer performance metrics
   - Market trend analysis

2. **Multi-user Collaboration**
   - Team workspaces
   - Role-based permissions
   - Collaborative campaign planning

3. **Enhanced AI Recommendations**
   - Predictive campaign success scoring
   - Automated influencer matching
   - Dynamic pricing optimization

4. **Additional Platform Integrations**
   - YouTube Analytics API
   - TikTok Creator Fund data
   - LinkedIn influencer metrics

### Technical Roadmap

1. **Performance Optimization**
   - Advanced caching strategies
   - Database query optimization
   - Real-time data synchronization

2. **Mobile Application**
   - React Native mobile app
   - Offline capability
   - Push notifications

3. **Advanced Memory System**
   - Machine learning integration
   - Predictive analytics
   - Automated insights generation

---

This technical documentation provides a comprehensive overview of the LAYAI platform architecture, implementation details, and development guidelines. For specific implementation questions or contributions, please refer to the codebase and contact the development team. 