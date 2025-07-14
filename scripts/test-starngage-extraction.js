/**
 * Test Script for Starngage Batch Demographics Extraction
 * Demonstrates the concept with mock data and validates the approach
 */

const fs = require('fs');
const path = require('path');

// Load a small sample of influencers for testing
const INPUT_FILE = path.join(__dirname, '../processed_influencers.json');
const OUTPUT_FILE = path.join(__dirname, '../test_enhanced_influencers.json');

// Mock demographic data generator (simulates what Starngage would return)
function generateMockDemographics(influencer) {
  // Create consistent but varied demographics based on influencer data
  const hash = simpleHash(influencer.handle);
  
  // Base demographics on niche and gender
  const isFashion = influencer.niche.some(n => n.toLowerCase().includes('fashion'));
  const isLifestyle = influencer.niche.some(n => n.toLowerCase().includes('lifestyle'));
  const isSports = influencer.niche.some(n => n.toLowerCase().includes('sports'));
  const isFemale = influencer.gender === 'Female';
  
  let demographics = {
    gender: {
      female: 50,
      male: 50
    },
    ageGroups: {
      '13-17': 8,
      '18-24': 30,
      '25-34': 35,
      '35-44': 20,
      '45-54': 5,
      '55+': 2
    },
    topLocations: ['Spain', 'Madrid', 'Barcelona', 'Valencia'],
    interests: ['Lifestyle', 'Fashion', 'Travel']
  };
  
  // Adjust based on niche
  if (isFashion) {
    demographics.gender.female = 70 + (hash % 15); // 70-85% female
    demographics.gender.male = 100 - demographics.gender.female;
    demographics.ageGroups['18-24'] = 40 + (hash % 10);
    demographics.ageGroups['25-34'] = 35 + (hash % 10);
    demographics.interests = ['Fashion', 'Beauty', 'Lifestyle', 'Shopping'];
  }
  
  if (isSports) {
    demographics.gender.male = 60 + (hash % 20); // 60-80% male
    demographics.gender.female = 100 - demographics.gender.male;
    demographics.ageGroups['18-24'] = 25 + (hash % 15);
    demographics.ageGroups['25-34'] = 40 + (hash % 15);
    demographics.interests = ['Sports', 'Fitness', 'Health', 'Lifestyle'];
  }
  
  if (isLifestyle) {
    if (isFemale) {
      demographics.gender.female = 65 + (hash % 10);
      demographics.gender.male = 100 - demographics.gender.female;
    }
    demographics.interests = ['Lifestyle', 'Travel', 'Food', 'Family'];
  }
  
  return demographics;
}

function generateMockStarngageData(influencer) {
  const hash = simpleHash(influencer.handle);
  
  return {
    engagementRate: Math.max(0.5, influencer.engagementRate + ((hash % 100 - 50) / 1000)),
    averageLikes: Math.floor(influencer.followerCount * 0.02 * (1 + (hash % 50) / 100)),
    averageComments: Math.floor(influencer.followerCount * 0.001 * (1 + (hash % 30) / 100)),
    topics: inferTopicsFromNiche(influencer.niche),
    starngageEnhanced: true, // In real script, this would be true for successful extractions
    enhancedAt: new Date().toISOString()
  };
}

function inferTopicsFromNiche(niches) {
  const topicMap = {
    'Fashion': ['Fashion and Accessories', 'Style', 'Beauty'],
    'Lifestyle': ['Lifestyle', 'Daily Life', 'Personal'],
    'Sports': ['Sports', 'Fitness', 'Athletic'],
    'Travel': ['Travel', 'Adventure', 'Tourism'],
    'Food': ['Food and Cooking', 'Restaurants', 'Culinary'],
    'Beauty': ['Beauty', 'Makeup', 'Skincare'],
    'Technology': ['Technology', 'Gadgets', 'Innovation']
  };
  
  let topics = [];
  niches.forEach(niche => {
    const mapped = topicMap[niche] || [niche];
    topics.push(...mapped);
  });
  
  return [...new Set(topics)].slice(0, 4); // Unique topics, max 4
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function testBatchExtraction() {
  console.log('🧪 Testing Starngage Batch Demographics Extraction Concept\n');
  
  try {
    // Load influencers
    console.log('📚 Loading influencers database...');
    const influencers = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`✅ Loaded ${influencers.length} influencers\n`);
    
    // Take first 10 for testing
    const testInfluencers = influencers.slice(0, 10);
    console.log(`🎯 Testing with first ${testInfluencers.length} influencers:\n`);
    
    // Process each influencer
    const enhancedInfluencers = testInfluencers.map((influencer, index) => {
      console.log(`${index + 1}. Processing @${influencer.handle} (${influencer.name})`);
      console.log(`   Niche: ${influencer.niche.join(', ')}`);
      console.log(`   Gender: ${influencer.gender}`);
      console.log(`   Followers: ${influencer.followerCount.toLocaleString()}`);
      
      // Generate mock demographics (in real script, this would come from Starngage)
      const demographics = generateMockDemographics(influencer);
      const starngageData = generateMockStarngageData(influencer);
      
      console.log(`   → Enhanced with demographics (${demographics.gender.female}% female, ${demographics.gender.male}% male)`);
      console.log(`   → Average likes: ${starngageData.averageLikes.toLocaleString()}`);
      console.log(`   → Topics: ${starngageData.topics.join(', ')}\n`);
      
      // Return enhanced influencer object
      return {
        ...influencer,
        audienceDemographics: demographics,
        starngageData: starngageData
      };
    });
    
    // Save test results
    console.log('💾 Saving test results...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enhancedInfluencers, null, 2));
    console.log(`✅ Test results saved to: ${OUTPUT_FILE}\n`);
    
    // Display summary
    console.log('📊 Test Summary:');
    console.log(`   Total processed: ${enhancedInfluencers.length}`);
    console.log(`   Success rate: 100% (mock data)`);
    console.log(`   Average female audience: ${Math.round(enhancedInfluencers.reduce((sum, inf) => sum + inf.audienceDemographics.gender.female, 0) / enhancedInfluencers.length)}%`);
    console.log(`   Most common age group: 25-34 (${Math.round(enhancedInfluencers.reduce((sum, inf) => sum + inf.audienceDemographics.ageGroups['25-34'], 0) / enhancedInfluencers.length)}%)`);
    
    // Show sample enhanced record
    console.log('\n📋 Sample Enhanced Record:');
    console.log(JSON.stringify(enhancedInfluencers[0], null, 2));
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Fix any API issues with the Starngage service');
    console.log('2. Run the full batch script: node scripts/starngage-batch-demographics.js');
    console.log('3. Monitor progress and adjust rate limiting as needed');
    console.log('4. Replace processed_influencers.json with the enhanced version');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testBatchExtraction().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testBatchExtraction, generateMockDemographics }; 