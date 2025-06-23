#!/usr/bin/env node

/**
 * SSO Client SDK 自动化发布脚本
 * 使用方法: node scripts/publish.cjs [选项]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${colors.bright}${colors.blue}=== ${step} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', encoding: 'utf8', ...options });
  } catch (error) {
    logError(`命令执行失败: ${command}`);
    throw error;
  }
}

function execCommandSilent(command, options = {}) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
  } catch (error) {
    return null;
  }
}

function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function writePackageJson(data) {
  const packagePath = path.join(process.cwd(), 'package.json');
  fs.writeFileSync(packagePath, JSON.stringify(data, null, 2) + '\n');
}

function getCurrentVersion() {
  return readPackageJson().version;
}

function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    default: return `${major}.${minor}.${patch + 1}`;
  }
}

async function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

function checkDependencies() {
    logStep('检查依赖');
    const nodeVersion = process.version;
    logInfo(`Node.js版本: ${nodeVersion}`);
    try {
        const npmVersion = execCommandSilent('npm --version');
        if (npmVersion) logInfo(`npm版本: ${npmVersion.trim()}`);
    } catch (error) {
        logWarning('无法获取npm版本');
    }
    try {
        const gitVersion = execCommandSilent('git --version');
        if (gitVersion) logInfo(`Git版本: ${gitVersion.trim()}`);
    } catch (error) {
        logError('Git未安装');
        throw new Error('Git未安装');
    }
    logSuccess('依赖检查通过');
}

async function checkGitStatus(options) {
    if (options.skipGitCheck) {
        logInfo('根据--skip-git-check选项，跳过Git状态检查。');
        return;
    }
    logStep('检查Git状态');
    const status = execCommandSilent('git status --porcelain');
    if (!status) {
        logSuccess('Git工作目录是干净的。');
        return;
    }

    const allowedChanges = ['package.json', 'pnpm-lock.yaml', 'RELEASE_NOTES.md'];
    const significantChanges = status.trim().split('\n').filter(line => {
        const fileName = line.substring(3);
        return !allowedChanges.some(f => fileName.includes(f));
    });

    if (significantChanges.length > 0) {
        logWarning('发现重要的未提交更改:');
        console.log(significantChanges.join('\n'));
        if (options.nonInteractive) {
            logError('非交互模式下检测到重要更改，发布已取消。');
            process.exit(1);
        }
        const answer = await askQuestion('是否要继续发布并包含这些更改? (y/N): ');
        if (answer.toLowerCase() !== 'y') {
            logError('发布已取消');
            process.exit(1);
        }
    } else {
        logInfo('发现的未提交更改将被自动包含在发布提交中。');
        console.log(status.trim());
    }
}

function runTests() {
  logStep('运行测试');
  try {
    const pkg = readPackageJson();
    if (pkg.scripts && pkg.scripts.test) {
      execCommand('npm test');
      logSuccess('测试通过');
    } else {
      logInfo('没有找到测试脚本，跳过');
    }
  } catch (error) {
    logError('测试失败');
    throw error;
  }
}

function buildProject() {
  logStep('构建项目');
  execCommand('npm run build');
  logSuccess('构建成功');
}

function checkBuildOutput() {
  logStep('检查构建输出');
  try {
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) throw new Error('构建输出目录不存在');
    if (fs.readdirSync(distPath).length === 0) throw new Error('构建输出为空');
    logSuccess('构建输出检查通过');
  } catch (error) {
    logError('构建输出检查失败');
    throw error;
  }
}

function updateVersion(versionType) {
  logStep('更新版本号');
  const pkg = readPackageJson();
  const currentVersion = pkg.version;
  const newVersion = incrementVersion(currentVersion, versionType);
  pkg.version = newVersion;
  writePackageJson(pkg);
  logSuccess(`版本号已更新: ${currentVersion} → ${newVersion}`);
  return newVersion;
}

function generateReleaseNotes(version) {
  logStep('生成发布说明');
  try {
    const lastTag = execCommandSilent('git describe --tags --abbrev=0');
    const commits = execCommandSilent(`git log --oneline ${lastTag ? lastTag.trim() : ''}..HEAD`);
    if (commits && commits.trim()) {
      const releaseNotes = `# 版本 ${version} 发布说明\n\n## 更新内容\n${commits.split('\n').filter(Boolean).map(c => `- ${c}`).join('\n')}`;
      fs.writeFileSync('RELEASE_NOTES.md', releaseNotes);
      logSuccess('发布说明已生成');
    } else {
      logInfo('没有新的提交，跳过发布说明生成');
    }
  } catch (error) {
    logWarning('生成发布说明失败，跳过');
  }
}

function createCommitAndTag(version) {
  logStep('创建Git提交和标签');
  const status = execCommandSilent('git status --porcelain');
  if (status) {
    execCommand('git add .');
    execCommand(`git commit -m "chore: release v${version}"`);
  } else {
    logInfo('没有需要提交的更改。');
  }
  execCommand(`git tag -f v${version}`);
  logSuccess(`已创建或更新标签 v${version}`);
}

function publishToNpm(options) {
  logStep('发布到npm');
  try {
    execCommandSilent('npm whoami');
  } catch (error) {
    logError('未登录npm，请先运行 npm login');
    process.exit(1);
  }
  const publishCommand = options.dryRun ? 'npm publish --dry-run' : 'npm publish --ignore-scripts';
  execCommand(publishCommand);
  logSuccess('发布到npm成功');
}

function pushToGit(options) {
  logStep('推送到Git');
  if (options.dryRun) {
    logInfo('试运行模式：跳过Git推送');
    return;
  }
  try {
    execCommand('git push origin HEAD --follow-tags');
    logSuccess('推送到Git成功');
  } catch (error) {
    logError('推送到Git失败');
    throw error;
  }
}

async function rollback(version, options) {
  logStep('执行回滚');
  let shouldRollback = options.nonInteractive;
  if (!shouldRollback) {
    const answer = await askQuestion('是否回滚？(y/N): ');
    shouldRollback = answer.toLowerCase() === 'y';
  }
  if (shouldRollback) {
    try {
      execCommandSilent(`git tag -d v${version}`);
      execCommand('git reset --hard HEAD~1');
      logSuccess('回滚成功');
    } catch (e) {
      logError(`回滚失败: ${e.message}`);
    }
  }
}

function showHelp() {
  console.log(`
${colors.bright}SSO Client SDK 自动化发布脚本${colors.reset}
用法: node scripts/publish.cjs [选项]
选项:
  --major              递增主版本号
  --minor              递增次版本号
  --patch              递增补丁版本号 [默认]
  --skip-tests         跳过测试
  --dry-run            试运行模式
  --non-interactive    非交互模式 (CI/CD)
  --skip-git-check     跳过Git状态检查
  --help, -h           显示帮助信息
`);
}

function parseArgs() {
  const options = { versionType: 'patch', skipTests: false, dryRun: false, nonInteractive: false, skipGitCheck: false };
  for (const arg of process.argv.slice(2)) {
    if (['--major', '--minor', '--patch'].includes(arg)) options.versionType = arg.substring(2);
    else if (arg === '--skip-tests') options.skipTests = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--ci' || arg === '--non-interactive') options.nonInteractive = true;
    else if (arg === '--skip-git-check') options.skipGitCheck = true;
    else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    options.nonInteractive = true;
    logInfo('检测到CI环境，已自动启用非交互模式');
  }
  return options;
}

async function main() {
  const options = parseArgs();
  let newVersion;
  try {
    log(`${colors.bright}${colors.magenta}🚀 开始发布流程${colors.reset}`);
    checkDependencies();
    await checkGitStatus(options);
    if (!options.skipTests) runTests();
    buildProject();
    checkBuildOutput();
    newVersion = updateVersion(options.versionType);
    generateReleaseNotes(newVersion);
    createCommitAndTag(newVersion);
    publishToNpm(options);
    pushToGit(options);
    logSuccess(`🎉 版本 ${newVersion} 发布成功!`);
  } catch (error) {
    logError('发布失败');
    if (newVersion) await rollback(newVersion, options);
    process.exit(1);
  }
}

main().catch(err => {
  logError('脚本执行时发生未知错误');
  console.error(err);
  process.exit(1);
}); 