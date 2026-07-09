const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

module.exports = async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  const repoRoot = path.resolve(__dirname, '../../..');
  const platformDir = path.join(repoRoot, 'core/packages/typescript');
  const moduleDirs = [
    path.join(repoRoot, 'studio/modules/hello-world'),
    path.join(repoRoot, 'studio/modules/inventory'),
    path.join(repoRoot, 'studio/modules/projects'),
    path.join(repoRoot, 'developer'),
  ];

  execSync('npm run build', { cwd: platformDir, stdio: 'inherit' });
  for (const moduleDir of moduleDirs) {
    if (!fs.existsSync(moduleDir)) {
      continue;
    }
    execSync('npm install && npm run build', { cwd: moduleDir, stdio: 'inherit' });
  }
};
