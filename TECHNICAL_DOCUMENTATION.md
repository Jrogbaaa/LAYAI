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

## Recent Major Updates (v2.2.0)

### Text Input Architecture Overhaul

#### Problem Solved
- **Issue**: Text appearing backward when typing (contentEditable direction issues)
- **Root Cause**: Browser-specific contentEditable behavior with text direction
- **Impact**: Critical usability issue affecting notes management

#### Solution Implemented
```typescript
// Before: Problematic contentEditable
<div
  contentEditable
  dangerouslySetInnerHTML={{ __html: content }}
  // Complex event handling required
/>

// After: Reliable textarea
<textarea
  value={content}
  onChange={handleChange}
  dir="ltr"
  className="force-ltr-text"
  // Simple, predictable behavior
/>
```

#### Technical Benefits
- **Reliability**: Textareas have consistent cross-browser text direction handling
- **Simplicity**: Removed 80+ lines of complex JavaScript text manipulation
- **Accessibility**: Better screen reader support and keyboard navigation
- **Maintainability**: Cleaner, more predictable codebase

### Proposal Generation Flow Enhancement

#### Navigation State Management
```typescript
type PageView = 'landing' | 'chat' | 'generate' | 'proposal' | 'campaigns' | 'notes';

// Enhanced proposal flow
const handleProposalGenerated = (proposal: CampaignProposal) => {
  setCurrentProposal(proposal);
  setCurrentView('proposal'); // New dedicated view
};
```

#### Component Architecture
```
ProposalGenerator → ProposalViewer
     ↓                    ↓
  Select talents      View complete
  Fill details        proposal with:
  Generate           - Full biographies
                     - Brand analysis
                     - Export options
```

## System Architecture

### Frontend Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/          # AI chat processing
│   │   ├── search-apify/  # Instagram scraping
│   │   ├── web-search/    # Brand research
│   │   └── database/      # Data persistence
│   ├── globals.css        # Enhanced CSS with text direction fixes
│   └── page.tsx          # Main application with improved navigation
├── components/            # React Components
│   ├── Chatbot.tsx       # AI conversation interface
│   ├── ProposalGenerator.tsx  # Campaign proposal creation
│   ├── ProposalViewer.tsx     # Enhanced proposal display
│   ├── NotesManager.tsx       # Fixed text input component
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions
├── types/               # TypeScript definitions
└── utils/              # Helper functions
```

### API Integration Layer

#### Enhanced Data Flow
```
User Input → AI Processing → Multi-API Integration → Enhanced Results

1. Chat API: Natural language processing
2. Apify API: Real-time Instagram scraping
3. Serply API: Brand research and context
4. Enhancement Layer: Data enrichment and analysis
```

#### Error Handling & Fallbacks
```typescript
// Robust API integration with fallbacks
try {
  const apifyData = await scrapeInstagramProfiles(handles);
  const brandData = await researchBrand(brandName);
  const enhancedData = await enhanceWithContext(apifyData, brandData);
  return enhancedData;
} catch (error) {
  // Graceful degradation with partial data
  return fallbackData;
}
```

## Component Deep Dive

### NotesManager Component (v2.2.0 Update)

#### Before: Complex ContentEditable
```typescript
// Problematic implementation
const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
  // 50+ lines of text manipulation logic
  // Browser-specific workarounds
  // Complex cursor positioning
  // Unreliable text direction handling
};
```

#### After: Simple Textarea
```typescript
// Clean, reliable implementation
const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  if (selectedNote) {
    updateSelectedNote('content', e.target.value);
  }
};
```

#### CSS Architecture Enhancement
```css
/* Maximum specificity text direction control */
.force-ltr-text,
.force-ltr-text *,
[contenteditable].force-ltr-text,
[contenteditable].force-ltr-text * {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: normal !important;
  writing-mode: horizontal-tb !important;
  transform: none !important;
}
```

### ProposalViewer Component Enhancement

#### Complete Data Display
```typescript
interface ProposalTalent {
  // Enhanced with full context
  biography: string;           // Personalized biography
  whyThisInfluencer: string;  // Brand compatibility analysis
  metrics: {
    credibilityScore: number;
    spainImpressionsPercentage: number;
    storyImpressions: number;
    reelImpressions: number;
    interactions: number;
  };
  pastCollaborations: string[];
}
```

## Performance Optimizations

### Code Simplification Impact
- **Reduced Bundle Size**: Removed complex text manipulation libraries
- **Improved Rendering**: Textarea vs contentEditable performance
- **Memory Usage**: Eliminated event listener overhead
- **CPU Usage**: Reduced text processing complexity

### API Efficiency
```typescript
// Parallel API calls for better performance
const [brandData, influencerData] = await Promise.all([
  researchBrand(brandName),
  scrapeInfluencerProfiles(handles)
]);
```

## Security Considerations

### Input Sanitization
```typescript
// Safe text handling with textarea
const sanitizedContent = DOMPurify.sanitize(textareaValue);
// No innerHTML injection risks
```

### API Security
- Environment variable protection
- Rate limiting implementation
- Error message sanitization
- CORS configuration

## Testing Strategy

### Component Testing
```typescript
// Simplified testing with textarea
test('text input works correctly', () => {
  render(<NotesManager />);
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value: 'test text' } });
  expect(textarea.value).toBe('test text');
  // No complex contentEditable testing required
});
```

### Integration Testing
- API endpoint validation
- Proposal generation flow
- Export functionality
- Cross-browser compatibility

## Deployment Architecture

### Production Environment
```yaml
# Vercel deployment configuration
build:
  command: npm run build
  environment:
    - APIFY_API_TOKEN
    - SERPLY_API_KEY
    
