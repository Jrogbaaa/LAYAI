# LAYAI API Documentation

This document provides comprehensive documentation for the LAYAI platform APIs.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Currently, the API uses API keys for external services. No user authentication is required for the main endpoints.

### Required Environment Variables

```env
APIFY_API_TOKEN=your_apify_token
SERPLY_API_KEY=your_serply_key
OPENAI_API_KEY=your_openai_key (optional)
```

## Endpoints

### 1. Search Influencers

**Endpoint:** `POST /api/search-apify`

**Description:** Search for influencers across multiple platforms with advanced filtering options.

#### Request Body

```typescript
{
  platforms?: string[];           // Default: ['instagram']
  niches?: string[];             // Default: []
  minFollowers?: number;         // Default: 0
  maxFollowers?: number;         // Default: 10000000
  location?: string;             // Optional location filter
  gender?: string;               // 'male', 'female', 'non-binary', 'other'
  sessionId?: string;            // Session tracking
  userId?: string;               // User identification
  userQuery?: string;            // Natural language query
  specificHandle?: string;       // Target specific influencer handle
  verified?: boolean;            // Verified accounts only
  maxResults?: number;           // Default: 50
}
```

#### Example Request

```json
{
  "platforms": ["instagram", "tiktok"],
  "niches": ["fashion", "lifestyle"],
  "minFollowers": 10000,
  "maxFollowers": 500000,
  "location": "España",
  "gender": "female",
  "userQuery": "Find female fashion influencers from Spain",
  "maxResults": 20
}
```

#### Response

```typescript
{
  success: boolean;
  premiumResults: ScrapedInfluencer[];
  discoveryResults: BasicInfluencerProfile[];
  totalFound: number;
  searchId: string;
  metadata: {
    totalFound: number;
    premiumCount: number;
    discoveryCount: number;
    searchParams: object;
  }
}
```

#### Example Response

```json
{
  "success": true,
  "premiumResults": [
    {
      "username": "maria_fashion",
      "fullName": "María García",
      "followers": 125000,
      "following": 1200,
      "postsCount": 450,
      "engagementRate": 0.032,
      "platform": "instagram",
      "biography": "Fashion & Lifestyle | Madrid 🇪🇸",
      "verified": false,
      "profilePicUrl": "https://...",
      "avgLikes": 4000,
      "avgComments": 120,
      "category": "Fashion",
      "location": "Madrid, Spain",
      "collaborationRate": 2500
    }
  ],
  "discoveryResults": [
    {
      "username": "style_blogger_es",
      "fullName": "Ana Martínez",
      "followers": 85000,
      "platform": "instagram",
      "niche": "Fashion",
      "profileUrl": "https://instagram.com/style_blogger_es",
      "source": "verified-discovery"
    }
  ],
  "totalFound": 25,
  "searchId": "search_1749908725806_abc123",
  "metadata": {
    "totalFound": 25,
    "premiumCount": 1,
    "discoveryCount": 24,
    "searchParams": {
      "platforms": ["instagram", "tiktok"],
      "location": "España",
      "gender": "female"
    }
  }
}
```

### 2. Chat Interface

**Endpoint:** `POST /api/chat`

**Description:** Natural language interface for influencer search queries.

#### Request Body

```typescript
{
  message: string;               // Natural language query
  sessionId?: string;            // Session tracking
}
```

#### Example Request

```json
{
  "message": "Find me 10 male home decor influencers from Spain with 50K+ followers for IKEA collaboration",
  "sessionId": "session_123"
}
```

#### Response

```typescript
{
  success: boolean;
  response: string;              // AI-generated response
  searchParams?: {               // Extracted search parameters
    platforms: string[];
    niches: string[];
    minFollowers: number;
    maxFollowers: number;
    location?: string;
    gender?: string;
  };
  shouldSearch: boolean;         // Whether to trigger search
}
```

#### Example Response

```json
{
  "success": true,
  "response": "I'll search for male home decor influencers from Spain with 50K+ followers perfect for IKEA collaboration. Let me find the best matches for you.",
  "searchParams": {
    "platforms": ["instagram", "tiktok"],
    "niches": ["home", "decor", "furniture"],
    "minFollowers": 50000,
    "maxFollowers": 10000000,
    "location": "España",
    "gender": "male"
  },
  "shouldSearch": true
}
```

### 3. Feedback Collection

**Endpoint:** `POST /api/feedback`

**Description:** Collect user feedback on search results for continuous improvement.

#### Request Body

```typescript
{
  searchId: string;              // ID from search response
  rating: number;                // 1-5 star rating
  feedback?: string;             // Optional feedback text
  improvedQuery?: string;        // Suggested query improvement
  userId?: string;               // User identification
}
```

#### Example Request

```json
{
  "searchId": "search_1749908725806_abc123",
  "rating": 4,
  "feedback": "Good results but need more Spanish influencers",
  "improvedQuery": "Find Spanish home decor influencers from Madrid and Barcelona"
}
```

#### Response

```typescript
{
  success: boolean;
  message: string;
  feedbackId: string;
}
```

### 4. Health Check

**Endpoint:** `GET /api/search-apify`

