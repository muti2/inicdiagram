import { useState, ChangeEvent, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { validateData as validateDataFile, DataRecord as ValidatorDataRecord } from './utils/validateDataFile';
import ExportPanel from './components/ExportPanel';
import ChartsPanel from './components/ChartsPanelFixed';
import Navigation from './components/Navigation';

// --- Type Definitions ---

interface DataRecord {
  id: number;
  timestamp: string; // ISO 8601 format string
  value: number | null; // Allow null for missing/invalid values initially
  unit: string;
}

interface FileInfo {
  name: string;
  type: string;
  size: string; // KB
  lastModified: string; // Formatted date string
}

interface ValidationStats {
  totalRecords: number;
  validTimestamps: number;
  expectedRecords: number;
  missingRecords: number;
  missingValues: number;
  invalidValues: number; // Extreme values
  extremeValues?: number; // Statistical outliers
  duplicateValues: number; // Duplicate timestamps
  invalidTimestamps: number;
  differentYears?: number; // Number of different years in data
  years?: number[];        // Array of years in the data
  structuralErrors?: number; // Structural validation errors
}

interface ValidationResults {
  valid: boolean;
  messages: string[];
  stats: ValidationStats;
}

interface RepairStats {
  missingRepaired: number;
  duplicatesRemoved: number;
  extremesFixed: number;
  // Optional: Add stats found during validation for context
  duplicatesFound?: number;
  extremesFound?: number;
  missingFound?: number;
  missingValuesFound?: number;
  invalidTimestampsFound?: number;
}

interface RepairResults {
  success: boolean;
  stats: RepairStats;
  message: string;
}

// --- Helper Functions ---

// Helper function to parse various date formats into ISO 8601 string
const parseTimestamp = (timestampInput: unknown): string | null => {
    if (timestampInput === null || timestampInput === undefined) return null;

    // Handle Excel date serial numbers (numbers)
    if (typeof timestampInput === 'number') {
        // Basic check for typical Excel date range (avoids very small/large numbers)
        if (timestampInput > 1 && timestampInput < 2958466) { // Approx year 1900 to 9999
             try {
                 // Use SheetJS utility for robust conversion
                 const date = XLSX.SSF.parse_date_code(timestampInput);
                 // Convert JS Date object { y, m, d, H, M, S } to UTC Date
                 const utcDate = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S));
                 if (!isNaN(utcDate.getTime())) {
                     return utcDate.toISOString();
                 }
             } catch (e) {
                 console.warn(`Failed to parse Excel date number ${timestampInput}:`, e);
             }
        }
    }

    // Handle Date objects directly (e.g., from XLSX with cellDates: true)
    if (timestampInput instanceof Date) {
        if (!isNaN(timestampInput.getTime())) {
            return timestampInput.toISOString();
        } else {
            return null; // Invalid Date object
        }
    }

    // Handle string inputs
    if (typeof timestampInput === 'string') {
        const tsString = timestampInput.trim();
        if (!tsString) return null;

        // 1. Try ISO 8601 directly (or formats JS Date constructor understands)
        let date = new Date(tsString);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            return date.toISOString();
        }

        // 2. Try DD.MM.YYYY HH:MM(:SS)
        let match = tsString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?$/);
        if (match) {
            const [, day, month, year, hour, minute, , second] = match;
            date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second || '0')));
            if (!isNaN(date.getTime())) return date.toISOString();
        }

        // 3. Try YYYY-MM-DD HH:MM(:SS) or YYYY-MM-DDTHH:MM:SS
         match = tsString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(:(\d{1,2}))?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
        if (match) {
             // Simpler approach: let Date.parse handle ISO-like strings again after regex check
             date = new Date(tsString);
             if (!isNaN(date.getTime()) && date.getFullYear() > 1900) return date.toISOString();
        }


        // 4. Try YYYY/MM/DD HH:MM(:SS)
        match = tsString.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?$/);
        if (match) {
            const [, year, month, day, hour, minute, , second] = match;
            date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second || '0')));
            if (!isNaN(date.getTime())) return date.toISOString();
        }

        // 5. Try MM/DD/YYYY HH:MM(:SS) (Common US format)
        match = tsString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?$/);
        if (match) {
            const [, month, day, year, hour, minute, , second] = match;
            date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second || '0')));
            if (!isNaN(date.getTime())) return date.toISOString();
        }
    }

    console.warn(`Could not parse timestamp:`, timestampInput);
    return null; // Indicate parsing failure
};

// Format ISO date string to readable local format
const formatReadableDate = (isoString: string | null): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return 'Neplatné datum';
        }
        // Use local time for display
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false // Use 24-hour format
        };
        return date.toLocaleString('cs-CZ', options); // Use Czech locale for formatting
    } catch (e) {
        console.error("Chyba formátování data:", isoString, e);
        return 'Chyba formátu';
    }
};

// --- React Component ---

