import { CampaignProposal, ProposalTalent } from '@/types/campaign';

export const exportProposalToCSV = (proposal: CampaignProposal): void => {
  const csvContent = [
    ['CLIENTE', proposal.client],
    ['CAMPAÑA', proposal.campaignName],
    ['MARCA', proposal.brandName],
    ['PRESUPUESTO', `${proposal.totalBudget.toLocaleString()} ${proposal.currency}`],
    [''],
    ['Talento', 'Plataforma', 'Handle', 'Seguidores', 'ER%', 'Fee (€)', 'Biografía', 'Por qué es perfecto', 'Compromiso'],
    ...proposal.talents.map(talent => [
      talent.name,
      talent.platform,
      `@${talent.handle}`,
      talent.followers.toLocaleString(),
      `${(talent.engagementRate * 100).toFixed(1)}%`,
      `${talent.estimatedFee.toLocaleString()} ${proposal.currency}`,
      talent.biography,
      talent.whyThisInfluencer,
      talent.commitment
    ])
  ];

  const csvString = csvContent.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  downloadCSV(csvString, `${proposal.brandName}_${proposal.campaignName}_proposal.csv`);
};

export const exportProposalToPDF = (proposal: CampaignProposal): void => {
  const pdfContent = `
CAMPAIGN PROPOSAL
=================

Client: ${proposal.client}
Campaign: ${proposal.campaignName}
Brand: ${proposal.brandName}
Budget: ${proposal.totalBudget.toLocaleString()} ${proposal.currency}
Created: ${proposal.createdAt.toLocaleDateString()}

SELECTED TALENTS (${proposal.talents.length})
${proposal.talents.map(talent => formatTalentForPDF(talent)).join('\n\n')}

SUMMARY
=======
Total Talents: ${proposal.talents.length}
Total Investment: ${proposal.talents.reduce((sum, talent) => sum + talent.estimatedFee, 0).toLocaleString()} ${proposal.currency}
Total Followers: ${proposal.talents.reduce((sum, talent) => sum + talent.followers, 0).toLocaleString()}
`;

  const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${proposal.brandName}_${proposal.campaignName}_proposal.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const formatTalentForPDF = (talent: ProposalTalent): string => {
  return `
${talent.name} (@${talent.handle})
Platform: ${talent.platform}
Fee: €${talent.estimatedFee.toLocaleString()}

Biography:
${talent.biography}

Why This Match:
${talent.whyThisInfluencer}

Commitment:
${talent.commitment}

Metrics:
- Followers: ${talent.followers.toLocaleString()}
- Engagement Rate: ${(talent.engagementRate * 100).toFixed(1)}%
- Credibility: ${talent.metrics.credibilityScore}%
- Spain IP: ${talent.metrics.spainImpressionsPercentage}%

Estimated Impressions:
- Stories: ${talent.metrics.storyImpressions.toLocaleString()}
- Reels: ${talent.metrics.reelImpressions.toLocaleString()}
- Interactions: ${talent.metrics.interactions.toLocaleString()}

${talent.pastCollaborations?.length ? `Past Collaborations: ${talent.pastCollaborations.join(', ')}` : ''}
`;
};

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// For Hibiki-style export (more detailed luxury brand format)
export const exportHibikiStyleCSV = (proposal: CampaignProposal): void => {
  const csvContent = [
    ['TALENTOS HIBIKI'],
    ['CLIENTE', proposal.client],
    ['CAMPAÑA', proposal.campaignName],
    ['MARCA', proposal.brandName],
    [''],
    ['Talento', 'Plataforma', 'Handle', 'Seguidores', 'ER%', 'Fee (€)', 'Biografía', 'Por qué es perfecto', 'Compromiso', 'Story Impressions', 'Reel Impressions', 'Credibilidad%', 'España IP%'],
    ...proposal.talents.map(talent => [
      talent.name,
      talent.platform,
      `@${talent.handle}`,
      talent.followers.toLocaleString(),
      `${(talent.engagementRate * 100).toFixed(2)}%`,
      talent.estimatedFee.toLocaleString(),
      talent.biography,
      talent.whyThisInfluencer,
      talent.commitment,
      talent.metrics.storyImpressions.toLocaleString(),
      talent.metrics.reelImpressions.toLocaleString(),
      `${talent.metrics.credibilityScore}%`,
      `${talent.metrics.spainImpressionsPercentage}%`
    ])
  ];

  const csvString = csvContent.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  downloadCSV(csvString, `${proposal.brandName}_${proposal.campaignName}_hibiki_style.csv`);
}; 