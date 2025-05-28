import React, { useState } from 'react';
import { } from '../utils/dataUtils';
import { parseFile, validateData } from '../utils/validateDataFile';

interface FileUploadProps {
  setFileInfo: (info: any) => void;
  setData: (data: any[]) => void;
  setValidationResults: (results: any) => void;
  setActiveTab: (tab: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ setFileInfo, setData, setValidationResults, setActiveTab }) => {
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileInfo({
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(2),
      lastModified: formatDate(new Date(file.lastModified))
    });

    try {
      const records = await parseFile(file);
      console.log('Načtená data:', records); // LOG
      setData(records);
      const validationResult = validateData(records);
      console.log('Výsledek validace:', validationResult); // LOG
      setValidationResults(validationResult);
      setActiveTab('validate');
    } catch (e: any) {
      console.log('Chyba při načítání nebo validaci souboru:', e); // LOG
      setValidationResults({
        valid: false,
        messages: [e.message || 'Chyba při načítání nebo validaci souboru.'],
        stats: {
          totalRecords: 0,
          expectedRecords: 0,
          missingRecords: 0,
          structuralErrors: 1,  // Add structural error flag
          invalidValues: 0,
          invalidTimestamps: 0,
          invalidUnits: 0,
          duplicateTimestamps: 0,
          duplicateValues: 0,
          validTimestamps: 0,
          missingValues: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Nahrání iniciálního diagramu</h2>
      <p className="mb-4 text-gray-600">
        Nahrajte soubor s daty iniciálního diagramu. Podporované formáty: CSV, XLSX, XML.
      </p>

      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <span className="text-4xl mb-2">📤</span>
            <p className="mb-2 text-sm text-gray-500 font-semibold">Klikněte pro nahrání souboru</p>
            <p className="text-xs text-gray-500">CSV, XLSX nebo XML</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls,.xml"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center space-x-2 my-4">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Načítání souboru...</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
