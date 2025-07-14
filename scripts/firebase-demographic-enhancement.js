const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, query, where, orderBy, limit, writeBatch } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

// Import the demographic service (we'll need to modify this slightly for Node.js)
class DemographicInferenceService {
  constructor() {
    this.researchBasedPatterns = {
      // Fashion & Lifestyle
      'Fashion': {
        'Fashion': { 
          genderSplit: { female: 78, male: 22 },
          primaryAgeGroup: '18-24',
          ageDistribution: { '13-17': 15, '18-24': 35, '25-34': 28, '35-44': 15, '45-54': 5, '55+': 2 },
          topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
          interests: ['Fashion', 'Beauty', 'Shopping', 'Style', 'Trends']
        },
        'Luxury Fashion': {
          genderSplit: { female: 72, male: 28 },
          primaryAgeGroup: '25-34',
          ageDistribution: { '13-17': 8, '18-24': 25, '25-34': 35, '35-44': 22, '45-54': 8, '55+': 2 },
          topLocations: ['United States', 'United Kingdom', 'France', 'Italy', 'Germany'],
          interests: ['Luxury Fashion', 'Designer Brands', 'High-end Shopping', 'Style', 'Exclusivity']
        }
      },
      // Sports & Fitness
      'Sports': {
        'Football': {
          genderSplit: { female: 25, male: 75 },
          primaryAgeGroup: '18-24',
          ageDistribution: { '13-17': 20, '18-24': 35, '25-34': 25, '35-44': 15, '45-54': 4, '55+': 1 },
          topLocations: ['Spain', 'Brazil', 'Argentina', 'United Kingdom', 'Germany'],
          interests: ['Football', 'Sports', 'La Liga', 'Champions League', 'World Cup']
        },
        'Fitness': {
          genderSplit: { female: 62, male: 38 },
          primaryAgeGroup: '25-34',
          ageDistribution: { '13-17': 10, '18-24': 28, '25-34': 35, '35-44': 20, '45-54': 6, '55+': 1 },
          topLocations: ['United States', 'United Kingdom', 'Australia', 'Canada', 'Germany'],
          interests: ['Fitness', 'Health', 'Workout', 'Nutrition', 'Wellness']
        }
      },
      // Lifestyle
      'Lifestyle': {
        'General Lifestyle': {
          genderSplit: { female: 65, male: 35 },
          primaryAgeGroup: '25-34',
          ageDistribution: { '13-17': 12, '18-24': 30, '25-34': 32, '35-44': 18, '45-54': 6, '55+': 2 },
          topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Spain'],
          interests: ['Lifestyle', 'Travel', 'Food', 'Photography', 'Entertainment']
        }
      },
      // Entertainment
      'Entertainment': {
        'Music': {
          genderSplit: { female: 55, male: 45 },
          primaryAgeGroup: '18-24',
          ageDistribution: { '13-17': 25, '18-24': 40, '25-34': 25, '35-44': 8, '45-54': 2, '55+': 0 },
          topLocations: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Spain'],
          interests: ['Music', 'Entertainment', 'Concerts', 'Artists', 'Pop Culture']
        }
      }
    };
  }

  generateDemographics(influencer) {
    const niche = Array.isArray(influencer.niche) ? influencer.niche[0] : (influencer.niche || 'Lifestyle');
    const gender = influencer.gender || 'Unknown';
    const followerCount = influencer.followerCount || 0;
    
    // Get base pattern
    let pattern = this.getPatternForNiche(niche);
    
    // Apply gender-based adjustments
    if (gender === 'Female') {
      pattern = this.adjustForFemaleInfluencer(pattern);
    } else if (gender === 'Male') {
      pattern = this.adjustForMaleInfluencer(pattern);
    }
    
    // Apply follower count adjustments
    pattern = this.adjustForFollowerCount(pattern, followerCount);
    
    // Apply location adjustments
    if (influencer.location === 'Spain') {
      pattern = this.adjustForSpanishAudience(pattern);
    }
    
    // Generate final demographics with some randomization
    return this.generateRealisticDemographics(pattern, influencer);
  }

