import axios from 'axios';
import * as cheerio from 'cheerio';

interface StarngageInfluencer {
  name: string;
  username: string;
  followers: number;
  engagementRate: number;
  country: string;
  topics: string[];
  profileUrl: string;
}

interface StarngageInfluencerDetails {
  username: string;
  name: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  demographics: {
    gender: {
      female: number;
      male: number;
    };
    ageGroups: {
      '13-17': number;
      '18-24': number;
      '25-34': number;
      '35-44': number;
      '45-54': number;
      '55+': number;
    };
    topLocations: string[];
    interests: string[];
  };
  topics: string[];
  recentPosts: any[];
}

class StarngageService {
  private baseUrl = 'https://starngage.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };

  /**
   * Scrape influencer list from StarNgage country/category pages
   */
  async scrapeInfluencerList(
    country: string = 'spain',
    category: string = 'celebrities',
    platform: string = 'instagram',
    limit: number = 50
  ): Promise<StarngageInfluencer[]> {
    try {
      const url = `${this.baseUrl}/plus/en-us/influencer/ranking/${platform}/${country}/${category}`;
      console.log(`🔍 Scraping StarNgage influencer list: ${url}`);

      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
        validateStatus: (status) => status < 500 // Accept 4xx errors to debug
      });

      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response headers:`, response.headers);

      if (response.status === 404) {
        console.log('❌ Page not found, trying alternative URL structure...');
        
        // Try alternative URL structures
        const altUrls = [
          `${this.baseUrl}/plus/en-us/influencer/ranking/${platform}/${country}`,
          `${this.baseUrl}/plus/en-us/influencer/${platform}/${country}/${category}`,
          `${this.baseUrl}/app/influencer/ranking/${platform}/${country}/${category}`,
          `${this.baseUrl}/ranking/${platform}/${country}/${category}`,
        ];

        for (const altUrl of altUrls) {
          try {
            console.log(`🔄 Trying alternative URL: ${altUrl}`);
            const altResponse = await axios.get(altUrl, {
              headers: this.headers,
              timeout: 15000,
              validateStatus: (status) => status < 500
            });
            
            if (altResponse.status === 200) {
              console.log(`✅ Alternative URL worked: ${altUrl}`);
              return this.parseInfluencerList(altResponse.data, limit);
            }
          } catch (altError) {
            console.log(`❌ Alternative URL failed: ${altUrl}`);
            continue;
          }
        }
      }

      if (response.status !== 200) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      return this.parseInfluencerList(response.data, limit);

    } catch (error) {
      console.error('❌ Error scraping StarNgage influencer list:', error);
      if (axios.isAxiosError(error)) {
        console.error('   Status:', error.response?.status);
        console.error('   Status Text:', error.response?.statusText);
        console.error('   Data:', error.response?.data);
      }
      return [];
    }
  }

  /**
   * Parse influencer list from HTML content
   */
  private parseInfluencerList(html: string, limit: number): StarngageInfluencer[] {
    const $ = cheerio.load(html);
    const influencers: StarngageInfluencer[] = [];

    console.log(`📄 HTML content length: ${html.length} characters`);
    console.log(`📄 Page title: ${$('title').text()}`);

    // Try multiple selector patterns to find influencer cards
    const selectorPatterns = [
      '.influencer-card',
      '.influencer-row',
      '.ranking-item',
      '.user-card',
      '.profile-card',
      '.creator-card',
      '[data-testid*="influencer"]',
      '[class*="influencer"]',
      '[class*="ranking"]',
      '[class*="profile"]',
      '.table-row',
      'tr',
      '.list-item',
      '.grid-item'
    ];

    let foundElements = 0;
    for (const selector of selectorPatterns) {
      const elements = $(selector);
      console.log(`🔍 Selector "${selector}" found ${elements.length} elements`);
      
      if (elements.length > 0) {
        foundElements = elements.length;
        
        elements.each((index, element) => {
          if (index >= limit) return false;

          const $el = $(element);
          
          // Try multiple patterns to extract information
          const nameSelectors = ['.name', '.influencer-name', 'h3', '.title', '.username', '.handle', '.profile-name'];
          const usernameSelectors = ['.username', '.handle', '.instagram-handle', '.profile-handle', '@', '.at'];
          const followerSelectors = ['.followers', '.follower-count', '.followers-count', '.subscriber-count'];
          const engagementSelectors = ['.engagement', '.engagement-rate', '.avg-engagement', '.er'];

          let name = '';
          let username = '';
          let followersText = '';
          let engagementText = '';

          // Extract name
          for (const sel of nameSelectors) {
            const text = $el.find(sel).first().text().trim();
            if (text && text.length > 0) {
              name = text;
              break;
            }
          }

          // Extract username
          for (const sel of usernameSelectors) {
            const text = $el.find(sel).first().text().trim();
            if (text && text.length > 0) {
              username = this.extractUsername(text);
              break;
            }
          }

          // If no username found, try extracting from name or any text
          if (!username && name) {
            const usernameMatch = name.match(/@([a-zA-Z0-9_.]+)/);
            if (usernameMatch) {
              username = usernameMatch[1];
            }
          }

          // Extract followers
          for (const sel of followerSelectors) {
            const text = $el.find(sel).first().text().trim();
            if (text && text.length > 0) {
              followersText = text;
              break;
            }
          }

          // Extract engagement
          for (const sel of engagementSelectors) {
            const text = $el.find(sel).first().text().trim();
            if (text && text.length > 0) {
              engagementText = text;
              break;
            }
          }

          // Get profile link
          const profileLink = $el.find('a').first().attr('href');

          // Debug logging
          console.log(`🔍 Element ${index + 1}:`, {
            name,
            username,
            followersText,
            engagementText,
            profileLink: profileLink ? `${this.baseUrl}${profileLink}` : 'none'
          });

          if (name || username) {
            influencers.push({
              name: name || username,
              username: username || this.extractUsername(name),
              followers: this.parseFollowerCount(followersText),
              engagementRate: this.parseEngagementRate(engagementText),
              country: 'spain',
              topics: this.extractTopics($el),
              profileUrl: profileLink ? `${this.baseUrl}${profileLink}` : ''
            });
          }
        });
        
        break; // Stop after finding elements with the first successful selector
      }
    }

    if (foundElements === 0) {
      console.log('❌ No influencer elements found with any selector pattern');
      console.log('📄 Available classes in page:', this.extractAvailableClasses($));
      console.log('📄 Sample HTML structure:', html.substring(0, 1000));
    }

    console.log(`✅ Parsed ${influencers.length} influencers from StarNgage`);
    return influencers;
  }

  /**
   * Extract available CSS classes from page for debugging
   */
  private extractAvailableClasses($: cheerio.Root): string[] {
    const classes = new Set<string>();
    
    $('*').each((_, element) => {
      const className = $(element).attr('class');
      if (className) {
        className.split(' ').forEach(cls => {
          if (cls.trim()) classes.add(cls.trim());
        });
      }
    });

    return Array.from(classes).slice(0, 50); // Return first 50 classes
  }

  /**
   * Scrape detailed influencer profile with demographics
   */
  async scrapeInfluencerProfile(username: string): Promise<StarngageInfluencerDetails | null> {
    try {
      const urls = [
        `${this.baseUrl}/plus/en-us/influencers/instagram/${username}`,
        `${this.baseUrl}/plus/en-us/influencer/instagram/${username}`,
        `${this.baseUrl}/app/influencers/instagram/${username}`,
        `${this.baseUrl}/influencers/instagram/${username}`,
        `${this.baseUrl}/profile/instagram/${username}`,
      ];

      for (const url of urls) {
        try {
          console.log(`🔍 Trying profile URL: ${url}`);
          
          const response = await axios.get(url, {
            headers: this.headers,
            timeout: 30000,
            validateStatus: (status) => status < 500
          });

          console.log(`📊 Profile response status: ${response.status} for ${url}`);

          if (response.status === 200) {
            const profileDetails = this.parseProfileDetails(response.data, username);
            if (profileDetails) {
              console.log(`✅ Successfully scraped profile for @${username}`);
              return profileDetails;
            }
          }
        } catch (urlError) {
          console.log(`❌ URL failed: ${url}`);
          continue;
        }
      }

      console.log(`❌ All profile URLs failed for @${username}`);
      return null;

    } catch (error) {
      console.error(`❌ Error scraping StarNgage profile for @${username}:`, error);
      return null;
    }
  }

  /**
   * Parse profile details from HTML
   */
  private parseProfileDetails(html: string, username: string): StarngageInfluencerDetails | null {
    const $ = cheerio.load(html);
    
    console.log(`📄 Profile HTML length: ${html.length} characters`);
    console.log(`📄 Profile page title: ${$('title').text()}`);

    // Try to extract basic profile information with multiple selectors
    const nameSelectors = ['.profile-name', '.influencer-name', 'h1', '.name', '.title'];
    const followerSelectors = ['.followers-count', '.follower-number', '.followers', '.subscriber-count'];
    const followingSelectors = ['.following-count', '.following-number', '.following'];
    const postSelectors = ['.posts-count', '.post-number', '.posts', '.media-count'];
    const engagementSelectors = ['.engagement-rate', '.avg-engagement', '.er-rate'];

    let name = '';
    let followers = 0;
    let following = 0;
    let posts = 0;
    let engagementRate = 0;

    // Extract name
    for (const sel of nameSelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length > 0) {
        name = text;
        break;
      }
    }

    // Extract metrics
    followers = this.parseFollowerCount(this.findTextBySelectors($, followerSelectors));
    following = this.parseFollowerCount(this.findTextBySelectors($, followingSelectors));
    posts = this.parseFollowerCount(this.findTextBySelectors($, postSelectors));
    engagementRate = this.parseEngagementRate(this.findTextBySelectors($, engagementSelectors));

    // Extract demographics
    const demographics = this.extractDemographics($);

    // Extract topics
    const topics = this.extractProfileTopics($);

    // If we couldn't extract basic info, return null
    if (!name && followers === 0) {
      console.log('❌ Could not extract basic profile information');
      return null;
    }

    return {
      username: username,
      name: name || username,
      followers: followers,
      following: following,
      posts: posts,
      engagementRate: engagementRate,
      averageLikes: 0, // Will be extracted if available
      averageComments: 0, // Will be extracted if available
      demographics: demographics,
      topics: topics,
      recentPosts: []
    };
  }

  /**
   * Helper to find text by trying multiple selectors
   */
  private findTextBySelectors($: cheerio.Root, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0) {
        return text;
      }
    }
    return '';
  }

  /**
   * Extract demographic information from profile page
   */
  private extractDemographics($: cheerio.Root): StarngageInfluencerDetails['demographics'] {
    const demographics: StarngageInfluencerDetails['demographics'] = {
      gender: { female: 0, male: 0 },
      ageGroups: {
        '13-17': 0,
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0,
        '55+': 0
      },
      topLocations: [],
      interests: []
    };

    // Look for demographic text patterns in the entire page
    const pageText = $('body').text();
    
    // Extract gender demographics
    const femaleMatch = pageText.match(/(\d+\.?\d*)\s*%.*?female/i);
    const maleMatch = pageText.match(/(\d+\.?\d*)\s*%.*?male/i);
    
    if (femaleMatch) demographics.gender.female = parseFloat(femaleMatch[1]);
    if (maleMatch) demographics.gender.male = parseFloat(maleMatch[1]);

    // Extract engagement rate and average metrics from text
    const engagementMatch = pageText.match(/engagement\s+rate.*?(\d+\.?\d*)\s*%/i);
    const likesMatch = pageText.match(/average.*?likes.*?(\d+[,\d]*)/i);
    const commentsMatch = pageText.match(/average.*?comments.*?(\d+[,\d]*)/i);

    console.log('📊 Extracted demographics:', {
      gender: demographics.gender,
      engagementMatch: engagementMatch?.[1],
      likesMatch: likesMatch?.[1],
      commentsMatch: commentsMatch?.[1]
    });

    return demographics;
  }

  /**
   * Extract topics from profile page
   */
  private extractProfileTopics($: cheerio.Root): string[] {
    const topics: string[] = [];
    const pageText = $('body').text();

    // Look for topic patterns in text
    const topicPatterns = [
      /loves posting about\s+([^.]+)/i,
      /posts about\s+([^.]+)/i,
      /content about\s+([^.]+)/i,
      /focuses on\s+([^.]+)/i,
    ];

    for (const pattern of topicPatterns) {
      const match = pageText.match(pattern);
      if (match && match[1]) {
        const extractedTopics = match[1].split(/[,&]/).map(t => t.trim());
        topics.push(...extractedTopics);
        break;
      }
    }

    return Array.from(new Set(topics)); // Remove duplicates
  }

  /**
   * Extract topics from influencer list elements
   */
  private extractTopics($el: any): string[] {
    const topics: string[] = [];
    
    // Try to find topic elements
    const topicSelectors = ['.topics', '.hashtags', '.categories', '.tags', '.interests'];
    
    for (const selector of topicSelectors) {
      $el.find(selector).each((_: number, element: any) => {
        const text = $el(element).text().trim();
        if (text) {
          topics.push(text.replace('#', ''));
        }
      });
    }

    return topics;
  }

  /**
   * Clean and extract username from text
   */
  private extractUsername(text: string): string {
    return text.replace('@', '').replace(/[^\w._]/g, '').toLowerCase();
  }

  /**
   * Parse follower count from text (e.g., "1.2M" -> 1200000)
   */
  private parseFollowerCount(text: string): number {
    if (!text) return 0;
    
    const cleanText = text.replace(/[,\s]/g, '').toLowerCase();
    const number = parseFloat(cleanText);
    
    if (cleanText.includes('m')) return Math.floor(number * 1000000);
    if (cleanText.includes('k')) return Math.floor(number * 1000);
    
    return Math.floor(number) || 0;
  }

  /**
   * Parse engagement rate from text (e.g., "3.25%" -> 3.25)
   */
  private parseEngagementRate(text: string): number {
    if (!text) return 0;
    
    const match = text.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Search for influencers by keyword
   */
  async searchInfluencers(
    keyword: string,
    platform: string = 'instagram',
    limit: number = 20
  ): Promise<StarngageInfluencer[]> {
    try {
      const searchUrls = [
        `${this.baseUrl}/plus/en-us/search?q=${encodeURIComponent(keyword)}&platform=${platform}`,
        `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}&platform=${platform}`,
        `${this.baseUrl}/app/search?q=${encodeURIComponent(keyword)}`,
      ];

      for (const url of searchUrls) {
        try {
          console.log(`🔍 Trying search URL: ${url}`);
          
          const response = await axios.get(url, {
            headers: this.headers,
            timeout: 30000,
            validateStatus: (status) => status < 500
          });

          if (response.status === 200) {
            const results = this.parseInfluencerList(response.data, limit);
            if (results.length > 0) {
              console.log(`✅ Search successful with ${results.length} results`);
              return results;
            }
          }
        } catch (urlError) {
          console.log(`❌ Search URL failed: ${url}`);
          continue;
        }
      }

      console.log(`❌ All search URLs failed for keyword: ${keyword}`);
      return [];

    } catch (error) {
      console.error(`❌ Error searching StarNgage for ${keyword}:`, error);
      return [];
    }
  }

  /**
   * Enhance existing influencer data with StarNgage demographics
   */
  async enhanceInfluencerWithDemographics(username: string): Promise<Partial<StarngageInfluencerDetails> | null> {
    try {
      const profileDetails = await this.scrapeInfluencerProfile(username);
      if (!profileDetails) return null;

      return {
        demographics: profileDetails.demographics,
        engagementRate: profileDetails.engagementRate,
        averageLikes: profileDetails.averageLikes,
        averageComments: profileDetails.averageComments,
        topics: profileDetails.topics
      };

    } catch (error) {
      console.error(`❌ Error enhancing influencer @${username} with StarNgage data:`, error);
      return null;
    }
  }

  /**
   * Create mock data for testing when real scraping fails
   */
  createMockData(username: string): StarngageInfluencerDetails {
    return {
      username: username,
      name: `Mock ${username}`,
      followers: 150000,
      following: 1200,
      posts: 450,
      engagementRate: 3.25,
      averageLikes: 72452,
      averageComments: 119,
      demographics: {
        gender: { female: 57.5, male: 42.5 },
        ageGroups: {
          '13-17': 5,
          '18-24': 35,
          '25-34': 40,
          '35-44': 15,
          '45-54': 4,
          '55+': 1
        },
        topLocations: ['Spain', 'Mexico', 'Colombia'],
        interests: ['Fashion', 'Lifestyle', 'Beauty', 'Travel']
      },
      topics: ['Fashion and Accessories', 'Entertainment and Music', 'Hair & Beauty', 'Modeling'],
      recentPosts: []
    };
  }
}

export const starngageService = new StarngageService();
export type { StarngageInfluencer, StarngageInfluencerDetails }; 