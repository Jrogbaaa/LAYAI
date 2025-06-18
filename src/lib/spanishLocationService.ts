/**
 * Spanish Location Detection and Age Estimation Service
 * 
 * This service provides sophisticated detection of Spanish influencers
 * and improved age estimation capabilities.
 */

interface SpanishLocationResult {
  isSpanish: boolean;
  confidence: number;
  indicators: string[];
  detectedLocations: string[];
}

interface AgeEstimationResult {
  estimatedAge?: number;
  ageRange?: { min: number; max: number };
  confidence: number;
  method: string;
  indicators: string[];
}

interface ProfileData {
  username: string;
  displayName?: string;
  bio?: string;
  location?: string;
  recentPosts?: Array<{
    content: string;
    likes: number;
    comments: number;
    hashtags: string[];
  }>;
}

export class SpanishLocationService {
  // Enhanced Spanish location detection database
  private readonly SPANISH_LOCATIONS = {
    // Major cities (comprehensive list)
    cities: [
      'madrid', 'barcelona', 'valencia', 'sevilla', 'seville', 'zaragoza', 'málaga', 'malaga',
      'murcia', 'palma', 'las palmas', 'bilbao', 'alicante', 'córdoba', 'cordoba', 'valladolid',
      'vigo', 'gijón', 'gijon', 'hospitalet', 'vitoria', 'granada', 'oviedo', 'badalona',
      'cartagena', 'terrassa', 'jerez', 'sabadell', 'móstoles', 'mostoles', 'santa cruz',
      'pamplona', 'almería', 'almeria', 'fuenlabrada', 'leganés', 'leganes', 'donostia',
      'san sebastián', 'san sebastian', 'burgos', 'santander', 'castellón', 'castellon',
      'alcorcón', 'alcorcon', 'albacete', 'getafe', 'salamanca', 'huelva', 'logroño', 'logrono',
      'badajoz', 'tarragona', 'lleida', 'marbella', 'león', 'leon', 'cádiz', 'cadiz',
      'dos hermanas', 'torrejon', 'parla', 'mataró', 'mataro', 'algeciras', 'reus', 'ourense',
      'santiago', 'lugo', 'girona', 'cáceres', 'caceres', 'lorca', 'coslada', 'talavera',
      'el puerto', 'cornellà', 'cornella', 'avilés', 'aviles', 'palencia', 'galdakao',
      'torrent', 'torrevieja', 'chiclana', 'manresa', 'ferrol', 'vélez', 'velez', 'gandía', 'gandia'
    ],
    
    // Autonomous communities and regions
    regions: [
      'andalucía', 'andalucia', 'cataluña', 'catalunya', 'madrid', 'valencia', 'galicia',
      'castilla y león', 'castilla y leon', 'país vasco', 'pais vasco', 'euskadi', 'canarias',
      'castilla-la mancha', 'murcia', 'aragón', 'aragon', 'extremadura', 'asturias',
      'navarra', 'cantabria', 'la rioja', 'baleares', 'ceuta', 'melilla'
    ],
    
    // Spanish language indicators
    languageIndicators: [
      'español', 'española', 'spanish', 'spain', 'españa', 'madrid', 'barcelona',
      'hablo español', 'de españa', 'spanish girl', 'spanish boy', 'española',
      'vivo en', 'desde', 'nacida en', 'nacido en', 'spanish influencer',
      'influencer española', 'influencer español', 'creadora española', 'creador español'
    ],
    
    // Cultural and contextual markers
    culturalMarkers: [
      'paella', 'flamenco', 'siesta', 'tapas', 'jamón', 'jamon', 'sangría', 'sangria',
      'real madrid', 'fc barcelona', 'barça', 'barca', 'atletico', 'sevilla fc',
      'la liga', 'el clasico', 'feria', 'semana santa', 'san fermin', 'camino',
      'costa del sol', 'costa brava', 'islas baleares', 'canary islands', 'tenerife',
      'mallorca', 'ibiza', 'formentera', 'gran canaria', 'lanzarote', 'fuerteventura',
      'churros', 'gazpacho', 'tortilla española', 'patatas bravas', 'romerías',
      'procesiones', 'fallas', 'la tomatina', 'running of bulls', 'corrida'
    ],
    
    // Spanish postal codes pattern (5 digits)
    postalCodePattern: /\b\d{5}\b/g,
    
    // Spanish phone patterns
    phonePatterns: [
      /\+34\s?\d{3}\s?\d{3}\s?\d{3}/, // +34 format
      /\b6\d{8}\b/, // Mobile numbers starting with 6
      /\b7\d{8}\b/, // Mobile numbers starting with 7
      /\b9\d{8}\b/  // Landline numbers starting with 9
    ]
  };

