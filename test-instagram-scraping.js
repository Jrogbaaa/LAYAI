// Test script for Instagram scraping API
const testHandles = ['cristiano', 'therock', 'taylorswift'];

async function testInstagramScraping() {
  console.log('🧪 Testing Instagram scraping API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/scrape-instagram-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handles: testHandles
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Successfully scraped ${data.profiles.length} profiles:`);
      
      data.profiles.forEach(profile => {
        console.log(`\n📊 ${profile.username} (@${profile.username})`);
        console.log(`   Name: ${profile.fullName}`);
        console.log(`   Followers: ${profile.followers.toLocaleString()}`);
        console.log(`   Engagement: ${profile.engagementRate.toFixed(2)}%`);
        console.log(`   Verified: ${profile.verified ? '✅' : '❌'}`);
        console.log(`   Category: ${profile.category}`);
        console.log(`   Location: ${profile.location || 'Not specified'}`);
        console.log(`   Collaboration Rate: $${profile.collaborationRate.toLocaleString()}`);
      });
    } else {
      console.error('❌ API call failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInstagramScraping(); 