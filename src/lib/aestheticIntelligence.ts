/**
 * Aesthetic Intelligence System
 * Advanced analysis of visual styles and brand aesthetics
 */

export interface AestheticProfile {
  style: string;
  visualKeywords: string[];
  contentIndicators: string[];
  brandContext: string[];
  colorPalette: string[];
  designPrinciples: string[];
  lifestyleElements: string[];
  confidence: number;
}

export interface AestheticAnalysisResult {
  primaryAesthetic: string;
  secondaryAesthetics: string[];
  visualScore: number;
  contentScore: number;
  brandAlignmentScore: number;
  overallScore: number;
  explanation: string;
  recommendations: string[];
}

/**
 * Comprehensive aesthetic database with detailed style profiles
 */
export const AESTHETIC_DATABASE: Record<string, AestheticProfile> = {
  'ikea': {
    style: 'Scandinavian Minimalist',
    visualKeywords: ['clean lines', 'simple', 'functional', 'light wood', 'white', 'neutral', 'organized'],
    contentIndicators: ['organization', 'storage', 'DIY', 'home hacks', 'affordable', 'functional design', 'minimalist living'],
    brandContext: ['ikea', 'scandinavian', 'nordic', 'minimalist', 'functional', 'affordable design'],
    colorPalette: ['white', 'beige', 'light wood', 'neutral', 'soft pastels', 'natural tones'],
    designPrinciples: ['functionality', 'simplicity', 'accessibility', 'modularity', 'sustainability'],
    lifestyleElements: ['family-friendly', 'practical', 'organized', 'budget-conscious', 'space-efficient'],
    confidence: 0.95
  },
  'bohemian': {
    style: 'Bohemian Eclectic',
    visualKeywords: ['layered', 'textured', 'colorful', 'eclectic', 'vintage', 'plants', 'tapestries'],
    contentIndicators: ['boho', 'vintage finds', 'thrift', 'plants', 'macrame', 'layered textiles'],
    brandContext: ['bohemian', 'boho', 'eclectic', 'vintage', 'free-spirited', 'artistic'],
    colorPalette: ['earth tones', 'rich jewel tones', 'warm colors', 'mixed patterns'],
    designPrinciples: ['self-expression', 'creativity', 'storytelling', 'layering', 'personalization'],
    lifestyleElements: ['artistic', 'creative', 'free-spirited', 'travel-inspired', 'nature-loving'],
    confidence: 0.85
  },
  'modern': {
    style: 'Contemporary Modern',
    visualKeywords: ['sleek', 'geometric', 'bold', 'statement pieces', 'contemporary', 'luxurious'],
    contentIndicators: ['modern design', 'contemporary', 'luxury', 'designer', 'sleek', 'sophisticated'],
    brandContext: ['modern', 'contemporary', 'luxury', 'designer', 'high-end', 'sophisticated'],
    colorPalette: ['monochromatic', 'bold accents', 'black and white', 'metallic'],
    designPrinciples: ['sophistication', 'quality', 'statement-making', 'innovation', 'luxury'],
    lifestyleElements: ['sophisticated', 'urban', 'professional', 'quality-focused', 'design-conscious'],
    confidence: 0.90
  },
  'farmhouse': {
    style: 'Rustic Farmhouse',
    visualKeywords: ['rustic', 'shiplap', 'barn doors', 'farmhouse sink', 'weathered wood', 'vintage'],
    contentIndicators: ['farmhouse', 'rustic', 'country', 'vintage', 'shiplap', 'barn', 'cottage'],
    brandContext: ['farmhouse', 'rustic', 'country', 'vintage', 'traditional', 'cozy'],
    colorPalette: ['cream', 'white', 'weathered wood', 'soft pastels', 'muted colors'],
    designPrinciples: ['comfort', 'nostalgia', 'simplicity', 'warmth', 'authenticity'],
    lifestyleElements: ['family-oriented', 'cozy', 'traditional', 'comfort-focused', 'nostalgic'],
    confidence: 0.80
  },
  'industrial': {
    style: 'Industrial Chic',
    visualKeywords: ['exposed brick', 'metal', 'concrete', 'pipe', 'raw materials', 'edgy'],
    contentIndicators: ['industrial', 'loft', 'warehouse', 'exposed', 'raw', 'urban', 'edgy'],
    brandContext: ['industrial', 'urban', 'edgy', 'raw', 'metropolitan', 'modern'],
    colorPalette: ['black', 'gray', 'metal', 'raw materials', 'muted tones'],
    designPrinciples: ['authenticity', 'rawness', 'functionality', 'urban appeal', 'minimalism'],
    lifestyleElements: ['urban', 'edgy', 'minimalist', 'practical', 'modern'],
    confidence: 0.85
  }
};