  // Enhanced age detection patterns
  private readonly AGE_PATTERNS = {
    // Direct age mentions (English and Spanish)
    directAge: [
      /(\d{1,2})\s*(?:años?|years?|yo|y\.?o\.?|age)/i,
      /age\s*:?\s*(\d{1,2})/i,
      /(\d{1,2})\s*(?:year|yr)s?\s*old/i,
      /born\s*(?:in\s*)?(?:19|20)(\d{2})/i,
      /(\d{1,2})\s*(?:añitos|añita)/i, // Spanish diminutives
      /tengo\s*(\d{1,2})\s*años/i, // "I am X years old" in Spanish
      /soy\s*de\s*(\d{4})/i // "I am from year XXXX"
    ],
    
    // Birth year patterns (English and Spanish)
    birthYear: [
      /(?:born|nacida?|nací)\s*(?:en\s*)?(?:19|20)(\d{2})/i,
      /(?:19|20)(\d{2})\s*(?:baby|kid|born|nacida?)/i,
      /class\s*(?:of\s*)?(?:19|20)(\d{2})/i,
      /graduated?\s*(?:19|20)(\d{2})/i,
      /promoción\s*(?:19|20)(\d{2})/i, // Spanish graduation
      /generación\s*(?:19|20)(\d{2})/i // Spanish generation
    ],
    
    // Generation indicators
    generationMarkers: {
      'gen z': { minAge: 18, maxAge: 27 },
      'generation z': { minAge: 18, maxAge: 27 },
      'generación z': { minAge: 18, maxAge: 27 },
      'millennial': { minAge: 28, maxAge: 43 },
      'gen y': { minAge: 28, maxAge: 43 },
      'zoomer': { minAge: 18, maxAge: 27 },
      'boomer': { minAge: 58, maxAge: 77 },
      'centennial': { minAge: 18, maxAge: 27 }
    },
    
    // Life stage indicators (English and Spanish)
    lifeStageMarkers: {
      'university': { minAge: 18, maxAge: 25 },
      'universidad': { minAge: 18, maxAge: 25 },
      'college': { minAge: 18, maxAge: 25 },
      'student': { minAge: 16, maxAge: 25 },
      'estudiante': { minAge: 16, maxAge: 25 },
      'teenager': { minAge: 13, maxAge: 19 },
      'teen': { minAge: 13, maxAge: 19 },
      'adolescente': { minAge: 13, maxAge: 19 },
      'high school': { minAge: 14, maxAge: 18 },
      'instituto': { minAge: 14, maxAge: 18 },
      'bachillerato': { minAge: 16, maxAge: 18 },
      'married': { minAge: 20, maxAge: 60 },
      'casada': { minAge: 20, maxAge: 60 },
      'casado': { minAge: 20, maxAge: 60 },
      'mom': { minAge: 18, maxAge: 55 },
      'mother': { minAge: 18, maxAge: 55 },
      'mama': { minAge: 18, maxAge: 55 },
      'mamá': { minAge: 18, maxAge: 55 },
      'madre': { minAge: 18, maxAge: 55 },
      'dad': { minAge: 18, maxAge: 60 },
      'father': { minAge: 18, maxAge: 60 },
      'papa': { minAge: 18, maxAge: 60 },
      'papá': { minAge: 18, maxAge: 60 },
      'padre': { minAge: 18, maxAge: 60 },
      'grandmother': { minAge: 45, maxAge: 85 },
      'grandfather': { minAge: 45, maxAge: 85 },
      'abuela': { minAge: 45, maxAge: 85 },
      'abuelo': { minAge: 45, maxAge: 85 },
      'retired': { minAge: 60, maxAge: 85 },
      'jubilada': { minAge: 60, maxAge: 85 },
      'jubilado': { minAge: 60, maxAge: 85 }
    }
  };

