const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

module.exports = async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  const repoRoot = path.resolve(__dirname, '../../..');
  const platformDir = path.join(repoRoot, 'core/packages/typescript');
  const helloWorldDir = path.join(repoRoot, 'studio/modules/hello-world');

  if (!fs.existsSync(helloWorldDir)) {
    return;
  }

  execSync('npm run build', { cwd: platformDir, stdio: 'inherit' });
  execSync('npm install && npm run build', { cwd: helloWorldDir, stdio: 'inherit' });
};
