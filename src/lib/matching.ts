import { MatchCriteria, MatchResult } from '@/types/influencer';
import { InfluencerMatcher } from '@/utils/matchingAlgorithm';

export const findInfluencerMatches = async (criteria: MatchCriteria): Promise<MatchResult[]> => {
  try {
    // Note: Mock data has been removed. This function now relies on external data sources
    // like Apify or Firebase. If no external data is available, return empty results.
    
    // TODO: Implement integration with Firebase or other real data sources
    // For now, return empty array to force reliance on Apify service
    console.log('Local matching disabled - relying on external data sources (Apify)');
    
    return [];
  } catch (error) {
    console.error('Error finding matches:', error);
    throw error;
  }
}; 