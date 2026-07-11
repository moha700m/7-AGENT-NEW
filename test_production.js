const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'index.html',
  'login.html',
  'register.html',
  'forgot-password.html',
  'reset-password.html',
  'dashboard.html',
  'js/supabase-config.js',
  'js/main.js',
  'css/style.css'
];

console.log('Verifying Production Files...');
let allPassed = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} MISSING`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('--- All production files verified ---');
} else {
  console.error('--- Production verification FAILED ---');
  process.exit(1);
}