/**
 * Analyze aesthetic compatibility with advanced AI-powered detection
 */
export function analyzeAestheticCompatibility(
  profileContent: string,
  brandAesthetic: string,
  visualCues?: string[]
): AestheticAnalysisResult {
  const targetAesthetic = AESTHETIC_DATABASE[brandAesthetic.toLowerCase()];
  
  if (!targetAesthetic) {
    return performGenericAestheticAnalysis(profileContent, brandAesthetic);
  }

  const content = profileContent.toLowerCase();
  let visualScore = 0;
  let contentScore = 0;
  let brandAlignmentScore = 0;

  // 1. Analyze visual keywords (from bio, captions, etc.)
  const visualMatches = targetAesthetic.visualKeywords.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  visualScore = Math.min(100, (visualMatches.length / targetAesthetic.visualKeywords.length) * 100 + 20);

  // 2. Analyze content indicators
  const contentMatches = targetAesthetic.contentIndicators.filter(indicator => 
    content.includes(indicator.toLowerCase())
  );
  contentScore = Math.min(100, (contentMatches.length / targetAesthetic.contentIndicators.length) * 100 + 15);

  // 3. Analyze brand context alignment
  const brandMatches = targetAesthetic.brandContext.filter(brand => 
    content.includes(brand.toLowerCase())
  );
  brandAlignmentScore = Math.min(100, (brandMatches.length / targetAesthetic.brandContext.length) * 100 + 25);

  // 4. Advanced semantic analysis
  const semanticScore = performSemanticAnalysis(content, targetAesthetic);

  // 5. Calculate overall score with weightings
  const overallScore = Math.round(
    visualScore * 0.3 +
    contentScore * 0.25 +
    brandAlignmentScore * 0.25 +
    semanticScore * 0.2
  );

  // 6. Generate explanation and recommendations
  const explanation = generateAestheticExplanation(
    targetAesthetic,
    visualMatches,
    contentMatches,
    brandMatches,
    overallScore
  );

  const recommendations = generateAestheticRecommendations(
    targetAesthetic,
    overallScore,
    visualScore,
    contentScore,
    brandAlignmentScore
  );

  return {
    primaryAesthetic: targetAesthetic.style,
    secondaryAesthetics: detectSecondaryAesthetics(content),
    visualScore,
    contentScore,
    brandAlignmentScore,
    overallScore,
    explanation,
    recommendations
  };
}

/**
 * Perform advanced semantic analysis using context understanding
 */
function performSemanticAnalysis(content: string, aesthetic: AestheticProfile): number {
  let score = 50; // Base score

  // Check for lifestyle alignment
  const lifestyleMatches = aesthetic.lifestyleElements.filter(element => 
    content.includes(element.toLowerCase()) || 
    hasSemanticMatch(content, element)
  );
  score += lifestyleMatches.length * 8;

  // Check for design principle alignment
  const principleMatches = aesthetic.designPrinciples.filter(principle => 
    content.includes(principle.toLowerCase()) || 
    hasSemanticMatch(content, principle)
  );
  score += principleMatches.length * 6;

  // Check for color palette mentions
  const colorMatches = aesthetic.colorPalette.filter(color => 
    content.includes(color.toLowerCase())
  );
  score += colorMatches.length * 4;

  return Math.min(100, score);
}

/**
 * Check for semantic matches using synonyms and related terms
 */
function hasSemanticMatch(content: string, term: string): boolean {
  const synonymMap: Record<string, string[]> = {
    'organized': ['tidy', 'neat', 'structured', 'systematic', 'orderly'],
    'minimalist': ['simple', 'clean', 'sparse', 'uncluttered', 'basic'],
    'functional': ['practical', 'useful', 'efficient', 'purposeful', 'utilitarian'],
    'cozy': ['comfortable', 'warm', 'inviting', 'snug', 'homey'],
    'sophisticated': ['elegant', 'refined', 'polished', 'cultured', 'classy'],
    'rustic': ['country', 'rural', 'natural', 'weathered', 'aged'],
    'modern': ['contemporary', 'current', 'up-to-date', 'fresh', 'new'],
    'vintage': ['retro', 'classic', 'antique', 'old-fashioned', 'timeless']
  };

  const synonyms = synonymMap[term.toLowerCase()] || [];
  return synonyms.some(synonym => content.includes(synonym));
}

