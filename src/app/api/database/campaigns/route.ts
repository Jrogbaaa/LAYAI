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
import { throttledCreate, throttledUpdate, firebaseThrottler } from '@/lib/firebaseThrottler';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'throttler_status') {
      const stats = firebaseThrottler.getStats();
      return NextResponse.json({ 
        success: true,
        throttler: {
          ...stats,
          status: stats.queueSize > 0 ? 'processing' : 'idle',
          healthScore: stats.failedWrites > 0 ? 
            Math.max(0, 100 - (stats.failedWrites / stats.totalWrites * 100)) : 100
        }
      });
    }
    
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
          createdAt: new Date(),
          updatedAt: new Date(),
          // Enhanced campaign fields with defaults
          savedSearches: campaign.savedSearches || [],
          savedInfluencers: campaign.savedInfluencers || [],
          searchHistory: campaign.searchHistory || []
        };
        
        console.log('🔄 Throttling campaign creation to prevent Firebase resource exhaustion...');
        const createdCampaign = await throttledCreate(CAMPAIGNS_COLLECTION, newCampaign, 'normal');
        
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
          updatedAt: new Date()
        };
        
        console.log('🔄 Throttling campaign update to prevent Firebase resource exhaustion...');
        await throttledUpdate(CAMPAIGNS_COLLECTION, campaignId, updateData, 'normal');
        
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
        
        const searchUpdateData = {
          savedSearches: updatedSearches,
          searchHistory: updatedHistory,
          updatedAt: new Date()
        };
        
        console.log('🔄 Throttling campaign search update to prevent Firebase resource exhaustion...');
        await throttledUpdate(CAMPAIGNS_COLLECTION, campaignId, searchUpdateData, 'normal');
        
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
        
        const influencerUpdateData = {
          savedInfluencers: updatedInfluencers,
          updatedAt: new Date()
        };
        
        console.log('🔄 Throttling campaign influencer update to prevent Firebase resource exhaustion...');
        await throttledUpdate(CAMPAIGNS_COLLECTION, campaignId, influencerUpdateData, 'normal');
        
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
    console.error('🚨 Critical error in campaign API:', error);
    
    // Provide more specific error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isFirebaseError = errorMessage.includes('PERMISSION_DENIED') || 
                           errorMessage.includes('Firebase') ||
                           errorMessage.includes('firestore');
    
    if (isFirebaseError) {
      console.error('🔥 Firebase permission error detected. Check Firestore rules and authentication.');
      return NextResponse.json({ 
        success: false, 
        error: 'Database permission error. Please check Firebase configuration.',
        details: errorMessage,
        suggestion: 'Firebase Firestore rules may need updating for unauthenticated access during development'
      }, { status: 503 }); // Service Unavailable
    }
    
    // Log additional context for debugging
    console.error('📋 Error context:', {
      errorType: error?.constructor?.name,
      errorCode: (error as any)?.code,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    }, { status: 500 });
  }
} 