  /**
   * Detect if a profile belongs to a Spanish influencer
   */
  detectSpanishLocation(profile: ProfileData): SpanishLocationResult {
    const indicators: string[] = [];
    const detectedLocations: string[] = [];
    let confidence = 0;
    
    // Combine all text sources for analysis
    const allText = [
      profile.bio || '',
      profile.location || '',
      profile.displayName || '',
      ...profile.recentPosts?.map(post => post.content) || []
    ].join(' ').toLowerCase();
    
    // 1. Direct location field analysis
    if (profile.location) {
      const location = profile.location.toLowerCase();
      
      // Check major cities (high confidence)
      const cityMatches = this.SPANISH_LOCATIONS.cities.filter(city => 
        location.includes(city) || city.includes(location)
      );
      if (cityMatches.length > 0) {
        confidence += 40;
        indicators.push(`Location field contains Spanish city: ${cityMatches.join(', ')}`);
        detectedLocations.push(...cityMatches);
      }
      
      // Check regions (high confidence)
      const regionMatches = this.SPANISH_LOCATIONS.regions.filter(region => 
        location.includes(region) || region.includes(location)
      );
      if (regionMatches.length > 0) {
        confidence += 35;
        indicators.push(`Location field contains Spanish region: ${regionMatches.join(', ')}`);
        detectedLocations.push(...regionMatches);
      }
      
      // Check for "Spain" or "España"
      if (location.includes('spain') || location.includes('españa')) {
        confidence += 50;
        indicators.push('Location explicitly mentions Spain');
        detectedLocations.push('Spain');
      }
    }
    
    // 2. Language indicators in bio/content
    const languageMatches = this.SPANISH_LOCATIONS.languageIndicators.filter(indicator => 
      allText.includes(indicator)
    );
    if (languageMatches.length > 0) {
      confidence += languageMatches.length * 10;
      indicators.push(`Spanish language indicators: ${languageMatches.join(', ')}`);
    }
    
    // 3. Cultural markers
    const culturalMatches = this.SPANISH_LOCATIONS.culturalMarkers.filter(marker => 
      allText.includes(marker)
    );
    if (culturalMatches.length > 0) {
      confidence += culturalMatches.length * 5;
      indicators.push(`Spanish cultural markers: ${culturalMatches.join(', ')}`);
    }
    
    // 4. Spanish phone number patterns
    const phoneMatches = this.SPANISH_LOCATIONS.phonePatterns.some(pattern => 
      pattern.test(allText)
    );
    if (phoneMatches) {
      confidence += 20;
      indicators.push('Spanish phone number pattern detected');
    }
    
    // 5. Spanish postal code pattern
    const postalMatches = this.SPANISH_LOCATIONS.postalCodePattern.test(allText);
    if (postalMatches) {
      confidence += 15;
      indicators.push('Spanish postal code pattern detected');
    }
    
    // 6. Content analysis for Spanish cities/regions mentioned in posts
    const contentLocationMatches = [
      ...this.SPANISH_LOCATIONS.cities,
      ...this.SPANISH_LOCATIONS.regions
    ].filter(location => allText.includes(location));
    
    if (contentLocationMatches.length > 0) {
      confidence += Math.min(contentLocationMatches.length * 3, 20);
      indicators.push(`Spanish locations mentioned in content: ${contentLocationMatches.slice(0, 5).join(', ')}`);
      detectedLocations.push(...contentLocationMatches);
    }
    
    // 7. Username analysis for Spanish patterns
    const username = profile.username.toLowerCase();
    const spanishNamePatterns = [
      'madrid', 'barcelona', 'valencia', 'sevilla', 'spain', 'español', 'española'
    ];
    const usernameMatches = spanishNamePatterns.filter(pattern => username.includes(pattern));
    if (usernameMatches.length > 0) {
      confidence += 15;
      indicators.push(`Username contains Spanish indicators: ${usernameMatches.join(', ')}`);
    }
    
    // 8. Spanish hashtags in posts
    if (profile.recentPosts) {
      const spanishHashtags = [
        '#españa', '#spain', '#madrid', '#barcelona', '#valencia', '#sevilla',
        '#spanish', '#española', '#español', '#influencerspain', '#influencersesp'
      ];
      
      const foundHashtags: string[] = [];
      profile.recentPosts.forEach(post => {
        post.hashtags?.forEach(hashtag => {
          const lowerTag = hashtag.toLowerCase();
          if (spanishHashtags.some(spanishTag => lowerTag.includes(spanishTag.replace('#', '')))) {
            foundHashtags.push(hashtag);
          }
        });
      });
      
      if (foundHashtags.length > 0) {
        confidence += Math.min(foundHashtags.length * 8, 25);
        indicators.push(`Spanish hashtags found: ${foundHashtags.slice(0, 3).join(', ')}`);
      }
    }
    
    // Cap confidence at 100
    confidence = Math.min(confidence, 100);
    
    return {
      isSpanish: confidence >= 30, // Threshold for considering someone Spanish
      confidence,
      indicators,
      detectedLocations: Array.from(new Set(detectedLocations)) // Remove duplicates
    };
  }

