/**
 * Brand Intelligence System
 * Analyzes brand names and determines compatible influencer profiles
 */

export interface BrandProfile {
  name: string;
  category: string;
  subCategory: string;
  targetAudience: {
    primaryAge: string;
    secondaryAge: string;
    gender: string[];
    interests: string[];
    lifestyle: string[];
  };
  brandValues: string[];
  contentThemes: string[];
  influencerTypes: string[];
  searchKeywords: string[];
  avoidKeywords: string[];
}

export interface InfluencerCriteria {
  primaryNiches: string[];
  secondaryNiches: string[];
  contentStyles: string[];
  audienceAlignment: {
    ageRanges: string[];
    genderPreference: string[];
    interests: string[];
  };
  brandCompatibility: {
    values: string[];
    aesthetics: string[];
    contentTypes: string[];
  };
  searchQueries: string[];
}

/**
 * Analyze a brand name and return comprehensive brand profile
 */
export function analyzeBrand(brandName: string): BrandProfile {
  const name = brandName.toLowerCase().trim();
  
  // Known brand database
  const knownBrands: Record<string, BrandProfile> = {
    'nike': {
      name: 'Nike',
      category: 'Sports & Fitness',
      subCategory: 'Athletic Apparel',
      targetAudience: {
        primaryAge: '18-35',
        secondaryAge: '25-45',
        gender: ['Male', 'Female'],
        interests: ['fitness', 'sports', 'running', 'basketball', 'training'],
        lifestyle: ['active', 'athletic', 'health-conscious', 'competitive']
      },
      brandValues: ['performance', 'innovation', 'determination', 'excellence', 'inclusivity'],
      contentThemes: ['workout', 'training', 'sports', 'motivation', 'achievement'],
      influencerTypes: ['fitness', 'sports', 'lifestyle', 'wellness'],
      searchKeywords: ['athlete', 'fitness', 'workout', 'training', 'sports', 'running', 'gym'],
      avoidKeywords: ['sedentary', 'unhealthy', 'lazy']
    },
    'adidas': {
      name: 'Adidas',
      category: 'Sports & Fitness',
      subCategory: 'Athletic Apparel',
      targetAudience: {
        primaryAge: '16-35',
        secondaryAge: '20-40',
        gender: ['Male', 'Female'],
        interests: ['football', 'soccer', 'fitness', 'streetwear', 'sports'],
        lifestyle: ['active', 'urban', 'trendy', 'athletic']
      },
      brandValues: ['authenticity', 'creativity', 'diversity', 'performance'],
      contentThemes: ['sports', 'streetwear', 'culture', 'performance', 'style'],
      influencerTypes: ['sports', 'fitness', 'fashion', 'lifestyle'],
      searchKeywords: ['football', 'soccer', 'fitness', 'sportswear', 'athlete', 'street style'],
      avoidKeywords: ['formal', 'business']
    },
    'ikea': {
      name: 'IKEA',
      category: 'Home & Living',
      subCategory: 'Furniture & Decor',
      targetAudience: {
        primaryAge: '25-45',
        secondaryAge: '20-55',
        gender: ['Female', 'Male'],
        interests: ['home decor', 'interior design', 'DIY', 'organization', 'sustainability'],
        lifestyle: ['family-oriented', 'practical', 'budget-conscious', 'creative']
      },
      brandValues: ['affordability', 'functionality', 'sustainability', 'design', 'accessibility'],
      contentThemes: ['home organization', 'interior design', 'DIY', 'family life', 'sustainability'],
      influencerTypes: ['home', 'lifestyle', 'family', 'DIY', 'organization'],
      searchKeywords: ['home decor', 'interior design', 'organization', 'DIY', 'family', 'sustainable living'],
      avoidKeywords: ['luxury', 'expensive', 'extravagant']
    },
    'coca-cola': {
      name: 'Coca-Cola',
      category: 'Food & Beverage',
      subCategory: 'Soft Drinks',
      targetAudience: {
        primaryAge: '13-35',
        secondaryAge: '18-45',
        gender: ['Male', 'Female'],
        interests: ['socializing', 'entertainment', 'music', 'sports', 'fun'],
        lifestyle: ['social', 'energetic', 'fun-loving', 'optimistic']
      },
      brandValues: ['happiness', 'togetherness', 'optimism', 'refreshment', 'celebration'],
      contentThemes: ['celebration', 'friendship', 'happiness', 'music', 'sports'],
      influencerTypes: ['lifestyle', 'entertainment', 'music', 'sports'],
      searchKeywords: ['celebration', 'friends', 'music', 'party', 'happiness', 'social'],
      avoidKeywords: ['health guru', 'diet', 'fitness model']
    },
    'tesla': {
      name: 'Tesla',
      category: 'Technology',
      subCategory: 'Electric Vehicles',
      targetAudience: {
        primaryAge: '25-50',
        secondaryAge: '30-55',
        gender: ['Male', 'Female'],
        interests: ['technology', 'sustainability', 'innovation', 'cars', 'environment'],
        lifestyle: ['tech-savvy', 'eco-conscious', 'early-adopter', 'affluent']
      },
      brandValues: ['innovation', 'sustainability', 'performance', 'disruption', 'future'],
      contentThemes: ['technology', 'sustainability', 'innovation', 'electric vehicles', 'future'],
      influencerTypes: ['tech', 'automotive', 'lifestyle', 'sustainability'],
      searchKeywords: ['technology', 'electric car', 'sustainable', 'innovation', 'tech reviewer'],
      avoidKeywords: ['traditional', 'gas car', 'anti-tech']
    },
    'apple': {
      name: 'Apple',
      category: 'Technology',
      subCategory: 'Consumer Electronics',
      targetAudience: {
        primaryAge: '18-45',
        secondaryAge: '25-55',
        gender: ['Male', 'Female'],
        interests: ['technology', 'design', 'creativity', 'photography', 'innovation'],
        lifestyle: ['creative', 'professional', 'design-conscious', 'tech-savvy']
      },
      brandValues: ['innovation', 'design', 'simplicity', 'quality', 'creativity'],
      contentThemes: ['technology', 'design', 'creativity', 'photography', 'lifestyle'],
      influencerTypes: ['tech', 'creative', 'photography', 'lifestyle'],
      searchKeywords: ['tech reviewer', 'photographer', 'creative', 'designer', 'apple user'],
      avoidKeywords: ['android', 'cheap', 'budget']
    }
  };

  // Return known brand profile or analyze unknown brand
  if (knownBrands[name]) {
    return knownBrands[name];
  }

  // AI-powered analysis for unknown brands
  return analyzeUnknownBrand(brandName);
}

