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

    let instagramAnalysis: CollaborationResult | null = null;
    let webSearchAnalysis: CollaborationResult | null = null;

    // 1. Scrape Instagram posts
    try {
      console.log(`📱 Scraping Instagram posts from @${cleanHandle}...`);
      const instagramInput = {
        username: [cleanHandle],
        resultsLimit: limitedPostsToCheck
      };

      console.log(`🔧 Instagram Input:`, JSON.stringify(instagramInput, null, 2));

      const instagramRun = await apifyClient.actor('apify/instagram-post-scraper').call(instagramInput, {
        timeout: 90000, // 1.5 minute timeout
      });

      const { items: instagramPosts } = await apifyClient.dataset(instagramRun.defaultDatasetId).listItems();
      console.log(`📊 Retrieved ${instagramPosts.length} Instagram posts for analysis`);
      
      if (instagramPosts.length > 0) {
        instagramAnalysis = analyzeBrandCollaboration(instagramPosts, brandName);
        console.log(`📱 Instagram analysis: ${instagramAnalysis.hasCollaborated ? 'FOUND' : 'NOT FOUND'} collaboration (${instagramAnalysis.confidenceScore}% confidence)`);
      }

    } catch (instagramError) {
      console.error(`❌ Instagram scraping failed:`, instagramError);
    }

    // 2. Web search for collaboration verification
    try {
      console.log(`🌐 Searching web for collaboration evidence...`);
      
      // Search for various collaboration-related queries
      const searchQueries = [
        `"${cleanHandle}" "${brandName}" collaboration`,
        `"${cleanHandle}" "${brandName}" partnership`,
        `"${cleanHandle}" "${brandName}" ambassador`,
        `"${cleanHandle}" "${brandName}" campaign`,
        `"${cleanHandle}" "${brandName}" sponsored`,
        `"${cleanHandle}" "${brandName}" deal`
      ];

      const webResults: any[] = [];
      
      // Try each search query (limit to 2-3 to avoid rate limits)
      for (let i = 0; i < Math.min(searchQueries.length, 3); i++) {
        const query = searchQueries[i];
        console.log(`🔍 Web search query ${i + 1}: "${query}"`);
        
        try {
          const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/web-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: query,
              limit: 5,
              type: 'collaboration'
            }),
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.success && searchData.results) {
              webResults.push(...searchData.results);
              console.log(`✅ Found ${searchData.results.length} web results for query: "${query}"`);
            }
          }
        } catch (searchError) {
          console.error(`❌ Web search failed for query "${query}":`, searchError);
        }
      }

      // Analyze web search results for collaboration evidence
      if (webResults.length > 0) {
        webSearchAnalysis = analyzeWebSearchForCollaboration(webResults, cleanHandle, brandName);
        console.log(`🌐 Web search analysis: ${webSearchAnalysis.hasCollaborated ? 'FOUND' : 'NOT FOUND'} collaboration (${webSearchAnalysis.confidenceScore}% confidence)`);
      }

    } catch (webSearchError) {
      console.error(`❌ Web search failed:`, webSearchError);
    }

    // 3. Combine Instagram and web search results
    const finalAnalysis = combineCollaborationAnalyses(instagramAnalysis, webSearchAnalysis, cleanHandle, brandName);

    if (finalAnalysis.hasCollaborated) {
      return NextResponse.json({
        success: true,
        collaboration: {
          hasWorkedTogether: finalAnalysis.hasCollaborated,
          collaborationType: finalAnalysis.collaborationType,
          confidence: finalAnalysis.confidenceScore,
          evidence: finalAnalysis.evidence,
          reason: 'Analyzed from Instagram posts and web search verification',
          lastCollabDate: finalAnalysis.lastCollabDate
        },
        brandName,
        influencerHandle: cleanHandle,
        postsAnalyzed: instagramAnalysis?.evidence.length || 0,
        webResultsAnalyzed: webSearchAnalysis?.evidence.length || 0,
        verificationMethods: ['Instagram', 'Web Search']
      });
    }

    // 4. Fallback: Try to get basic profile info for bio analysis
    console.log(`🔄 No collaboration found, falling back to profile bio analysis...`);
    
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
        reason: 'No collaboration found via Instagram, web search, or profile analysis',
        postsAnalyzed: instagramAnalysis?.evidence.length || 0
      },
      brandName,
      influencerHandle: cleanHandle,
      error: 'No collaboration evidence found'
    });

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
    'gifted', 'regalo', 'regalado', 'cortesía', 'cortesia',
    'challenge', 'duet challenge', 'contest', 'concurso', 'campaign', 'campaña'
  ];

  // Mention keywords
  const mentionKeywords = [
    'love', 'amo', 'encanta', 'amazing', 'increíble', 'increible',
    'using', 'usando', 'utilizo', 'with', 'con',
    'from', 'de', 'by', 'por', 'join', 'únete'
  ];

  posts.forEach((post, index) => {
    console.log(`🔎 Analyzing post: Caption "${post.caption?.substring(0, 50) || post.text?.substring(0, 50) || 'No caption'}..." | Hashtags: [${post.hashtags?.map((h: any) => typeof h === 'string' ? h : h.text || h.name || '').join(', ') || ''}]`);
    
    const postText = (post.caption || post.text || '').toLowerCase();
    const postHashtags = (post.hashtags || []).map((h: any) => 
      typeof h === 'string' ? h.toLowerCase() : (h.text || h.name || '').toLowerCase()
    );
    const postUrl = post.url || post.shortcode || '';

    // Check for brand variations in caption/text
    let brandMentioned = false;
    let mentionType = '';
    
    for (const variation of brandVariations) {
      if (postText.includes(variation)) {
        brandMentioned = true;
        mentionType = 'text';
        console.log(`✅ Brand variation "${variation}" found in text`);
        break;
      }
    }

    // Check for brand in hashtags
    if (!brandMentioned) {
      for (const variation of brandVariations) {
        if (postHashtags.some((tag: string) => tag.includes(variation))) {
          brandMentioned = true;
          mentionType = 'hashtag';
          console.log(`✅ Brand variation "${variation}" found in hashtags`);
          break;
        }
      }
    }

    // Check for brand mentions with @ symbol (tagged mentions)
    if (!brandMentioned) {
      const atMentions = postText.match(/@\w+/g) || [];
      for (const variation of brandVariations) {
        if (atMentions.some((mention: string) => mention.toLowerCase().includes(variation))) {
          brandMentioned = true;
          mentionType = 'tag';
          console.log(`✅ Brand variation "${variation}" found in @ mentions`);
          break;
        }
      }
    }

    // Enhanced collaboration detection for joint campaigns, challenges, etc.
    if (brandMentioned) {
      let isPartnership = false;
      let currentConfidence = 10; // Base confidence for brand mention

      // Check for partnership indicators
      for (const keyword of partnershipKeywords) {
        if (postText.includes(keyword.toLowerCase())) {
          isPartnership = true;
          currentConfidence += 15;
          console.log(`🤝 Partnership keyword found: "${keyword}"`);
          
          // Special boost for campaign/challenge indicators
          if (['challenge', 'campaign', 'contest', 'duet'].some(special => keyword.includes(special))) {
            currentConfidence += 20;
            console.log(`🎯 Campaign/Challenge detected - confidence boost`);
          }
          break;
        }
      }

      // Check for campaign patterns (like "X CR7" or "Brand X Influencer")
      const campaignPatterns = [
        new RegExp(`${brand}\\s*x\\s*cr7`, 'i'),
        new RegExp(`${brand}\\s*x\\s*cristiano`, 'i'),
        new RegExp(`cr7\\s*x\\s*${brand}`, 'i'),
        new RegExp(`cristiano\\s*x\\s*${brand}`, 'i'),
        new RegExp(`${brand}.*(?:challenge|contest|campaign)`, 'i'),
        new RegExp(`(?:challenge|contest|campaign).*${brand}`, 'i')
      ];

      for (const pattern of campaignPatterns) {
        if (pattern.test(postText)) {
          isPartnership = true;
          currentConfidence += 25;
          console.log(`🎪 Campaign pattern detected: ${pattern.source}`);
          break;
        }
      }

      // Check for collaboration evidence in URLs or links
      if (post.externalUrls && Array.isArray(post.externalUrls)) {
        for (const urlObj of post.externalUrls) {
          const url = (urlObj.url || '').toLowerCase();
          if (brandVariations.some(variation => url.includes(variation))) {
            isPartnership = true;
            currentConfidence += 20;
            console.log(`🔗 Brand link detected in external URLs`);
            break;
          }
        }
      }

      // Additional confidence for tagged mentions (more likely to be partnerships)
      if (mentionType === 'tag') {
        currentConfidence += 15;
        console.log(`📎 Tagged mention bonus confidence`);
      }

      // Look for mention-only indicators if not partnership
      if (!isPartnership) {
        for (const keyword of mentionKeywords) {
          if (postText.includes(keyword.toLowerCase())) {
            currentConfidence += 5;
            console.log(`💬 Mention keyword found: "${keyword}"`);
            break;
          }
        }
      }

      // Determine collaboration type and confidence
      if (isPartnership || currentConfidence >= 30) {
        collaborationType = 'partnership';
        confidenceScore = Math.max(confidenceScore, Math.min(currentConfidence, 95));
        
        // Extract evidence
        const evidenceText = (post.caption || post.text || '').substring(0, 200);
        if (evidenceText.trim()) {
          evidence.push(`Post ${index + 1}: "${evidenceText}${evidenceText.length >= 200 ? '...' : ''}"`);
        }
        
        if (post.createTime) {
          const postDate = new Date(post.createTime * 1000).toLocaleDateString();
          if (!lastCollabDate || new Date(post.createTime * 1000) > new Date(lastCollabDate)) {
            lastCollabDate = postDate;
          }
        }
        
        console.log(`📊 Analysis complete: FOUND collaboration (partnership, ${confidenceScore}% confidence)`);
      } else if (currentConfidence >= 15) {
        // Only set to mention if we haven't already found a partnership
        if (collaborationType === 'none') {
          collaborationType = 'mention';
          confidenceScore = Math.max(confidenceScore, Math.min(currentConfidence, 85));
          
          const evidenceText = (post.caption || post.text || '').substring(0, 150);
          if (evidenceText.trim()) {
            evidence.push(`Mention: "${evidenceText}${evidenceText.length >= 150 ? '...' : ''}"`);
          }
        }
        
        console.log(`📊 Analysis complete: FOUND mention (${confidenceScore}% confidence)`);
      }
    }
  });

  // Final confidence adjustment based on evidence quality
  if (collaborationType === 'partnership' && evidence.length > 1) {
    confidenceScore = Math.min(confidenceScore + 10, 98);
  }

  return {
    hasCollaborated: collaborationType !== 'none',
    collaborationType,
    evidence,
    confidenceScore: Math.round(confidenceScore),
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

function analyzeWebSearchForCollaboration(results: any[], influencerHandle: string, brandName: string): CollaborationResult {
  const evidence: string[] = [];
  let hasCollaborated = false;
  let collaborationType: 'partnership' | 'mention' | 'none' = 'none';
  let confidenceScore = 0;
  let lastCollabDate: string | undefined;

  // Analyze each result for collaboration evidence
  results.forEach((result, index) => {
    console.log(`🔎 Analyzing web result: ${result.title} | URL: ${result.url}`);
    
    const resultText = result.title.toLowerCase();
    const resultUrl = result.url.toLowerCase();

    // Check for brand variations in title
    let brandMentioned = false;
    let mentionType = '';
    
    for (const variation of generateBrandVariations(brandName.toLowerCase())) {
      if (resultText.includes(variation)) {
        brandMentioned = true;
        mentionType = 'text';
        console.log(`✅ Brand variation "${variation}" found in title`);
        break;
      }
    }

    // Check for brand in URL
    if (!brandMentioned) {
      for (const variation of generateBrandVariations(brandName.toLowerCase())) {
        if (resultUrl.includes(variation)) {
          brandMentioned = true;
          mentionType = 'url';
          console.log(`✅ Brand variation "${variation}" found in URL`);
          break;
        }
      }
    }

    // Check for brand mentions with @ symbol (tagged mentions)
    if (!brandMentioned) {
      const atMentions = resultText.match(/@\w+/g) || [];
      for (const variation of generateBrandVariations(brandName.toLowerCase())) {
        if (atMentions.some((mention: string) => mention.toLowerCase().includes(variation))) {
          brandMentioned = true;
          mentionType = 'tag';
          console.log(`✅ Brand variation "${variation}" found in @ mentions`);
          break;
        }
      }
    }

    // Enhanced collaboration detection for joint campaigns, challenges, etc.
    if (brandMentioned) {
      let isPartnership = false;
      let currentConfidence = 10; // Base confidence for brand mention

      // Check for partnership indicators
      for (const keyword of ['partnership', 'colaboración', 'colaboracion', 'sponsored', 'patrocinado', 'ad', 'publicidad', '#ad', '#publicidad', '#sponsored']) {
        if (resultText.includes(keyword.toLowerCase())) {
          isPartnership = true;
          currentConfidence += 15;
          console.log(`🤝 Partnership keyword found: "${keyword}"`);
          
          // Special boost for campaign/challenge indicators
          if (['challenge', 'campaign', 'contest', 'duet'].some(special => keyword.includes(special))) {
            currentConfidence += 20;
            console.log(`🎯 Campaign/Challenge detected - confidence boost`);
          }
          break;
        }
      }

      // Check for campaign patterns (like "X CR7" or "Brand X Influencer")
      const campaignPatterns = [
        new RegExp(`${brandName.toLowerCase()}\\s*x\\s*cr7`, 'i'),
        new RegExp(`${brandName.toLowerCase()}\\s*x\\s*cristiano`, 'i'),
        new RegExp(`cr7\\s*x\\s*${brandName.toLowerCase()}`, 'i'),
        new RegExp(`cristiano\\s*x\\s*${brandName.toLowerCase()}`, 'i'),
        new RegExp(`${brandName.toLowerCase()}.*(?:challenge|contest|campaign)`, 'i'),
        new RegExp(`(?:challenge|contest|campaign).*${brandName.toLowerCase()}`, 'i')
      ];

      for (const pattern of campaignPatterns) {
        if (pattern.test(resultText)) {
          isPartnership = true;
          currentConfidence += 25;
          console.log(`🎪 Campaign pattern detected: ${pattern.source}`);
          break;
        }
      }

      // Check for collaboration evidence in URLs or links
      if (result.externalUrls && Array.isArray(result.externalUrls)) {
        for (const urlObj of result.externalUrls) {
          const url = (urlObj.url || '').toLowerCase();
          if (generateBrandVariations(brandName.toLowerCase()).some(variation => url.includes(variation))) {
            isPartnership = true;
            currentConfidence += 20;
            console.log(`🔗 Brand link detected in external URLs`);
            break;
          }
        }
      }

      // Additional confidence for tagged mentions (more likely to be partnerships)
      if (mentionType === 'tag') {
        currentConfidence += 15;
        console.log(`📎 Tagged mention bonus confidence`);
      }

      // Look for mention-only indicators if not partnership
      if (!isPartnership) {
        for (const keyword of ['love', 'amo', 'encanta', 'amazing', 'increíble', 'increible', 'using', 'usando', 'utilizo', 'with', 'con', 'from', 'de', 'by', 'por', 'join', 'únete']) {
          if (resultText.includes(keyword.toLowerCase())) {
            currentConfidence += 5;
            console.log(`💬 Mention keyword found: "${keyword}"`);
            break;
          }
        }
      }

      // Determine collaboration type and confidence
      if (isPartnership || currentConfidence >= 30) {
        collaborationType = 'partnership';
        confidenceScore = Math.max(confidenceScore, Math.min(currentConfidence, 95));
        
        // Extract evidence
        const evidenceText = result.title.substring(0, 200);
        if (evidenceText.trim()) {
          evidence.push(`Result ${index + 1}: "${evidenceText}${evidenceText.length >= 200 ? '...' : ''}"`);
        }
        
        if (result.date) {
          const resultDate = new Date(result.date * 1000).toLocaleDateString();
          if (!lastCollabDate || new Date(result.date * 1000) > new Date(lastCollabDate)) {
            lastCollabDate = resultDate;
          }
        }
        
        console.log(`📊 Analysis complete: FOUND collaboration (partnership, ${confidenceScore}% confidence)`);
      } else if (currentConfidence >= 15) {
        // Only set to mention if we haven't already found a partnership
        if (collaborationType === 'none') {
          collaborationType = 'mention';
          confidenceScore = Math.max(confidenceScore, Math.min(currentConfidence, 85));
          
          const evidenceText = result.title.substring(0, 150);
          if (evidenceText.trim()) {
            evidence.push(`Mention: "${evidenceText}${evidenceText.length >= 150 ? '...' : ''}"`);
          }
        }
        
        console.log(`📊 Analysis complete: FOUND mention (${confidenceScore}% confidence)`);
      }

      // Update hasCollaborated flag
      hasCollaborated = isPartnership || currentConfidence >= 30;
    }
  });

  // Final confidence adjustment based on evidence quality
  if (collaborationType === 'partnership' && evidence.length > 1) {
    confidenceScore = Math.min(confidenceScore + 10, 98);
  }

  return {
    hasCollaborated,
    collaborationType,
    evidence,
    confidenceScore: Math.round(confidenceScore),
    lastCollabDate
  };
}

function combineCollaborationAnalyses(instagramAnalysis: CollaborationResult | null, webSearchAnalysis: CollaborationResult | null, influencerHandle: string, brandName: string): CollaborationResult {
  const evidence: string[] = [];
  let hasCollaborated = false;
  let collaborationType: 'partnership' | 'mention' | 'none' = 'none';
  let confidenceScore = 0;
  let lastCollabDate: string | undefined;

  if (instagramAnalysis) {
    hasCollaborated = instagramAnalysis.hasCollaborated;
    collaborationType = instagramAnalysis.collaborationType;
    confidenceScore = instagramAnalysis.confidenceScore;
    evidence.push(...instagramAnalysis.evidence);
    if (instagramAnalysis.lastCollabDate) {
      lastCollabDate = instagramAnalysis.lastCollabDate;
    }
  }

  if (webSearchAnalysis) {
    hasCollaborated = hasCollaborated || webSearchAnalysis.hasCollaborated;
    if (webSearchAnalysis.collaborationType === 'partnership') {
      collaborationType = 'partnership';
      confidenceScore = Math.max(confidenceScore, webSearchAnalysis.confidenceScore);
    } else if (webSearchAnalysis.collaborationType === 'mention') {
      collaborationType = 'mention';
      confidenceScore = Math.max(confidenceScore, webSearchAnalysis.confidenceScore);
    }
    evidence.push(...webSearchAnalysis.evidence);
    if (webSearchAnalysis.lastCollabDate) {
      lastCollabDate = webSearchAnalysis.lastCollabDate;
    }
  }

  // Final confidence adjustment based on evidence quality
  if (collaborationType === 'partnership' && evidence.length > 1) {
    confidenceScore = Math.min(confidenceScore + 10, 98);
  }

  return {
    hasCollaborated,
    collaborationType,
    evidence,
    confidenceScore: Math.round(confidenceScore),
    lastCollabDate
  };
} 