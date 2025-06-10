import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { HistoricalCampaign, HistoricalTalent, MatchingPattern, CampaignIntelligence } from '@/types/database';

export class CampaignDatabase {
  private static readonly CAMPAIGNS_COLLECTION = 'historical_campaigns';
  private static readonly PATTERNS_COLLECTION = 'matching_patterns';
  private static readonly INTELLIGENCE_COLLECTION = 'campaign_intelligence';
  private static readonly TALENTS_COLLECTION = 'historical_talents';

  // Save historical campaign to database
  static async saveCampaign(campaign: HistoricalCampaign): Promise<string> {
    try {
      const campaignData = {
        ...campaign,
        createdDate: Timestamp.fromDate(campaign.createdDate),
        launchDate: campaign.launchDate ? Timestamp.fromDate(campaign.launchDate) : null,
        endDate: campaign.endDate ? Timestamp.fromDate(campaign.endDate) : null,
      };

      const docRef = await addDoc(collection(db, this.CAMPAIGNS_COLLECTION), campaignData);
      
      // Save individual talents for easier querying
      await this.saveTalents(campaign.talents, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving campaign:', error);
      throw error;
    }
  }

  // Save talents separately for better indexing
  private static async saveTalents(talents: HistoricalTalent[], campaignId: string): Promise<void> {
    const talentPromises = talents.map(talent => {
      const talentData = {
        ...talent,
        campaignId,
        createdAt: Timestamp.now()
      };
      return addDoc(collection(db, this.TALENTS_COLLECTION), talentData);
    });

    await Promise.all(talentPromises);
  }

  // Get all historical campaigns
  static async getAllCampaigns(): Promise<HistoricalCampaign[]> {
    try {
      const q = query(
        collection(db, this.CAMPAIGNS_COLLECTION),
        orderBy('createdDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdDate: doc.data().createdDate?.toDate() || new Date(),
        launchDate: doc.data().launchDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
      } as HistoricalCampaign));
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw error;
    }
  }

