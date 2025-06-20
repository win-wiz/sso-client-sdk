# 发布指南

本文档详细说明如何将 SSO 客户端 SDK 发布到 NPM 和 GitHub。

## 📋 发布前准备

### 1. NPM 账户设置

```bash
# 登录 NPM
npm login

# 验证登录状态
npm whoami
```

### 2. GitHub 设置

确保你有以下权限：
- 仓库的写入权限
- 创建 Release 的权限
- 推送标签的权限

### 3. 环境检查

```bash
# 检查 Node.js 版本 (需要 >= 16)
node --version

# 检查 npm 版本
npm --version

# 检查 Git 状态
git status
```

## 🚀 发布流程

### 方法一：使用发布脚本（推荐）

```bash
# 运行发布脚本
node scripts/publish.js
```

脚本会自动执行以下步骤：
1. 检查 Git 状态
2. 运行测试
3. 构建项目
4. 发布到 NPM
5. 创建 Git 标签

### 方法二：手动发布

```bash
# 1. 确保所有更改已提交
git add .
git commit -m "feat: prepare for release v3.0.0"

# 2. 运行测试
npm test

# 3. 构建项目
npm run build

# 4. 发布到 NPM
npm publish

# 5. 创建 Git 标签
git tag v3.0.0
git push origin v3.0.0
```

### 方法三：使用 GitHub Actions（自动发布）

```bash
# 1. 创建新版本标签
git tag v3.0.0

# 2. 推送标签（触发自动发布）
git push origin v3.0.0
```

## 📦 版本管理

### 语义化版本

- **主版本号** (Major): 不兼容的 API 修改
- **次版本号** (Minor): 向下兼容的功能性新增
- **修订号** (Patch): 向下兼容的问题修正

### 版本更新命令

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm run release:patch

# 次版本 (1.0.0 -> 1.1.0)
npm run release:minor

# 主版本 (1.0.0 -> 2.0.0)
npm run release:major
```

## 🔧 配置说明

### package.json 关键配置

```json
{
  "name": "@win-wiz/sso-client-sdk",
  "version": "3.0.0",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/useSSO.js",
      "require": "./dist/react/useSSO.js",
      "types": "./dist/react/useSSO.d.ts"
    }
  },
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### .npmignore 配置

排除不需要发布的文件：
- 源代码文件
- 开发配置文件
- 测试文件
- 文档文件（除了 README.md）

## 🧪 测试发布

### 使用 npm pack 测试

```bash
# 创建本地包
npm pack

# 检查包内容
tar -tf win-wiz-sso-client-sdk-3.0.0.tgz
```

### 使用 npm link 测试

```bash
# 在项目目录创建链接
npm link

# 在测试项目中链接
cd ../test-project
npm link @win-wiz/sso-client-sdk

# 测试使用
import { SSOClient } from '@win-wiz/sso-client-sdk';
```

## 🔐 安全考虑

### NPM Token 管理

```bash
# 创建 NPM Token
npm token create

# 在 CI/CD 中使用环境变量
export NPM_TOKEN=your-token-here
```

### GitHub Token 管理

在 GitHub 仓库设置中：
1. Settings → Secrets and variables → Actions
2. 添加 `NPM_TOKEN` secret
3. 添加 `GITHUB_TOKEN` (通常自动提供)

## 📊 发布后验证

### 1. 检查 NPM 包

```bash
# 查看包信息
npm view @win-wiz/sso-client-sdk

# 查看版本历史
npm view @win-wiz/sso-client-sdk versions
```

### 2. 测试安装

```bash
# 创建测试目录
mkdir test-install
cd test-install

# 安装包
npm install @win-wiz/sso-client-sdk

# 测试导入
node -e "const { SSOClient } = require('@win-wiz/sso-client-sdk'); console.log('✅ 安装成功');"
```

### 3. 检查 GitHub Release

- 访问 GitHub 仓库的 Releases 页面
- 确认自动创建的 Release
- 检查 Release 说明是否正确

## 🚨 常见问题

### 1. 发布权限错误

```bash
# 检查 NPM 账户
npm whoami

# 重新登录
npm logout
npm login
```

### 2. 版本冲突

```bash
# 检查已发布的版本
npm view @win-wiz/sso-client-sdk versions

# 更新版本号
npm version patch
```

### 3. 构建失败

```bash
# 清理构建缓存
npm run clean

# 重新安装依赖
rm -rf node_modules
npm install

# 重新构建
npm run build
```

### 4. Git 标签冲突

```bash
# 删除本地标签
git tag -d v3.0.0

# 删除远程标签
git push origin :refs/tags/v3.0.0

# 重新创建标签
git tag v3.0.0
git push origin v3.0.0
```

## 📈 发布统计

### 发布检查清单

- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 版本号正确
- [ ] CHANGELOG.md 更新
- [ ] README.md 更新
- [ ] 许可证文件存在
- [ ] Git 标签创建
- [ ] NPM 发布成功
- [ ] GitHub Release 创建
- [ ] 安装测试通过

### 发布后任务

- [ ] 更新项目文档
- [ ] 通知团队成员
- [ ] 监控错误报告
- [ ] 收集用户反馈
- [ ] 计划下次发布

## 🎯 最佳实践

1. **版本管理**: 使用语义化版本
2. **测试**: 发布前运行完整测试
3. **文档**: 更新相关文档
4. **备份**: 保留发布前的代码快照
5. **监控**: 发布后监控包的使用情况
6. **回滚**: 准备回滚计划

---

**注意**: 发布前请确保所有更改都已测试并通过，发布后无法轻易撤销。 