import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';

const CAMPAIGNS_COLLECTION = 'campaigns';

// Load campaigns from Firebase
async function loadCampaigns() {
  try {
    const q = query(
      collection(db, CAMPAIGNS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('Error loading campaigns from Firebase:', error);
    return [];
  }
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

    switch (action) {
      case 'create':
      case 'create_enhanced':
        const newCampaign = {
          ...campaign,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          // Enhanced campaign fields with defaults
          savedSearches: campaign.savedSearches || [],
          savedInfluencers: campaign.savedInfluencers || [],
          searchHistory: campaign.searchHistory || []
        };
        
        const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), newCampaign);
        const createdCampaign = {
          id: docRef.id,
          ...newCampaign,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return NextResponse.json({ success: true, campaign: createdCampaign });

      case 'update':
        if (!campaignId) {
          return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });
        }
        
        const campaignRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        const campaignDoc = await getDoc(campaignRef);
        
        if (!campaignDoc.exists()) {
          return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
        }
        
        const updateData = {
          [field]: value,
          updatedAt: Timestamp.now()
        };
        
        await updateDoc(campaignRef, updateData);
        
        const updatedCampaign = {
          id: campaignId,
          ...campaignDoc.data(),
          [field]: value,
          updatedAt: new Date()
        };
        
        return NextResponse.json({ success: true, campaign: updatedCampaign });

      case 'add_search':
        if (!campaignId) {
          return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });
        }
        
        const searchCampaignRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        const searchCampaignDoc = await getDoc(searchCampaignRef);
        
        if (!searchCampaignDoc.exists()) {
          return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
        }
        
        const currentData = searchCampaignDoc.data();
        const updatedSearches = [...(currentData.savedSearches || []), savedSearch];
        const updatedHistory = [...(currentData.searchHistory || []), historyEntry];
        
        await updateDoc(searchCampaignRef, {
          savedSearches: updatedSearches,
          searchHistory: updatedHistory,
          updatedAt: Timestamp.now()
        });
        
        const updatedSearchCampaign = {
          id: campaignId,
          ...currentData,
          savedSearches: updatedSearches,
          searchHistory: updatedHistory,
          updatedAt: new Date()
        };
        
        return NextResponse.json({ success: true, campaign: updatedSearchCampaign });

      case 'add_influencer':
        if (!campaignId) {
          return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });
        }
        
        const influencerCampaignRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        const influencerCampaignDoc = await getDoc(influencerCampaignRef);
        
        if (!influencerCampaignDoc.exists()) {
          return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
        }
        
        const currentInfluencerData = influencerCampaignDoc.data();
        const updatedInfluencers = [...(currentInfluencerData.savedInfluencers || []), savedInfluencer];
        
        await updateDoc(influencerCampaignRef, {
          savedInfluencers: updatedInfluencers,
          updatedAt: Timestamp.now()
        });
        
        const updatedInfluencerCampaign = {
          id: campaignId,
          ...currentInfluencerData,
          savedInfluencers: updatedInfluencers,
          updatedAt: new Date()
        };
        
        return NextResponse.json({ success: true, campaign: updatedInfluencerCampaign });

      case 'delete':
        if (!campaignId) {
          return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });
        }
        
        const deleteCampaignRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        await deleteDoc(deleteCampaignRef);
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling campaign request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
} 