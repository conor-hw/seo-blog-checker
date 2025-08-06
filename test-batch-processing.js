require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs').promises;

async function testBatchProcessing() {
  try {
    console.log('🔄 Testing Batch Processing...\n');

    // Create a test file with slugs
    const testSlugs = [
      'best-traditional-canadian-food',
      'how-to-backpack-europe',
      'budget-travel-tips'
    ];
    
    const testFile = 'test-slugs.txt';
    await fs.writeFile(testFile, testSlugs.join('\n'), 'utf8');
    
    console.log('📝 Created test file with slugs:', testSlugs);
    
    // Test single post
    console.log('\n1. Testing single post evaluation...');
    await runCommand('node src/index.js evaluate --slug best-traditional-canadian-food --evaluation-config hostelworld');
    
    // Test multiple posts from file
    console.log('\n2. Testing batch processing from file...');
    await runCommand(`node src/index.js evaluate --file ${testFile} --evaluation-config hostelworld --batch-size 2`);
    
    // Clean up
    await fs.unlink(testFile);
    console.log('\n✅ Batch processing test completed!');
    
  } catch (error) {
    console.error('❌ Batch processing test failed:', error.message);
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    
    const child = exec(command, { cwd: process.cwd() });
    
    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Run the test
testBatchProcessing();