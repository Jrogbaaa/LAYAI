const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using environment variables
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  console.log('📝 Make sure you have the following in your .env.local:');
  console.log('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.log('   - FIREBASE_CLIENT_EMAIL');
  console.log('   - FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

const db = admin.firestore();

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
  
  // First, check if collection already has data
  try {
    const existingSnapshot = await db.collection('vetted_influencers').limit(1).get();
    if (!existingSnapshot.empty) {
      console.log('⚠️ Vetted influencers collection already has data.');
      console.log('   Run this script with --force to overwrite existing data');
      if (!process.argv.includes('--force')) {
        console.log('   Exiting to prevent duplicate data...');
        return;
      } else {
        console.log('   --force flag detected, clearing existing data...');
        const batch = db.batch();
        const allDocs = await db.collection('vetted_influencers').get();
        allDocs.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log('   ✅ Existing data cleared');
      }
    }
  } catch (error) {
    console.log('📊 Collection is empty or doesn\'t exist, proceeding with import...');
  }
  
  const influencers = [];
  let batch = db.batch();
  let processedCount = 0;
  let batchCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const username = extractUsername(row.Name);
          
          if (!username) {
            console.log(`⚠️ Skipping row without username: ${row.Name}`);
            return;
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
            isVerified: followers > 1000000, // Assume high-follower accounts are verified
            isActive: true,
            source: 'Top 1000 Spanish Influencers 2024',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          // Add to batch
          const docRef = db.collection('vetted_influencers').doc();
          batch.set(docRef, influencer);
          batchCount++;
          
          influencers.push(influencer);
          processedCount++;
          
          // Firestore batch limit is 500
          if (batchCount === 400) {
            console.log(`📦 Committing batch of ${batchCount} influencers...`);
            batch.commit().then(() => {
              console.log(`✅ Batch committed successfully`);
            }).catch(error => {
              console.error('❌ Batch commit error:', error);
            });
            
            // Start new batch
            batch = db.batch();
            batchCount = 0;
          }
          
          if (processedCount % 100 === 0) {
            console.log(`📊 Processed ${processedCount} influencers...`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing row:`, error);
        }
      })
      .on('end', async () => {
        try {
          // Commit remaining batch
          if (batchCount > 0) {
            console.log(`📦 Committing final batch of ${batchCount} influencers...`);
            await batch.commit();
          }
          
          console.log(`🎉 Import completed!`);
          console.log(`📊 Total processed: ${processedCount} influencers`);
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
          
          resolve();
        } catch (error) {
          console.error('❌ Error in final commit:', error);
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