  getPatternForNiche(niche) {
    const normalizedNiche = this.normalizeNiche(niche);
    
    // Try to find exact match first
    for (const category in this.researchBasedPatterns) {
      if (this.researchBasedPatterns[category][normalizedNiche]) {
        return { ...this.researchBasedPatterns[category][normalizedNiche] };
      }
    }
    
    // Fallback based on category
    if (niche.toLowerCase().includes('fashion') || niche.toLowerCase().includes('style')) {
      return { ...this.researchBasedPatterns['Fashion']['Fashion'] };
    } else if (niche.toLowerCase().includes('sport') || niche.toLowerCase().includes('fitness')) {
      return { ...this.researchBasedPatterns['Sports']['Fitness'] };
    } else if (niche.toLowerCase().includes('music') || niche.toLowerCase().includes('entertainment')) {
      return { ...this.researchBasedPatterns['Entertainment']['Music'] };
    }
    
    // Default to lifestyle
    return { ...this.researchBasedPatterns['Lifestyle']['General Lifestyle'] };
  }

  normalizeNiche(niche) {
    const normalized = niche.charAt(0).toUpperCase() + niche.slice(1).toLowerCase();
    
    // Map common variations
    const nicheMap = {
      'Sports': 'Fitness',
      'Soccer': 'Football',
      'Style': 'Fashion',
      'Beauty': 'Fashion'
    };
    
    return nicheMap[normalized] || normalized;
  }

  adjustForFemaleInfluencer(pattern) {
    // Female influencers tend to have more female-skewed audiences
    return {
      ...pattern,
      genderSplit: {
        female: Math.min(85, pattern.genderSplit.female + 10),
        male: Math.max(15, pattern.genderSplit.male - 10)
      }
    };
  }

  adjustForMaleInfluencer(pattern) {
    // Male influencers, especially in sports, tend to have more male-skewed audiences
    return {
      ...pattern,
      genderSplit: {
        female: Math.max(20, pattern.genderSplit.female - 15),
        male: Math.min(80, pattern.genderSplit.male + 15)
      }
    };
  }

  adjustForFollowerCount(pattern, followerCount) {
    if (followerCount > 10000000) {
      // Mega influencers have more diverse age groups
      return {
        ...pattern,
        ageDistribution: {
          ...pattern.ageDistribution,
          '25-34': pattern.ageDistribution['25-34'] + 5,
          '35-44': pattern.ageDistribution['35-44'] + 3,
          '18-24': pattern.ageDistribution['18-24'] - 8
        }
      };
    }
    return pattern;
  }

  adjustForSpanishAudience(pattern) {
    return {
      ...pattern,
      topLocations: ['Spain', 'Mexico', 'Argentina', 'Colombia', 'United States']
    };
  }

  generateRealisticDemographics(pattern, influencer) {
    // Add some realistic randomization
    const variance = 0.1; // 10% variance
    
    const applyVariance = (value) => {
      const randomFactor = 1 + (Math.random() - 0.5) * variance;
      return Math.max(0, Math.round(value * randomFactor));
    };

    // Ensure gender splits add up to 100
    let femalePercent = applyVariance(pattern.genderSplit.female);
    let malePercent = 100 - femalePercent;
    
    // Ensure age groups add up to 100
    let ageTotal = 0;
    const adjustedAges = {};
    Object.keys(pattern.ageDistribution).forEach(age => {
      adjustedAges[age] = applyVariance(pattern.ageDistribution[age]);
      ageTotal += adjustedAges[age];
    });
    
    // Normalize age groups to 100%
    Object.keys(adjustedAges).forEach(age => {
      adjustedAges[age] = Math.round((adjustedAges[age] / ageTotal) * 100);
    });

    return {
      gender: {
        female: femalePercent,
        male: malePercent
      },
      ageGroups: adjustedAges,
      topLocations: pattern.topLocations.slice(0, 5),
      interests: pattern.interests
    };
  }
}

