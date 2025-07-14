export interface ProcessedBrief {
  // Core campaign variables
  brandName: string;
  industry: string;
  campaignType: string;
  
  // Target specifications
  geography: string[];
  platforms: string[];
  followerRange: { min: number; max: number };
  
  // Campaign requirements  
  niche: string[];
  tone: string;
  values: string[];
  timeline: string;
  
  // Budget & scale
  budget: { min: number; max: number; currency: string };
  influencerCount: number;
  
  // Content requirements
  contentTypes: string[];
  deliverables: string[];
  
  // Audience targeting
  demographics: {
    gender?: 'male' | 'female' | 'any';
    ageRange?: string;
    interests: string[];
  };
  
  // Quality filters
  verified?: boolean;
  engagementMin?: number;
  
  // Processing metadata
  confidence: number;
  source: 'pdf' | 'text' | 'manual';
  extractedAt: Date;
}

export interface MatchingCriteria extends ProcessedBrief {
  // Weighted importance (0-100)
  weights: {
    geography: number;
    niche: number; 
    audience: number;
    budget: number;
    engagement: number;
    brand: number;
  };
  
  // Search strategy
  searchStrategy: 'exact' | 'broad' | 'discovery';
  maxResults: number;
}

export class UnifiedBriefProcessor {
  
  /**
   * Main entry point - processes any brief format into clean variables
   */
  static async processBrief(
    input: string | File, 
    inputType: 'pdf' | 'text' | 'url'
  ): Promise<ProcessedBrief> {
    
    let extractedText: string;
    let source: ProcessedBrief['source'];
    
    // Step 1: Extract text from input
    if (inputType === 'pdf') {
      extractedText = await this.extractPDFText(input as File);
      source = 'pdf';
    } else if (inputType === 'url') {
      extractedText = await this.extractFromURL(input as string);
      source = 'text';
    } else {
      extractedText = input as string;
      source = 'text';
    }
    
    // Step 2: Parse with AI if available, fallback to rules
    const parsed = await this.intelligentParse(extractedText)
      .catch(() => this.ruleBasedParse(extractedText));
    
    // Step 3: Validate and enrich
    const validated = this.validateAndEnrich(parsed);
    
    return {
      ...validated,
      source,
      extractedAt: new Date(),
      confidence: this.calculateConfidence(validated, extractedText)
    };
  }
  
  /**
   * Convert processed brief to matching criteria with intelligent weighting
   */
  static briefToMatchingCriteria(
    brief: ProcessedBrief,
    searchStrategy: 'exact' | 'broad' | 'discovery' = 'broad'
  ): MatchingCriteria {
    
    // Dynamic weight calculation based on brief specificity
    const weights = this.calculateWeights(brief, searchStrategy);
    
    return {
      ...brief,
      weights,
      searchStrategy,
      maxResults: searchStrategy === 'discovery' ? 50 : 20
    };
  }
  
