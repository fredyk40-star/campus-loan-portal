// scripts/verify-modules.js - Verify all modules can be loaded at runtime
const path = require('path');
process.env.JWT_SECRET = 'test-secret-for-verification-only';
process.env.ALLOWED_ORIGIN = 'https://example.com';

const root = path.join(__dirname, '..');
const modules = [
  'lib/db.js',
  'lib/auth.js',
  'lib/security.js',
  'lib/repayments.js',
  'lib/notifications.js',
  'api/index.js',
  'api/calculator.js',
  'api/dashboard.js',
  'api/applications.js',
  'api/upload.js',
  'api/auth/login.js',
  'api/auth/register.js',
  'api/auth/logout.js',
  'api/auth/me.js',
  'api/auth/login-page.js',
  'api/auth/register-page.js',
  'api/admin/index.js',
  'api/admin/applications.js',
  'api/repayments/index.js',
  'api/repayments/page.js',
  'api/notifications/index.js',
  'api/notifications/mark-read.js',
  'api/notifications/page.js',
];

let pass = 0;
let fail = 0;

for (const mod of modules) {
  try {
    require(path.join(root, mod));
    pass++;
    console.log(`✓ ${mod}`);
  } catch (error) {
    fail++;
    console.log(`✗ ${mod}: ${error.message.split('\n')[0]}`);
  }
}

console.log(`\n${pass}/${modules.length} modules load successfully.`);
if (fail > 0) {
  process.exit(1);
}