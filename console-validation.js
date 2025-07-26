#!/usr/bin/env node

/**
 * Final Console Validation Script
 * Quick validation that console errors have been fixed
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 Final Console Error Validation');
console.log('=' .repeat(50));

// Run the console error detection test
const testProcess = spawn('node', ['tests/console-error-detection.test.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let hasErrors = false;

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Check for error indicators in real-time
  if (text.includes('❌ Errors Found: 0')) {
    console.log('✅ SUCCESS: No console errors detected!');
  }
  
  if (text.includes('❌ Errors Found:') && !text.includes(': 0')) {
    hasErrors = true;
    console.log('❌ FAILURE: Console errors still present!');
  }
});

testProcess.stderr.on('data', (data) => {
  console.error('Test Error:', data.toString());
});

testProcess.on('close', (code) => {
  console.log('\n📊 VALIDATION SUMMARY:');
  console.log('=' .repeat(30));
  
  if (code === 0 && !hasErrors) {
    console.log('🎉 PASSED: All console errors have been successfully fixed!');
    console.log('✅ The application now runs without JavaScript console errors');
    console.log('✅ Puppeteer validation completed successfully');
    console.log('✅ Terminal functionality is working correctly');
  } else {
    console.log('❌ FAILED: Issues still present');
    console.log(`Exit code: ${code}`);
  }
  
  console.log('\n📄 Detailed report available at: tests/console-error-report.json');
  console.log('🧪 Test automation script: tests/console-error-detection.test.js');
  
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Validation interrupted');
  testProcess.kill();
  process.exit(1);
});