/**
 * Detect secondary aesthetics present in content
 */
function detectSecondaryAesthetics(content: string): string[] {
  const secondaryAesthetics: string[] = [];

  Object.entries(AESTHETIC_DATABASE).forEach(([key, aesthetic]) => {
    const matches = aesthetic.visualKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    
    if (matches.length >= 2) {
      secondaryAesthetics.push(aesthetic.style);
    }
  });

  return secondaryAesthetics.slice(0, 3); // Return top 3 secondary aesthetics
}

/**
 * Generate detailed explanation of aesthetic analysis
 */
function generateAestheticExplanation(
  aesthetic: AestheticProfile,
  visualMatches: string[],
  contentMatches: string[],
  brandMatches: string[],
  overallScore: number
): string {
  let explanation = `Aesthetic Analysis for ${aesthetic.style}:\n`;

  if (overallScore >= 80) {
    explanation += `🎯 Excellent alignment (${overallScore}%): This profile strongly embodies ${aesthetic.style} characteristics.`;
  } else if (overallScore >= 65) {
    explanation += `✅ Good alignment (${overallScore}%): This profile shows clear ${aesthetic.style} tendencies.`;
  } else if (overallScore >= 45) {
    explanation += `⚠️ Moderate alignment (${overallScore}%): Some ${aesthetic.style} elements present but could be stronger.`;
  } else {
    explanation += `❌ Limited alignment (${overallScore}%): Few ${aesthetic.style} characteristics detected.`;
  }

  if (visualMatches.length > 0) {
    explanation += `\n\n📸 Visual Elements: ${visualMatches.join(', ')}`;
  }

  if (contentMatches.length > 0) {
    explanation += `\n\n📝 Content Themes: ${contentMatches.join(', ')}`;
  }

  if (brandMatches.length > 0) {
    explanation += `\n\n🏷️ Brand Context: ${brandMatches.join(', ')}`;
  }

  return explanation;
}

/**
 * Generate actionable recommendations for improving aesthetic alignment
 */
function generateAestheticRecommendations(
  aesthetic: AestheticProfile,
  overallScore: number,
  visualScore: number,
  contentScore: number,
  brandAlignmentScore: number
): string[] {
  const recommendations: string[] = [];

  if (overallScore >= 80) {
    recommendations.push('🌟 Perfect aesthetic match - ideal for brand collaboration');
    recommendations.push('💡 Consider featuring this influencer prominently in campaigns');
  } else if (overallScore >= 65) {
    recommendations.push('✅ Strong aesthetic alignment - good candidate for partnership');
    
    if (visualScore < 70) {
      recommendations.push(`🎨 Could improve visual alignment by featuring more: ${aesthetic.visualKeywords.slice(0, 3).join(', ')}`);
    }
    
    if (contentScore < 70) {
      recommendations.push(`📝 Content could better reflect: ${aesthetic.contentIndicators.slice(0, 3).join(', ')}`);
    }
  } else if (overallScore >= 45) {
    recommendations.push('⚠️ Moderate fit - consider for secondary campaigns');
    recommendations.push(`🔧 To improve alignment, focus on: ${aesthetic.designPrinciples.slice(0, 2).join(', ')}`);
  } else {
    recommendations.push('❌ Limited aesthetic alignment - not recommended for style-specific campaigns');
    recommendations.push(`🎯 For future consideration, look for content featuring: ${aesthetic.visualKeywords.slice(0, 3).join(', ')}`);
  }

  return recommendations;
}

/**
 * Perform generic aesthetic analysis for unknown styles
 */
function performGenericAestheticAnalysis(content: string, brandAesthetic: string): AestheticAnalysisResult {
  const words = brandAesthetic.toLowerCase().split(' ');
  const content_lower = content.toLowerCase();
  
  let matches = 0;
  const foundKeywords: string[] = [];

  words.forEach(word => {
    if (content_lower.includes(word)) {
      matches++;
      foundKeywords.push(word);
    }
  });

  const score = Math.min(100, (matches / words.length) * 60 + 20);

  return {
    primaryAesthetic: brandAesthetic,
    secondaryAesthetics: [],
    visualScore: score,
    contentScore: score,
    brandAlignmentScore: score,
    overallScore: score,
    explanation: `Generic aesthetic analysis for "${brandAesthetic}". Found ${matches} matching keywords: ${foundKeywords.join(', ')}`,
    recommendations: score >= 60 ? 
      ['Good aesthetic match based on keyword analysis'] : 
      ['Limited aesthetic alignment - consider more specific style indicators']
  };
}

