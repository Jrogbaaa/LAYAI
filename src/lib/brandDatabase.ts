/**
 * Dynamic Brand Intelligence Database
 * Replaces hard-coded brand logic with extensible, data-driven approach
 * LAYAI v2.18.0 - Enhanced Brand Compatibility Engine
 */

export enum BrandCategory {
  HOME_LIVING = 'Home & Living',
  FASHION_BEAUTY = 'Fashion & Beauty',
  FOOD_BEVERAGE = 'Food & Beverage',
  TECH_GAMING = 'Technology & Gaming',
  SPORTS_FITNESS = 'Sports & Fitness',
  TRAVEL_TOURISM = 'Travel & Tourism',
  AUTOMOTIVE = 'Automotive',
  FINANCIAL = 'Financial Services',
  ENTERTAINMENT = 'Entertainment',
  LIFESTYLE_GENERAL = 'Lifestyle & General'
}

export interface BrandProfile {
  brandName: string;
  category: BrandCategory;
  targetAudience: {
    primaryAge: [number, number];
    secondaryAge: [number, number];
    gender: 'male' | 'female' | 'mixed';
    interests: string[];
  };
  brandValues: string[];
  aestheticKeywords: string[];
  contentThemes: string[];
  competitorBrands: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  preferredInfluencerTiers: ('nano' | 'micro' | 'macro' | 'mega')[];
  optimalFollowerRange: {
    min: number;
    max: number;
  };
  optimalEngagement: number;
  weightings: {
    categoryMatch: number;
    audienceAlignment: number;
    aestheticCompatibility: number;
    riskAssessment: number;
  };
}

export interface AestheticProfile {
  name: string;
  keywords: string[];
  compatibleStyles: string[];
  incompatibleStyles: string[];
  visualIndicators: string[];
}

export interface CompatibilityScore {
  overallScore: number;
  categoryMatch: {
    score: number;
    matchType: 'perfect' | 'strong' | 'moderate' | 'weak' | 'none';
    reasons: string[];
  };
  audienceAlignment: {
    score: number;
    ageCompatibility: number;
    genderCompatibility: number;
    interestOverlap: number;
  };
  aestheticCompatibility: {
    score: number;
    contentStyle: string;
    visualAesthetic: string;
    professionalismLevel: number;
  };
  riskAssessment: {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    competitorCollaborations: number;
    brandSafetyFactors: string[];
  };
  transparency: {
    matchReasons: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
    scoringBreakdown: Record<string, number>;
  };
}

// Aesthetic Profiles Database
export const AESTHETIC_PROFILES: Record<string, AestheticProfile> = {
  minimalist: {
    name: 'Minimalist',
    keywords: ['clean', 'simple', 'minimal', 'modern', 'sleek', 'uncluttered', 'geometric'],
    compatibleStyles: ['modern', 'scandinavian', 'contemporary'],
    incompatibleStyles: ['maximalist', 'vintage', 'bohemian'],
    visualIndicators: ['white backgrounds', 'clean lines', 'few elements', 'neutral colors']
  },
  luxury: {
    name: 'Luxury',
    keywords: ['premium', 'high-end', 'elegant', 'sophisticated', 'exclusive', 'refined', 'opulent'],
    compatibleStyles: ['elegant', 'sophisticated', 'premium'],
    incompatibleStyles: ['casual', 'budget', 'DIY'],
    visualIndicators: ['high-quality photography', 'expensive items', 'professional lighting']
  },
  casual: {
    name: 'Casual',
    keywords: ['relaxed', 'everyday', 'comfortable', 'laid-back', 'easy-going', 'informal', 'approachable'],
    compatibleStyles: ['lifestyle', 'friendly', 'accessible'],
    incompatibleStyles: ['formal', 'luxury', 'corporate'],
    visualIndicators: ['natural lighting', 'candid shots', 'everyday situations']
  },
  professional: {
    name: 'Professional',
    keywords: ['business', 'corporate', 'formal', 'polished', 'refined', 'structured', 'organized'],
    compatibleStyles: ['corporate', 'business', 'formal'],
    incompatibleStyles: ['casual', 'playful', 'chaotic'],
    visualIndicators: ['suits', 'office settings', 'formal presentations']
  },
  creative: {
    name: 'Creative',
    keywords: ['artistic', 'unique', 'innovative', 'experimental', 'avant-garde', 'original', 'imaginative'],
    compatibleStyles: ['artistic', 'innovative', 'experimental'],
    incompatibleStyles: ['conservative', 'traditional', 'standard'],
    visualIndicators: ['colorful', 'artistic elements', 'creative compositions']
  },
  sustainable: {
    name: 'Sustainable',
    keywords: ['eco-friendly', 'green', 'ethical', 'sustainable', 'conscious', 'responsible', 'organic'],
    compatibleStyles: ['natural', 'eco-conscious', 'ethical'],
    incompatibleStyles: ['wasteful', 'fast-fashion', 'overconsumption'],
    visualIndicators: ['natural materials', 'earth tones', 'outdoor settings']
  }
};

