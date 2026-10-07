// "Build" step: syntax-check every source file and make sure all modules load.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = ['src', 'scripts', 'test'].flatMap((dir) =>
  fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.js')).map((f) => path.join(root, dir, f)));

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
require('../src/app');
require('../src/client');
console.log(`build ok: ${files.length} files checked`);
