import { CampaignProposal, ProposalTalent } from '@/types/campaign';

export interface ExportOptions {
  format: 'hibiki' | 'orange';
  includeUnconfirmed: boolean;
  filename?: string;
}

// CSV export function that matches the Hibiki/Roku template format
export const exportHibikiStyleCSV = (proposal: CampaignProposal, options: ExportOptions = { format: 'hibiki', includeUnconfirmed: true }): void => {
  const allTalents = options.includeUnconfirmed 
    ? [...proposal.confirmedTalents, ...proposal.unconfirmedTalents]
    : proposal.confirmedTalents;

  // Create CSV content following the Hibiki template structure
  const csvContent = [
    // Header rows (matching the exact format from CSV)
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'TALENTOS HIBIKI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'INSTAGRAM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'Talento', 'Territorio', 'COMENTARIOS', 'URL', 'Seguidores', 'Biografía', 'Reason Why', 'Commitment', 'Impresiones Estimadas Story', 'Impresiones Estimadas Reel', '% ER', '% Credibilidad', '% IP España', 'Sexo', '% Edad', 'Impresiones totales estimadas', 'Fee (euros)', 'Fee sin paid media (euros)'],
    
    // Add each talent as a row
    ...allTalents.map(talent => [
      '', '', // Empty columns to match template structure
      talent.name,
      talent.category,
      talent.comments || '',
      talent.url,
      formatNumberWithCommas(talent.instagramFollowers),
      talent.biography,
      talent.reasonWhy,
      talent.commitment,
      formatNumberWithCommas(talent.instagramStoryImpressions),
      formatNumberWithCommas(talent.instagramReelImpressions),
      `${talent.instagramER.toFixed(2)}%`,
      `${talent.instagramCredibility}%`,
      `${talent.instagramSpainIP}%`,
      formatGenderSplit(talent.instagramGenderSplit),
      formatAgeDistribution(talent.instagramAgeDistribution),
      formatNumberWithCommas(talent.estimatedTotalImpressions),
      formatNumberWithCommas(talent.fee),
      formatNumberWithCommas(talent.feeWithoutPaidMedia || talent.fee - 500)
    ])
  ];

  downloadCSV(csvContent, options.filename || `Propuesta_${proposal.client}_${proposal.campaignName}.csv`);
};

