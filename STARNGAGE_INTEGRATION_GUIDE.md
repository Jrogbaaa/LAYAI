# StarNgage Integration Guide

*Last Updated: January 2025 (v2.8.0)*

## Overview

The LAYAI platform includes a comprehensive StarNgage scraper that can extract detailed demographic data from influencer profiles. This integration provides valuable audience insights including gender demographics, age groups, top locations, and engagement metrics.

## 🚀 **MAJOR UPDATE: StarNgage Re-enabled (v2.8.0)**

StarNgage demographics have been **re-enabled** with significantly improved rate limiting and error handling after being temporarily disabled due to API blocking issues.

### Key Improvements in v2.8.0
- **✅ Re-enabled Real Demographics**: StarNgage integration now working with improved anti-blocking measures
- **🛡️ Smart Rate Limiting**: 2-3 second randomized delays between requests prevent API blocking
- **⚡ Enhanced Error Recovery**: Automatic fallback to diverse demographics when StarNgage is temporarily unavailable
- **🔄 Improved Success Rate**: Better handling of various StarNgage URL patterns and response structures
- **📊 Graceful Degradation**: System continues working even when StarNgage blocks requests

### Search Integration Features
- **Real Audience Demographics**: Actual age/gender breakdowns from StarNgage.com when accessible
- **Enhanced Result Prioritization**: StarNgage-enhanced results appear first in search rankings
- **Progressive Enhancement**: Top 10 results (regular search) / Top 5 results (progressive search) enhanced with real demographics
- **Intelligent Fallback**: Diverse, realistic demographics based on niche/gender/followers when StarNgage unavailable
- **Enhanced Match Reasons**: "Enhanced with real audience demographics from StarNgage" indicator

### Implementation Details
- Automatically called during Enhanced Search API (`/api/enhanced-search`)
- **NEW**: 2-3 second randomized delays to prevent rate limiting and blocking
- Priority sorting for enhanced results with StarNgage data first
- Comprehensive error handling with intelligent fallback system
- Real engagement metrics (avgLikes, avgComments) from StarNgage when available

## Features

### 🔍 **Influencer List Scraping**
- Extract influencer lists from StarNgage country/category pages
- Support for multiple platforms (Instagram, TikTok, YouTube)
- Configurable limits and filtering

### 👤 **Profile Demographics**
- Gender breakdown (Male/Female percentages)
- Age group distribution (13-17, 18-24, 25-34, 35-44, 45-54, 55+)
- Top audience locations
- Interest categories
- Engagement metrics (average likes, comments)

### 🔎 **Search Functionality**
- Keyword-based influencer search
- Platform-specific filtering
- Real-time results

### ✨ **Profile Enhancement**
- Enhance existing influencer data with StarNgage demographics
- Batch processing support
- Automatic fallback to mock data

## API Endpoints

### GET `/api/scrape-starngage`

#### Parameters:
- `action` (required): `list`, `profile`, `search`, or `enhance`
- `username` (for profile/enhance): Instagram username
- `country` (for list): Target country (default: "spain")
- `category` (for list): Influencer category (default: "celebrities")
- `platform` (for list/search): Social platform (default: "instagram")
- `keyword` (for search): Search keyword
- `limit` (optional): Maximum results (default: 20)

#### Examples:

```bash
# Get Spanish celebrity influencers
GET /api/scrape-starngage?action=list&country=spain&category=celebrities&limit=10

# Get profile details with demographics
GET /api/scrape-starngage?action=profile&username=evajarit

# Search for lifestyle influencers
GET /api/scrape-starngage?action=search&keyword=lifestyle&limit=5

# Enhance profile with demographics
GET /api/scrape-starngage?action=enhance&username=evajarit
```

### POST `/api/scrape-starngage`

#### Batch Operations:
- `batch-enhance`: Enhance multiple profiles
- `batch-profiles`: Scrape multiple profiles

```json
{
  "action": "batch-enhance",
  "usernames": ["evajarit", "mariapombo", "dulceida"]
}
```

## Data Structure

### StarngageInfluencer
```typescript
interface StarngageInfluencer {
  name: string;
  username: string;
  followers: number;
  engagementRate: number;
  country: string;
  topics: string[];
  profileUrl: string;
}
```

### StarngageInfluencerDetails
```typescript
interface StarngageInfluencerDetails {
  username: string;
  name: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  demographics: {
    gender: {
      female: number;
      male: number;
    };
    ageGroups: {
      '13-17': number;
      '18-24': number;
      '25-34': number;
      '35-44': number;
      '45-54': number;
      '55+': number;
    };
    topLocations: string[];
    interests: string[];
  };
  topics: string[];
  recentPosts: any[];
}
```

## Usage Examples

### 1. Basic Profile Scraping

```javascript
const response = await fetch('/api/scrape-starngage?action=profile&username=evajarit');
const data = await response.json();

if (data.success) {
  console.log('Demographics:', data.data.demographics);
  console.log('Gender:', data.data.demographics.gender);
  console.log('Engagement Rate:', data.data.engagementRate);
}
```

