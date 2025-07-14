const { FirebaseDemographicEnhancer } = require('./firebase-demographic-enhancement.js');
const fs = require('fs');
const path = require('path');

async function testEnhancement() {
  console.log('🧪 Testing Firebase Demographic Enhancement');
  console.log('==========================================\n');

  try {
    // Load sample influencers
    const influencersPath = path.join(__dirname, '..', 'processed_influencers.json');
    if (!fs.existsSync(influencersPath)) {
      throw new Error('❌ processed_influencers.json not found!');
    }
    
    const allInfluencers = JSON.parse(fs.readFileSync(influencersPath, 'utf8'));
    
    // Test with first 5 influencers
    const testInfluencers = allInfluencers.slice(0, 5);
    console.log(`📊 Testing with ${testInfluencers.length} sample influencers:`);
    
    testInfluencers.forEach((inf, i) => {
      console.log(`   ${i + 1}. ${inf.name} (@${inf.handle}) - ${inf.niche?.join(', ')} - ${inf.gender} - ${inf.followerCount?.toLocaleString()} followers`);
    });
    
    console.log('\n🔄 Generating demographic data...\n');
    
    // Create a temporary enhancer instance to test demographic generation
    const enhancer = new FirebaseDemographicEnhancer();
    
    testInfluencers.forEach((influencer, i) => {
      console.log(`\n${i + 1}. ${influencer.name} (@${influencer.handle})`);
      console.log(`   Niche: ${Array.isArray(influencer.niche) ? influencer.niche.join(', ') : influencer.niche}`);
      console.log(`   Gender: ${influencer.gender}`);
      console.log(`   Followers: ${influencer.followerCount?.toLocaleString()}`);
      console.log(`   Location: ${influencer.location}`);
      
      try {
        const demographics = enhancer.demographicService.generateDemographics(influencer);
        
        console.log(`   Generated Demographics:`);
        console.log(`     Gender Split: ${demographics.gender.female}% F, ${demographics.gender.male}% M`);
        console.log(`     Primary Age Groups:`);
        Object.entries(demographics.ageGroups)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([age, percent]) => {
            console.log(`       ${age}: ${percent}%`);
          });
        console.log(`     Top Locations: ${demographics.topLocations.slice(0, 3).join(', ')}`);
        console.log(`     Interests: ${demographics.interests.slice(0, 3).join(', ')}`);
        
      } catch (error) {
        console.error(`     ❌ Error: ${error.message}`);
      }
    });
    
    console.log('\n✅ Demographic generation test completed successfully!');
    console.log('\n📊 Summary Analysis:');
    
    // Generate all demographics for analysis
    const allDemographics = testInfluencers.map(inf => {
      try {
        return enhancer.demographicService.generateDemographics(inf);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    
    if (allDemographics.length > 0) {
      const avgFemale = allDemographics.reduce((sum, d) => sum + d.gender.female, 0) / allDemographics.length;
      const avgMale = allDemographics.reduce((sum, d) => sum + d.gender.male, 0) / allDemographics.length;
      
      console.log(`   Average Female Audience: ${Math.round(avgFemale)}%`);
      console.log(`   Average Male Audience: ${Math.round(avgMale)}%`);
      
      // Most common age group
      const ageGroupTotals = {};
      allDemographics.forEach(d => {
        Object.entries(d.ageGroups).forEach(([age, percent]) => {
          ageGroupTotals[age] = (ageGroupTotals[age] || 0) + percent;
        });
      });
      
      const topAgeGroup = Object.entries(ageGroupTotals)
        .sort((a, b) => b[1] - a[1])[0];
      
      console.log(`   Most Common Age Group: ${topAgeGroup[0]} (avg ${Math.round(topAgeGroup[1] / allDemographics.length)}%)`);
    }
    
    console.log('\n🔥 Test completed! Ready to run the full enhancement.');
    console.log('\n💡 To run the full enhancement:');
    console.log('   node scripts/firebase-demographic-enhancement.js');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  testEnhancement();
} 