# LAYAI Brief Processing & Enhanced Matching Guide

## 🎯 Overview

LAYAI's enhanced brief processing system transforms any campaign brief format into structured variables and finds optimal influencer matches using intelligent multi-dimensional scoring.

## 📋 Brief Processing Pipeline

### 1. **Universal Input Support**

```typescript
// Process any format
const brief = await UnifiedBriefProcessor.processBrief(
  input,      // string | File
  inputType   // 'text' | 'pdf' | 'url'
);
```

**Supported Formats:**
- ✅ **Text Briefs**: Natural language campaign descriptions
- ✅ **PDF Documents**: Uploaded campaign briefs with text extraction
- ✅ **Structured Briefs**: Formal campaign documentation
- ✅ **URL Extraction**: Campaign briefs from web pages *(coming soon)*

### 2. **Smart Variable Extraction**

The system extracts **12+ campaign variables** automatically:

```typescript
interface ProcessedBrief {
  // Core Campaign
  brandName: string;           // "IKEA"
  industry: string;            // "home_furnishing"
  campaignType: string;        // "product_launch"
  
  // Targeting
  geography: string[];         // ["Spain", "Madrid"]
  platforms: string[];         // ["Instagram", "TikTok"]
  followerRange: {min, max};   // {min: 10000, max: 500000}
  
  // Content Requirements
  niche: string[];             // ["home", "lifestyle"]
  tone: string;                // "authentic", "luxury", "casual"
  values: string[];            // ["sustainability", "innovation"]
  
  // Campaign Specs
  budget: {min, max, currency}; // {min: 5000, max: 15000, currency: "EUR"}
  influencerCount: number;      // 8
  timeline: string;             // "6 weeks"
  
  // Demographics
  demographics: {
    gender: 'male' | 'female' | 'any';
    ageRange: string;           // "25-35"
    interests: string[];        // ["home decor", "design"]
  };
  
  // Quality Filters
  verified?: boolean;
  engagementMin?: number;       // 0.03
  
  // Metadata
  confidence: number;           // 0.85
  source: 'pdf' | 'text' | 'manual';
  extractedAt: Date;
}
```

### 3. **AI + Rule-Based Parsing**

**Primary**: OpenAI GPT-4 for intelligent extraction
```typescript
const prompt = `Extract campaign variables from this brief. Return JSON with:
{
  "brandName": "brand name",
  "niche": ["niches"],
  "demographics": {"gender": "male/female/any", "ageRange": "25-35"},
  // ... full schema
}`;
```

**Fallback**: Rule-based extraction for reliability
```typescript
// Brand name patterns
const brandPatterns = [
  /(?:brand|marca)[:\s]+([A-Za-z0-9\s&.-]+?)(?:\s|$|\.|,)/gi,
  /(?:client|cliente)[:\s]+([A-Za-z0-9\s&.-]+?)(?:\s|$|\.|,)/gi
];

// Niche mapping
const nicheMap = {
  'fashion': ['fashion', 'style', 'clothing', 'moda'],
  'fitness': ['fitness', 'gym', 'workout', 'health'],
  'home': ['home', 'interior', 'decor', 'furniture', 'ikea']
};
```

## 🎯 Enhanced Matching Engine

### 1. **Multi-Dimensional Scoring**

Each influencer receives **7 comprehensive scores**:

```typescript
interface EnhancedMatchResult {
  scores: {
    overall: number;              // 87 (weighted combination)
    brandCompatibility: number;   // 90 (brand alignment)
    demographicMatch: number;     // 85 (audience overlap)
    contentAlignment: number;     // 88 (niche fit)
    engagementQuality: number;    // 82 (performance)
    audienceOverlap: number;      // 86 (interest alignment)
    riskScore: number;            // 91 (brand safety)
  };
}
```

### 2. **Intelligent Explanations**

Every match includes **detailed reasoning**:

```typescript
explanations: {
  whyGoodMatch: [
    "Perfect brand alignment with IKEA's home aesthetic",
    "Strong audience demographic overlap (25-35 age group)",
    "High engagement rate (6.2%) with authentic interactions"
  ],
  potentialConcerns: [
    "Follower count slightly above target range",
    "Limited past furniture brand collaborations"
  ],
  recommendations: [
    "Ideal for furniture styling and room makeover content",
    "Consider 2-3 posts plus stories for optimal reach"
  ]
}
```

### 3. **Performance Predictions**

Accurate campaign forecasting:

