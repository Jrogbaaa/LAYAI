import { NextRequest, NextResponse } from 'next/server';
import { UnifiedBriefProcessor } from '@/lib/briefProcessor';
import { EnhancedMatchingService } from '@/lib/enhancedMatchingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, inputType, searchStrategy } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Starting enhanced brief processing and matching...');
    
    // Step 1: Process the brief (text, PDF, or URL)
    console.log('📋 Processing campaign brief...');
    const processedBrief = await UnifiedBriefProcessor.processBrief(
      input,
      inputType || 'text'
    );

    console.log('✅ Brief processed:', {
      brandName: processedBrief.brandName,
      niche: processedBrief.niche,
      geography: processedBrief.geography,
      confidence: processedBrief.confidence
    });

    // Step 2: Find matching influencers
    console.log('🔍 Finding matching influencers...');
    const matchingResults = await EnhancedMatchingService.findMatches(
      processedBrief,
      searchStrategy || 'broad'
    );

    console.log('✅ Matching complete:', {
      totalFound: matchingResults.summary.totalFound,
      averageScore: matchingResults.summary.averageScore,
      topCategories: matchingResults.summary.topCategories
    });

    // Step 3: Format response
    const response = {
      success: true,
      brief: {
        ...processedBrief,
        // Clean dates for JSON serialization
        extractedAt: processedBrief.extractedAt.toISOString()
      },
      matching: {
        ...matchingResults,
        matches: matchingResults.matches.map(match => ({
          ...match,
          metadata: {
            ...match.metadata,
            lastUpdated: match.metadata.lastUpdated.toISOString()
          }
        }))
      },
      processing: {
        timestamp: new Date().toISOString(),
        strategy: searchStrategy || 'broad',
        inputType: inputType || 'text'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Enhanced brief matching error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing with example briefs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const example = searchParams.get('example');

  const examples = {
    ikea: {
      input: `Brand: IKEA
      Campaign: New furniture collection launch
      Target audience: Young professionals aged 25-35, interested in home decor and minimalist design
      Geography: Spain, with focus on Madrid and Barcelona
      Budget: €5,000 - €15,000
      Platforms: Instagram, TikTok
      Content: Posts showcasing furniture styling, room makeovers, sustainable living tips
      Timeline: 2 months
      Tone: Authentic, sustainable, accessible luxury`,
      inputType: 'text',
      searchStrategy: 'broad'
    },
    nike: {
      input: `NIKE FITNESS CAMPAIGN BRIEF
      
      Brand: Nike
      Campaign Type: Product Launch - New Running Shoes
      Industry: Sports & Fitness
      
      Target Audience:
      - Age: 22-40 years
      - Gender: Mixed (slight male preference)
      - Interests: Running, fitness, healthy lifestyle
      - Geography: Spain (national campaign)
      
      Budget: €20,000 - €35,000
      Influencer Count: 8-12 influencers
      
      Platforms: Instagram (primary), TikTok (secondary)
      Content Types: Reels, Stories, Posts
      
      Campaign Goals:
      - Product awareness
      - Drive sales
      - Build community
      
      Tone: Motivational, authentic, performance-focused
      Values: Excellence, innovation, inclusivity
      
      Timeline: 6 weeks
      Deliverables: 2 posts + 3 stories per influencer`,
      inputType: 'text',
      searchStrategy: 'exact'
    },
    discovery: {
      input: `Beauty brand looking for Spanish micro-influencers. 
      Budget around €8,000 total. 
      Focus on skincare and natural beauty.
      Target women 20-35 years old.
      Need authentic content creators with engaged audiences.`,
      inputType: 'text',
      searchStrategy: 'discovery'
    }
  };

  if (example && examples[example as keyof typeof examples]) {
    const exampleData = examples[example as keyof typeof examples];
    
    try {
      // Process the example
      const processedBrief = await UnifiedBriefProcessor.processBrief(
        exampleData.input,
        exampleData.inputType as 'text'
      );

      const matchingResults = await EnhancedMatchingService.findMatches(
        processedBrief,
        exampleData.searchStrategy as any
      );

      return NextResponse.json({
        success: true,
        example: example,
        brief: {
          ...processedBrief,
          extractedAt: processedBrief.extractedAt.toISOString()
        },
        matching: {
          ...matchingResults,
          matches: matchingResults.matches.slice(0, 5).map(match => ({
            influencer: {
              name: match.influencer.name || match.influencer.username,
              handle: match.influencer.handle || match.influencer.username,
              platform: match.influencer.platform,
              followerCount: match.influencer.followerCount,
              engagementRate: match.influencer.engagementRate,
              niche: match.influencer.niche
            },
            scores: match.scores,
            explanations: {
              whyGoodMatch: match.explanations.whyGoodMatch.slice(0, 2),
              potentialConcerns: match.explanations.potentialConcerns.slice(0, 1)
            },
            predictions: match.predictions
          }))
        }
      });

    } catch (error) {
      console.error('Example processing error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to process example',
        availableExamples: Object.keys(examples)
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Enhanced Brief Processing & Matching API',
    usage: {
      POST: {
        description: 'Process a campaign brief and find matching influencers',
        body: {
          input: 'Campaign brief text or file',
          inputType: 'text | pdf | url',
          searchStrategy: 'exact | broad | discovery'
        }
      },
      GET: {
        description: 'Test with example briefs',
        examples: Object.keys(examples),
        usage: '?example=ikea'
      }
    },
    examples: {
      ikea: 'Home furnishing campaign with specific targeting',
      nike: 'Sports campaign with detailed requirements',
      discovery: 'Simple brief for discovery-mode matching'
    }
  });
} 