runtime: nodejs18.x
regions: [iad1, sfo1]
```

### Environment Configuration
```bash
# Required environment variables
APIFY_API_TOKEN=your_apify_token
SERPLY_API_KEY=your_serply_key

# Optional enhancements
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://api.layai.com
```

## Monitoring & Analytics

### Error Tracking
```typescript
// Enhanced error handling
try {
  await processProposal(data);
} catch (error) {
  console.error('Proposal generation failed:', error);
  // Send to monitoring service
  trackError('proposal_generation', error);
}
```

### Performance Metrics
- Component render times
- API response times
- User interaction tracking
- Error rate monitoring

## Future Architecture Considerations

### Scalability Improvements
- Database integration (PostgreSQL/MongoDB)
- Redis caching layer
- CDN implementation
- Microservices architecture

### Feature Enhancements
- Real-time collaboration
- Advanced analytics dashboard
- Multi-tenant architecture
- Mobile app development

## Development Guidelines

### Code Quality Standards
```typescript
// TypeScript strict mode
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true

// ESLint configuration
"extends": [
  "next/core-web-vitals",
  "@typescript-eslint/recommended"
]
```

### Component Development
1. **Simplicity First**: Choose simple, reliable solutions over complex ones
2. **TypeScript**: Full type coverage for all components
3. **Testing**: Unit tests for all critical functionality
4. **Accessibility**: WCAG 2.1 compliance
5. **Performance**: Optimize for Core Web Vitals

## Troubleshooting Guide

### Common Issues & Solutions

#### Text Direction Problems
- **Status**: ✅ RESOLVED in v2.2.0
- **Solution**: Textarea replacement with proper CSS
- **Prevention**: Use standard HTML form elements when possible

#### Proposal Generation Issues
- **Status**: ✅ RESOLVED in v2.2.0
- **Solution**: Proper state management and navigation
- **Prevention**: Clear component lifecycle management

#### API Integration Problems
- **Diagnosis**: Check environment variables and API credits
- **Solution**: Implement proper error handling and fallbacks
- **Prevention**: Regular API health monitoring

## Version History & Migration

### v2.2.0 Migration Notes
- **Breaking Changes**: None (backward compatible)
- **Database**: No schema changes required
- **Environment**: No new variables required
- **Dependencies**: No major updates required

### Upgrade Path
1. Pull latest code: `git pull origin main`
2. Install dependencies: `npm install`
3. Restart development server: `npm run dev`
4. Test critical functionality
5. Deploy to production

---

**Last Updated**: December 19, 2024  
**Version**: 2.2.0  
**Maintainer**: LAYAI Development Team 