# Influencer Profile Verification System

## Overview

This comprehensive verification system addresses the poor search accuracy issues by implementing advanced web scraping, profile analysis, and verification capabilities. The system uses Apify and Serply APIs to extract and verify actual profile data against search criteria.

## Architecture

### Core Components

1. **ProfileVerificationService** (`src/lib/profileVerificationService.ts`)
   - Main service for profile scraping and verification
   - Supports Instagram, TikTok, YouTube platforms
   - Rate limiting and respectful scraping practices
   - Comprehensive scoring algorithm

2. **Verification API** (`src/app/api/verify-profiles/route.ts`)
   - REST endpoint for profile verification
   - Two-tier verification: basic (fast) and full (comprehensive)
   - Batch processing with intelligent fallbacks
   - Real-time recommendations and insights

## Features

### ✅ Web Scraping Module
- **Multi-platform support**: Instagram, TikTok, YouTube
- **Apify integration**: Uses production-ready scrapers
- **Rate limiting**: 2-second delays between requests
- **Error handling**: Comprehensive retry logic and fallbacks
- **Anti-bot measures**: Built-in delays and respectful practices

### ✅ Profile Data Extraction
- **Follower counts**: Actual follower verification
- **Bio analysis**: Content analysis for niche alignment
- **Engagement metrics**: Likes, comments, engagement rates
- **Profile metadata**: Verification status, location, website
- **Recent posts**: Content analysis for brand compatibility

### ✅ Verification Scoring System
Four-tier scoring with weighted importance:
- **Niche Alignment (30%)**: Keyword matching against brand/category
- **Brand Compatibility (25%)**: Brand-specific analysis and competitor checks
- **Follower Validation (25%)**: Follower count range and quality assessment
- **Demographic Match (20%)**: Age, gender, location validation

### ✅ Advanced Analytics
- **Confidence scores**: 0-1 scale based on data quality
- **Match analysis**: Detailed breakdown per category
- **Red flag detection**: Competitor mentions, low engagement
- **Quality assessment**: High/medium/low follower quality
- **Keyword extraction**: Relevant niche keywords found

## API Endpoints

### POST `/api/verify-profiles`

Verifies influencer profiles against search criteria.

#### Request Body
```typescript
{
  profiles: Array<{
    url: string;
    platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
    discoveryData?: {
      username: string;
      followers?: number;
      category?: string;
      location?: string;
    };
  }>;
  searchCriteria: {
    minAge?: number;
    maxAge?: number;
    location?: string;
    gender?: 'male' | 'female' | 'any';
    niches?: string[];
    brandName?: string;
    minFollowers?: number;
    maxFollowers?: number;
  };
  verificationLevel?: 'basic' | 'full';
}
```

#### Response
```typescript
{
  success: boolean;
  results: VerificationResult[];
  summary: {
    totalProfiles: number;
    verifiedProfiles: number;
    averageScore: number;
    highQualityMatches: number;
    mediumQualityMatches: number;
    lowQualityMatches: number;
    processingTimeMs: number;
  };
  recommendations: string[];
  errors?: string[];
}
```

## Verification Levels

### Basic Verification (Fast)
- Uses existing discovery data
- Heuristic analysis without scraping
- 70% max confidence score
- Sub-second processing per profile
- Ideal for initial screening

### Full Verification (Comprehensive)
- Complete profile scraping via Apify
- Advanced content analysis
- 100% confidence potential
- 2-5 seconds processing per profile
- Ideal for final candidate selection

## Scoring Algorithm

### Niche Alignment (30% weight)
```typescript
const nicheKeywords = {
  'home': ['home', 'interior', 'decor', 'furniture', 'design'],
  'lifestyle': ['lifestyle', 'life', 'wellness', 'daily'],
  'fashion': ['fashion', 'style', 'outfit', 'clothing'],
  'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics'],
  // ... more categories
};
```
- Keyword matching in bio and recent posts
- Brand-specific keyword bonuses
- 10 points per generic keyword, 15 per brand keyword

### Brand Compatibility (25% weight)
- Brand-specific analysis (e.g., IKEA → home/interior content)
- Competitor mention penalties
- Verification status bonuses
- Engagement quality assessment

### Follower Validation (25% weight)
- Range compliance checking
- Engagement rate analysis (>5% = high quality, <1% = low quality)
- Follower quality estimation

### Demographic Match (20% weight)
- Location matching (exact or partial)
- Age estimation from bio text
- Gender estimation using heuristics

## Rate Limiting & Best Practices