class FirebaseDemographicEnhancer {
  constructor() {
    this.db = db;
    this.demographicService = new DemographicInferenceService();
    this.collectionName = 'enhanced_influencers';
    this.progressFile = 'enhancement_progress.json';
    this.batchSize = 25; // Firebase batch limit is 500, but we'll be conservative
    this.delay = 100; // 100ms between operations to avoid rate limits
  }

  async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        console.log(`📄 Loaded progress: ${progress.processed}/${progress.total} influencers processed`);
        return progress;
      }
    } catch (error) {
      console.log('⚠️  No existing progress file found, starting fresh');
    }
    return { processed: 0, total: 0, lastProcessedId: null };
  }

  async saveProgress(processed, total, lastProcessedId) {
    const progress = { processed, total, lastProcessedId, timestamp: new Date().toISOString() };
    fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
  }

  sanitizeDocumentId(id) {
    // Firebase document IDs must be valid and can't start with underscores
    return id
      .replace(/^_+/, '') // Remove leading underscores
      .replace(/_+$/, '') // Remove trailing underscores  
      .replace(/[^\w-]/g, '_') // Replace invalid chars with underscores
      .substring(0, 1500) // Firebase limit is 1500 characters
      || 'sanitized_id'; // Fallback if everything gets removed
  }

  async checkExistingData() {
    try {
      const snapshot = await getDocs(query(collection(this.db, this.collectionName), limit(1)));
      return !snapshot.empty;
    } catch (error) {
      return false;
    }
  }

  async enhanceInfluencers() {
    console.log('🚀 Starting Firebase Demographic Enhancement');
    console.log('==========================================');
    
    // Load influencers data
    const influencersPath = path.join(__dirname, '..', 'processed_influencers.json');
    if (!fs.existsSync(influencersPath)) {
      throw new Error('❌ processed_influencers.json not found!');
    }
    
    const influencers = JSON.parse(fs.readFileSync(influencersPath, 'utf8'));
    console.log(`📊 Loaded ${influencers.length} influencers from processed_influencers.json`);
    
    // Check if collection already has data
    const hasExistingData = await this.checkExistingData();
    if (hasExistingData) {
      console.log(`⚠️  Collection '${this.collectionName}' already contains data.`);
      console.log('Would you like to continue anyway? This will add/update records.');
    }
    
    // Load progress
    const progress = await this.loadProgress();
    let startIndex = progress.processed || 0;
    
    if (startIndex > 0) {
      console.log(`🔄 Resuming from influencer #${startIndex + 1}`);
    }
    
    console.log(`\n📈 Processing Plan:`);
    console.log(`   • Total influencers: ${influencers.length}`);
    console.log(`   • Remaining: ${influencers.length - startIndex}`);
    console.log(`   • Batch size: ${this.batchSize}`);
    console.log(`   • Estimated time: ${Math.ceil((influencers.length - startIndex) / this.batchSize * 2)} minutes\n`);
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = startIndex; i < influencers.length; i += this.batchSize) {
      const batch = writeBatch(this.db);
      const currentBatch = influencers.slice(i, Math.min(i + this.batchSize, influencers.length));
      
      console.log(`\n🔄 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(influencers.length / this.batchSize)} (${currentBatch.length} influencers)`);
      
      for (const influencer of currentBatch) {
        try {
          // Generate demographics
          const demographics = this.demographicService.generateDemographics(influencer);
          
          // Create enhanced influencer object
          const enhancedInfluencer = {
            ...influencer,
            audienceDemographics: demographics,
            enhancementDate: new Date().toISOString(),
            dataSource: 'ai_inference',
            confidenceLevel: 'enhanced'
          };
          
          // Sanitize document ID (Firebase doesn't allow certain characters)
          const sanitizedId = this.sanitizeDocumentId(influencer.id || influencer.handle);
          
          // Add to batch
          const docRef = doc(collection(this.db, this.collectionName), sanitizedId);
          batch.set(docRef, enhancedInfluencer);
          
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error processing ${influencer.handle}: ${error.message}`);
          errorCount++;
        }
      }
      
      try {
        // Commit the batch
        await batch.commit();
        console.log(`✅ Batch committed successfully`);
        
        // Update progress
        const lastInfluencer = currentBatch[currentBatch.length - 1];
        const lastSanitizedId = this.sanitizeDocumentId(lastInfluencer.id || lastInfluencer.handle);
        await this.saveProgress(i + currentBatch.length, influencers.length, lastSanitizedId);
        
        // Progress update
        const processed = i + currentBatch.length;
        const percentage = Math.round((processed / influencers.length) * 100);
        const elapsed = Date.now() - startTime;
        const rate = processed / (elapsed / 1000 / 60); // per minute
        const remaining = (influencers.length - processed) / rate;
        
        console.log(`📊 Progress: ${processed}/${influencers.length} (${percentage}%) | Rate: ${rate.toFixed(1)}/min | ETA: ${remaining.toFixed(1)}min`);
        
        // Small delay to avoid rate limits
        if (i + this.batchSize < influencers.length) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
      } catch (error) {
        console.error(`❌ Batch commit failed: ${error.message}`);
        throw error;
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000 / 60;
    
    console.log('\n🎉 Enhancement Complete!');
    console.log('========================');
    console.log(`✅ Successfully enhanced: ${successCount} influencers`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} minutes`);
    console.log(`📊 Average rate: ${(successCount / totalTime).toFixed(1)} influencers/minute`);
    console.log(`🔥 Collection: ${this.collectionName}`);
    
    // Clean up progress file
    if (fs.existsSync(this.progressFile)) {
      fs.unlinkSync(this.progressFile);
      console.log('🧹 Cleaned up progress file');
    }
  }

  async verifyEnhancement() {
    console.log('\n🔍 Verifying Enhancement Results');
    console.log('================================');
    
    try {
      const snapshot = await getDocs(collection(this.db, this.collectionName));
      const docs = snapshot.docs;
      
      console.log(`📊 Total documents in collection: ${docs.length}`);
      
      if (docs.length > 0) {
        // Sample a few documents to verify structure
        const sampleDoc = docs[0].data();
        console.log('\n✅ Sample document structure:');
        console.log(`   • Has audienceDemographics: ${!!sampleDoc.audienceDemographics}`);
        console.log(`   • Has gender data: ${!!sampleDoc.audienceDemographics?.gender}`);
        console.log(`   • Has age groups: ${!!sampleDoc.audienceDemographics?.ageGroups}`);
        console.log(`   • Has locations: ${!!sampleDoc.audienceDemographics?.topLocations}`);
        console.log(`   • Has interests: ${!!sampleDoc.audienceDemographics?.interests}`);
        
        // Quick stats
        let femaleTotal = 0;
        let maleTotal = 0;
        let validDemographics = 0;
        
        docs.slice(0, Math.min(100, docs.length)).forEach(doc => {
          const data = doc.data();
          if (data.audienceDemographics?.gender) {
            femaleTotal += data.audienceDemographics.gender.female;
            maleTotal += data.audienceDemographics.gender.male;
            validDemographics++;
          }
        });
        
        if (validDemographics > 0) {
          console.log(`\n📈 Sample Statistics (first ${validDemographics} docs):`);
          console.log(`   • Average female audience: ${Math.round(femaleTotal / validDemographics)}%`);
          console.log(`   • Average male audience: ${Math.round(maleTotal / validDemographics)}%`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Verification failed: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  try {
    const enhancer = new FirebaseDemographicEnhancer();
    await enhancer.enhanceInfluencers();
    await enhancer.verifyEnhancement();
    
    console.log('\n🎉 All done! Your influencers are now enhanced with demographic data in Firebase.');
    console.log(`💡 You can now query the '${enhancer.collectionName}' collection for all your enhanced influencers.`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted. Progress has been saved and can be resumed.');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { FirebaseDemographicEnhancer }; 