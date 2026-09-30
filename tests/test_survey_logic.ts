import fs from 'fs';
import { parseDesignCsv, validateDesign, BWS_SETS, checkBibd, BARRIERS, SCREENING, QUOTAS, makeDemoDesign, selfTest } from '../src/lib/surveyLogic.js';

console.log('Testing surveyLogic selfTest...');
selfTest();

console.log('\nTesting data/dce_design_blocks.csv validation...');
const csv = fs.readFileSync('data/dce_design_blocks.csv', 'utf-8');
const design = parseDesignCsv(csv);
console.log('Parsed rows:', design.length);
const errors = validateDesign(design, ['station', 'buyback'], [0, 100, 200]);
console.log('Design validation error count:', errors.length);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
  process.exit(1);
} else {
  console.log('data/dce_design_blocks.csv is 100% valid with 0 errors!');
}
