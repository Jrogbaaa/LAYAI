import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs, QueryConstraint } from 'firebase/firestore';
import { ApifySearchParams } from './apifyService';

export interface VettedInfluencer {
  id: string;
  username: string;
  displayName: string;
  platform: string;
  country: string;
  followerCount: number;
  engagementRate: number;
  rank: number;
  genres: string[];
  primaryGenre: string;
  category: 'Nano' | 'Micro' | 'Macro' | 'Mega' | 'Celebrity';
  isVerified: boolean;
  isActive: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  brandCompatibilityScore?: number; // For brand-specific scoring
}

export interface VettedSearchResult {
  influencers: VettedInfluencer[];
  totalCount: number;
  searchSource: 'vetted_database';
}

// Genre mapping for better search matching
const genreMapping: Record<string, string[]> = {
  'fitness': ['fitness', 'sports', 'gym', 'workout', 'health', 'athlete', 'training'],
  'sports': ['sports', 'fitness', 'athlete', 'gym', 'training', 'workout'],
  'lifestyle': ['lifestyle', 'travel', 'home', 'diy', 'personal', 'daily life', 'vida', 'estilo', 'books', 'modeling'],
  'fashion': ['fashion', 'style', 'clothing', 'beauty', 'moda', 'ropa', 'estilo', 'modeling'],
  'beauty': ['beauty', 'makeup', 'skincare', 'cosmetic', 'belleza', 'maquillaje'],
  'food': ['food', 'cooking', 'recipe', 'nutrition', 'chef', 'comida', 'cocina'],
  'tech': ['tech', 'technology', 'gadget', 'software', 'tecnologia'],
  'gaming': ['gaming', 'esports', 'games', 'videojuegos', 'gamer'],
  'music': ['music', 'musician', 'entertainment', 'musica', 'entretenimiento'],
  'business': ['business', 'entrepreneur', 'finance', 'negocios', 'emprendedor'],
  'travel': ['travel', 'adventure', 'explore', 'viaje', 'aventura'],
  'home': ['home', 'interior', 'furniture', 'decor', 'diy', 'casa', 'hogar', 'decoracion', 'interiorismo', 'lifestyle'],
  'art': ['art', 'photography', 'creative', 'arte', 'fotografia', 'creativo'],
  'education': ['education', 'learning', 'teaching', 'educacion', 'enseñanza']
};

function matchesNiche(influencerGenres: string[], searchNiches: string[]): boolean {
  if (!searchNiches || searchNiches.length === 0) return true;
  
  // Convert influencer genres to lowercase for comparison
  const lowerInfluencerGenres = influencerGenres.map(g => g.toLowerCase());
  
  for (const searchNiche of searchNiches) {
    const searchNicheLower = searchNiche.toLowerCase();
    const mappedGenres = genreMapping[searchNicheLower] || [searchNicheLower];
    
    for (const genre of mappedGenres) {
      // Check if any influencer genre contains the search genre
      if (lowerInfluencerGenres.some(g => g.includes(genre) || genre.includes(g))) {
        return true;
      }
    }
  }
  
  // Additional fallback: if searching for "home" or "lifestyle", match broader categories
  const searchText = searchNiches.join(' ').toLowerCase();
  if (searchText.includes('home') || searchText.includes('lifestyle')) {
    // Be more inclusive for home/lifestyle searches
    return lowerInfluencerGenres.some(g => 
      g.includes('lifestyle') || 
      g.includes('home') || 
      g.includes('fashion') || 
      g.includes('beauty') ||
      g.includes('books') ||
      g.includes('modeling') ||
      g.includes('art')
    );
  }
  
  return false;
}

