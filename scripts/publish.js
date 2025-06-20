#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始发布 SSO 客户端 SDK...\n');

// 检查是否在正确的目录
if (!fs.existsSync('package.json')) {
  console.error('❌ 错误: 请在项目根目录运行此脚本');
  process.exit(1);
}

// 检查是否有未提交的更改
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.error('❌ 错误: 有未提交的更改，请先提交所有更改');
    console.log('未提交的文件:');
    console.log(status);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 错误: 无法检查Git状态');
  process.exit(1);
}

// 检查当前分支
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (branch !== 'main' && branch !== 'master') {
    console.error(`❌ 错误: 当前分支是 ${branch}，请在 main 或 master 分支发布`);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 错误: 无法检查当前分支');
  process.exit(1);
}

// 运行测试
console.log('🧪 运行测试...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ 测试通过\n');
} catch (error) {
  console.error('❌ 测试失败');
  process.exit(1);
}

// 构建项目
console.log('🔨 构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建成功\n');
} catch (error) {
  console.error('❌ 构建失败');
  process.exit(1);
}

// 检查构建输出
if (!fs.existsSync('dist/index.js')) {
  console.error('❌ 错误: 构建输出不存在');
  process.exit(1);
}

// 读取当前版本
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 当前版本: ${currentVersion}`);

// 询问是否继续
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n是否继续发布到 NPM? (y/N): ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('❌ 发布已取消');
    process.exit(0);
  }

  // 发布到 NPM
  console.log('\n📤 发布到 NPM...');
  try {
    execSync('npm publish', { stdio: 'inherit' });
    console.log('✅ 发布成功!\n');
  } catch (error) {
    console.error('❌ 发布失败');
    process.exit(1);
  }

  // 创建 Git 标签
  console.log('🏷️ 创建 Git 标签...');
  try {
    execSync(`git tag v${currentVersion}`, { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
    console.log('✅ Git 标签创建成功\n');
  } catch (error) {
    console.error('❌ Git 标签创建失败');
    process.exit(1);
  }

  console.log('🎉 发布完成!');
  console.log(`📦 包名: ${packageJson.name}`);
  console.log(`📋 版本: ${currentVersion}`);
  console.log(`🌐 NPM: https://www.npmjs.com/package/${packageJson.name}`);
  console.log(`📚 GitHub: ${packageJson.homepage}`);
}); 