```typescript
predictions: {
  estimatedCPM: 850,           // €850 per thousand impressions
  estimatedReach: 8500,        // Expected organic reach
  estimatedEngagement: 527,    // Expected likes + comments
  campaignFitScore: 89         // Overall campaign suitability
}
```

### 4. **Adaptive Search Strategies**

**Exact Strategy**: Precise matching for specific requirements
```typescript
weights: {
  geography: 25,    // High weight for location match
  niche: 35,        // Very high for content alignment
  audience: 25,     // Strong demographic focus
  budget: 20,       // Budget consciousness
  engagement: 15,   // Quality baseline
  brand: 20         // Brand safety
}
```

**Broad Strategy**: Balanced discovery
```typescript
weights: {
  geography: 15,    // Moderate location importance
  niche: 25,        // Strong content focus
  audience: 20,     // Balanced demographics
  budget: 15,       // Flexible budget
  engagement: 10,   // Basic quality
  brand: 15         // Standard safety
}
```

**Discovery Strategy**: Creative exploration
```typescript
weights: {
  geography: 10,    // Low location restriction
  niche: 30,        // Content-first approach
  audience: 15,     // Open demographics
  budget: 10,       // Budget flexible
  engagement: 20,   // High quality focus
  brand: 15         // Safety maintained
}
```

## 🚀 API Usage

### Complete Brief Processing Pipeline

```bash
# Process campaign brief and find matches
curl -X POST http://localhost:3000/api/enhanced-brief-matching \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Brand: IKEA. Target: Women 25-35 in Spain interested in home decor. Budget: €10,000. Platforms: Instagram, TikTok.",
    "inputType": "text",
    "searchStrategy": "broad"
  }'
```

### Example Responses

```json
{
  "success": true,
  "brief": {
    "brandName": "IKEA",
    "niche": ["home", "lifestyle"],
    "geography": ["Spain"],
    "platforms": ["Instagram", "TikTok"],
    "demographics": {
      "gender": "female",
      "ageRange": "25-35",
      "interests": ["home decor"]
    },
    "budget": {
      "min": 10000,
      "max": 10000,
      "currency": "EUR"
    },
    "confidence": 0.85
  },
  "matching": {
    "matches": [
      {
        "influencer": {
          "name": "Maria_HomeDesign",
          "handle": "maria_homedesign",
          "platform": "Instagram",
          "followerCount": 85000,
          "engagementRate": 0.062
        },
        "scores": {
          "overall": 87,
          "brandCompatibility": 90,
          "demographicMatch": 85,
          "contentAlignment": 88,
          "engagementQuality": 82,
          "audienceOverlap": 86,
          "riskScore": 91
        },
        "explanations": {
          "whyGoodMatch": [
            "Perfect home/lifestyle content alignment",
            "Spain-based audience with strong engagement"
          ],
          "recommendations": [
            "Ideal for furniture styling content",
            "Strong authentic voice for IKEA values"
          ]
        },
        "predictions": {
          "estimatedCPM": 850,
          "estimatedReach": 8500,
          "estimatedEngagement": 527,
          "campaignFitScore": 89
        }
      }
    ],
    "summary": {
      "totalFound": 23,
      "averageScore": 78,
      "topCategories": ["home", "lifestyle", "design"],
      "budgetAnalysis": {
        "withinBudget": 18,
        "overBudget": 5,
        "averageCost": 720
      }
    },
    "suggestions": {
      "expandSearch": ["Consider related design niches"],
      "adjustCriteria": ["Lower minimum follower requirement for more options"],
      "alternativeNiches": ["interior_design", "diy", "organization"]
    }
  }
}
```

### Test with Examples

```bash
# Test IKEA campaign
curl "http://localhost:3000/api/enhanced-brief-matching?example=ikea"

# Test Nike fitness campaign
curl "http://localhost:3000/api/enhanced-brief-matching?example=nike"

# Test discovery mode
curl "http://localhost:3000/api/enhanced-brief-matching?example=discovery"
```

## 🔧 Integration Examples

### 1. **Simple Text Brief Processing**

```javascript
// Frontend integration
const processedBrief = await fetch('/api/enhanced-brief-matching', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: userBriefText,
    inputType: 'text',
    searchStrategy: 'broad'
  })
});

const { brief, matching } = await processedBrief.json();
```

### 2. **PDF Brief Upload**

