# LAYAI Technical Documentation

## Architecture Overview

LAYAI is built as a modern Next.js application with a focus on AI-powered influencer discovery and campaign management. The system integrates multiple external APIs and provides a sophisticated user interface with real-time data processing.

### Core Technologies

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: TailwindCSS with custom CSS architecture
- **UI Components**: Shadcn/ui with custom enhancements
- **Animation**: WebGL-based fluid simulation
- **Data Storage**: JSON-based with API endpoints

## System Architecture

### Frontend Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── database/      # Data management endpoints
│   │   └── scrape-instagram-profiles/ # Instagram scraping
│   ├── globals.css        # Global styles and fixes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── splash-cursor.tsx    # WebGL animation
│   │   ├── enhanced-button.tsx  # Enhanced button system
│   │   └── enhanced-card.tsx    # Modern card components
│   ├── LandingPage.tsx   # Main landing page
│   ├── ProposalGenerator.tsx # Campaign proposal system
│   ├── NotesManager.tsx  # Notes management system
│   └── CampaignManager.tsx # Campaign tracking
└── lib/                  # Utility functions
```

### API Integration Layer

#### External APIs
1. **Apify Instagram Scraper**
   - Real-time profile data extraction
   - Follower counts, engagement rates, verification status
   - Comprehensive profile information

2. **Serply Web Search**
   - Brand research and analysis
   - Contextual information gathering
   - Intelligent fallback systems

#### Internal APIs
- `/api/database/campaigns` - Campaign management
- `/api/database/notes` - Notes system
- `/api/scrape-instagram-profiles` - Instagram data processing

## Recent Critical Fixes

### Text Direction Issue (v2.1.0)

#### Problem
Users experienced text appearing backward when typing (e.g., "hey" showing as "yeh"). This was caused by CSS conflicts affecting text direction and unicode bidirectional handling.

#### Root Cause Analysis
- CSS transforms potentially flipping text horizontally
- Missing or conflicting `direction` properties
- Unicode bidirectional text handling issues
- Browser-specific rendering inconsistencies

#### Solution Implementation

**Global CSS Fix in `globals.css`:**
```css
/* Fix for text appearing backward */
* {
  direction: ltr !important;
  unicode-bidi: normal !important;
}

input, textarea, [contenteditable] {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: normal !important;
  transform: none !important;
}
```

#### Technical Details
- **`direction: ltr !important`**: Forces left-to-right text direction
- **`unicode-bidi: normal !important`**: Prevents bidirectional text issues
- **`text-align: left !important`**: Ensures proper text alignment
- **`transform: none !important`**: Prevents horizontal flipping transforms

### WebGL Animation System

#### Implementation
The splash cursor uses sophisticated WebGL shaders for fluid simulation:

**Vertex Shader:**
```glsl
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

**Fragment Shader Features:**
- HSV to RGB color conversion
- Fractal Brownian Motion (FBM) for organic patterns
- Multi-layer color blending
- Mouse interaction response
- Edge fading for seamless integration

#### Performance Optimizations
- Efficient shader compilation and caching
- Optimized vertex buffer management
- 60fps rendering with requestAnimationFrame
- Memory-efficient resource cleanup

## Data Processing Pipeline

### Instagram Profile Processing

#### Step 1: Data Extraction
```typescript
// Apify Instagram Scraper integration
const apifyResponse = await fetch('https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    startUrls: profiles.map(handle => ({ url: `https://instagram.com/${handle}` })),
    resultsLimit: profiles.length,
  }),
});
```

#### Step 2: Data Transformation
```typescript
const transformedProfile = {
  username: profile.username,
  fullName: profile.fullName,
  biography: profile.biography,
  followersCount: profile.followersCount,
  isVerified: profile.isVerified,
  postsCount: profile.postsCount,
  // Enhanced fields
  engagementRate: calculateEngagementRate(profile),
  category: detectCategory(profile),
  location: extractLocation(profile),
};
```

#### Step 3: Celebrity Recognition
```typescript
const generatePersonalizedBiography = (profile) => {
  // Celebrity-specific analysis
  if (username.toLowerCase().includes('cristiano')) {
    return `Cristiano Ronaldo is a Portuguese professional footballer and global sports icon with ${(followers/1000000).toFixed(1)}M followers...`;
  }
  
  // Generic biography generation
  return enhancedBio;
};
```

### Brand Research Integration

#### Serply API Implementation
```typescript
const searchBrand = async (brandName: string) => {
  try {
    const response = await fetch(`https://api.serply.io/v1/search/q=${encodeURIComponent(brandName)}`, {
      headers: {
        'X-API-KEY': process.env.SERPLY_API_KEY!,
        'X-User-Agent': 'desktop',
        'X-Proxy-Location': 'US',
      },
      signal: AbortSignal.timeout(30000), // 30-second timeout
    });
    
    return await response.json();
  } catch (error) {
    // Intelligent fallback system
    return getFallbackBrandData(brandName);
  }
};
```

## Component Architecture

### Enhanced UI Components

#### Button System (`enhanced-button.tsx`)
- **Variants**: Primary, secondary, ghost, glass, gradient
- **Ripple Effects**: Material Design-inspired interactions
- **Loading States**: Built-in spinner and disabled states
- **Accessibility**: Focus rings and ARIA attributes

#### Card System (`enhanced-card.tsx`)
- **Glass Morphism**: Translucent design with backdrop blur
- **Hover Effects**: Subtle animations and elevation changes
- **Flexible Layout**: Header, content, footer components
- **Progress Cards**: Visual progress indicators

### Notes Management System

#### ContentEditable Implementation
```typescript
<div
  ref={contentRef}
  contentEditable
  onInput={handleContentChange}
  dangerouslySetInnerHTML={{ __html: selectedNote.content || '' }}
  className="min-h-full outline-none text-gray-900 leading-relaxed"
  style={{
    fontSize: '16px',
    lineHeight: '1.6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    direction: 'ltr',
    textAlign: 'left',
    unicodeBidi: 'normal'
  }}
