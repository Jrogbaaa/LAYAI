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
      minFollowers: params.minFollowers,
      maxFollowers: params.maxFollowers
    });

    // Debug the Spain check
    console.log('🔍 Spain relation check:', {
      location: params.location,
      userQuery: params.userQuery,
      brandName: params.brandName,
      isSpainRelated: isSpainRelated(params.location, params.userQuery, params.brandName)
    });

    // Automatically search vetted database for Spain-related queries OR IKEA brand
    const isIkeaBrand = params.brandName?.toLowerCase().includes('ikea') || params.userQuery?.toLowerCase().includes('ikea');
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

    // Apply filters in memory (no index required)
    let filteredInfluencers = allInfluencers;

    // Enhance niches for IKEA brand searches
    let searchNiches = params.niches ? [...params.niches] : [];
    if (isIkeaBrand) {
      // Add relevant niches for IKEA brand compatibility
      searchNiches.push('home', 'lifestyle', 'fashion');
      console.log('🏠 Enhanced search niches for IKEA brand:', searchNiches);
    }

    // Debug initial sample
    if (allInfluencers.length > 0) {
      console.log('📝 Sample influencer from database:', {
        username: allInfluencers[0].username,
        displayName: allInfluencers[0].displayName,
        genres: allInfluencers[0].genres,
        followerCount: allInfluencers[0].followerCount
      });
    }

    // Filter by niche
    if (searchNiches.length > 0) {
      console.log(`🎯 Filtering by niches: ${searchNiches.join(', ')}`);
      
      // Debug niche matching for first few influencers
      const debugCount = Math.min(5, filteredInfluencers.length);
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

    // Filter by gender
    if (params.gender && params.gender !== 'any') {
      console.log(`👤 Filtering by gender: ${params.gender}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        matchesGender(inf, params.gender)
      );
      console.log(`📊 After gender filter: ${filteredInfluencers.length} influencers`);
    }

    // Filter by follower count
    if (params.minFollowers) {
      console.log(`📊 Filtering by minFollowers: ${params.minFollowers}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.followerCount >= params.minFollowers!
      );
      console.log(`📊 After minFollowers filter: ${filteredInfluencers.length} influencers`);
    }

    if (params.maxFollowers) {
      console.log(`📊 Filtering by maxFollowers: ${params.maxFollowers}`);
      filteredInfluencers = filteredInfluencers.filter(inf => 
        inf.followerCount <= params.maxFollowers!
      );
      console.log(`📊 After maxFollowers filter: ${filteredInfluencers.length} influencers`);
    }

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

    // Limit results
    const limitedResults = filteredInfluencers.slice(0, 50);

    console.log(`✅ Vetted database search complete: ${limitedResults.length} results`);

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

// Convert vetted influencer to match result format for consistency
export function convertVettedToMatchResult(vetted: VettedInfluencer) {
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
    matchReasons: [
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