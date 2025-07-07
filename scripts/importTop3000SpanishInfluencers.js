const fs = require('fs');
const csv = require('csv-parser');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, writeBatch } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to parse follower count (e.g., "67M" -> 67000000)
function parseFollowerCount(followerStr) {
  if (!followerStr) return 0;
  
  const str = followerStr.toString().toUpperCase();
  const num = parseFloat(str);
  
  if (str.includes('M')) {
    return Math.round(num * 1000000);
  } else if (str.includes('K')) {
    return Math.round(num * 1000);
  } else {
    return Math.round(num);
  }
}

// Function to parse engagement rate (e.g., "1.65%" -> 1.65)
function parseEngagementRate(engagementStr) {
  if (!engagementStr) return 0;
  return parseFloat(engagementStr.toString().replace('%', ''));
}

// Function to extract Instagram handle from name field
function extractInstagramHandle(nameField) {
  if (!nameField) return null;
  
  // Look for @handle pattern
  const handleMatch = nameField.match(/@([a-zA-Z0-9._]+)/);
  if (handleMatch) {
    return handleMatch[1];
  }
  
  // If no @ found, try to extract from the name
  const lines = nameField.split('\n');
  for (const line of lines) {
    if (line.startsWith('@')) {
      return line.substring(1);
    }
  }
  
  return null;
}

// Function to extract display name from name field
function extractDisplayName(nameField) {
  if (!nameField) return 'Unknown';
  
  const lines = nameField.split('\n');
  // First line is usually the display name
  return lines[0].trim();
}

// Function to parse genres and map them to our niche categories
function parseGenres(genreStr) {
  if (!genreStr) return ['Lifestyle'];
  
  const genres = [];
  const genreStr_lower = genreStr.toLowerCase();
  
  // Map genres to our standard categories
  const genreMapping = {
    'lifestyle': 'Lifestyle',
    'fashion': 'Fashion',
    'beauty': 'Beauty',
    'fitness': 'Fitness',
    'health': 'Health',
    'food': 'Food',
    'travel': 'Travel',
    'sports': 'Sports',
    'soccer': 'Sports',
    'tennis': 'Sports',
    'music': 'Music',
    'entertainment': 'Entertainment',
    'gaming': 'Gaming',
    'games': 'Gaming',
    'education': 'Education',
    'business': 'Business',
    'finance': 'Business',
    'art': 'Art',
    'photography': 'Photography',
    'modeling': 'Fashion',
    'actors': 'Entertainment',
    'celebrity': 'Entertainment',
    'cooking': 'Food',
    'automotive': 'Automotive',
    'technology': 'Technology',
    'parenting': 'Parenting',
    'family': 'Parenting'
  };
  
  // Check each mapping
  for (const [key, value] of Object.entries(genreMapping)) {
    if (genreStr_lower.includes(key)) {
      if (!genres.includes(value)) {
        genres.push(value);
      }
    }
  }
  
  // If no genres found, default to Lifestyle
  if (genres.length === 0) {
    genres.push('Lifestyle');
  }
  
  return genres;
}

// Function to estimate gender from name (basic heuristic)
function estimateGender(name) {
  const femaleNames = ['maria', 'ana', 'carmen', 'pilar', 'elena', 'sara', 'laura', 'paula', 'lucia', 'alba', 'clara', 'marta', 'nuria', 'cristina', 'andrea', 'sofia', 'daniela', 'victoria', 'alejandra', 'georgina', 'ursula', 'cindy', 'neiva', 'penelope', 'elsa', 'itziar', 'najwa', 'blanca', 'zaida', 'aida', 'leticia'];
  const maleNames = ['sergio', 'gareth', 'andres', 'isco', 'alvaro', 'lucas', 'gerard', 'rafa', 'iker', 'enrique', 'jordi', 'marc', 'david', 'marco', 'cesc', 'thibaut', 'nacho', 'pedri', 'carles', 'ibai', 'xabi', 'ansu', 'manu', 'daniel', 'diego', 'mario', 'juan', 'alejandro', 'miguel', 'naim', 'pablo', 'sergi', 'roberto', 'ferran', 'ander', 'magno', 'joaquin', 'jon', 'horacio', 'fede', 'antonio', 'hector', 'cesar', 'inigo', 'abraham', 'oscar', 'luis', 'abraham'];
  
  const nameLower = name.toLowerCase();
  
  for (const femaleName of femaleNames) {
    if (nameLower.includes(femaleName)) {
      return 'Female';
    }
  }
  
  for (const maleName of maleNames) {
    if (nameLower.includes(maleName)) {
      return 'Male';
    }
  }
  
  return 'Other'; // Default when unsure
}

