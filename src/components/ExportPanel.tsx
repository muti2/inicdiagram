import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ExportPanelProps {
  data: any[];
}

const ExportPanel: React.FC<ExportPanelProps> = ({ data }) => {
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  const handleExport = () => {
    if (!data || data.length === 0) {
      setExportMessage('Nejsou k dispozici žádná data pro export.');
      return;
    }

    setIsExporting(true);
    setExportMessage('');

    try {
      let exportData, filename, fileType, blob;

      switch (exportFormat) {
        case 'csv':
          exportData = Papa.unparse(data);
          fileType = 'text/csv;charset=utf-8;';
          filename = `export_data_${new Date().toISOString().slice(0, 10)}.csv`;
          blob = new Blob([exportData], { type: fileType });
          break;
        
        case 'json':
          exportData = JSON.stringify(data, null, 2);
          fileType = 'application/json;charset=utf-8;';
          filename = `export_data_${new Date().toISOString().slice(0, 10)}.json`;
          blob = new Blob([exportData], { type: fileType });
          break;
        
        case 'xlsx':
          const worksheet = XLSX.utils.json_to_sheet(data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          exportData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;';
          filename = `export_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
          blob = new Blob([exportData], { type: fileType });
          break;

        default:
          throw new Error('Nepodporovaný formát exportu');
      }

      // Vytvořit odkaz pro stažení
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage(`Export dokončen. Soubor ${filename} se stahuje.`);
    } catch (error) {
      console.error('Chyba při exportu dat:', error);
      setExportMessage(`Chyba při exportu: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);  
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Export dat</h2>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium">Informace o exportu</p>
        <p className="mt-1">Exportujte vaše data (včetně provedených oprav) v požadovaném formátu.</p>
        <p className="mt-1">Celkem záznamů k exportu: <span className="font-semibold">{data?.length || 0}</span></p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Formát exportu</label>
        <div className="flex flex-wrap gap-3">
          <label className={`flex items-center border rounded-lg px-4 py-3 cursor-pointer ${exportFormat === 'csv' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
            <input
              type="radio"
              name="format"
              value="csv"
              className="mr-2"
              checked={exportFormat === 'csv'}
              onChange={() => setExportFormat('csv')}
            />
            <div>
              <span className="font-medium block dark:text-gray-100">CSV</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Běžný tabulkový formát</span>
            </div>
          </label>
          
          <label className={`flex items-center border rounded-lg px-4 py-3 cursor-pointer ${exportFormat === 'xlsx' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
            <input
              type="radio"
              name="format"
              value="xlsx"
              className="mr-2"
              checked={exportFormat === 'xlsx'}
              onChange={() => setExportFormat('xlsx')}
            />
            <div>
              <span className="font-medium block dark:text-gray-100">Excel (XLSX)</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Microsoft Excel formát</span>
            </div>
          </label>
          
          <label className={`flex items-center border rounded-lg px-4 py-3 cursor-pointer ${exportFormat === 'json' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
            <input
              type="radio"
              name="format"
              value="json"
              className="mr-2"
              checked={exportFormat === 'json'}
              onChange={() => setExportFormat('json')}
            />
            <div>
              <span className="font-medium block dark:text-gray-100">JSON</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Datový formát pro programátory</span>
            </div>
          </label>
        </div>
      </div>

      <button
        className={`px-5 py-2.5 rounded-md shadow-sm font-medium ${data && data.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
        onClick={handleExport}
        disabled={isExporting || !data || data.length === 0}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin inline-block mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exportuji...
          </>
        ) : (
          `Exportovat data jako ${exportFormat.toUpperCase()}`
        )}
      </button>

      {exportMessage && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${exportMessage.includes('Chyba') ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'}`}>
          {exportMessage}
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
