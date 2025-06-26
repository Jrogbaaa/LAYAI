const fs = require('fs');
const csv = require('csv-parser');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, writeBatch, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWPf0bDAM9zWAIJLlsVwgqHaELi70UavI",
  authDomain: "layai-8d755.firebaseapp.com",
  projectId: "layai-8d755",
  storageBucket: "layai-8d755.firebasestorage.app",
  messagingSenderId: "261921951232",
  appId: "1:261921951232:web:b20b5f2de1c5a07d2c12e5",
  measurementId: "G-V621Y968FJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper functions
function parseFollowers(followersStr) {
  if (!followersStr || followersStr === '') return 0;
  
  const cleanStr = followersStr.toString().trim().toLowerCase();
  
  // Handle M (millions)
  if (cleanStr.includes('m')) {
    const number = parseFloat(cleanStr.replace('m', ''));
    return Math.round(number * 1000000);
  }
  
  // Handle K (thousands)
  if (cleanStr.includes('k')) {
    const number = parseFloat(cleanStr.replace('k', ''));
    return Math.round(number * 1000);
  }
  
  // Handle regular numbers with commas
  const number = parseFloat(cleanStr.replace(/,/g, ''));
  return isNaN(number) ? 0 : Math.round(number);
}

function parseEngagementRate(engagementStr) {
  if (!engagementStr || engagementStr === '') return 0;
  
  const cleanStr = engagementStr.toString().trim().replace('%', '');
  const number = parseFloat(cleanStr);
  return isNaN(number) ? 0 : number;
}

function extractUsername(nameStr) {
  if (!nameStr) return '';
  
  // Look for @username pattern
  const atMatch = nameStr.match(/@([a-zA-Z0-9_\.]+)/);
  if (atMatch) {
    return atMatch[1];
  }
  
  // If no @ found, use the name itself but clean it
  return nameStr.toString().trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizeGenre(genre) {
  if (!genre) return 'Lifestyle';
  
  const genreMap = {
    'beauty': 'Beauty',
    'fashion': 'Fashion', 
    'lifestyle': 'Lifestyle',
    'fitness': 'Fitness',
    'food': 'Food',
    'travel': 'Travel',
    'tech': 'Tech',
    'sports': 'Sports',
    'entertainment': 'Entertainment',
    'music': 'Music',
    'business': 'Business',
    'art': 'Art',
    'gaming': 'Gaming',
    'education': 'Education',
    'home': 'Home',
    'health': 'Health'
  };
  
  const normalizedGenre = genre.toString().toLowerCase().trim();
  return genreMap[normalizedGenre] || 'Lifestyle';
}

function determineCategory(followers) {
  if (followers >= 1000000) return 'Mega';
  if (followers >= 100000) return 'Macro';
  if (followers >= 10000) return 'Micro';
  return 'Nano';
}

async function uploadInfluencersFromCSV(csvFilePath) {
  console.log('🚀 Starting CSV upload process...');
  console.log(`📁 Reading file: ${csvFilePath}`);
  
  const influencers = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Parse the CSV row
          const rank = parseInt(row.Rank) || 0;
          const name = row.Name || '';
          const followers = parseFollowers(row.Followers);
          const engagementRate = parseEngagementRate(row['Engagement Rate']);
          const country = row.Country || 'Spain';
          const genre = normalizeGenre(row.GENRE);
          
          // Extract username from name
          const username = extractUsername(name);
          
          if (!username || followers === 0) {
            console.warn(`⚠️  Skipping invalid row: ${name}`);
            return;
          }
          
          const influencer = {
            username: username,
            displayName: name,
            platform: 'Instagram',
            country: country,
            followerCount: followers,
            engagementRate: engagementRate,
            rank: rank,
            genres: [genre],
            primaryGenre: genre,
            category: determineCategory(followers),
            isVerified: rank <= 100, // Top 100 are likely verified
            isActive: true,
            source: 'csv_import_spain_top_1000',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          influencers.push(influencer);
          
          if (influencers.length % 100 === 0) {
            console.log(`📊 Processed ${influencers.length} influencers...`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing row:`, row, error);
        }
      })
      .on('end', async () => {
        console.log(`✅ Finished parsing CSV. Found ${influencers.length} valid influencers`);
        
        try {
          await batchUploadToFirestore(influencers);
          resolve(influencers.length);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

async function batchUploadToFirestore(influencers) {
  console.log('📤 Starting batch upload to Firestore...');
  
  const BATCH_SIZE = 500; // Firestore batch limit
  const batches = [];
  
  for (let i = 0; i < influencers.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchInfluencers = influencers.slice(i, i + BATCH_SIZE);
    
    for (const influencer of batchInfluencers) {
      const docRef = doc(collection(db, 'vetted_influencers'));
      batch.set(docRef, influencer);
    }
    
    batches.push(batch);
  }
  
  console.log(`📦 Created ${batches.length} batches for upload`);
  
  // Execute batches sequentially to avoid rate limits
  for (let i = 0; i < batches.length; i++) {
    try {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} uploaded successfully`);
      
      // Add delay between batches to be respectful to Firestore
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error uploading batch ${i + 1}:`, error);
      throw error;
    }
  }
  
  console.log('🎉 All influencers uploaded successfully!');
}

// Main execution
async function main() {
  try {
    // You'll need to update this path to match your CSV file location
    const csvPath = '/Users/JackEllis/Desktop/top 1000 influencers in spain  - Sheet1 (1).csv';
    
    console.log('🔥 Firebase initialized successfully');
    console.log('📋 Starting influencer CSV import...');
    
    const count = await uploadInfluencersFromCSV(csvPath);
    
    console.log(`🎯 Upload completed! ${count} influencers added to the database.`);
    console.log('✨ Enhanced search is now ready to use the vetted influencers database!');
    
  } catch (error) {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  uploadInfluencersFromCSV,
  parseFollowers,
  parseEngagementRate,
  extractUsername,
  normalizeGenre
}; 