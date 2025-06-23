import assert from 'assert';
import { validateImportedData } from '../utils/validateImportedData.js';

// valid settings
const valid = [
  { statusName: 'open', backgroundColor: '#ffffff' },
  { statusName: 'done', backgroundColor: '#000000', textColor: '#ffffff' }
];
assert.strictEqual(validateImportedData(valid), true);

// invalid: missing statusName
const invalid1 = [ { backgroundColor: '#fff' } ];
assert.strictEqual(validateImportedData(invalid1), false);

// invalid color
const invalid2 = [ { statusName: 'a', backgroundColor: 'red' } ];
assert.strictEqual(validateImportedData(invalid2), false);

console.log('All tests passed');
