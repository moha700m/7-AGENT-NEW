
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'index.html',
  'login.html',
  'register.html',
  'dashboard.html',
  'support/dashboard.html',
  'js/supabase-config.js',
  'js/dashboard.js',
  'js/support-dashboard.js',
  'api/config.js',
  'vercel.json'
];

console.log('--- Starting Final Production Check ---');

let allPassed = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ File exists: ${file}`);
    
    // Check for hardcoded keys in JS files
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('pfrugircpdwrxmfikfhv') && !file.includes('config.js')) {
        console.error(`❌ Potential hardcoded URL in: ${file}`);
        allPassed = false;
      }
      if (content.includes('console.log') && !file.includes('test')) {
        console.warn(`⚠️ console.log found in: ${file} (Non-critical but recommended to remove)`);
      }
    }
  } else {
    console.error(`❌ Missing required file: ${file}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n--- Final Production Check PASSED ✅ ---');
} else {
  console.log('\n--- Final Production Check FAILED ❌ ---');
  process.exit(1);
}
