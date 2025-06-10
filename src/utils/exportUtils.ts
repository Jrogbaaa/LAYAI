import { CampaignProposal, ProposalTalent } from '@/types/campaign';

export const exportProposalToCSV = (proposal: CampaignProposal): void => {
  // Header information
  const headerInfo = [
    [''],
    ['CLIENTE', proposal.client],
    ['CAMPAÑA', proposal.campaignName],
    ['PRESUPUESTO', `${proposal.budget.toLocaleString()} ${proposal.currency}`],
    ['TALENTOS*', proposal.talentRequirements],
    [''],
    [''],
    ['PROPUESTA PERFILES'],
    ['INSTAGRAM', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TIK TOK'],
    [
      'Talento', 'Territorio', 'Biografía', 'Compromisos', 'Fee', 'URL', 'Seguidores',
      'Impresiones Story', 'Impresiones Reels (promedio)', 'Interacciones (promedio)',
      '%ER', '%Credibilidad', 'IP España', 'Sexo', 'Edad', 'URL, colaboraciones pasadas:',
      'Seguidores', 'Media Impresiones', 'Media Interacciones', 'ER%', 'IP España', 'Sexo', 'Edad'
    ]
  ];

  // Confirmed talents section
  if (proposal.confirmedTalents.length > 0) {
    headerInfo.push(['PERFILES CONFIRMADOS']);
    proposal.confirmedTalents.forEach(talent => {
      headerInfo.push(formatTalentRow(talent, proposal.currency));
    });
  }

  // Unconfirmed talents section
  if (proposal.unconfirmedTalents.length > 0) {
    headerInfo.push(['PERFILES SIN CONTRASTAR']);
    proposal.unconfirmedTalents.forEach(talent => {
      headerInfo.push(formatTalentRow(talent, proposal.currency));
    });
  }

  // Convert to CSV
  const csvContent = headerInfo.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  // Download file
  downloadCSV(csvContent, `${proposal.client}_${proposal.campaignName}_proposal.csv`);
};

const formatTalentRow = (talent: ProposalTalent, currency: string): string[] => {
  const formatGender = (genderSplit: { male: number; female: number }) => {
    return `Mujeres ${genderSplit.female}%\nHombres ${genderSplit.male}%`;
  };

  const formatAge = (ageDistribution: any) => {
    return Object.entries(ageDistribution)
      .filter(([_, value]) => (value as number) > 0)
      .map(([range, value]) => `${range}: ${value}%`)
      .join('\n');
  };

  return [
    talent.name,
    talent.territory,
    talent.biography,
    talent.commitment,
    `${talent.fee.toLocaleString()} ${currency}`,
    talent.url,
    talent.instagramFollowers.toLocaleString(),
    talent.instagramStoryImpressions.toLocaleString(),
    talent.instagramReelImpressions.toLocaleString(),
    talent.instagramInteractions.toLocaleString(),
    `${talent.instagramER.toFixed(1)}%`,
    `${talent.instagramCredibility.toFixed(0)}%`,
    `${talent.instagramSpainIP.toFixed(0)}%`,
    formatGender(talent.instagramGenderSplit),
    formatAge(talent.instagramAgeDistribution),
    talent.pastCollaborations?.join(', ') || '',
    talent.tiktokFollowers?.toLocaleString() || '',
    talent.tiktokImpressions?.toLocaleString() || '',
    talent.tiktokInteractions?.toLocaleString() || '',
    talent.tiktokER ? `${talent.tiktokER.toFixed(1)}%` : '',
    talent.tiktokSpainIP ? `${talent.tiktokSpainIP.toFixed(0)}%` : '',
    talent.tiktokGenderSplit ? formatGender(talent.tiktokGenderSplit) : '',
    talent.tiktokAgeDistribution ? formatAge(talent.tiktokAgeDistribution) : ''
  ];
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
  const headerInfo = [
    [''],
    [''],
    [''],
    ['', 'TALENTOS HIBIKI'],
    ['', 'INSTAGRAM'],
    [
      '', 'Talento', 'Territorio', 'COMENTARIOS', 'URL', 'Seguidores', 'Biografía',
      'Reason Why', 'Commitment', 'Impresiones Estimadas Story', 'Impresiones Estimadas Reel',
      '% ER', '% Credibilidad', '% IP España', 'Sexo', '% Edad', 'Impresiones totales estimadas',
      'Fee (euros)', 'Fee sin paid media (euros)'
    ]
  ];

  // All talents in Hibiki format
  const allTalents = [...proposal.confirmedTalents, ...proposal.unconfirmedTalents];
  
  allTalents.forEach(talent => {
    const formatGenderHibiki = (genderSplit: { male: number; female: number }) => {
      return `M:${genderSplit.female}% H:${genderSplit.male}%`;
    };

    const formatAgeHibiki = (ageDistribution: any) => {
      return Object.entries(ageDistribution)
        .filter(([_, value]) => (value as number) > 0)
        .map(([range, value]) => `${range}: ${value}%`)
        .join('\n');
    };

    headerInfo.push([
      '',
      talent.name,
      talent.category,
      talent.comments || '',
      talent.url,
      talent.instagramFollowers.toLocaleString(),
      talent.biography,
      talent.reasonWhy,
      talent.commitment,
      talent.instagramStoryImpressions.toLocaleString(),
      talent.instagramReelImpressions.toLocaleString(),
      `${talent.instagramER.toFixed(2)}%`,
      `${talent.instagramCredibility}%`,
      `${talent.instagramSpainIP}%`,
      formatGenderHibiki(talent.instagramGenderSplit),
      formatAgeHibiki(talent.instagramAgeDistribution),
      talent.estimatedTotalImpressions.toLocaleString(),
      talent.fee.toLocaleString(),
      talent.feeWithoutPaidMedia?.toLocaleString() || talent.fee.toLocaleString()
    ]);
  });

  // Convert to CSV
  const csvContent = headerInfo.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  // Download file
  downloadCSV(csvContent, `${proposal.client}_${proposal.campaignName}_hibiki_style.csv`);
};

// Generate PDF export (basic implementation)
export const exportProposalToPDF = (proposal: CampaignProposal): void => {
  // For now, we'll create a formatted text version
  // In a real implementation, you'd use a library like jsPDF or puppeteer
  
  const pdfContent = `
CAMPAIGN PROPOSAL
=================

Client: ${proposal.client}
Campaign: ${proposal.campaignName}
Budget: ${proposal.budget.toLocaleString()} ${proposal.currency}
Created: ${proposal.createdAt.toLocaleDateString()}
Status: ${proposal.status}

CONFIRMED TALENTS (${proposal.confirmedTalents.length})
${proposal.confirmedTalents.map(talent => formatTalentForPDF(talent)).join('\n\n')}

UNCONFIRMED TALENTS (${proposal.unconfirmedTalents.length})
${proposal.unconfirmedTalents.map(talent => formatTalentForPDF(talent)).join('\n\n')}

SUMMARY
=======
Total Talents: ${proposal.confirmedTalents.length + proposal.unconfirmedTalents.length}
Total Investment: ${[...proposal.confirmedTalents, ...proposal.unconfirmedTalents].reduce((sum, talent) => sum + talent.fee, 0).toLocaleString()} ${proposal.currency}
Total Followers: ${[...proposal.confirmedTalents, ...proposal.unconfirmedTalents].reduce((sum, talent) => sum + talent.instagramFollowers, 0).toLocaleString()}
Total Estimated Impressions: ${[...proposal.confirmedTalents, ...proposal.unconfirmedTalents].reduce((sum, talent) => sum + talent.estimatedTotalImpressions, 0).toLocaleString()}
`;

  const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${proposal.client}_${proposal.campaignName}_proposal.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const formatTalentForPDF = (talent: ProposalTalent): string => {
  return `
${talent.name} (@${talent.url.split('/').pop()})
Category: ${talent.category}
Territory: ${talent.territory}
Fee: €${talent.fee.toLocaleString()}

Biography:
${talent.biography}

Why This Match:
${talent.reasonWhy}

Commitment:
${talent.commitment}

Instagram Metrics:
- Followers: ${talent.instagramFollowers.toLocaleString()}
- Engagement Rate: ${talent.instagramER.toFixed(1)}%
- Credibility: ${talent.instagramCredibility}%
- Spain IP: ${talent.instagramSpainIP}%
- Gender Split: ${talent.instagramGenderSplit.female}% Female, ${talent.instagramGenderSplit.male}% Male

Estimated Impressions:
- Stories: ${talent.instagramStoryImpressions.toLocaleString()}
- Reels: ${talent.instagramReelImpressions.toLocaleString()}
- Total: ${talent.estimatedTotalImpressions.toLocaleString()}

${talent.pastCollaborations?.length ? `Past Collaborations: ${talent.pastCollaborations.join(', ')}` : ''}
${talent.comments ? `Comments: ${talent.comments}` : ''}
`;
}; 