**Description:** Check API health and service status.

#### Response

```json
{
  "success": true,
  "apifyConfigured": true,
  "message": "Apify service ready with two-tier discovery system"
}
```

## Data Types

### ScrapedInfluencer

```typescript
interface ScrapedInfluencer {
  username: string;
  fullName: string;
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number;
  platform: string;
  biography: string;
  verified: boolean;
  profilePicUrl: string;
  avgLikes: number;
  avgComments: number;
  category: string;
  location?: string;
  email?: string;
  website?: string;
  collaborationRate?: number;
  brandCompatibilityScore?: number;
}
```

### BasicInfluencerProfile

```typescript
interface BasicInfluencerProfile {
  username: string;
  fullName: string;
  followers: number;
  platform: string;
  niche: string;
  profileUrl: string;
  source: 'verified-discovery';
}
```

### ApifySearchParams

```typescript
interface ApifySearchParams {
  platforms: string[];
  niches: string[];
  minFollowers: number;
  maxFollowers: number;
  location?: string;
  verified?: boolean;
  maxResults?: number;
  gender?: string;
  ageRange?: string;
  strictLocationMatch?: boolean;
  brandName?: string;
  userQuery?: string;
  specificHandle?: string;
}
```

## Error Handling

### Error Response Format

```typescript
{
  success: false;
  error: string;                 // Error type
  details: string;               // Detailed error message
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 429 | Rate Limited | Too many requests |
| 500 | Internal Error | Server-side error |
| 503 | Service Unavailable | External service unavailable |

### Example Error Response

```json
{
  "success": false,
  "error": "Search failed",
  "details": "Serply API key is invalid or expired"
}
```

## Rate Limits

- **Search API**: 60 requests per minute
- **Chat API**: 100 requests per minute
- **Feedback API**: 200 requests per minute

## Platform Support

### Supported Platforms

| Platform | Code | Features |
|----------|------|----------|
| Instagram | `instagram` | Full profile scraping, stories, posts |
| TikTok | `tiktok` | Profile data, video metrics |
| YouTube | `youtube` | Channel data, subscriber count |
| Twitter | `twitter` | Profile data, tweet metrics |

### Supported Niches

- Fashion
- Beauty
- Fitness
- Food
- Travel
- Tech
- Gaming
- Lifestyle
- Home/Decor
- Business
- Education
- Entertainment
- Sports
- Health
- Parenting

### Supported Locations

- Global search
- Country-specific (España, United States, etc.)
- City-specific (Madrid, Barcelona, etc.)
- Region-specific (Europe, North America, etc.)

## Best Practices

### 1. Search Optimization

```javascript
// Good: Specific parameters
{
  "platforms": ["instagram"],
  "niches": ["fashion"],
  "minFollowers": 10000,
  "maxFollowers": 100000,
  "location": "España",
  "gender": "female"
}

// Avoid: Too broad
{
  "platforms": ["instagram", "tiktok", "youtube", "twitter"],
  "maxFollowers": 10000000
}
```

### 2. Error Handling

```javascript
try {
  const response = await fetch('/api/search-apify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchParams)
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.details || data.error);
  }
  
  // Handle successful response
  console.log(`Found ${data.totalFound} influencers`);
  
} catch (error) {
  console.error('Search failed:', error.message);
  // Handle error appropriately
}
```

### 3. Session Management

```javascript
// Generate unique session ID
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Use consistent session ID across requests
const searchResponse = await searchInfluencers({ ...params, sessionId });
const feedbackResponse = await submitFeedback({ 
  searchId: searchResponse.searchId, 
  rating: 5,
  sessionId 
});
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class LayaiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }
  
  async searchInfluencers(params: ApifySearchParams) {
    const response = await fetch(`${this.baseUrl}/api/search-apify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    return response.json();
  }
  
  async chat(message: string, sessionId?: string) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    });
    
    return response.json();
  }
  
  async submitFeedback(feedback: FeedbackData) {
    const response = await fetch(`${this.baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    
    return response.json();
  }
}

// Usage
const client = new LayaiClient();

const results = await client.searchInfluencers({
  platforms: ['instagram'],
  niches: ['fashion'],
  minFollowers: 10000,
  location: 'España'
});

console.log(`Found ${results.totalFound} influencers`);
```

### Python

```python
import requests
import json

class LayaiClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def search_influencers(self, params):
        response = requests.post(
            f"{self.base_url}/api/search-apify",
            json=params,
            headers={"Content-Type": "application/json"}
        )
        return response.json()
    
    def chat(self, message, session_id=None):
        data = {"message": message}
        if session_id:
            data["sessionId"] = session_id
            
        response = requests.post(
            f"{self.base_url}/api/chat",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        return response.json()

# Usage
client = LayaiClient()

results = client.search_influencers({
    "platforms": ["instagram"],
    "niches": ["fashion"],
    "minFollowers": 10000,
    "location": "España"
})

print(f"Found {results['totalFound']} influencers")
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and updates.

## Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/layai/issues)
- **Email**: api-support@layai.com
- **Documentation**: This file and inline code comments

---

*Last updated: January 27, 2025* 