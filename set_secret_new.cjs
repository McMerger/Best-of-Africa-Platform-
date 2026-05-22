const { execSync } = require('child_process');

console.log('Setting new GOOGLE_CLIENT_SECRET...');
execSync('npx wrangler secret put GOOGLE_CLIENT_SECRET --env=""', { input: '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', stdio: ['pipe', 'inherit', 'inherit'] });
console.log('Done!');
