const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Research-based demographic patterns by niche (from your provided research)
const NICHE_DEMOGRAPHICS = {
  // Fitness niches
  'Fitness': {
    gender: { male: 67, female: 31, other: 2 },
    ageGroups: { '13-17': 5, '18-24': 38, '25-34': 42, '35-44': 12, '45-54': 2, '55+': 1 },
    interests: ['Health', 'Nutrition', 'Wellness', 'Sports']
  },
  'Sports': {
    gender: { male: 73, female: 25, other: 2 },
    ageGroups: { '13-17': 8, '18-24': 45, '25-34': 35, '35-44': 10, '45-54': 2, '55+': 0 },
    interests: ['Competition', 'Training', 'Athletics', 'Performance']
  },
  
  // Beauty & Fashion niches
  'Beauty': {
    gender: { male: 18, female: 80, other: 2 },
    ageGroups: { '13-17': 8, '18-24': 42, '25-34': 35, '35-44': 12, '45-54': 2, '55+': 1 },
    interests: ['Skincare', 'Makeup', 'Fashion', 'Self-care']
  },
  'Fashion': {
    gender: { male: 25, female: 72, other: 3 },
    ageGroups: { '13-17': 8, '18-24': 42, '25-34': 35, '35-44': 12, '45-54': 2, '55+': 1 },
    interests: ['Style', 'Trends', 'Shopping', 'Design']
  },
  'Skincare': {
    gender: { male: 22, female: 76, other: 2 },
    ageGroups: { '13-17': 5, '18-24': 35, '25-34': 40, '35-44': 15, '45-54': 4, '55+': 1 },
    interests: ['Skincare', 'Dermatology', 'Ingredients', 'Beauty']
  },
  
  // Tech & Gaming niches
  'Technology': {
    gender: { male: 75, female: 23, other: 2 },
    ageGroups: { '13-17': 3, '18-24': 25, '25-34': 45, '35-44': 20, '45-54': 5, '55+': 2 },
    interests: ['Innovation', 'Startups', 'Education', 'Tech']
  },
  'Gaming': {
    gender: { male: 77, female: 21, other: 2 },
    ageGroups: { '13-17': 12, '18-24': 45, '25-34': 28, '35-44': 12, '45-54': 2, '55+': 1 },
    interests: ['Esports', 'Gaming Hardware', 'Competition', 'Entertainment']
  },
  
  // Food & Lifestyle niches
  'Food': {
    gender: { male: 35, female: 63, other: 2 },
    ageGroups: { '13-17': 3, '18-24': 28, '25-34': 38, '35-44': 25, '45-54': 5, '55+': 1 },
    interests: ['Cooking', 'Recipes', 'Restaurants', 'Nutrition']
  },
  'Lifestyle': {
    gender: { male: 25, female: 72, other: 3 },
    ageGroups: { '13-17': 5, '18-24': 30, '25-34': 35, '35-44': 20, '45-54': 8, '55+': 2 },
    interests: ['Travel', 'Food', 'Fashion', 'Wellness']
  },
  'Travel': {
    gender: { male: 42, female: 56, other: 2 },
    ageGroups: { '13-17': 2, '18-24': 35, '25-34': 40, '35-44': 18, '45-54': 4, '55+': 1 },
    interests: ['Photography', 'Adventure', 'Culture', 'Exploration']
  },
  
  // Entertainment & Music niches
  'Music': {
    gender: { male: 62, female: 36, other: 2 },
    ageGroups: { '13-17': 12, '18-24': 45, '25-34': 28, '35-44': 12, '45-54': 2, '55+': 1 },
    interests: ['Concerts', 'Entertainment', 'Culture', 'Artists']
  },
  'Entertainment': {
    gender: { male: 45, female: 53, other: 2 },
    ageGroups: { '13-17': 10, '18-24': 40, '25-34': 30, '35-44': 15, '45-54': 4, '55+': 1 },
    interests: ['Movies', 'TV', 'Celebrity', 'Culture']
  },
  
  // Business & Education niches
  'Business': {
    gender: { male: 65, female: 33, other: 2 },
    ageGroups: { '13-17': 1, '18-24': 20, '25-34': 45, '35-44': 25, '45-54': 8, '55+': 1 },
    interests: ['Entrepreneurship', 'Finance', 'Leadership', 'Career']
  },
  'Education': {
    gender: { male: 45, female: 53, other: 2 },
    ageGroups: { '13-17': 3, '18-24': 25, '25-34': 45, '35-44': 20, '45-54': 5, '55+': 2 },
    interests: ['Learning', 'Teaching', 'Knowledge', 'Skills']
  },
  
  // Health & Wellness niches
  'Health': {
    gender: { male: 35, female: 63, other: 2 },
    ageGroups: { '13-17': 2, '18-24': 25, '25-34': 40, '35-44': 25, '45-54': 7, '55+': 1 },
    interests: ['Wellness', 'Nutrition', 'Medicine', 'Lifestyle']
  },
  'Wellness': {
    gender: { male: 28, female: 70, other: 2 },
    ageGroups: { '13-17': 3, '18-24': 30, '25-34': 42, '35-44': 20, '45-54': 4, '55+': 1 },
    interests: ['Mindfulness', 'Self-care', 'Mental Health', 'Balance']
  },
  
  // Default fallback for unknown niches
  'General': {
    gender: { male: 45, female: 52, other: 3 },
    ageGroups: { '13-17': 5, '18-24': 30, '25-34': 35, '35-44': 20, '45-54': 8, '55+': 2 },
    interests: ['Lifestyle', 'Entertainment', 'Social Media', 'Culture']
  }
};