### 2. Enhanced Search Integration

```javascript
// Enhance existing influencer data
const enhanceInfluencer = async (username) => {
  const response = await fetch(`/api/scrape-starngage?action=enhance&username=${username}`);
  const data = await response.json();
  
  if (data.success) {
    return {
      demographics: data.data.demographics,
      engagementRate: data.data.engagementRate,
      averageLikes: data.data.averageLikes,
      topics: data.data.topics
    };
  }
  return null;
};
```

### 3. Batch Processing

```javascript
const enhanceMultipleInfluencers = async (usernames) => {
  const response = await fetch('/api/scrape-starngage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batch-enhance',
      usernames: usernames
    })
  });
  
  const data = await response.json();
  return data.data; // Array of enhanced profiles
};
```

## React Component Integration

### StarngageTest Component

The platform includes a test component for debugging and testing the StarNgage integration:

```jsx
import { StarngageTest } from '@/components/StarngageTest';

// Use in your component
<StarngageTest className="my-custom-class" />
```

Features:
- Test all API endpoints
- Real-time results display
- Error handling and debugging
- Mock data visualization

## Error Handling & Fallbacks

The StarNgage service includes robust error handling:

### 1. **Multiple URL Attempts**
- Tries alternative URL structures when primary URLs fail
- Supports different StarNgage URL patterns

### 2. **Mock Data Fallback**
- Provides realistic mock data when scraping fails
- Maintains API consistency
- Includes demographic data for testing

### 3. **Graceful Degradation**
- Returns partial data when some fields are unavailable
- Continues processing even with individual failures

## Example Response Data

### Profile Details Response
```json
{
  "success": true,
  "data": {
    "username": "evajarit",
    "name": "Eva Jarit",
    "followers": 2100000,
    "following": 1200,
    "posts": 450,
    "engagementRate": 3.25,
    "averageLikes": 72452,
    "averageComments": 119,
    "demographics": {
      "gender": {
        "female": 57.5,
        "male": 42.5
      },
      "ageGroups": {
        "13-17": 5,
        "18-24": 35,
        "25-34": 40,
        "35-44": 15,
        "45-54": 4,
        "55+": 1
      },
      "topLocations": ["Spain", "Mexico", "Colombia"],
      "interests": ["Fashion", "Lifestyle", "Beauty", "Travel"]
    },
    "topics": ["Fashion and Accessories", "Entertainment and Music", "Hair & Beauty", "Modeling"]
  },
  "message": "Profile details scraped for @evajarit"
}
```

## Integration with LAYAI Platform

### 1. **Search Enhancement**
- Automatically enhance search results with StarNgage demographics
- Add demographic filters to search interface
- Display audience insights on influencer cards

### 2. **Campaign Planning**
- Use demographic data for better influencer matching
- Analyze audience overlap between influencers
- Generate demographic reports for campaigns

### 3. **Reporting & Analytics**
- Include demographic breakdowns in campaign reports
- Track audience quality metrics
- Compare influencer audience demographics

## Technical Implementation

### Service Architecture
```
src/lib/starngageService.ts     # Core scraping service
src/app/api/scrape-starngage/   # API endpoints
src/components/StarngageTest.tsx # Testing component
```

### Key Methods
- `scrapeInfluencerList()` - Get influencer lists
- `scrapeInfluencerProfile()` - Get detailed profile data
- `enhanceInfluencerWithDemographics()` - Enhance existing data
- `searchInfluencers()` - Search functionality
- `createMockData()` - Fallback mock data

## Security & Rate Limiting

### Headers & User Agents
- Uses realistic browser headers
- Rotates user agents to avoid detection
- Implements proper request timing

### Rate Limiting
- Built-in delays between requests
- Configurable timeout settings
- Graceful error handling

## Future Enhancements

### Planned Features
1. **Real-time Demographics Sync**
   - Periodic updates of demographic data
   - Change detection and notifications

2. **Advanced Filtering**
   - Filter by demographic criteria
   - Audience quality scoring

3. **Demographic Trends**
   - Track demographic changes over time
   - Audience growth analytics

4. **Integration Expansion**
   - Support for additional platforms
   - Cross-platform demographic comparison

## Troubleshooting

### Common Issues

1. **Scraping Failures**
   - Check network connectivity
   - Verify StarNgage URL structure hasn't changed
   - Review console logs for detailed error messages

2. **Empty Results**
   - Verify target URLs are accessible
   - Check if StarNgage has changed their HTML structure
   - Use mock data for testing

3. **Rate Limiting**
   - Implement delays between requests
   - Use batch processing for multiple profiles
   - Monitor request frequency

### Debug Mode
Enable detailed logging by checking browser console when using the StarngageTest component.

## Conclusion

The StarNgage integration provides powerful demographic insights that enhance the LAYAI platform's influencer analysis capabilities. With robust error handling, mock data fallbacks, and comprehensive API coverage, it enables sophisticated audience analysis and campaign planning.

For questions or issues, refer to the console logs or use the StarngageTest component for debugging. 