```javascript
// Handle PDF upload
const formData = new FormData();
formData.append('file', pdfFile);

const analysis = await fetch('/api/analyze-proposal', {
  method: 'POST',
  body: formData
});

const { extractedText } = await analysis.json();

// Process with enhanced matching
const results = await fetch('/api/enhanced-brief-matching', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: extractedText,
    inputType: 'text',
    searchStrategy: 'exact'
  })
});
```

### 3. **Campaign Management Integration**

```javascript
// Save results to campaign
const campaign = {
  name: brief.brandName + ' Campaign',
  brandName: brief.brandName,
  brief: brief,
  matches: matching.matches,
  budget: brief.budget.max,
  status: 'Planning'
};

await fetch('/api/database/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_enhanced',
    campaign
  })
});
```

## 📊 Scoring Deep Dive

### Brand Compatibility Calculation

```typescript
// Uses existing brand intelligence engine
const brandProfile = analyzeBrand(briefBrandName);
const compatibility = await calculateDynamicBrandCompatibility(
  influencer, 
  brandProfile
);

// Factors:
// - Content theme alignment (40%)
// - Brand value overlap (30%) 
// - Aesthetic compatibility (20%)
// - Risk assessment (10%)
```

### Demographic Matching Algorithm

```typescript
// Gender alignment
if (targetGender === 'female' && audienceGender.female > 60) {
  score += 80;
}

// Age range overlap
const ageOverlap = calculateAgeDistributionOverlap(
  influencerAudience.age,
  targetAgeRange
);

// Location alignment
const locationScore = calculateGeographicOverlap(
  influencerAudience.location,
  targetGeography
);
```

### Risk Assessment Factors

```typescript
// Engagement authenticity
if (engagementRate > 0.15) riskScore -= 30; // Suspiciously high
if (engagementRate < 0.01) riskScore -= 20; // Very low

// Follower quality
const followerRatio = followers / following;
if (followerRatio < 2) riskScore -= 15; // Poor ratio

// Content safety
const bio = influencer.biography.toLowerCase();
const riskKeywords = ['controversy', 'scandal'];
if (hasRiskKeywords) riskScore -= 25;
```

## 🔍 Advanced Features

### 1. **Multi-Source Result Merging**

The system combines results from:
- **Spanish Database**: 3000+ verified influencers
- **Real-time APIs**: Apify, web scraping
- **StarNgage**: Demographic enrichment

### 2. **Confidence Scoring**

Each result includes confidence metrics:
```typescript
confidence = baseScore + 
  (hasRealDemographics ? 0.15 : 0) +
  (isVerified ? 0.1 : 0) +
  (hasBio ? 0.05 : 0) +
  (hasEngagementData ? 0.1 : 0);
```

### 3. **Smart Suggestions**

The system provides actionable insights:
- **Expand Search**: Alternative niches and geographies
- **Adjust Criteria**: Optimization recommendations
- **Budget Analysis**: Cost optimization suggestions

## 🎯 Best Practices

### 1. **Brief Writing for Optimal Results**

```text
✅ GOOD BRIEF:
Brand: IKEA
Campaign: Summer furniture collection launch
Target: Spanish women aged 25-35 interested in home decoration and sustainable living
Budget: €8,000-€12,000 total
Platforms: Instagram (primary), TikTok (secondary)
Content: Room styling posts, sustainable living tips, furniture assembly videos
Timeline: 8 weeks
Tone: Authentic, accessible, sustainability-focused

❌ POOR BRIEF:
Find some influencers for our brand. Budget is flexible. Any platform is fine.
```

### 2. **Choosing Search Strategies**

- **Exact**: When you have specific, non-negotiable requirements
- **Broad**: For balanced discovery with reasonable flexibility
- **Discovery**: When exploring new niches or creative opportunities

### 3. **Interpreting Results**

- **Overall Score 80+**: Excellent match, proceed with confidence
- **Overall Score 60-79**: Good match, review explanations
- **Overall Score <60**: Consider adjusting criteria or expanding search

## 🚀 Future Enhancements

- **URL Brief Extraction**: Process briefs from web pages
- **Multi-Language Support**: Brief processing in Spanish, French, etc.
- **Visual Brief Analysis**: Extract variables from campaign mood boards
- **Collaborative Filtering**: Learn from successful campaign patterns
- **Real-Time Budget Optimization**: Dynamic cost suggestions based on market data

---

**Ready to transform your campaign briefs into perfectly matched influencer partnerships? Start with the enhanced brief processing API today!** 🚀 