/**
 * Generate influencer search criteria based on brand profile
 */
export function generateInfluencerCriteria(brandProfile: BrandProfile, userQuery: string = ''): InfluencerCriteria {
  const criteria: InfluencerCriteria = {
    primaryNiches: [],
    secondaryNiches: [],
    contentStyles: [],
    audienceAlignment: {
      ageRanges: [brandProfile.targetAudience.primaryAge, brandProfile.targetAudience.secondaryAge],
      genderPreference: brandProfile.targetAudience.gender,
      interests: brandProfile.targetAudience.interests
    },
    brandCompatibility: {
      values: brandProfile.brandValues,
      aesthetics: determineAesthetics(brandProfile),
      contentTypes: brandProfile.contentThemes
    },
    searchQueries: []
  };

  // Map brand category to influencer niches
  const categoryMapping: Record<string, string[]> = {
    'Sports & Fitness': ['Fitness', 'Sports', 'Wellness', 'Health'],
    'Home & Living': ['Lifestyle', 'Home', 'DIY', 'Family'],
    'Food & Beverage': ['Food', 'Lifestyle', 'Entertainment'],
    'Technology': ['Tech', 'Lifestyle', 'Gaming', 'Business'],
    'Fashion & Beauty': ['Fashion', 'Beauty', 'Lifestyle'],
    'Travel & Tourism': ['Travel', 'Adventure', 'Lifestyle'],
    'Automotive': ['Automotive', 'Tech', 'Lifestyle'],
    'Entertainment': ['Entertainment', 'Music', 'Comedy', 'Lifestyle']
  };

  criteria.primaryNiches = categoryMapping[brandProfile.category] || ['Lifestyle'];
  criteria.secondaryNiches = brandProfile.influencerTypes;

  // Generate sophisticated search queries
  criteria.searchQueries = generateBrandAwareSearchQueries(brandProfile, userQuery);

  return criteria;
}

/**
 * Generate brand-aware search queries for influencer discovery
 */
function generateBrandAwareSearchQueries(brandProfile: BrandProfile, userQuery: string): string[] {
  const queries: string[] = [];
  const brand = brandProfile.name;
  const keywords = brandProfile.searchKeywords;
  const themes = brandProfile.contentThemes;

  // Brand-specific queries
  queries.push(`${brand} brand ambassador influencer`);
  queries.push(`${brand} collaboration influencer partnership`);
  
  // Category-specific queries
  keywords.forEach(keyword => {
    queries.push(`${keyword} influencer ${brand} style`);
    queries.push(`${keyword} content creator brand partnership`);
  });

  // Theme-based queries
  themes.forEach(theme => {
    queries.push(`${theme} influencer collaboration`);
    queries.push(`${theme} content creator sponsorship`);
  });

  // User query integration
  if (userQuery) {
    queries.push(`${userQuery} ${brand} compatible influencer`);
    queries.push(`${userQuery} ${brandProfile.category} brand ambassador`);
  }

  return queries.slice(0, 6); // Limit to top 6 queries
}

