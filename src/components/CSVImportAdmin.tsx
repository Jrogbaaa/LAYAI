'use client';

import { useState } from 'react';
import { CampaignCSVImporter } from '@/utils/csvImporter';
import { CampaignDatabase } from '@/lib/firebase-campaigns';
import { CSVImportResult } from '@/types/database';

export const CSVImportAdmin: React.FC = () => {
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'orange' | 'hibiki'>('orange');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Read file content
      const content = await file.text();
      
      // Parse the CSV
      const importedData = selectedFormat === 'orange' 
        ? CampaignCSVImporter.parseOrangeCSV(content)
        : CampaignCSVImporter.parseHibikiCSV(content);

      // Save to database
      const campaignId = await CampaignDatabase.saveCampaign(importedData.parsedCampaign);
      
      // Generate intelligence after import
      await CampaignDatabase.generateCampaignIntelligence();

      setImportResult({
        campaignsImported: 1,
        talentsImported: importedData.parsedCampaign.talents.length,
        errors: [],
        warnings: importedData.needsReview ? ['Campaign needs manual review'] : [],
        patternsGenerated: 1
      });

      console.log('Campaign imported with ID:', campaignId);
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        campaignsImported: 0,
        talentsImported: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: [],
        patternsGenerated: 0
      });
    } finally {
      setIsImporting(false);
    }
  };

  const sampleCSVData = {
    orange: `CLIENTE,Orange
CAMPAÑA,TODO Days
PRESUPUESTO,"100,000 €"
TALENTOS*,A escoger 1 talento nuevo

PROPUESTA PERFILES
INSTAGRAM,,,,,,,,,,,,TIK TOK
Talento,Territorio,Biografía,Compromisos,Fee,URL,Seguidores,Impresiones Story,Impresiones Reels,Interacciones,%ER,%Credibilidad,IP España,Sexo,Edad

PERFILES CONFIRMADOS
VANESA ROMERO,ACTRIZ,"Actriz que combina su popularidad...",4 Reels + 4 TikTok + 8 stories,"40,000 €",https://instagram.com/vanesa_romero,"1,292,448","190,000","60,000","4,500",8%,88%,86%,"Mujeres 42%, Hombres 58%","25 a 34: 36%"`,

    hibiki: `TALENTOS HIBIKI
INSTAGRAM
Talento,Territorio,COMENTARIOS,URL,Seguidores,Biografía,Reason Why,Commitment,Impresiones Story,Impresiones Reel,%ER,%Credibilidad,%IP España,Sexo,%Edad,Impresiones totales,Fee (euros)

George Parra,Arte,,https://instagram.com/georgeosparra,"38,100","Jorge Parra es un diseñador...",Director Creativo...,"2 reels + 4 stories","40,000","200,000","6,00%",72%,65%,"M:30% H:70%","25-34: 28%","560,000","14,200"`
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Import Historical Campaign Data
        </h2>
        <p className="text-gray-600">
          Upload CSV files from successful campaigns to train the AI matching algorithm. 
          The system will learn from these examples to improve future recommendations.
        </p>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          CSV Format
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="orange"
              checked={selectedFormat === 'orange'}
              onChange={(e) => setSelectedFormat(e.target.value as 'orange')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Orange/TSL Style (Standard Agency Format)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="hibiki"
              checked={selectedFormat === 'hibiki'}
              onChange={(e) => setSelectedFormat(e.target.value as 'hibiki')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Hibiki Style (Luxury Brand Format)
            </span>
          </label>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload a CSV file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">CSV files only</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isImporting && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 font-medium">
              Importing campaign data and generating insights...
            </span>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="mb-6">
          <div className={`p-4 rounded-md ${
            importResult.errors.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}>
            <h3 className={`font-medium ${
              importResult.errors.length > 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              Import Results
            </h3>
            <div className="mt-2 text-sm">
              <ul className={`list-disc list-inside space-y-1 ${
                importResult.errors.length > 0 ? 'text-red-700' : 'text-green-700'
              }`}>
                <li>Campaigns imported: {importResult.campaignsImported}</li>
                <li>Talents imported: {importResult.talentsImported}</li>
                <li>Patterns generated: {importResult.patternsGenerated}</li>
              </ul>
              
              {importResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-yellow-800">Warnings:</p>
                  <ul className="list-disc list-inside text-yellow-700">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-red-800">Errors:</p>
                  <ul className="list-disc list-inside text-red-700">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sample Format */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Expected CSV Format ({selectedFormat === 'orange' ? 'Orange/TSL' : 'Hibiki'})
        </h3>
        <div className="bg-gray-50 rounded-md p-4">
          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
            {sampleCSVData[selectedFormat]}
          </pre>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          The importer will automatically extract campaign information, talent data, and performance metrics 
          to train the matching algorithm.
        </p>
      </div>

      {/* Learning Benefits */}
      <div className="mt-6 bg-blue-50 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          How This Improves Matching
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Success Patterns:</strong> Learn what combinations work for different industries</li>
          <li>• <strong>Market Rates:</strong> Understand current pricing across talent categories</li>
          <li>• <strong>Audience Insights:</strong> Discover optimal demographic matches</li>
          <li>• <strong>Performance Prediction:</strong> Estimate campaign success probability</li>
          <li>• <strong>Budget Optimization:</strong> Recommend efficient budget allocations</li>
        </ul>
      </div>
    </div>
  );
}; 