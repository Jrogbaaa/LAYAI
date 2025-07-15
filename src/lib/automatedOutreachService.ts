import { MatchResult } from '@/types/influencer';

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'initial_contact' | 'follow_up' | 'collaboration_proposal' | 'content_guidelines' | 'payment_confirmation';
  variables: string[]; // Available variables like {influencerName}, {brandName}, {campaignDetails}
}

export interface OutreachCampaign {
  id: string;
  name: string;
  brandName: string;
  influencers: MatchResult[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  templates: {
    initial: OutreachTemplate;
    followUp: OutreachTemplate;
    proposal: OutreachTemplate;
    guidelines: OutreachTemplate;
  };
  schedule: {
    initialDelay: number; // hours
    followUpDelay: number; // days
    maxFollowUps: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OutreachMessage {
  id: string;
  campaignId: string;
  influencerId: string;
  influencerEmail: string;
  influencerHandle: string;
  templateType: OutreachTemplate['type'];
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  scheduledAt: Date;
  sentAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  response?: string;
  trackingId: string;
  metadata: {
    campaignName: string;
    brandName: string;
    estimatedCost: number;
    followUpNumber?: number;
  };
}

export class AutomatedOutreachService {
  private static instance: AutomatedOutreachService;
  private outreachCampaigns: OutreachCampaign[] = [];
  private outreachMessages: OutreachMessage[] = [];

  static getInstance(): AutomatedOutreachService {
    if (!AutomatedOutreachService.instance) {
      AutomatedOutreachService.instance = new AutomatedOutreachService();
    }
    return AutomatedOutreachService.instance;
  }

  /**
   * Create a new outreach campaign for selected influencers
   */
  async createOutreachCampaign(
    campaignName: string,
    brandName: string,
    influencers: MatchResult[],
    customTemplates?: Partial<OutreachCampaign['templates']>
  ): Promise<OutreachCampaign> {
    const campaignId = `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultTemplates = this.getDefaultTemplates(brandName);
    const templates = {
      initial: customTemplates?.initial || defaultTemplates.initial,
      followUp: customTemplates?.followUp || defaultTemplates.followUp,
      proposal: customTemplates?.proposal || defaultTemplates.proposal,
      guidelines: customTemplates?.guidelines || defaultTemplates.guidelines,
    };

    const outreachCampaign: OutreachCampaign = {
      id: campaignId,
      name: campaignName,
      brandName,
      influencers,
      status: 'draft',
      templates,
      schedule: {
        initialDelay: 1, // 1 hour delay for initial contact
        followUpDelay: 3, // 3 days for follow-up
        maxFollowUps: 2
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.outreachCampaigns.push(outreachCampaign);
    console.log(`📧 Created outreach campaign: ${campaignName} with ${influencers.length} influencers`);
    
    return outreachCampaign;
  }

  /**
   * Generate personalized messages for all influencers in a campaign
   */
  async generateCampaignMessages(
    campaignId: string,
    templateType: OutreachTemplate['type'] = 'initial_contact'
  ): Promise<OutreachMessage[]> {
    const campaign = this.outreachCampaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const template = this.getTemplateByType(campaign, templateType);
    const messages: OutreachMessage[] = [];

    for (const influencer of campaign.influencers) {
      const message = await this.generatePersonalizedMessage(
        campaign,
        influencer,
        template,
        templateType
      );
      messages.push(message);
    }

    this.outreachMessages.push(...messages);
    console.log(`📝 Generated ${messages.length} personalized ${templateType} messages`);
    
    return messages;
  }

  /**
   * Generate a single personalized message for an influencer
   */
  private async generatePersonalizedMessage(
    campaign: OutreachCampaign,
    influencer: MatchResult,
    template: OutreachTemplate,
    templateType: OutreachTemplate['type']
  ): Promise<OutreachMessage> {
    const variables = {
      influencerName: influencer.influencer.name || influencer.influencer.handle,
      influencerHandle: influencer.influencer.handle,
      brandName: campaign.brandName,
      campaignName: campaign.name,
      followerCount: influencer.influencer.followerCount.toLocaleString(),
      estimatedCost: influencer.estimatedCost.toLocaleString(),
      platform: influencer.influencer.platform,
      niche: influencer.influencer.niche.join(', '),
      matchScore: (influencer.matchScore * 100).toFixed(0)
    };

    const personalizedSubject = this.replaceVariables(template.subject, variables);
    const personalizedContent = this.replaceVariables(template.content, variables);
    
    // Estimate email from handle if not available
    const estimatedEmail = influencer.influencer.contactInfo?.email || 
                          `${influencer.influencer.handle}@${influencer.influencer.platform.toLowerCase()}.com`;

    const message: OutreachMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId: campaign.id,
      influencerId: influencer.influencer.id,
      influencerEmail: estimatedEmail,
      influencerHandle: influencer.influencer.handle,
      templateType,
      subject: personalizedSubject,
      content: personalizedContent,
      status: 'draft',
      scheduledAt: new Date(Date.now() + campaign.schedule.initialDelay * 60 * 60 * 1000),
      trackingId: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        campaignName: campaign.name,
        brandName: campaign.brandName,
        estimatedCost: influencer.estimatedCost
      }
    };

    return message;
  }

  /**
   * Schedule automatic follow-ups for unresponded messages
   */
  async scheduleFollowUps(campaignId: string): Promise<OutreachMessage[]> {
    const campaign = this.outreachCampaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const initialMessages = this.outreachMessages.filter(
      m => m.campaignId === campaignId && m.templateType === 'initial_contact'
    );

    const followUpMessages: OutreachMessage[] = [];

    for (const initialMessage of initialMessages) {
      // Check if we should send follow-up (no reply within follow-up delay)
      const daysSinceSent = initialMessage.sentAt ? 
        (Date.now() - initialMessage.sentAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
      
      if (daysSinceSent >= campaign.schedule.followUpDelay && 
          !initialMessage.repliedAt && 
          initialMessage.status !== 'failed') {
        
        const followUpMessage = await this.generateFollowUpMessage(
          campaign,
          initialMessage,
          1
        );
        followUpMessages.push(followUpMessage);
      }
    }

    this.outreachMessages.push(...followUpMessages);
    console.log(`📅 Scheduled ${followUpMessages.length} follow-up messages`);
    
    return followUpMessages;
  }

  /**
   * Generate follow-up message based on initial message
   */
  private async generateFollowUpMessage(
    campaign: OutreachCampaign,
    originalMessage: OutreachMessage,
    followUpNumber: number
  ): Promise<OutreachMessage> {
    const followUpTemplate = campaign.templates.followUp;
    const influencer = campaign.influencers.find(
      inf => inf.influencer.id === originalMessage.influencerId
    );

    if (!influencer) {
      throw new Error(`Influencer ${originalMessage.influencerId} not found in campaign`);
    }

    const variables = {
      influencerName: influencer.influencer.name || influencer.influencer.handle,
      influencerHandle: influencer.influencer.handle,
      brandName: campaign.brandName,
      campaignName: campaign.name,
      followUpNumber: followUpNumber.toString(),
      originalSubject: originalMessage.subject
    };

    const followUpMessage: OutreachMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId: campaign.id,
      influencerId: originalMessage.influencerId,
      influencerEmail: originalMessage.influencerEmail,
      influencerHandle: originalMessage.influencerHandle,
      templateType: 'follow_up',
      subject: this.replaceVariables(followUpTemplate.subject, variables),
      content: this.replaceVariables(followUpTemplate.content, variables),
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      trackingId: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        ...originalMessage.metadata,
        followUpNumber
      }
    };

    return followUpMessage;
  }

  /**
   * Get campaign analytics and response rates
   */
  getCampaignAnalytics(campaignId: string): {
    totalMessages: number;
    sentMessages: number;
    openedMessages: number;
    repliedMessages: number;
    responseRate: number;
    openRate: number;
    averageResponseTime: number; // hours
  } {
    const messages = this.outreachMessages.filter(m => m.campaignId === campaignId);
    
    const sentMessages = messages.filter(m => m.status === 'sent' || m.status === 'delivered' || m.status === 'opened' || m.status === 'replied');
    const openedMessages = messages.filter(m => m.openedAt);
    const repliedMessages = messages.filter(m => m.repliedAt);

    const responseRate = sentMessages.length > 0 ? (repliedMessages.length / sentMessages.length) * 100 : 0;
    const openRate = sentMessages.length > 0 ? (openedMessages.length / sentMessages.length) * 100 : 0;

    // Calculate average response time
    const responseTimes = repliedMessages
      .filter(m => m.sentAt && m.repliedAt)
      .map(m => (m.repliedAt!.getTime() - m.sentAt!.getTime()) / (1000 * 60 * 60)); // hours
    
    const averageResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    return {
      totalMessages: messages.length,
      sentMessages: sentMessages.length,
      openedMessages: openedMessages.length,
      repliedMessages: repliedMessages.length,
      responseRate,
      openRate,
      averageResponseTime
    };
  }

  /**
   * Get default email templates
   */
  private getDefaultTemplates(brandName: string): OutreachCampaign['templates'] {
    return {
      initial: {
        id: 'initial_default',
        name: 'Initial Contact Template',
        subject: 'Partnership Opportunity with {brandName} 🤝',
        content: `Hi {influencerName}!

I hope this message finds you well! I came across your {platform} profile @{influencerHandle} and was impressed by your content in the {niche} space.

I'm reaching out on behalf of {brandName} because we believe you'd be a perfect fit for our upcoming campaign. Your engagement with your {followerCount} followers shows the authentic connection we're looking for.

Why we think you're a great match:
- Your content aligns perfectly with our brand values
- Your audience demographics match our target market
- Your engagement rate demonstrates genuine influence (Match Score: {matchScore}%)

We'd love to discuss a collaboration opportunity that could be mutually beneficial. The compensation for this partnership would be approximately ${'{estimatedCost}'}.

Would you be interested in learning more about this opportunity? I'd be happy to share more details about the campaign and answer any questions you might have.

Looking forward to hearing from you!

Best regards,
The {brandName} Team

P.S. Feel free to check out our brand at [website] to learn more about what we do.`,
        type: 'initial_contact',
        variables: ['influencerName', 'influencerHandle', 'brandName', 'platform', 'niche', 'followerCount', 'matchScore', 'estimatedCost']
      },
      followUp: {
        id: 'followup_default',
        name: 'Follow-Up Template',
        subject: 'Following up on {brandName} partnership opportunity',
        content: `Hi {influencerName},

I hope you're doing well! I wanted to follow up on my previous message about a potential collaboration with {brandName}.

I understand you probably receive many partnership requests, but I genuinely believe this opportunity could be a great fit for your content and audience.

Quick recap of what we're offering:
- Authentic partnership aligned with your content style
- Competitive compensation (${'{estimatedCost}'})
- Creative freedom within brand guidelines
- Potential for long-term collaboration

If you're interested or have any questions, I'd love to hop on a quick call or continue the conversation via email.

No worries if this isn't the right fit - I completely understand!

Best regards,
The {brandName} Team`,
        type: 'follow_up',
        variables: ['influencerName', 'brandName', 'estimatedCost']
      },
      proposal: {
        id: 'proposal_default',
        name: 'Collaboration Proposal Template',
        subject: 'Official Partnership Proposal - {brandName} x {influencerHandle}',
        content: `Hi {influencerName},

Thank you for your interest in partnering with {brandName}! I'm excited to share the official collaboration proposal with you.

Campaign Details:
- Campaign Name: {campaignName}
- Duration: 30 days
- Deliverables: 2 feed posts, 3 stories
- Compensation: ${'{estimatedCost}'}
- Creative Freedom: High (brand guidelines provided)

Next Steps:
1. Review the attached brand guidelines
2. Confirm your interest and availability
3. Sign the collaboration agreement
4. Receive brand kit and product samples
5. Create and publish content according to schedule

We'll provide:
- Detailed brand guidelines and messaging
- High-quality product samples
- Creative assets and templates
- Dedicated point of contact throughout the campaign
- Performance reporting and analytics

Are you ready to move forward with this exciting partnership?

Best regards,
The {brandName} Team`,
        type: 'collaboration_proposal',
        variables: ['influencerName', 'brandName', 'influencerHandle', 'campaignName', 'estimatedCost']
      },
      guidelines: {
        id: 'guidelines_default',
        name: 'Content Guidelines Template',
        subject: 'Content Guidelines for {brandName} Campaign - Let\'s Create Amazing Content! 🎨',
        content: `Hi {influencerName},

Welcome to the {brandName} family! We're thrilled to have you on board for the {campaignName} campaign.

Content Guidelines:

📝 Content Requirements:
- 2 feed posts showcasing product in your lifestyle
- 3 story posts with authentic usage
- Use hashtags: #BrandPartnership #{brandName}Partner
- Tag @{brandName} in all posts

🎨 Creative Direction:
- Keep your authentic voice and style
- Show genuine product usage in your daily routine
- Natural lighting and high-quality visuals preferred
- Include honest opinions and personal experiences

📅 Posting Schedule:
- First post: Within 1 week of receiving products
- Story content: Throughout the campaign period
- Second post: Week 3 of campaign

✅ Content Approval:
- Send drafts 24 hours before posting
- We'll provide feedback within 12 hours
- Minor edits may be requested for brand alignment

📊 Performance Tracking:
- We'll monitor engagement and reach
- Share performance insights with you
- Bonus opportunities for high-performing content

Questions? I'm here to help make this campaign a huge success!

Best regards,
The {brandName} Team`,
        type: 'content_guidelines',
        variables: ['influencerName', 'brandName', 'campaignName']
      }
    };
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Get template by type from campaign
   */
  private getTemplateByType(campaign: OutreachCampaign, type: OutreachTemplate['type']): OutreachTemplate {
    switch (type) {
      case 'initial_contact':
        return campaign.templates.initial;
      case 'follow_up':
        return campaign.templates.followUp;
      case 'collaboration_proposal':
        return campaign.templates.proposal;
      case 'content_guidelines':
        return campaign.templates.guidelines;
      default:
        return campaign.templates.initial;
    }
  }

  /**
   * Get all campaigns
   */
  getAllCampaigns(): OutreachCampaign[] {
    return this.outreachCampaigns;
  }

  /**
   * Get messages for a campaign
   */
  getCampaignMessages(campaignId: string): OutreachMessage[] {
    return this.outreachMessages.filter(m => m.campaignId === campaignId);
  }

  /**
   * Update message status (would be called by email tracking webhooks)
   */
  updateMessageStatus(messageId: string, status: OutreachMessage['status'], timestamp?: Date): void {
    const message = this.outreachMessages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      
      switch (status) {
        case 'sent':
          message.sentAt = timestamp || new Date();
          break;
        case 'opened':
          message.openedAt = timestamp || new Date();
          break;
        case 'replied':
          message.repliedAt = timestamp || new Date();
          break;
      }
      
      console.log(`📧 Message ${messageId} status updated to: ${status}`);
    }
  }
}

// Export singleton instance
export const automatedOutreachService = AutomatedOutreachService.getInstance(); 