function detectGenderFromUsername(username: string): 'male' | 'female' | 'unknown' {
  if (!username) return 'unknown';
  
  const usernameClean = username.toLowerCase().replace(/[\d_.-]/g, '');
  
  // Spanish female names/indicators
  const femaleIndicators = [
    'maria', 'ana', 'elena', 'laura', 'sara', 'paula', 'lucia', 'carmen', 'sofia', 'andrea',
    'cristina', 'marta', 'beatriz', 'patricia', 'raquel', 'rosa', 'monica', 'mercedes', 'sandra',
    'natalia', 'silvia', 'pilar', 'esperanza', 'concepcion', 'angeles', 'dolores', 'antonia',
    'girl', 'chica', 'woman', 'mujer', 'queen', 'princess', 'bella', 'bonita', 'linda'
  ];
  
  // Spanish male names/indicators
  const maleIndicators = [
    'jose', 'antonio', 'manuel', 'francisco', 'juan', 'david', 'miguel', 'carlos', 'pedro',
    'luis', 'angel', 'rafael', 'javier', 'jesus', 'daniel', 'alejandro', 'sergio', 'fernando',
    'pablo', 'jorge', 'alberto', 'ricardo', 'eduardo', 'victor', 'oscar', 'ruben', 'diego',
    'boy', 'chico', 'man', 'hombre', 'king', 'prince', 'papa', 'papi'
  ];
  
  for (const indicator of femaleIndicators) {
    if (usernameClean.includes(indicator)) {
      return 'female';
    }
  }
  
  for (const indicator of maleIndicators) {
    if (usernameClean.includes(indicator)) {
      return 'male';
    }
  }
  
  return 'unknown';
}

function matchesGender(influencer: VettedInfluencer, targetGender?: string): boolean {
  if (!targetGender || targetGender === 'any') return true;
  
  const detectedGender = detectGenderFromUsername(influencer.username);
  if (detectedGender === 'unknown') return true; // Don't filter out if uncertain
  
  return detectedGender === targetGender.toLowerCase();
}

function isSpainRelated(location?: string, userQuery?: string, brandName?: string): boolean {
  if (!location && !userQuery && !brandName) return true; // Always search vetted DB if no specific location
  
  const searchText = [location, userQuery, brandName].filter(Boolean).join(' ').toLowerCase();
  
  return searchText.includes('spain') || 
         searchText.includes('españa') || 
         searchText.includes('spanish') ||
         searchText.includes('madrid') ||
         searchText.includes('barcelona') ||
         searchText.includes('valencia') ||
         searchText.includes('sevilla') ||
         searchText.includes('ikea') || // Always include for IKEA brand
         searchText.includes('home') || // Include for home-related searches
         searchText.includes('lifestyle') || // Include for lifestyle searches
         true; // For now, always search vetted DB since all data is Spanish
}

