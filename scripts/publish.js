#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 递增版本号
function bumpVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  const [major, minor, patch] = parts;
  
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    default: return `${major}.${minor}.${patch + 1}`;
  }
}

// 更新 package.json 版本号
function updateVersion(newVersion) {
  const packagePath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
}

// 回滚版本更改
function revertVersion(oldVersion, newVersion) {
  log(`\n操作已取消或失败，正在回滚版本 ${newVersion} -> ${oldVersion}`, 'yellow');
  updateVersion(oldVersion);
  try {
    execSync('git add package.json', { stdio: 'pipe' });
    execSync(`git commit -m "chore: revert version bump to ${newVersion}"`, { stdio: 'pipe' });
    log('版本回滚提交完成。', 'green');
  } catch (e) {
    log('回滚提交失败，请手动检查 `package.json` 和 git 状态。', 'red');
  }
}

// --- 主流程 ---
try {
  // 1. 获取当前版本和新版本
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  const versionType = process.argv[2] || 'patch';

  if (!['patch', 'minor', 'major'].includes(versionType)) {
    log('错误: 版本类型必须是 patch、minor 或 major', 'red');
    process.exit(1);
  }

  const newVersion = bumpVersion(currentVersion, versionType);

  // 2. 更新版本并自动提交
  log(`当前版本: ${currentVersion}`, 'blue');
  updateVersion(newVersion);
  log(`版本已更新: ${newVersion}`, 'green');

  log('自动提交版本更新...', 'blue');
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "release: v${newVersion}"`, { stdio: 'inherit' });
  log('版本更新提交完成。', 'green');

  // 3. 构建项目
  log('构建项目...', 'blue');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. 确认发布
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`确认将版本 v${newVersion} 发布到 npm? (y/N): `, (answer) => {
    rl.close();
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      revertVersion(currentVersion, newVersion);
      process.exit(0);
    }

    try {
      // 5. 发布到 npm
      log('发布中...', 'blue');
      execSync('npm publish --access public', { stdio: 'inherit' });
      log(`✅ v${newVersion} 发布成功!`, 'green');

      // 6. 推送 Git Tag
      log('创建并推送 Git Tag...', 'blue');
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
      execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
      log(`Git tag v${newVersion} 推送成功!`, 'green');

      log(`\n访问你的包: https://www.npmjs.com/package/${packageJson.name}`, 'green');

    } catch (publishError) {
      log('\n发布失败!', 'red');
      log(publishError.message, 'red');
      revertVersion(currentVersion, newVersion);
      process.exit(1);
    }
  });

} catch (e) {
  log('\n自动化脚本发生未知错误!', 'red');
  log(e.message, 'red');
  process.exit(1);
} 