// Function to determine age range based on follower count and engagement (heuristic)
function estimateAgeRange(followers, engagement) {
  if (followers > 10000000) {
    return '25-34'; // Mega influencers tend to be in prime age
  } else if (followers > 1000000) {
    return engagement > 5 ? '18-24' : '25-34'; // High engagement = younger audience
  } else if (followers > 100000) {
    return engagement > 8 ? '18-24' : '25-34';
  } else {
    return engagement > 10 ? '18-24' : '25-34';
  }
}

// Function to convert CSV row to influencer object
function convertToInfluencer(row, rank) {
  const handle = extractInstagramHandle(row.Name);
  const displayName = extractDisplayName(row.Name);
  const followers = parseFollowerCount(row.Followers);
  const engagement = parseEngagementRate(row['Engagement Rate']);
  const genres = parseGenres(row.GENRE);
  const gender = estimateGender(displayName);
  const ageRange = estimateAgeRange(followers, engagement);
  
  return {
    id: handle || `influencer_${rank}`,
    name: displayName,
    handle: handle || displayName.toLowerCase().replace(/\s+/g, ''),
    platform: 'Instagram',
    followerCount: followers,
    engagementRate: engagement / 100, // Convert percentage to decimal
    ageRange: ageRange,
    gender: gender,
    location: 'Spain',
    niche: genres,
    contentStyle: ['Posts', 'Stories'], // Default content styles
    pastCollaborations: [],
    averageRate: Math.floor(followers / 100) || 500, // Estimate based on followers
    costLevel: followers > 5000000 ? 'Premium' : followers > 1000000 ? 'High-End' : followers > 100000 ? 'Mid-Range' : 'Budget-Friendly',
    audienceDemographics: {
      ageGroups: {
        '13-17': ageRange === '18-24' ? 15 : 5,
        '18-24': ageRange === '18-24' ? 45 : 25,
        '25-34': ageRange === '25-34' ? 40 : 30,
        '35-44': ageRange === '35-44' ? 35 : 20,
        '45-54': 10,
        '55+': 5,
      },
      gender: {
        male: gender === 'Male' ? 60 : gender === 'Female' ? 35 : 50,
        female: gender === 'Female' ? 65 : gender === 'Male' ? 40 : 47,
        other: 3,
      },
      topLocations: ['Spain', 'Madrid', 'Barcelona'],
      interests: genres,
    },
    recentPosts: [],
    contactInfo: {
      email: null,
      preferredContact: 'Instagram DM',
    },
    isActive: true,
    lastUpdated: new Date(),
    // Additional metadata
    rank: rank,
    originalGenres: row.GENRE,
    country: row.Country,
    verified: followers > 1000000, // Assume verified if > 1M followers
    tags: genres.map(g => g.toLowerCase()),
    searchKeywords: [
      displayName.toLowerCase(),
      handle ? handle.toLowerCase() : '',
      ...genres.map(g => g.toLowerCase()),
      'spain',
      'spanish',
      'español'
    ].filter(Boolean)
  };
}

