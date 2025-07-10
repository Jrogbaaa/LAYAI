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

### 1. Enhanced Search with Spanish Detection & Age Estimation

**Endpoint:** `POST /api/enhanced-search`

**Description:** Advanced influencer search with Spanish location detection, age estimation, and real StarNgage audience demographics integration (v2.7.0).

#### Request Body

```typescript
{
  location?: string;             // Target location (e.g., "Spain", "Madrid")
  minAge?: number;               // Minimum age (18-65)
  maxAge?: number;               // Maximum age (18-65)
  minFollowers?: number;         // Minimum follower count
  maxFollowers?: number;         // Maximum follower count
  niches?: string[];             // Target niches/categories
  platforms?: string[];          // Default: ['instagram']
  gender?: string;               // 'male', 'female', 'non-binary', 'other'
  enableSpanishDetection?: boolean; // Enable Spanish location detection
  enableAgeEstimation?: boolean;    // Enable age estimation
  userQuery?: string;            // Natural language query
  sessionId?: string;            // Session tracking
  maxResults?: number;           // Default: 50
}
```

#### Example Request

```json
{
  "location": "Spain",
  "minAge": 20,
  "maxAge": 35,
  "minFollowers": 10000,
  "maxFollowers": 500000,
  "niches": ["lifestyle", "fashion"],
  "enableSpanishDetection": true,
  "enableAgeEstimation": true,
  "userQuery": "Find young Spanish lifestyle influencers"
}
```

#### Response

```typescript
{
  success: boolean;
  results: EnhancedInfluencerProfile[];
  metadata: {
    totalFound: number;
    spanishValidated: number;
    ageEstimated: number;
    starngageEnhanced: number;    // NEW: Number of results with real demographics
    averageConfidence: number;
    processingTime: number;
    searchCriteria: object;
  };
  recommendations: string[];
}
```

#### StarNgage Integration (v2.7.0)
**NEW**: Top search results now include real audience demographics from StarNgage.com:

- **Enhanced Result Prioritization**: StarNgage-enhanced results appear first
- **Real Demographics**: Actual age/gender breakdowns replace estimates
- **Top 10 Enhancement**: Regular search enhances top 10 results with real data
- **Progressive Enhancement**: Streaming search enhances top 5 results
- **Graceful Fallback**: Generic demographics when StarNgage unavailable

#### Example Response

```json
{
  "success": true,
  "results": [
    {
      "username": "maria_madrid",
      "fullName": "María García",
      "followers": 125000,
      "platform": "instagram",
      "biography": "Lifestyle blogger from Madrid 🇪🇸 | 25 años",
      "location": "Madrid, Spain",
      "spanishValidation": {
        "isSpanish": true,
        "confidence": 92,
        "indicators": ["Madrid", "🇪🇸", "años"],
        "score": 45
      },
      "ageEstimation": {
        "estimatedAge": 25,
        "confidence": 90,
        "method": "direct_mention",
        "ageRange": "25-34"
      },
      "scoreAdjustments": {
        "spanishBonus": 25,
        "ageMatchBonus": 15,
        "totalAdjustment": 40
      },
      "enhancementDetails": {
        "spanishDetected": true,
        "ageEstimated": true,
        "starngageEnhanced": true,
        "confidenceScore": 91
      },
      "audienceDemographics": {
        "ageGroups": {
          "18-24": 35,
          "25-34": 42,
          "35-44": 15,
          "45-54": 8
        },
        "gender": {
          "male": 23,
          "female": 74,
          "other": 3
        },
        "topLocations": ["Madrid", "Barcelona", "Valencia"],
        "interests": ["Fashion", "Travel", "Food"]
      }
    }
  ],
  "metadata": {
    "totalFound": 15,
    "spanishValidated": 12,
    "ageEstimated": 8,
    "starngageEnhanced": 10,
    "averageConfidence": 78,
    "processingTime": 2340,
    "searchCriteria": {
      "location": "Spain",
      "ageRange": "20-35",
      "spanishDetection": true
    }
  },
  "recommendations": [
    "85% of results were successfully validated as Spanish",
    "Consider expanding age range for more results",
    "High confidence in Spanish detection (92% average)"
  ]
}
```

### 2. Profile Verification

**Endpoint:** `POST /api/verify-profiles`

**Description:** Verify and enhance influencer profiles with detailed scoring and validation.

#### Request Body

```typescript
{
  profiles: {
    username: string;
    platform: string;
  }[];
  verificationLevel: 'basic' | 'full';
  searchCriteria?: {
    location?: string;
    niches?: string[];
    ageRange?: { min: number; max: number; };
  };
}
```

#### Example Request

```json
{
  "profiles": [
    { "username": "maria_madrid", "platform": "instagram" },
    { "username": "carlos_bcn", "platform": "instagram" }
  ],
  "verificationLevel": "full",
  "searchCriteria": {
    "location": "Spain",
    "niches": ["lifestyle"],
    "ageRange": { "min": 20, "max": 35 }
  }
}
```

#### Response

```typescript
{
  success: boolean;
  verifiedProfiles: VerifiedProfile[];
  summary: {
    totalProcessed: number;
    successfulVerifications: number;
    averageScore: number;
    processingTime: number;
  };
}
```

### 3. Enhanced Chat API with Collaboration Detection

**Endpoint:** `POST /api/chat`

