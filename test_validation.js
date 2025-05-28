const fs = require('fs');
const { validateData } = require('./src/utils/validateDataFile.ts');

// Test validation with invalid data
const invalidCsvData = fs.readFileSync('./generated_test_data/invalid_data.csv', 'utf8');
const parsedData = [];

// Mock parse result to test validation
const validationResult = validateData(parsedData);

console.log('Validation Result:', validationResult);