/**
 * Starngage Batch Demographics Extractor
 * One-time script to extract demographic data for all influencers in the database
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
  MAX_RETRIES: 3,
  RETRY_DELAY: 10000, // 10 seconds
  
  // API Configuration
  API_BASE_URL: 'http://localhost:3001',
  
  // Limits for testing
  TEST_MODE: true,  // Set to true to test with only first 10 influencers
  MAX_INFLUENCERS: 5, // Only used if TEST_MODE = true
};

class StarngateBatchExtractor {
  constructor() {
    this.influencers = [];
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
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
      
      this.log(`🔍 Fetching demographics for @${influencer.handle} (${influencer.name})`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        this.log(`✅ Successfully extracted demographics for @${influencer.handle}`);
        return {
          success: true,
          demographics: data.data.demographics,
          engagementRate: data.data.engagementRate || influencer.engagementRate,
          averageLikes: data.data.averageLikes || 0,
          averageComments: data.data.averageComments || 0,
          topics: data.data.topics || [],
          starngageEnhanced: !data.isMockData,
          enhancedAt: new Date().toISOString()
        };
      } else {
        this.log(`⚠️ No demographic data for @${influencer.handle}: ${data.error || 'Unknown error'}`);
        return { success: false, error: data.error || 'No data available' };
      }
    } catch (error) {
      this.log(`❌ Error fetching @${influencer.handle}: ${error.message}`);
      
      // Retry logic
      if (retryCount < CONFIG.MAX_RETRIES) {
        this.log(`🔄 Retrying @${influencer.handle} (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
        await this.delay(CONFIG.RETRY_DELAY);
        return this.fetchInfluencerDemographics(influencer, retryCount + 1);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Add random delay for rate limiting
   */
  async delay(ms = null) {
    if (ms === null) {
      ms = CONFIG.MIN_DELAY + Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY);
    }
    this.log(`⏳ Rate limiting delay: ${Math.round(ms)}ms`);
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
    this.log(`✅ Successful: ${this.successful} | ❌ Failed: ${this.failed}`);
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
      
      // Rate limiting delay
      if (i > startIndex) {
        await this.delay();
      }
      
      // Fetch demographics
      const result = await this.fetchInfluencerDemographics(influencer);
      
      // Update influencer with demographic data
      if (result.success) {
        this.influencers[i] = {
          ...influencer,
          audienceDemographics: result.demographics,
          starngageData: {
            engagementRate: result.engagementRate,
            averageLikes: result.averageLikes,
            averageComments: result.averageComments,
            topics: result.topics,
            starngageEnhanced: result.starngageEnhanced,
            enhancedAt: result.enhancedAt
          }
        };
        this.successful++;
      } else {
        // Add fallback demographic data
        this.influencers[i] = {
          ...influencer,
          starngageData: {
            error: result.error,
            starngageEnhanced: false,
            enhancedAt: new Date().toISOString()
          }
        };
        this.failed++;
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
        successfulEnhancements: this.successful,
        failedEnhancements: this.failed,
        successRate: Math.round((this.successful / this.influencers.length) * 100),
        processingTime: Math.round((Date.now() - this.startTime) / 60000),
        enhancedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(
        CONFIG.OUTPUT_FILE.replace('.json', '_summary.json'),
        JSON.stringify(summary, null, 2)
      );
      
      this.log('✅ Final results saved successfully');
      this.log(`📈 Summary: ${this.successful}/${this.influencers.length} enhanced (${summary.successRate}%)`);
      
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
      this.log('🚀 Starting Starngage Batch Demographics Extraction');
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
🎯 Starngage Batch Demographics Extractor

This script will:
1. Load all influencers from processed_influencers.json
2. Extract demographic data from Starngage for each influencer
3. Save enhanced data to processed_influencers_with_demographics.json
4. Create detailed logs and progress tracking

📋 Before running:
1. Ensure your Next.js dev server is running (npm run dev)
2. Check that /api/scrape-starngage endpoint is working
3. Consider setting TEST_MODE=true for initial testing

⚙️ Configuration:
- Batch size: ${CONFIG.BATCH_SIZE} influencers
- Rate limiting: ${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY}ms between requests
- Pause between batches: ${CONFIG.PAUSE_BETWEEN_BATCHES / 1000} seconds
- Test mode: ${CONFIG.TEST_MODE ? 'ENABLED' : 'DISABLED'}

🚀 To run:
node scripts/starngage-batch-demographics.js

📊 Progress will be saved automatically and can be resumed if interrupted.
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