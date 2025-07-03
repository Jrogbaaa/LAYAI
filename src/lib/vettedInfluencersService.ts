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

// Enhanced genre mapping for better search matching
const genreMapping: Record<string, string[]> = {
  'fitness': ['fitness', 'sports', 'gym', 'workout', 'health', 'athlete', 'training', 'crossfit', 'yoga', 'pilates', 'running'],
  'sports': ['sports', 'fitness', 'athlete', 'gym', 'training', 'workout', 'football', 'basketball', 'tennis', 'cycling'],
  'lifestyle': ['lifestyle', 'travel', 'home', 'diy', 'personal', 'daily life', 'vida', 'estilo', 'books', 'modeling', 'wellness', 'self-care'],
  'fashion': ['fashion', 'style', 'clothing', 'beauty', 'moda', 'ropa', 'estilo', 'modeling', 'streetwear', 'luxury', 'accessories'],
  'beauty': ['beauty', 'makeup', 'skincare', 'cosmetic', 'belleza', 'maquillaje', 'skincare', 'haircare', 'nails', 'aesthetics'],
  'food': ['food', 'cooking', 'recipe', 'nutrition', 'chef', 'comida', 'cocina', 'baking', 'healthy eating', 'vegan', 'restaurant'],
  'tech': ['tech', 'technology', 'gadget', 'software', 'tecnologia', 'ai', 'coding', 'apps', 'innovation', 'digital'],
  'gaming': ['gaming', 'esports', 'games', 'videojuegos', 'gamer', 'streaming', 'twitch', 'playstation', 'xbox', 'nintendo'],
  'music': ['music', 'musician', 'entertainment', 'musica', 'entretenimiento', 'singing', 'dj', 'concerts', 'festivals'],
  'business': ['business', 'entrepreneur', 'finance', 'negocios', 'emprendedor', 'startup', 'investing', 'marketing', 'leadership'],
  'travel': ['travel', 'adventure', 'explore', 'viaje', 'aventura', 'backpacking', 'hotels', 'destinations', 'wanderlust'],
  'home': ['home', 'interior', 'furniture', 'decor', 'diy', 'casa', 'hogar', 'decoracion', 'interiorismo', 'lifestyle', 'design', 'organization', 'cleaning'],
  'art': ['art', 'photography', 'creative', 'arte', 'fotografia', 'creativo', 'painting', 'drawing', 'sculpture', 'design'],
  'education': ['education', 'learning', 'teaching', 'educacion', 'enseñanza', 'school', 'university', 'courses', 'tutorials'],
  'parenting': ['parenting', 'family', 'kids', 'children', 'baby', 'mom', 'dad', 'familia', 'niños', 'bebé', 'motherhood', 'fatherhood'],
  'pets': ['pets', 'animals', 'dogs', 'cats', 'mascotas', 'perros', 'gatos', 'veterinary', 'pet care'],
  'automotive': ['cars', 'automotive', 'racing', 'motorcycles', 'coches', 'motos', 'driving', 'mechanics']
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
  
  // Enhanced Spanish female names/indicators
  const femaleIndicators = [
    // Traditional Spanish female names
    'maria', 'ana', 'elena', 'laura', 'sara', 'paula', 'lucia', 'carmen', 'sofia', 'andrea',
    'cristina', 'marta', 'beatriz', 'patricia', 'raquel', 'rosa', 'monica', 'mercedes', 'sandra',
    'natalia', 'silvia', 'pilar', 'esperanza', 'concepcion', 'angeles', 'dolores', 'antonia',
    'alba', 'nuria', 'gloria', 'irene', 'valeria', 'claudia', 'eva', 'susana', 'yolanda',
    'rocio', 'amparo', 'encarna', 'maite', 'montse', 'nerea', 'aitana', 'daniela', 'carla',
    'alejandra', 'noelia', 'vanessa', 'diana', 'leticia', 'ainhoa', 'miriam', 'lola', 'paloma',
    
    // Modern and international female names popular in Spain
    'emma', 'olivia', 'ava', 'isabella', 'sophia', 'mia', 'charlotte', 'amelia', 'harper',
    'evelyn', 'abigail', 'emily', 'elizabeth', 'mila', 'ella', 'avery', 'sofia', 'camila',
    'aria', 'scarlett', 'victoria', 'madison', 'luna', 'grace', 'chloe', 'penelope', 'layla',
    'riley', 'zoey', 'nora', 'lily', 'eleanor', 'hannah', 'lillian', 'addison', 'aubrey',
    'ellie', 'stella', 'natalie', 'zoe', 'leah', 'hazel', 'violet', 'aurora', 'savannah',
    'audrey', 'brooklyn', 'bella', 'claire', 'skylar', 'lucy', 'paisley', 'everly', 'anna',
    
    // Female indicators/words
    'girl', 'chica', 'woman', 'mujer', 'queen', 'princess', 'bella', 'bonita', 'linda',
    'señora', 'señorita', 'miss', 'lady', 'dama', 'reina', 'princesa', 'goddess', 'diosa',
    'mama', 'mami', 'mother', 'madre', 'daughter', 'hija', 'sister', 'hermana', 'aunt', 'tia'
  ];
  
  // Enhanced Spanish male names/indicators
  const maleIndicators = [
    // Traditional Spanish male names
    'jose', 'antonio', 'manuel', 'francisco', 'juan', 'david', 'miguel', 'carlos', 'pedro',
    'luis', 'angel', 'rafael', 'javier', 'jesus', 'daniel', 'alejandro', 'sergio', 'fernando',
    'pablo', 'jorge', 'alberto', 'ricardo', 'eduardo', 'victor', 'oscar', 'ruben', 'diego',
    'ramon', 'enrique', 'adrian', 'alvaro', 'mario', 'marcos', 'ivan', 'gonzalo', 'rodrigo',
    'cristian', 'andres', 'emilio', 'julian', 'nicolas', 'guillermo', 'jaime', 'ignacio',
    'samuel', 'mateo', 'gabriel', 'alex', 'aaron', 'leo', 'hugo', 'bruno', 'iker', 'pol',
    'eric', 'adam', 'izan', 'sergio', 'marco', 'thiago', 'gael', 'lucas', 'martin', 'oliver',
    
    // Modern and international male names popular in Spain
    'liam', 'noah', 'william', 'james', 'oliver', 'benjamin', 'elijah', 'lucas', 'mason',
    'logan', 'alexander', 'ethan', 'jacob', 'michael', 'daniel', 'henry', 'jackson', 'sebastian',
    'aiden', 'matthew', 'samuel', 'david', 'joseph', 'carter', 'owen', 'wyatt', 'john', 'jack',
    'luke', 'jayden', 'dylan', 'grayson', 'levi', 'isaac', 'gabriel', 'julian', 'mateo',
    'anthony', 'jaxon', 'lincoln', 'joshua', 'christopher', 'andrew', 'theodore', 'caleb',
    'ryan', 'asher', 'nathan', 'thomas', 'leo', 'isaiah', 'charles', 'josiah', 'christian',
    'hunter', 'eli', 'jonathan', 'connor', 'landon', 'adrian', 'austin', 'jordan', 'adam',
    
    // Male indicators/words
    'boy', 'chico', 'man', 'hombre', 'king', 'prince', 'papa', 'papi', 'señor', 'mister',
    'sir', 'lord', 'rey', 'principe', 'god', 'dios', 'father', 'padre', 'son', 'hijo',
    'brother', 'hermano', 'uncle', 'tio', 'grandfather', 'abuelo', 'guy', 'dude'
  ];
  
  // Check for female indicators first (more specific patterns)
  for (const indicator of femaleIndicators) {
    if (usernameClean.includes(indicator)) {
      return 'female';
    }
  }
  
  // Then check for male indicators
  for (const indicator of maleIndicators) {
    if (usernameClean.includes(indicator)) {
      return 'male';
    }
  }
  
  // Enhanced pattern matching for common username patterns
  // Female patterns: ending in 'ita', 'ela', 'ina', etc.
  if (/(?:ita|ela|ina|ana|lia|ria|ssa|nda)(?:\d|_|$)/.test(usernameClean)) {
    return 'female';
  }
  
  // Male patterns: ending in 'ito', 'ero', 'oso', etc.
  if (/(?:ito|ero|oso|ado|ndo|cho)(?:\d|_|$)/.test(usernameClean)) {
    return 'male';
  }
  
  return 'unknown';
}

