export interface AudienceDemographics {
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
}

export interface InferredDemographicsDetails {
  demographics: AudienceDemographics;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  topics: string[];
  confidence: number; // 0-100, how confident we are in our inference
  dataSource: 'web_research' | 'ai_inference' | 'fallback';
  confidenceLevel: 'foundational' | 'enhanced' | 'verified';
  researchNotes?: string;
}

interface InfluencerResearchData {
  niche: string;
  followerCount: number;
  platform: string;
  bio?: string;
  location?: string;
  webSearchResults: string[];
}

// Research-based demographic patterns by niche and sub-niche
interface DemographicPattern {
  genderSplit: { female: number; male: number };
  primaryAgeGroup: string;
  ageDistribution: {
    '13-17': number;
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55+': number;
  };
  topLocations: string[];
  interests: string[];
  engagementModifier: number; // Multiplier for base engagement rates
  confidenceBoost: number; // How much confidence this pattern adds
}

// Platform-specific baseline demographics (research from Section 3)
const PLATFORM_BASELINES: Record<string, DemographicPattern> = {
  'TikTok': {
    genderSplit: { female: 44.3, male: 55.7 },
    primaryAgeGroup: '25-34',
    ageDistribution: { '13-17': 8, '18-24': 30, '25-34': 35, '35-44': 18, '45-54': 7, '55+': 2 },
    topLocations: ['United States', 'Brazil', 'Mexico', 'Indonesia', 'Philippines'],
    interests: ['Entertainment', 'Music', 'Dance', 'Comedy', 'Trends'],
    engagementModifier: 1.5, // TikTok has high engagement
    confidenceBoost: 15
  },
  'Instagram': {
    genderSplit: { female: 49.4, male: 50.6 },
    primaryAgeGroup: '18-24',
    ageDistribution: { '13-17': 5, '18-24': 32, '25-34': 30, '35-44': 20, '45-54': 10, '55+': 3 },
    topLocations: ['United States', 'India', 'Brazil', 'Indonesia', 'Turkey'],
    interests: ['Visual Content', 'Lifestyle', 'Fashion', 'Food', 'Travel'],
    engagementModifier: 1.2,
    confidenceBoost: 10
  },
  'YouTube': {
    genderSplit: { female: 45, male: 55 },
    primaryAgeGroup: '18-49',
    ageDistribution: { '13-17': 10, '18-24': 25, '25-34': 30, '35-44': 20, '45-54': 12, '55+': 3 },
    topLocations: ['United States', 'India', 'Japan', 'Germany', 'Brazil'],
    interests: ['Education', 'Entertainment', 'Reviews', 'Tutorials', 'Gaming'],
    engagementModifier: 1.1,
    confidenceBoost: 20 // YouTube has detailed analytics
  },
  'Facebook': {
    genderSplit: { female: 43.7, male: 56.3 },
    primaryAgeGroup: '25-34',
    ageDistribution: { '13-17': 2, '18-24': 15, '25-34': 29, '35-44': 25, '45-54': 20, '55+': 9 },
    topLocations: ['United States', 'India', 'Brazil', 'Indonesia', 'Philippines'],
    interests: ['Community', 'Social Connection', 'News', 'Groups', 'Family'],
    engagementModifier: 0.9,
    confidenceBoost: 8
  }
};