**Description:** Intelligent chat interface that automatically detects and processes both influencer search queries and brand collaboration verification requests.

#### Request Body

```typescript
{
  message: string;  // Natural language query in English or Spanish
}
```

#### Query Types Supported

##### Search Queries
- "Find fashion influencers in Madrid"
- "Busca influencers de lifestyle con 50k seguidores"
- "Show me tech YouTubers with over 100k subscribers"

##### Collaboration Queries
- "Check if @username collaborated with Nike"
- "Verifica si @influencer trabajó con Zara"
- "Has @handle worked with brand partnership"

#### Example Requests

**Search Query:**
```json
{
  "message": "Find female lifestyle influencers in Spain with 10k-100k followers"
}
```

**Collaboration Query:**
```json
{
  "message": "Check if @morganinspain collaborated with Nike"
}
```

#### Response Types

##### Search Response
```typescript
{
  success: boolean;
  type: "search";
  data: ApifySearchParams;  // Parsed search parameters
}
```

##### Collaboration Response
```typescript
{
  success: boolean;
  type: "collaboration";
  data: string;  // Formatted collaboration report
  rawData: {
    collaboration: {
      hasWorkedTogether: boolean;
      collaborationType: "partnership" | "mention" | "none";
      confidence: number;
      evidence: string[];
      reason: string;
      lastCollabDate?: string;
    };
    brandName: string;
    influencerHandle: string;
    postsAnalyzed: number;
  };
}
```

##### Chat Response
```typescript
{
  success: boolean;
  type: "chat";
  data: string;  // Conversational response
}
```

#### Example Responses

**Search Response:**
```json
{
  "success": true,
  "type": "search",
  "data": {
    "platforms": ["Instagram"],
    "niches": ["lifestyle"],
    "minFollowers": 10000,
    "maxFollowers": 100000,
    "location": "Spain",
    "gender": "female",
    "maxResults": 20,
    "userQuery": "Find female lifestyle influencers in Spain with 10k-100k followers"
  }
}
```

**Collaboration Found:**
```json
{
  "success": true,
  "type": "collaboration",
  "data": "✅ **Colaboración confirmada!**\n\n🤝 **@username** ha trabajado con **Nike**\n📊 **Confianza:** 85%\n🎯 **Tipo:** Colaboración patrocinada\n\n📝 **Evidencia encontrada:**\n• Sponsored post with #NikePartner hashtag\n• Product mention in bio\n• Tagged Nike account in multiple posts\n\n📅 **Última colaboración:** 2024-01-15",
  "rawData": {
    "collaboration": {
      "hasWorkedTogether": true,
      "collaborationType": "partnership",
      "confidence": 85,
      "evidence": [
        "Sponsored post with #NikePartner hashtag",
        "Product mention in bio",
        "Tagged Nike account in multiple posts"
      ],
      "reason": "Analyzed from recent posts",
      "lastCollabDate": "2024-01-15"
    },
    "brandName": "Nike",
    "influencerHandle": "username",
    "postsAnalyzed": 20
  }
}
```

**No Collaboration Found:**
```json
{
  "success": true,
  "type": "collaboration",
  "data": "❌ **No se encontró evidencia de colaboración**\n\n🔍 **@username** y **Nike**\n📊 **Posts analizados:** 20\n📝 **Razón:** Sin evidencia en posts recientes",
  "rawData": {
    "collaboration": {
      "hasWorkedTogether": false,
      "collaborationType": "none",
      "confidence": 0,
      "evidence": [],
      "reason": "Analyzed from recent posts"
    },
    "brandName": "Nike",
    "influencerHandle": "username",
    "postsAnalyzed": 20
  }
}
```

**Chat Response:**
```json
{
  "success": true,
  "type": "chat",
  "data": "¡Hola! Puedo ayudarte a:\n• Encontrar influencers perfectos para tu marca\n• Verificar colaboraciones entre influencers y marcas\n\n¿Qué necesitas hoy?"
}
```

#### Supported Languages
- **English**: Full search and collaboration detection
- **Spanish**: Native support for both query types

#### Key Features
- **Automatic Intent Detection**: Distinguishes between search, collaboration, and conversational queries
- **Brand Name Extraction**: Recognizes major brands and custom brand names
- **Influencer Handle Parsing**: Extracts @username mentions automatically
- **Error Guidance**: Provides helpful prompts when missing required information
- **Multi-language Support**: Works seamlessly in English and Spanish

### 4. Brand Collaboration Verification

**Endpoint:** `POST /api/check-brand-collaboration`

**Description:** Dedicated endpoint for verifying brand collaborations between influencers and companies.

#### Request Body

```typescript
{
  influencerHandle: string;    // Without @ symbol
  brandName: string;           // Brand or company name
  postsToCheck?: number;       // Default: 20
}
```

#### Example Request

```json
{
  "influencerHandle": "morganinspain",
  "brandName": "Nike",
  "postsToCheck": 20
}
```

#### Response

```typescript
{
  success: boolean;
  collaboration: {
    hasWorkedTogether: boolean;
    collaborationType: "partnership" | "mention" | "none";
    confidence: number;        // 0-100
    evidence: string[];
    reason: string;
    lastCollabDate?: string;
  };
  brandName: string;
  influencerHandle: string;
  postsAnalyzed: number;
  fallbackMethod?: string;     // If posts unavailable
}
```

### 5. Standard Search Influencers

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