  /**
   * Estimate age from profile data
   */
  estimateAge(profile: ProfileData): AgeEstimationResult {
    const allText = [
      profile.bio || '',
      profile.displayName || '',
      ...profile.recentPosts?.map(post => post.content) || []
    ].join(' ');
    
    const indicators: string[] = [];
    let estimatedAge: number | undefined;
    let ageRange: { min: number; max: number } | undefined;
    let confidence = 0;
    let method = 'unknown';
    
    // 1. Direct age patterns
    for (const pattern of this.AGE_PATTERNS.directAge) {
      const match = allText.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 13 && age <= 80) { // Reasonable age range
          estimatedAge = age;
          confidence = 90;
          method = 'direct_mention';
          indicators.push(`Direct age mention: ${age}`);
          break;
        }
      }
    }
    
    // 2. Birth year patterns
    if (!estimatedAge) {
      for (const pattern of this.AGE_PATTERNS.birthYear) {
        const match = allText.match(pattern);
        if (match) {
          const yearDigits = match[1];
          let birthYear: number;
          
          // Handle 2-digit years
          if (yearDigits.length === 2) {
            const year = parseInt(yearDigits);
            birthYear = year > 30 ? 1900 + year : 2000 + year; // Assume 31-99 = 1931-1999, 00-30 = 2000-2030
          } else {
            birthYear = parseInt(yearDigits);
          }
          
          const currentYear = new Date().getFullYear();
          const calculatedAge = currentYear - birthYear;
          
          if (calculatedAge >= 13 && calculatedAge <= 80) {
            estimatedAge = calculatedAge;
            confidence = 85;
            method = 'birth_year';
            indicators.push(`Birth year: ${birthYear}, calculated age: ${calculatedAge}`);
            break;
          }
        }
      }
    }
    
    // 3. Generation markers
    if (!estimatedAge) {
      const lowerText = allText.toLowerCase();
      for (const [marker, range] of Object.entries(this.AGE_PATTERNS.generationMarkers)) {
        if (lowerText.includes(marker)) {
          ageRange = { min: range.minAge, max: range.maxAge };
          estimatedAge = Math.round((range.minAge + range.maxAge) / 2);
          confidence = 60;
          method = 'generation_marker';
          indicators.push(`Generation marker: ${marker} (${range.minAge}-${range.maxAge})`);
          break;
        }
      }
    }
    
    // 4. Life stage markers
    if (!estimatedAge) {
      const lowerText = allText.toLowerCase();
      const matchedStages: Array<{ marker: string; range: { minAge: number; maxAge: number } }> = [];
      
      for (const [marker, range] of Object.entries(this.AGE_PATTERNS.lifeStageMarkers)) {
        if (lowerText.includes(marker)) {
          matchedStages.push({ marker, range });
        }
      }
      
      if (matchedStages.length > 0) {
        // If multiple markers, find overlapping range
        let minAge = Math.max(...matchedStages.map(s => s.range.minAge));
        let maxAge = Math.min(...matchedStages.map(s => s.range.maxAge));
        
        if (minAge <= maxAge) {
          ageRange = { min: minAge, max: maxAge };
          estimatedAge = Math.round((minAge + maxAge) / 2);
          confidence = 50 + (matchedStages.length * 10); // More markers = higher confidence
          method = 'life_stage';
          indicators.push(`Life stage markers: ${matchedStages.map(s => s.marker).join(', ')}`);
        }
      }
    }
    
    // 5. Visual/contextual clues from recent posts
    if (!estimatedAge && profile.recentPosts) {
      const postContent = profile.recentPosts.map(p => p.content.toLowerCase()).join(' ');
      
      // School/education indicators
      if (postContent.includes('university') || postContent.includes('universidad') || 
          postContent.includes('college') || postContent.includes('uni')) {
        ageRange = { min: 18, max: 25 };
        estimatedAge = 21;
        confidence = 40;
        method = 'education_context';
        indicators.push('University/college context suggests young adult');
      }
      // Work/career indicators
      else if (postContent.includes('work') || postContent.includes('trabajo') || 
               postContent.includes('job') || postContent.includes('career') ||
               postContent.includes('oficina') || postContent.includes('empresa')) {
        ageRange = { min: 22, max: 65 };
        estimatedAge = 30;
        confidence = 30;
        method = 'work_context';
        indicators.push('Work/career context suggests working age');
      }
      // Family indicators
      else if (postContent.includes('kids') || postContent.includes('children') || 
               postContent.includes('family') || postContent.includes('hijos') ||
               postContent.includes('familia') || postContent.includes('niños')) {
        ageRange = { min: 25, max: 50 };
        estimatedAge = 35;
        confidence = 35;
        method = 'family_context';
        indicators.push('Family context suggests parent age');
      }
    }
    
    return {
      estimatedAge,
      ageRange,
      confidence,
      method,
      indicators
    };
  }
}

// Export singleton instance
export const spanishLocationService = new SpanishLocationService(); 