/**
 * Analyze unknown brand using AI-powered heuristics
 */
function analyzeUnknownBrand(brandName: string): BrandProfile {
  const name = brandName.toLowerCase();
  
  // Heuristic analysis based on brand name patterns
  let category = 'Lifestyle';
  let subCategory = 'General';
  let keywords = ['lifestyle', 'brand', 'partnership'];

  // Technology patterns
  if (name.includes('tech') || name.includes('soft') || name.includes('app') || name.includes('digital')) {
    category = 'Technology';
    subCategory = 'Software/Apps';
    keywords = ['tech', 'innovation', 'digital', 'app review'];
  }
  
  // Fashion patterns
  if (name.includes('fashion') || name.includes('style') || name.includes('wear') || name.includes('cloth')) {
    category = 'Fashion & Beauty';
    subCategory = 'Apparel';
    keywords = ['fashion', 'style', 'outfit', 'clothing'];
  }
  
  // Food patterns
  if (name.includes('food') || name.includes('eat') || name.includes('restaurant') || name.includes('coffee')) {
    category = 'Food & Beverage';
    subCategory = 'Food Service';
    keywords = ['food', 'restaurant', 'culinary', 'foodie'];
  }
  
  // Fitness patterns
  if (name.includes('fit') || name.includes('gym') || name.includes('sport') || name.includes('health')) {
    category = 'Sports & Fitness';
    subCategory = 'Fitness';
    keywords = ['fitness', 'health', 'workout', 'wellness'];
  }

  return {
    name: brandName,
    category,
    subCategory,
    targetAudience: {
      primaryAge: '18-35',
      secondaryAge: '25-45',
      gender: ['Male', 'Female'],
      interests: keywords,
      lifestyle: ['active', 'engaged', 'social']
    },
    brandValues: ['quality', 'authenticity', 'innovation'],
    contentThemes: keywords,
    influencerTypes: ['lifestyle', 'brand ambassador'],
    searchKeywords: keywords,
    avoidKeywords: ['negative', 'controversial']
  };
}

/**
 * Determine brand aesthetics for content matching
 */
function determineAesthetics(brandProfile: BrandProfile): string[] {
  const aestheticsMap: Record<string, string[]> = {
    'Sports & Fitness': ['athletic', 'energetic', 'motivational', 'clean', 'dynamic'],
    'Home & Living': ['cozy', 'organized', 'warm', 'practical', 'minimalist'],
    'Food & Beverage': ['appetizing', 'social', 'vibrant', 'fresh', 'fun'],
    'Technology': ['modern', 'sleek', 'innovative', 'clean', 'futuristic'],
    'Fashion & Beauty': ['stylish', 'elegant', 'trendy', 'aspirational', 'polished'],
    'Travel & Tourism': ['adventurous', 'inspiring', 'wanderlust', 'scenic', 'cultural']
  };

  return aestheticsMap[brandProfile.category] || ['professional', 'authentic', 'engaging'];
}

/**
 * Extract brand name from user query
 */
export function extractBrandFromQuery(query: string): string | null {
  // Simple brand extraction - look for capitalized words that might be brand names
  const words = query.split(' ');
  const potentialBrands = words.filter(word => 
    word.charAt(0) === word.charAt(0).toUpperCase() && 
    word.length > 2 &&
    !['I', 'The', 'A', 'An', 'And', 'Or', 'But', 'For'].includes(word)
  );

  // Return the first potential brand name
  return potentialBrands.length > 0 ? potentialBrands[0] : null;
}

/**
 * Score influencer compatibility with brand
 */
export function calculateBrandCompatibility(
  influencer: any, 
  brandProfile: BrandProfile
): number {
  let score = 0;
  const bio = (influencer.biography || '').toLowerCase();
  
  // Check for brand keywords in bio
  brandProfile.searchKeywords.forEach(keyword => {
    if (bio.includes(keyword.toLowerCase())) {
      score += 15;
    }
  });
  
  // Check for brand themes
  brandProfile.contentThemes.forEach(theme => {
    if (bio.includes(theme.toLowerCase())) {
      score += 10;
    }
  });
  
  // Check for brand values
  brandProfile.brandValues.forEach(value => {
    if (bio.includes(value.toLowerCase())) {
      score += 8;
    }
  });
  
  // Penalize for avoid keywords
  brandProfile.avoidKeywords.forEach(avoid => {
    if (bio.includes(avoid.toLowerCase())) {
      score -= 20;
    }
  });
  
  // Bonus for verified accounts (brands prefer verified influencers)
  if (influencer.verified) {
    score += 5;
  }
  
  // Bonus for high engagement rate (good for brand partnerships)
  if (influencer.engagementRate > 3) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
} 