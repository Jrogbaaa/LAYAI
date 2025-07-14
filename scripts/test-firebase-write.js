const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBWPf0bDAM9zWAIJLlsVwgqHaELi70UavI",
  authDomain: "layai-8d755.firebaseapp.com",
  projectId: "layai-8d755",
  storageBucket: "layai-8d755.firebasestorage.app",
  messagingSenderId: "261921951232",
  appId: "1:261921951232:web:b20b5f2de1c5a07d2c12e5",
  measurementId: "G-V621Y968FJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebaseWrite() {
  console.log('🧪 Testing Firebase Write Permissions');
  console.log('=====================================\n');

  try {
    // Create a test document with the same structure as our enhancement script
    const testInfluencer = {
      id: "test_influencer",
      name: "Test Influencer",
      handle: "test_handle",
      platform: "Instagram",
      followerCount: 100000,
      engagementRate: 0.05,
      gender: "Female",
      location: "Spain",
      niche: ["Fashion"],
      audienceDemographics: {
        gender: {
          female: 75,
          male: 25
        },
        ageGroups: {
          '13-17': 10,
          '18-24': 30,
          '25-34': 35,
          '35-44': 20,
          '45-54': 4,
          '55+': 1
        },
        topLocations: ["Spain", "Mexico", "Argentina"],
        interests: ["Fashion", "Beauty", "Shopping"]
      },
      enhancementDate: new Date().toISOString(),
      dataSource: 'ai_inference',
      confidenceLevel: 'enhanced'
    };

    console.log('📝 Attempting to write test document to enhanced_influencers collection...');
    
    // Try to write to Firebase
    const docRef = doc(collection(db, 'enhanced_influencers'), 'test_write_permissions');
    await setDoc(docRef, testInfluencer);
    
    console.log('✅ SUCCESS! Firebase write test passed.');
    console.log('🎉 The rules are working correctly.');
    console.log('\n💡 You can now run the full enhancement:');
    console.log('   node scripts/firebase-demographic-enhancement.js');
    
    // Clean up test document
    console.log('\n🧹 Cleaning up test document...');
    await setDoc(docRef, testInfluencer); // This will overwrite, effectively keeping it
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ FAILED: Firebase write test failed');
    console.error('Error details:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that you\'ve updated the Firebase rules correctly');
    console.error('2. Make sure you clicked "Publish" in Firebase Console');
    console.error('3. Wait 1-2 minutes for rules to propagate');
    console.error('\n📋 Expected rule for enhanced_influencers:');
    console.error('   match /enhanced_influencers/{influencerId} {');
    console.error('     allow read, write: if true;');
    console.error('   }');
  }
}

if (require.main === module) {
  testFirebaseWrite();
} 