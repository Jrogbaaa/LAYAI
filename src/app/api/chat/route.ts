import { NextResponse } from 'next/server';
import { ApifySearchParams } from '@/lib/apifyService';

// Keyword-based parser for extracting search parameters
function parseSearchQuery(message: string): { isSearch: boolean; params?: ApifySearchParams; response?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Check if this is a search intent
  const searchKeywords = ['find', 'search', 'show', 'get', 'look for', 'discover', 'recommend'];
  const isSearch = searchKeywords.some(keyword => lowerMessage.includes(keyword)) ||
                   lowerMessage.includes('influencer') ||
                   lowerMessage.includes('creator');

  if (!isSearch) {
    // Handle non-search queries with conversational responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        isSearch: false,
        response: "Hi! I can help you find the perfect influencers for your brand. Just tell me what you're looking for - like the niche, platform, follower count, or location, and I'll search for matching influencers!"
      };
    }
    
    if (lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('use'))) {
      return {
        isSearch: false,
        response: "It's simple! Just describe what kind of influencers you're looking for. For example: 'Find fashion influencers on Instagram with 10k-100k followers in New York' or 'Show me tech YouTubers with over 50k subscribers'."
      };
    }
    
    if (lowerMessage.includes('help')) {
      return {
        isSearch: false,
        response: "I can help you search for influencers! You can specify:\n• Platform (Instagram, TikTok, YouTube, Twitter)\n• Niche (fashion, fitness, tech, beauty, etc.)\n• Follower count (10k, 100k, 1M, etc.)\n• Location (city or country)\n• Gender (male, female)\n• Age range (18-24, 25-34, etc.)\n\nJust tell me what you're looking for!"
      };
    }
    
    return {
      isSearch: false,
      response: "I'm here to help you find influencers! Try asking something like 'Find fitness influencers on Instagram' or 'Show me tech YouTubers with 50k+ followers'."
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

  // Extract location with improved patterns
  let location: string | undefined;
  const locationPatterns = [
    /in\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    /from\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    /based in\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i,
    /located in\s+([a-zA-Z\s]+?)(?:\s+men|\s+women|\s+with|\s+over|\s+under|\s+above|\s+between|\s+ages?|$|,|\.|!|\?)/i
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
  return { isSearch: true, params };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    console.log('🔍 Chat API received message:', message);
    const parseResult = parseSearchQuery(message);
    console.log('🔍 Parse result:', parseResult);

    if (!parseResult.isSearch) {
      return NextResponse.json({ 
        success: true, 
        type: 'chat', 
        data: parseResult.response 
      });
    }

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