// Main import function
async function importInfluencers() {
  console.log('🚀 Starting import of top 3000 Spanish influencers...');
  
  try {
    // Step 1: Clear existing Spanish influencers
    console.log('🗑️ Clearing existing Spanish influencers...');
    const existingInfluencers = await getDocs(collection(db, 'vettedInfluencers'));
    
    const batch = writeBatch(db);
    let deleteCount = 0;
    
    existingInfluencers.forEach((doc) => {
      const data = doc.data();
      if (data.location === 'Spain' || data.country === 'Spain') {
        batch.delete(doc.ref);
        deleteCount++;
      }
    });
    
    if (deleteCount > 0) {
      await batch.commit();
      console.log(`✅ Deleted ${deleteCount} existing Spanish influencers`);
    }
    
    // Step 2: Read and process CSV
    console.log('📖 Reading CSV file...');
    const csvPath = '/Users/JackEllis/Desktop/top 3000 influencers in spain  - Sheet1 (2).csv';
    const influencers = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const rank = parseInt(row.Rank);
          if (rank && rank <= 3000) { // Only process top 3000
            const influencer = convertToInfluencer(row, rank);
            influencers.push(influencer);
          }
        })
        .on('end', async () => {
          try {
            console.log(`📊 Processed ${influencers.length} influencers from CSV`);
            
            // Step 3: Upload to Firebase in batches
            console.log('☁️ Uploading to Firebase...');
            const batchSize = 500; // Firebase batch limit
            let uploadCount = 0;
            
            for (let i = 0; i < influencers.length; i += batchSize) {
              const batch = writeBatch(db);
              const batchInfluencers = influencers.slice(i, i + batchSize);
              
              batchInfluencers.forEach((influencer) => {
                const docRef = doc(db, 'vettedInfluencers', influencer.id);
                batch.set(docRef, influencer);
              });
              
              await batch.commit();
              uploadCount += batchInfluencers.length;
              console.log(`✅ Uploaded batch ${Math.ceil((i + batchSize) / batchSize)} - ${uploadCount}/${influencers.length} influencers`);
            }
            
            // Step 4: Update metadata
            const metadataRef = doc(db, 'metadata', 'vettedInfluencers');
            await setDoc(metadataRef, {
              totalCount: influencers.length,
              lastUpdated: new Date(),
              source: 'Top 3000 Spanish Influencers CSV',
              countries: ['Spain'],
              genres: [...new Set(influencers.flatMap(i => i.niche))],
              followerRanges: {
                nano: influencers.filter(i => i.followerCount < 10000).length,
                micro: influencers.filter(i => i.followerCount >= 10000 && i.followerCount < 100000).length,
                macro: influencers.filter(i => i.followerCount >= 100000 && i.followerCount < 1000000).length,
                mega: influencers.filter(i => i.followerCount >= 1000000).length,
              }
            });
            
            console.log('🎉 Import completed successfully!');
            console.log(`📊 Total influencers imported: ${influencers.length}`);
            console.log(`📈 Follower distribution:`);
            console.log(`   - Nano (< 10K): ${influencers.filter(i => i.followerCount < 10000).length}`);
            console.log(`   - Micro (10K-100K): ${influencers.filter(i => i.followerCount >= 10000 && i.followerCount < 100000).length}`);
            console.log(`   - Macro (100K-1M): ${influencers.filter(i => i.followerCount >= 100000 && i.followerCount < 1000000).length}`);
            console.log(`   - Mega (1M+): ${influencers.filter(i => i.followerCount >= 1000000).length}`);
            console.log(`🎯 Genres covered: ${[...new Set(influencers.flatMap(i => i.niche))].join(', ')}`);
            
            resolve();
          } catch (error) {
            console.error('❌ Error during upload:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV:', error);
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Run the import
if (require.main === module) {
  importInfluencers()
    .then(() => {
      console.log('✅ Import process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import process failed:', error);
      process.exit(1);
    });
}

module.exports = { importInfluencers }; 