### Enhanced Rate Limiting (v2.8.0)
- **Serply API**: 3-second delays between consecutive calls, 10-second recovery on timeouts
- **StarNgage**: 2-3 second randomized delays to prevent blocking
- **Apify**: 2-second delays between requests per platform
- **Batch processing**: 5 profiles at a time with intelligent scheduling
- **Error recovery**: Automatic extended delays for 504/429/403 errors
- **Maximum limits**: 50 profiles per API call with timeout protection

### Respectful Scraping
- **Smart delays**: Randomized timing to avoid detection patterns
- **Error handling**: Comprehensive retry logic with exponential backoff
- **Graceful degradation**: Fallback to basic verification when APIs unavailable
- **API key rotation**: Support for multiple API keys and rotation
- **Timeout management**: Intelligent timeout handling prevents infinite loading
- **Rate limit detection**: Automatic detection and recovery from rate limiting

### Security
- Environment variable API keys
- Input validation and sanitization
- Error message sanitization
- Request size limitations

## Platform-Specific Implementation

### Instagram Scraping
```typescript
const input = {
  usernames: [username],
  resultsType: 'profiles',
  resultsLimit: 1,
  searchType: 'hashtag',
  searchLimit: 5
};
const run = await apifyClient.actor('shu8hvrXbJbY3Eb9W').call(input);
```

