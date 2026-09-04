// scripts/generate-admin.js - Generate admin password hash
const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';
const saltRounds = 12;

const hash = bcrypt.hashSync(password, saltRounds);
console.log(`\nPassword: ${password}`);
console.log(`Hash: ${hash}\n`);
console.log('Add this to your migration.sql:');
console.log(`INSERT INTO users (email, password_hash, role, student_id) VALUES ('admin@campusloan.com', '${hash}', 'admin', NULL);`);
console.log('\nOr set this as an environment variable and run the API setup endpoint.');