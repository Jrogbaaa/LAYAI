import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

interface CollaborationCheckRequest {
  influencerHandle: string;
  brandName: string;
  postsToCheck?: number; // Default 50 recent posts (max 200)
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
    const body = await request.json();
      const { influencerHandle, brandName, postsToCheck = 50 } = body;

  // Limit maximum posts to check (Apify has limits)
  const limitedPostsToCheck = Math.min(postsToCheck, 200);

  if (!influencerHandle || !brandName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: influencerHandle and brandName' 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking collaboration history: ${influencerHandle} x ${brandName}`);

    // Clean the influencer handle
    const cleanHandle = influencerHandle.replace(/^@/, '').trim();

    // Use Apify Instagram Post Scraper 
    const actorId = 'apify/instagram-post-scraper';
    
    // Correct parameter format based on official documentation
    const apifyInput = {
      username: [cleanHandle], // Note: singular 'username' parameter, array value
      resultsLimit: limitedPostsToCheck
    };

    console.log(`📱 Scraping recent posts from @${cleanHandle} using Instagram Post Scraper...`);
    console.log(`🔧 Apify Input:`, JSON.stringify(apifyInput, null, 2));

    try {
      // Call Apify Instagram Post Scraper
      const run = await apifyClient.actor(actorId).call(apifyInput, {
        timeout: 120000, // 2 minutes timeout
      });

      console.log(`⏳ Apify run completed with ID: ${run.id}`);

      // Get the results
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      
      console.log(`📊 Retrieved ${items.length} posts for analysis`);

      if (items.length === 0) {
        return NextResponse.json({
          success: true,
          collaboration: {
            hasWorkedTogether: false,
            collaborationType: 'none',
            confidence: 0,
            evidence: [],
            reason: 'No posts found to analyze',
            postsAnalyzed: 0
          },
          brandName,
          influencerHandle: cleanHandle
        });
      }

      // Analyze posts for brand collaboration
      const analysisResult = analyzeBrandCollaboration(items, brandName);

      return NextResponse.json({
        success: true,
        collaboration: {
          hasWorkedTogether: analysisResult.hasCollaborated,
          collaborationType: analysisResult.collaborationType,
          confidence: analysisResult.confidenceScore,
          evidence: analysisResult.evidence,
          reason: 'Analyzed from recent posts',
          lastCollabDate: analysisResult.lastCollabDate
        },
        brandName,
        influencerHandle: cleanHandle,
        postsAnalyzed: items.length
      });

    } catch (apifyError) {
      console.error(`❌ Apify scraping failed:`, apifyError);
      
      // Fallback: Try to get basic profile info for bio analysis
      console.log(`🔄 Falling back to profile bio analysis...`);
      
      try {
        const profileRun = await apifyClient.actor('apify/instagram-profile-scraper').call({
          usernames: [cleanHandle],
          resultsType: 'profiles',
          resultsLimit: 1
        });

        const { items: profileItems } = await apifyClient.dataset(profileRun.defaultDatasetId).listItems();
        
        if (profileItems.length > 0) {
          const profile = profileItems[0];
          const bioAnalysis = analyzeBioForCollaboration(profile.biography || '', brandName);
          
          return NextResponse.json({
            success: true,
            collaboration: {
              hasWorkedTogether: bioAnalysis.hasCollaboration,
              collaborationType: bioAnalysis.collaborationType,
              confidence: bioAnalysis.confidence,
              evidence: bioAnalysis.evidence,
              reason: 'Analyzed from profile bio (posts unavailable)',
              postsAnalyzed: 0
            },
            brandName,
            influencerHandle: cleanHandle,
            fallbackMethod: 'bio-analysis'
          });
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback analysis also failed:`, fallbackError);
      }

      // Return negative result if everything fails
      return NextResponse.json({
        success: true,
        collaboration: {
          hasWorkedTogether: false,
          collaborationType: 'none',
          confidence: 0,
          evidence: [],
          reason: 'Unable to scrape posts for analysis',
          postsAnalyzed: 0
        },
        brandName,
        influencerHandle: cleanHandle,
        error: 'Scraping failed'
      });
    }

  } catch (error) {
    console.error('❌ Brand collaboration check error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check brand collaboration',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    const hashtags = (post.hashtags || []).map((h: any) => {
      if (typeof h === 'string') {
        return h.toLowerCase();
      } else if (h && typeof h === 'object' && h.name) {
        return h.name.toLowerCase();
      }
      return '';
    }).filter(Boolean);
    const allText = `${caption} ${hashtags.join(' ')}`;

    console.log(`🔎 Analyzing post: Caption "${caption.substring(0, 100)}..." | Hashtags: [${hashtags.slice(0, 5).join(', ')}]`);

    // Check if brand is mentioned
    const brandMentioned = brandVariations.some(variation => 
      allText.includes(variation) || hashtags.some((tag: string) => tag.includes(variation))
    );

    if (brandMentioned) {
      const postDate = post.timestamp || post.taken_at_timestamp;
      if (postDate && typeof postDate === 'number' && !isNaN(postDate)) {
        const shouldUpdate = !lastCollabDate || postDate > (new Date(lastCollabDate).getTime() / 1000);
        if (shouldUpdate) {
          try {
            lastCollabDate = new Date(postDate * 1000).toISOString().split('T')[0];
          } catch {
            console.log(`⚠️ Invalid date format for post: ${postDate}`);
          }
        }
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
    variations.push('nikespain', 'nikees', 'justdoit', 'swoosh', 'nikeair', 
                   'nikefootball', 'nikesoccer', 'niketraining', 'nikesb',
                   'mercurial', 'phantom', 'tiempo', 'nikeid', 'nikesportswear');
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

function analyzeBioForCollaboration(bio: string, brandName: string): {
  hasCollaboration: boolean;
  collaborationType: 'partnership' | 'mention' | 'none';
  confidence: number;
  evidence: string[];
} {
  const lowerBio = bio.toLowerCase();
  const brand = brandName.toLowerCase();
  const brandVariations = generateBrandVariations(brand);
  
  const evidence: string[] = [];
  let collaborationType: 'partnership' | 'mention' | 'none' = 'none';
  let confidence = 0;

  // Check if brand is mentioned in bio
  const brandMentioned = brandVariations.some(variation => lowerBio.includes(variation));
  
  if (brandMentioned) {
    // Check for partnership/ambassador keywords
    const partnershipKeywords = [
      'ambassador', 'embajador', 'embajadora', 'brand ambassador',
      'partner', 'socio', 'partnership', 'colaboración', 'colaboracion',
      'sponsored by', 'patrocinado por', 'thanks to', 'gracias a'
    ];
    
    const hasPartnershipKeywords = partnershipKeywords.some(keyword => lowerBio.includes(keyword));
    
    if (hasPartnershipKeywords) {
      collaborationType = 'partnership';
      confidence = 80;
      evidence.push(`Partnership mentioned in bio: "${bio}"`);
    } else {
      collaborationType = 'mention';
      confidence = 40;
      evidence.push(`Brand mentioned in bio: "${bio}"`);
    }
  }

  return {
    hasCollaboration: confidence > 0,
    collaborationType,
    confidence,
    evidence
  };
} 