  /**
   * AI-powered parsing using OpenAI
   */
  private static async intelligentParse(text: string): Promise<Partial<ProcessedBrief>> {
    const prompt = `Extract campaign brief variables from this text. Return JSON:
    
    {
      "brandName": "brand name",
      "industry": "industry/category", 
      "campaignType": "campaign type",
      "geography": ["locations"],
      "platforms": ["platforms"],
      "followerRange": {"min": 0, "max": 0},
      "niche": ["niches"],
      "tone": "communication tone",
      "values": ["brand values"],
      "timeline": "timeline/duration",
      "budget": {"min": 0, "max": 0, "currency": "EUR"},
      "influencerCount": 0,
      "contentTypes": ["content types"],
      "deliverables": ["deliverables"],
      "demographics": {
        "gender": "male/female/any",
        "ageRange": "age range", 
        "interests": ["interests"]
      },
      "verified": true/false,
      "engagementMin": 0.0
    }
    
    Text: ${text}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }
  
  /**
   * Rule-based parsing fallback
   */
  private static ruleBasedParse(text: string): Partial<ProcessedBrief> {
    const lowerText = text.toLowerCase();
    
    // Extract brand name
    const brandName = this.extractBrandName(text);
    
    // Extract platforms
    const platforms = [];
    if (lowerText.includes('instagram')) platforms.push('Instagram');
    if (lowerText.includes('tiktok')) platforms.push('TikTok'); 
    if (lowerText.includes('youtube')) platforms.push('YouTube');
    
    // Extract geography
    const geography = this.extractGeography(text);
    
    // Extract niches
    const niche = this.extractNiches(text);
    
    // Extract demographics
    const demographics = this.extractDemographics(text);
    
    // Extract budget
    const budget = this.extractBudget(text);
    
    // Extract follower range
    const followerRange = this.extractFollowerRange(text);
    
    return {
      brandName,
      platforms: platforms.length > 0 ? platforms : ['Instagram'],
      geography,
      niche,
      demographics,
      budget,
      followerRange,
      campaignType: this.inferCampaignType(text),
      industry: this.inferIndustry(brandName || '', niche),
      tone: this.extractTone(text),
      timeline: this.extractTimeline(text)
    };
  }
  
  /**
   * Calculate intelligent weights based on brief specificity  
   */
  private static calculateWeights(
    brief: ProcessedBrief, 
    strategy: 'exact' | 'broad' | 'discovery'
  ): MatchingCriteria['weights'] {
    
    const baseWeights = {
      geography: 15,
      niche: 25, 
      audience: 20,
      budget: 15,
      engagement: 10,
      brand: 15
    };
    
    // Adjust based on strategy
    if (strategy === 'exact') {
      return {
        geography: brief.geography.length > 0 ? 25 : 5,
        niche: brief.niche.length > 0 ? 35 : 10,
        audience: brief.demographics.ageRange ? 25 : 15,
        budget: brief.budget.max > 0 ? 25 : 10,
        engagement: 15,
        brand: 20
      };
    }
    
    if (strategy === 'discovery') {
      return {
        geography: 10,
        niche: 30,
        audience: 15, 
        budget: 10,
        engagement: 20,
        brand: 15
      };
    }
    
    return baseWeights; // broad strategy
  }
  
  /**
   * Validate and enrich parsed data
   */
  private static validateAndEnrich(parsed: Partial<ProcessedBrief>): ProcessedBrief {
    return {
      brandName: parsed.brandName || 'Unknown Brand',
      industry: parsed.industry || 'General',
      campaignType: parsed.campaignType || 'brand_awareness',
      geography: parsed.geography || ['Spain'],
      platforms: parsed.platforms || ['Instagram'],
      followerRange: parsed.followerRange || { min: 10000, max: 500000 },
      niche: parsed.niche || ['lifestyle'],
      tone: parsed.tone || 'authentic',
      values: parsed.values || [],
      timeline: parsed.timeline || '30 days',
      budget: parsed.budget || { min: 1000, max: 10000, currency: 'EUR' },
      influencerCount: parsed.influencerCount || 5,
      contentTypes: parsed.contentTypes || ['posts', 'stories'],
      deliverables: parsed.deliverables || [],
      demographics: {
        gender: parsed.demographics?.gender || 'any',
        ageRange: parsed.demographics?.ageRange || '18-45',
        interests: parsed.demographics?.interests || []
      },
      verified: parsed.verified,
      engagementMin: parsed.engagementMin || 0.02,
      confidence: 0.8,
      source: 'text',
      extractedAt: new Date()
    };
  }
  
  // Helper extraction methods (keeping your existing logic)
  private static extractBrandName(text: string): string {
    const brandPatterns = [
      /(?:brand|marca)[:\s]+([A-Za-z0-9\s&.-]+?)(?:\s|$|\.|,)/gi,
      /(?:client|cliente)[:\s]+([A-Za-z0-9\s&.-]+?)(?:\s|$|\.|,)/gi,
      /(?:company|empresa)[:\s]+([A-Za-z0-9\s&.-]+?)(?:\s|$|\.|,)/gi,
      // Add more brand detection patterns
    ];
    
    for (const pattern of brandPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }
    
    return '';
  }
  
  private static extractGeography(text: string): string[] {
    const locations = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('spain') || lowerText.includes('españa')) {
      locations.push('Spain');
    }
    if (lowerText.includes('madrid')) locations.push('Madrid');
    if (lowerText.includes('barcelona')) locations.push('Barcelona');
    // Add more location detection
    
    return locations.length > 0 ? locations : ['Spain'];
  }
  
  private static extractNiches(text: string): string[] {
    const nicheMap = {
      'fashion': ['fashion', 'style', 'clothing', 'moda'],
      'fitness': ['fitness', 'gym', 'workout', 'health', 'sport'],
      'tech': ['tech', 'technology', 'gadget', 'software'],
      'beauty': ['beauty', 'makeup', 'skincare', 'cosmetic', 'belleza'],
      'food': ['food', 'cooking', 'recipe', 'chef', 'comida'],
      'travel': ['travel', 'adventure', 'viaje', 'vacation'],
      'lifestyle': ['lifestyle', 'daily', 'life', 'estilo'],
      'home': ['home', 'interior', 'decor', 'furniture', 'ikea', 'casa'],
      'gaming': ['gaming', 'game', 'esports', 'gamer']
    };
    
    const foundNiches = [];
    const lowerText = text.toLowerCase();
    
    for (const [niche, keywords] of Object.entries(nicheMap)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundNiches.push(niche);
      }
    }
    
    return foundNiches.length > 0 ? foundNiches : ['lifestyle'];
  }
  
  private static extractDemographics(text: string): ProcessedBrief['demographics'] {
    const lowerText = text.toLowerCase();
    
    // Extract gender
    let gender: 'male' | 'female' | 'any' = 'any';
    if (lowerText.includes('female') || lowerText.includes('women') || lowerText.includes('mujer')) {
      gender = 'female';
    } else if (lowerText.includes('male') || lowerText.includes('men') || lowerText.includes('hombre')) {
      gender = 'male';
    }
    
    // Extract age range
    const ageMatch = text.match(/(\d{2})\s*[-a-]\s*(\d{2})/);
    const ageRange = ageMatch ? `${ageMatch[1]}-${ageMatch[2]}` : '18-45';
    
    return {
      gender,
      ageRange,
      interests: [] // Could extract interests with more patterns
    };
  }
  
  private static extractBudget(text: string): ProcessedBrief['budget'] {
    const budgetMatches = text.match(/(\d+(?:[\.,]\d{3})*)\s*(?:€|euros?|\$|dollars?)/gi);
    
    if (budgetMatches && budgetMatches.length > 0) {
      const amounts = budgetMatches.map(match => {
        const num = match.replace(/[€$,\.]/g, '').replace(/euros?|dollars?/gi, '');
        return parseInt(num);
      }).filter(num => !isNaN(num));
      
      if (amounts.length > 0) {
        return {
          min: Math.min(...amounts),
          max: Math.max(...amounts),
          currency: text.includes('€') ? 'EUR' : 'USD'
        };
      }
    }
    
    return { min: 1000, max: 10000, currency: 'EUR' };
  }
  
  private static extractFollowerRange(text: string): ProcessedBrief['followerRange'] {
    // Extract follower patterns like "10k-100k", "minimum 50k", etc.
    const followerPatterns = [
      /(\d+(?:\.\d+)?)\s*k?\s*-\s*(\d+(?:\.\d+)?)\s*k?\s*followers?/i,
      /between\s+(\d+(?:\.\d+)?)\s*k?\s+and\s+(\d+(?:\.\d+)?)\s*k?\s*followers?/i,
      /minimum\s+(\d+(?:\.\d+)?)\s*k?\s*followers?/i,
      /min\s+(\d+(?:\.\d+)?)\s*k?\s*followers?/i
    ];
    
    for (const pattern of followerPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          // Range pattern
          const min = parseFloat(match[1]) * (match[1].includes('k') ? 1000 : 1);
          const max = parseFloat(match[2]) * (match[2].includes('k') ? 1000 : 1);
          return { min, max };
        } else {
          // Minimum pattern
          const min = parseFloat(match[1]) * (match[1].includes('k') ? 1000 : 1);
          return { min, max: min * 10 };
        }
      }
    }
    
    return { min: 10000, max: 500000 };
  }
  
  private static inferCampaignType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('launch') || lowerText.includes('lanzamiento')) {
      return 'product_launch';
    }
    if (lowerText.includes('awareness') || lowerText.includes('brand')) {
      return 'brand_awareness';
    }
    if (lowerText.includes('event') || lowerText.includes('evento')) {
      return 'event_promotion';
    }
    if (lowerText.includes('seasonal') || lowerText.includes('temporada')) {
      return 'seasonal_campaign';
    }
    
    return 'brand_awareness';
  }
  
  private static inferIndustry(brandName: string, niches: string[]): string {
    const brand = brandName.toLowerCase();
    
    // Brand-specific industry mapping
    if (brand.includes('ikea')) return 'home_furnishing';
    if (brand.includes('zara') || brand.includes('h&m')) return 'fashion';
    if (brand.includes('nike') || brand.includes('adidas')) return 'sports';
    
    // Niche-based industry mapping
    if (niches.includes('fashion')) return 'fashion';
    if (niches.includes('tech')) return 'technology';
    if (niches.includes('beauty')) return 'beauty_cosmetics';
    if (niches.includes('food')) return 'food_beverage';
    if (niches.includes('travel')) return 'travel_tourism';
    if (niches.includes('fitness')) return 'health_fitness';
    if (niches.includes('home')) return 'home_furnishing';
    
    return 'general';
  }
  
  private static extractTone(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('professional') || lowerText.includes('formal')) {
      return 'professional';
    }
    if (lowerText.includes('casual') || lowerText.includes('relaxed')) {
      return 'casual';
    }
    if (lowerText.includes('fun') || lowerText.includes('playful')) {
      return 'playful';
    }
    if (lowerText.includes('luxury') || lowerText.includes('premium')) {
      return 'luxury';
    }
    if (lowerText.includes('authentic') || lowerText.includes('genuine')) {
      return 'authentic';
    }
    
    return 'authentic';
  }
  
  private static extractTimeline(text: string): string {
    const timelinePatterns = [
      /duration[:\s]+([^.\n]+)/i,
      /timeline[:\s]+([^.\n]+)/i,
      /(\d+)\s*(?:days?|semanas?|weeks?|months?|meses?)/i,
      /(Q[1-4]\s*\d{4})/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4}/i
    ];
    
    for (const pattern of timelinePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '30 days';
  }
  
  private static calculateConfidence(brief: ProcessedBrief, originalText: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on extracted data quality
    if (brief.brandName && brief.brandName !== 'Unknown Brand') confidence += 0.2;
    if (brief.niche.length > 1) confidence += 0.1;
    if (brief.geography.length > 0) confidence += 0.1;
    if (brief.budget.max > 0) confidence += 0.1;
    if (brief.demographics.gender !== 'any') confidence += 0.05;
    if (brief.demographics.ageRange !== '18-45') confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }
  
  private static async extractPDFText(file: File): Promise<string> {
    // Use your existing PDF extraction logic from analyze-proposal/route.ts
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }
      
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false,
      });
      
      const pdf = await loadingTask.promise;
      let extractedText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n';
      }
      
      return extractedText;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
  
  private static async extractFromURL(url: string): Promise<string> {
    // Implement URL text extraction if needed
    throw new Error('URL extraction not implemented yet');
  }
} 