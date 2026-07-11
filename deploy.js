import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Remove invalid GITHUB_TOKEN environment variable to force gh CLI to use keyring
delete process.env.GITHUB_TOKEN;

const BUILD_FILE_PATH = 'dist/index.js';

try {
  // 1. Build project
  console.log('📦 Đang đóng gói ứng dụng (npm run build)...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Check if git is initialized
  if (!fs.existsSync('.git')) {
    console.log('🗂️ Đang khởi tạo Git cục bộ...');
    execSync('git init');
    execSync('git add .');
    execSync('git commit -m "Initial commit"');
    
    console.log('☁️ Đang tạo repository trên GitHub bằng GitHub CLI...');
    // This will create the repo, set remote origin, and push
    execSync('gh repo create Gflow-tools --public --source=. --remote=origin --push', { stdio: 'inherit' });
  } else {
    console.log('🔄 Đang đẩy code lên GitHub...');
    execSync('git add .');
    const commitMsg = `Build update: ${new Date().toLocaleString()}`;
    execSync(`git commit -m "${commitMsg}"`);
    // Attempt to push to main, fallback to master
    try {
      execSync('git push origin main', { stdio: 'inherit' });
    } catch (e) {
      console.log('⚠️ Đẩy lên main thất bại, đang thử đẩy lên master...');
      execSync('git push origin master', { stdio: 'inherit' });
    }
  }

  // 3. Get remote URL and commit hash to build CDN URL
  const remoteUrl = execSync('git remote get-url origin').toString().trim();
  const commitHash = execSync('git rev-parse HEAD').toString().trim();

  // Parse GitHub owner and repo from remote URL
  // Matches: https://github.com/owner/repo.git or git@github.com:owner/repo.git
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^.]+)/);
  if (!match) {
    throw new Error(`Không thể phân tích URL github remote: ${remoteUrl}`);
  }

  const githubUser = match[1];
  const githubRepo = match[2];

  const cdnUrl = `https://cdn.jsdelivr.net/gh/${githubUser}/${githubRepo}@${commitHash}/${BUILD_FILE_PATH}`;

  console.log('\n🚀 DEPLOY THÀNH CÔNG!');
  console.log('👉 Hãy sao chép liên kết CDN bên dưới dán vào Google Flow để kiểm tra:');
  console.log('\x1b[36m%s\x1b[0m', cdnUrl);
} catch (error) {
  console.error('\n❌ Có lỗi xảy ra trong quá trình deploy:', error.message);
  process.exit(1);
}
