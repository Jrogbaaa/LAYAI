# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Architecture

LAYAI is an AI-powered influencer marketing platform built with Next.js 14, TypeScript, and Firebase. The system combines a comprehensive Spanish influencer database with real-time search capabilities and advanced AI matching algorithms.

### Key Components Architecture

**Frontend Structure:**
- `src/app/page.tsx` - Main application entry point with view state management
- `src/components/` - React components organized by feature
- `src/lib/` - Core business logic and services
- `src/types/` - TypeScript type definitions

**Backend Services:**
- `src/app/api/` - Next.js API routes for server-side operations
- `src/lib/firebase.ts` - Firebase configuration and initialization
- `src/lib/apifyService.ts` - Real-time influencer discovery with rate limiting
- `src/lib/enhancedSearchService.ts` - Multi-source search orchestration
- `src/lib/vettedInfluencersService.ts` - Local database search (3000+ influencers)

**Search Architecture:**
The platform uses a dual-tier search system:
1. **Database Search** - Fast local search against vetted influencers database
2. **Real-time Discovery** - Live scraping via Apify and Serply APIs with circuit breakers

**AI Integration:**
- `src/lib/briefProcessor.ts` - GPT-4 powered campaign brief analysis
- `src/lib/enhancedMatchingService.ts` - 7-dimensional scoring system
- `src/lib/brandIntelligence.ts` - Brand compatibility analysis
- `src/lib/aestheticIntelligence.ts` - Content aesthetic matching

## Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server

# Testing
npm test                       # Run unit tests (Jest)
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Generate coverage report
npm run test:e2e               # Run end-to-end tests (Playwright)
npm run test:e2e:ui            # Run E2E tests with UI
npm run test:e2e:debug         # Debug E2E tests
npm run test:production        # Run E2E tests against production

# Linting
npm run lint                   # Run ESLint
```

## Critical System Components

### Rate Limiting & Circuit Breakers
- **SerplyRateLimiter** in `apifyService.ts` - 4-second intervals with exponential backoff
- **CircuitBreaker** in `circuitBreaker.ts` - Prevents cascade failures for external APIs
- **Firebase Write Throttling** - 15 writes per 1.5 seconds to prevent quota exhaustion

### Search Flow
1. User query → `SearchInterface` component
2. Query processing → `enhancedSearchService.ts` orchestrates search
3. Database search → `vettedInfluencersService.ts` (instant results)
4. Real-time search → `apifyService.ts` (progressive loading)
5. Results merging → Advanced deduplication and quality scoring

### Campaign Management
- **Enhanced Campaign Service** - Full lifecycle management with Firebase integration
- **Proposal Generator** - PDF brief analysis and AI-powered matching
- **Performance Prediction** - ML-based campaign success forecasting

## Database Structure

### Local Data
- `processed_influencers.json` - 3000+ Spanish influencers with demographics
- `data/campaigns.json` - Campaign data backup
- `data/notes.json` - User notes and feedback

### Firebase Collections
- `campaigns` - Campaign metadata and search history
- `notes` - User feedback and system improvements
- `enhanced_influencers` - Enhanced demographic data (2996 influencers)

## API Integration Points

### External APIs
- **Apify** - Instagram/TikTok profile scraping
- **Serply** - Web search for influencer discovery
- **StarNgage** - Real audience demographic data
- **OpenAI GPT-4** - Brief analysis and natural language processing

### Internal APIs
- `/api/enhanced-search` - Progressive search with streaming results
- `/api/enhanced-brief-matching` - Complete brief processing pipeline
- `/api/campaign-insights` - Performance analytics and predictions
- `/api/firebase-throttler-status` - Real-time system health monitoring

## Key Technical Patterns

### Error Handling
- Circuit breakers prevent external API failures from cascading
- Graceful degradation when services are unavailable
- Comprehensive logging with structured error context

### Performance Optimization
- Smart caching for repeated searches
- Progressive loading for better UX
- Efficient deduplication algorithms
- Firebase write throttling to prevent quota exhaustion

### Data Quality
- Multi-tier validation for influencer profiles
- Advanced filtering system removes fake/inactive accounts
- Real-time quality scoring for search results
- Demographic data enhancement with fallback strategies

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Service layer testing with mocked dependencies
- Algorithm validation and edge case coverage
- API integration testing with mock responses

### E2E Tests (`tests/e2e/`)
- Complete user workflow validation
- Cross-browser compatibility testing
- Performance and load testing scenarios
- Production environment validation

## Environment Configuration

Required environment variables:
- `OPENAI_API_KEY` - GPT-4 API access
- `APIFY_API_KEY` - Profile scraping service
- `SERPLY_API_KEY` - Web search API
- `SERPAPI_KEY` - Alternative search API
- `FIREBASE_*` - Firebase project configuration
- `NEXT_PUBLIC_*` - Client-side Firebase config

## Development Workflow

1. **Feature Development** - Create components in `src/components/`, services in `src/lib/`
2. **API Integration** - Add routes in `src/app/api/`, implement with proper error handling
3. **Testing** - Write unit tests for services, E2E tests for user flows
4. **Performance** - Monitor Firebase usage, optimize API calls, implement caching
5. **Deployment** - Vercel deployment with environment variable configuration

## Common Troubleshooting

- **504 Gateway Timeout** - Check circuit breaker status and API rate limits
- **Firebase Quota Exceeded** - Review write throttling configuration
- **Search Results Empty** - Verify API keys and external service availability
- **Test Failures** - Check timeout settings in `jest.config.js` (currently 30s)

## Architecture Decisions

- **Next.js 14** - Full-stack framework with API routes
- **TypeScript** - Type safety across the entire codebase
- **Firebase** - Real-time database and authentication
- **Tailwind CSS** - Utility-first styling with responsive design
- **Local JSON + Firebase** - Hybrid data strategy for performance and persistence