function App() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [data, setData] = useState<DataRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State for automatic repairs
  const [fixMissing, setFixMissing] = useState<boolean>(false);
  const [fixDuplicate, setFixDuplicate] = useState<boolean>(false);
  const [fixExtreme, setFixExtreme] = useState<boolean>(false);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairResults, setRepairResults] = useState<RepairResults | null>(null);
  
  // State for tracking data changes
  const [dataChanged, setDataChanged] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // State for editing data rows
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{timestamp: string, value: string, unit: string}>({timestamp: '', value: '', unit: ''});
  
  // State for interpolation requirements check
  const [interpolationCheck, setInterpolationCheck] = useState<{canInterpolate: boolean, reason: string} | null>(null);

  // Dark mode effect
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const isDarkMode = JSON.parse(savedDarkMode);
      setDarkMode(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);


  // Filtering logic
  const getFilteredData = (): DataRecord[] => {
    if (!data) return [];

    return data.filter(item => {
      try {
        // Ensure timestamp is valid before filtering
        if (!item.timestamp) return false;
        const date = new Date(item.timestamp);
        if (isNaN(date.getTime())) return false;

        const month = date.getMonth() + 1;
        const day = date.getDate();

        if (monthFilter !== 'all' && month !== parseInt(monthFilter)) return false;
        if (dayFilter !== 'all' && day !== parseInt(dayFilter)) return false;

        if (searchTerm) {
          const searchTermLower = searchTerm.toLowerCase();
          const timestampStr = formatReadableDate(item.timestamp).toLowerCase();
          const valueStr = String(item.value ?? '').toLowerCase(); // Handle null value
          return timestampStr.includes(searchTermLower) || valueStr.includes(searchTermLower);
        }
        return true;
      } catch (e) {
        console.error("Error filtering data item:", item, e);
        return false;
      }
    });
  };

  const filteredData = getFilteredData(); // Calculate once per render cycle

  // Pagination logic
  const getCurrentPageData = (): DataRecord[] => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  };

  const getTotalPages = (): number => {
    return Math.ceil(filteredData.length / rowsPerPage);
  };

  const changePage = (page: number) => {
    const totalPages = getTotalPages();
    let newPage = page;
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages && totalPages > 0) newPage = totalPages;
    if (totalPages === 0) newPage = 1;
    setCurrentPage(newPage);
  };

  // Reset filters
  const resetFilters = () => {
    setMonthFilter('all');
    setDayFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  // Check interpolation requirements
  const checkInterpolationRequirements = (dataToCheck: DataRecord[]): {canInterpolate: boolean, reason: string} => {
    if (!dataToCheck || dataToCheck.length === 0) {
      return {canInterpolate: false, reason: 'Žádná data k analýze'};
    }
    
    const sortedValidData = dataToCheck
      .filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime()))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sortedValidData.length === 0) {
      return {canInterpolate: false, reason: 'Žádná data s platnými časovými značkami'};
    }

    const interpolationStartTime = new Date(sortedValidData[0].timestamp);
    const interpolationEndTime = new Date(sortedValidData[sortedValidData.length - 1].timestamp);
    const timeSpanMs = interpolationEndTime.getTime() - interpolationStartTime.getTime();
    const timeSpanDays = timeSpanMs / (24 * 60 * 60 * 1000);
    const intervalMs = 15 * 60 * 1000;
    const expectedRecordsInTimespan = Math.floor(timeSpanMs / intervalMs) + 1;
    const currentRecords = sortedValidData.length;
    const recordsToGenerate = expectedRecordsInTimespan - currentRecords;
    
    // Check 1: Optimal data density (10% coverage)
    const minRequiredRecords = Math.max(100, Math.floor(expectedRecordsInTimespan * 0.10));
    if (currentRecords < minRequiredRecords) {
      return {canInterpolate: false, reason: `Nedostatečná hustota dat (${currentRecords}/${minRequiredRecords} záznamů)`};
    }
    
    // Check 2: Maximum records to generate
    const maxRecordsToGenerate = 8000;
    if (recordsToGenerate > maxRecordsToGenerate) {
      return {canInterpolate: false, reason: `Příliš mnoho záznamů k vygenerování (${recordsToGenerate.toLocaleString()})`};
    }
    
    // Check 3: Maximum time gap between consecutive records
    const maxGapDays = 7;
    const maxGapMs = maxGapDays * 24 * 60 * 60 * 1000;
    for (let i = 1; i < sortedValidData.length; i++) {
      const gap = new Date(sortedValidData[i].timestamp).getTime() - new Date(sortedValidData[i-1].timestamp).getTime();
      if (gap > maxGapMs) {
        const gapDays = Math.round(gap / (24 * 60 * 60 * 1000));
        return {canInterpolate: false, reason: `Příliš velká mezera mezi záznamy (${gapDays} dní)`};
      }
    }
    
    // Check 4: Minimum time span coverage
    if (timeSpanDays > 180) {
      const monthsWithData = new Set();
      sortedValidData.forEach(item => {
        const date = new Date(item.timestamp);
        monthsWithData.add(date.getMonth());
      });
      
      if (monthsWithData.size < 6) {
        return {canInterpolate: false, reason: `Data pokrývají pouze ${monthsWithData.size} měsíců (potřeba min. 6)`};
      }
    }
    
    return {canInterpolate: true, reason: 'Požadavky splněny'};
  };
  
  // Handle row edit
  const handleEditClick = (row: DataRecord) => {
    setEditingRow(row.id);
    setEditFormData({
      timestamp: row.timestamp,
      value: row.value !== null ? row.value.toString() : '',
      unit: row.unit
    });
  };
  
  // Handle edit form input changes
  const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditFormData(prev => ({...prev, [name]: value}));
  };
  
  // Save edited row
  const handleEditFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (editingRow === null) return;
    
    const formattedValue = editFormData.value.trim() === '' ? null : Number(editFormData.value);
    
    // Ensure timestamp is valid
    let formattedTimestamp = editFormData.timestamp;
    try {
      // Make sure we have a valid timestamp format
      const date = new Date(editFormData.timestamp);
      if (!isNaN(date.getTime())) {
        formattedTimestamp = date.toISOString();
      }
    } catch (e) {
      console.error('Invalid timestamp format:', e);
    }
    
    const editedData = data?.map(item => 
      item.id === editingRow 
        ? { ...item, timestamp: formattedTimestamp, value: formattedValue, unit: editFormData.unit } 
        : item
    );
    
    if (editedData) {
      setData(editedData);
      setDataChanged(true);
    }
    
    setEditingRow(null);
  };
  
  // Cancel editing
  const handleCancelClick = () => {
    setEditingRow(null);
  };
  
  // Delete row
  const handleDeleteClick = (rowId: number) => {
    if (!data) return;
    
    const newData = data.filter(item => item.id !== rowId);
    setData(newData);
    setDataChanged(true);
  };
  
  // Export data functionality
  const handleExportFromDataTab = () => {
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

  // --- Repair Logic ---
  const applyRepairs = () => {
    if (!data) return;
    
    // Prevent interpolation for data with multiple years
    if (fixMissing && validationResults?.stats.differentYears && validationResults.stats.differentYears > 1) {
      setErrorMessage('Nelze doplnit chybějící záznamy pro data z více let.');
      return;
    }

    setIsRepairing(true);
    setErrorMessage('');
    setRepairResults(null);

    setTimeout(() => {
      try {
        let newData: DataRecord[] = JSON.parse(JSON.stringify(data)); // Deep copy to avoid state mutation issues
        let repairStats: RepairStats = {
          missingRepaired: 0,
          duplicatesRemoved: 0,
          extremesFixed: 0
        };

        // --- 1. Remove Duplicates ---
        if (fixDuplicate) {
          const uniqueTimestamps = new Set<string>();
          const uniqueData: DataRecord[] = [];
          // Sort by timestamp first to keep the earliest record
          newData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          for (const item of newData) {
            if (!item.timestamp || isNaN(new Date(item.timestamp).getTime())) {
              uniqueData.push(item); // Keep invalid items
              continue;
            }
            if (!uniqueTimestamps.has(item.timestamp)) {
              uniqueTimestamps.add(item.timestamp);
              uniqueData.push(item);
            } else {
              repairStats.duplicatesRemoved++;
            }
          }
          newData = uniqueData;
        }

        if (newData.length === 0 && (fixExtreme || fixMissing)) {
          throw new Error("Nelze provést opravy na prázdných datech.");
        }

        // --- 2. Fix Extremes ---
        if (fixExtreme && newData.length > 0) {
          const validNumericItems = newData.filter(item =>
            item.timestamp && !isNaN(new Date(item.timestamp).getTime()) && item.value !== null && !isNaN(item.value)
          );

          if (validNumericItems.length > 1) {
            const values = validNumericItems.map(item => item.value as number);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            if (!isNaN(stdDev) && stdDev > 1e-6) {
              const threshold = 3 * stdDev;
              const lowerBound = mean - threshold;
              const upperBound = mean + threshold;

              newData = newData.map(item => {
                if (item.value !== null && !isNaN(item.value) && (item.value < lowerBound || item.value > upperBound)) {
                  repairStats.extremesFixed++;
                  return { ...item, value: Math.round(mean * 100) / 100 }; // Use calculated mean
                }
                return item;
              });
            } else {
              console.warn("Oprava extrémů přeskočena: směrodatná odchylka je příliš malá nebo neplatná.");
            }
          } else {
            console.warn("Oprava extrémů přeskočena: nedostatek platných dat pro výpočet.");
          }
        }

        // --- 3. Fix Missing ---
        if (fixMissing && newData.length > 0) {
          const sortedValidData = newData
            .filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime()))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          if (sortedValidData.length === 0) {
            throw new Error("Nelze doplnit chybějící záznamy: žádná data s platnými časovými značkami.");
          }

          // --- SAFETY CHECKS FOR INTERPOLATION ---
          const interpolationStartTime = new Date(sortedValidData[0].timestamp);
          const interpolationEndTime = new Date(sortedValidData[sortedValidData.length - 1].timestamp);
          const timeSpanMs = interpolationEndTime.getTime() - interpolationStartTime.getTime();
          const timeSpanDays = timeSpanMs / (24 * 60 * 60 * 1000);
          const intervalMs = 15 * 60 * 1000;
          const expectedRecordsInTimespan = Math.floor(timeSpanMs / intervalMs) + 1;
          const currentRecords = sortedValidData.length;
          const recordsToGenerate = expectedRecordsInTimespan - currentRecords;
          
          // Check 1: Optimal data density (10% coverage)
          const minRequiredRecords = Math.max(100, Math.floor(expectedRecordsInTimespan * 0.10));
          if (currentRecords < minRequiredRecords) {
            throw new Error(`Interpolace zamítnuta: Nedostatečná hustota dat. Máte ${currentRecords} záznamů, potřebujete alespoň ${minRequiredRecords} (10% pokrytí časového rozsahu ${Math.round(timeSpanDays)} dní). Pro kvalitní interpolace doporučujeme alespoň 1 záznam týdně.`);
          }
          
          // Check 2: Maximum records to generate (prevent memory issues)
          const maxRecordsToGenerate = 8000;
          if (recordsToGenerate > maxRecordsToGenerate) {
            throw new Error(`Interpolace zamítnuta: Příliš mnoho záznamů k vygenerování (${recordsToGenerate.toLocaleString()}). Maximum je ${maxRecordsToGenerate.toLocaleString()}. Nahrajte více vstupních dat pro zmenšení mezer.`);
          }
          
          // Check 3: Maximum time gap between consecutive records (optimal: 7 days)
          const maxGapDays = 7; // 7 days for optimal quality
          const maxGapMs = maxGapDays * 24 * 60 * 60 * 1000;
          for (let i = 1; i < sortedValidData.length; i++) {
            const gap = new Date(sortedValidData[i].timestamp).getTime() - new Date(sortedValidData[i-1].timestamp).getTime();
            if (gap > maxGapMs) {
              const gapDays = Math.round(gap / (24 * 60 * 60 * 1000));
              throw new Error(`Interpolace zamítnuta: Příliš velká mezera mezi záznamy (${gapDays} dní). Maximum je ${maxGapDays} dní pro kvalitní interpolaci. Doplňte více dat v období ${new Date(sortedValidData[i-1].timestamp).toLocaleDateString('cs-CZ')} - ${new Date(sortedValidData[i].timestamp).toLocaleDateString('cs-CZ')}.`);
            }
          }
          
          // Check 4: Minimum time span coverage (data should span at least 6 months for annual data)
          if (timeSpanDays > 180) { // If data spans more than 6 months
            const monthsWithData = new Set();
            sortedValidData.forEach(item => {
              const date = new Date(item.timestamp);
              monthsWithData.add(date.getMonth());
            });
            
            if (monthsWithData.size < 6) {
              throw new Error(`Interpolace zamítnuta: Data pokrývají pouze ${monthsWithData.size} měsíců. Pro roční data je potřeba alespoň 6 měsíců s daty pro spolehlivou interpolaci.`);
            }
          }
          
          // Check 4: Warn about large interpolation
          if (recordsToGenerate > 1000) {
            console.warn(`Upozornění: Interpolace vygeneruje ${recordsToGenerate.toLocaleString()} nových záznamů. To může trvat několik sekund.`);
          }

          const expectedData: DataRecord[] = [];
          const currentTime = new Date(interpolationStartTime);
          let nextId = newData.length > 0 ? Math.max(0, ...newData.map(item => item.id)) + 1 : 1;
          const dataMap = new Map(sortedValidData.map(item => [new Date(item.timestamp).getTime(), item]));

          const validValuesForMean = sortedValidData.map(item => item.value).filter((v): v is number => v !== null && !isNaN(v));
          const globalMean = validValuesForMean.length > 0 ? validValuesForMean.reduce((sum, item) => sum + item, 0) / validValuesForMean.length : 0;

          while (currentTime <= interpolationEndTime) {
            const currentTimeMs = currentTime.getTime();
            const existingItem = dataMap.get(currentTimeMs);

            if (existingItem) {
              expectedData.push(existingItem);
            } else {
              const before = sortedValidData.filter(item => new Date(item.timestamp).getTime() < currentTimeMs).pop(); // More efficient way to get last item
              const after = sortedValidData.find(item => new Date(item.timestamp).getTime() > currentTimeMs); // More efficient way to get first item

              let interpolatedValue: number | null = null;

              if (before && after && before.value !== null && after.value !== null && !isNaN(before.value) && !isNaN(after.value)) {
                const beforeTime = new Date(before.timestamp).getTime();
                const afterTime = new Date(after.timestamp).getTime();
                if (afterTime > beforeTime) {
                  const ratio = (currentTimeMs - beforeTime) / (afterTime - beforeTime);
                  interpolatedValue = before.value + ratio * (after.value - before.value);
                }
              } else if (before && before.value !== null && !isNaN(before.value)) {
                interpolatedValue = before.value;
              } else if (after && after.value !== null && !isNaN(after.value)) {
                interpolatedValue = after.value;
              } else {
                interpolatedValue = globalMean; // Fallback to global mean
              }

              const newItem: DataRecord = {
                id: nextId++,
                timestamp: currentTime.toISOString(),
                value: interpolatedValue !== null ? Math.round(interpolatedValue * 100) / 100 : null,
                unit: sortedValidData[0]?.unit || 'kWh'
              };
              expectedData.push(newItem);
              repairStats.missingRepaired++;
            }
            currentTime.setTime(currentTime.getTime() + intervalMs);
          }
          // Combine repaired data with original items having invalid timestamps
          const invalidTimestampItems = data.filter(item => !item.timestamp || isNaN(new Date(item.timestamp).getTime()));
          newData = [...expectedData, ...invalidTimestampItems].sort((a, b) => {
              // Handle potentially invalid dates during sort
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              if (isNaN(timeA) && isNaN(timeB)) return 0;
              if (isNaN(timeA)) return 1; // Put invalid dates at the end
              if (isNaN(timeB)) return -1;
              return timeA - timeB;
          });
        }

        // --- Final Update ---
        setData(newData);
        setDataChanged(true);

        // Update validation results (simple update, full re-validation recommended)
        if (validationResults) {
          setValidationResults(prev => prev ? ({
            ...prev,
            stats: {
              ...prev.stats,
              totalRecords: newData.length,
            }
          }) : null);
        }

        // Set repair results message
        let message = "";
        if (fixMissing && repairStats.missingRepaired > 0) message += `Doplněno ${repairStats.missingRepaired} chybějících záznamů. `;
        if (fixDuplicate && repairStats.duplicatesRemoved > 0) message += `Odstraněno ${repairStats.duplicatesRemoved} duplicitních záznamů. `;
        if (fixExtreme && repairStats.extremesFixed > 0) message += `Opraveno ${repairStats.extremesFixed} extrémních hodnot. `;
        if (message === "") message = "Nebyla provedena žádná oprava."; else message = "Oprava dokončena: " + message.trim();

        setRepairResults({ success: true, stats: repairStats, message: message });
        resetFilters();
      } catch (error: unknown) {
        console.error("Chyba při automatické opravě:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        setErrorMessage(`Chyba při opravě: ${errorMsg}`);
        setRepairResults({ success: false, stats: { missingRepaired: 0, duplicatesRemoved: 0, extremesFixed: 0 }, message: `Oprava selhala: ${errorMsg}` });
      } finally {
        setIsRepairing(false);
      }
    }, 500);
  };

  // --- Validation Logic ---
  const validateData = () => {
    if (!data) { // Handle case where data might be null
        setValidationResults({
            valid: true, messages: ["Žádná data k validaci."],
            stats: { totalRecords: 0, validTimestamps: 0, expectedRecords: 0, missingRecords: 0, missingValues: 0, invalidValues: 0, duplicateValues: 0, invalidTimestamps: 0 }
        });
        setActiveTab('validate');
        return;
    }
     if (data.length === 0) {
        setValidationResults({
            valid: true, messages: ["Data jsou prázdná."],
            stats: { totalRecords: 0, validTimestamps: 0, expectedRecords: 0, missingRecords: 0, missingValues: 0, invalidValues: 0, duplicateValues: 0, invalidTimestamps: 0 }
        });
        setActiveTab('validate');
        return;
    };

    // Call validateDataFile function
    try {
        // Convert our data format to validator's format
        const validatorData = data.map(item => ({
            timestamp: item.timestamp,
            value: item.value !== null ? item.value : 0, // Convert null to 0 for validation
            unit: item.unit
        })) as ValidatorDataRecord[];
        
        const validationResult = validateDataFile(validatorData);
        console.log('Výsledek validace z validateDataFile:', validationResult);
        
        // Disable fixMissing if data spans multiple years
        if (validationResult.stats.differentYears && validationResult.stats.differentYears > 1) {
          setFixMissing(false);
        }
        
        // Check interpolation requirements
        const interpolationResult = checkInterpolationRequirements(data);
        setInterpolationCheck(interpolationResult);
        
        setValidationResults(validationResult);
        setActiveTab('validate');
        return;
    } catch (e) {
        console.error('Chyba pu0159i validaci:', e);
    }

    // Fallback to original implementation if validateDataFile fails
    setIsRepairing(true);
    setErrorMessage('');

    setTimeout(() => {
      try {
        const validTimestampData = data.filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime()));
        const invalidTimestampsCount = data.length - validTimestampData.length;

        if (validTimestampData.length === 0) {
          // If no valid timestamps, report that and stop further validation
           setValidationResults({
              valid: false,
              messages: [`Nalezeno ${invalidTimestampsCount} záznamů s neplatnou časovou značkou. Žádná platná data pro další validaci.`],
              stats: { totalRecords: data.length, validTimestamps: 0, expectedRecords: 0, missingRecords: 0, missingValues: data.length, invalidValues: 0, duplicateValues: 0, invalidTimestamps: invalidTimestampsCount }
           });
           // Set repair results to indicate validation ran but found critical issues
           setRepairResults({
               success: true, // Validation itself ran
               stats: { missingRepaired: 0, duplicatesRemoved: 0, extremesFixed: 0, invalidTimestampsFound: invalidTimestampsCount },
               message: "Validace dokončena: Nalezeny neplatné časové značky."
           });
           setActiveTab('validate');
           setIsRepairing(false);
           return; // Stop validation here
        }


        const sortedData = [...validTimestampData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstDate = new Date(sortedData[0].timestamp);
        const lastDate = new Date(sortedData[sortedData.length - 1].timestamp);
        const timeDiff = lastDate.getTime() - firstDate.getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        const expectedRecordsInRange = timeDiff >= 0 ? Math.floor(timeDiff / fifteenMinutes) + 1 : 1;
        const missingRecordsCount = Math.max(0, expectedRecordsInRange - sortedData.length);

        const timestamps = sortedData.map(item => item.timestamp);
        const uniqueTimestamps = new Set(timestamps);
        const duplicatesCount = sortedData.length - uniqueTimestamps.size;

        const validNumericItems = sortedData.filter(item => item.value !== null && !isNaN(item.value));
        const values = validNumericItems.map(item => item.value as number);
        let extremeValues = 0;
        if (values.length > 1) {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          if (!isNaN(stdDev) && stdDev > 1e-6) {
            extremeValues = values.filter(val => Math.abs(val - mean) > 3 * stdDev).length;
          }
        }

        const missingValuesCount = sortedData.filter(item => item.value === null || isNaN(item.value as number)).length;

        const isValid = missingRecordsCount === 0 && duplicatesCount === 0 && extremeValues === 0 && missingValuesCount === 0 && invalidTimestampsCount === 0;
        const messages: string[] = [];

        if (invalidTimestampsCount > 0) messages.push(`Nalezeno ${invalidTimestampsCount} záznamů s neplatnou časovou značkou.`); else messages.push("Všechny časové značky jsou platné.");
        if (missingRecordsCount > 0) messages.push(`V rozsahu ${formatReadableDate(firstDate.toISOString())} - ${formatReadableDate(lastDate.toISOString())} by mělo být ${expectedRecordsInRange} záznamů (15min), chybí ${missingRecordsCount}.`); else messages.push("Počet záznamů v rozsahu dat odpovídá 15min intervalu.");
        if (duplicatesCount > 0) messages.push(`Detekováno ${duplicatesCount} duplicitních časových značek.`); else messages.push("Žádné duplicitní časové značky.");
        if (extremeValues > 0) messages.push(`Detekováno ${extremeValues} extrémních hodnot (>3σ).`); else messages.push("Žádné extrémní hodnoty.");
        if (missingValuesCount > 0) messages.push(`Nalezeno ${missingValuesCount} záznamů s chybějící/neplatnou hodnotou.`); else messages.push("Všechny záznamy mají platnou hodnotu.");

        const stats: ValidationStats = {
          totalRecords: data.length,
          validTimestamps: validTimestampData.length,
          expectedRecords: expectedRecordsInRange,
          missingRecords: missingRecordsCount,
          missingValues: missingValuesCount,
          invalidValues: extremeValues,
          duplicateValues: duplicatesCount,
          invalidTimestamps: invalidTimestampsCount
        };
        
        // Check for data spanning multiple years
        try {
          const allDates = validTimestampData.map(item => new Date(item.timestamp));
          const years = new Set(allDates.map(date => date.getFullYear()));
          const differentYearsCount = years.size;
          const yearsArray = Array.from(years).sort();
          
          // Add years info to validation stats
          stats.differentYears = differentYearsCount;
          stats.years = yearsArray;
          
          // Disable fixMissing if data spans multiple years
          if (differentYearsCount > 1) {
            setFixMissing(false);
          }
        } catch (e) {
          console.error('Chyba při kontrole let v datech:', e);
        }

        console.log('Předáváno do ValidationPanel:', { valid: isValid, messages: messages, stats: stats });
        setValidationResults({ valid: isValid, messages: messages, stats: stats });

        // Update repair results contextually
        const baseRepairStats = { missingRepaired: 0, duplicatesRemoved: 0, extremesFixed: 0 };
        setRepairResults(prev => ({
             success: true, // Validation ran
             stats: { ...(prev?.stats ?? baseRepairStats), // Keep previous repair stats if available, else use base
                      duplicatesFound: duplicatesCount,
                      extremesFound: extremeValues,
                      missingFound: missingRecordsCount,
                      missingValuesFound: missingValuesCount,
                      invalidTimestampsFound: invalidTimestampsCount },
             message: `Validace dokončena. ${isValid ? 'Nebyly nalezeny žádné problémy.' : 'Byly nalezeny problémy.'}`
         }));


      } catch (error: unknown) {
        console.error("Chyba při validaci dat:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        setErrorMessage(`Chyba při validaci: ${errorMsg}`);
        setValidationResults({
          valid: false, messages: [`Validace selhala: ${errorMsg}`],
          stats: { totalRecords: data?.length || 0, validTimestamps: 0, expectedRecords: 0, missingRecords: 0, missingValues: 0, invalidValues: 0, duplicateValues: 0, invalidTimestamps: data?.length || 0 }
        });
      } finally {
        setActiveTab('validate');
        setIsRepairing(false);
      }
    }, 500);
  };

  // --- File Upload Logic ---
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage('');
    setExportMessage('');
    setData(null);
    setValidationResults(null);
    setRepairResults(null);
    setDataChanged(false);
    resetFilters();

    setFileInfo({
      name: file.name,
      type: file.type || 'Neznámý typ',
      size: (file.size / 1024).toFixed(2),
      lastModified: formatReadableDate(new Date(file.lastModified || Date.now()).toISOString())
    });

    const reader = new FileReader();
    const fileNameLower = file.name.toLowerCase(); // Define here for access in onerror/onload
    let fileParseError: Error | null = null; // Define here

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const fileContent = e.target?.result;
        if (!fileContent) throw new Error("Nepodařilo se přečíst obsah souboru.");

        let parsedData: DataRecord[] = [];
        // fileParseError is already defined above

        // --- CSV Parsing ---
        if (fileNameLower.endsWith('.csv')) {
            const result = Papa.parse<Record<string, string>>(fileContent as string, {
                header: true, skipEmptyLines: true, dynamicTyping: false,
                transformHeader: header => header.toLowerCase().trim()
            });

            let dataToParse: any[] = result.data;
            let headers: string[] | null = result.meta.fields?.map(h => h.toLowerCase().trim()) || null;

            if (result.errors.length > 0 || !headers || headers.length < 2) {
                console.warn("CSV parsing with header failed, trying without.", result.errors);
                const resultNoHeader = Papa.parse<string[]>(fileContent as string, { header: false, skipEmptyLines: true });
                if (resultNoHeader.data.length > 0 && resultNoHeader.errors.length <= result.errors.length) {
                    dataToParse = resultNoHeader.data;
                    headers = null;
                } else {
                    fileParseError = new Error(`Chyba parsování CSV: ${result.errors[0]?.message || 'Neznámá chyba'}`);
                    dataToParse = [];
                }
            }

            if (!fileParseError && dataToParse.length > 0) {
                let tsIndex = -1, valIndex = -1, unitIndex = -1;
                if (headers) {
                    tsIndex = headers.findIndex(h => ['timestamp', 'čas', 'datum', 'datum a čas', 'time', 'casova znamka'].includes(h));
                    valIndex = headers.findIndex(h => ['value', 'hodnota', 'spotřeba', 'consumption'].includes(h));
                    unitIndex = headers.findIndex(h => ['unit', 'jednotka'].includes(h));
                    if (tsIndex === -1) tsIndex = 0;
                    if (valIndex === -1) valIndex = 1;
                    if (unitIndex === -1 && headers.length > 2) unitIndex = 2;
                } else {
                    tsIndex = 0; valIndex = 1; unitIndex = -1;
                }
                console.log("CSV Headers:", headers);
                console.log("CSV Data to parse:", dataToParse.slice(0, 5)); // Log first 5 rows
                console.log(`CSV Indices - TS: ${tsIndex}, Val: ${valIndex}, Unit: ${unitIndex}`);


                parsedData = dataToParse.map((row, index): DataRecord | null => {
                    const timestampStr = headers ? row[headers![tsIndex]] : row[tsIndex];
                    const valueStr = headers ? row[headers![valIndex]] : row[valIndex];
                    const unitStr = headers && unitIndex !== -1 ? row[headers![unitIndex]] : 'kWh';
                    const timestamp = parseTimestamp(timestampStr);
                    const value = parseFloat(String(valueStr ?? '').replace(',', '.'));

                    if (timestamp) {
                        return { id: index + 1, timestamp, value: !isNaN(value) ? value : null, unit: unitStr || 'kWh' };
                    }
                    console.warn(`Přeskakuji řádek ${index + 1} v CSV: neplatný timestamp.`);
                    return null;
                }).filter((item): item is DataRecord => item !== null);
                console.log("CSV Parsed Data (first 5):", parsedData.slice(0, 5));
            }
        }
        // --- XLSX Parsing ---
        else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
            const workbook = XLSX.read(fileContent, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '' });

            if (jsonData.length < 2) {
                fileParseError = new Error("XLSX soubor neobsahuje data nebo hlavičku.");
            } else {
                const headerRow = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
                const dataRows = jsonData.slice(1);
                let tsColIndex = headerRow.findIndex((h: string) => ['timestamp', 'čas', 'datum', 'datum a čas', 'time', 'casova znamka'].includes(h));
                let valColIndex = headerRow.findIndex((h: string) => ['value', 'hodnota', 'spotřeba', 'consumption'].includes(h));
                let unitColIndex = headerRow.findIndex((h: string) => ['unit', 'jednotka'].includes(h));
                if (tsColIndex === -1) tsColIndex = 0;
                if (valColIndex === -1) valColIndex = 1;
                if (unitColIndex === -1 && headerRow.length > 2) unitColIndex = 2;

                parsedData = dataRows.map((row: any[], index): DataRecord | null => {
                    const timestampInput = row[tsColIndex];
                    const valueStr = row[valColIndex];
                    const unitStr = unitColIndex !== -1 ? row[unitColIndex] : 'kWh';
                    const timestamp = parseTimestamp(timestampInput);
                    const value = parseFloat(String(valueStr ?? '').replace(',', '.'));

                    if (timestamp) {
                        return { id: index + 1, timestamp, value: !isNaN(value) ? value : null, unit: String(unitStr || 'kWh') };
                    }
                    console.warn(`Přeskakuji řádek ${index + 2} v XLSX: neplatný timestamp.`);
                    return null;
                }).filter((item): item is DataRecord => item !== null);
                 console.log("XLSX Parsed Data (first 5):", parsedData.slice(0, 5));
            }
        }
        // --- JSON Parsing ---
        else if (fileNameLower.endsWith('.json')) {
            try {
                const jsonData = JSON.parse(fileContent as string);
                if (!Array.isArray(jsonData)) {
                    throw new Error("JSON soubor neobsahuje pole (array) záznamů.");
                }
                parsedData = jsonData.map((item: any, index: number): DataRecord | null => {
                    const timestampStr = item.timestamp || item.Timestamp || item.cas || item.time; // Common variations
                    const valueInput = item.value ?? item.Value ?? item.hodnota; // Allow null/undefined
                    const unitStr = item.unit || item.Unit || item.jednotka || 'kWh';

                    const timestamp = parseTimestamp(timestampStr);
                    // Handle value - ensure it's parsed as float, allow null
                    let value: number | null = null;
                    if (valueInput !== null && valueInput !== undefined) {
                        const parsedVal = parseFloat(String(valueInput).replace(',', '.'));
                        if (!isNaN(parsedVal)) {
                            value = parsedVal;
                        }
                    }


                    if (timestamp) { // Require valid timestamp
                        return {
                            id: item.id ?? index + 1, // Use provided ID or generate one
                            timestamp: timestamp,
                            value: value, // Keep null if parsing failed or was null/undefined
                            unit: String(unitStr)
                        };
                    } else {
                        console.warn(`Přeskakuji záznam ${index + 1} v JSON: neplatný timestamp.`);
                        return null;
                    }
                }).filter((item): item is DataRecord => item !== null);

            } catch (jsonError: unknown) {
                 const errorMsg = jsonError instanceof Error ? jsonError.message : String(jsonError);
                 console.error("Chyba při parsování JSON:", jsonError);
                 fileParseError = new Error(`Chyba parsování JSON: ${errorMsg}`);
            }
            console.log("JSON Parsed Data (first 5):", parsedData.slice(0, 5));
        }
        // --- XML Parsing ---
        else if (fileNameLower.endsWith('.xml')) {
            console.warn("XML parsing je základní.");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(fileContent as string, "text/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                fileParseError = new Error("Chyba při parsování XML struktury.");
            } else {
                const records = xmlDoc.getElementsByTagName("record"); // Adjust tag name if needed
                if (records.length === 0) {
                    fileParseError = new Error("Nenalezeny <record> elementy v XML.");
                } else {
                    parsedData = Array.from(records).map((record, index): DataRecord | null => {
                        const tsElement = record.querySelector("timestamp, Cas, TimeStamp");
                        const valElement = record.querySelector("value, hodnota, Value");
                        const unitElement = record.querySelector("unit, jednotka, Unit");
                        const timestampStr = tsElement?.textContent;
                        const valueStr = valElement?.textContent;
                        const unitStr = unitElement?.textContent || 'kWh';
                        const timestamp = parseTimestamp(timestampStr);
                        const value = parseFloat(String(valueStr ?? '').replace(',', '.'));

                        if (timestamp) {
                            return { id: index + 1, timestamp, value: !isNaN(value) ? value : null, unit: unitStr };
                        }
                        console.warn(`Přeskakuji záznam ${index + 1} v XML: neplatný timestamp.`);
                        return null;
                    }).filter((item): item is DataRecord => item !== null);
                     console.log("XML Parsed Data (first 5):", parsedData.slice(0, 5));
                }
            }
        } else {
            fileParseError = new Error("Nepodporovaný typ souboru. Použijte CSV, XLSX, XLS, XML nebo JSON.");
        }

        // --- Post-parsing ---
        if (fileParseError) throw fileParseError;
        if (parsedData.length === 0) throw new Error("Nepodařilo se načíst žádná platná data (parsedData je prázdné). Zkontrolujte formát souboru a konzoli pro detaily.");

        console.log(`Setting data with ${parsedData.length} records.`);
        setData(parsedData);
        // Use the validateDataFile function from utils
        try {
            // Convert our data format to validator's format
            const validatorData = parsedData.map(item => ({
                timestamp: item.timestamp,
                value: item.value !== null ? item.value : 0, // Convert null to 0 for validation
                unit: item.unit
            })) as ValidatorDataRecord[];
            
            const validationResult = validateDataFile(validatorData);
            console.log('Výsledek validace z validateDataFile:', validationResult);
            
            // Disable fixMissing if data spans multiple years
            if (validationResult.stats.differentYears && validationResult.stats.differentYears > 1) {
              setFixMissing(false);
            }
            
            // Check interpolation requirements
            const interpolationResult = checkInterpolationRequirements(parsedData);
            setInterpolationCheck(interpolationResult);
            
            setValidationResults(validationResult);
            setActiveTab('validate');
        } catch (e) {
            console.error('Chyba při validaci:', e);
        }

      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Chyba při zpracování souboru:", error);
        setErrorMessage(`Chyba: ${errorMsg}`);
        setData(null);
        setValidationResults(null);
      } finally {
        setIsLoading(false);
        // Check error state again using the variable defined in the outer scope
        if (errorMessage || fileParseError) {
             setActiveTab('upload');
         }
      }
    };

    reader.onerror = (e) => {
      console.error("Chyba při čtení souboru:", e);
      setErrorMessage("Nepodařilo se přečíst soubor.");
      setIsLoading(false);
    };

    if (fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.xml') || fileNameLower.endsWith('.json')) {
      reader.readAsText(file); // Read CSV, XML, JSON as text
    } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
      reader.readAsArrayBuffer(file); // Read XLSX/XLS as ArrayBuffer
    } else {
       setErrorMessage("Nepodporovaný typ souboru.");
       setIsLoading(false);
    }
  };

  // Change active tab
  const goToTab = (tab: string) => {
    if (tab === 'upload' && data) {
      setShowConfirm(true);
      return;
    }
    if (tab !== 'upload' && !fileInfo) return; // Prevent navigation if no file loaded/attempted
    setActiveTab(tab);
  };

  // Reset all data
  const resetData = () => {
    setData(null);
    setFileInfo(null);
    setValidationResults(null);
    setRepairResults(null);
    setErrorMessage('');
    setExportMessage('');
    setDataChanged(false);
    setActiveTab('upload');
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = ''; // Reset file input
  };

  // Handle confirmation dialog
  const handleConfirm = (confirm: boolean) => {
    if (confirm) resetData();
    setShowConfirm(false);
  };

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Validátor iniciálních diagramů</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Nástroj pro analýzu, validaci a opravu dat spotřeby</p>
          {fileInfo && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
              <p className="font-medium">Načtený soubor: <span className="font-semibold">{fileInfo.name}</span></p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Typ: {fileInfo.type} | Velikost: {fileInfo.size} KB | Posl. změna: {fileInfo.lastModified}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={goToTab}
          data={data}
          setShowConfirm={setShowConfirm}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Content Area */}
        <div className="p-4 md:p-6 dark:bg-gray-800">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
             <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">1. Nahrání souboru</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Nahrajte soubor (CSV, XLSX, XLS, XML) obsahující časové značky a hodnoty spotřeby.
              </p>
              {errorMessage && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700 text-sm">
                      <p className="font-semibold">Chyba:</p>
                      <p className="mt-1">{errorMessage}</p>
                  </div>
              )}
              <div className="mb-6">
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isLoading ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <svg className={`w-10 h-10 mb-3 ${isLoading ? 'text-gray-400 dark:text-gray-500' : 'text-indigo-500 dark:text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 font-semibold">Klikněte nebo přetáhněte soubor</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CSV, XLSX, XLS, XML, JSON (max 50MB)</p>
                  </div>
                  <input id="file-upload-input" type="file" className="hidden" accept=".csv,.xlsx,.xls,.xml,.json,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/xml,application/json" onChange={handleFileUpload} disabled={isLoading} />
                </label>
              </div>
              {isLoading && (
                <div className="flex items-center justify-center space-x-2 my-4">
                   <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Zpracovávám soubor...</span>
                </div>
              )}
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validate' && (
             <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">2. Validace dat</h2>
               {!validationResults && !errorMessage && <div className="text-center text-gray-500 dark:text-gray-400 py-10 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">Nejprve nahrajte soubor pro validaci.</div>}
               {errorMessage && !validationResults && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700 text-sm">
                      <p className="font-semibold">Chyba:</p> <p className="mt-1">{errorMessage}</p> <p className="mt-2">Validaci nelze provést.</p>
                  </div>
               )}
              {validationResults && (
                <>
                  <div className={`p-4 rounded-lg mb-6 border text-sm ${validationResults.valid ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-300' : 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300'}`}>
                    <p className={`font-semibold text-lg mb-2 ${validationResults.valid ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>{validationResults.valid ? '✅ Data jsou validní' : '⚠️ Validace s výhradami'}</p>
                    {validationResults.messages.length > 0 && ( <ul className="space-y-1 list-disc list-inside pl-1"> {validationResults.messages.map((msg, i) => (<li key={i}>{msg}</li>))} </ul> )}
                    {!validationResults.valid && (
                        <div className="mt-4 pt-3 border-t border-opacity-60 ${validationResults.valid ? 'border-green-200' : 'border-amber-300'}">
                        <p className="font-medium"> Problémy můžete zkusit opravit v sekci <button onClick={() => setActiveTab('data')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline focus:outline-none">Data</button>. </p>
                        </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Statistiky validace:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                     {/* Stats Cards - Example: Total Records */}
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm"> <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Záznamů v souboru</p> <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-1">{validationResults.stats.totalRecords}</p> </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm"> <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Záznamy s platným časem</p> <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-1">{validationResults.stats.validTimestamps}</p> {validationResults.stats.invalidTimestamps > 0 && <p className="text-xs text-red-600 dark:text-red-400 mt-1">({validationResults.stats.invalidTimestamps} neplatných)</p>} </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm"> <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chybějící záznamy (15min)</p> <p className={`text-2xl font-semibold mt-1 ${validationResults.stats.missingRecords > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>{validationResults.stats.missingRecords}</p> <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Očekáváno v rozsahu: {validationResults.stats.expectedRecords}</p> </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm"> <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Duplicitní čas. značky</p> <p className={`text-2xl font-semibold mt-1 ${validationResults.stats.duplicateValues > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{validationResults.stats.duplicateValues}</p> </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm"> <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Extrémní hodnoty ({'>'}3σ)</p> <p className={`text-2xl font-semibold mt-1 ${validationResults.stats.invalidValues > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{validationResults.stats.invalidValues}</p> </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm"> <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chybějící/Neplatné hodnoty</p> <p className={`text-2xl font-semibold mt-1 ${validationResults.stats.missingValues > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{validationResults.stats.missingValues}</p> </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Data & Repairs Tab */}
          {activeTab === 'data' && (
             <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">3. Data a Opravy</h2>
               {!data && !errorMessage && <div className="text-center text-gray-500 py-10 px-4 border border-dashed rounded-lg">Nejprve nahrajte soubor.</div>}
               {errorMessage && !data && (
                  <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm"> <p className="font-semibold">Chyba:</p> <p className="mt-1">{errorMessage}</p> <p className="mt-2">Nelze zobrazit ani opravit data.</p> </div>
               )}
              {data && (
                <>
                  {/* Repair Section */}
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Automatické opravy</h3>
                    {repairResults && ( <div className={`mb-4 p-3 rounded-lg text-sm ${repairResults.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}> <p className="font-medium">{repairResults.message}</p> </div> )}
                    {errorMessage && !repairResults && ( <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm"> <p className="font-semibold">Chyba při opravě:</p> <p className="mt-1">{errorMessage}</p> </div> )}
                    <p className="text-sm text-gray-600 mb-3"> Vyberte problémy k automatické opravě: </p>
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center"> 
  <input 
    type="checkbox" 
    id="fix-missing" 
    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
    checked={fixMissing} 
    onChange={(e) => {
      if (e.target.checked && interpolationCheck && !interpolationCheck.canInterpolate) {
        // Prevent checking if interpolation requirements are not met
        return;
      }
      setFixMissing(e.target.checked);
    }}
    disabled={isRepairing || Boolean(validationResults?.stats.differentYears && validationResults.stats.differentYears > 1) || Boolean(interpolationCheck && !interpolationCheck.canInterpolate)}
  />
  <label htmlFor="fix-missing" className={`text-sm ${(validationResults?.stats.differentYears && validationResults.stats.differentYears > 1) || (interpolationCheck && !interpolationCheck.canInterpolate) ? 'text-gray-400' : 'text-gray-700'}`}>
    Doplnit chybějící záznamy (interpolací)
    {(validationResults?.stats.differentYears && validationResults.stats.differentYears > 1) ?
      <span className="ml-2 text-amber-600 italic text-xs">Pro data z více let nelze použít</span>
      : interpolationCheck && !interpolationCheck.canInterpolate ?
        <span className="ml-2 text-amber-600 italic text-xs">{interpolationCheck.reason}</span>
        : <div className="ml-2 text-xs text-gray-500 mt-1">
            <div>Požadavky: alespoň 10% pokrytí dat, max. 7 dní mezera, min. 6 měsíců pro roční data</div>
          </div>
    }
  </label>
</div>
                      <div className="flex items-center"> <input type="checkbox" id="fix-duplicate" className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={fixDuplicate} onChange={(e) => setFixDuplicate(e.target.checked)} disabled={isRepairing} /> <label htmlFor="fix-duplicate" className="text-sm text-gray-700">Odstranit duplicitní čas. značky (ponechat první)</label> </div>
                      <div className="flex items-center"> <input type="checkbox" id="fix-extreme" className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={fixExtreme} onChange={(e) => setFixExtreme(e.target.checked)} disabled={isRepairing} /> <label htmlFor="fix-extreme" className="text-sm text-gray-700">Opravit extrémní hodnoty (nahradit průměrem)</label> </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className={`px-5 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`} onClick={applyRepairs} disabled={isRepairing || (!fixMissing && !fixDuplicate && !fixExtreme)}> {isRepairing ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Probíhá oprava...</>) : 'Aplikovat opravy'} </button>
                      <button className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={validateData} disabled={isRepairing}> Validovat data znovu </button>
                    </div>
                  </div>
                  
                  {/* Export Section */}
                  {dataChanged && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">Export upravených dat</h3>
                      
                      {exportMessage && (
                        <div className={`mb-4 p-3 rounded-lg text-sm ${exportMessage.includes('Chyba') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                          {exportMessage}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3">
                        <label className="text-sm text-gray-700 font-medium">Format:</label>
                        <div className="flex rounded-md overflow-hidden border border-gray-300">
                          <button 
                            className={`px-3 py-1 text-sm ${exportFormat === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setExportFormat('csv')}
                          >
                            CSV
                          </button>
                          <button 
                            className={`px-3 py-1 text-sm border-l border-gray-300 ${exportFormat === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setExportFormat('json')}
                          >
                            JSON
                          </button>
                          <button 
                            className={`px-3 py-1 text-sm border-l border-gray-300 ${exportFormat === 'xlsx' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setExportFormat('xlsx')}
                          >
                            XLSX
                          </button>
                        </div>
                        
                        <button
                          className="ml-auto px-4 py-1.5 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={handleExportFromDataTab}
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
                            `Uložit data jako ${exportFormat.toUpperCase()}`
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Filter Section */}
                  <div className="mb-4 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                     <div className="flex items-center"> <label htmlFor="month-filter" className="text-sm font-medium text-gray-600 mr-2">Měsíc:</label> <select id="month-filter" className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}> <option value="all">Všechny</option> {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('cs-CZ', { month: 'long' })}</option>))} </select> </div>
                     <div className="flex items-center"> <label htmlFor="day-filter" className="text-sm font-medium text-gray-600 mr-2">Den:</label> <select id="day-filter" className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={dayFilter} onChange={(e) => { setDayFilter(e.target.value); setCurrentPage(1); }}> <option value="all">Všechny</option> {[...Array(31)].map((_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))} </select> </div>
                     <div className="flex items-center relative ml-auto"> <input type="text" placeholder="Hledat v datu/hodnotě..." className="border border-gray-300 rounded px-2 py-1 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-500" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} /> {searchTerm && ( <button className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} title="Vymazat hledání"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> </button> )} </div>
                     {(monthFilter !== 'all' || dayFilter !== 'all' || searchTerm) && ( <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" onClick={resetFilters}> Zrušit filtry </button> )}
                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mb-4">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                      <thead className="bg-gray-50"> <tr> <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th> <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Časová značka</th> <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hodnota</th> <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jednotka</th> <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Akce</th> </tr> </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getCurrentPageData().length > 0 ? ( 
                          getCurrentPageData().map((row) => ( 
                            <tr key={row.id} className="hover:bg-gray-50 transition-colors"> 
                              {editingRow === row.id ? (
                                <>
                                  <td className="py-2 px-4 text-sm text-gray-700 whitespace-nowrap">{row.id}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700">
                                    <input
                                      type="text"
                                      name="timestamp"
                                      value={editFormData.timestamp}
                                      onChange={handleEditFormChange}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                      form="editRowForm"
                                    />
                                  </td>
                                  <td className="py-2 px-4 text-sm text-gray-700">
                                    <input
                                      type="number"
                                      name="value"
                                      value={editFormData.value}
                                      onChange={handleEditFormChange}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                      step="0.01"
                                      form="editRowForm"
                                    />
                                  </td>
                                  <td className="py-2 px-4 text-sm text-gray-700">
                                    <input
                                      type="text"
                                      name="unit"
                                      value={editFormData.unit}
                                      onChange={handleEditFormChange}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                      form="editRowForm"
                                    />
                                  </td>
                                  <td className="py-2 px-4 text-sm text-gray-700">
                                    <form id="editRowForm" onSubmit={handleEditFormSubmit} className="flex space-x-1">
                                      <button type="submit" className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                                        Uložit
                                      </button>
                                      <button type="button" onClick={handleCancelClick} className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                                        Zrušit
                                      </button>
                                    </form>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 px-4 text-sm text-gray-700 whitespace-nowrap">{row.id}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700 whitespace-nowrap">{formatReadableDate(row.timestamp)}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700 whitespace-nowrap">{row.value === null ? <span className="text-red-500 italic">Chybí</span> : row.value}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700 whitespace-nowrap">{row.unit}</td>
                                  <td className="py-2 px-4 text-sm whitespace-nowrap">
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => handleEditClick(row)} 
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Upravit záznam"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm('Opravdu chcete smazat tento záznam?')) {
                                            handleDeleteClick(row.id);
                                          }
                                        }} 
                                        className="text-red-600 hover:text-red-800"
                                        title="Smazat záznam"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr> 
                          )) 
                        ) : ( 
                          <tr> 
                            <td colSpan={5} className="py-6 px-4 text-center text-gray-500 italic"> 
                              {filteredData.length === 0 && data.length > 0 ? 'Žádná data neodpovídají filtrům.' : 'Žádná data k zobrazení.'} 
                            </td> 
                          </tr> 
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredData.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-gray-600">
                            <div> Zobrazuji {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} z {filteredData.length} záznamů </div>
                            <div className="flex items-center space-x-1"> <button className="px-2.5 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50" onClick={() => changePage(1)} disabled={currentPage === 1} title="První stránka">&laquo;</button> <button className="px-2.5 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} title="Předchozí stránka">&lsaquo;</button> <span className="px-3 py-1">Stránka {currentPage} / {getTotalPages()}</span> <button className="px-2.5 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50" onClick={() => changePage(currentPage + 1)} disabled={currentPage === getTotalPages()} title="Další stránka">&rsaquo;</button> <button className="px-2.5 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50" onClick={() => changePage(getTotalPages())} disabled={currentPage === getTotalPages()} title="Poslední stránka">&raquo;</button> </div>
                            <div className="flex items-center"> <label htmlFor="rows-per-page" className="mr-2">Řádků:</label> <select id="rows-per-page" className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}> <option value={10}>10</option> <option value={25}>25</option> <option value={50}>50</option> <option value={100}>100</option> <option value={500}>500</option> </select> </div>
                        </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Charts Tab */}
          {activeTab === 'charts' && (
             <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">4. Grafy</h2>
              <p className="mb-4 text-sm text-gray-600">Grafické zobrazení naměřených hodnot spotřeby.</p>
              {!data && <div className="text-center text-gray-500 py-10 px-4 border border-dashed rounded-lg">Nejprve nahrajte data.</div>}
              {data && <ChartsPanel data={data} />}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analyze' && (
             <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">5. Analýza dat</h2>
               {!data && <div className="text-center text-gray-500 py-10 px-4 border border-dashed rounded-lg">Nejprve nahrajte data.</div>}
              {data && data.length > 0 && (() => {
                  const validData = data.filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime()) && item.value !== null && !isNaN(item.value));
                  if (validData.length === 0) { return <div className="text-center text-gray-500 py-10 px-4 border border-dashed rounded-lg">Nelze provést analýzu - žádná platná data.</div>; }
                  const values = validData.map(item => item.value as number);
                  const timestamps = validData.map(item => new Date(item.timestamp).getTime());
                  const sum = values.reduce((s, v) => s + v, 0);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const mean = sum / values.length;
                  const sortedValues = [...values].sort((a, b) => a - b);
                  const median = values.length % 2 === 0 ? (sortedValues[values.length / 2 - 1] + sortedValues[values.length / 2]) / 2 : sortedValues[Math.floor(values.length / 2)];
                  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
                  const stdDev = Math.sqrt(variance);
                  const firstTimestamp = new Date(Math.min(...timestamps));
                  const lastTimestamp = new Date(Math.max(...timestamps));
                  const unit = validData[0]?.unit || '';
                  return (
                    <>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Základní statistiky:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                             <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"> <p className="text-sm font-medium text-gray-600">Celkový objem</p> <p className="text-2xl font-semibold text-gray-800 mt-1">{sum.toFixed(2)} {unit}</p> </div>
                             <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"> <p className="text-sm font-medium text-gray-600">Minimální hodnota</p> <p className="text-2xl font-semibold text-gray-800 mt-1">{min.toFixed(2)} {unit}</p> </div>
                             <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"> <p className="text-sm font-medium text-gray-600">Maximální hodnota</p> <p className="text-2xl font-semibold text-gray-800 mt-1">{max.toFixed(2)} {unit}</p> </div>
                             <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"> <p className="text-sm font-medium text-gray-600">Průměrná hodnota</p> <p className="text-2xl font-semibold text-gray-800 mt-1">{mean.toFixed(2)} {unit}</p> </div>
                             <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"> <p className="text-sm font-medium text-gray-600">Medián hodnot</p> <p className="text-2xl font-semibold text-gray-800 mt-1">{median.toFixed(2)} {unit}</p> </div>
                             <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"> <p className="text-sm font-medium text-gray-600">Směrodatná odchylka</p> <p className="text-2xl font-semibold text-gray-800 mt-1">{stdDev.toFixed(2)} {unit}</p> </div>
                        </div>
                         <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <h3 className="font-medium text-lg mb-2 text-gray-700">Časové rozmezí dat</h3>
                            <p className="text-sm text-gray-600"> Analyzovaná data pokrývají období od <span className="font-semibold">{formatReadableDate(firstTimestamp.toISOString())}</span> do <span className="font-semibold">{formatReadableDate(lastTimestamp.toISOString())}</span>. </p>
                             <p className="text-sm text-gray-600 mt-1">Počet platných záznamů pro analýzu: {validData.length}</p>
                        </div>
                    </>
                  );
              })()}
               {data && data.length === 0 && <div className="text-center text-gray-500 py-10 px-4 border border-dashed rounded-lg">Data jsou prázdná.</div>}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
             <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">6. Export dat</h2>
               {!data && <div className="text-center text-gray-500 py-10 px-4 border border-dashed rounded-lg">Nejprve nahrajte a případně opravte data.</div>}
              {data && <ExportPanel data={data} />}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Potvrzení akce</h3>
            <p className="mb-6 text-gray-700">Opravdu chcete načíst nový soubor? Všechna aktuální data, výsledky validace a oprav budou ztraceny.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => handleConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"> Zrušit </button>
              <button onClick={() => handleConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"> Ano, načíst nový </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
