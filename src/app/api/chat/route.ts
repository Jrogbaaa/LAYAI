import { NextResponse } from 'next/server';
import { ApifySearchParams } from '@/lib/apifyService';

// Interface for collaboration query parameters
interface CollaborationParams {
  influencerHandle: string;
  brandName: string;
  postsToCheck?: number;
}

// Keyword-based parser for extracting search parameters
function parseSearchQuery(message: string): { 
  isSearch: boolean; 
  isCollaboration: boolean;
  params?: ApifySearchParams; 
  collaborationParams?: CollaborationParams;
  response?: string 
} {
  const lowerMessage = message.toLowerCase();
  
  // Check for collaboration keywords first
  const collaborationKeywords = [
    'check collaboration', 'verify collaboration', 'brand collaboration', 'worked with',
    'collaborated with', 'partnership with', 'sponsored by', 'brand ambassador',
    'check if', 'verify if', 'has worked', 'collaboration history', 'brand partnership',
    'verificar colaboración', 'verificar colaboracion', 'colaboró con', 'colaboro con',
    'trabajó con', 'trabajo con', 'patrocinado por', 'embajador de',
    'check brand', 'verify brand', 'collaboration check', 'partnership check',
    'mentioned', 'talked about', 'used', 'promoted', 'featuring', 'showcased',
    'mencionó', 'habló de', 'usó', 'promocionó', 'mostró', 'presentó',
    'has mentioned', 'ever mentioned', 'mentioned in posts', 'talked about in posts'
  ];
  
  const isCollaboration = collaborationKeywords.some(keyword => lowerMessage.includes(keyword)) ||
                         (lowerMessage.includes('check') && (lowerMessage.includes('brand') || lowerMessage.includes('sponsored'))) ||
                         (lowerMessage.includes('verify') && (lowerMessage.includes('partnership') || lowerMessage.includes('collaboration')));

  if (isCollaboration) {
    // Extract influencer handle and brand name
    const collaborationParams = parseCollaborationQuery(message);
    
    if (!collaborationParams.influencerHandle || !collaborationParams.brandName) {
      return {
        isSearch: false,
        isCollaboration: true,
        response: "Para verificar una colaboración, necesito el nombre del influencer y la marca. Por ejemplo: 'Verifica si @influencer colaboró con Nike' o 'Check if @username worked with Adidas'."
      };
    }
    
    return {
      isSearch: false,
      isCollaboration: true,
      collaborationParams
    };
  }
  
  // Check if this is a search intent - support both English and Spanish keywords
  const searchKeywords = ['find', 'search', 'show', 'get', 'look for', 'discover', 'recommend', 'buscar', 'encontrar', 'mostrar', 'busca', 'encuentra', 'muestra', 'recomendar', 'descubrir'];
  const isSearch = searchKeywords.some(keyword => lowerMessage.includes(keyword)) ||
                   lowerMessage.includes('influencer') ||
                   lowerMessage.includes('creator') ||
                   lowerMessage.includes('creador') ||
                   lowerMessage.includes('creadores');

  if (!isSearch) {
    // Handle non-search queries with conversational responses in Spanish
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || 
        lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return {
        isSearch: false,
        isCollaboration: false,
        response: "¡Hola! Puedo ayudarte a:\n• Encontrar influencers perfectos para tu marca\n• Verificar colaboraciones entre influencers y marcas\n\n¿Qué necesitas hoy?"
      };
    }
    
    if ((lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('use'))) ||
        (lowerMessage.includes('cómo') && (lowerMessage.includes('funciona') || lowerMessage.includes('usar') || lowerMessage.includes('usas')))) {
      return {
        isSearch: false,
        isCollaboration: false,
        response: "¡Es simple! Puedo ayudarte de dos formas:\n\n🔍 **Buscar influencers**: 'Encuentra influencers de moda en Instagram con 10k-100k seguidores'\n\n🤝 **Verificar colaboraciones**: 'Verifica si @username colaboró con Nike'\n\n¿Qué necesitas?"
      };
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('ayuda') || lowerMessage.includes('ayudar')) {
      return {
        isSearch: false,
        isCollaboration: false,
        response: "¡Puedo ayudarte con dos funciones principales!\n\n🔍 **Búsqueda de influencers:**\n• Plataforma (Instagram, TikTok, YouTube)\n• Nicho (moda, fitness, tecnología, etc.)\n• Seguidores (10k, 100k, 1M, etc.)\n• Ubicación y género\n\n🤝 **Verificación de colaboraciones:**\n• Escribe: 'Verifica si @influencer trabajó con [marca]'\n• Ejemplo: 'Check if @username collaborated with Nike'\n\n¿Qué necesitas?"
      };
    }
    
    return {
      isSearch: false,
      isCollaboration: false,
      response: "¡Estoy aquí para ayudarte! Puedo:\n• Encontrar influencers: 'Busca influencers de fitness en Instagram'\n• Verificar colaboraciones: 'Verifica si @username trabajó con Nike'\n\n¿Qué necesitas?"
    };
  }

  // Extract platforms
  const platforms: string[] = [];
  if (lowerMessage.includes('instagram') || lowerMessage.includes('insta') || lowerMessage.includes('ig')) {
    platforms.push('Instagram');
  }
  if (lowerMessage.includes('tiktok') || lowerMessage.includes('tik tok')) {
    platforms.push('TikTok');
  }
  if (lowerMessage.includes('youtube') || lowerMessage.includes('yt')) {
    platforms.push('YouTube');
  }
  if (lowerMessage.includes('twitter') || lowerMessage.includes('x.com')) {
    platforms.push('Twitter');
  }
  
  // Default to Instagram and TikTok if no platform specified
  if (platforms.length === 0) {
    platforms.push('Instagram', 'TikTok');
  }

  // Extract niches with expanded mapping
  const nicheMap: { [key: string]: string } = {
    'fashion': 'fashion',
    'style': 'fashion',
    'clothing': 'fashion',
    'fitness': 'fitness',
    'gym': 'fitness',
    'workout': 'fitness',
    'health': 'fitness',
    'tech': 'tech',
    'technology': 'tech',
    'gadget': 'tech',
    'software': 'tech',
    'beauty': 'beauty',
    'makeup': 'beauty',
    'skincare': 'beauty',
    'cosmetic': 'beauty',
    'food': 'food',
    'cooking': 'food',
    'recipe': 'food',
    'travel': 'travel',
    'adventure': 'travel',
    'lifestyle': 'lifestyle',
    'gaming': 'gaming',
    'game': 'gaming',
    'esports': 'gaming',
    'music': 'music',
    'musician': 'music',
    'sports': 'sports',
    'athlete': 'sports',
    'business': 'business',
    'entrepreneur': 'business',
    'finance': 'finance',
    'crypto': 'finance',
    'art': 'art',
    'photography': 'art',
    // Home/Interior/Furniture niches
    'ikea': 'home',
    'home': 'home',
    'interior': 'home',
    'furniture': 'home',
    'decor': 'home',
    'decoration': 'home',
    'homedesign': 'home',
    'diy': 'home',
    'homeware': 'home',
    'organization': 'home'
  };

  const niches: string[] = [];
  Object.keys(nicheMap).forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      const niche = nicheMap[keyword];
      if (!niches.includes(niche)) {
        niches.push(niche);
      }
    }
  });

  // Default to lifestyle if no niche specified
  if (niches.length === 0) {
    niches.push('lifestyle');
  }

  // Extract gender (check female first to avoid "male" matching in "female")
  let gender: string | undefined;
  if (lowerMessage.includes('women only') || lowerMessage.includes('female only') || 
      lowerMessage.includes('women ') || lowerMessage.includes('female ') ||
      lowerMessage.includes('girls') || lowerMessage.includes('ladies')) {
    gender = 'female';
  } else if (lowerMessage.includes('men only') || lowerMessage.includes('male only') || 
             lowerMessage.includes('men ') || lowerMessage.includes(' male ') ||
             lowerMessage.includes('guys') || lowerMessage.includes('boys')) {
    gender = 'male';
  }

  // Extract age range
  let ageRange: string | undefined;
  const agePatterns = [
    { pattern: /ages?\s+(\d+)\s*-\s*(\d+)/i, isRange: true },
    { pattern: /(\d+)\s*-\s*(\d+)\s+years?\s+old/i, isRange: true },
    { pattern: /ages?\s+(\d+)\s+and\s+up/i, isRange: false },
    { pattern: /(\d+)\+\s+years?\s+old/i, isRange: false },
    { pattern: /over\s+(\d+)\s+years?\s+old/i, isRange: false }
  ];

  for (const { pattern, isRange } of agePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      if (isRange && match[2]) {
        // Range pattern
        ageRange = `${parseInt(match[1])}-${parseInt(match[2])}`;
      } else {
        // Single number pattern (30 and up)
        const age = parseInt(match[1]);
        ageRange = age >= 30 ? '30+' : age >= 25 ? '25-34' : '18-24';
      }
      break;
    }
  }

  // Extract follower counts
  let minFollowers = 1000;
  let maxFollowers = 1000000;

  // Look for follower patterns (including comma-separated numbers)
  const followerPatterns = [
    // Handle "no more than" patterns
    { pattern: /no more than\s+([\d,]+)/i, isMax: true },
    { pattern: /not more than\s+([\d,]+)/i, isMax: true },
    { pattern: /maximum of\s+([\d,]+)/i, isMax: true },
    { pattern: /max\s+([\d,]+)/i, isMax: true },
    
    // Handle "between X and Y" patterns with commas
    { pattern: /between\s+([\d,]+)\s+and\s+([\d,]+)/i, isRange: true },
    { pattern: /([\d,]+)\s*-\s*([\d,]+)\s*followers/i, isRange: true },
    { pattern: /([\d,]+)\s*to\s*([\d,]+)\s*followers/i, isRange: true },
    
    // Handle k/m patterns for maximums
    { pattern: /no more than\s+(\d+)k/i, multiplier1: 1000, isMax: true },
    { pattern: /under\s+(\d+)k/i, multiplier1: 1000, isMax: true },
    { pattern: /below\s+(\d+)k/i, multiplier1: 1000, isMax: true },
    { pattern: /no more than\s+(\d+)m/i, multiplier1: 1000000, isMax: true },
    { pattern: /under\s+(\d+)m/i, multiplier1: 1000000, isMax: true },
    
    // Handle k/m patterns for ranges
    { pattern: /(\d+)k?\s*-\s*(\d+)k/i, multiplier1: 1000, multiplier2: 1000 },
    { pattern: /(\d+)k?\s*-\s*(\d+)m/i, multiplier1: 1000, multiplier2: 1000000 },
    { pattern: /(\d+)m?\s*-\s*(\d+)m/i, multiplier1: 1000000, multiplier2: 1000000 },
    
    // Handle minimum patterns
    { pattern: /over\s+(\d+)k/i, multiplier1: 1000, isMin: true },
    { pattern: /above\s+(\d+)k/i, multiplier1: 1000, isMin: true },
    { pattern: /more than\s+(\d+)k/i, multiplier1: 1000, isMin: true },
    { pattern: /(\d+)k\+/i, multiplier1: 1000, isMin: true },
    { pattern: /over\s+(\d+)m/i, multiplier1: 1000000, isMin: true },
    { pattern: /(\d+)m\+/i, multiplier1: 1000000, isMin: true },
    
    // Handle single values
    { pattern: /(\d+)k/i, multiplier1: 1000, isSingle: true },
    { pattern: /(\d+)m/i, multiplier1: 1000000, isSingle: true }
  ];

  for (const { pattern, multiplier1, multiplier2, isMin, isMax, isSingle, isRange } of followerPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      if (isRange) {
        // Handle comma-separated numbers like "100,000" and "500,000"
        const num1 = parseInt(match[1].replace(/,/g, ''));
        const num2 = parseInt(match[2].replace(/,/g, ''));
        minFollowers = Math.min(num1, num2);
        maxFollowers = Math.max(num1, num2);
      } else if (isMin && multiplier1) {
        minFollowers = parseInt(match[1]) * multiplier1;
        maxFollowers = 10000000; // 10M max
      } else if (isMax) {
        minFollowers = 1000;
        if (multiplier1) {
          maxFollowers = parseInt(match[1]) * multiplier1;
        } else {
          // Handle comma-separated numbers for max patterns
          maxFollowers = parseInt(match[1].replace(/,/g, ''));
        }
      } else if (isSingle && multiplier1) {
        const count = parseInt(match[1]) * multiplier1;
        minFollowers = Math.max(1000, count * 0.5);
        maxFollowers = count * 2;
      } else if (multiplier1 && multiplier2) {
        minFollowers = parseInt(match[1]) * multiplier1;
        maxFollowers = parseInt(match[2]) * multiplier2;
      }
      break;
    }
  }

  // Extract location with improved patterns (including Spanish)
  let location: string | undefined;
  const locationPatterns = [
    // English patterns
    /in\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    /from\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    /based in\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    /located in\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    // Spanish patterns
    /en\s+([a-zA-ZáéíóúñÑ\s]+?)(?:\s+con|\s+más|\s+para|\s+de|$|,|\.|!|\?)/i,
    /de\s+([a-zA-ZáéíóúñÑ\s]+?)(?:\s+con|\s+más|\s+para|\s+en|$|,|\.|!|\?)/i,
    /desde\s+([a-zA-ZáéíóúñÑ\s]+?)(?:\s+con|\s+más|\s+para|\s+en|$|,|\.|!|\?)/i
  ];

  for (const pattern of locationPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      location = match[1].trim();
      // Clean up common words that might be captured
      const stopWords = ['the', 'with', 'and', 'or', 'followers', 'subscribers', 'over', 'under', 'above', 'only'];
      const locationWords = location.split(' ').filter(word => 
        !stopWords.includes(word.toLowerCase()) && word.length > 1
      );
      if (locationWords.length > 0) {
        location = locationWords.join(' ');
        break;
      }
    }
  }

  // Extract verification preference
  const verified = lowerMessage.includes('verified') || lowerMessage.includes('blue check');

  const params: ApifySearchParams = {
    platforms,
    niches,
    minFollowers,
    maxFollowers,
    location,
    verified,
    maxResults: 20,
    gender,
    ageRange,
    strictLocationMatch: location ? true : false, // Enable strict location matching when location is specified
    brandName: undefined,
    userQuery: message
  };

  console.log('🔍 Parsed search parameters:', params);
  return { isSearch: true, isCollaboration: false, params };
}