// Comprehensive Brand Database
export const BRAND_DATABASE: Record<string, BrandProfile> = {
  // HOME & LIVING
  'ikea': {
    brandName: 'IKEA',
    category: BrandCategory.HOME_LIVING,
    targetAudience: {
      primaryAge: [25, 45],
      secondaryAge: [18, 65],
      gender: 'mixed',
      interests: ['home decoration', 'interior design', 'DIY', 'family life', 'organization']
    },
    brandValues: ['functional', 'affordable', 'sustainable', 'democratic design', 'innovative'],
    aestheticKeywords: ['minimalist', 'modern', 'functional', 'clean', 'scandinavian', 'organized'],
    contentThemes: ['home tours', 'DIY projects', 'organization tips', 'room makeovers', 'furniture styling'],
    competitorBrands: ['west elm', 'cb2', 'pottery barn', 'wayfair', 'homegoods'],
    riskTolerance: 'low',
    preferredInfluencerTiers: ['micro', 'macro'],
    optimalFollowerRange: { min: 10000, max: 500000 },
    optimalEngagement: 0.04,
    weightings: {
      categoryMatch: 0.35,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.25,
      riskAssessment: 0.15
    }
  },

  'zara home': {
    brandName: 'Zara Home',
    category: BrandCategory.HOME_LIVING,
    targetAudience: {
      primaryAge: [25, 40],
      secondaryAge: [18, 50],
      gender: 'mixed',
      interests: ['fashion', 'home decoration', 'trends', 'style', 'luxury']
    },
    brandValues: ['trendy', 'fashionable', 'accessible luxury', 'seasonal', 'contemporary'],
    aestheticKeywords: ['trendy', 'fashionable', 'contemporary', 'stylish', 'seasonal'],
    contentThemes: ['seasonal decor', 'trend updates', 'styling tips', 'home fashion'],
    competitorBrands: ['h&m home', 'ikea', 'maisons du monde'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['micro', 'macro', 'mega'],
    optimalFollowerRange: { min: 25000, max: 1000000 },
    optimalEngagement: 0.035,
    weightings: {
      categoryMatch: 0.30,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.30,
      riskAssessment: 0.15
    }
  },

  // FOOD & BEVERAGE
  'vips': {
    brandName: 'VIPS',
    category: BrandCategory.FOOD_BEVERAGE,
    targetAudience: {
      primaryAge: [18, 35],
      secondaryAge: [16, 45],
      gender: 'mixed',
      interests: ['casual dining', 'food', 'social gatherings', 'family time', 'comfort food']
    },
    brandValues: ['casual', 'accessible', 'family-friendly', 'reliable', 'comfort'],
    aestheticKeywords: ['casual', 'friendly', 'approachable', 'comfortable', 'social'],
    contentThemes: ['food reviews', 'casual dining', 'family meals', 'comfort food', 'social eating'],
    competitorBrands: ['mcdonalds', 'burger king', 'telepizza', 'foster\'s hollywood'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['micro', 'macro'],
    optimalFollowerRange: { min: 15000, max: 300000 },
    optimalEngagement: 0.05,
    weightings: {
      categoryMatch: 0.35,
      audienceAlignment: 0.30,
      aestheticCompatibility: 0.20,
      riskAssessment: 0.15
    }
  },

  'coca-cola': {
    brandName: 'Coca-Cola',
    category: BrandCategory.FOOD_BEVERAGE,
    targetAudience: {
      primaryAge: [16, 35],
      secondaryAge: [13, 50],
      gender: 'mixed',
      interests: ['lifestyle', 'entertainment', 'social activities', 'music', 'sports']
    },
    brandValues: ['happiness', 'sharing', 'refreshing', 'iconic', 'global'],
    aestheticKeywords: ['vibrant', 'energetic', 'social', 'joyful', 'iconic'],
    contentThemes: ['lifestyle moments', 'social gatherings', 'entertainment', 'music', 'sports'],
    competitorBrands: ['pepsi', 'fanta', 'sprite'],
    riskTolerance: 'low',
    preferredInfluencerTiers: ['macro', 'mega'],
    optimalFollowerRange: { min: 100000, max: 5000000 },
    optimalEngagement: 0.03,
    weightings: {
      categoryMatch: 0.25,
      audienceAlignment: 0.35,
      aestheticCompatibility: 0.25,
      riskAssessment: 0.15
    }
  },

  // FASHION & BEAUTY
  'zara': {
    brandName: 'Zara',
    category: BrandCategory.FASHION_BEAUTY,
    targetAudience: {
      primaryAge: [20, 35],
      secondaryAge: [16, 45],
      gender: 'mixed',
      interests: ['fashion', 'trends', 'style', 'affordable luxury', 'contemporary design']
    },
    brandValues: ['trendy', 'fast fashion', 'accessible', 'contemporary', 'global'],
    aestheticKeywords: ['trendy', 'contemporary', 'chic', 'accessible luxury', 'minimalist'],
    contentThemes: ['outfit inspiration', 'trend updates', 'styling tips', 'seasonal fashion'],
    competitorBrands: ['h&m', 'mango', 'pull&bear', 'bershka'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['micro', 'macro', 'mega'],
    optimalFollowerRange: { min: 25000, max: 2000000 },
    optimalEngagement: 0.04,
    weightings: {
      categoryMatch: 0.30,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.30,
      riskAssessment: 0.15
    }
  },

  'h&m': {
    brandName: 'H&M',
    category: BrandCategory.FASHION_BEAUTY,
    targetAudience: {
      primaryAge: [18, 30],
      secondaryAge: [16, 40],
      gender: 'mixed',
      interests: ['affordable fashion', 'trends', 'sustainability', 'diversity', 'accessibility']
    },
    brandValues: ['affordable', 'inclusive', 'sustainable', 'trendy', 'accessible'],
    aestheticKeywords: ['accessible', 'diverse', 'trendy', 'colorful', 'inclusive'],
    contentThemes: ['affordable fashion', 'trend alerts', 'sustainable fashion', 'inclusive style'],
    competitorBrands: ['zara', 'mango', 'primark', 'uniqlo'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['micro', 'macro'],
    optimalFollowerRange: { min: 20000, max: 800000 },
    optimalEngagement: 0.045,
    weightings: {
      categoryMatch: 0.30,
      audienceAlignment: 0.30,
      aestheticCompatibility: 0.25,
      riskAssessment: 0.15
    }
  },

  // SPORTS & FITNESS
  'nike': {
    brandName: 'Nike',
    category: BrandCategory.SPORTS_FITNESS,
    targetAudience: {
      primaryAge: [18, 35],
      secondaryAge: [16, 45],
      gender: 'mixed',
      interests: ['fitness', 'sports', 'athletic lifestyle', 'motivation', 'performance']
    },
    brandValues: ['excellence', 'innovation', 'performance', 'inspiration', 'determination'],
    aestheticKeywords: ['athletic', 'dynamic', 'motivational', 'performance-focused', 'inspiring'],
    contentThemes: ['workout routines', 'athletic performance', 'motivation', 'sports lifestyle'],
    competitorBrands: ['adidas', 'under armour', 'puma', 'reebok'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['macro', 'mega'],
    optimalFollowerRange: { min: 50000, max: 5000000 },
    optimalEngagement: 0.035,
    weightings: {
      categoryMatch: 0.35,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.25,
      riskAssessment: 0.15
    }
  },

  'adidas': {
    brandName: 'Adidas',
    category: BrandCategory.SPORTS_FITNESS,
    targetAudience: {
      primaryAge: [18, 35],
      secondaryAge: [16, 45],
      gender: 'mixed',
      interests: ['sports', 'lifestyle', 'streetwear', 'performance', 'culture']
    },
    brandValues: ['authenticity', 'performance', 'creativity', 'diversity', 'sustainability'],
    aestheticKeywords: ['athletic', 'street-style', 'authentic', 'performance', 'cultural'],
    contentThemes: ['sports performance', 'street style', 'lifestyle content', 'cultural moments'],
    competitorBrands: ['nike', 'puma', 'under armour', 'reebok'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['macro', 'mega'],
    optimalFollowerRange: { min: 50000, max: 3000000 },
    optimalEngagement: 0.035,
    weightings: {
      categoryMatch: 0.35,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.25,
      riskAssessment: 0.15
    }
  },

  // TECHNOLOGY
  'apple': {
    brandName: 'Apple',
    category: BrandCategory.TECH_GAMING,
    targetAudience: {
      primaryAge: [20, 45],
      secondaryAge: [18, 55],
      gender: 'mixed',
      interests: ['technology', 'design', 'innovation', 'premium products', 'creativity']
    },
    brandValues: ['innovation', 'design excellence', 'premium', 'simplicity', 'creativity'],
    aestheticKeywords: ['premium', 'minimalist', 'innovative', 'sleek', 'sophisticated'],
    contentThemes: ['tech reviews', 'creative workflows', 'design inspiration', 'innovation'],
    competitorBrands: ['samsung', 'google', 'microsoft', 'huawei'],
    riskTolerance: 'low',
    preferredInfluencerTiers: ['macro', 'mega'],
    optimalFollowerRange: { min: 100000, max: 5000000 },
    optimalEngagement: 0.03,
    weightings: {
      categoryMatch: 0.30,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.30,
      riskAssessment: 0.15
    }
  },

  // AUTOMOTIVE
  'tesla': {
    brandName: 'Tesla',
    category: BrandCategory.AUTOMOTIVE,
    targetAudience: {
      primaryAge: [25, 50],
      secondaryAge: [20, 60],
      gender: 'mixed',
      interests: ['technology', 'sustainability', 'innovation', 'luxury', 'environment']
    },
    brandValues: ['innovation', 'sustainability', 'performance', 'technology', 'future-focused'],
    aestheticKeywords: ['futuristic', 'innovative', 'sustainable', 'high-tech', 'premium'],
    contentThemes: ['sustainable technology', 'innovation', 'electric vehicles', 'future tech'],
    competitorBrands: ['bmw', 'mercedes', 'audi', 'porsche'],
    riskTolerance: 'medium',
    preferredInfluencerTiers: ['macro', 'mega'],
    optimalFollowerRange: { min: 100000, max: 3000000 },
    optimalEngagement: 0.03,
    weightings: {
      categoryMatch: 0.35,
      audienceAlignment: 0.25,
      aestheticCompatibility: 0.25,
      riskAssessment: 0.15
    }
  }
};

/**
 * Get brand profile by name (case-insensitive)
 */
export function getBrandProfile(brandName: string): BrandProfile | null {
  const normalizedName = brandName.toLowerCase().trim();
  return BRAND_DATABASE[normalizedName] || null;
}

/**
 * Get all brands in a specific category
 */
export function getBrandsByCategory(category: BrandCategory): BrandProfile[] {
  return Object.values(BRAND_DATABASE).filter(brand => brand.category === category);
}

/**
 * Get aesthetic profile by name
 */
export function getAestheticProfile(aestheticName: string): AestheticProfile | null {
  const normalizedName = aestheticName.toLowerCase().trim();
  return AESTHETIC_PROFILES[normalizedName] || null;
}

/**
 * Detect aesthetic keywords in text content
 */
export function detectAesthetics(content: string): string[] {
  const detectedAesthetics: string[] = [];
  const lowerContent = content.toLowerCase();
  
  Object.entries(AESTHETIC_PROFILES).forEach(([aestheticName, profile]) => {
    const hasKeyword = profile.keywords.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    if (hasKeyword) {
      detectedAesthetics.push(aestheticName);
    }
  });
  
  return detectedAesthetics;
}

/**
 * Get brands that match detected aesthetics
 */
export function getBrandsByAesthetic(aesthetics: string[]): BrandProfile[] {
  return Object.values(BRAND_DATABASE).filter(brand => {
    return aesthetics.some(aesthetic => 
      brand.aestheticKeywords.some(keyword => 
        keyword.toLowerCase().includes(aesthetic.toLowerCase()) ||
        aesthetic.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  });
}

/**
 * Check if two brands are competitors
 */
export function areCompetitors(brand1: string, brand2: string): boolean {
  const profile1 = getBrandProfile(brand1);
  const profile2 = getBrandProfile(brand2);
  
  if (!profile1 || !profile2) return false;
  
  return profile1.competitorBrands.some(competitor => 
    competitor.toLowerCase() === brand2.toLowerCase()
  ) || profile2.competitorBrands.some(competitor => 
    competitor.toLowerCase() === brand1.toLowerCase()
  );
}

/**
 * Get suggested brands for a user query
 */
export function suggestBrands(query: string): BrandProfile[] {
  const lowerQuery = query.toLowerCase();
  const suggestions: { brand: BrandProfile; score: number }[] = [];
  
  Object.values(BRAND_DATABASE).forEach(brand => {
    let score = 0;
    
    // Check brand name match
    if (lowerQuery.includes(brand.brandName.toLowerCase())) {
      score += 100;
    }
    
    // Check category keywords
    if (lowerQuery.includes(brand.category.toLowerCase())) {
      score += 50;
    }
    
    // Check content themes
    brand.contentThemes.forEach(theme => {
      if (lowerQuery.includes(theme.toLowerCase())) {
        score += 30;
      }
    });
    
    // Check aesthetic keywords
    brand.aestheticKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 20;
      }
    });
    
    // Check brand values
    brand.brandValues.forEach(value => {
      if (lowerQuery.includes(value.toLowerCase())) {
        score += 15;
      }
    });
    
    if (score > 0) {
      suggestions.push({ brand, score });
    }
  });
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.brand);
} 