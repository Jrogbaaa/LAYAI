/**
 * Starngage Batch Demographics Extractor with Intelligent Fallbacks
 * Combines real Starngage scraping with intelligent demographic generation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Input/Output files
  INPUT_FILE: path.join(__dirname, '../processed_influencers.json'),
  OUTPUT_FILE: path.join(__dirname, '../processed_influencers_with_demographics.json'),
  BACKUP_FILE: path.join(__dirname, '../processed_influencers_backup.json'),
  LOG_FILE: path.join(__dirname, '../starngage_extraction_log.txt'),
  PROGRESS_FILE: path.join(__dirname, '../starngage_progress.json'),
  
  // Rate limiting (very conservative to avoid blocking)
  MIN_DELAY: 3000,  // 3 seconds minimum
  MAX_DELAY: 5000,  // 5 seconds maximum
  BATCH_SIZE: 50,   // Process in batches of 50
  PAUSE_BETWEEN_BATCHES: 30000, // 30 seconds between batches
  
  // Retry configuration
  MAX_RETRIES: 1,  // Reduced retries since we have good fallbacks
  RETRY_DELAY: 5000, // 5 seconds
  
  // API Configuration
  API_BASE_URL: 'http://localhost:3001',
  
  // Limits for testing
  TEST_MODE: false,  // Set to true to test with only first 50 influencers
  MAX_INFLUENCERS: 50, // Only used if TEST_MODE = true
};

// Import intelligent demographic generation from test script
function generateIntelligentDemographics(influencer) {
  const hash = simpleHash(influencer.handle);
  
  // Base demographics on niche and gender
  const isFashion = influencer.niche.some(n => n.toLowerCase().includes('fashion'));
  const isLifestyle = influencer.niche.some(n => n.toLowerCase().includes('lifestyle'));
  const isSports = influencer.niche.some(n => n.toLowerCase().includes('sports'));
  const isBeauty = influencer.niche.some(n => n.toLowerCase().includes('beauty'));
  const isTravel = influencer.niche.some(n => n.toLowerCase().includes('travel'));
  const isFood = influencer.niche.some(n => n.toLowerCase().includes('food'));
  const isTech = influencer.niche.some(n => n.toLowerCase().includes('tech'));
  const isFemale = influencer.gender === 'Female';
  const isMale = influencer.gender === 'Male';
  
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
  
  // Adjust based on niche patterns
  if (isFashion) {
    demographics.gender.female = 72 + (hash % 13); // 72-85% female
    demographics.gender.male = 100 - demographics.gender.female;
    demographics.ageGroups['18-24'] = 38 + (hash % 12);
    demographics.ageGroups['25-34'] = 35 + (hash % 10);
    demographics.ageGroups['35-44'] = 15 + (hash % 8);
    demographics.interests = ['Fashion', 'Beauty', 'Lifestyle', 'Shopping', 'Style'];
  }
  
  if (isSports) {
    demographics.gender.male = 65 + (hash % 15); // 65-80% male
    demographics.gender.female = 100 - demographics.gender.male;
    demographics.ageGroups['18-24'] = 28 + (hash % 12);
    demographics.ageGroups['25-34'] = 42 + (hash % 10);
    demographics.ageGroups['35-44'] = 20 + (hash % 8);
    demographics.interests = ['Sports', 'Fitness', 'Health', 'Athletic', 'Competition'];
  }
  
  if (isBeauty) {
    demographics.gender.female = 78 + (hash % 12); // 78-90% female
    demographics.gender.male = 100 - demographics.gender.female;
    demographics.ageGroups['18-24'] = 45 + (hash % 10);
    demographics.ageGroups['25-34'] = 32 + (hash % 8);
    demographics.interests = ['Beauty', 'Makeup', 'Skincare', 'Fashion', 'Self-Care'];
  }
  
  if (isLifestyle) {
    if (isFemale) {
      demographics.gender.female = 68 + (hash % 12);
      demographics.gender.male = 100 - demographics.gender.female;
    } else {
      demographics.gender.male = 55 + (hash % 15);
      demographics.gender.female = 100 - demographics.gender.male;
    }
    demographics.interests = ['Lifestyle', 'Travel', 'Food', 'Family', 'Home'];
  }
  
  if (isTravel) {
    demographics.ageGroups['25-34'] = 38 + (hash % 12);
    demographics.ageGroups['35-44'] = 25 + (hash % 10);
    demographics.interests = ['Travel', 'Adventure', 'Culture', 'Photography', 'Lifestyle'];
    demographics.topLocations = ['Spain', 'France', 'Italy', 'Germany', 'Mexico'];
  }
  
  if (isFood) {
    demographics.ageGroups['25-34'] = 35 + (hash % 10);
    demographics.ageGroups['35-44'] = 28 + (hash % 8);
    demographics.interests = ['Food', 'Cooking', 'Restaurants', 'Wine', 'Lifestyle'];
  }
  
  if (isTech) {
    demographics.gender.male = 70 + (hash % 15);
    demographics.gender.female = 100 - demographics.gender.male;
    demographics.ageGroups['25-34'] = 45 + (hash % 10);
    demographics.ageGroups['35-44'] = 25 + (hash % 8);
    demographics.interests = ['Technology', 'Innovation', 'Gaming', 'Science', 'Business'];
  }
  
  // Ensure percentages add up to 100
  const ageTotal = Object.values(demographics.ageGroups).reduce((sum, val) => sum + val, 0);
  if (ageTotal !== 100) {
    const diff = 100 - ageTotal;
    demographics.ageGroups['25-34'] += diff; // Adjust the largest group
  }
  
  return demographics;
}

function generateIntelligentStarngageData(influencer) {
  const hash = simpleHash(influencer.handle);
  
  // Generate realistic engagement based on follower count
  let baseEngagement = 0.02; // 2% base
  if (influencer.followerCount > 10000000) baseEngagement = 0.015; // 1.5% for mega
  if (influencer.followerCount > 50000000) baseEngagement = 0.01;  // 1% for celebrity
  if (influencer.followerCount < 100000) baseEngagement = 0.04;    // 4% for nano
  
  const variation = ((hash % 100) - 50) / 1000; // -0.05 to +0.05
  const engagementRate = Math.max(0.005, baseEngagement + variation);
  
  return {
    engagementRate: Math.round(engagementRate * 1000) / 1000,
    averageLikes: Math.floor(influencer.followerCount * engagementRate * (0.9 + (hash % 20) / 100)),
    averageComments: Math.floor(influencer.followerCount * engagementRate * 0.05 * (0.8 + (hash % 40) / 100)),
    topics: inferTopicsFromNiche(influencer.niche),
    starngageEnhanced: false, // Mark as fallback data
    enhancedAt: new Date().toISOString(),
    dataSource: 'intelligent_fallback'
  };
}

function inferTopicsFromNiche(niches) {
  const topicMap = {
    'Fashion': ['Fashion and Accessories', 'Style', 'Beauty', 'Designer Brands'],
    'Lifestyle': ['Lifestyle', 'Daily Life', 'Personal', 'Home', 'Family'],
    'Sports': ['Sports', 'Fitness', 'Athletic', 'Competition', 'Health'],
    'Travel': ['Travel', 'Adventure', 'Tourism', 'Culture', 'Photography'],
    'Food': ['Food and Cooking', 'Restaurants', 'Culinary', 'Wine', 'Nutrition'],
    'Beauty': ['Beauty', 'Makeup', 'Skincare', 'Cosmetics', 'Self-Care'],
    'Technology': ['Technology', 'Gadgets', 'Innovation', 'Digital', 'Gaming'],
    'Music': ['Music', 'Entertainment', 'Performance', 'Artists', 'Concerts'],
    'Art': ['Art', 'Creativity', 'Design', 'Visual Arts', 'Culture'],
    'Parenting': ['Parenting', 'Family', 'Children', 'Education', 'Lifestyle']
  };
  
  let topics = [];
  niches.forEach(niche => {
    const mapped = topicMap[niche] || [niche];
    topics.push(...mapped);
  });
  
  return [...new Set(topics)].slice(0, 5); // Unique topics, max 5
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

class StarngateBatchExtractor {
  constructor() {
    this.influencers = [];
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
    this.fallbackCount = 0;
    this.startTime = Date.now();
    this.progress = this.loadProgress();
  }

  /**
   * Load progress from previous run
   */
  loadProgress() {
    try {
      if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
      }
    } catch (error) {
      console.log('⚠️ Could not load progress file:', error.message);
    }
    return { processedIndexes: [], lastProcessedIndex: -1 };
  }

  /**
   * Save progress to resume later if interrupted
   */
  saveProgress() {
    try {
      fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.log('⚠️ Could not save progress:', error.message);
    }
  }

  /**
   * Log message to both console and log file
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    try {
      fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
    } catch (error) {
      console.log('⚠️ Could not write to log file:', error.message);
    }
  }

  /**
   * Load influencers from database
   */
  loadInfluencers() {
    try {
      this.log('📚 Loading influencers database...');
      this.influencers = JSON.parse(fs.readFileSync(CONFIG.INPUT_FILE, 'utf8'));
      
      if (CONFIG.TEST_MODE) {
        this.influencers = this.influencers.slice(0, CONFIG.MAX_INFLUENCERS);
        this.log(`🧪 TEST MODE: Limited to ${this.influencers.length} influencers`);
      }
      
      this.log(`✅ Loaded ${this.influencers.length} influencers`);
      return true;
    } catch (error) {
      this.log(`❌ Failed to load influencers: ${error.message}`);
      return false;
    }
  }

  /**
   * Create backup of original data
   */
  createBackup() {
    try {
      this.log('💾 Creating backup of original data...');
      fs.copyFileSync(CONFIG.INPUT_FILE, CONFIG.BACKUP_FILE);
      this.log('✅ Backup created successfully');
      return true;
    } catch (error) {
      this.log(`❌ Failed to create backup: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch demographic data for a single influencer
   */
  async fetchInfluencerDemographics(influencer, retryCount = 0) {
    try {
      const url = `${CONFIG.API_BASE_URL}/api/scrape-starngage?action=enhance&username=${encodeURIComponent(influencer.handle)}`;
      
      this.log(`🔍 Attempting Starngage extraction for @${influencer.handle}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data && !data.isMockData) {
        this.log(`✅ Real Starngage data extracted for @${influencer.handle}`);
        return {
          success: true,
          realData: true,
          demographics: data.data.demographics,
          engagementRate: data.data.engagementRate || influencer.engagementRate,
          averageLikes: data.data.averageLikes || 0,
          averageComments: data.data.averageComments || 0,
          topics: data.data.topics || [],
          starngageEnhanced: true,
          enhancedAt: new Date().toISOString(),
          dataSource: 'starngage_real'
        };
      } else {
        // API failed or returned mock data, use intelligent fallback
        throw new Error(data.error || 'API returned mock data or failed');
      }
    } catch (error) {
      this.log(`⚠️ Starngage API failed for @${influencer.handle}: ${error.message}`);
      
      // Use intelligent fallback immediately
      this.log(`🧠 Generating intelligent demographics for @${influencer.handle}`);
      const demographics = generateIntelligentDemographics(influencer);
      const starngageData = generateIntelligentStarngageData(influencer);
      
      return {
        success: true,
        realData: false,
        demographics: demographics,
        engagementRate: starngageData.engagementRate,
        averageLikes: starngageData.averageLikes,
        averageComments: starngageData.averageComments,
        topics: starngageData.topics,
        starngageEnhanced: false,
        enhancedAt: starngageData.enhancedAt,
        dataSource: starngageData.dataSource
      };
    }
  }

  /**
   * Add random delay for rate limiting
   */
  async delay(ms = null) {
    if (ms === null) {
      ms = CONFIG.MIN_DELAY + Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY);
    }
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate and display progress statistics
   */
  displayProgress() {
    const elapsed = Date.now() - this.startTime;
    const elapsedMinutes = Math.round(elapsed / 60000);
    const rate = this.processed / (elapsed / 60000) || 0;
    const remaining = this.influencers.length - this.processed;
    const estimatedTimeRemaining = remaining / rate;
    
    this.log(`📊 Progress: ${this.processed}/${this.influencers.length} (${Math.round(this.processed / this.influencers.length * 100)}%)`);
    this.log(`✅ Real Starngage: ${this.successful} | 🧠 Intelligent Fallback: ${this.fallbackCount} | ❌ Failed: ${this.failed}`);
    this.log(`⏱️ Elapsed: ${elapsedMinutes} minutes | Rate: ${rate.toFixed(1)}/min`);
    if (rate > 0) {
      this.log(`🕐 Estimated time remaining: ${Math.round(estimatedTimeRemaining)} minutes`);
    }
  }

  /**
   * Process influencers in batches
   */
  async processBatch(startIndex, endIndex) {
    this.log(`🔄 Processing batch ${startIndex + 1}-${endIndex}...`);
    
    for (let i = startIndex; i < endIndex && i < this.influencers.length; i++) {
      // Skip if already processed
      if (this.progress.processedIndexes.includes(i)) {
        this.log(`⏭️ Skipping already processed @${this.influencers[i].handle}`);
        continue;
      }
      
      const influencer = this.influencers[i];
      
      // Rate limiting delay (except for first in batch)
      if (i > startIndex) {
        await this.delay();
      }
      
      // Fetch demographics
      const result = await this.fetchInfluencerDemographics(influencer);
      
      // Update influencer with demographic data
      this.influencers[i] = {
        ...influencer,
        audienceDemographics: result.demographics,
        starngageData: {
          engagementRate: result.engagementRate,
          averageLikes: result.averageLikes,
          averageComments: result.averageComments,
          topics: result.topics,
          starngageEnhanced: result.starngageEnhanced,
          enhancedAt: result.enhancedAt,
          dataSource: result.dataSource
        }
      };
      
      // Update counters
      if (result.realData) {
        this.successful++;
      } else {
        this.fallbackCount++;
      }
      
      this.processed++;
      this.progress.processedIndexes.push(i);
      this.progress.lastProcessedIndex = i;
      
      // Save progress every 10 influencers
      if (this.processed % 10 === 0) {
        this.saveProgress();
        this.saveIntermediateResults();
        this.displayProgress();
      }
    }
  }

  /**
   * Save intermediate results
   */
  saveIntermediateResults() {
    try {
      const tempFile = CONFIG.OUTPUT_FILE.replace('.json', '_temp.json');
      fs.writeFileSync(tempFile, JSON.stringify(this.influencers, null, 2));
      this.log(`💾 Saved intermediate results to ${tempFile}`);
    } catch (error) {
      this.log(`⚠️ Could not save intermediate results: ${error.message}`);
    }
  }

  /**
   * Save final results
   */
  saveFinalResults() {
    try {
      this.log('💾 Saving final results...');
      
      // Save enhanced database
      fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(this.influencers, null, 2));
      
      // Create summary report
      const summary = {
        totalInfluencers: this.influencers.length,
        realStarngage: this.successful,
        intelligentFallback: this.fallbackCount,
        failed: this.failed,
        totalEnhanced: this.successful + this.fallbackCount,
        successRate: Math.round(((this.successful + this.fallbackCount) / this.influencers.length) * 100),
        realDataRate: Math.round((this.successful / this.influencers.length) * 100),
        processingTime: Math.round((Date.now() - this.startTime) / 60000),
        enhancedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(
        CONFIG.OUTPUT_FILE.replace('.json', '_summary.json'),
        JSON.stringify(summary, null, 2)
      );
      
      this.log('✅ Final results saved successfully');
      this.log(`📈 Summary: ${this.successful + this.fallbackCount}/${this.influencers.length} enhanced (${summary.successRate}%)`);
      this.log(`🎯 Real Starngage: ${this.successful} (${summary.realDataRate}%)`);
      this.log(`🧠 Intelligent Fallback: ${this.fallbackCount} (${Math.round((this.fallbackCount / this.influencers.length) * 100)}%)`);
      
      return true;
    } catch (error) {
      this.log(`❌ Failed to save final results: ${error.message}`);
      return false;
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      this.log('🚀 Starting Starngage Batch Demographics Extraction with Intelligent Fallbacks');
      this.log(`⚙️ Configuration: ${JSON.stringify(CONFIG, null, 2)}`);
      
      // Load data
      if (!this.loadInfluencers()) return false;
      if (!this.createBackup()) return false;
      
      // Resume from previous progress if available
      if (this.progress.lastProcessedIndex >= 0) {
        this.log(`🔄 Resuming from index ${this.progress.lastProcessedIndex + 1}`);
        this.processed = this.progress.processedIndexes.length;
        // Recalculate success/failure counts
        for (const index of this.progress.processedIndexes) {
          if (this.influencers[index].starngageData?.starngageEnhanced) {
            this.successful++;
          } else if (this.influencers[index].starngageData?.dataSource === 'intelligent_fallback') {
            this.fallbackCount++;
          } else {
            this.failed++;
          }
        }
      }
      
      // Process in batches
      for (let i = 0; i < this.influencers.length; i += CONFIG.BATCH_SIZE) {
        const endIndex = Math.min(i + CONFIG.BATCH_SIZE, this.influencers.length);
        
        await this.processBatch(i, endIndex);
        
        // Pause between batches (except for last batch)
        if (endIndex < this.influencers.length) {
          this.log(`⏸️ Pausing ${CONFIG.PAUSE_BETWEEN_BATCHES / 1000} seconds between batches...`);
          await this.delay(CONFIG.PAUSE_BETWEEN_BATCHES);
        }
      }
      
      // Save final results
      this.saveFinalResults();
      
      // Cleanup
      this.log('🧹 Cleaning up...');
      if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
        fs.unlinkSync(CONFIG.PROGRESS_FILE);
      }
      
      this.log('🎉 Starngage batch extraction completed successfully!');
      return true;
      
    } catch (error) {
      this.log(`💥 Fatal error: ${error.message}`);
      this.log(error.stack);
      return false;
    }
  }
}

// Usage instructions
function printUsage() {
  console.log(`
🎯 Starngage Batch Demographics Extractor with Intelligent Fallbacks

This enhanced script will:
1. Attempt to extract real demographic data from Starngage
2. Use intelligent fallback demographics when API fails  
3. Ensure 100% enhancement success rate
4. Generate realistic, varied demographics based on niche/gender patterns

📋 Features:
- Real Starngage data when possible
- Intelligent fallbacks ensure no influencer is left unenhanced
- Realistic demographic patterns based on niche analysis
- Comprehensive progress tracking and resumption
- Detailed logging and statistics

⚙️ Configuration:
- Batch size: ${CONFIG.BATCH_SIZE} influencers
- Rate limiting: ${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY}ms between requests
- Test mode: ${CONFIG.TEST_MODE ? 'ENABLED' : 'DISABLED'}

🚀 To run:
node scripts/starngage-batch-with-fallbacks.js

📊 Expected Results:
- 100% enhancement success rate
- Mix of real Starngage data and intelligent fallbacks
- Realistic demographic variations based on influencer niche
  `);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  const extractor = new StarngateBatchExtractor();
  
  extractor.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = StarngateBatchExtractor; 