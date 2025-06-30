import { NextRequest, NextResponse } from 'next/server';

interface CollaborationCheckRequest {
  influencerHandle: string;
  brandName: string;
  postsToCheck?: number; // Default 20 recent posts
}

interface CollaborationResult {
  hasCollaborated: boolean;
  collaborationType: 'partnership' | 'mention' | 'none';
  evidence: string[];
  confidenceScore: number;
  lastCollabDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { influencerHandle, brandName, postsToCheck = 20 }: CollaborationCheckRequest = await request.json();

    if (!influencerHandle || !brandName) {
      return NextResponse.json(
        { error: 'Influencer handle and brand name are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking collaboration history: ${influencerHandle} x ${brandName}`);

    // Clean the influencer handle
    const cleanHandle = influencerHandle.replace('@', '').toLowerCase();
    
    // Prepare Apify request for Instagram post scraping
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    const apifyInput = {
      usernames: [cleanHandle],
      resultsType: "posts",
      resultsLimit: postsToCheck,
      addParentData: false
    };

    console.log(`📱 Scraping ${postsToCheck} recent posts from @${cleanHandle}...`);

    // Call Apify Instagram scraper for posts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
    
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apifyInput),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!apifyResponse.ok) {
      throw new Error(`Apify API error: ${apifyResponse.status}`);
    }

    const posts = await apifyResponse.json();
    console.log(`📊 Retrieved ${posts.length} posts for analysis`);

    // Analyze posts for brand mentions and collaborations
    const collaborationAnalysis = analyzeBrandCollaboration(posts, brandName);
    
    return NextResponse.json({
      success: true,
      influencer: cleanHandle,
      brand: brandName,
      collaboration: collaborationAnalysis,
      postsAnalyzed: posts.length
    });

  } catch (error) {
    console.error('❌ Brand collaboration check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        collaboration: {
          hasCollaborated: false,
          collaborationType: 'none',
          evidence: [],
          confidenceScore: 0
        }
      },
      { status: 500 }
    );
  }
}

function analyzeBrandCollaboration(posts: any[], brandName: string): CollaborationResult {
  const brand = brandName.toLowerCase();
  const evidence: string[] = [];
  let collaborationType: 'partnership' | 'mention' | 'none' = 'none';
  let confidenceScore = 0;
  let lastCollabDate: string | undefined;

  // Brand name variations to search for
  const brandVariations = generateBrandVariations(brand);
  
  console.log(`🔍 Searching for brand variations: ${brandVariations.join(', ')}`);

  // Partnership/collaboration keywords
  const partnershipKeywords = [
    'partnership', 'colaboración', 'colaboracion', 'partnership with', 'colaborando con',
    'sponsored', 'patrocinado', 'ad', 'publicidad', '#ad', '#publicidad', '#sponsored',
    'thanks to', 'gracias a', 'in collaboration with', 'en colaboración con',
    'ambassador', 'embajador', 'embajadora', 'brand ambassador',
    'gifted', 'regalo', 'regalado', 'cortesía', 'cortesia'
  ];

  // Mention keywords
  const mentionKeywords = [
    'love', 'amo', 'encanta', 'amazing', 'increíble', 'increible',
    'using', 'usando', 'utilizo', 'with', 'con',
    'from', 'de', 'by', 'por'
  ];

  for (const post of posts) {
    const caption = (post.caption || '').toLowerCase();
    const hashtags = (post.hashtags || []).map((h: any) => h.toLowerCase());
    const allText = `${caption} ${hashtags.join(' ')}`;

    // Check if brand is mentioned
    const brandMentioned = brandVariations.some(variation => 
      allText.includes(variation) || hashtags.some((tag: string) => tag.includes(variation))
    );

    if (brandMentioned) {
      const postDate = post.timestamp || post.taken_at_timestamp;
      if (postDate && (!lastCollabDate || postDate > lastCollabDate)) {
        lastCollabDate = new Date(postDate * 1000).toISOString().split('T')[0];
      }

      // Check for partnership indicators
      const hasPartnershipKeywords = partnershipKeywords.some(keyword => 
        allText.includes(keyword)
      );

      // Check for mention indicators  
      const hasMentionKeywords = mentionKeywords.some(keyword =>
        allText.includes(keyword)
      );

      if (hasPartnershipKeywords) {
        collaborationType = 'partnership';
        confidenceScore = Math.max(confidenceScore, 90);
        evidence.push(`Partnership post: "${(post.caption || '').substring(0, 100)}..."`);
      } else if (hasMentionKeywords) {
        if (collaborationType !== 'partnership') {
          collaborationType = 'mention';
        }
        confidenceScore = Math.max(confidenceScore, 60);
        evidence.push(`Brand mention: "${(post.caption || '').substring(0, 100)}..."`);
      } else {
        // Basic mention without context
        if (collaborationType === 'none') {
          collaborationType = 'mention';
        }
        confidenceScore = Math.max(confidenceScore, 30);
        evidence.push(`Brand reference: "${(post.caption || '').substring(0, 100)}..."`);
      }
    }
  }

  const hasCollaborated = collaborationType !== 'none' && confidenceScore > 20;

  console.log(`📊 Analysis complete: ${hasCollaborated ? 'FOUND' : 'NOT FOUND'} collaboration (${collaborationType}, ${confidenceScore}% confidence)`);

  return {
    hasCollaborated,
    collaborationType,
    evidence: evidence.slice(0, 3), // Keep top 3 evidence pieces
    confidenceScore,
    lastCollabDate
  };
}

function generateBrandVariations(brandName: string): string[] {
  const variations = [brandName];
  
  // Common brand variations
  if (brandName === 'ikea') {
    variations.push('ikeaspain', 'ikeaes', 'ikea_spain');
  } else if (brandName === 'nike') {
    variations.push('nikespain', 'nikees', 'justdoit');
  } else if (brandName === 'adidas') {
    variations.push('adidasspain', 'adidases', 'adidasoriginals');
  } else if (brandName === 'zara') {
    variations.push('zaraofficial', 'zaraes', 'zaraspain');
  } else if (brandName === 'mango') {
    variations.push('mangoofficial', 'mangospain', 'mangofashion');
  }
  
  // Add common social media handles
  variations.push(`@${brandName}`);
  variations.push(`#${brandName}`);
  
  return variations;
} 