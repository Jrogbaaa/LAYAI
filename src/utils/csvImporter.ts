import { HistoricalCampaign, HistoricalTalent, ImportedCampaignData, CSVImportResult } from '@/types/database';

export class CampaignCSVImporter {
  
  // Parse Orange/TSL style CSV
  static parseOrangeCSV(csvContent: string): ImportedCampaignData {
    const lines = csvContent.split('\n').map(line => line.split(','));
    
    // Extract campaign info from header
    const campaignInfo = this.extractOrangeCampaignInfo(lines);
    const talents = this.extractOrangeTalents(lines);
    
    const historicalCampaign: HistoricalCampaign = {
      id: `orange-${Date.now()}`,
      client: campaignInfo.client,
      campaignName: campaignInfo.campaign,
      budget: campaignInfo.budget,
      currency: 'EUR',
      industry: this.inferIndustry(campaignInfo.client),
      campaignType: 'brand_awareness',
      
      // Mark as successful since these are real campaigns
      status: 'successful',
      successScore: 85, // Default high score for completed campaigns
      actualReach: talents.reduce((sum, t) => sum + t.followerCount, 0),
      actualEngagement: talents.reduce((sum, t) => sum + (t.followerCount * t.engagementRate), 0),
      
      createdDate: new Date(),
      agencyName: 'TSL',
      
      talents: talents,
      successFactors: this.inferSuccessFactors(campaignInfo, talents),
      lessonsLearned: [],
      targetAudience: this.inferTargetAudience(talents)
    };

    return {
      rawData: lines,
      parsedCampaign: historicalCampaign,
      confidence: 0.9,
      needsReview: false
    };
  }

  // Parse Hibiki style CSV
  static parseHibikiCSV(csvContent: string): ImportedCampaignData {
    const lines = csvContent.split('\n').map(line => line.split(','));
    
    const talents = this.extractHibikiTalents(lines);
    
    const historicalCampaign: HistoricalCampaign = {
      id: `hibiki-${Date.now()}`,
      client: 'Hibiki',
      campaignName: 'Luxury Spirits Campaign',
      budget: talents.reduce((sum, t) => sum + t.fee, 0),
      currency: 'EUR',
      industry: 'luxury_spirits',
      campaignType: 'luxury_brand_awareness',
      
      status: 'successful',
      successScore: 90, // Luxury campaigns typically have high engagement
      actualReach: talents.reduce((sum, t) => sum + t.followerCount, 0),
      actualEngagement: talents.reduce((sum, t) => sum + (t.followerCount * t.engagementRate), 0),
      
      createdDate: new Date(),
      agencyName: 'Hibiki',
      
      talents: talents,
      successFactors: ['luxury_positioning', 'curated_talent_selection', 'cultural_authenticity'],
      lessonsLearned: [],
      targetAudience: {
        primaryAge: '25-34',
        secondaryAge: '35-44',
        genderSplit: { male: 40, female: 60 },
        interests: ['luxury', 'art', 'culture', 'gastronomy'],
        behaviors: ['early_adopters', 'cultural_influencers'],
        geography: ['Spain', 'International'],
        spendingPower: 'luxury'
      }
    };

    return {
      rawData: lines,
      parsedCampaign: historicalCampaign,
      confidence: 0.85,
      needsReview: false
    };
  }