// Function to parse collaboration queries and extract influencer handle and brand name
function parseCollaborationQuery(message: string): CollaborationParams {
  let influencerHandle = '';
  let brandName = '';
  
  // Extract influencer handle patterns
  const handlePatterns = [
    /@([a-zA-Z0-9._]+)/g, // @username pattern
    /influencer\s+([a-zA-Z0-9._]+)/gi, // "influencer username"
    /username\s+([a-zA-Z0-9._]+)/gi, // "username xyz"
    /has\s+([a-zA-Z0-9._]+)\s+(?:mentioned|talked|used|worked|collaborated|promoted)/gi, // "has cristiano mentioned"
    /(?:check|verify|did)\s+([a-zA-Z0-9._]+)\s+(?:mention|talk|use|work|collaborate|promote)/gi, // "did cristiano mention"
  ];
  
  for (const pattern of handlePatterns) {
    const match = pattern.exec(message);
    if (match) {
      influencerHandle = match[1];
      break;
    }
  }
  
  // Extract brand name patterns
  const brandPatterns = [
    /(?:with|con|collaborated with|trabajó con|sponsored by|patrocinado por|brand|marca)\s+([A-Za-z0-9\s&.-]+?)(?:\s|$|\?|!|\.)/gi,
    /(?:mentioned|talked about|used|promoted|featuring|showcased|mencionó|habló de|usó|promocionó|mostró|presentó)\s+([A-Za-z0-9\s&.-]+?)(?:\s+ever|\s+in|\s+on|\s|$|\?|!|\.)/gi,
    /(?:Nike|Adidas|Zara|H&M|McDonald's|Coca-Cola|Pepsi|Samsung|Apple|Google|Amazon|Microsoft|Facebook|Instagram|TikTok|YouTube|Twitter|Spotify|Netflix|Disney|Marvel|DC|PlayStation|Xbox|Nintendo|Tesla|BMW|Mercedes|Audi|Volkswagen|Toyota|Honda|Ford|Chevrolet|Uber|Airbnb|Starbucks|KFC|Burger King|Subway|Pizza Hut|Domino's|Walmart|Target|Best Buy|GameStop|Sephora|Ulta|Victoria's Secret|Calvin Klein|Tommy Hilfiger|Ralph Lauren|Gucci|Prada|Louis Vuitton|Chanel|Hermès|Rolex|Cartier|Tiffany|IKEA|Ikea)/gi
  ];
  
  for (const pattern of brandPatterns) {
    const match = pattern.exec(message);
    if (match) {
      if (match[1]) {
        // First pattern with capture group
        brandName = match[1].trim();
      } else {
        // Second pattern (direct brand names)
        brandName = match[0].trim();
      }
      break;
    }
  }
  
  // Clean up brand name
  brandName = brandName.replace(/^(with|con|collaborated with|trabajó con|sponsored by|patrocinado por|brand|marca)\s+/gi, '').trim();
  
  return {
    influencerHandle,
    brandName,
    postsToCheck: 100 // Default value for deeper analysis
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    console.log('🔍 Chat API received message:', message);
    
    // Check if this is a structured search from the enhanced parser
    if (message.startsWith('STRUCTURED_SEARCH:')) {
      const structuredData = message.replace('STRUCTURED_SEARCH:', '');
      try {
        const parsedParams = JSON.parse(structuredData);
        console.log('🎯 Using structured search parameters:', parsedParams);
        return NextResponse.json({ 
          success: true, 
          type: 'search', 
          data: parsedParams 
        });
      } catch (parseError) {
        console.error('Error parsing structured search:', parseError);
        // Fall back to regular parsing
      }
    }
    
    const parseResult = parseSearchQuery(message);
    console.log('🔍 Parse result:', parseResult);

    // Handle collaboration queries
    if (parseResult.isCollaboration) {
      if (!parseResult.collaborationParams) {
        return NextResponse.json({ 
          success: true, 
          type: 'chat', 
          data: parseResult.response 
        });
      }

      // Call the brand collaboration API internally
      try {
        const collaborationResponse = await fetch(new URL('/api/check-brand-collaboration', req.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parseResult.collaborationParams)
        });

        const collaborationData = await collaborationResponse.json();
        
        if (collaborationData.success) {
          const { collaboration, influencerHandle, brandName } = collaborationData;
          
          let responseMessage = '';
          if (collaboration.hasWorkedTogether) {
            responseMessage = `✅ **Colaboración confirmada!**\n\n` +
              `🤝 **@${influencerHandle}** ha trabajado con **${brandName}**\n` +
              `📊 **Confianza:** ${collaboration.confidence}%\n` +
              `🎯 **Tipo:** ${collaboration.collaborationType === 'partnership' ? 'Colaboración patrocinada' : 'Mención/Referencia'}\n\n` +
              `📝 **Evidencia encontrada:**\n${collaboration.evidence.map((e: string) => `• ${e}`).join('\n')}`;
            
            if (collaboration.lastCollabDate) {
              responseMessage += `\n\n📅 **Última colaboración:** ${collaboration.lastCollabDate}`;
            }
          } else {
            responseMessage = `❌ **No se encontró evidencia de colaboración**\n\n` +
              `🔍 **@${influencerHandle}** y **${brandName}**\n` +
              `📊 **Posts analizados:** ${collaborationData.postsAnalyzed || 0}\n` +
              `📝 **Razón:** ${collaboration.reason || 'Sin evidencia en posts recientes'}`;
          }

          return NextResponse.json({ 
            success: true, 
            type: 'collaboration', 
            data: responseMessage,
            rawData: collaborationData
          });
        } else {
          throw new Error(collaborationData.error || 'Failed to check collaboration');
        }
      } catch (collaborationError) {
        console.error('Error checking collaboration:', collaborationError);
        return NextResponse.json({ 
          success: true, 
          type: 'chat', 
          data: `❌ Error al verificar la colaboración: ${collaborationError instanceof Error ? collaborationError.message : 'Error desconocido'}`
        });
      }
    }

    // Handle regular chat responses
    if (!parseResult.isSearch) {
      return NextResponse.json({ 
        success: true, 
        type: 'chat', 
        data: parseResult.response 
      });
    }

    // Handle search queries
    return NextResponse.json({ 
      success: true, 
      type: 'search', 
      data: parseResult.params 
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 