// CSV export function that matches the Orange template format (multi-platform)
export const exportOrangeStyleCSV = (proposal: CampaignProposal, options: ExportOptions = { format: 'orange', includeUnconfirmed: true }): void => {
  const confirmedTalents = proposal.confirmedTalents;
  const unconfirmedTalents = proposal.unconfirmedTalents;

  // Create CSV content following the Orange template structure
  const csvContent = [
    // Header rows
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'CLIENTE', proposal.client, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'CAMPAÑA', proposal.campaignName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'PRESUPUESTO', `${formatNumberWithCommas(proposal.budget)} €`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'TALENTOS*', proposal.talentRequirements || 'A escoger talentos', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['PROPUESTA PERFILES', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TIK TOK', '', '', '', '', '', '', ''],
    ['INSTAGRAM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Talento', '', 'Territorio', 'Biografía', 'Compromisos', 'Fee', 'URL', 'Seguidores', 'Impresiones Story', 'Impresiones Reels (promedio)', 'Interacciones (promedio)', '% ER', '% Credibilidad', 'IP España', 'Sexo', 'Edad', 'URL, colaboraciones pasadas:', 'Seguidores', 'Media Impresiones', 'Media Interacciones', 'ER%', 'IP España', 'Sexo', 'Edad'],
    
    // Confirmed talents section
    ['PERFILES CONFIRMADOS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ...confirmedTalents.map((talent, index) => [
      `#VALUE!`, // Placeholder for row numbers
      talent.name,
      talent.category.toUpperCase(),
      talent.biography,
      talent.commitment,
      `${formatNumberWithCommas(talent.fee)} €`,
      talent.url,
      formatNumberWithCommas(talent.instagramFollowers),
      formatNumberWithCommas(talent.instagramStoryImpressions),
      formatNumberWithCommas(talent.instagramReelImpressions),
      formatNumberWithCommas(talent.instagramInteractions),
      `${talent.instagramER.toFixed(1)}%`,
      `${talent.instagramCredibility}%`,
      `${talent.instagramSpainIP}%`,
      formatGenderSplit(talent.instagramGenderSplit),
      formatAgeDistribution(talent.instagramAgeDistribution),
      talent.pastCollaborations?.join(', ') || '',
      formatNumberWithCommas(talent.tiktokFollowers || 0),
      formatNumberWithCommas(talent.tiktokImpressions || 0),
      formatNumberWithCommas(talent.tiktokInteractions || 0),
      `${(talent.tiktokER || 0).toFixed(1)}%`,
      `${talent.tiktokSpainIP || 0}%`,
      formatGenderSplit(talent.tiktokGenderSplit || talent.instagramGenderSplit),
      formatAgeDistribution(talent.tiktokAgeDistribution || talent.instagramAgeDistribution)
    ]),

    // Unconfirmed talents section
    ...(options.includeUnconfirmed ? [
      ['PERFILES SIN CONTRASTAR', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ...unconfirmedTalents.map((talent, index) => [
        `#VALUE!`, // Placeholder for row numbers
        talent.name,
        talent.category.toUpperCase(),
        talent.biography,
        talent.commitment,
        `${formatNumberWithCommas(talent.fee)} €`,
        talent.url,
        formatNumberWithCommas(talent.instagramFollowers),
        formatNumberWithCommas(talent.instagramStoryImpressions),
        formatNumberWithCommas(talent.instagramReelImpressions),
        formatNumberWithCommas(talent.instagramInteractions),
        `${talent.instagramER.toFixed(1)}%`,
        `${talent.instagramCredibility}%`,
        `${talent.instagramSpainIP}%`,
        formatGenderSplit(talent.instagramGenderSplit),
        formatAgeDistribution(talent.instagramAgeDistribution),
        talent.pastCollaborations?.join(', ') || '',
        formatNumberWithCommas(talent.tiktokFollowers || 0),
        formatNumberWithCommas(talent.tiktokImpressions || 0),
        formatNumberWithCommas(talent.tiktokInteractions || 0),
        `${(talent.tiktokER || 0).toFixed(1)}%`,
        `${talent.tiktokSpainIP || 0}%`,
        formatGenderSplit(talent.tiktokGenderSplit || talent.instagramGenderSplit),
        formatAgeDistribution(talent.tiktokAgeDistribution || talent.instagramAgeDistribution)
      ])
    ] : [])
  ];

  downloadCSV(csvContent, options.filename || `Propuesta_${proposal.client}_${proposal.campaignName}_v2.csv`);
};

// Utility functions
const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString('es-ES');
};

const formatGenderSplit = (genderSplit: { male: number; female: number }): string => {
  return `Mujeres ${genderSplit.female}%\nHombres ${genderSplit.male}%`;
};

const formatAgeDistribution = (ageDistribution: any): string => {
  const ages = [
    `25 a 34: ${ageDistribution['25-34']}%`,
    `35 a 44: ${ageDistribution['35-44']}%`,
    `45 a 54: ${ageDistribution['45-54'] || ageDistribution['55+']}%`
  ];
  return ages.join('\n');
};

