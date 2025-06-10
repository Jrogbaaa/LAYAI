import { Influencer, MatchCriteria, MatchResult, BrandCollaboration } from '@/types/influencer';

export class InfluencerMatcher {
  private influencers: Influencer[];

  constructor(influencers: Influencer[]) {
    this.influencers = influencers;
  }

  /**
   * Main matching function that finds the best influencer matches
   */
  findMatches(criteria: MatchCriteria, limit: number = 10): MatchResult[] {
    const matches: MatchResult[] = [];

    for (const influencer of this.influencers) {
      if (!influencer.isActive) continue;

      const matchScore = this.calculateMatchScore(influencer, criteria);
      
      if (matchScore > 0.3) { // Minimum threshold for consideration
        const matchResult: MatchResult = {
          influencer,
          matchScore,
          matchReasons: this.generateMatchReasons(influencer, criteria),
          estimatedCost: this.estimateCost(influencer, criteria),
          similarPastCampaigns: this.findSimilarCampaigns(influencer, criteria),
          potentialReach: this.calculatePotentialReach(influencer),
          recommendations: this.generateRecommendations(influencer, criteria)
        };
        
        matches.push(matchResult);
      }
    }

    // Sort by match score (descending) and return top matches
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Calculate overall match score (0-1 scale)
   */
  private calculateMatchScore(influencer: Influencer, criteria: MatchCriteria): number {
    let score = 0;
    let totalWeight = 0;

    // Budget compatibility (25% weight)
    const budgetWeight = 25;
    if (criteria.budget) {
      const costRatio = criteria.budget.max / influencer.averageRate;
      let budgetScore = 0;
      
      if (costRatio >= 1) {
        budgetScore = 100; // Can afford
      } else if (costRatio >= 0.8) {
        budgetScore = 80; // Close to budget
      } else if (costRatio >= 0.6) {
        budgetScore = 60; // Slightly over budget
      } else {
        budgetScore = 20; // Significantly over budget
      }
      
      score += budgetScore * budgetWeight;
      totalWeight += budgetWeight;
    }

    // Niche alignment (20% weight)
    const nicheWeight = 20;
    if (criteria.niche && criteria.niche.length > 0) {
      const nicheMatches = influencer.niche.filter(influencerNiche =>
        criteria.niche.some(criteriaNiche =>
          influencerNiche.toLowerCase().includes(criteriaNiche.toLowerCase()) ||
          criteriaNiche.toLowerCase().includes(influencerNiche.toLowerCase())
        )
      );
      
      const nicheScore = nicheMatches.length > 0 ? (nicheMatches.length / criteria.niche.length) * 100 : 30;
      score += nicheScore * nicheWeight;
      totalWeight += nicheWeight;
    }

    // Platform match (15% weight)
    const platformWeight = 15;
    if (criteria.platform && criteria.platform.length > 0) {
      const platformMatch = criteria.platform.includes(influencer.platform);
      const platformScore = platformMatch ? 100 : 0;
      score += platformScore * platformWeight;
      totalWeight += platformWeight;
    }

    // Follower count compatibility (15% weight)
    const followerWeight = 15;
    if (criteria.followerRange) {
      let followerScore = 100;
      
      if (influencer.followerCount < criteria.followerRange.min) {
        followerScore = Math.max(0, 100 - ((criteria.followerRange.min - influencer.followerCount) / criteria.followerRange.min) * 100);
      }
      
      if (influencer.followerCount > criteria.followerRange.max) {
        followerScore = Math.min(followerScore, 100 - ((influencer.followerCount - criteria.followerRange.max) / criteria.followerRange.max) * 50);
      }
      
      score += followerScore * followerWeight;
      totalWeight += followerWeight;
    }

    // Demographics match (15% weight)
    const demographicsWeight = 15;
    let demographicsScore = 0;
    let demographicsFactors = 0;

    if (criteria.gender) {
      demographicsScore += influencer.gender.toLowerCase() === criteria.gender.toLowerCase() ? 100 : 30;
      demographicsFactors++;
    }

    if (criteria.ageRange) {
      const ageMatch = influencer.ageRange === criteria.ageRange;
      demographicsScore += ageMatch ? 100 : 50;
      demographicsFactors++;
    }

    if (demographicsFactors > 0) {
      score += (demographicsScore / demographicsFactors) * demographicsWeight;
      totalWeight += demographicsWeight;
    }

    // Engagement rate (10% weight)
    const engagementWeight = 10;
    let engagementScore = 0;
    
    if (influencer.engagementRate >= 4.0) {
      engagementScore = 100;
    } else if (influencer.engagementRate >= 3.0) {
      engagementScore = 80;
    } else if (influencer.engagementRate >= 2.0) {
      engagementScore = 60;
    } else {
      engagementScore = 40;
    }
    
      score += engagementScore * engagementWeight;
  totalWeight += engagementWeight;

  // Calculate final score as percentage
  return totalWeight > 0 ? Math.min(100, score / totalWeight) : 0;
  }

  private generateMatchReasons(influencer: Influencer, criteria: MatchCriteria): string[] {
    const reasons: string[] = [];

    // Budget fit
    if (influencer.averageRate <= criteria.budget.max) {
      reasons.push(`Within budget range ($${influencer.averageRate.toLocaleString()})`);
    }

    // Platform match
    if (criteria.platform.includes(influencer.platform)) {
      reasons.push(`Active on ${influencer.platform}`);
    }

    // Niche alignment
    const matchingNiches = influencer.niche.filter(niche => 
      criteria.niche.some(criterionNiche => 
        niche.toLowerCase().includes(criterionNiche.toLowerCase())
      )
    );
    if (matchingNiches.length > 0) {
      reasons.push(`Specializes in ${matchingNiches.join(', ')}`);
    }

    // Engagement rate
    if (influencer.engagementRate >= criteria.engagementRate.min) {
      reasons.push(`Strong engagement rate (${(influencer.engagementRate * 100).toFixed(1)}%)`);
    }

    // Past collaborations
    if (influencer.pastCollaborations.length > 0) {
      reasons.push(`Proven track record with ${influencer.pastCollaborations.length} brand partnerships`);
    }

    return reasons;
  }

  private estimateCost(influencer: Influencer, criteria: MatchCriteria): number {
    // Base cost is the influencer's average rate
    let cost = influencer.averageRate;

    // Adjust based on content requirements in criteria
    // This is a simplified estimation - in reality, you'd have more complex pricing logic
    return cost;
  }

  private findSimilarCampaigns(influencer: Influencer, criteria: MatchCriteria): BrandCollaboration[] {
    // Find past campaigns that are similar to current criteria
    return influencer.pastCollaborations.filter(campaign => {
      // Simple similarity check - in practice, you'd have more sophisticated matching
      return campaign.rating >= 4; // Only include successful campaigns
    }).slice(0, 3); // Return top 3 similar campaigns
  }

  private calculatePotentialReach(influencer: Influencer): number {
    // Estimate potential reach based on follower count and engagement rate
    return Math.floor(influencer.followerCount * influencer.engagementRate * 0.8);
  }

  private generateRecommendations(influencer: Influencer, criteria: MatchCriteria): string[] {
    const recommendations: string[] = [];

    // Content style recommendations
    if (influencer.contentStyle.length > 0) {
      recommendations.push(`Best content style: ${influencer.contentStyle.join(', ')}`);
    }

    // Timing recommendations
    if (influencer.recentPosts.length > 0) {
      const avgLikes = influencer.recentPosts.reduce((sum, post) => sum + post.likes, 0) / influencer.recentPosts.length;
      if (avgLikes > 1000) {
        recommendations.push('High-performing content creator with consistent engagement');
      }
    }

    // Collaboration recommendations
    if (influencer.pastCollaborations.length > 0) {
      const avgRating = influencer.pastCollaborations.reduce((sum, collab) => sum + collab.rating, 0) / influencer.pastCollaborations.length;
      if (avgRating >= 4) {
        recommendations.push('Highly rated by previous brand partners');
      }
    }

    return recommendations;
  }
}

// Utility functions for common search queries
export const searchInfluencers = {
  byBudget: (influencers: Influencer[], maxBudget: number) => {
    return influencers.filter(inf => inf.averageRate <= maxBudget);
  },

  byNiche: (influencers: Influencer[], niches: string[]) => {
    return influencers.filter(inf => 
      inf.niche.some(niche => 
        niches.some(searchNiche => 
          niche.toLowerCase().includes(searchNiche.toLowerCase())
        )
      )
    );
  },

  byPlatform: (influencers: Influencer[], platforms: string[]) => {
    return influencers.filter(inf => 
      platforms.includes(inf.platform) || 
      (inf.platform === 'Multi-Platform' && platforms.length > 1)
    );
  },

  byGender: (influencers: Influencer[], gender: string) => {
    return influencers.filter(inf => 
      inf.gender.toLowerCase() === gender.toLowerCase()
    );
  },

  byCostLevel: (influencers: Influencer[], costLevel: string) => {
    return influencers.filter(inf => 
      inf.costLevel.toLowerCase() === costLevel.toLowerCase()
    );
  }
}; 