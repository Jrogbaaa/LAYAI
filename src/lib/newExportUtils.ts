import { CampaignProposal, ProposalTalent } from '@/types/campaign';

export interface ExportOptions {
  format: 'hibiki' | 'orange';
  includeUnconfirmed: boolean;
  filename?: string;
}

// Simple CSV export for the new structure
export const exportHibikiStyleCSV = (proposal: CampaignProposal, options: ExportOptions = { format: 'hibiki', includeUnconfirmed: true }): void => {
  const csvContent = [
    // Header
    ['Talento', 'Plataforma', 'Handle', 'Seguidores', 'ER%', 'Fee (€)', 'Biografía', 'Por qué es perfecto', 'Compromiso'],
    
    // Data rows
    ...proposal.talents.map(talent => [
      talent.name,
      talent.platform,
      `@${talent.handle}`,
      talent.followers.toLocaleString(),
      `${(talent.engagementRate * 100).toFixed(2)}%`,
      talent.estimatedFee.toLocaleString(),
      talent.biography,
      talent.whyThisInfluencer,
      talent.commitment
    ])
  ];

  downloadCSV(csvContent, options.filename || `Propuesta_${proposal.brandName}_${proposal.campaignName}.csv`);
};

export const exportOrangeStyleCSV = (proposal: CampaignProposal, options: ExportOptions = { format: 'orange', includeUnconfirmed: true }): void => {
  const csvContent = [
    // Header with brand info
    ['CLIENTE', proposal.client],
    ['CAMPAÑA', proposal.campaignName],
    ['MARCA', proposal.brandName],
    ['PRESUPUESTO', `${proposal.totalBudget.toLocaleString()} ${proposal.currency}`],
    [''],
    ['Talento', 'Plataforma', 'Handle', 'Seguidores', 'ER%', 'Fee (€)', 'Biografía', 'Por qué es perfecto', 'Compromiso', 'Story Impressions', 'Reel Impressions', 'Credibilidad%', 'España IP%'],
    
    // Data rows
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

  downloadCSV(csvContent, options.filename || `Propuesta_${proposal.brandName}_${proposal.campaignName}_Orange.csv`);
};

// Excel export using SheetJS
export const exportToExcel = async (proposal: CampaignProposal, format: 'hibiki' | 'orange', options: ExportOptions): Promise<void> => {
  try {
    const XLSX = await import('xlsx');
    
    const data = format === 'hibiki' ? getHibikiData(proposal) : getOrangeData(proposal);
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Propuesta');
    
    const filename = options.filename || `Propuesta_${proposal.brandName}_${proposal.campaignName}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Fallback to CSV
    if (format === 'hibiki') {
      exportHibikiStyleCSV(proposal, options);
    } else {
      exportOrangeStyleCSV(proposal, options);
    }
  }
};

// Helper functions
const getHibikiData = (proposal: CampaignProposal): any[][] => {
  return [
    ['Talento', 'Plataforma', 'Handle', 'Seguidores', 'ER%', 'Fee (€)', 'Biografía', 'Por qué es perfecto', 'Compromiso'],
    ...proposal.talents.map(talent => [
      talent.name,
      talent.platform,
      `@${talent.handle}`,
      talent.followers,
      talent.engagementRate * 100,
      talent.estimatedFee,
      talent.biography,
      talent.whyThisInfluencer,
      talent.commitment
    ])
  ];
};

const getOrangeData = (proposal: CampaignProposal): any[][] => {
  return [
    ['CLIENTE', proposal.client],
    ['CAMPAÑA', proposal.campaignName],
    ['MARCA', proposal.brandName],
    ['PRESUPUESTO', proposal.totalBudget],
    [''],
    ['Talento', 'Plataforma', 'Handle', 'Seguidores', 'ER%', 'Fee (€)', 'Biografía', 'Por qué es perfecto', 'Compromiso', 'Story Impressions', 'Reel Impressions', 'Credibilidad%', 'España IP%'],
    ...proposal.talents.map(talent => [
      talent.name,
      talent.platform,
      `@${talent.handle}`,
      talent.followers,
      talent.engagementRate * 100,
      talent.estimatedFee,
      talent.biography,
      talent.whyThisInfluencer,
      talent.commitment,
      talent.metrics.storyImpressions,
      talent.metrics.reelImpressions,
      talent.metrics.credibilityScore,
      talent.metrics.spainImpressionsPercentage
    ])
  ];
};

const downloadCSV = (csvContent: any[][], filename: string): void => {
  const csvString = csvContent
    .map(row => 
      row.map(cell => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
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