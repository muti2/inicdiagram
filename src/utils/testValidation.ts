import { validateData } from './validateDataFile';
// Importujeme přímo jednotlivé parse funkce
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

function parseCSV(content: string) {
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return result.data;
}
function parseXLSX(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}
function parseJSON(content: string) {
  return JSON.parse(content);
}
function parseXML(content: string) {
  const { DOMParser } = require('xmldom');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'application/xml');
  const records = [];
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

const testFiles = [
  'C:/Users/MartinHolaň/enefohet/vite-project/test_data/test_csv.csv',
  'C:/Users/MartinHolaň/enefohet/vite-project/test_data/text_excel.xlsx',
  'C:/Users/MartinHolaň/enefohet/vite-project/test_data/test.xml',
  'C:/Users/MartinHolaň/enefohet/vite-project/test_data/test.json',
];

async function testValidation() {
  for (const filePath of testFiles) {
    try {
      // V Node.js by zde byl fs.readFile, ve webu musíme použít File API.
      // Pro účely testu předpokládáme, že test spouštíme v Node prostředí nebo z konzole, kde lze použít fs.
      const fs = require('fs');
      const path = require('path');
      const ext = path.extname(filePath).toLowerCase();
      let fileContent: any;
      let records: any[] = [];
      if (ext === '.csv') {
        fileContent = fs.readFileSync(filePath, 'utf8');
        records = parseCSV(fileContent);
      } else if (ext === '.json') {
        fileContent = fs.readFileSync(filePath, 'utf8');
        records = parseJSON(fileContent);
      } else if (ext === '.xml') {
        fileContent = fs.readFileSync(filePath, 'utf8');
        records = parseXML(fileContent);
      } else if (ext === '.xlsx' || ext === '.xls') {
        fileContent = fs.readFileSync(filePath);
        records = parseXLSX(fileContent);
      } else {
        console.log(`Nepodporovaný typ souboru: ${filePath}`);
        continue;
      }
      const result = validateData(records);
      console.log(`Soubor: ${filePath}`);
      console.log(result);
    } catch (e) {
      console.error(`Chyba při validaci souboru ${filePath}:`, e);
    }
  }
}

testValidation();
