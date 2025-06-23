# SSO客户端SDK

[![npm version](https://badge.fury.io/js/%40tjsglion%2Fsso-client-sdk.svg)](https://badge.fury.io/js/%40tjsglion%2Fsso-client-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

一个企业级的SSO（单点登录）客户端SDK，支持多种认证方式、框架集成和高级功能，同时支持传统邮箱密码登录、双因素认证（2FA）、邮箱验证、密码重置等全套认证流程。

## ✨ 特性

- 🚀 轻量级，无依赖
- 🔄 自动令牌刷新
- 🛡️ 安全的令牌存储
- 📱 多框架支持（React、Vue、原生JS）
- 🔌 插件化架构
- 📦 TypeScript支持
- 🔐 支持SSO和传统登录
- 👤 用户注册功能
- 🔒 统一的状态管理
- 🎨 支持自定义和默认图标
- 🧩 支持2FA、邮箱验证、密码重置
- ⚡ 智能重试机制（指数退避）
- 💾 内存缓存系统
- ✅ 客户端验证（邮箱格式、密码强度）
- 🐛 详细错误类型和错误码
- ⏱️ 请求超时控制
- 🔍 调试模式支持
- 🌐 网络状态检测
- 🛠️ 丰富的工具函数（防抖、节流、深度合并等）
- 📊 性能监控系统
- 🚨 错误上报系统
- 🔄 多标签页同步
- 📱 离线支持管理
- 🔌 插件管理系统

## 📦 安装

```bash
# 使用 npm
npm install @tjsglion/sso-client-sdk

# 使用 yarn
yarn add @tjsglion/sso-client-sdk

# 使用 pnpm
pnpm add @tjsglion/sso-client-sdk
```

## 🚀 快速开始

### 基本使用

```javascript
import { SSOClient } from '@tjsglion/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

// 获取SSO提供商列表（包含图标信息）
const providers = await ssoClient.getProviders();
// providers 包含图标信息：
// {
//   id: 'google',
//   name: 'Google',
//   iconType: 'default',
//   iconKey: 'google',
//   ...
// }

// SSO登录
ssoClient.login({ providerId: 'google' });

// 传统登录
const user = await ssoClient.loginWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// 用户注册
const newUser = await ssoClient.register({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User'
});

// 2FA 设置
const twoFAInfo = await ssoClient.setupTwoFactor();
// twoFAInfo.qrCode, twoFAInfo.secret, twoFAInfo.backupCodes

// 2FA 启用
await ssoClient.enableTwoFactor({ secret, backupCodes, token });

// 2FA 验证
await ssoClient.verifyTwoFactor({ token });

// 2FA 禁用
await ssoClient.disableTwoFactor({ token });

// 邮箱验证
await ssoClient.sendVerificationEmail({ email: 'user@example.com' });
await ssoClient.verifyEmail({ email: 'user@example.com', token: 'xxxx' });

// 密码重置
await ssoClient.forgotPassword({ email: 'user@example.com' });
await ssoClient.verifyResetToken({ email: 'user@example.com', token: 'xxxx' });
await ssoClient.resetPassword({ email: 'user@example.com', token: 'xxxx', newPassword: 'newpass' });

// 处理回调
ssoClient.handleCallback({
  providerId: 'google',
  onSuccess: (user) => {
    console.log('登录成功:', user);
  },
  onError: (error) => {
    console.error('登录失败:', error);
  }
});

// 获取当前用户
const user = await ssoClient.getCurrentUser();

// 登出
ssoClient.logout();
```

### React Hook 使用

```javascript
import { useSSO } from '@tjsglion/sso-client-sdk/react';
import { SSOIcon } from '@tjsglion/sso-client-sdk/react/components';

function LoginComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login,
    providers, // 包含图标信息的提供商列表
    loginWithPassword,
    register,
    logout 
  } = useSSO({
    baseUrl: 'https://your-sso-service.com'
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>欢迎, {user?.name}!</p>
          <button onClick={logout}>登出</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => login({ providerId: provider.id })}
              className="relative flex items-center justify-center py-2 px-4 border rounded-md"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <SSOIcon provider={provider} />
              </span>
              <span>使用 {provider.name} 登录</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 图标配置

SDK 支持两种类型的图标：

1. 默认图标
```javascript
const provider = {
  id: 'google',
  name: 'Google',
  iconType: 'default',
  iconKey: 'google', // 对应 /public/icons/google.svg
};
```

2. 自定义图标
```javascript
const provider = {
  id: 'custom',
  name: 'Custom Provider',
  iconType: 'custom',
  iconContent: 'base64_encoded_content_or_svg_text',
  iconContentType: 'image/png', // 或 'text/svg+xml'
};
```

3. 图标回退机制
```javascript
<SSOIcon 
  provider={provider}
  fallback={(provider) => provider.name[0].toUpperCase()} // 自定义回退显示
/>
```

### 企业级配置

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback',
  
  // 性能优化
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['500', '502', '503', '504', '429']
  },
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 100
  },
  timeout: 10000,
  
  // 企业级功能
  performance: {
    enabled: true,
    sampleRate: 1.0,
    maxEvents: 100,
    onMetrics: (metrics) => {
      console.log('性能指标:', metrics);
    }
  },
  errorReporting: {
    enabled: true,
    sampleRate: 1.0,
    endpoint: 'https://error-reporting.example.com/api/errors'
  },
  tabSync: {
    enabled: true,
    channel: 'sso-sync'
  },
  offline: {
    enabled: true,
    maxQueueSize: 50,
    retryInterval: 5000
  },
  
  // 插件系统
  plugins: [
    {
      name: 'analytics-plugin',
      version: '1.0.0',
      install: (client) => {
        client.on('login', (event) => {
          console.log('用户登录:', event.data);
        });
      }
    }
  ],
  
  // 调试模式
  debug: process.env.NODE_ENV === 'development'
});
```

## 📚 文档

- [完整API文档](./docs/api.md)
- [使用示例](./examples/)
- [企业级配置指南](./docs/enterprise.md)
- [故障排除](./docs/troubleshooting.md)
- [迭代路线图](./ITERATION_ROADMAP.md)

## 🔧 开发

```bash
# 克隆仓库
git clone git@github.com:win-wiz/sso-client-sdk.git
cd sso-client-sdk

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test

# 发布
npm run release
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

- 📧 邮箱: tjsglion@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/win-wiz/sso-client-sdk/issues)
- 📖 文档: [项目文档](./docs/)
- 💬 讨论: [GitHub Discussions](https://github.com/win-wiz/sso-client-sdk/discussions)

## 🚀 优化功能

查看详细的优化功能说明：

- [优化功能详解](./OPTIMIZATION_FEATURES.md) - 智能重试、缓存、验证等优化功能

## 📋 迭代路线图

查看完整的版本演进和功能规划：

- [迭代路线图](./ITERATION_ROADMAP.md) - 从v1.0到v4.0的完整迭代计划 