export async function searchVettedInfluencers(params: ApifySearchParams): Promise<VettedSearchResult> {
  try {
    console.log('🔍 Starting vetted influencer search with params:', {
      location: params.location,
      niches: params.niches,
      brandName: params.brandName,
      userQuery: params.userQuery,
      gender: params.gender,
      minFollowers: params.minFollowers,
      maxFollowers: params.maxFollowers
    });

    // Enhanced query parsing for better database filtering
    const parsedQuery = parseUserQuery(params.userQuery || '', params);
    console.log('🧠 Parsed query parameters:', parsedQuery);

    // Debug the Spain check
    console.log('🔍 Spain relation check:', {
      location: params.location,
      userQuery: params.userQuery,
      brandName: params.brandName,
      isSpainRelated: isSpainRelated(params.location, params.userQuery, params.brandName)
    });

    // Automatically search vetted database for Spain-related queries OR IKEA brand
    const isIkeaBrand = parsedQuery.brand?.toLowerCase().includes('ikea') || 
                       params.brandName?.toLowerCase().includes('ikea') || 
                       params.userQuery?.toLowerCase().includes('ikea');
    
    if (!isSpainRelated(params.location, params.userQuery, params.brandName) && !isIkeaBrand) {
      console.log('❌ Not a Spain-related query or IKEA brand, skipping vetted database');
      return {
        influencers: [],
        totalCount: 0,
        searchSource: 'vetted_database'
      };
    }

    console.log('✅ Proceeding with vetted database search...');

    const vettedRef = collection(db, 'vetted_influencers');
    
    // Simple query to get all Spanish influencers (no composite index needed)
    const baseQuery = query(vettedRef, where('country', '==', 'Spain'), limit(1000));
    const querySnapshot = await getDocs(baseQuery);
    
    console.log(`📊 Found ${querySnapshot.size} total Spanish influencers in database`);
    
    let allInfluencers: VettedInfluencer[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allInfluencers.push({
        id: doc.id,
        username: data.username,
        displayName: data.displayName,
        platform: data.platform || 'Instagram',
        country: data.country,
        followerCount: data.followerCount,
        engagementRate: data.engagementRate,
        rank: data.rank,
        genres: data.genres || [],
        primaryGenre: data.primaryGenre,
        category: data.category,
        isVerified: data.isVerified,
        isActive: data.isActive,
        source: data.source,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });

    console.log(`📊 Successfully parsed ${allInfluencers.length} influencers from database`);

    // Apply enhanced filters based on parsed query
    let filteredInfluencers = allInfluencers;

    // Use parsed gender or fallback to params.gender
    const targetGender = parsedQuery.gender || params.gender;
    if (targetGender && targetGender !== 'any') {
      console.log(`👤 Filtering by gender: ${targetGender}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        matchesGender(inf, targetGender)
      );
      console.log(`📊 After gender filter: ${filteredInfluencers.length} influencers`);
    }

    // Enhanced niche filtering with brand context
    let searchNiches = parsedQuery.niches.length > 0 ? parsedQuery.niches : (params.niches || []);
    
    // Add brand-specific niches
    if (isIkeaBrand) {
      // Add relevant niches for IKEA brand compatibility
      const ikeaNiches = ['home', 'lifestyle', 'fashion', 'diy', 'interior', 'decor'];
      searchNiches = Array.from(new Set([...searchNiches, ...ikeaNiches]));
      console.log('🏠 Enhanced search niches for IKEA brand:', searchNiches);
    }

    // Apply niche filtering
    if (searchNiches.length > 0) {
      console.log(`🎯 Filtering by niches: ${searchNiches.join(', ')}`);
      
      // Debug niche matching for first few influencers
      const debugCount = Math.min(3, filteredInfluencers.length);
      for (let i = 0; i < debugCount; i++) {
        const inf = filteredInfluencers[i];
        const matches = matchesNiche(inf.genres, searchNiches);
        console.log(`🔍 Niche match debug for ${inf.username}: genres=[${inf.genres.join(', ')}], searchNiches=[${searchNiches.join(', ')}], matches=${matches}`);
      }
      
      filteredInfluencers = filteredInfluencers.filter(inf => 
        matchesNiche(inf.genres, searchNiches)
      );
      console.log(`📊 After niche filter: ${filteredInfluencers.length} influencers`);
    }

    // Enhanced follower count filtering - Adjusted for premium Spanish database
    const minFollowers = parsedQuery.minFollowers || params.minFollowers;
    const maxFollowers = parsedQuery.maxFollowers || params.maxFollowers;
    
    // Smart follower filtering: If the range is too restrictive for our premium database, adjust it
    let effectiveMinFollowers = minFollowers;
    let effectiveMaxFollowers = maxFollowers;
    
    // If searching for small influencers (under 100K) but our DB has premium influencers (100K+), 
    // adjust the range to include our quality database
    if (maxFollowers && maxFollowers < 100000) {
      console.log(`💡 Adjusting restrictive maxFollowers from ${maxFollowers} to 500K for premium Spanish database`);
      effectiveMaxFollowers = 500000; // Extend to include macro influencers
    }
    
    if (effectiveMinFollowers) {
      console.log(`📊 Filtering by minFollowers: ${effectiveMinFollowers}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.followerCount >= effectiveMinFollowers
      );
      console.log(`📊 After minFollowers filter: ${filteredInfluencers.length} influencers`);
    }

    if (effectiveMaxFollowers) {
      console.log(`📊 Filtering by maxFollowers: ${effectiveMaxFollowers}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.followerCount <= effectiveMaxFollowers
      );
      console.log(`📊 After maxFollowers filter: ${filteredInfluencers.length} influencers`);
    }

    // Brand compatibility scoring for IKEA
    if (isIkeaBrand) {
      console.log('🏠 Applying IKEA brand compatibility scoring...');
      filteredInfluencers = filteredInfluencers.map(inf => ({
        ...inf,
        brandCompatibilityScore: calculateIkeaBrandCompatibility(inf)
      })).sort((a, b) => (b.brandCompatibilityScore || 0) - (a.brandCompatibilityScore || 0));
      
      console.log(`🏆 Top IKEA compatibility scores: ${filteredInfluencers.slice(0, 3).map(inf => `${inf.username}: ${inf.brandCompatibilityScore}`).join(', ')}`);
    } else {
      // Sort by engagement rate first (higher is better), then by follower count descending
      filteredInfluencers.sort((a, b) => {
        // Primary sort: engagement rate (higher first)
        const engagementDiff = b.engagementRate - a.engagementRate;
        if (Math.abs(engagementDiff) > 0.001) { // Use small threshold for floating point comparison
          return engagementDiff;
        }
        // Secondary sort: follower count (higher first)
        return b.followerCount - a.followerCount;
      });
    }

    // Limit results
    const limitedResults = filteredInfluencers.slice(0, 50);

    console.log(`✅ Vetted database search complete: ${limitedResults.length} results after enhanced filtering`);

    return {
      influencers: limitedResults,
      totalCount: limitedResults.length,
      searchSource: 'vetted_database'
    };

  } catch (error) {
    console.error('❌ Error searching vetted influencers:', error);
    return {
      influencers: [],
      totalCount: 0,
      searchSource: 'vetted_database'
    };
  }
}

/**
 * Parse user query to extract specific search parameters
 * Examples: "women from Spain perfect for Ikea that are lifestyle influencers"
 */
function parseUserQuery(userQuery: string, params: ApifySearchParams): {
  gender?: string;
  location?: string;
  niches: string[];
  brand?: string;
  minFollowers?: number;
  maxFollowers?: number;
} {
  const query = userQuery.toLowerCase();
  const parsed: any = { niches: [] };

  // Extract gender
  if (/\b(women|female|females|girls?|ladies)\b/.test(query)) {
    parsed.gender = 'female';
  } else if (/\b(men|male|males|guys?|gentlemen)\b/.test(query)) {
    parsed.gender = 'male';
  }

  // Extract location
  if (/\b(spain|españa|spanish|from spain|in spain)\b/.test(query)) {
    parsed.location = 'Spain';
  }

  // Extract brand
  const brandMatches = query.match(/\b(ikea|nike|adidas|zara|h&m|coca.?cola|pepsi|mcdonald.?s)\b/);
  if (brandMatches) {
    parsed.brand = brandMatches[0];
  }

  // Extract niches based on keywords
  const nicheKeywords = {
    'lifestyle': ['lifestyle', 'life', 'daily', 'routine', 'living'],
    'home': ['home', 'decor', 'interior', 'furniture', 'house', 'ikea', 'decoration'],
    'fashion': ['fashion', 'style', 'clothing', 'outfit', 'trends', 'mode'],
    'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'belleza'],
    'fitness': ['fitness', 'gym', 'workout', 'health', 'sport', 'exercise'],
    'food': ['food', 'cooking', 'recipe', 'chef', 'culinary', 'comida'],
    'travel': ['travel', 'trip', 'vacation', 'explore', 'viaje'],
    'tech': ['tech', 'technology', 'gadget', 'app', 'digital'],
    'parenting': ['parenting', 'mom', 'dad', 'family', 'kids', 'children'],
    'business': ['business', 'entrepreneur', 'startup', 'professional'],
    'entertainment': ['entertainment', 'comedy', 'music', 'art', 'creative']
  };

  Object.entries(nicheKeywords).forEach(([niche, keywords]) => {
    if (keywords.some(keyword => query.includes(keyword))) {
      parsed.niches.push(niche);
    }
  });

  // Extract follower ranges
  const followerMatches = query.match(/(\d+(?:k|m|thousand|million))\s*(?:to|-)?\s*(\d+(?:k|m|thousand|million))?/);
  if (followerMatches) {
    const parseFollowerNumber = (str: string): number => {
      const num = parseFloat(str);
      if (str.includes('k') || str.includes('thousand')) return num * 1000;
      if (str.includes('m') || str.includes('million')) return num * 1000000;
      return num;
    };

    parsed.minFollowers = parseFollowerNumber(followerMatches[1]);
    if (followerMatches[2]) {
      parsed.maxFollowers = parseFollowerNumber(followerMatches[2]);
    }
  }

  // Micro/macro influencer detection
  if (/\bmicro.?influencers?\b/.test(query)) {
    parsed.minFollowers = 10000;
    parsed.maxFollowers = 100000;
  } else if (/\bmacro.?influencers?\b/.test(query)) {
    parsed.minFollowers = 100000;
    parsed.maxFollowers = 1000000;
  }

  return parsed;
}

/**
 * Calculate IKEA brand compatibility score
 */
function calculateIkeaBrandCompatibility(influencer: VettedInfluencer): number {
  let score = 0;

  // Genre compatibility (40% of score)
  const ikeaCompatibleGenres = ['lifestyle', 'home', 'fashion', 'diy', 'interior', 'decor'];
  const genreMatches = influencer.genres.filter(genre => 
    ikeaCompatibleGenres.some(compatible => 
      genre.toLowerCase().includes(compatible) || compatible.includes(genre.toLowerCase())
    )
  );
  score += (genreMatches.length / Math.max(influencer.genres.length, 1)) * 40;

  // Follower count sweet spot for IKEA (30% of score)
  if (influencer.followerCount >= 50000 && influencer.followerCount <= 500000) {
    score += 30; // Perfect range for IKEA campaigns
  } else if (influencer.followerCount >= 10000 && influencer.followerCount < 50000) {
    score += 20; // Good for micro-influencer campaigns
  } else if (influencer.followerCount > 500000 && influencer.followerCount <= 1000000) {
    score += 15; // Decent for macro campaigns
  }

  // Engagement rate (20% of score)
  if (influencer.engagementRate > 0.05) {
    score += 20; // Excellent engagement
  } else if (influencer.engagementRate > 0.03) {
    score += 15; // Good engagement
  } else if (influencer.engagementRate > 0.02) {
    score += 10; // Acceptable engagement
  }

  // Verification status (10% of score)
  if (influencer.isVerified) {
    score += 10;
  }

  return Math.round(score);
}

// Generate personalized match reasons based on influencer profile and search parameters
function generatePersonalizedMatchReasons(vetted: VettedInfluencer, params: ApifySearchParams): string[] {
  const reasons: string[] = [];
  
  // Always include verified source
  reasons.push('Base de datos verificada');
  
  // Brand-specific matching
  if (params.brandName?.toLowerCase().includes('ikea') || params.userQuery?.toLowerCase().includes('ikea')) {
    if (vetted.genres.some(genre => ['lifestyle', 'home', 'fashion', 'diy'].includes(genre.toLowerCase()))) {
      reasons.push('Perfecto para IKEA: especialista en contenido de hogar y estilo de vida');
    }
    if (vetted.followerCount >= 100000 && vetted.followerCount <= 500000) {
      reasons.push('Tamaño ideal de audiencia para campañas de marca premium');
    }
    if (vetted.engagementRate > 0.03) {
      reasons.push('Alta interacción con contenido de decoración y hogar');
    }
  }
  
  // Niche-specific matching
  if (params.niches && params.niches.length > 0) {
    const matchingNiches = vetted.genres.filter(genre => 
      params.niches!.some(niche => 
        genre.toLowerCase().includes(niche.toLowerCase()) ||
        niche.toLowerCase().includes(genre.toLowerCase())
      )
    );
    
    if (matchingNiches.length > 0) {
      const nicheText = matchingNiches.slice(0, 2).join(' y ');
      reasons.push(`Especialista verificado en ${nicheText}`);
    }
  }
  
  // Engagement quality
  if (vetted.engagementRate > 0.05) {
    reasons.push(`Engagement excepcional del ${(vetted.engagementRate * 100).toFixed(1)}% - audiencia muy activa`);
  } else if (vetted.engagementRate > 0.03) {
    reasons.push(`Engagement sólido del ${(vetted.engagementRate * 100).toFixed(1)}% - gran interacción`);
  } else {
    reasons.push(`${(vetted.engagementRate * 100).toFixed(1)}% engagement rate`);
  }
  
  // Follower count reasoning
  if (vetted.followerCount > 1000000) {
    reasons.push('Mega-influencer con alcance masivo en España');
  } else if (vetted.followerCount > 500000) {
    reasons.push('Macro-influencer con gran influencia nacional');
  } else if (vetted.followerCount > 100000) {
    reasons.push('Influencer establecido con audiencia consolidada');
  } else if (vetted.followerCount > 10000) {
    reasons.push('Micro-influencer con alta conexión personal');
  }
  
  // Category-specific benefits
  switch (vetted.category) {
    case 'Celebrity':
      reasons.push('Estatus de celebridad con reconocimiento masivo');
      break;
    case 'Mega':
      reasons.push('Alcance premium con audiencia establecida');
      break;
    case 'Macro':
      reasons.push('Equilibrio perfecto entre alcance y engagement');
      break;
    case 'Micro':
      reasons.push('Conexión auténtica con comunidad leal');
      break;
    case 'Nano':
      reasons.push('Influencia local con alta credibilidad');
      break;
  }
  
  // Platform-specific advantages
  if (vetted.platform === 'Instagram') {
    reasons.push('Plataforma ideal para contenido visual de marca');
  } else if (vetted.platform === 'TikTok') {
    reasons.push('Creador viral en la plataforma de mayor crecimiento');
  }
  
  // Location-based matching
  if (params.location?.toLowerCase().includes('spain') || params.location?.toLowerCase().includes('españa')) {
    reasons.push('Influencer local español con audiencia nativa');
  }
  
  // Verification status
  if (vetted.isVerified) {
    reasons.push('✅ Cuenta verificada oficialmente');
  }
  
  // Activity status
  if (vetted.isActive) {
    reasons.push('Creador activo con contenido regular');
  }
  
  // Limit to 4-5 most relevant reasons to avoid overwhelming
  return reasons.slice(0, 5);
}

// Convert vetted influencer to match result format for consistency
export function convertVettedToMatchResult(vetted: VettedInfluencer, params?: ApifySearchParams) {
  return {
    influencer: {
      id: vetted.username,
      name: vetted.displayName,
      handle: vetted.username,
      platform: vetted.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
      followerCount: vetted.followerCount,
      engagementRate: vetted.engagementRate, // Already stored as decimal (0.0286 = 2.86%)
      ageRange: '25-34' as const,
      gender: 'Other' as const, // Default since we don't have this data
      location: vetted.country,
      niche: vetted.genres,
      contentStyle: ['Posts'] as const,
      pastCollaborations: [],
      averageRate: Math.floor(vetted.followerCount / 100) || 1000,
      costLevel: vetted.category === 'Celebrity' ? 'Celebrity' : 
                 vetted.category === 'Mega' ? 'Premium' : 
                 vetted.category === 'Macro' ? 'Mid-Range' : 'Budget',
      audienceDemographics: {
        ageGroups: {
          '13-17': 5,
          '18-24': 30,
          '25-34': 40,
          '35-44': 20,
          '45-54': 4,
          '55+': 1,
        },
        gender: {
          male: 50,
          female: 48,
          other: 2,
        },
        topLocations: [vetted.country],
        interests: vetted.genres,
      },
      recentPosts: [],
      contactInfo: {
        preferredContact: 'Email' as const,
      },
      isActive: vetted.isActive,
      lastUpdated: new Date(),
    },
    matchScore: Math.min(0.95, 0.85 + (vetted.engagementRate * 2)), // High score for vetted influencers
    matchReasons: params ? generatePersonalizedMatchReasons(vetted, params) : [
      'Base de datos verificada',
      `Especialista en ${vetted.primaryGenre}`,
      `${(vetted.followerCount / 1000).toFixed(0)}K seguidores`,
      `${(vetted.engagementRate * 100).toFixed(1)}% engagement`
    ],
    estimatedCost: Math.floor(vetted.followerCount / 100) || 1000,
    similarPastCampaigns: [],
    potentialReach: Math.round(vetted.followerCount * vetted.engagementRate),
    recommendations: [`Influencer verificado de la base de datos española`],
  };
} 