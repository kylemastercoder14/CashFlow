const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..', '.prisma', 'client');
const defaultJsPath = path.join(clientDir, 'default.js');
const defaultDtsPath = path.join(clientDir, 'default.d.ts');

// Create default.js that exports from client
const defaultJsContent = `module.exports = require('./client');\n`;

// Create default.d.ts that exports from client
const defaultDtsContent = `export * from './client';\n`;

try {
  // Ensure directory exists
  if (!fs.existsSync(clientDir)) {
    console.log('Prisma client directory does not exist yet. Run prisma generate first.');
    process.exit(0);
  }

  // Write default.js
  fs.writeFileSync(defaultJsPath, defaultJsContent);
  console.log('Created .prisma/client/default.js');

  // Write default.d.ts
  fs.writeFileSync(defaultDtsPath, defaultDtsContent);
  console.log('Created .prisma/client/default.d.ts');
} catch (error) {
  console.error('Error creating default files:', error);
  process.exit(1);
}