function matchesGender(influencer: VettedInfluencer, targetGender?: string): boolean {
  if (!targetGender || targetGender === 'any') return true;
  
  const detectedGender = detectGenderFromUsername(influencer.username);
  
  // Enhanced: Also check display name for gender detection
  let finalGender = detectedGender;
  if (detectedGender === 'unknown' && influencer.displayName) {
    finalGender = detectGenderFromUsername(influencer.displayName);
  }
  
  // If still unknown, use more intelligent distribution based on genre preferences
  if (finalGender === 'unknown') {
    // Beauty, fashion, lifestyle tend to be more female-dominated
    const femaleSkewedGenres = ['beauty', 'fashion', 'lifestyle', 'home', 'decor', 'parenting'];
    // Sports, tech, gaming tend to be more male-dominated  
    const maleSkewedGenres = ['sports', 'fitness', 'tech', 'gaming', 'business'];
    
    const hasFemaleBias = influencer.genres.some(genre => 
      femaleSkewedGenres.some(fg => genre.toLowerCase().includes(fg))
    );
    const hasMaleBias = influencer.genres.some(genre => 
      maleSkewedGenres.some(mg => genre.toLowerCase().includes(mg))
    );
    
    if (hasFemaleBias && !hasMaleBias) {
      finalGender = 'female';
    } else if (hasMaleBias && !hasFemaleBias) {
      finalGender = 'male';
    } else {
      // Use consistent hash-based assignment for truly unknown cases
      const hash = influencer.username.toLowerCase().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      finalGender = Math.abs(hash) % 2 === 0 ? 'female' : 'male';
    }
  }
  
  return finalGender === targetGender.toLowerCase();
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

    // Enhanced brand detection and intelligence
    const brandName = parsedQuery.brand || params.brandName || '';
    const queryText = params.userQuery?.toLowerCase() || '';
    
    const isIkeaBrand = brandName.toLowerCase().includes('ikea') || queryText.includes('ikea');
    const isVipsBrand = brandName.toLowerCase().includes('vips') || queryText.includes('vips');
    const isLifestyleBrand = isVipsBrand || queryText.includes('lifestyle') || queryText.includes('casual');
    
    // Universal brand detection - ANY brand name triggers intelligent processing
    const hasAnyBrand = brandName.length > 2; // Minimum 3 chars to avoid false positives
    const hasKnownBrand = isIkeaBrand || isVipsBrand || hasAnyBrand;
    
    if (!isSpainRelated(params.location, params.userQuery, params.brandName) && !hasKnownBrand) {
      console.log('❌ Not a Spain-related query or known brand, skipping vetted database');
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
    
    // Add brand-specific niches for intelligent matching
    if (isIkeaBrand) {
      // IKEA: Home, lifestyle, DIY, interior design focus
      const ikeaNiches = ['home', 'lifestyle', 'fashion', 'diy', 'interior', 'decor'];
      searchNiches = Array.from(new Set([...searchNiches, ...ikeaNiches]));
      console.log('🏠 Enhanced search niches for IKEA brand:', searchNiches);
    } else if (isVipsBrand) {
      // VIPS: Lifestyle, food, casual dining, entertainment, young adult focus
      const vipsNiches = ['lifestyle', 'food', 'entertainment', 'fashion', 'casual', 'young'];
      searchNiches = Array.from(new Set([...searchNiches, ...vipsNiches]));
      console.log('🍔 Enhanced search niches for VIPS brand:', searchNiches);
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

    // Enhanced follower count filtering - Respect user's explicit preferences
    const minFollowers = parsedQuery.minFollowers || params.minFollowers;
    const maxFollowers = parsedQuery.maxFollowers || params.maxFollowers;
    
    // Apply user-specified follower filtering WITHOUT overriding their preferences
    let effectiveMinFollowers = minFollowers;
    let effectiveMaxFollowers = maxFollowers;
    
    // REMOVED: Smart follower filtering that overrides user requests
    // The old logic ignored user-specified limits like "under 500,000"
    // Now we respect the user's explicit requirements
    
    if (effectiveMinFollowers) {
      console.log(`📊 Filtering by minFollowers: ${effectiveMinFollowers.toLocaleString()}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.followerCount >= effectiveMinFollowers
      );
      console.log(`📊 After minFollowers filter: ${filteredInfluencers.length} influencers`);
    }

    if (effectiveMaxFollowers) {
      console.log(`📊 Filtering by maxFollowers: ${effectiveMaxFollowers.toLocaleString()}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.followerCount <= effectiveMaxFollowers
      );
      console.log(`📊 After maxFollowers filter: ${filteredInfluencers.length} influencers`);
    }

    // Enhanced Multi-Layered Analysis & Scoring
    console.log('🧠 Applying enhanced multi-layered analysis...');
    
    // 1. Apply strict demographic filtering
    if (targetGender && targetGender !== 'any') {
      console.log(`👤 Applying strict demographic filtering for ${targetGender}...`);
      const demographicFiltered: VettedInfluencer[] = [];
      
      for (const inf of filteredInfluencers) {
        const demographicCheck = passesStrictDemographicFilter(inf, params);
        if (demographicCheck.passes) {
          demographicFiltered.push(inf);
        } else {
          console.log(`❌ ${inf.username} failed demographic filter: ${demographicCheck.reasons.join(', ')}`);
        }
      }
      
      filteredInfluencers = demographicFiltered;
      console.log(`📊 After strict demographic filter: ${filteredInfluencers.length} influencers`);
    }
    
    // 2. Apply engagement quality filtering
    console.log('⚡ Applying engagement quality filtering...');
    const qualityFiltered: VettedInfluencer[] = [];
    
    for (const inf of filteredInfluencers) {
      const qualityCheck = passesEngagementQualityFilter(inf, 60); // 60% minimum quality score
      if (qualityCheck.passes) {
        qualityFiltered.push(inf);
      } else {
        console.log(`❌ ${inf.username} failed quality filter: ${qualityCheck.reasons.join(', ')}`);
      }
    }
    
    filteredInfluencers = qualityFiltered;
    console.log(`📊 After engagement quality filter: ${filteredInfluencers.length} influencers`);
    
    // 3. Apply advanced deduplication
    filteredInfluencers = deduplicateInfluencers(filteredInfluencers);
    
    // 4. Enhanced scoring system
    console.log('🎯 Applying enhanced scoring algorithm...');
    const scoredInfluencers = filteredInfluencers.map(inf => {
      const enhancedScore = calculateEnhancedScore(inf, params, brandName);
      
      return {
        ...inf,
        enhancedScore: enhancedScore.totalScore,
        scoreBreakdown: enhancedScore.breakdown
      } as VettedInfluencer & { 
        enhancedScore: number; 
        scoreBreakdown: any;
        brandCompatibilityScore?: number;
        brandCompatibilityProfile?: any;
      };
    });
    
    // 5. Brand-specific compatibility analysis
    if (brandName) {
      console.log(`🏷️ Applying enhanced brand compatibility analysis for: ${brandName}...`);
      const brandScoredInfluencers = scoredInfluencers.map(inf => {
        const brandCompatibility = calculateEnhancedBrandCompatibility(inf, brandName);
        
        return {
          ...inf,
          brandCompatibilityScore: brandCompatibility.overallScore,
          brandCompatibilityProfile: brandCompatibility
        };
      });
      
      // Sort by combined score (enhanced score + brand compatibility)
      brandScoredInfluencers.sort((a, b) => {
        const scoreA = (a.enhancedScore * 0.6) + ((a.brandCompatibilityScore || 0) * 0.4);
        const scoreB = (b.enhancedScore * 0.6) + ((b.brandCompatibilityScore || 0) * 0.4);
        return scoreB - scoreA;
      });
      
      filteredInfluencers = brandScoredInfluencers as VettedInfluencer[];
      console.log(`🏆 Top brand compatibility: ${filteredInfluencers.slice(0, 3).map(inf => `${inf.username}: ${(inf as any).brandCompatibilityScore}`).join(', ')}`);
    } else {
      // Sort by enhanced score only
      scoredInfluencers.sort((a, b) => b.enhancedScore - a.enhancedScore);
      filteredInfluencers = scoredInfluencers as VettedInfluencer[];
      console.log(`🏆 Top enhanced scores: ${filteredInfluencers.slice(0, 3).map(inf => `${inf.username}: ${(inf as any).enhancedScore}`).join(', ')}`);
    }

    // Enhanced result diversification to prevent repetitive profiles
    let diversifiedResults = filteredInfluencers;
    
    if (filteredInfluencers.length > 20) {
      console.log('🎯 Applying result diversification for variety...');
      
      // Group by genre and follower category for balanced selection
      const diversifiedList: VettedInfluencer[] = [];
      const genreTracker = new Map<string, number>();
      const categoryTracker = new Map<string, number>();
      const maxPerGenre = Math.max(3, Math.floor(50 / Math.max(1, new Set(filteredInfluencers.map(inf => inf.primaryGenre)).size)));
      const maxPerCategory = Math.max(2, Math.floor(50 / 5)); // 5 categories: Nano, Micro, Macro, Mega, Celebrity
      
      // First pass: Select diverse top performers
      for (const influencer of filteredInfluencers) {
        const genre = influencer.primaryGenre || 'General';
        const category = influencer.category || 'Micro';
        
        const genreCount = genreTracker.get(genre) || 0;
        const categoryCount = categoryTracker.get(category) || 0;
        
        // Ensure diversity across genres and follower categories
        if (genreCount < maxPerGenre && categoryCount < maxPerCategory && diversifiedList.length < 40) {
          diversifiedList.push(influencer);
          genreTracker.set(genre, genreCount + 1);
          categoryTracker.set(category, categoryCount + 1);
        }
      }
      
      // Second pass: Fill remaining slots with best remaining matches
      const remaining = filteredInfluencers.filter(inf => !diversifiedList.includes(inf));
      diversifiedList.push(...remaining.slice(0, 50 - diversifiedList.length));
      
      console.log(`🎨 Diversification complete: ${diversifiedList.length} results with genre distribution:`, 
        Array.from(genreTracker.entries()).map(([genre, count]) => `${genre}:${count}`).join(', ')
      );
      
      diversifiedResults = diversifiedList;
    }

    // Limit results
    const limitedResults = diversifiedResults.slice(0, 50);

    console.log(`✅ Vetted database search complete: ${limitedResults.length} results after enhanced filtering and diversification`);

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

/**
 * Calculate VIPS brand compatibility score
 * VIPS targets: casual dining, lifestyle, young adults (18-35), food enthusiasts
 */
function calculateVipsBrandCompatibility(influencer: VettedInfluencer): number {
  let score = 0;

  // Genre compatibility (40% of score) - Focus on lifestyle, food, entertainment
  const vipsCompatibleGenres = ['lifestyle', 'food', 'entertainment', 'fashion', 'casual', 'young', 'dining', 'restaurant'];
  const genreMatches = influencer.genres.filter(genre => 
    vipsCompatibleGenres.some(compatible => 
      genre.toLowerCase().includes(compatible) || compatible.includes(genre.toLowerCase())
    )
  );
  score += (genreMatches.length / Math.max(influencer.genres.length, 1)) * 40;

  // Follower count sweet spot for VIPS (30% of score) - Focus on micro to mid-tier influencers
  if (influencer.followerCount >= 25000 && influencer.followerCount <= 250000) {
    score += 30; // Perfect range for VIPS campaigns - authentic, relatable
  } else if (influencer.followerCount >= 10000 && influencer.followerCount < 25000) {
    score += 25; // Excellent for micro-influencer authenticity
  } else if (influencer.followerCount > 250000 && influencer.followerCount <= 500000) {
    score += 20; // Good for broader reach
  } else if (influencer.followerCount < 10000) {
    score += 15; // Nano-influencers for local/community focus
  }

  // Engagement rate (20% of score) - VIPS values high engagement for casual content
  if (influencer.engagementRate > 0.06) {
    score += 20; // Excellent engagement - perfect for casual, fun content
  } else if (influencer.engagementRate > 0.04) {
    score += 18; // Very good engagement
  } else if (influencer.engagementRate > 0.025) {
    score += 15; // Good engagement
  } else if (influencer.engagementRate > 0.015) {
    score += 10; // Acceptable engagement
  }

  // Category bonus (10% of score) - Prefer micro and macro influencers for VIPS
  if (influencer.category === 'Micro' || influencer.category === 'Macro') {
    score += 10; // Perfect categories for VIPS brand
  } else if (influencer.category === 'Nano') {
    score += 8; // Good for local campaigns
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Calculate Universal Brand Compatibility Score
 * Works with any brand by analyzing brand category and influencer fit
 */
function calculateUniversalBrandCompatibility(influencer: VettedInfluencer, brandName: string): number {
  let score = 0;
  const brand = brandName.toLowerCase();

  // Determine brand category and compatible genres
  let brandCategory = 'general';
  let compatibleGenres: string[] = [];
  let optimalFollowerRange = { min: 10000, max: 1000000 };
  let optimalEngagement = 0.03;

  // Tech/Gaming brands
  if (/\b(apple|samsung|google|microsoft|sony|nintendo|tesla|uber|meta|tiktok|instagram)\b/.test(brand)) {
    brandCategory = 'tech';
    compatibleGenres = ['tech', 'gaming', 'lifestyle', 'entertainment', 'innovation'];
    optimalFollowerRange = { min: 50000, max: 2000000 };
    optimalEngagement = 0.04;
  }
  // Fashion/Beauty brands
  else if (/\b(zara|h&m|mango|nike|adidas|chanel|dior|sephora|loreal|maybelline)\b/.test(brand)) {
    brandCategory = 'fashion';
    compatibleGenres = ['fashion', 'beauty', 'lifestyle', 'style', 'trends'];
    optimalFollowerRange = { min: 25000, max: 500000 };
    optimalEngagement = 0.05;
  }
  // Food/Restaurant brands
  else if (/\b(mcdonalds|kfc|starbucks|dominos|pizza|cocacola|pepsi|nestle|danone)\b/.test(brand)) {
    brandCategory = 'food';
    compatibleGenres = ['food', 'lifestyle', 'entertainment', 'casual', 'cooking'];
    optimalFollowerRange = { min: 15000, max: 300000 };
    optimalEngagement = 0.06;
  }
  // Travel/Tourism brands  
  else if (/\b(airbnb|booking|expedia|ryanair|vueling|renfe|iberia|trivago)\b/.test(brand)) {
    brandCategory = 'travel';
    compatibleGenres = ['travel', 'lifestyle', 'adventure', 'photography', 'culture'];
    optimalFollowerRange = { min: 20000, max: 800000 };
    optimalEngagement = 0.04;
  }
  // Automotive brands
  else if (/\b(bmw|mercedes|audi|volkswagen|seat|renault|toyota|ford)\b/.test(brand)) {
    brandCategory = 'automotive';
    compatibleGenres = ['automotive', 'lifestyle', 'tech', 'luxury', 'travel'];
    optimalFollowerRange = { min: 30000, max: 1000000 };
    optimalEngagement = 0.03;
  }
  // Financial/Banking brands
  else if (/\b(bbva|santander|caixabank|paypal|revolut|wise|n26)\b/.test(brand)) {
    brandCategory = 'finance';
    compatibleGenres = ['business', 'tech', 'lifestyle', 'education', 'professional'];
    optimalFollowerRange = { min: 50000, max: 500000 };
    optimalEngagement = 0.03;
  }
  // Default: Lifestyle brand approach
  else {
    brandCategory = 'lifestyle';
    compatibleGenres = ['lifestyle', 'entertainment', 'fashion', 'general'];
    optimalFollowerRange = { min: 20000, max: 400000 };
    optimalEngagement = 0.04;
  }

  // Genre compatibility (40% of score)
  const genreMatches = influencer.genres.filter(genre => 
    compatibleGenres.some(compatible => 
      genre.toLowerCase().includes(compatible) || compatible.includes(genre.toLowerCase())
    )
  );
  score += (genreMatches.length / Math.max(influencer.genres.length, 1)) * 40;

  // Follower count optimization (30% of score)
  if (influencer.followerCount >= optimalFollowerRange.min && influencer.followerCount <= optimalFollowerRange.max) {
    score += 30; // Perfect range for this brand category
  } else if (influencer.followerCount >= optimalFollowerRange.min * 0.5 && influencer.followerCount < optimalFollowerRange.min) {
    score += 20; // Good for micro-campaigns
  } else if (influencer.followerCount > optimalFollowerRange.max && influencer.followerCount <= optimalFollowerRange.max * 2) {
    score += 15; // Good for macro campaigns
  }

  // Engagement rate scoring (20% of score)
  if (influencer.engagementRate > optimalEngagement * 1.5) {
    score += 20; // Excellent engagement
  } else if (influencer.engagementRate > optimalEngagement) {
    score += 15; // Good engagement
  } else if (influencer.engagementRate > optimalEngagement * 0.7) {
    score += 10; // Acceptable engagement
  }

  // Category bonus (10% of score)
  if (influencer.category === 'Micro' || influencer.category === 'Macro') {
    score += 8; // Best categories for most brand campaigns
  } else if (influencer.category === 'Nano') {
    score += 6; // Good for local/niche campaigns
  } else if (influencer.category === 'Mega') {
    score += 5; // Good for mass reach campaigns
  }

  return Math.min(score, 100);
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
  // Detect actual gender and age instead of using hardcoded defaults
  const genderData = detectGenderWithConfidence(vetted);
  const ageData = estimateAge(vetted);
  
  // Convert gender to the expected format
  const detectedGender = genderData.gender === 'unknown' ? 'Other' : 
                        genderData.gender === 'male' ? 'Male' : 'Female';
  
  // Convert age to age range
  const ageRange = ageData.ageRange || '25-34'; // fallback to 25-34 if unknown
  
  return {
    influencer: {
      id: vetted.username,
      name: vetted.displayName,
      handle: vetted.username,
      platform: vetted.platform as 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Multi-Platform',
      followerCount: vetted.followerCount,
      engagementRate: vetted.engagementRate, // Already stored as decimal (0.0286 = 2.86%)
      ageRange: ageRange as '18-24' | '25-34' | '35-44' | '45-54' | '55+',
      gender: detectedGender as 'Male' | 'Female' | 'Other',
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

/**
 * Enhanced Multi-Layered Scoring Algorithm
 * Evaluates influencers across multiple dimensions for optimal ranking
 */
function calculateEnhancedScore(influencer: VettedInfluencer, params: ApifySearchParams, brandContext?: string): {
  totalScore: number;
  breakdown: {
    engagementScore: number;
    followerQualityScore: number;
    nicheRelevanceScore: number;
    brandCompatibilityScore: number;
    diversityScore: number;
    verificationScore: number;
    activityScore: number;
  };
} {
  const breakdown = {
    engagementScore: 0,
    followerQualityScore: 0,
    nicheRelevanceScore: 0,
    brandCompatibilityScore: 0,
    diversityScore: 0,
    verificationScore: 0,
    activityScore: 0
  };

  // 1. Engagement Quality Score (25% weight)
  const engagementRate = influencer.engagementRate || 0;
  if (engagementRate >= 0.06) breakdown.engagementScore = 100; // 6%+ excellent
  else if (engagementRate >= 0.03) breakdown.engagementScore = 80; // 3-6% good
  else if (engagementRate >= 0.015) breakdown.engagementScore = 60; // 1.5-3% average
  else if (engagementRate >= 0.01) breakdown.engagementScore = 40; // 1-1.5% below average
  else breakdown.engagementScore = 20; // <1% poor

  // 2. Follower Quality Score (20% weight) - Based on follower count category and engagement correlation
  const followers = influencer.followerCount || 0;
  let followerQualityBase = 0;
  
  // Sweet spot analysis: Micro/Macro influencers often have better engagement
  if (followers >= 10000 && followers <= 500000) {
    followerQualityBase = 90; // Sweet spot for authentic engagement
  } else if (followers >= 1000 && followers < 10000) {
    followerQualityBase = 75; // Nano - good but limited reach
  } else if (followers > 500000 && followers <= 2000000) {
    followerQualityBase = 70; // Macro - good reach but potentially lower engagement
  } else if (followers > 2000000) {
    followerQualityBase = 60; // Mega - high reach but often lower personal connection
  } else {
    followerQualityBase = 30; // Very small following
  }

  // Engagement-to-follower correlation bonus
  const expectedEngagement = getExpectedEngagementRate(followers);
  const engagementRatio = engagementRate / expectedEngagement;
  if (engagementRatio >= 1.2) followerQualityBase += 10; // 20% above expected
  else if (engagementRatio >= 1.0) followerQualityBase += 5; // At or above expected
  else if (engagementRatio < 0.5) followerQualityBase -= 15; // Significantly below expected

  breakdown.followerQualityScore = Math.min(100, Math.max(0, followerQualityBase));

  // 3. Niche Relevance Score (20% weight)
  const searchNiches = params.niches || [];
  if (searchNiches.length === 0) {
    breakdown.nicheRelevanceScore = 70; // Neutral if no specific niche requested
  } else {
    const relevanceScore = calculateNicheRelevanceScore(influencer.genres, searchNiches);
    breakdown.nicheRelevanceScore = relevanceScore;
  }

  // 4. Brand Compatibility Score (15% weight)
  const brandName = brandContext || params.brandName || '';
  if (brandName) {
    if (brandName.toLowerCase().includes('ikea')) {
      breakdown.brandCompatibilityScore = calculateIkeaBrandCompatibility(influencer);
    } else if (brandName.toLowerCase().includes('vips')) {
      breakdown.brandCompatibilityScore = calculateVipsBrandCompatibility(influencer);
    } else {
      breakdown.brandCompatibilityScore = calculateUniversalBrandCompatibility(influencer, brandName);
    }
  } else {
    breakdown.brandCompatibilityScore = 70; // Neutral if no brand specified
  }

  // 5. Diversity Score (10% weight) - Rewards unique/underrepresented profiles
  breakdown.diversityScore = calculateDiversityScore(influencer);

  // 6. Verification & Trust Score (5% weight)
  breakdown.verificationScore = influencer.isVerified ? 100 : 60;

  // 7. Activity Score (5% weight)
  breakdown.activityScore = influencer.isActive ? 100 : 30;

  // Calculate weighted total score
  const totalScore = 
    (breakdown.engagementScore * 0.25) +
    (breakdown.followerQualityScore * 0.20) +
    (breakdown.nicheRelevanceScore * 0.20) +
    (breakdown.brandCompatibilityScore * 0.15) +
    (breakdown.diversityScore * 0.10) +
    (breakdown.verificationScore * 0.05) +
    (breakdown.activityScore * 0.05);

  return {
    totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    breakdown
  };
}

/**
 * Get expected engagement rate based on follower count
 */
function getExpectedEngagementRate(followers: number): number {
  // Industry benchmarks for Instagram engagement rates by follower count
  if (followers < 1000) return 0.08; // 8% for very small accounts
  if (followers < 10000) return 0.06; // 6% for nano influencers
  if (followers < 100000) return 0.035; // 3.5% for micro influencers
  if (followers < 1000000) return 0.02; // 2% for macro influencers
  return 0.015; // 1.5% for mega influencers
}

/**
 * Calculate niche relevance score
 */
function calculateNicheRelevanceScore(influencerGenres: string[], searchNiches: string[]): number {
  if (!searchNiches || searchNiches.length === 0) return 70;
  
  let maxRelevance = 0;
  
  for (const searchNiche of searchNiches) {
    const searchNicheLower = searchNiche.toLowerCase();
    const mappedGenres = genreMapping[searchNicheLower] || [searchNicheLower];
    
    for (const influencerGenre of influencerGenres) {
      const influencerGenreLower = influencerGenre.toLowerCase();
      
      for (const mappedGenre of mappedGenres) {
        let relevanceScore = 0;
        
        // Exact match
        if (influencerGenreLower === mappedGenre) {
          relevanceScore = 100;
        }
        // Contains match
        else if (influencerGenreLower.includes(mappedGenre) || mappedGenre.includes(influencerGenreLower)) {
          relevanceScore = 85;
        }
        // Partial match with common words
        else if (hasCommonWords(influencerGenreLower, mappedGenre)) {
          relevanceScore = 70;
        }
        
        maxRelevance = Math.max(maxRelevance, relevanceScore);
      }
    }
  }
  
  return maxRelevance || 30; // Minimum score for no match
}

/**
 * Calculate diversity score to reward unique profiles
 */
function calculateDiversityScore(influencer: VettedInfluencer): number {
  let diversityScore = 50; // Base score
  
  // Reward less common genres
  const uncommonGenres = ['art', 'education', 'tech', 'business', 'automotive'];
  const hasUncommonGenre = influencer.genres.some(genre => 
    uncommonGenres.some(uncommon => genre.toLowerCase().includes(uncommon))
  );
  if (hasUncommonGenre) diversityScore += 20;
  
  // Reward mid-range follower counts (often more authentic)
  const followers = influencer.followerCount || 0;
  if (followers >= 50000 && followers <= 300000) diversityScore += 15;
  
  // Reward high engagement with moderate following (authentic audience)
  const engagementRate = influencer.engagementRate || 0;
  if (engagementRate >= 0.04 && followers < 200000) diversityScore += 15;
  
  return Math.min(100, diversityScore);
}

/**
 * Check if two strings have common meaningful words
 */
function hasCommonWords(str1: string, str2: string): boolean {
  const words1 = str1.split(/[\s,._-]+/).filter(w => w.length > 2);
  const words2 = str2.split(/[\s,._-]+/).filter(w => w.length > 2);
  
  return words1.some(w1 => words2.some(w2 => w1.includes(w2) || w2.includes(w1)));
}

/**
 * Advanced Deduplication Logic
 * Prevents repetitive profile returns using multiple similarity detection methods
 */
function deduplicateInfluencers(influencers: VettedInfluencer[]): VettedInfluencer[] {
  const deduplicated: VettedInfluencer[] = [];
  const seenUsernames = new Set<string>();
  const seenDisplayNames = new Set<string>();
  const followerRanges = new Map<string, number>(); // Track follower range distribution
  
  console.log(`🔍 Starting deduplication for ${influencers.length} influencers...`);
  
  for (const influencer of influencers) {
    let shouldInclude = true;
    const reasons: string[] = [];
    
    // 1. Exact username match (case-insensitive)
    const usernameLower = influencer.username.toLowerCase();
    if (seenUsernames.has(usernameLower)) {
      shouldInclude = false;
      reasons.push('duplicate_username');
    }
    
    // 2. Exact display name match (case-insensitive)
    const displayNameLower = (influencer.displayName || '').toLowerCase();
    if (displayNameLower && seenDisplayNames.has(displayNameLower)) {
      shouldInclude = false;
      reasons.push('duplicate_display_name');
    }
    
    // 3. Similar username detection (70%+ similarity)
    if (shouldInclude) {
      const seenUsernamesArray = Array.from(seenUsernames);
      for (const seenUsername of seenUsernamesArray) {
        const similarity = calculateStringSimilarity(usernameLower, seenUsername);
        if (similarity >= 0.7) {
          shouldInclude = false;
          reasons.push(`similar_username_${Math.round(similarity * 100)}%`);
          break;
        }
      }
    }
    
    // 4. Similar profile pattern detection
    if (shouldInclude) {
      const isVeryProfileDuplicate = deduplicated.some(existing => 
        areSimilarProfiles(influencer, existing)
      );
      if (isVeryProfileDuplicate) {
        shouldInclude = false;
        reasons.push('similar_profile_pattern');
      }
    }
    
    // 5. Follower range balance (prevent too many in same range)
    if (shouldInclude) {
      const followerRange = getFollowerRange(influencer.followerCount);
      const currentCount = followerRanges.get(followerRange) || 0;
      const maxPerRange = 8; // Max 8 influencers per follower range
      
      if (currentCount >= maxPerRange) {
        // Only allow if this influencer has significantly better engagement
        const avgEngagementInRange = calculateAverageEngagementInRange(deduplicated, followerRange);
        if (influencer.engagementRate < avgEngagementInRange * 1.2) {
          shouldInclude = false;
          reasons.push(`follower_range_saturated_${followerRange}`);
        }
      }
    }
    
    if (shouldInclude) {
      deduplicated.push(influencer);
      seenUsernames.add(usernameLower);
      if (displayNameLower) seenDisplayNames.add(displayNameLower);
      
      const followerRange = getFollowerRange(influencer.followerCount);
      followerRanges.set(followerRange, (followerRanges.get(followerRange) || 0) + 1);
    } else {
      console.log(`❌ Filtered out ${influencer.username}: ${reasons.join(', ')}`);
    }
  }
  
  console.log(`✅ Deduplication complete: ${deduplicated.length}/${influencers.length} influencers kept`);
  console.log(`📊 Follower range distribution:`, Array.from(followerRanges.entries()));
  
  return deduplicated;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (matrix[str2.length][str1.length] / maxLength);
}

/**
 * Check if two profiles are very similar (likely duplicates/similar accounts)
 */
function areSimilarProfiles(profile1: VettedInfluencer, profile2: VettedInfluencer): boolean {
  // Same follower count (within 5%)
  const followerDiff = Math.abs(profile1.followerCount - profile2.followerCount);
  const avgFollowers = (profile1.followerCount + profile2.followerCount) / 2;
  const followerSimilarity = followerDiff / avgFollowers < 0.05;
  
  // Similar engagement (within 0.5%)
  const engagementDiff = Math.abs(profile1.engagementRate - profile2.engagementRate);
  const engagementSimilarity = engagementDiff < 0.005;
  
  // Same primary genre
  const genreSimilarity = profile1.primaryGenre === profile2.primaryGenre;
  
  // Same category
  const categorySimilarity = profile1.category === profile2.category;
  
  // If 3+ factors match, likely very similar profiles
  const matchCount = [followerSimilarity, engagementSimilarity, genreSimilarity, categorySimilarity]
    .filter(Boolean).length;
  
  return matchCount >= 3;
}

/**
 * Get follower count range for balancing
 */
function getFollowerRange(followerCount: number): string {
  if (followerCount < 10000) return 'nano';
  if (followerCount < 100000) return 'micro';
  if (followerCount < 500000) return 'macro';
  if (followerCount < 2000000) return 'mega';
  return 'celebrity';
}

/**
 * Calculate average engagement for influencers in a specific follower range
 */
function calculateAverageEngagementInRange(influencers: VettedInfluencer[], range: string): number {
  const inRange = influencers.filter(inf => getFollowerRange(inf.followerCount) === range);
  if (inRange.length === 0) return 0;
  
  const totalEngagement = inRange.reduce((sum, inf) => sum + inf.engagementRate, 0);
  return totalEngagement / inRange.length;
}

/**
 * Enhanced Gender/Age Validation System
 * Provides stricter demographic filtering with age estimation
 */

interface DemographicProfile {
  gender: 'male' | 'female' | 'unknown';
  genderConfidence: number; // 0-100
  estimatedAge?: number;
  ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  ageConfidence: number; // 0-100
  demographicScore: number; // Overall demographic accuracy score
}

/**
 * Enhanced gender detection with confidence scoring
 */
function detectGenderWithConfidence(influencer: VettedInfluencer): { gender: 'male' | 'female' | 'unknown', confidence: number } {
  let detectedGender: 'male' | 'female' | 'unknown' = 'unknown';
  let confidence = 0;
  
  // Check username first
  const usernameGender = detectGenderFromUsername(influencer.username);
  let usernameConfidence = 0;
  
  if (usernameGender !== 'unknown') {
    detectedGender = usernameGender;
    usernameConfidence = 70; // Base confidence for username detection
  }
  
  // Check display name for additional confidence
  if (influencer.displayName) {
    const displayNameGender = detectGenderFromUsername(influencer.displayName);
    if (displayNameGender !== 'unknown') {
      if (displayNameGender === detectedGender) {
        usernameConfidence += 20; // Boost confidence if both match
      } else if (detectedGender === 'unknown') {
        detectedGender = displayNameGender;
        usernameConfidence = 60; // Lower confidence for display name only
      }
    }
  }
  
  // Genre-based gender inference
  const genreGenderInfo = inferGenderFromGenres(influencer.genres);
  if (genreGenderInfo.gender !== 'unknown') {
    if (detectedGender === 'unknown') {
      detectedGender = genreGenderInfo.gender;
      confidence = genreGenderInfo.confidence;
    } else if (detectedGender === genreGenderInfo.gender) {
      confidence = Math.min(95, usernameConfidence + genreGenderInfo.confidence * 0.3);
    } else {
      // Conflict between name and genre - reduce confidence
      confidence = Math.max(40, usernameConfidence - 10);
    }
  } else {
    confidence = usernameConfidence;
  }
  
  return { gender: detectedGender, confidence };
}

/**
 * Infer gender from content genres/niches
 */
function inferGenderFromGenres(genres: string[]): { gender: 'male' | 'female' | 'unknown', confidence: number } {
  if (!genres || genres.length === 0) return { gender: 'unknown', confidence: 0 };
  
  const femaleSkewedGenres = [
    { keywords: ['beauty', 'makeup', 'skincare'], weight: 25 },
    { keywords: ['fashion', 'style', 'clothing'], weight: 20 },
    { keywords: ['lifestyle', 'home', 'decor', 'interior'], weight: 15 },
    { keywords: ['parenting', 'family', 'baby', 'children'], weight: 20 },
    { keywords: ['wellness', 'selfcare', 'yoga'], weight: 15 },
    { keywords: ['food', 'cooking', 'recipe', 'baking'], weight: 10 }
  ];
  
  const maleSkewedGenres = [
    { keywords: ['sports', 'fitness', 'gym', 'training'], weight: 20 },
    { keywords: ['tech', 'technology', 'gaming', 'esports'], weight: 25 },
    { keywords: ['business', 'entrepreneur', 'finance'], weight: 20 },
    { keywords: ['automotive', 'cars', 'racing'], weight: 30 },
    { keywords: ['music', 'dj', 'producer'], weight: 15 }
  ];
  
  let femaleScore = 0;
  let maleScore = 0;
  
  const genreText = genres.join(' ').toLowerCase();
  
  // Calculate female bias
  for (const category of femaleSkewedGenres) {
    for (const keyword of category.keywords) {
      if (genreText.includes(keyword)) {
        femaleScore += category.weight;
        break; // Only count each category once
      }
    }
  }
  
  // Calculate male bias
  for (const category of maleSkewedGenres) {
    for (const keyword of category.keywords) {
      if (genreText.includes(keyword)) {
        maleScore += category.weight;
        break; // Only count each category once
      }
    }
  }
  
  const totalScore = femaleScore + maleScore;
  if (totalScore === 0) return { gender: 'unknown', confidence: 0 };
  
  const confidence = Math.min(60, totalScore); // Max 60% confidence from genres alone
  
  if (femaleScore > maleScore * 1.5) {
    return { gender: 'female', confidence };
  } else if (maleScore > femaleScore * 1.5) {
    return { gender: 'male', confidence };
  }
  
  return { gender: 'unknown', confidence: 0 };
}

/**
 * Estimate age based on follower count, engagement patterns, and content style
 */
function estimateAge(influencer: VettedInfluencer): { estimatedAge?: number, ageRange?: string, confidence: number } {
  let ageIndicators: number[] = [];
  let confidence = 0;
  
  // Follower count patterns (younger users tend to have different follower patterns)
  const followers = influencer.followerCount || 0;
  if (followers < 50000) {
    ageIndicators.push(22); // Younger creators often start smaller
    confidence += 10;
  } else if (followers > 500000) {
    ageIndicators.push(28); // Established creators tend to be older
    confidence += 15;
  }
  
  // Engagement rate patterns (younger audiences often more engaged)
  const engagement = influencer.engagementRate || 0;
  if (engagement > 0.05) {
    ageIndicators.push(24); // High engagement often correlates with younger audience
    confidence += 10;
  } else if (engagement < 0.02) {
    ageIndicators.push(32); // Lower engagement might indicate older, more professional content
    confidence += 5;
  }
  
  // Genre-based age estimation
  const genreAgeInfo = inferAgeFromGenres(influencer.genres);
  if (genreAgeInfo.estimatedAge) {
    ageIndicators.push(genreAgeInfo.estimatedAge);
    confidence += genreAgeInfo.confidence;
  }
  
  if (ageIndicators.length === 0) {
    return { confidence: 0 };
  }
  
  // Calculate weighted average
  const estimatedAge = Math.round(ageIndicators.reduce((sum, age) => sum + age, 0) / ageIndicators.length);
  
  // Determine age range
  let ageRange: string;
  if (estimatedAge < 25) ageRange = '18-24';
  else if (estimatedAge < 35) ageRange = '25-34';
  else if (estimatedAge < 45) ageRange = '35-44';
  else if (estimatedAge < 55) ageRange = '45-54';
  else ageRange = '55+';
  
  return {
    estimatedAge,
    ageRange,
    confidence: Math.min(70, confidence) // Cap confidence at 70% for age estimation
  };
}

/**
 * Infer age from content genres
 */
function inferAgeFromGenres(genres: string[]): { estimatedAge?: number, confidence: number } {
  if (!genres || genres.length === 0) return { confidence: 0 };
  
  const ageGenreMapping = [
    { keywords: ['gaming', 'esports', 'memes', 'tiktok'], ageRange: 20, confidence: 15 },
    { keywords: ['university', 'college', 'student', 'party'], ageRange: 21, confidence: 20 },
    { keywords: ['fashion', 'beauty', 'lifestyle', 'travel'], ageRange: 26, confidence: 10 },
    { keywords: ['business', 'entrepreneur', 'finance', 'career'], ageRange: 30, confidence: 15 },
    { keywords: ['parenting', 'family', 'kids', 'baby'], ageRange: 32, confidence: 25 },
    { keywords: ['home', 'decor', 'interior', 'diy'], ageRange: 35, confidence: 15 },
    { keywords: ['health', 'wellness', 'meditation', 'mindfulness'], ageRange: 38, confidence: 10 }
  ];
  
  const genreText = genres.join(' ').toLowerCase();
  let totalAge = 0;
  let totalConfidence = 0;
  let matchCount = 0;
  
  for (const mapping of ageGenreMapping) {
    for (const keyword of mapping.keywords) {
      if (genreText.includes(keyword)) {
        totalAge += mapping.ageRange;
        totalConfidence += mapping.confidence;
        matchCount++;
        break; // Only count each mapping once
      }
    }
  }
  
  if (matchCount === 0) return { confidence: 0 };
  
  return {
    estimatedAge: Math.round(totalAge / matchCount),
    confidence: Math.min(40, totalConfidence / matchCount) // Modest confidence for genre-based age
  };
}

/**
 * Enhanced demographic filtering with strict validation
 */
function passesStrictDemographicFilter(influencer: VettedInfluencer, params: ApifySearchParams): {
  passes: boolean;
  demographics: DemographicProfile;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Gender validation
  const genderInfo = detectGenderWithConfidence(influencer);
  const targetGender = params.gender;
  
  let genderPasses = true;
  if (targetGender && targetGender !== 'any') {
    if (genderInfo.gender === 'unknown' && genderInfo.confidence < 30) {
      genderPasses = false;
      reasons.push(`gender_unknown_low_confidence_${genderInfo.confidence}%`);
    } else if (genderInfo.gender !== 'unknown' && genderInfo.gender !== targetGender.toLowerCase()) {
      genderPasses = false;
      reasons.push(`gender_mismatch_${genderInfo.gender}_vs_${targetGender}`);
    } else if (genderInfo.confidence < 50) {
      genderPasses = false;
      reasons.push(`gender_low_confidence_${genderInfo.confidence}%`);
    }
  }
  
  // Age validation using ageRange parameter
  const ageInfo = estimateAge(influencer);
  const targetAgeRange = params.ageRange;
  
  let agePasses = true;
  if (targetAgeRange && ageInfo.estimatedAge) {
    const ageRangeMatch = isAgeInTargetRange(ageInfo.estimatedAge, targetAgeRange);
    if (!ageRangeMatch) {
      agePasses = false;
      reasons.push(`age_outside_target_range_${ageInfo.estimatedAge}_not_in_${targetAgeRange}`);
    } else if (ageInfo.confidence < 25) {
      // Allow but flag low confidence
      reasons.push(`age_low_confidence_${ageInfo.confidence}%`);
    }
  }
  
  // Calculate overall demographic score
  const demographicScore = (genderInfo.confidence * 0.6 + ageInfo.confidence * 0.4);
  
  const demographics: DemographicProfile = {
    gender: genderInfo.gender,
    genderConfidence: genderInfo.confidence,
    estimatedAge: ageInfo.estimatedAge,
    ageRange: ageInfo.ageRange as any,
    ageConfidence: ageInfo.confidence,
    demographicScore
  };
  
  return {
    passes: genderPasses && agePasses,
    demographics,
    reasons
  };
}

/**
 * Check if an estimated age falls within a target age range
 */
function isAgeInTargetRange(age: number, ageRange: string): boolean {
  switch (ageRange) {
    case '18-24':
      return age >= 18 && age <= 24;
    case '25-34':
      return age >= 25 && age <= 34;
    case '35-44':
      return age >= 35 && age <= 44;
    case '45-54':
      return age >= 45 && age <= 54;
    case '55+':
      return age >= 55;
    default:
      return true; // If unknown range, allow
  }
} 

/**
 * Engagement Quality Analysis with Fake Follower Detection
 * Analyzes engagement patterns to detect potential fake followers and low-quality audiences
 */

interface EngagementQualityProfile {
  overallScore: number; // 0-100
  authenticity: {
    score: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
  };
  consistency: {
    score: number; // 0-100
    variance: number; // Engagement variance indicator
  };
  audienceQuality: {
    score: number; // 0-100
    estimatedRealFollowers: number;
    fakeFollowerPercentage: number;
  };
}

/**
 * Analyze engagement quality and detect potential fake followers
 */
function analyzeEngagementQuality(influencer: VettedInfluencer): EngagementQualityProfile {
  const followers = influencer.followerCount || 0;
  const engagementRate = influencer.engagementRate || 0;
  const category = influencer.category;
  
  // 1. Authenticity Analysis
  const authenticity = analyzeEngagementAuthenticity(followers, engagementRate, category);
  
  // 2. Consistency Analysis
  const consistency = analyzeEngagementConsistency(followers, engagementRate);
  
  // 3. Audience Quality Analysis
  const audienceQuality = analyzeAudienceQuality(followers, engagementRate, category);
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    authenticity.score * 0.4 +
    consistency.score * 0.3 +
    audienceQuality.score * 0.3
  );
  
  return {
    overallScore,
    authenticity,
    consistency,
    audienceQuality
  };
}

/**
 * Analyze engagement authenticity based on industry benchmarks
 */
function analyzeEngagementAuthenticity(followers: number, engagementRate: number, category: string): {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
} {
  const flags: string[] = [];
  let score = 100;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Get expected engagement rate for follower count
  const expectedEngagement = getExpectedEngagementRate(followers);
  const engagementRatio = engagementRate / expectedEngagement;
  
  // Red flags for fake engagement
  if (engagementRatio > 3.0) {
    flags.push('suspiciously_high_engagement');
    score -= 30;
    riskLevel = 'high';
  } else if (engagementRatio > 2.0) {
    flags.push('unusually_high_engagement');
    score -= 15;
    riskLevel = 'medium';
  }
  
  if (engagementRatio < 0.3) {
    flags.push('very_low_engagement');
    score -= 25;
    riskLevel = 'high';
  } else if (engagementRatio < 0.5) {
    flags.push('below_average_engagement');
    score -= 10;
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  // Specific red flags for large accounts with unusually high engagement
  if (followers > 500000 && engagementRate > 0.05) {
    flags.push('mega_account_high_engagement_anomaly');
    score -= 20;
    riskLevel = 'high';
  }
  
  // Very small accounts with professional-level engagement are suspicious
  if (followers < 5000 && engagementRate > 0.08) {
    flags.push('small_account_professional_engagement');
    score -= 15;
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  // Category-specific analysis
  if (category === 'Celebrity' && engagementRate > 0.03) {
    flags.push('celebrity_high_engagement_anomaly');
    score -= 10;
  }
  
  return {
    score: Math.max(0, score),
    riskLevel,
    flags
  };
}

/**
 * Analyze engagement consistency patterns
 */
function analyzeEngagementConsistency(followers: number, engagementRate: number): {
  score: number;
  variance: number;
} {
  let score = 80; // Base score for consistency
  
  // Calculate expected variance based on follower count
  // Larger accounts typically have more consistent engagement
  const expectedVariance = calculateExpectedEngagementVariance(followers);
  
  // For now, we'll use engagement rate as a proxy for consistency
  // In a full implementation, we'd analyze historical engagement data
  
  // Accounts with very round numbers might be suspicious
  if (followers % 10000 === 0 && followers > 50000) {
    score -= 15; // Round follower counts are often purchased
  }
  
  if (followers % 1000 === 0 && followers > 10000) {
    score -= 10; // Moderately suspicious
  }
  
  // Engagement rates that are too "perfect" are suspicious
  const engagementDecimal = engagementRate % 0.01;
  if (engagementDecimal === 0 && engagementRate > 0.01) {
    score -= 10; // Perfect percentages are often fake
  }
  
  return {
    score: Math.max(0, score),
    variance: expectedVariance
  };
}

/**
 * Analyze audience quality and estimate real followers
 */
function analyzeAudienceQuality(followers: number, engagementRate: number, category: string): {
  score: number;
  estimatedRealFollowers: number;
  fakeFollowerPercentage: number;
} {
  let qualityScore = 90; // Start optimistic
  let fakeFollowerPercentage = 0;
  
  // Calculate baseline fake follower percentage based on engagement patterns
  const expectedEngagement = getExpectedEngagementRate(followers);
  const engagementRatio = engagementRate / expectedEngagement;
  
  // Estimate fake followers based on engagement deviation
  if (engagementRatio < 0.5) {
    // Low engagement suggests many inactive/fake followers
    fakeFollowerPercentage = Math.min(50, (0.5 - engagementRatio) * 80);
    qualityScore -= fakeFollowerPercentage * 0.8;
  } else if (engagementRatio > 2.0) {
    // Artificially high engagement suggests bot engagement
    fakeFollowerPercentage = Math.min(30, (engagementRatio - 2.0) * 20);
    qualityScore -= fakeFollowerPercentage * 1.2;
  }
  
  // Category-specific adjustments
  if (category === 'Mega' || category === 'Celebrity') {
    // Large accounts naturally have some inactive followers
    fakeFollowerPercentage = Math.max(5, fakeFollowerPercentage);
    qualityScore = Math.max(qualityScore - 5, 0);
  }
  
  // Calculate estimated real followers
  const estimatedRealFollowers = Math.round(followers * (1 - fakeFollowerPercentage / 100));
  
  return {
    score: Math.max(0, Math.round(qualityScore)),
    estimatedRealFollowers,
    fakeFollowerPercentage: Math.round(fakeFollowerPercentage * 10) / 10 // Round to 1 decimal
  };
}

/**
 * Calculate expected engagement variance based on follower count
 */
function calculateExpectedEngagementVariance(followers: number): number {
  // Larger accounts typically have lower variance
  if (followers < 10000) return 0.3; // High variance expected
  if (followers < 100000) return 0.2; // Medium variance
  if (followers < 1000000) return 0.15; // Lower variance
  return 0.1; // Very low variance for mega accounts
}

/**
 * Filter influencers based on engagement quality thresholds
 */
function passesEngagementQualityFilter(influencer: VettedInfluencer, minQualityScore: number = 70): {
  passes: boolean;
  qualityProfile: EngagementQualityProfile;
  reasons: string[];
} {
  const qualityProfile = analyzeEngagementQuality(influencer);
  const reasons: string[] = [];
  
  let passes = true;
  
  // Overall quality check
  if (qualityProfile.overallScore < minQualityScore) {
    passes = false;
    reasons.push(`overall_quality_low_${qualityProfile.overallScore}_below_${minQualityScore}`);
  }
  
  // High risk authenticity check
  if (qualityProfile.authenticity.riskLevel === 'high') {
    passes = false;
    reasons.push(`high_authenticity_risk_${qualityProfile.authenticity.flags.join('|')}`);
  }
  
  // High fake follower percentage
  if (qualityProfile.audienceQuality.fakeFollowerPercentage > 30) {
    passes = false;
    reasons.push(`high_fake_followers_${qualityProfile.audienceQuality.fakeFollowerPercentage}%`);
  }
  
  // Medium risk with multiple flags
  if (qualityProfile.authenticity.riskLevel === 'medium' && qualityProfile.authenticity.flags.length >= 2) {
    passes = false;
    reasons.push(`medium_risk_multiple_flags_${qualityProfile.authenticity.flags.length}`);
  }
  
  return {
    passes,
    qualityProfile,
    reasons
  };
}

/**
 * Enhanced Brand Compatibility System
 * Sophisticated brand-influencer matching with industry intelligence
 */

interface BrandCompatibilityProfile {
  overallScore: number; // 0-100
  categoryMatch: {
    score: number;
    matchType: 'perfect' | 'strong' | 'moderate' | 'weak' | 'none';
    reasons: string[];
  };
  audienceAlignment: {
    score: number;
    targetDemographic: string;
    influencerAudience: string;
    alignment: number; // 0-1
  };
  contentStyle: {
    score: number;
    brandStyle: string;
    influencerStyle: string;
    compatibility: number; // 0-1
  };
  riskAssessment: {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

/**
 * Enhanced brand compatibility calculation with industry intelligence
 */
function calculateEnhancedBrandCompatibility(influencer: VettedInfluencer, brandName: string): BrandCompatibilityProfile {
  const brandIntelligence = analyzeBrandIntelligence(brandName);
  
  // 1. Category Match Analysis
  const categoryMatch = analyzeCategoryMatch(influencer, brandIntelligence);
  
  // 2. Audience Alignment Analysis
  const audienceAlignment = analyzeAudienceAlignment(influencer, brandIntelligence);
  
  // 3. Content Style Analysis
  const contentStyle = analyzeContentStyleCompatibility(influencer, brandIntelligence);
  
  // 4. Risk Assessment
  const riskAssessment = assessBrandRisk(influencer, brandIntelligence);
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    categoryMatch.score * 0.35 +
    audienceAlignment.score * 0.25 +
    contentStyle.score * 0.25 +
    riskAssessment.score * 0.15
  );
  
  return {
    overallScore,
    categoryMatch,
    audienceAlignment,
    contentStyle,
    riskAssessment
  };
}

/**
 * Analyze brand intelligence and characteristics
 */
function analyzeBrandIntelligence(brandName: string): {
  category: string;
  industry: string;
  targetDemographic: {
    age: string;
    gender: string;
    lifestyle: string[];
  };
  brandPersonality: string[];
  contentPreferences: string[];
  riskTolerance: 'low' | 'medium' | 'high';
} {
  const brand = brandName.toLowerCase();
  
  // IKEA Brand Intelligence
  if (brand.includes('ikea')) {
    return {
      category: 'home_lifestyle',
      industry: 'furniture_retail',
      targetDemographic: {
        age: '25-45',
        gender: 'any',
        lifestyle: ['home_decor', 'diy', 'minimalist', 'functional']
      },
      brandPersonality: ['accessible', 'functional', 'creative', 'sustainable'],
      contentPreferences: ['room_makeovers', 'diy_projects', 'organization', 'lifestyle'],
      riskTolerance: 'medium'
    };
  }
  
  // VIPS Brand Intelligence
  if (brand.includes('vips')) {
    return {
      category: 'food_beverage',
      industry: 'casual_dining',
      targetDemographic: {
        age: '18-35',
        gender: 'any',
        lifestyle: ['casual_dining', 'social', 'trendy', 'affordable']
      },
      brandPersonality: ['fun', 'casual', 'social', 'affordable'],
      contentPreferences: ['food_lifestyle', 'social_dining', 'trendy_spots'],
      riskTolerance: 'high'
    };
  }
  
  // Fashion/Beauty Brand Intelligence
  if (brand.includes('zara') || brand.includes('h&m') || brand.includes('mango')) {
    return {
      category: 'fashion',
      industry: 'fast_fashion',
      targetDemographic: {
        age: '18-35',
        gender: 'any',
        lifestyle: ['fashion_forward', 'trendy', 'affordable', 'style_conscious']
      },
      brandPersonality: ['trendy', 'accessible', 'fast', 'diverse'],
      contentPreferences: ['outfit_posts', 'style_guides', 'fashion_trends'],
      riskTolerance: 'medium'
    };
  }
  
  // Tech Brand Intelligence
  if (brand.includes('apple') || brand.includes('samsung') || brand.includes('tech')) {
    return {
      category: 'technology',
      industry: 'consumer_electronics',
      targetDemographic: {
        age: '20-45',
        gender: 'any',
        lifestyle: ['tech_savvy', 'innovative', 'professional']
      },
      brandPersonality: ['innovative', 'premium', 'user_friendly', 'cutting_edge'],
      contentPreferences: ['tech_reviews', 'lifestyle_tech', 'productivity'],
      riskTolerance: 'low'
    };
  }
  
  // Generic Brand Intelligence
  return {
    category: 'general',
    industry: 'unknown',
    targetDemographic: {
      age: '25-35',
      gender: 'any',
      lifestyle: ['general_lifestyle']
    },
    brandPersonality: ['authentic', 'relatable'],
    contentPreferences: ['lifestyle', 'general'],
    riskTolerance: 'medium'
  };
}

/**
 * Analyze category match between influencer and brand
 */
function analyzeCategoryMatch(influencer: VettedInfluencer, brandIntelligence: any): {
  score: number;
  matchType: 'perfect' | 'strong' | 'moderate' | 'weak' | 'none';
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;
  let matchType: 'perfect' | 'strong' | 'moderate' | 'weak' | 'none' = 'none';
  
  const influencerGenres = influencer.genres.map(g => g.toLowerCase());
  const brandCategory = brandIntelligence.category;
  
  // Perfect matches
  if (brandCategory === 'home_lifestyle' && influencerGenres.some(g => 
    ['home', 'lifestyle', 'decor', 'interior', 'diy'].some(keyword => g.includes(keyword))
  )) {
    score = 95;
    matchType = 'perfect';
    reasons.push('perfect_home_lifestyle_match');
  } else if (brandCategory === 'fashion' && influencerGenres.some(g => 
    ['fashion', 'style', 'clothing', 'beauty'].some(keyword => g.includes(keyword))
  )) {
    score = 95;
    matchType = 'perfect';
    reasons.push('perfect_fashion_match');
  } else if (brandCategory === 'food_beverage' && influencerGenres.some(g => 
    ['food', 'cooking', 'lifestyle', 'dining'].some(keyword => g.includes(keyword))
  )) {
    score = 90;
    matchType = 'strong';
    reasons.push('strong_food_lifestyle_match');
  }
  
  // Strong matches
  else if (influencerGenres.some(g => g.includes('lifestyle')) && 
    ['home_lifestyle', 'fashion', 'food_beverage'].includes(brandCategory)) {
    score = 80;
    matchType = 'strong';
    reasons.push('lifestyle_versatility_match');
  }
  
  // Moderate matches
  else if (brandCategory === 'technology' && influencerGenres.some(g => 
    ['tech', 'business', 'lifestyle'].some(keyword => g.includes(keyword))
  )) {
    score = 70;
    matchType = 'moderate';
    reasons.push('moderate_tech_match');
  }
  
  // Weak matches
  else if (influencerGenres.length > 0) {
    score = 50;
    matchType = 'weak';
    reasons.push('generic_genre_match');
  }
  
  return { score, matchType, reasons };
}

/**
 * Analyze audience alignment between influencer and brand target
 */
function analyzeAudienceAlignment(influencer: VettedInfluencer, brandIntelligence: any): {
  score: number;
  targetDemographic: string;
  influencerAudience: string;
  alignment: number;
} {
  const followers = influencer.followerCount || 0;
  const category = influencer.category;
  
  // Estimate influencer audience based on follower count and engagement
  let influencerAudience = 'general';
  if (followers < 50000) influencerAudience = 'niche_engaged';
  else if (followers < 200000) influencerAudience = 'micro_community';
  else if (followers < 1000000) influencerAudience = 'broad_reach';
  else influencerAudience = 'mass_market';
  
  const targetDemo = brandIntelligence.targetDemographic;
  let alignment = 0.7; // Base alignment
  let score = 70;
  
  // Adjust based on brand preferences
  if (brandIntelligence.category === 'home_lifestyle') {
    if (followers >= 50000 && followers <= 500000) {
      alignment = 0.9; // Sweet spot for home brands
      score = 90;
    }
  } else if (brandIntelligence.category === 'food_beverage') {
    if (followers >= 10000 && followers <= 200000) {
      alignment = 0.85; // Local influence important for food
      score = 85;
    }
  } else if (brandIntelligence.category === 'fashion') {
    if (followers >= 100000) {
      alignment = 0.8; // Fashion benefits from broader reach
      score = 80;
    }
  }
  
  return {
    score,
    targetDemographic: `${targetDemo.age} ${targetDemo.gender} ${targetDemo.lifestyle.join(',')}`,
    influencerAudience,
    alignment
  };
}

/**
 * Analyze content style compatibility
 */
function analyzeContentStyleCompatibility(influencer: VettedInfluencer, brandIntelligence: any): {
  score: number;
  brandStyle: string;
  influencerStyle: string;
  compatibility: number;
} {
  const engagementRate = influencer.engagementRate || 0;
  const verified = influencer.isVerified;
  
  // Estimate influencer content style
  let influencerStyle = 'casual';
  if (verified && engagementRate > 0.03) influencerStyle = 'professional_engaging';
  else if (verified) influencerStyle = 'professional';
  else if (engagementRate > 0.05) influencerStyle = 'highly_engaging';
  else if (engagementRate > 0.02) influencerStyle = 'moderately_engaging';
  
  const brandStyle = brandIntelligence.brandPersonality.join('_');
  let compatibility = 0.7;
  let score = 70;
  
  // Style compatibility matrix
  if (brandIntelligence.riskTolerance === 'low' && influencerStyle.includes('professional')) {
    compatibility = 0.9;
    score = 90;
  } else if (brandIntelligence.riskTolerance === 'high' && influencerStyle.includes('engaging')) {
    compatibility = 0.85;
    score = 85;
  } else if (brandIntelligence.riskTolerance === 'medium') {
    compatibility = 0.8;
    score = 80;
  }
  
  return {
    score,
    brandStyle,
    influencerStyle,
    compatibility
  };
}

/**
 * Assess brand risk factors
 */
function assessBrandRisk(influencer: VettedInfluencer, brandIntelligence: any): {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
} {
  const factors: string[] = [];
  let score = 90; // Start with low risk
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Engagement quality risk
  const engagementQuality = analyzeEngagementQuality(influencer);
  if (engagementQuality.authenticity.riskLevel === 'high') {
    score -= 30;
    riskLevel = 'high';
    factors.push('high_engagement_risk');
  } else if (engagementQuality.authenticity.riskLevel === 'medium') {
    score -= 15;
    if (riskLevel === 'low') riskLevel = 'medium';
    factors.push('medium_engagement_risk');
  }
  
  // Fake follower risk
  if (engagementQuality.audienceQuality.fakeFollowerPercentage > 20) {
    score -= 20;
    riskLevel = 'high';
    factors.push(`high_fake_followers_${engagementQuality.audienceQuality.fakeFollowerPercentage}%`);
  }
  
  // Verification status
  if (!influencer.isVerified && influencer.followerCount > 100000) {
    score -= 10;
    factors.push('large_unverified_account');
  }
  
  // Activity status
  if (!influencer.isActive) {
    score -= 25;
    riskLevel = 'high';
    factors.push('inactive_account');
  }
  
  return {
    score: Math.max(0, score),
    riskLevel,
    factors
  };
}

// ... existing code ...