### TikTok Scraping
```typescript
const input = {
  profiles: [`https://www.tiktok.com/@${username}`],
  shouldDownloadVideos: false,
  resultsPerPage: 5
};
const run = await apifyClient.actor('clockworks/tiktok-scraper').call(input);
```

### YouTube Scraping
```typescript
const input = {
  startUrls: [{ url }],
  maxResults: 5
};
const run = await apifyClient.actor('streamers/youtube-scraper').call(input);
```

## Integration Examples

### Basic Verification Usage
```typescript
const response = await fetch('/api/verify-profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profiles: [
      {
        url: 'https://instagram.com/example',
        platform: 'instagram',
        discoveryData: {
          username: 'example',
          followers: 10000,
          category: 'lifestyle'
        }
      }
    ],
    searchCriteria: {
      niches: ['lifestyle'],
      brandName: 'ikea',
      minFollowers: 5000,
      maxFollowers: 50000,
      location: 'spain'
    },
    verificationLevel: 'basic'
  })
});
```

### Full Verification Usage
```typescript
const response = await fetch('/api/verify-profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profiles: topCandidates.map(profile => ({
      url: profile.url,
      platform: profile.platform
    })),
    searchCriteria: {
      niches: ['home', 'interior'],
      brandName: 'ikea',
      minAge: 30,
      gender: 'female',
      location: 'spain'
    },
    verificationLevel: 'full'
  })
});
```

## Recommendations Engine

The system provides intelligent recommendations based on verification results:

### Quality Analysis
- **High Quality (80+ score)**: "✅ Great results! You have multiple high-quality matches"
- **No High Quality**: "⚠️ No high-quality matches found. Consider broadening criteria"
- **Too Many Low Quality**: "🔍 Many profiles have low scores. Try refining parameters"

### Parameter Optimization
- **Follower Range Issues**: "📊 Many profiles fall outside follower range. Consider adjusting min/max"
- **Poor Niche Alignment**: "🎯 Poor niche alignment. Try different keywords or categories"
- **Location Targeting**: "🌍 Location targeting too restrictive. Consider broader areas"

## Error Handling

### Graceful Degradation
1. **Full verification fails** → Automatically falls back to basic verification
2. **Apify timeout** → Uses cached/discovery data with confidence penalty
3. **Rate limit exceeded** → Queues requests with delays
4. **Invalid profile URL** → Logs error, continues with other profiles

### Error Types
- **Scraping failures**: Network timeouts, anti-bot measures
- **Invalid data**: Malformed URLs, missing profile data
- **API limits**: Rate limiting, quota exceeded
- **Service errors**: Apify downtime, invalid credentials

## Performance Metrics

### Basic Verification
- **Speed**: ~100ms per profile
- **Accuracy**: ~70% confidence
- **Cost**: Minimal (no external API calls)
- **Use case**: Initial screening, large batches

### Full Verification
- **Speed**: ~2-5 seconds per profile
- **Accuracy**: Up to 100% confidence
- **Cost**: Apify API costs ($0.25-0.50 per 1000 operations)
- **Use case**: Final candidate selection

## StarNgage Demographics Integration (v2.8.0)

### Re-enabled Real Demographics
The verification system now includes re-enabled StarNgage demographics enhancement with improved reliability:

#### Enhanced Demographics Verification
- **Real Audience Data**: Actual age/gender breakdowns from StarNgage.com when accessible
- **Smart Rate Limiting**: 2-3 second randomized delays prevent API blocking
- **Intelligent Fallback**: Diverse demographics based on niche/gender/followers when StarNgage unavailable
- **Error Recovery**: Automatic fallback to diverse demographics on 403/timeout errors

#### Implementation
```typescript
// Enhanced demographic verification with StarNgage
async function enhanceWithStarngageDemographics(profile: any): Promise<any> {
  try {
    // Attempt to get real StarNgage demographics
    const starngageData = await starngageService.enhanceInfluencerWithDemographics(profile.username);
    
    if (starngageData && starngageData.demographics) {
      console.log(`✅ Enhanced ${profile.username} with real StarNgage demographics`);
      return {
        ...profile,
        demographics: starngageData.demographics,
        starngageEnhanced: true,
        dataSource: 'starngage_real'
      };
    }
  } catch (error) {
    console.log(`⚠️ StarNgage enhancement failed for ${profile.username} - using fallback`);
  }
  
  // Fallback to diverse demographics
  return {
    ...profile,
    demographics: generateDiverseDemographics(profile),
    starngageEnhanced: false,
    dataSource: 'diverse_fallback'
  };
}
```

#### Benefits for Verification
- **Higher Accuracy**: Real demographic data improves verification confidence scores
- **Better Matching**: Actual audience data provides more precise demographic alignment
- **Reliability**: Fallback system ensures consistent results even during API issues
- **Prioritization**: StarNgage-enhanced profiles receive higher priority in results

## Configuration

### Environment Variables
```bash
APIFY_API_TOKEN=your_apify_token
SERPLY_API_KEY=your_serply_key
STARNGAGE_ENABLED=true
```

### Apify Actors Used
- **Instagram**: `shu8hvrXbJbY3Eb9W`
- **TikTok**: `clockworks/tiktok-scraper`
- **YouTube**: `streamers/youtube-scraper`

## Future Enhancements

### Planned Features
1. **Twitter/X Integration**: Full Twitter API integration
2. **AI Content Analysis**: GPT-based content quality assessment
3. **Real-time Monitoring**: Profile change detection
4. **Batch Scheduling**: Background verification jobs
5. **ML Scoring**: Machine learning-based compatibility scoring

### Advanced Analytics
1. **Trend Analysis**: Historical performance tracking
2. **Competitor Intelligence**: Automated competitor discovery
3. **Audience Overlap**: Cross-platform audience analysis
4. **ROI Prediction**: Campaign performance forecasting

## Troubleshooting

### Common Issues

#### 1. Low Verification Scores
**Symptoms**: Most profiles scoring <60
**Solutions**:
- Broaden search criteria
- Check niche keyword relevance
- Verify follower range settings
- Review location requirements

#### 2. Scraping Failures
**Symptoms**: High error rates, timeouts
**Solutions**:
- Check Apify API credits
- Verify API tokens
- Reduce batch sizes
- Increase rate limiting delays

#### 3. Poor Brand Alignment
**Symptoms**: Low brand compatibility scores
**Solutions**:
- Add brand-specific keywords
- Review competitor detection logic
- Check content analysis parameters
- Update brand keyword mappings

### Monitoring

#### Key Metrics to Track
- **Verification Success Rate**: >90% target
- **Average Processing Time**: <3s for basic, <10s for full
- **Score Distribution**: Aim for >30% high-quality matches
- **API Error Rate**: <5% target

## Cost Optimization

### Apify Usage Optimization
1. **Use basic verification first**: Filter before full scraping
2. **Batch processing**: Process multiple profiles together
3. **Cache results**: Store verification data for 24-48 hours
4. **Smart retry logic**: Avoid repeated failed attempts

### Expected Costs
- **Basic verification**: $0 (uses existing data)
- **Full verification**: ~$0.50 per 1000 profiles
- **Monthly estimate**: $50-200 for typical usage

## Conclusion

This verification system significantly improves search accuracy by:

1. **Validating actual profile data** instead of relying on search metadata
2. **Providing detailed match analysis** with confidence scores
3. **Offering flexible verification levels** for different use cases
4. **Implementing respectful scraping practices** with proper rate limiting
5. **Generating actionable recommendations** for search optimization

The system is production-ready with comprehensive error handling, performance optimization, and monitoring capabilities. 