/>
```

#### Features
- **Real-time Saving**: Auto-save with debouncing
- **Rich Text Support**: HTML content with proper sanitization
- **Search & Filter**: Client-side search functionality
- **Responsive Design**: Mobile-optimized interface

## Error Handling & Reliability

### API Timeout Protection
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
    return fallbackData;
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

### Intelligent Fallback Systems
- **API Failures**: Curated data when external services fail
- **Network Issues**: Cached responses and offline functionality
- **Rate Limiting**: Exponential backoff and retry logic
- **Data Validation**: Comprehensive input sanitization

## Performance Optimizations

### Parallel Processing
```typescript
// Concurrent API calls for multiple influencers
const profilePromises = handles.map(handle => 
  processInfluencerProfile(handle, brandName)
);

const results = await Promise.allSettled(profilePromises);
```

### Memory Management
- **Efficient Data Structures**: Optimized profile data handling
- **Resource Cleanup**: Proper cleanup of WebGL resources
- **Garbage Collection**: Minimized memory leaks
- **Lazy Loading**: Components loaded on demand

## Security Implementation

### Environment Variable Management
```typescript
// Secure API key handling
const apiKey = process.env.APIFY_API_TOKEN;
if (!apiKey) {
  throw new Error('APIFY_API_TOKEN is required');
}
```

### Data Validation
```typescript
// Input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 1000); // Limit length
};
```

### CORS and Security Headers
```typescript
// API route security
export async function POST(request: Request) {
  // Validate request origin
  const origin = request.headers.get('origin');
  if (!isValidOrigin(origin)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Process request...
}
```

## Testing Strategy

### Unit Tests
- Component rendering tests
- Utility function validation
- API integration mocking
- Error handling verification

### Integration Tests
- End-to-end user workflows
- API endpoint testing
- Database operations
- Cross-browser compatibility

### Performance Tests
- WebGL animation performance
- API response time monitoring
- Memory usage profiling
- Load testing scenarios

## Deployment & DevOps

### Build Process
```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
```

### Environment Configuration
```env
# Production environment variables
APIFY_API_TOKEN=prod_token_here
SERPLY_API_KEY=prod_key_here
NODE_ENV=production
```

### Monitoring & Logging
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: API response time tracking
- **User Analytics**: Usage pattern analysis
- **Health Checks**: System status monitoring

## Future Enhancements

### Planned Features
1. **Multi-Platform Support**: TikTok and YouTube integration
2. **Advanced Analytics**: Machine learning insights
3. **Real-time Collaboration**: Multi-user campaign management
4. **Mobile App**: React Native implementation

### Technical Improvements
1. **Database Migration**: Move to PostgreSQL/MongoDB
2. **Caching Layer**: Redis implementation
3. **Microservices**: API service separation
4. **GraphQL**: Enhanced data fetching

## Troubleshooting Guide

### Common Issues

#### Text Direction Problems
- **Symptoms**: Text appearing backward or right-to-left
- **Solution**: Ensure latest CSS fixes are applied
- **Prevention**: Test text input across different browsers

#### API Timeouts
- **Symptoms**: Long loading times or failed requests
- **Solution**: Check network connectivity and API keys
- **Prevention**: Implement proper timeout handling

#### WebGL Issues
- **Symptoms**: Animation not displaying or poor performance
- **Solution**: Check browser WebGL support
- **Prevention**: Implement WebGL capability detection

### Debug Mode
```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug info:', debugData);
}
```

## Contributing Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

### Testing Requirements
- Unit tests for new functions
- Integration tests for API changes
- Cross-browser testing for UI changes
- Performance testing for optimizations

---

**Last Updated**: December 19, 2024
**Version**: 2.1.0 