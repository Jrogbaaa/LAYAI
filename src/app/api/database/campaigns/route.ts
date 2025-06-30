import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load campaigns from file
async function loadCampaigns() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CAMPAIGNS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save campaigns to file
async function saveCampaigns(campaigns: any[]) {
  await ensureDataDir();
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
}

export async function GET() {
  try {
    const campaigns = await loadCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return NextResponse.json({ success: false, error: 'Failed to load campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, campaign, campaignId, field, value, savedSearch, historyEntry, savedInfluencer } = body;

    const campaigns = await loadCampaigns();

    switch (action) {
      case 'create':
      case 'create_enhanced':
        const newCampaign = {
          id: `campaign_${Date.now()}`,
          ...campaign,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Enhanced campaign fields with defaults
          savedSearches: campaign.savedSearches || [],
          savedInfluencers: campaign.savedInfluencers || [],
          searchHistory: campaign.searchHistory || []
        };
        campaigns.push(newCampaign);
        await saveCampaigns(campaigns);
        return NextResponse.json({ success: true, campaign: newCampaign });

      case 'update':
        const campaignIndex = campaigns.findIndex((c: any) => c.id === campaignId);
        if (campaignIndex === -1) {
          return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
        }
        
        // 🔒 Preserve critical fields when updating
        const originalCampaign = campaigns[campaignIndex];
        campaigns[campaignIndex] = {
          ...originalCampaign,
          [field]: value,
          updatedAt: new Date().toISOString(),
          // 📅 Ensure dates are preserved unless explicitly being updated
          startDate: field === 'startDate' ? value : originalCampaign.startDate,
          endDate: field === 'endDate' ? value : originalCampaign.endDate,
          createdAt: originalCampaign.createdAt, // Never overwrite creation date
        };
        await saveCampaigns(campaigns);
        return NextResponse.json({ success: true, campaign: campaigns[campaignIndex] });

      case 'add_search':
        const searchCampaignIndex = campaigns.findIndex((c: any) => c.id === campaignId);
        if (searchCampaignIndex === -1) {
          return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
        }
        
        // Add search to existing campaign
        campaigns[searchCampaignIndex].savedSearches = campaigns[searchCampaignIndex].savedSearches || [];
        campaigns[searchCampaignIndex].searchHistory = campaigns[searchCampaignIndex].searchHistory || [];
        
        campaigns[searchCampaignIndex].savedSearches.push(savedSearch);
        campaigns[searchCampaignIndex].searchHistory.push(historyEntry);
        campaigns[searchCampaignIndex].updatedAt = new Date().toISOString();
        
        await saveCampaigns(campaigns);
        return NextResponse.json({ success: true, campaign: campaigns[searchCampaignIndex] });

      case 'add_influencer':
        const influencerCampaignIndex = campaigns.findIndex((c: any) => c.id === campaignId);
        if (influencerCampaignIndex === -1) {
          return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
        }
        
        // Add influencer to existing campaign
        campaigns[influencerCampaignIndex].savedInfluencers = campaigns[influencerCampaignIndex].savedInfluencers || [];
        campaigns[influencerCampaignIndex].savedInfluencers.push(savedInfluencer);
        campaigns[influencerCampaignIndex].updatedAt = new Date().toISOString();
        
        await saveCampaigns(campaigns);
        return NextResponse.json({ success: true, campaign: campaigns[influencerCampaignIndex] });

      case 'delete':
        const filteredCampaigns = campaigns.filter((c: any) => c.id !== campaignId);
        await saveCampaigns(filteredCampaigns);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling campaign request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
} 