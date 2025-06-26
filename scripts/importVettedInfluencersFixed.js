const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, limit } = require('firebase/firestore');
const fs = require('fs');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase configuration from your env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);

// Helper functions
function parseFollowers(followerStr) {
  if (!followerStr) return 0;
  
  const cleanStr = followerStr.replace(/,/g, '').toLowerCase();
  
  if (cleanStr.includes('m')) {
    return Math.round(parseFloat(cleanStr) * 1000000);
  } else if (cleanStr.includes('k')) {
    return Math.round(parseFloat(cleanStr) * 1000);
  } else {
    return parseInt(cleanStr) || 0;
  }
}

function parseEngagementRate(rateStr) {
  if (!rateStr) return 0;
  const cleaned = rateStr.replace('%', '');
  return parseFloat(cleaned) / 100 || 0;
}

function extractUsername(nameField) {
  const match = nameField.match(/@([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

function extractDisplayName(nameField) {
  const lines = nameField.split('\n');
  return lines[0].trim() || 'Unknown';
}

function parseGenres(genreStr) {
  if (!genreStr) return ['Lifestyle'];
  
  // Split on capital letters to separate concatenated words
  const separated = genreStr.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Common genre mappings
  const genreMap = {
    'Sports': 'Sports',
    'Soccer': 'Sports', 
    'Football': 'Sports',
    'Tennis': 'Sports',
    'Basketball': 'Sports',
    'Fashion': 'Fashion',
    'Beauty': 'Beauty',
    'Lifestyle': 'Lifestyle',
    'Entertainment': 'Entertainment',
    'Music': 'Music',
    'Gaming': 'Gaming',
    'Food': 'Food',
    'Travel': 'Travel',
    'Fitness': 'Fitness',
    'Health': 'Health',
    'Art': 'Art',
    'Education': 'Education',
    'Business': 'Business',
    'Technology': 'Technology'
  };
  
  const genres = [];
  for (const [key, value] of Object.entries(genreMap)) {
    if (separated.includes(key)) {
      genres.push(value);
    }
  }
  
  return genres.length > 0 ? genres : ['Lifestyle'];
}

function categorizeInfluencer(followers) {
  if (followers >= 10000000) return 'Celebrity';
  if (followers >= 1000000) return 'Mega';
  if (followers >= 100000) return 'Macro';
  if (followers >= 10000) return 'Micro';
  return 'Nano';
}

async function importInfluencers() {
  console.log('🚀 Starting Spanish Influencers Import...');
  
  const csvPath = '/Users/JackEllis/Desktop/top 1000 influencers in spain  - Sheet1 (1).csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    return;
  }
  
  // Check if collection already has data
  try {
    const existingQuery = query(collection(db, 'vetted_influencers'), limit(1));
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      console.log('⚠️ Vetted influencers collection already has data.');
      if (!process.argv.includes('--force')) {
        console.log('   Add --force flag to proceed anyway');
        return;
      }
      console.log('   --force flag detected, proceeding with import...');
    }
  } catch (error) {
    console.log('📊 Collection is empty or doesn\'t exist, proceeding with import...');
  }
  
  const influencers = [];
  let processedCount = 0;
  let successCount = 0;
  let skippedCount = 0;
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        console.log(`📊 Found ${results.length} rows in CSV`);
        
        for (const row of results) {
          try {
            // Debug: Log the row structure
            if (processedCount < 3) {
              console.log(`📝 Row ${processedCount + 1}:`, {
                Rank: row.Rank,
                Name: row.Name?.substring(0, 50) + '...',
                Followers: row.Followers,
                'Engagement Rate': row['Engagement Rate'],
                Country: row.Country,
                GENRE: row.GENRE
              });
            }
            
            // Skip header rows and invalid data
            if (!row.Name || row.Name === 'NAME' || !row.Rank || row.Rank === 'Rank') {
              skippedCount++;
              continue;
            }
            
            const username = extractUsername(row.Name);
            
            if (!username) {
              console.log(`⚠️ Skipping row ${row.Rank} - no username found in: ${row.Name?.substring(0, 50)}`);
              skippedCount++;
              continue;
            }
            
            const followers = parseFollowers(row.Followers);
            const engagementRate = parseEngagementRate(row['Engagement Rate']);
            const genres = parseGenres(row.GENRE);
            
            const influencer = {
              username: username,
              displayName: extractDisplayName(row.Name),
              platform: 'Instagram',
              country: 'Spain',
              followerCount: followers,
              engagementRate: engagementRate,
              rank: parseInt(row.Rank) || 999,
              genres: genres,
              primaryGenre: genres[0] || 'Lifestyle',
              category: categorizeInfluencer(followers),
              isVerified: followers > 1000000,
              isActive: true,
              source: 'Top 1000 Spanish Influencers 2024',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Add to Firestore
            try {
              await addDoc(collection(db, 'vetted_influencers'), influencer);
              successCount++;
              
              if (successCount <= 5) {
                console.log(`✅ Added: ${influencer.displayName} (@${influencer.username}) - ${influencer.followerCount.toLocaleString()} followers`);
              }
            } catch (addError) {
              console.error(`❌ Error adding ${username}:`, addError.message);
            }
            
            influencers.push(influencer);
            processedCount++;
            
            if (processedCount % 100 === 0) {
              console.log(`📊 Processed ${processedCount} influencers (${successCount} successful, ${skippedCount} skipped)...`);
            }
            
          } catch (error) {
            console.error(`❌ Error processing row ${row.Rank}:`, error.message);
            skippedCount++;
          }
        }
        
        try {
          console.log(`🎉 Import completed!`);
          console.log(`📊 Total processed: ${processedCount} influencers`);
          console.log(`✅ Successfully added: ${successCount} influencers`);
          console.log(`⚠️ Skipped: ${skippedCount} rows`);
          
          if (influencers.length > 0) {
            console.log(`📈 Categories breakdown:`);
            
            const categories = influencers.reduce((acc, inf) => {
              acc[inf.category] = (acc[inf.category] || 0) + 1;
              return acc;
            }, {});
            
            Object.entries(categories).forEach(([cat, count]) => {
              console.log(`   ${cat}: ${count}`);
            });
            
            console.log(`🏷️ Top genres:`);
            const genreCount = {};
            influencers.forEach(inf => {
              inf.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
              });
            });
            
            Object.entries(genreCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .forEach(([genre, count]) => {
                console.log(`   ${genre}: ${count}`);
              });
          }
          
          resolve();
        } catch (error) {
          console.error('❌ Error in completion:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      });
  });
}

// Run the import
importInfluencers()
  .then(() => {
    console.log('✅ Import process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }); 