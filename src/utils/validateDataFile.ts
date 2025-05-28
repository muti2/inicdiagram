import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ValidationResult {
  valid: boolean;
  messages: string[];
  stats: {
    totalRecords: number;
    expectedRecords: number;
    missingRecords: number;
    structuralErrors?: number;
    invalidValues: number;
    extremeValues?: number;
    invalidTimestamps: number;
    invalidUnits: number;
    duplicateTimestamps: number;
    duplicateValues: number;
    validTimestamps: number;
    missingValues: number;
    differentYears?: number;
    years?: number[];
  };
}

export interface DataRecord {
  timestamp: string;
  value: number;
  unit: string;
}

const EXPECTED_RECORDS = 4 * 24 * 365; // 35 040

function parseCSV(content: string): DataRecord[] {
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  // Check for parsing errors
  if (result.errors && result.errors.length > 0) {
    console.log('CSV parsing errors:', result.errors);
  }
  
  return result.data as DataRecord[];
}

function parseXLSX(arrayBuffer: ArrayBuffer): DataRecord[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet) as DataRecord[];
}

function parseJSON(content: string): DataRecord[] {
  return JSON.parse(content) as DataRecord[];
}

function parseXML(content: string): DataRecord[] {
  // Jednoduchý parser pro velmi základní XML strukturu
  // Očekává <records><record><timestamp>...</timestamp><value>...</value><unit>...</unit></record>...</records>
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'application/xml');
  const records: DataRecord[] = [];
  const recordNodes = xmlDoc.getElementsByTagName('record');
  for (let i = 0; i < recordNodes.length; i++) {
    const rec = recordNodes[i];
    records.push({
      timestamp: rec.getElementsByTagName('timestamp')[0]?.textContent || '',
      value: Number(rec.getElementsByTagName('value')[0]?.textContent),
      unit: rec.getElementsByTagName('unit')[0]?.textContent || ''
    });
  }
  return records;
}

export async function parseFile(file: File): Promise<DataRecord[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      try {
        let data: DataRecord[] = [];
        if (ext === 'csv') {
          data = parseCSV(reader.result as string);
          // Check if the parsed data has required structure
          if (data.length > 0) {
            const firstRecord = data[0];
            if (!('timestamp' in firstRecord) || !('value' in firstRecord) || !('unit' in firstRecord)) {
              console.log('CSV structural error: Missing required fields in data');
            }
          }
        } else if (ext === 'xlsx' || ext === 'xls') {
          data = parseXLSX(reader.result as ArrayBuffer);
        } else if (ext === 'json') {
          data = parseJSON(reader.result as string);
        } else if (ext === 'xml') {
          data = parseXML(reader.result as string);
        } else {
          reject(new Error('Nepodporovaný formát souboru.'));
          return;
        }
        resolve(data);
      } catch (e) {
        console.error('Chyba při parsování souboru:', e);
        // Return empty data array for validation to show detailed errors
        resolve([]);
      }
    };
    if (ext === 'csv' || ext === 'json' || ext === 'xml') {
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Nepodporovaný formát souboru.'));
    }
  });
}