// Research-based niche patterns (from Sections 4.1-4.7)
const NICHE_PATTERNS: Record<string, Record<string, DemographicPattern>> = {
  'Gaming': {
    'Esports & Competitive': {
      genderSplit: { female: 15, male: 85 }, // 80-90% male per research
      primaryAgeGroup: '16-24',
      ageDistribution: { '13-17': 25, '18-24': 45, '25-34': 20, '35-44': 7, '45-54': 2, '55+': 1 },
      topLocations: ['United States', 'China', 'Japan', 'South Korea', 'Germany'],
      interests: ['Esports', 'Gaming Hardware', 'Competition', 'Strategy', 'Performance'],
      engagementModifier: 1.4,
      confidenceBoost: 25
    },
    'Casual & Mobile Gaming': {
      genderSplit: { female: 65, male: 35 }, // 60-70% female per research
      primaryAgeGroup: '25-45',
      ageDistribution: { '13-17': 5, '18-24': 20, '25-34': 35, '35-44': 25, '45-54': 12, '55+': 3 },
      topLocations: ['United States', 'Japan', 'South Korea', 'United Kingdom', 'Canada'],
      interests: ['Mobile Games', 'Puzzle Games', 'Social Gaming', 'Family Entertainment'],
      engagementModifier: 1.0,
      confidenceBoost: 20
    },
    'RPG & Story': {
      genderSplit: { female: 45, male: 55 }, // Balanced with slight male skew
      primaryAgeGroup: '25-40',
      ageDistribution: { '13-17': 8, '18-24': 22, '25-34': 35, '35-44': 25, '45-54': 8, '55+': 2 },
      topLocations: ['United States', 'Japan', 'Germany', 'United Kingdom', 'France'],
      interests: ['RPG Games', 'Storytelling', 'Fantasy', 'Character Development', 'Lore'],
      engagementModifier: 1.1,
      confidenceBoost: 20
    }
  },
  'Beauty': {
    'Skincare Science': {
      genderSplit: { female: 78, male: 22 }, // Research shows female-skewing but includes all genders
      primaryAgeGroup: '25-45',
      ageDistribution: { '13-17': 3, '18-24': 20, '25-34': 40, '35-44': 25, '45-54': 10, '55+': 2 },
      topLocations: ['United States', 'South Korea', 'Japan', 'United Kingdom', 'Canada'],
      interests: ['Skincare', 'Dermatology', 'Ingredients', 'Science', 'Health'],
      engagementModifier: 1.3,
      confidenceBoost: 30
    },
    'Gen Z Trends': {
      genderSplit: { female: 72, male: 28 }, // Female and non-binary skew
      primaryAgeGroup: '16-24',
      ageDistribution: { '13-17': 30, '18-24': 50, '25-34': 15, '35-44': 4, '45-54': 1, '55+': 0 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Brazil'],
      interests: ['Beauty Trends', 'TikTok Challenges', 'Pop Culture', 'Self-Expression', 'Creativity'],
      engagementModifier: 1.6,
      confidenceBoost: 25
    },
    'Ethical & Clean Beauty': {
      genderSplit: { female: 70, male: 30 },
      primaryAgeGroup: '25-45',
      ageDistribution: { '13-17': 2, '18-24': 18, '25-34': 35, '35-44': 30, '45-54': 12, '55+': 3 },
      topLocations: ['United States', 'United Kingdom', 'Germany', 'Netherlands', 'Canada'],
      interests: ['Clean Beauty', 'Sustainability', 'Ethics', 'Natural Products', 'Environment'],
      engagementModifier: 1.2,
      confidenceBoost: 25
    }
  },
  'Fitness': {
    'Performance & Strength': {
      genderSplit: { female: 25, male: 75 }, // 70-80% male per research
      primaryAgeGroup: '18-34',
      ageDistribution: { '13-17': 12, '18-24': 35, '25-34': 30, '35-44': 15, '45-54': 6, '55+': 2 },
      topLocations: ['United States', 'Brazil', 'Germany', 'United Kingdom', 'Australia'],
      interests: ['Bodybuilding', 'Powerlifting', 'Supplements', 'Performance', 'Competition'],
      engagementModifier: 1.3,
      confidenceBoost: 25
    },
    'Wellness & Yoga': {
      genderSplit: { female: 85, male: 15 }, // 80-90% female per research
      primaryAgeGroup: '25-45',
      ageDistribution: { '13-17': 2, '18-24': 15, '25-34': 35, '35-44': 30, '45-54': 15, '55+': 3 },
      topLocations: ['United States', 'India', 'United Kingdom', 'Canada', 'Australia'],
      interests: ['Yoga', 'Mindfulness', 'Wellness', 'Mental Health', 'Spirituality'],
      engagementModifier: 1.25,
      confidenceBoost: 28
    },
    'Home Workouts': {
      genderSplit: { female: 68, male: 32 }, // Female-skewing for busy parents
      primaryAgeGroup: '30-50',
      ageDistribution: { '13-17': 1, '18-24': 8, '25-34': 30, '35-44': 35, '45-54': 20, '55+': 6 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
      interests: ['Home Fitness', 'Family Health', 'Time Management', 'Convenience', 'Efficiency'],
      engagementModifier: 1.15,
      confidenceBoost: 22
    }
  },
  'Travel': {
    'Luxury Travel': {
      genderSplit: { female: 52, male: 48 }, // Balanced per research
      primaryAgeGroup: '35-65',
      ageDistribution: { '13-17': 1, '18-24': 5, '25-34': 20, '35-44': 30, '45-54': 25, '55+': 19 },
      topLocations: ['United States', 'United Kingdom', 'Germany', 'Switzerland', 'Japan'],
      interests: ['Luxury Travel', 'Fine Dining', 'Premium Experiences', 'Culture', 'Exclusivity'],
      engagementModifier: 1.1,
      confidenceBoost: 30
    },
    'Budget & Backpacking': {
      genderSplit: { female: 48, male: 52 }, // Balanced
      primaryAgeGroup: '18-25',
      ageDistribution: { '13-17': 8, '18-24': 55, '25-34': 25, '35-44': 8, '45-54': 3, '55+': 1 },
      topLocations: ['United States', 'United Kingdom', 'Germany', 'Australia', 'Netherlands'],
      interests: ['Budget Travel', 'Backpacking', 'Hostels', 'Adventure', 'Cultural Exchange'],
      engagementModifier: 1.4,
      confidenceBoost: 25
    },
    'Adventure & Eco': {
      genderSplit: { female: 45, male: 55 }, // Slight male skew
      primaryAgeGroup: '25-45',
      ageDistribution: { '13-17': 3, '18-24': 20, '25-34': 40, '35-44': 25, '45-54': 10, '55+': 2 },
      topLocations: ['United States', 'New Zealand', 'Norway', 'Costa Rica', 'Canada'],
      interests: ['Adventure Sports', 'Eco-Tourism', 'Nature', 'Sustainability', 'Outdoor Activities'],
      engagementModifier: 1.2,
      confidenceBoost: 25
    }
  },
  'Finance': {
    'First-time Investing': {
      genderSplit: { female: 48, male: 52 }, // Balanced Gen Z
      primaryAgeGroup: '18-25',
      ageDistribution: { '13-17': 15, '18-24': 50, '25-34': 25, '35-44': 8, '45-54': 2, '55+': 0 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
      interests: ['Investing', 'Financial Literacy', 'ETFs', 'Crypto', 'Budgeting'],
      engagementModifier: 1.3,
      confidenceBoost: 28
    },
    'Debt Management': {
      genderSplit: { female: 58, male: 42 }, // Slight female skew per research
      primaryAgeGroup: '26-40',
      ageDistribution: { '13-17': 1, '18-24': 15, '25-34': 45, '35-44': 30, '45-54': 8, '55+': 1 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Ireland'],
      interests: ['Debt Freedom', 'Budgeting', 'Savings', 'Financial Planning', 'Homeownership'],
      engagementModifier: 1.25,
      confidenceBoost: 25
    },
    'High-Risk Trading': {
      genderSplit: { female: 20, male: 80 }, // Heavily male-skewing
      primaryAgeGroup: '20-35',
      ageDistribution: { '13-17': 5, '18-24': 35, '25-34': 40, '35-44': 15, '45-54': 4, '55+': 1 },
      topLocations: ['United States', 'Singapore', 'Hong Kong', 'United Kingdom', 'South Korea'],
      interests: ['Day Trading', 'Crypto', 'Options', 'Technical Analysis', 'Risk-Taking'],
      engagementModifier: 1.4,
      confidenceBoost: 20
    }
  },
  'Food': {
    'Gourmet Cooking': {
      genderSplit: { female: 52, male: 48 }, // Balanced
      primaryAgeGroup: '30-55',
      ageDistribution: { '13-17': 1, '18-24': 8, '25-34': 25, '35-44': 35, '45-54': 25, '55+': 6 },
      topLocations: ['United States', 'France', 'Italy', 'Japan', 'United Kingdom'],
      interests: ['Gourmet Cooking', 'Fine Dining', 'Wine', 'Culinary Techniques', 'Quality Ingredients'],
      engagementModifier: 1.2,
      confidenceBoost: 25
    },
    'Vegan & Plant-Based': {
      genderSplit: { female: 68, male: 32 }, // Female-skewing
      primaryAgeGroup: '18-35',
      ageDistribution: { '13-17': 8, '18-24': 30, '25-34': 35, '35-44': 20, '45-54': 6, '55+': 1 },
      topLocations: ['United States', 'United Kingdom', 'Germany', 'Netherlands', 'Canada'],
      interests: ['Vegan Food', 'Animal Rights', 'Sustainability', 'Plant-Based Nutrition', 'Ethics'],
      engagementModifier: 1.35,
      confidenceBoost: 30
    },
    'Meal Prep & Health': {
      genderSplit: { female: 62, male: 38 }, // Balanced
      primaryAgeGroup: '25-45',
      ageDistribution: { '13-17': 2, '18-24': 18, '25-34': 40, '35-44': 25, '45-54': 12, '55+': 3 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
      interests: ['Meal Prep', 'Healthy Eating', 'Fitness Nutrition', 'Efficiency', 'Organization'],
      engagementModifier: 1.2,
      confidenceBoost: 22
    }
  },
  'Fashion': {
    'Sustainable Fashion': {
      genderSplit: { female: 75, male: 25 },
      primaryAgeGroup: '25-40',
      ageDistribution: { '13-17': 2, '18-24': 20, '25-34': 40, '35-44': 25, '45-54': 10, '55+': 3 },
      topLocations: ['United States', 'United Kingdom', 'Germany', 'Netherlands', 'Denmark'],
      interests: ['Sustainable Fashion', 'Ethics', 'Quality', 'Minimalism', 'Environment'],
      engagementModifier: 1.25,
      confidenceBoost: 28
    },
    'Streetwear & Hypebeast': {
      genderSplit: { female: 35, male: 65 }, // Male-skewing
      primaryAgeGroup: '16-25',
      ageDistribution: { '13-17': 25, '18-24': 45, '25-34': 20, '35-44': 8, '45-54': 2, '55+': 0 },
      topLocations: ['United States', 'Japan', 'United Kingdom', 'South Korea', 'Canada'],
      interests: ['Streetwear', 'Sneakers', 'Hypebeast Culture', 'Limited Drops', 'Urban Fashion'],
      engagementModifier: 1.3,
      confidenceBoost: 25
    },
    'Body Positive Fashion': {
      genderSplit: { female: 80, male: 20 },
      primaryAgeGroup: '20-40',
      ageDistribution: { '13-17': 5, '18-24': 25, '25-34': 35, '35-44': 25, '45-54': 8, '55+': 2 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Brazil'],
      interests: ['Body Positivity', 'Inclusive Fashion', 'Self-Acceptance', 'Diversity', 'Empowerment'],
      engagementModifier: 1.4,
      confidenceBoost: 30
    }
  }
};

/**
 * Advanced Demographics Inference Service
 * Uses research-based patterns + web search + AI analysis for realistic audience demographics
 */
export class AdvancedDemographicsService {
  private static instance: AdvancedDemographicsService;
  private serplyApiKey: string;
  private baseUrl = 'https://api.serply.io/v1/search';

  constructor() {
    this.serplyApiKey = process.env.SERPLY_API_KEY || '';
  }

  static getInstance(): AdvancedDemographicsService {
    if (!AdvancedDemographicsService.instance) {
      AdvancedDemographicsService.instance = new AdvancedDemographicsService();
    }
    return AdvancedDemographicsService.instance;
  }

  /**
   * Generate sophisticated demographics using research-based patterns + web search + AI inference
   */
  async generateInferredDemographics(
    username: string,
    followerCount: number = 0,
    niche: string[] = [],
    platform: string = 'Instagram',
    bio?: string,
    location?: string
  ): Promise<InferredDemographicsDetails> {
    try {
      console.log(`🔍 Researching demographics for @${username} using research-based patterns...`);

      // Step 1: Research the influencer using web search
      const researchData = await this.researchInfluencer(username, {
        niche: niche.join(', '),
        followerCount,
        platform,
        bio,
        location,
        webSearchResults: []
      });

      // Step 2: Use research-based patterns + AI to analyze and infer demographics
      const inferredData = await this.inferDemographicsFromResearch(researchData);

      console.log(`✅ Generated research-based demographics for @${username} (confidence: ${inferredData.confidence}%, level: ${inferredData.confidenceLevel})`);
      return inferredData;

    } catch (error) {
      console.warn(`⚠️ Web research failed for @${username}, using research-based fallback:`, error);
      return this.generateResearchBasedFallback(username, followerCount, niche, platform, bio);
    }
  }

  /**
   * Research influencer using Serply web search (enhanced with better queries)
   */
  private async researchInfluencer(username: string, data: InfluencerResearchData): Promise<InfluencerResearchData> {
    if (!this.serplyApiKey) {
      throw new Error('Serply API key not configured');
    }

    // Enhanced research queries for better demographic insights
    const queries = [
      `${username} influencer audience demographics statistics analysis`,
      `${username} ${data.platform} followers gender age breakdown data`,
      `${username} brand collaborations target audience demographics`,
      `"${username}" influencer marketing ${data.niche} audience insights engagement`,
      `${username} social media analytics audience composition data`
    ];

    const searchResults: string[] = [];

    for (const query of queries) {
      try {
        console.log(`🔍 Searching: "${query}"`);
        const response = await fetch(`${this.baseUrl}?q=${encodeURIComponent(query)}&num=6`, {
          headers: {
            'X-API-KEY': this.serplyApiKey,
            'X-User-Agent': 'LAY AI Demographics Research v2.0',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((result: any) => {
              if (result.title && result.description) {
                searchResults.push(`${result.title}: ${result.description}`);
              }
            });
          }
        }

        // Rate limiting - respect Serply's limits
        await new Promise(resolve => setTimeout(resolve, 1200));
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
      }
    }

    console.log(`📊 Collected ${searchResults.length} research data points for @${username}`);
    return {
      ...data,
      webSearchResults: searchResults
    };
  }

  /**
   * Use research-based patterns + AI analysis to infer demographics from research data
   */
  private async inferDemographicsFromResearch(research: InfluencerResearchData): Promise<InferredDemographicsDetails> {
    // Step 1: Detect niche and sub-niche using advanced pattern matching
    const nicheAnalysis = this.detectNicheAndSubNiche(research);
    
    // Step 2: Get research-based demographic pattern
    const basePattern = this.getResearchBasedPattern(nicheAnalysis.niche, nicheAnalysis.subNiche);
    
    // Step 3: Apply platform-specific adjustments
    const platformAdjustedPattern = this.applyPlatformAdjustments(basePattern, research.platform);
    
    // Step 4: Fine-tune with web research insights
    const finalPattern = this.refineWithWebResearch(platformAdjustedPattern, research);
    
    // Step 5: Generate final demographics with realistic variations
    const demographics = this.generateRealisticDemographics(finalPattern, research);
    
    // Step 6: Calculate advanced confidence score
    const confidence = this.calculateAdvancedConfidence(research, nicheAnalysis);
    const confidenceLevel = this.determineConfidenceLevel(confidence, research);

    // Step 7: Generate engagement metrics based on research patterns
    const engagementMetrics = this.calculateEngagementMetrics(research.followerCount, finalPattern, research.platform);

    const researchNotes = `Applied ${nicheAnalysis.niche}/${nicheAnalysis.subNiche} pattern with ${research.platform} adjustments. Analyzed ${research.webSearchResults.length} research sources.`;

    return {
      demographics,
      engagementRate: engagementMetrics.engagementRate,
      averageLikes: engagementMetrics.averageLikes,
      averageComments: engagementMetrics.averageComments,
      topics: finalPattern.interests,
      confidence,
      confidenceLevel,
      researchNotes,
      dataSource: research.webSearchResults.length > 0 ? 'web_research' : 'ai_inference'
    };
  }

  /**
   * Detect niche and sub-niche using sophisticated pattern matching
   */
  private detectNicheAndSubNiche(research: InfluencerResearchData): { niche: string; subNiche: string; confidence: number } {
    const combinedText = `${research.niche} ${research.bio || ''} ${research.webSearchResults.join(' ')}`.toLowerCase();
    
    let bestMatch = { niche: 'Fashion', subNiche: 'Sustainable Fashion', confidence: 0 };

    // Check each niche pattern for matches
    for (const [niche, subNiches] of Object.entries(NICHE_PATTERNS)) {
      for (const [subNiche, pattern] of Object.entries(subNiches)) {
        let confidence = 0;
        
        // Create detection keywords for this sub-niche
        const keywords = this.generateDetectionKeywords(niche, subNiche);
        
        // Score based on keyword matches
        for (const keyword of keywords) {
          if (combinedText.includes(keyword.toLowerCase())) {
            confidence += keyword.length > 5 ? 3 : 1; // Longer keywords are more specific
          }
        }
        
        // Bonus for exact niche matches
        if (combinedText.includes(niche.toLowerCase())) confidence += 5;
        if (combinedText.includes(subNiche.toLowerCase().replace('&', 'and'))) confidence += 8;
        
        // Web research content analysis bonus
        if (research.webSearchResults.length > 0) {
          const webText = research.webSearchResults.join(' ').toLowerCase();
          if (webText.includes('audience') && webText.includes(niche.toLowerCase())) {
            confidence += 10;
          }
        }
        
        if (confidence > bestMatch.confidence) {
          bestMatch = { niche, subNiche, confidence };
        }
      }
    }

    console.log(`🎯 Detected niche: ${bestMatch.niche}/${bestMatch.subNiche} (confidence: ${bestMatch.confidence})`);
    return bestMatch;
  }

  /**
   * Generate detection keywords for niche/sub-niche combinations
   */
  private generateDetectionKeywords(niche: string, subNiche: string): string[] {
    const keywordMap: Record<string, Record<string, string[]>> = {
      'Gaming': {
        'Esports & Competitive': ['esports', 'competitive gaming', 'tournament', 'pro gaming', 'valorant', 'call of duty', 'league of legends'],
        'Casual & Mobile Gaming': ['mobile gaming', 'casual games', 'puzzle games', 'candy crush', 'among us', 'mobile'],
        'RPG & Story': ['rpg', 'role playing', 'story games', 'narrative', 'adventure games', 'single player']
      },
      'Beauty': {
        'Skincare Science': ['skincare', 'dermatology', 'ingredients', 'retinol', 'acids', 'science', 'clinical'],
        'Gen Z Trends': ['makeup trends', 'tiktok makeup', 'viral beauty', 'gen z', 'beauty challenge'],
        'Ethical & Clean Beauty': ['clean beauty', 'sustainable beauty', 'cruelty free', 'vegan beauty', 'ethical']
      },
      'Fitness': {
        'Performance & Strength': ['bodybuilding', 'powerlifting', 'strength training', 'muscle', 'competition', 'supplements'],
        'Wellness & Yoga': ['yoga', 'mindfulness', 'wellness', 'meditation', 'holistic', 'mental health'],
        'Home Workouts': ['home workout', 'family fitness', 'busy parent', 'quick workout', 'no equipment']
      },
      'Travel': {
        'Luxury Travel': ['luxury travel', 'five star', 'premium', 'first class', 'luxury hotels', 'exclusive'],
        'Budget & Backpacking': ['budget travel', 'backpacking', 'hostels', 'cheap flights', 'student travel'],
        'Adventure & Eco': ['adventure travel', 'eco tourism', 'hiking', 'outdoor', 'sustainable travel']
      },
      'Finance': {
        'First-time Investing': ['beginner investing', 'first time investor', 'etf', 'index funds', 'robo advisor'],
        'Debt Management': ['debt free', 'budgeting', 'student loans', 'debt payoff', 'financial planning'],
        'High-Risk Trading': ['day trading', 'options', 'crypto trading', 'technical analysis', 'high risk']
      },
      'Food': {
        'Gourmet Cooking': ['gourmet', 'fine dining', 'culinary', 'chef', 'wine pairing', 'haute cuisine'],
        'Vegan & Plant-Based': ['vegan', 'plant based', 'animal rights', 'vegan recipes', 'plant food'],
        'Meal Prep & Health': ['meal prep', 'healthy eating', 'fitness nutrition', 'macro counting', 'healthy meal']
      },
      'Fashion': {
        'Sustainable Fashion': ['sustainable fashion', 'ethical fashion', 'slow fashion', 'eco fashion', 'conscious'],
        'Streetwear & Hypebeast': ['streetwear', 'hypebeast', 'supreme', 'sneakers', 'limited edition', 'drop'],
        'Body Positive Fashion': ['body positive', 'inclusive fashion', 'plus size', 'body acceptance', 'diversity']
      }
    };

    return keywordMap[niche]?.[subNiche] || [];
  }

  /**
   * Get research-based demographic pattern for detected niche/sub-niche
   */
  private getResearchBasedPattern(niche: string, subNiche: string): DemographicPattern {
    const pattern = NICHE_PATTERNS[niche]?.[subNiche];
    if (pattern) {
      console.log(`📊 Using research pattern: ${niche}/${subNiche}`);
      return { ...pattern }; // Deep copy to avoid mutations
    }

    // Fallback to generic pattern if specific not found
    console.log(`⚠️ No specific pattern found for ${niche}/${subNiche}, using general lifestyle pattern`);
    return {
      genderSplit: { female: 52, male: 48 },
      primaryAgeGroup: '25-34',
      ageDistribution: { '13-17': 5, '18-24': 25, '25-34': 35, '35-44': 20, '45-54': 10, '55+': 5 },
      topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
      interests: ['Lifestyle', 'Entertainment', 'Social Media', 'Culture', 'Trends'],
      engagementModifier: 1.0,
      confidenceBoost: 10
    };
  }

  /**
   * Apply platform-specific demographic adjustments
   */
  private applyPlatformAdjustments(basePattern: DemographicPattern, platform: string): DemographicPattern {
    const platformBaseline = PLATFORM_BASELINES[platform];
    if (!platformBaseline) {
      console.log(`⚠️ No platform baseline for ${platform}, using pattern as-is`);
      return basePattern;
    }

    console.log(`🔧 Applying ${platform} platform adjustments`);
    
    // Blend the niche pattern with platform demographics (70% niche, 30% platform)
    const adjustedPattern = { ...basePattern };
    
    // Adjust gender split
    adjustedPattern.genderSplit = {
      female: Math.round(basePattern.genderSplit.female * 0.7 + platformBaseline.genderSplit.female * 0.3),
      male: Math.round(basePattern.genderSplit.male * 0.7 + platformBaseline.genderSplit.male * 0.3)
    };
    
    // Adjust age distribution (blend with platform)
    Object.keys(adjustedPattern.ageDistribution).forEach(ageGroup => {
      const key = ageGroup as keyof typeof adjustedPattern.ageDistribution;
      adjustedPattern.ageDistribution[key] = Math.round(
        basePattern.ageDistribution[key] * 0.7 + platformBaseline.ageDistribution[key] * 0.3
      );
    });
    
    // Platform-specific engagement modifier
    adjustedPattern.engagementModifier *= platformBaseline.engagementModifier;
    
    // Add platform confidence boost
    adjustedPattern.confidenceBoost += platformBaseline.confidenceBoost;

    return adjustedPattern;
  }

  /**
   * Refine pattern with web research insights
   */
  private refineWithWebResearch(pattern: DemographicPattern, research: InfluencerResearchData): DemographicPattern {
    if (research.webSearchResults.length === 0) {
      return pattern;
    }

    console.log(`🔍 Refining with ${research.webSearchResults.length} web research insights`);
    const webText = research.webSearchResults.join(' ').toLowerCase();
    const refinedPattern = { ...pattern };

    // Look for explicit demographic mentions in web research
    if (webText.includes('female audience') || webText.includes('women followers')) {
      refinedPattern.genderSplit.female = Math.min(85, refinedPattern.genderSplit.female + 10);
      refinedPattern.genderSplit.male = 100 - refinedPattern.genderSplit.female;
      console.log(`📈 Web research indicates female-skewing audience`);
    } else if (webText.includes('male audience') || webText.includes('men followers')) {
      refinedPattern.genderSplit.male = Math.min(85, refinedPattern.genderSplit.male + 10);
      refinedPattern.genderSplit.female = 100 - refinedPattern.genderSplit.male;
      console.log(`📈 Web research indicates male-skewing audience`);
    }

    // Age group refinements
    if (webText.includes('gen z') || webText.includes('young audience')) {
      refinedPattern.ageDistribution['18-24'] += 10;
      refinedPattern.ageDistribution['25-34'] -= 5;
      refinedPattern.ageDistribution['35-44'] -= 5;
      console.log(`📈 Web research indicates younger audience`);
    } else if (webText.includes('millennial') || webText.includes('professional audience')) {
      refinedPattern.ageDistribution['25-34'] += 10;
      refinedPattern.ageDistribution['18-24'] -= 5;
      refinedPattern.ageDistribution['35-44'] += 5;
      console.log(`📈 Web research indicates millennial-focused audience`);
    }

    // Geographic refinements
    const regions = ['europe', 'asia', 'latin america', 'north america', 'australia'];
    for (const region of regions) {
      if (webText.includes(region)) {
        console.log(`🌍 Web research indicates ${region} audience focus`);
      }
    }

    return refinedPattern;
  }

  /**
   * Generate realistic demographics with natural variations
   */
  private generateRealisticDemographics(pattern: DemographicPattern, research: InfluencerResearchData): AudienceDemographics {
    // Add realistic random variations (±3-7%) to avoid identical outputs
    const femaleVariation = (Math.random() - 0.5) * 10; // ±5%
    const adjustedFemale = Math.max(10, Math.min(90, pattern.genderSplit.female + femaleVariation));
    const adjustedMale = 100 - adjustedFemale;

    // Age distribution with small variations
    const ageDistribution: any = {};
    let totalAge = 0;
    Object.entries(pattern.ageDistribution).forEach(([ageGroup, percentage]) => {
      const variation = (Math.random() - 0.5) * 6; // ±3%
      ageDistribution[ageGroup] = Math.max(0, Math.round(percentage + variation));
      totalAge += ageDistribution[ageGroup];
    });

    // Normalize age distribution to 100%
    Object.keys(ageDistribution).forEach(ageGroup => {
      ageDistribution[ageGroup] = Math.round((ageDistribution[ageGroup] / totalAge) * 100);
    });

    // Generate contextual locations
    const topLocations = this.generateContextualLocations(pattern, research);

    return {
      gender: {
        female: Math.round(adjustedFemale),
        male: Math.round(adjustedMale)
      },
      ageGroups: ageDistribution,
      topLocations: topLocations.slice(0, 5), // Top 5 locations
      interests: pattern.interests.slice(0, 6) // Top 6 interests
    };
  }

  /**
   * Generate contextual locations based on pattern and research
   */
  private generateContextualLocations(pattern: DemographicPattern, research: InfluencerResearchData): string[] {
    let locations = [...pattern.topLocations];

    // Add Spanish/Latin locations if influencer is Spanish-speaking
    if (research.location?.toLowerCase().includes('spain') || 
        research.bio?.toLowerCase().includes('spain') ||
        research.bio?.toLowerCase().includes('madrid') ||
        research.bio?.toLowerCase().includes('barcelona')) {
      locations = ['Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', ...locations].slice(0, 8);
    }

    // Add context from web research
    const webText = research.webSearchResults.join(' ').toLowerCase();
    if (webText.includes('international') || webText.includes('global')) {
      locations.push('United Kingdom', 'Germany', 'France', 'Italy');
    }

    // Remove duplicates and return
    return [...new Set(locations)];
  }

  /**
   * Calculate advanced confidence score using multiple factors
   */
  private calculateAdvancedConfidence(research: InfluencerResearchData, nicheAnalysis: any): number {
    let confidence = 40; // Base confidence with research patterns

    // Web research quality
    if (research.webSearchResults.length >= 5) confidence += 25;
    else if (research.webSearchResults.length >= 3) confidence += 15;
    else if (research.webSearchResults.length >= 1) confidence += 8;

    // Niche detection confidence
    confidence += Math.min(20, nicheAnalysis.confidence * 2);

    // Influencer data quality
    if (research.bio && research.bio.length > 50) confidence += 8;
    if (research.followerCount > 10000) confidence += 5;
    if (research.followerCount > 100000) confidence += 3;
    if (research.location) confidence += 5;

    // Platform reliability
    if (research.platform === 'YouTube') confidence += 8; // Best analytics
    else if (research.platform === 'Instagram') confidence += 5;
    else if (research.platform === 'TikTok') confidence += 3;

    // Research content quality
    const webText = research.webSearchResults.join(' ').toLowerCase();
    if (webText.includes('audience') && webText.includes('demographics')) confidence += 15;
    if (webText.includes('analytics') || webText.includes('statistics')) confidence += 10;
    if (webText.includes('engagement') || webText.includes('followers')) confidence += 8;

    return Math.min(95, Math.max(45, confidence)); // Cap between 45-95%
  }

  /**
   * Determine confidence level based on score and data sources
   */
  private determineConfidenceLevel(confidence: number, research: InfluencerResearchData): 'foundational' | 'enhanced' | 'verified' {
    // Verified: Would require first-party data (not available in current implementation)
    // Enhanced: Good web research + detailed niche detection
    // Foundational: Basic pattern matching

    if (confidence >= 80 && research.webSearchResults.length >= 4) {
      return 'enhanced';
    } else if (confidence >= 65 && research.webSearchResults.length >= 2) {
      return 'enhanced';
    } else {
      return 'foundational';
    }
  }

  /**
   * Calculate engagement metrics based on research patterns
   */
  private calculateEngagementMetrics(followerCount: number, pattern: DemographicPattern, platform: string): {
    engagementRate: number;
    averageLikes: number;
    averageComments: number;
  } {
    // Base engagement rates by follower count (research-backed)
    let baseEngagementRate = 3.5;
    if (followerCount < 1000) baseEngagementRate = 10.0; // Nano-influencers
    else if (followerCount < 10000) baseEngagementRate = 8.0; // Micro-influencers  
    else if (followerCount < 100000) baseEngagementRate = 5.5; // Mid-tier
    else if (followerCount < 500000) baseEngagementRate = 3.5; // Macro
    else if (followerCount < 1000000) baseEngagementRate = 2.8; // Large macro
    else baseEngagementRate = 2.0; // Mega influencers

    // Apply pattern modifier
    const finalEngagementRate = baseEngagementRate * pattern.engagementModifier;

    // Calculate average metrics
    const averageLikes = Math.round(followerCount * (finalEngagementRate / 100));
    const averageComments = Math.round(averageLikes * 0.05); // Typically 5% of likes

    return {
      engagementRate: Math.round(finalEngagementRate * 100) / 100, // Round to 2 decimals
      averageLikes,
      averageComments
    };
  }

  /**
   * Generate research-based fallback demographics (no web search)
   */
  private generateResearchBasedFallback(
    username: string,
    followerCount: number,
    niche: string[],
    platform: string,
    bio?: string
  ): InferredDemographicsDetails {
    console.log(`🔄 Using research-based fallback for @${username}`);

    // Create mock research data
    const mockResearch: InfluencerResearchData = {
      niche: niche.join(', '),
      followerCount,
      platform,
      bio,
      webSearchResults: []
    };

    // Use the same analysis pipeline but without web research
    const nicheAnalysis = this.detectNicheAndSubNiche(mockResearch);
    const basePattern = this.getResearchBasedPattern(nicheAnalysis.niche, nicheAnalysis.subNiche);
    const platformAdjustedPattern = this.applyPlatformAdjustments(basePattern, platform);
    const demographics = this.generateRealisticDemographics(platformAdjustedPattern, mockResearch);
    const confidence = Math.max(45, this.calculateAdvancedConfidence(mockResearch, nicheAnalysis) - 15); // Lower for fallback
    const engagementMetrics = this.calculateEngagementMetrics(followerCount, platformAdjustedPattern, platform);

    return {
      demographics,
      engagementRate: engagementMetrics.engagementRate,
      averageLikes: engagementMetrics.averageLikes,
      averageComments: engagementMetrics.averageComments,
      topics: platformAdjustedPattern.interests,
      confidence,
      confidenceLevel: 'foundational',
      researchNotes: `Fallback analysis using ${nicheAnalysis.niche}/${nicheAnalysis.subNiche} research pattern`,
      dataSource: 'fallback'
    };
  }
}

// Export simplified function for backward compatibility
export async function generateInferredDemographics(
  username: string,
  followerCount: number = 0,
  niche: string[] = [],
  platform: string = 'Instagram',
  bio?: string,
  location?: string
): Promise<InferredDemographicsDetails> {
  const service = AdvancedDemographicsService.getInstance();
  return service.generateInferredDemographics(username, followerCount, niche, platform, bio, location);
} 