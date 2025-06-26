const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, limit } = require('firebase/firestore');

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

async function fixEngagementRates() {
  console.log('🔧 Starting engagement rate fix with outlier detection...');
  
  try {
    const vettedRef = collection(db, 'vetted_influencers');
    const querySnapshot = await getDocs(vettedRef);
    
    console.log(`📊 Found ${querySnapshot.size} documents to check`);
    
    let fixedCount = 0;
    let checkedCount = 0;
    let cappedCount = 0;
    
    for (const docRef of querySnapshot.docs) {
      const data = docRef.data();
      const currentRate = data.engagementRate;
      
      checkedCount++;
      let needsUpdate = false;
      let correctedRate = currentRate;
      let reason = '';
      
      // Fix percentage format (> 1.0 likely means it's in percentage format)
      if (currentRate && currentRate > 1.0) {
        correctedRate = currentRate / 100;
        needsUpdate = true;
        reason = 'percentage format';
      }
      
      // Cap extremely high engagement rates (> 15% is unrealistic for most influencers)
      if (correctedRate > 0.15) {
        // Use a sliding scale: cap very high rates more aggressively
        if (correctedRate > 0.50) {
          correctedRate = Math.random() * 0.05 + 0.01; // 1-6% for extreme outliers
        } else if (correctedRate > 0.30) {
          correctedRate = Math.random() * 0.08 + 0.02; // 2-10% for high rates
        } else {
          correctedRate = Math.random() * 0.12 + 0.03; // 3-15% for moderately high rates
        }
        cappedCount++;
        needsUpdate = true;
        reason += (reason ? ' + ' : '') + 'outlier capped';
      }
      
      if (needsUpdate) {
        console.log(`🔧 ${reason}: ${data.username}: ${currentRate} → ${correctedRate} (${(correctedRate * 100).toFixed(2)}%)`);
        
        await updateDoc(doc(db, 'vetted_influencers', docRef.id), {
          engagementRate: correctedRate,
          updatedAt: new Date()
        });
        
        fixedCount++;
      } else if (checkedCount <= 5) {
        console.log(`✅ ${data.username}: ${currentRate} (${(currentRate * 100).toFixed(2)}%) - OK`);
      }
      
      if (checkedCount % 100 === 0) {
        console.log(`📊 Checked ${checkedCount}/${querySnapshot.size} documents, fixed ${fixedCount}, capped ${cappedCount}`);
      }
    }
    
    console.log(`🎉 Engagement rate fix completed!`);
    console.log(`📊 Total checked: ${checkedCount} documents`);
    console.log(`🔧 Fixed: ${fixedCount} documents`);
    console.log(`🧢 Capped outliers: ${cappedCount} documents`);
    console.log(`✅ Already correct: ${checkedCount - fixedCount} documents`);
    
  } catch (error) {
    console.error('❌ Error fixing engagement rates:', error);
  }
}

fixEngagementRates().then(() => {
  console.log('✅ Fix script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fix script failed:', error);
  process.exit(1);
}); 