export function validateData(records: DataRecord[]): ValidationResult {
  const messages: string[] = [];
  const seenTimestamps = new Set<string>();
  let invalidValues = 0;  // For missing/nan values
  let extremeValues = 0;  // For statistical outliers
  let invalidTimestamps = 0;
  let invalidUnits = 0;
  let duplicateTimestamps = 0;
  let validTimestamps = 0;
  let missingValues = 0;
  let structuralErrors = 0;
  let differentYears = 0;
  
  // To track years of timestamps
  const years = new Set<number>();

  // Check if records array is valid
  if (!Array.isArray(records)) {
    messages.push('Strukturální chyba: Načtená data nejsou pole.');
    structuralErrors++;
    // Return early with basic error information
    return {
      valid: false,
      messages,
      stats: {
        totalRecords: 0,
        expectedRecords: EXPECTED_RECORDS,
        missingRecords: EXPECTED_RECORDS,
        invalidValues: 0,
        invalidTimestamps: 0,
        invalidUnits: 0,
        duplicateTimestamps: 0,
        duplicateValues: 0,
        validTimestamps: 0,
        missingValues: 0
      }
    };
  }

  if (records.length === 0) {
    messages.push('Strukturální chyba: Soubor neobsahuje žádná data.');
    structuralErrors++;
  }

  for (const rec of records) {
    // Kontrola existence očekávaných polí
    if (!rec || typeof rec !== 'object') {
      structuralErrors++;
      continue;
    }

    // Kontrola timestamp
    if (!rec.timestamp || isNaN(Date.parse(rec.timestamp))) {
      invalidTimestamps++;
    } else {
      validTimestamps++;
      
      // Extract and track the year
      const date = new Date(rec.timestamp);
      const year = date.getFullYear();
      years.add(year);
    }
    // Kontrola value
    if (typeof rec.value !== 'number' || isNaN(rec.value)) {
      invalidValues++;
      missingValues++;
    }
    // Kontrola unit
    if (!rec.unit || typeof rec.unit !== 'string') {
      invalidUnits++;
    }
    // Kontrola duplicit
    if (seenTimestamps.has(rec.timestamp)) {
      duplicateTimestamps++;
    } else {
      seenTimestamps.add(rec.timestamp);
    }
  }

  const missingRecords = EXPECTED_RECORDS - records.length;

  // Only add the detailed message about record counts
  if (records.length !== EXPECTED_RECORDS) {
    messages.push(`Počet záznamů je ${records.length}, očekáváno ${EXPECTED_RECORDS}. Chybí: ${missingRecords}`);
  } else {
    messages.push(`Počet záznamů odpovídá očekávání: ${records.length}`);
  }
  if (structuralErrors > 0) {
    messages.push(`Strukturálních chyb: ${structuralErrors}`);
  }
  if (invalidTimestamps > 0) {
    messages.push(`Neplatných timestamp: ${invalidTimestamps}`);
  }
  if (invalidValues > 0) {
    messages.push(`Neplatných hodnot: ${invalidValues}`);
  }
  if (invalidUnits > 0) {
    messages.push(`Neplatných jednotek: ${invalidUnits}`);
  }
  if (duplicateTimestamps > 0) {
    messages.push(`Duplicitních timestamp: ${duplicateTimestamps}`);
  }
  
  // Check if data spans multiple years
  differentYears = years.size > 1 ? years.size : 0;
  if (differentYears > 0) {
    const yearsArray = Array.from(years).sort();
    messages.push(`Data obsahují záznamy z více let: ${yearsArray.join(', ')}`);
  }

  // Check for extreme values (statistical outliers)
  const validValues = records
    .filter(rec => typeof rec.value === 'number' && !isNaN(rec.value))
    .map(rec => rec.value);
    
  if (validValues.length >= 4) { // Need enough data for meaningful statistics
    const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    const squaredDiffs = validValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / validValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Values beyond 3 standard deviations are considered extreme
    const threshold = 3 * stdDev;
    extremeValues = validValues.filter(val => Math.abs(val - mean) > threshold).length;
    
    if (extremeValues > 0) {
      messages.push(`Extrémních hodnot (odlehlost >3σ): ${extremeValues}`);
    }
  }
  
  const valid =
    records.length > 0 &&
    structuralErrors === 0 &&
    records.length === EXPECTED_RECORDS &&
    invalidTimestamps === 0 &&
    invalidValues === 0 &&
    invalidUnits === 0 &&
    duplicateTimestamps === 0 &&
    extremeValues === 0 &&
    years.size <= 1; // Data should be from a single year

  console.log('VALIDACE:', {
    total: records.length,
    valid,
    structuralErrors,
    invalidTimestamps,
    invalidValues,
    extremeValues,
    invalidUnits,
    duplicateTimestamps,
    years: years.size > 0 ? Array.from(years).sort() : [],
    differentYears: years.size > 1 ? years.size : 0
  });

  return {
    valid,
    messages: messages.length ? messages : ['Soubor je validní.'],
    stats: {
      totalRecords: records.length,
      expectedRecords: EXPECTED_RECORDS,
      missingRecords: missingRecords,
      structuralErrors,
      invalidValues,
      extremeValues,
      invalidTimestamps,
      invalidUnits,
      duplicateTimestamps,
      duplicateValues: duplicateTimestamps, // alias pro UI
      validTimestamps,
      missingValues,
      differentYears: years.size > 1 ? years.size : 0,
      years: years.size > 0 ? Array.from(years).sort() : []
    }
  };
}