const downloadCSV = (csvContent: any[][], filename: string): void => {
  // Convert array to CSV string
  const csvString = csvContent
    .map(row => 
      row.map(cell => {
        // Handle cells that contain commas, quotes, or newlines
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');

  // Create blob and download
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

// Excel export using SheetJS (requires xlsx library)
export const exportToExcel = async (proposal: CampaignProposal, format: 'hibiki' | 'orange', options: ExportOptions): Promise<void> => {
  try {
    // Dynamically import xlsx to reduce bundle size
    const XLSX = await import('xlsx');
    
    let csvData: any[][];
    if (format === 'hibiki') {
      csvData = getHibikiData(proposal, options);
    } else {
      csvData = getOrangeData(proposal, options);
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(csvData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Propuesta');
    
    // Save file
    const filename = options.filename || `Propuesta_${proposal.client}_${proposal.campaignName}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Fallback to CSV if Excel export fails
    if (format === 'hibiki') {
      exportHibikiStyleCSV(proposal, options);
    } else {
      exportOrangeStyleCSV(proposal, options);
    }
  }
};

// Helper functions to get data arrays
const getHibikiData = (proposal: CampaignProposal, options: ExportOptions): any[][] => {
  const allTalents = options.includeUnconfirmed 
    ? [...proposal.confirmedTalents, ...proposal.unconfirmedTalents]
    : proposal.confirmedTalents;

  return [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'TALENTOS HIBIKI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'INSTAGRAM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'Talento', 'Territorio', 'COMENTARIOS', 'URL', 'Seguidores', 'Biografía', 'Reason Why', 'Commitment', 'Impresiones Estimadas Story', 'Impresiones Estimadas Reel', '% ER', '% Credibilidad', '% IP España', 'Sexo', '% Edad', 'Impresiones totales estimadas', 'Fee (euros)', 'Fee sin paid media (euros)'],
    
    ...allTalents.map(talent => [
      '', '',
      talent.name,
      talent.category,
      talent.comments || '',
      talent.url,
      talent.instagramFollowers,
      talent.biography,
      talent.reasonWhy,
      talent.commitment,
      talent.instagramStoryImpressions,
      talent.instagramReelImpressions,
      talent.instagramER / 100,
      talent.instagramCredibility / 100,
      talent.instagramSpainIP / 100,
      formatGenderSplit(talent.instagramGenderSplit),
      formatAgeDistribution(talent.instagramAgeDistribution),
      talent.estimatedTotalImpressions,
      talent.fee,
      talent.feeWithoutPaidMedia || talent.fee - 500
    ])
  ];
};

const getOrangeData = (proposal: CampaignProposal, options: ExportOptions): any[][] => {
  const confirmedTalents = proposal.confirmedTalents;
  const unconfirmedTalents = proposal.unconfirmedTalents;

  return [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'CLIENTE', proposal.client, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'CAMPAÑA', proposal.campaignName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'PRESUPUESTO', `${proposal.budget} €`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 'TALENTOS*', proposal.talentRequirements || 'A escoger talentos', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['PROPUESTA PERFILES', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TIK TOK', '', '', '', '', '', '', ''],
    ['INSTAGRAM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Talento', '', 'Territorio', 'Biografía', 'Compromisos', 'Fee', 'URL', 'Seguidores', 'Impresiones Story', 'Impresiones Reels (promedio)', 'Interacciones (promedio)', '% ER', '% Credibilidad', 'IP España', 'Sexo', 'Edad', 'URL, colaboraciones pasadas:', 'Seguidores', 'Media Impresiones', 'Media Interacciones', 'ER%', 'IP España', 'Sexo', 'Edad'],
    
    ['PERFILES CONFIRMADOS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ...confirmedTalents.map(talent => [
      talent.name,
      talent.category.toUpperCase(),
      talent.biography,
      talent.commitment,
      talent.fee,
      talent.url,
      talent.instagramFollowers,
      talent.instagramStoryImpressions,
      talent.instagramReelImpressions,
      talent.instagramInteractions,
      talent.instagramER / 100,
      talent.instagramCredibility / 100,
      talent.instagramSpainIP / 100,
      formatGenderSplit(talent.instagramGenderSplit),
      formatAgeDistribution(talent.instagramAgeDistribution),
      talent.pastCollaborations?.join(', ') || '',
      talent.tiktokFollowers || 0,
      talent.tiktokImpressions || 0,
      talent.tiktokInteractions || 0,
      (talent.tiktokER || 0) / 100,
      (talent.tiktokSpainIP || 0) / 100,
      formatGenderSplit(talent.tiktokGenderSplit || talent.instagramGenderSplit),
      formatAgeDistribution(talent.tiktokAgeDistribution || talent.instagramAgeDistribution)
    ]),

    ...(options.includeUnconfirmed ? [
      ['PERFILES SIN CONTRASTAR', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ...unconfirmedTalents.map(talent => [
        talent.name,
        talent.category.toUpperCase(),
        talent.biography,
        talent.commitment,
        talent.fee,
        talent.url,
        talent.instagramFollowers,
        talent.instagramStoryImpressions,
        talent.instagramReelImpressions,
        talent.instagramInteractions,
        talent.instagramER / 100,
        talent.instagramCredibility / 100,
        talent.instagramSpainIP / 100,
        formatGenderSplit(talent.instagramGenderSplit),
        formatAgeDistribution(talent.instagramAgeDistribution),
        talent.pastCollaborations?.join(', ') || '',
        talent.tiktokFollowers || 0,
        talent.tiktokImpressions || 0,
        talent.tiktokInteractions || 0,
        (talent.tiktokER || 0) / 100,
        (talent.tiktokSpainIP || 0) / 100,
        formatGenderSplit(talent.tiktokGenderSplit || talent.instagramGenderSplit),
        formatAgeDistribution(talent.tiktokAgeDistribution || talent.instagramAgeDistribution)
      ])
    ] : [])
  ];
}; 