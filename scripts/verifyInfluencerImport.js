const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');

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

async function verifyImport() {
  console.log('🔍 Verifying Spanish influencers import...');
  
  try {
    // Get all Spanish influencers
    const spanishInfluencers = await getDocs(
      query(collection(db, 'vettedInfluencers'), where('location', '==', 'Spain'))
    );
    
    console.log(`📊 Total Spanish influencers in database: ${spanishInfluencers.size}`);
    
    if (spanishInfluencers.size === 0) {
      console.log('❌ No Spanish influencers found in database');
      return;
    }
    
    // Analyze the data
    const influencers = [];
    spanishInfluencers.forEach((doc) => {
      influencers.push(doc.data());
    });
    
    // Sort by follower count
    influencers.sort((a, b) => b.followerCount - a.followerCount);
    
    // Statistics
    const followerCounts = influencers.map(i => i.followerCount);
    const engagementRates = influencers.map(i => i.engagementRate);
    const genres = influencers.flatMap(i => i.niche);
    const genders = influencers.map(i => i.gender);
    
    console.log('\n📈 Database Statistics:');
    console.log(`   - Total influencers: ${influencers.length}`);
    console.log(`   - Avg followers: ${Math.round(followerCounts.reduce((a, b) => a + b, 0) / followerCounts.length).toLocaleString()}`);
    console.log(`   - Max followers: ${Math.max(...followerCounts).toLocaleString()}`);
    console.log(`   - Min followers: ${Math.min(...followerCounts).toLocaleString()}`);
    console.log(`   - Avg engagement: ${(engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length * 100).toFixed(2)}%`);
    
    // Follower distribution
    const nano = influencers.filter(i => i.followerCount < 10000).length;
    const micro = influencers.filter(i => i.followerCount >= 10000 && i.followerCount < 100000).length;
    const macro = influencers.filter(i => i.followerCount >= 100000 && i.followerCount < 1000000).length;
    const mega = influencers.filter(i => i.followerCount >= 1000000).length;
    
    console.log('\n👥 Follower Distribution:');
    console.log(`   - Nano (< 10K): ${nano}`);
    console.log(`   - Micro (10K-100K): ${micro}`);
    console.log(`   - Macro (100K-1M): ${macro}`);
    console.log(`   - Mega (1M+): ${mega}`);
    
    // Gender distribution
    const maleCount = genders.filter(g => g === 'Male').length;
    const femaleCount = genders.filter(g => g === 'Female').length;
    const otherCount = genders.filter(g => g === 'Other').length;
    
    console.log('\n⚧ Gender Distribution:');
    console.log(`   - Male: ${maleCount} (${(maleCount/influencers.length*100).toFixed(1)}%)`);
    console.log(`   - Female: ${femaleCount} (${(femaleCount/influencers.length*100).toFixed(1)}%)`);
    console.log(`   - Other: ${otherCount} (${(otherCount/influencers.length*100).toFixed(1)}%)`);
    
    // Genre distribution
    const genreCounts = {};
    genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    console.log('\n🎯 Top Genres:');
    Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([genre, count]) => {
        console.log(`   - ${genre}: ${count}`);
      });
    
    // Top influencers
    console.log('\n🏆 Top 10 Influencers by Followers:');
    influencers.slice(0, 10).forEach((influencer, index) => {
      console.log(`   ${index + 1}. ${influencer.name} (@${influencer.handle}) - ${influencer.followerCount.toLocaleString()} followers`);
    });
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    
    // Test fitness influencers
    const fitnessInfluencers = influencers.filter(i => 
      i.niche.some(niche => niche.toLowerCase().includes('fitness') || niche.toLowerCase().includes('health'))
    );
    console.log(`   - Fitness influencers: ${fitnessInfluencers.length}`);
    
    // Test fashion influencers
    const fashionInfluencers = influencers.filter(i => 
      i.niche.some(niche => niche.toLowerCase().includes('fashion') || niche.toLowerCase().includes('style'))
    );
    console.log(`   - Fashion influencers: ${fashionInfluencers.length}`);
    
    // Test sports influencers
    const sportsInfluencers = influencers.filter(i => 
      i.niche.some(niche => niche.toLowerCase().includes('sports') || niche.toLowerCase().includes('soccer'))
    );
    console.log(`   - Sports influencers: ${sportsInfluencers.length}`);
    
    // Test male fitness influencers in follower range
    const maleFitnessInfluencers = influencers.filter(i => 
      i.gender === 'Male' && 
      i.niche.some(niche => niche.toLowerCase().includes('fitness')) &&
      i.followerCount >= 10000 && 
      i.followerCount <= 500000
    );
    console.log(`   - Male fitness influencers (10K-500K): ${maleFitnessInfluencers.length}`);
    
    if (maleFitnessInfluencers.length > 0) {
      console.log('     Sample male fitness influencers:');
      maleFitnessInfluencers.slice(0, 5).forEach(inf => {
        console.log(`       - ${inf.name} (@${inf.handle}) - ${inf.followerCount.toLocaleString()} followers, ${(inf.engagementRate * 100).toFixed(2)}% engagement`);
      });
    }
    
    console.log('\n✅ Import verification completed successfully!');
    console.log('🎉 Database is ready for enhanced search functionality!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
if (require.main === module) {
  verifyImport()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyImport }; 