/**
 * Enhanced brand-specific aesthetic analysis
 */
export function analyzeBrandSpecificAesthetic(
  profileContent: string,
  brandName: string,
  userQuery: string
): AestheticAnalysisResult {
  // Extract aesthetic terms from user query
  const queryAesthetics = extractAestheticTerms(userQuery);
  
  // Get brand's aesthetic profile
  const brandAesthetic = getBrandAesthetic(brandName);
  
  // Combine brand and query aesthetics
  const combinedAesthetic = combinedAestheticAnalysis(
    profileContent,
    brandAesthetic,
    queryAesthetics
  );

  return combinedAesthetic;
}

/**
 * Extract aesthetic terms from user query
 */
function extractAestheticTerms(query: string): string[] {
  const aestheticTerms = [
    'minimalist', 'modern', 'contemporary', 'vintage', 'rustic', 'industrial',
    'bohemian', 'scandinavian', 'farmhouse', 'luxury', 'elegant', 'cozy',
    'clean', 'simple', 'sophisticated', 'edgy', 'artistic', 'functional',
    'ikea style', 'nordic', 'hygge', 'zen', 'eclectic', 'traditional'
  ];

  return aestheticTerms.filter(term => 
    query.toLowerCase().includes(term.toLowerCase())
  );
}

/**
 * Get brand-specific aesthetic profile
 */
function getBrandAesthetic(brandName: string): string {
  const brandAesthetics: Record<string, string> = {
    'ikea': 'ikea',
    'west elm': 'modern',
    'pottery barn': 'farmhouse',
    'cb2': 'modern',
    'urban outfitters': 'bohemian',
    'anthropologie': 'bohemian',
    'restoration hardware': 'industrial',
    'crate & barrel': 'modern'
  };

  return brandAesthetics[brandName.toLowerCase()] || 'modern';
}

/**
 * Perform combined aesthetic analysis
 */
function combinedAestheticAnalysis(
  content: string,
  brandAesthetic: string,
  queryAesthetics: string[]
): AestheticAnalysisResult {
  const primaryResult = analyzeAestheticCompatibility(content, brandAesthetic);
  
  // If query has specific aesthetic terms, weight them heavily
  if (queryAesthetics.length > 0) {
    const queryResults = queryAesthetics.map(aesthetic => 
      analyzeAestheticCompatibility(content, aesthetic)
    );
    
    // Find the best query aesthetic match
    const bestQueryResult = queryResults.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    );

    // Combine results with query aesthetic weighted more heavily
    const combinedScore = Math.round(
      primaryResult.overallScore * 0.4 + 
      bestQueryResult.overallScore * 0.6
    );

    return {
      ...primaryResult,
      overallScore: combinedScore,
      explanation: `Combined analysis: ${primaryResult.explanation}\n\nQuery-specific aesthetic (${bestQueryResult.primaryAesthetic}): ${bestQueryResult.explanation}`,
      recommendations: [
        ...primaryResult.recommendations,
        ...bestQueryResult.recommendations
      ]
    };
  }

  return primaryResult;
}

/**
 * Export enhanced aesthetic analysis for integration with search system
 */
export function enhanceInfluencerWithAesthetics(
  influencer: any,
  brandName: string,
  userQuery: string
): any {
  const profileContent = [
    influencer.biography || '',
    influencer.username || '',
    influencer.displayName || '',
    ...(influencer.recentPosts?.map((post: any) => post.content) || [])
  ].join(' ');

  const aestheticAnalysis = analyzeBrandSpecificAesthetic(
    profileContent,
    brandName,
    userQuery
  );

  return {
    ...influencer,
    aestheticAnalysis,
    aestheticScore: aestheticAnalysis.overallScore,
    visualAlignment: aestheticAnalysis.visualScore,
    contentAlignment: aestheticAnalysis.contentScore,
    brandAestheticMatch: aestheticAnalysis.brandAlignmentScore
  };
} 