  // Get campaigns by industry for learning
  static async getCampaignsByIndustry(industry: string): Promise<HistoricalCampaign[]> {
    try {
      const q = query(
        collection(db, this.CAMPAIGNS_COLLECTION),
        where('industry', '==', industry),
        where('status', '==', 'successful'),
        orderBy('successScore', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdDate: doc.data().createdDate?.toDate() || new Date(),
        launchDate: doc.data().launchDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
      } as HistoricalCampaign));
    } catch (error) {
      console.error('Error getting campaigns by industry:', error);
      throw error;
    }
  }

  // Get successful talent patterns
  static async getSuccessfulTalentsByCategory(category: string): Promise<HistoricalTalent[]> {
    try {
      const q = query(
        collection(db, this.TALENTS_COLLECTION),
        where('category', '==', category),
        where('wasConfirmed', '==', true),
        where('performanceRating', '>=', 8),
        orderBy('performanceRating', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data()
      } as HistoricalTalent));
    } catch (error) {
      console.error('Error getting successful talents:', error);
      throw error;
    }
  }

  // Save matching pattern learned from data
  static async saveMatchingPattern(pattern: MatchingPattern): Promise<string> {
    try {
      const patternData = {
        ...pattern,
        lastUsed: Timestamp.fromDate(pattern.lastUsed)
      };

      const docRef = await addDoc(collection(db, this.PATTERNS_COLLECTION), patternData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving pattern:', error);
      throw error;
    }
  }

  // Get matching patterns for a specific industry and budget
  static async getMatchingPatterns(industry: string, budgetRange: { min: number; max: number }): Promise<MatchingPattern[]> {
    try {
      const q = query(
        collection(db, this.PATTERNS_COLLECTION),
        where('brandIndustry', '==', industry),
        where('budgetRange.min', '<=', budgetRange.max),
        where('budgetRange.max', '>=', budgetRange.min),
        orderBy('successRate', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUsed: doc.data().lastUsed?.toDate() || new Date(),
      } as MatchingPattern));
    } catch (error) {
      console.error('Error getting matching patterns:', error);
      throw error;
    }
  }

  // Update pattern usage statistics
  static async updatePatternUsage(patternId: string, wasSuccessful: boolean): Promise<void> {
    try {
      const patternRef = doc(db, this.PATTERNS_COLLECTION, patternId);
      const patternDoc = await getDoc(patternRef);
      
      if (patternDoc.exists()) {
        const currentData = patternDoc.data();
        const updates: any = {
          timesUsed: (currentData.timesUsed || 0) + 1,
          lastUsed: Timestamp.now()
        };

        if (wasSuccessful) {
          updates.successCount = (currentData.successCount || 0) + 1;
          updates.successRate = updates.successCount / updates.timesUsed;
        }

        await updateDoc(patternRef, updates);
      }
    } catch (error) {
      console.error('Error updating pattern usage:', error);
      throw error;
    }
  }

  // Generate campaign intelligence from stored data
  static async generateCampaignIntelligence(): Promise<CampaignIntelligence> {
    try {
      const campaigns = await this.getAllCampaigns();
      const talents = await this.getAllTalents();

      // Analyze industry trends
      const industryTrends = this.analyzeIndustryTrends(campaigns);
      
      // Analyze talent performance
      const talentPerformance = this.analyzeTalentPerformance(talents);
      
      // Analyze market rates
      const marketRates = this.analyzeMarketRates(talents);
      
      // Generate success predictors
      const successPredictors = this.generateSuccessPredictors(campaigns);

      const intelligence: CampaignIntelligence = {
        id: `intelligence-${Date.now()}`,
        industryTrends,
        talentPerformance,
        marketRates,
        successPredictors
      };

      // Save the intelligence to database
      await addDoc(collection(db, this.INTELLIGENCE_COLLECTION), intelligence);

      return intelligence;
    } catch (error) {
      console.error('Error generating campaign intelligence:', error);
      throw error;
    }
  }

  // Get all talents for analysis
  private static async getAllTalents(): Promise<HistoricalTalent[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.TALENTS_COLLECTION));
      return querySnapshot.docs.map(doc => doc.data() as HistoricalTalent);
    } catch (error) {
      console.error('Error getting all talents:', error);
      throw error;
    }
  }

  // Analysis methods
  private static analyzeIndustryTrends(campaigns: HistoricalCampaign[]): any[] {
    const industryMap = new Map<string, any>();

    campaigns.forEach(campaign => {
      if (!industryMap.has(campaign.industry)) {
        industryMap.set(campaign.industry, {
          category: campaign.industry,
          budgets: [],
          talentTypes: new Set(),
          commitments: new Set(),
          successfulCampaigns: 0,
          totalCampaigns: 0
        });
      }

      const industry = industryMap.get(campaign.industry)!;
      industry.budgets.push(campaign.budget);
      industry.totalCampaigns++;
      
      if (campaign.status === 'successful') {
        industry.successfulCampaigns++;
      }

      campaign.talents.forEach(talent => {
        industry.talentTypes.add(talent.category);
        industry.commitments.add(talent.commitment);
      });
    });

    return Array.from(industryMap.values()).map(industry => ({
      category: industry.category,
      averageBudget: industry.budgets.reduce((a: number, b: number) => a + b, 0) / industry.budgets.length,
      successfulTalentTypes: Array.from(industry.talentTypes),
      optimalTiming: ['Q1', 'Q4'], // Default - would need more data
      commonCommitments: Array.from(industry.commitments)
    }));
  }

  private static analyzeTalentPerformance(talents: HistoricalTalent[]): any[] {
    const talentMap = new Map<string, any>();

    talents.forEach(talent => {
      if (!talentMap.has(talent.name)) {
        talentMap.set(talent.name, {
          talentId: talent.name,
          performances: [],
          industries: new Set(),
          budgets: [],
          confirmations: 0,
          totalCampaigns: 0
        });
      }

      const talentData = talentMap.get(talent.name)!;
      talentData.performances.push(talent.performanceRating);
      talentData.budgets.push(talent.fee);
      talentData.totalCampaigns++;
      
      if (talent.wasConfirmed) {
        talentData.confirmations++;
      }
    });

    return Array.from(talentMap.values()).map(talent => ({
      talentId: talent.talentId,
      successRate: talent.confirmations / talent.totalCampaigns,
      averagePerformance: talent.performances.reduce((a: number, b: number) => a + b, 0) / talent.performances.length,
      bestIndustries: Array.from(talent.industries),
      optimalBudgetRange: {
        min: Math.min(...talent.budgets),
        max: Math.max(...talent.budgets)
      },
      reliabilityScore: talent.confirmations / talent.totalCampaigns * 100
    }));
  }

  private static analyzeMarketRates(talents: HistoricalTalent[]): any[] {
    const categoryMap = new Map<string, any>();

    talents.forEach(talent => {
      const followerRange = this.getFollowerRange(talent.followerCount);
      const key = `${talent.category}-${followerRange}`;

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category: talent.category,
          followerRange,
          fees: []
        });
      }

      categoryMap.get(key)!.fees.push(talent.fee);
    });

    return Array.from(categoryMap.values()).map(category => ({
      category: category.category,
      followerRange: category.followerRange,
      averageFee: category.fees.reduce((a: number, b: number) => a + b, 0) / category.fees.length,
      feeRange: {
        min: Math.min(...category.fees),
        max: Math.max(...category.fees)
      },
      lastUpdated: new Date()
    }));
  }

  private static generateSuccessPredictors(campaigns: HistoricalCampaign[]): any[] {
    return [
      { factor: 'Talent Engagement Rate > 3%', weight: 0.25, description: 'High engagement correlates with campaign success' },
      { factor: 'Budget Allocation per Talent', weight: 0.20, description: 'Adequate budget ensures quality content' },
      { factor: 'Audience Alignment', weight: 0.20, description: 'Target audience match is crucial' },
      { factor: 'Talent Credibility Score', weight: 0.15, description: 'Authentic influencers perform better' },
      { factor: 'Campaign Timing', weight: 0.10, description: 'Seasonal and trending factors matter' },
      { factor: 'Content Format Mix', weight: 0.10, description: 'Diverse content formats increase reach' }
    ];
  }

  private static getFollowerRange(followers: number): string {
    if (followers < 10000) return '0-10K';
    if (followers < 50000) return '10K-50K';
    if (followers < 100000) return '50K-100K';
    if (followers < 500000) return '100K-500K';
    if (followers < 1000000) return '500K-1M';
    return '1M+';
  }
} 