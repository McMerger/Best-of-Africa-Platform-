const { execSync } = require('child_process');

console.log('Setting GOOGLE_CLIENT_ID...');
execSync('npx wrangler secret put GOOGLE_CLIENT_ID --env=""', { input: '137257196275-6vqe4utn4f2g8h2ca6b81iqaa3iajo7v.apps.googleusercontent.com', stdio: ['pipe', 'inherit', 'inherit'] });

console.log('Setting GOOGLE_CLIENT_SECRET...');
execSync('npx wrangler secret put GOOGLE_CLIENT_SECRET --env=""', { input: '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', stdio: ['pipe', 'inherit', 'inherit'] });

console.log('Done!');