// Spanish cities for location data
const SPANISH_LOCATIONS = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 
  'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Córdoba', 
  'Alicante', 'Vigo', 'Gijón', 'Zaragoza'
];

function inferDemographicsFromNiche(influencer) {
  // Get the primary niche
  let primaryNiche = 'General';
  
  if (influencer.niche && Array.isArray(influencer.niche) && influencer.niche.length > 0) {
    primaryNiche = influencer.niche[0];
  } else if (influencer.category) {
    primaryNiche = influencer.category;
  }
  
  // Find the best matching demographic pattern
  let demographics = NICHE_DEMOGRAPHICS[primaryNiche] || NICHE_DEMOGRAPHICS['General'];
  
  // Check for partial matches if exact match not found
  if (!NICHE_DEMOGRAPHICS[primaryNiche]) {
    for (const [niche, data] of Object.entries(NICHE_DEMOGRAPHICS)) {
      if (primaryNiche.toLowerCase().includes(niche.toLowerCase()) || 
          niche.toLowerCase().includes(primaryNiche.toLowerCase())) {
        demographics = data;
        break;
      }
    }
  }
  
  // Add some realistic variation (±3-7%)
  const variation = (Math.random() - 0.5) * 14; // -7% to +7%
  const adjustedMale = Math.max(5, Math.min(95, demographics.gender.male + variation));
  const adjustedFemale = Math.max(5, Math.min(95, 100 - adjustedMale - demographics.gender.other));
  
  // Generate location data based on follower count
  let topLocations = ['Madrid', 'Barcelona', 'Valencia'];
  if (influencer.followerCount > 1000000) {
    topLocations = SPANISH_LOCATIONS.slice(0, 5);
  } else if (influencer.followerCount > 500000) {
    topLocations = SPANISH_LOCATIONS.slice(0, 4);
  } else if (influencer.followerCount < 100000) {
    // Smaller influencers get more localized audiences
    const randomCities = SPANISH_LOCATIONS.slice(3).sort(() => 0.5 - Math.random()).slice(0, 2);
    topLocations = ['Madrid', 'Barcelona'].concat(randomCities);
  }
  
  return {
    ageGroups: demographics.ageGroups,
    gender: {
      male: Math.round(adjustedMale),
      female: Math.round(adjustedFemale),
      other: demographics.gender.other
    },
    topLocations: topLocations.slice(0, 3),
    interests: demographics.interests
  };
}

async function updateInfluencerDemographics() {
  try {
    console.log('🚀 Starting influencer demographics update...');
    
    // Get all influencers from Firestore
    const influencersSnapshot = await db.collection('influencers').get();
    console.log(`📊 Found ${influencersSnapshot.size} influencers in database`);
    
    const batch = db.batch();
    let updateCount = 0;
    
    influencersSnapshot.forEach(doc => {
      const influencer = doc.data();
      
      // Generate research-based demographics
      const audienceDemographics = inferDemographicsFromNiche(influencer);
      
      // Update the document
      batch.update(doc.ref, {
        audienceDemographics: audienceDemographics,
        demographicsUpdated: admin.firestore.FieldValue.serverTimestamp(),
        demographicsSource: 'research_based_inference'
      });
      
      updateCount++;
      
      if (updateCount % 100 === 0) {
        console.log(`📈 Processed ${updateCount} influencers...`);
      }
    });
    
    // Commit the batch update
    await batch.commit();
    
    console.log(`✅ Successfully updated ${updateCount} influencers with research-based demographics!`);
    console.log('🎯 All influencers now have realistic, niche-specific audience data');
    
  } catch (error) {
    console.error('❌ Error updating influencer demographics:', error);
  } finally {
    // Close the Firebase connection
    admin.app().delete();
  }
}

// Run the update
updateInfluencerDemographics(); 