  // Extract campaign info from Orange CSV header
  private static extractOrangeCampaignInfo(lines: string[][]): {
    client: string;
    campaign: string;
    budget: number;
  } {
    let client = '';
    let campaign = '';
    let budget = 0;

    for (const line of lines) {
      if (line[0] === 'CLIENTE') client = line[1]?.replace(/"/g, '') || '';
      if (line[0] === 'CAMPAÑA') campaign = line[1]?.replace(/"/g, '') || '';
      if (line[0] === 'PRESUPUESTO') {
        const budgetStr = line[1]?.replace(/"/g, '').replace(/[^\d]/g, '') || '0';
        budget = parseInt(budgetStr);
      }
    }

    return { client, campaign, budget };
  }

  // Extract talents from Orange CSV
  private static extractOrangeTalents(lines: string[][]): HistoricalTalent[] {
    const talents: HistoricalTalent[] = [];
    let inTalentSection = false;
    let isConfirmedSection = false;

    for (const line of lines) {
      if (line[0] === 'PERFILES CONFIRMADOS') {
        inTalentSection = true;
        isConfirmedSection = true;
        continue;
      }
      if (line[0] === 'PERFILES SIN CONTRASTAR') {
        inTalentSection = true;
        isConfirmedSection = false;
        continue;
      }

      if (inTalentSection && line[0] && line[0] !== '' && !line[0].includes('PERFILES')) {
        const talent = this.parseOrangeTalentRow(line, isConfirmedSection);
        if (talent) talents.push(talent);
      }
    }

    return talents;
  }

  // Extract talents from Hibiki CSV
  private static extractHibikiTalents(lines: string[][]): HistoricalTalent[] {
    const talents: HistoricalTalent[] = [];
    let inTalentSection = false;

    for (const line of lines) {
      if (line[1] === 'Talento' && line[2] === 'Territorio') {
        inTalentSection = true;
        continue;
      }

      if (inTalentSection && line[1] && line[1] !== '' && line[1] !== 'Talento') {
        const talent = this.parseHibikiTalentRow(line);
        if (talent) talents.push(talent);
      }
    }

    return talents;
  }

  // Parse individual talent row from Orange CSV
  private static parseOrangeTalentRow(line: string[], isConfirmed: boolean): HistoricalTalent | null {
    try {
      const cleanValue = (value: string) => value?.replace(/"/g, '').trim() || '';
      
      const name = cleanValue(line[1]);
      if (!name) return null;

      const followersStr = cleanValue(line[6]).replace(/[^\d]/g, '');
      const feeStr = cleanValue(line[4]).replace(/[^\d]/g, '');
      const erStr = cleanValue(line[10]).replace(/[^\d.]/g, '');

      return {
        name,
        handle: name.toLowerCase().replace(/\s+/g, ''),
        category: cleanValue(line[2]) || 'Lifestyle',
        platform: 'instagram',
        
        followerCount: parseInt(followersStr) || 0,
        engagementRate: parseFloat(erStr) / 100 || 0.02,
        credibilityScore: 85,
        audienceQuality: 80,
        
        fee: parseInt(feeStr) || 0,
        commitment: cleanValue(line[3]),
        wasConfirmed: isConfirmed,
        performanceRating: isConfirmed ? 8 : 7,
        
        audienceDemographics: {
          gender: this.parseGender(cleanValue(line[13])),
          ageGroups: this.parseAgeGroups(cleanValue(line[14])),
          geography: { 'ES': 80, 'Other': 20 }
        },
        
        previousBrands: [],
        contentStyle: [cleanValue(line[2])],
        niche: [cleanValue(line[2])]
      };
    } catch (error) {
      console.error('Error parsing Orange talent row:', error);
      return null;
    }
  }

  // Parse individual talent row from Hibiki CSV
  private static parseHibikiTalentRow(line: string[]): HistoricalTalent | null {
    try {
      const cleanValue = (value: string) => value?.replace(/"/g, '').trim() || '';
      
      const name = cleanValue(line[1]);
      if (!name) return null;

      const followersStr = cleanValue(line[5]).replace(/[^\d]/g, '');
      const feeStr = cleanValue(line[17]).replace(/[^\d]/g, '');
      const erStr = cleanValue(line[11]).replace(/[^\d.]/g, '');

      return {
        name,
        handle: name.toLowerCase().replace(/\s+/g, ''),
        category: cleanValue(line[2]) || 'Arte',
        platform: 'instagram',
        
        followerCount: parseInt(followersStr) || 0,
        engagementRate: parseFloat(erStr) / 100 || 0.02,
        credibilityScore: parseInt(cleanValue(line[12])) || 85,
        audienceQuality: 90, // Hibiki typically uses high-quality influencers
        
        fee: parseInt(feeStr) || 0,
        commitment: cleanValue(line[8]),
        wasConfirmed: true, // Assume Hibiki talents are confirmed
        performanceRating: 9, // High-end campaigns typically perform well
        
        audienceDemographics: {
          gender: this.parseGender(cleanValue(line[14])),
          ageGroups: this.parseAgeGroups(cleanValue(line[15])),
          geography: { 'ES': parseInt(cleanValue(line[13])) || 60, 'Other': 40 }
        },
        
        previousBrands: [],
        contentStyle: ['luxury', 'cultural'],
        niche: [cleanValue(line[2])]
      };
    } catch (error) {
      console.error('Error parsing Hibiki talent row:', error);
      return null;
    }
  }

  // Helper methods
  private static parseGender(genderStr: string): { male: number; female: number } {
    const male = parseInt(genderStr.match(/Hombres?\s*(\d+)%/i)?.[1] || '50');
    const female = parseInt(genderStr.match(/Mujeres?\s*(\d+)%/i)?.[1] || '50');
    return { male, female };
  }

  private static parseAgeGroups(ageStr: string): { [key: string]: number } {
    const groups: { [key: string]: number } = {};
    const matches = ageStr.match(/(\d+)\s*a\s*(\d+):\s*(\d+)%/g) || [];
    
    matches.forEach(match => {
      const parts = match.match(/(\d+)\s*a\s*(\d+):\s*(\d+)%/);
      if (parts) {
        const key = `${parts[1]}-${parts[2]}`;
        groups[key] = parseInt(parts[3]);
      }
    });

    return groups;
  }

  private static inferIndustry(client: string): string {
    const industryMap: { [key: string]: string } = {
      'Orange': 'telecommunications',
      'IKEA': 'home_goods',
      'Hibiki': 'luxury_spirits',
      'Samsung': 'technology',
      'Dior': 'luxury_fashion',
      'Nike': 'sports_fashion'
    };

    return industryMap[client] || 'general';
  }

  private static inferSuccessFactors(campaignInfo: any, talents: HistoricalTalent[]): string[] {
    const factors = ['strategic_talent_selection'];
    
    if (talents.some(t => t.followerCount > 1000000)) {
      factors.push('macro_influencer_reach');
    }
    
    if (talents.every(t => t.engagementRate > 0.03)) {
      factors.push('high_engagement_talent');
    }
    
    if (campaignInfo.budget > 50000) {
      factors.push('adequate_budget_allocation');
    }

    return factors;
  }

  private static inferTargetAudience(talents: HistoricalTalent[]): any {
    // Aggregate audience data from talents
    const avgGender = talents.reduce((acc, t) => ({
      male: acc.male + t.audienceDemographics.gender.male,
      female: acc.female + t.audienceDemographics.gender.female
    }), { male: 0, female: 0 });

    return {
      primaryAge: '25-34',
      secondaryAge: '35-44',
      genderSplit: {
        male: avgGender.male / talents.length,
        female: avgGender.female / talents.length
      },
      interests: talents.flatMap(t => t.niche),
      behaviors: ['social_media_active'],
      geography: ['Spain'],
      spendingPower: 'medium'
    };
  }

  // Main import function
  static async importCampaignCSV(csvContent: string, format: 'orange' | 'hibiki'): Promise<CSVImportResult> {
    try {
      const importedData = format === 'orange' 
        ? this.parseOrangeCSV(csvContent)
        : this.parseHibikiCSV(csvContent);

      // Here you would save to your Firebase database
      // await saveCampaignToDatabase(importedData.parsedCampaign);

      return {
        campaignsImported: 1,
        talentsImported: importedData.parsedCampaign.talents.length,
        errors: [],
        warnings: importedData.needsReview ? ['Campaign needs manual review'] : [],
        patternsGenerated: 0 // Will be generated later by ML algorithm
      };
    } catch (error) {
      return {
        campaignsImported: 0,
        talentsImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        patternsGenerated: 0
      };
    }
  }
} 