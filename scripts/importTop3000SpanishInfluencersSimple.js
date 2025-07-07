const fs = require('fs');
const csv = require('csv-parser');

// Simple CSV processing without Firebase for now
async function processCSV() {
  console.log('📖 Processing CSV file...');
  
  const csvPath = '/Users/JackEllis/Desktop/top 3000 influencers in spain  - Sheet1 (2).csv';
  const influencers = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const rank = parseInt(row.Rank);
        if (rank && rank <= 3000) {
          // Parse the data
          const handle = extractInstagramHandle(row.Name);
          const displayName = extractDisplayName(row.Name);
          const followers = parseFollowerCount(row.Followers);
          const engagement = parseEngagementRate(row['Engagement Rate']);
          const genres = parseGenres(row.GENRE);
          const gender = estimateGender(displayName);
          
          const influencer = {
            rank: rank,
            id: handle || `influencer_${rank}`,
            name: displayName,
            handle: handle || displayName.toLowerCase().replace(/\s+/g, ''),
            platform: 'Instagram',
            followerCount: followers,
            engagementRate: engagement / 100,
            gender: gender,
            location: 'Spain',
            niche: genres,
            originalGenres: row.GENRE,
            country: row.Country
          };
          
          influencers.push(influencer);
        }
      })
      .on('end', () => {
        console.log(`📊 Processed ${influencers.length} influencers from CSV`);
        
        // Show statistics
        console.log('\n📈 Statistics:');
        console.log(`   - Total influencers: ${influencers.length}`);
        
        const followerCounts = influencers.map(i => i.followerCount);
        console.log(`   - Avg followers: ${Math.round(followerCounts.reduce((a, b) => a + b, 0) / followerCounts.length).toLocaleString()}`);
        console.log(`   - Max followers: ${Math.max(...followerCounts).toLocaleString()}`);
        console.log(`   - Min followers: ${Math.min(...followerCounts).toLocaleString()}`);
        
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
        
        // Genre distribution
        const genres = influencers.flatMap(i => i.niche);
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
        
        // Gender distribution
        const genders = influencers.map(i => i.gender);
        const maleCount = genders.filter(g => g === 'Male').length;
        const femaleCount = genders.filter(g => g === 'Female').length;
        const otherCount = genders.filter(g => g === 'Other').length;
        
        console.log('\n⚧ Gender Distribution:');
        console.log(`   - Male: ${maleCount} (${(maleCount/influencers.length*100).toFixed(1)}%)`);
        console.log(`   - Female: ${femaleCount} (${(femaleCount/influencers.length*100).toFixed(1)}%)`);
        console.log(`   - Other: ${otherCount} (${(otherCount/influencers.length*100).toFixed(1)}%)`);
        
        // Test specific searches
        console.log('\n🔍 Search Test Results:');
        
        const fitnessInfluencers = influencers.filter(i => 
          i.niche.some(niche => niche.toLowerCase().includes('fitness'))
        );
        console.log(`   - Fitness influencers: ${fitnessInfluencers.length}`);
        
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
            console.log(`       - ${inf.name} (@${inf.handle}) - ${inf.followerCount.toLocaleString()} followers`);
          });
        }
        
        // Save processed data to JSON for manual inspection
        fs.writeFileSync('processed_influencers.json', JSON.stringify(influencers, null, 2));
        console.log('\n💾 Saved processed data to processed_influencers.json');
        
        resolve(influencers);
      })
      .on('error', reject);
  });
}

// Helper functions
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

function parseEngagementRate(engagementStr) {
  if (!engagementStr) return 0;
  return parseFloat(engagementStr.toString().replace('%', ''));
}

function extractInstagramHandle(nameField) {
  if (!nameField) return null;
  
  const handleMatch = nameField.match(/@([a-zA-Z0-9._]+)/);
  if (handleMatch) {
    return handleMatch[1];
  }
  
  const lines = nameField.split('\n');
  for (const line of lines) {
    if (line.startsWith('@')) {
      return line.substring(1);
    }
  }
  
  return null;
}

function extractDisplayName(nameField) {
  if (!nameField) return 'Unknown';
  
  const lines = nameField.split('\n');
  return lines[0].trim();
}

function parseGenres(genreStr) {
  if (!genreStr) return ['Lifestyle'];
  
  const genres = [];
  const genreStr_lower = genreStr.toLowerCase();
  
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
  
  for (const [key, value] of Object.entries(genreMapping)) {
    if (genreStr_lower.includes(key)) {
      if (!genres.includes(value)) {
        genres.push(value);
      }
    }
  }
  
  if (genres.length === 0) {
    genres.push('Lifestyle');
  }
  
  return genres;
}

function estimateGender(name) {
  const femaleNames = ['maria', 'ana', 'carmen', 'pilar', 'elena', 'sara', 'laura', 'paula', 'lucia', 'alba', 'clara', 'marta', 'nuria', 'cristina', 'andrea', 'sofia', 'daniela', 'victoria', 'alejandra', 'georgina', 'ursula', 'cindy', 'neiva', 'penelope', 'elsa', 'itziar', 'najwa', 'blanca', 'zaida', 'aida', 'leticia'];
  const maleNames = ['sergio', 'gareth', 'andres', 'isco', 'alvaro', 'lucas', 'gerard', 'rafa', 'iker', 'enrique', 'jordi', 'marc', 'david', 'marco', 'cesc', 'thibaut', 'nacho', 'pedri', 'carles', 'ibai', 'xabi', 'ansu', 'manu', 'daniel', 'diego', 'mario', 'juan', 'alejandro', 'miguel', 'naim', 'pablo', 'sergi', 'roberto', 'ferran', 'ander', 'magno', 'joaquin', 'jon', 'horacio', 'fede', 'antonio', 'hector', 'cesar', 'inigo', 'abraham', 'oscar', 'luis'];
  
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
  
  return 'Other';
}

// Run the processing
if (require.main === module) {
  processCSV()
    .then(() => {
      console.log('\n✅ CSV processing completed successfully!');
      console.log('🎉 Data is ready for Firebase import!');
    })
    .catch((error) => {
      console.error('❌ Processing failed:', error);
    });
}

module.exports = { processCSV }; 