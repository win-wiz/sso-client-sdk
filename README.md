# SSO客户端SDK

一个轻量级的SSO（单点登录）客户端SDK，支持多种框架和SSO提供商，同时支持传统邮箱密码登录、双因素认证（2FA）、邮箱验证、密码重置等全套认证流程。

## 特性

- 🚀 轻量级，无依赖
- 🔄 自动令牌刷新
- 🛡️ 安全的令牌存储
- 📱 多框架支持（React、Vue、原生JS）
- 🔌 插件化架构
- 📦 TypeScript支持
- 🔐 支持SSO和传统登录
- 👤 用户注册功能
- 🔒 统一的状态管理
- 🧩 支持2FA、邮箱验证、密码重置
- ⚡ 智能重试机制（指数退避）
- 💾 内存缓存系统
- ✅ 客户端验证（邮箱格式、密码强度）
- 🐛 详细错误类型和错误码
- ⏱️ 请求超时控制
- 🔍 调试模式支持
- 🌐 网络状态检测
- 🛠️ 丰富的工具函数（防抖、节流、深度合并等）

## 安装

```bash
npm install @your-org/sso-client-sdk
# 或
yarn add @your-org/sso-client-sdk
```

## 快速开始

### 基本使用

```javascript
import { SSOClient } from '@your-org/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

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

### React 使用

```tsx
import React from 'react';
import { useSSO } from '@your-org/sso-client-sdk/react';

const App = () => {
  const {
    user, isAuthenticated, isLoading, error,
    login, loginWithPassword, register,
    setupTwoFactor, enableTwoFactor, verifyTwoFactor, disableTwoFactor, getTwoFactorSettings, regenerateBackupCodes,
    sendVerificationEmail, verifyEmail, resendVerificationEmail, checkEmailVerificationStatus,
    forgotPassword, verifyResetToken, resetPassword, validatePassword,
    logout
  } = useSSO();

  if (!isAuthenticated) {
    return (
      <div>
        <h1>请登录</h1>
        <button onClick={() => login('google')}>
          使用Google登录
        </button>
        <button onClick={() => loginWithPassword}>
          邮箱密码登录
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>欢迎, {user?.name}!</h1>
      <button onClick={logout}>登出</button>
    </div>
  );
};
```

## 框架支持

### React

详细的React使用示例请查看：[React使用指南](./examples/README.md)

### Vue

```vue
<template>
  <div>
    <button v-if="!isAuthenticated" @click="login('google')">
      使用Google登录
    </button>
    <button v-if="!isAuthenticated" @click="loginWithPassword">
      邮箱密码登录
    </button>
    <div v-else>
      <h1>欢迎, {{ user?.name }}!</h1>
      <button @click="logout">登出</button>
    </div>
  </div>
</template>

<script>
import { SSOClient } from '@your-org/sso-client-sdk';

export default {
  data() {
    return {
      ssoClient: new SSOClient({
        baseUrl: 'https://your-sso-service.com',
        redirectUri: 'http://localhost:3000/callback'
      }),
      user: null,
      isAuthenticated: false
    };
  },
  methods: {
    login(providerId) {
      this.ssoClient.login({ providerId });
    },
    async loginWithPassword() {
      const user = await this.ssoClient.loginWithPassword({
        email: 'user@example.com',
        password: 'password123'
      });
      if (user) {
        this.user = user;
        this.isAuthenticated = true;
      }
    },
    logout() {
      this.ssoClient.logout();
      this.user = null;
      this.isAuthenticated = false;
    }
  }
};
</script>
```

### 原生JavaScript

```javascript
// 初始化
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

// SSO登录按钮事件
document.getElementById('sso-login-btn').addEventListener('click', () => {
  ssoClient.login({ providerId: 'google' });
});

// 传统登录按钮事件
document.getElementById('local-login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const user = await ssoClient.loginWithPassword({ email, password });
  if (user) {
    updateUI();
  }
});

// 登出按钮事件
document.getElementById('logout-btn').addEventListener('click', () => {
  ssoClient.logout();
  updateUI();
});

// 更新UI
async function updateUI() {
  try {
    const user = await ssoClient.getCurrentUser();
    if (user) {
      document.getElementById('user-info').textContent = `欢迎, ${user.name}!`;
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('user-section').style.display = 'block';
    } else {
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('user-section').style.display = 'none';
    }
  } catch (error) {
    console.log('用户未登录');
  }
}

// 页面加载时检查登录状态
updateUI();
```

## 功能对照表

### 功能-API-前端方法三方对照表

| 功能类别         | 具体功能           | 后端API路径（示例）                                 | 前端SDK方法名（参数/说明）                   |
|------------------|-------------------|-----------------------------------------------------|----------------------------------------------|
| 传统登录         | 邮箱密码登录       | POST /auth/login                                    | `loginWithPassword({ email, password })`     |
|                  | 用户注册           | POST /auth/register                                 | `register({ email, password, name })`        |
| SSO登录          | SSO登录跳转        | GET /sso/login/:provider                            | `login({ providerId, ... })`                 |
|                  | SSO回调处理        | POST /sso/callback/:provider                        | `handleCallback({ providerId, ... })`        |
|                  | 获取SSO提供商      | GET /sso/providers                                  | `getProviders()`                            |
| 用户信息         | 获取当前用户       | GET /auth/me                                        | `getCurrentUser()`                          |
|                  | 登出               | POST /auth/logout                                   | `logout()`                                  |
| 令牌管理         | 验证令牌           | GET /auth/verify                                    | `validateToken(token)`                      |
|                  | 刷新令牌           | POST /sso/refresh                                   | `refreshToken()`                            |
| 2FA（双因素认证）| 获取2FA设置        | POST /auth/2fa/setup                                | `setupTwoFactor()`                          |
|                  | 启用2FA            | POST /auth/2fa/enable                               | `enableTwoFactor({ secret, backupCodes, token })` |
|                  | 验证2FA            | POST /auth/2fa/verify                               | `verifyTwoFactor({ token, backupCode })`     |
|                  | 禁用2FA            | POST /auth/2fa/disable                              | `disableTwoFactor({ token })`                |
|                  | 获取2FA状态        | GET /auth/2fa/settings                              | `getTwoFactorSettings()`                     |
|                  | 备用码重置         | POST /auth/2fa/regenerate-backup-codes              | `regenerateBackupCodes({ token })`           |
| 邮箱验证         | 发送验证邮件       | POST /auth/email-verification/send-verification     | `sendVerificationEmail({ email })`           |
|                  | 验证邮箱           | POST /auth/email-verification/verify                | `verifyEmail({ email, token })`              |
|                  | 重新发送验证邮件   | POST /auth/email-verification/resend                | `resendVerificationEmail({ email })`         |
|                  | 查询邮箱验证状态   | GET /auth/email-verification/status/:email          | `checkEmailVerificationStatus(email)`        |
| 密码重置         | 请求密码重置       | POST /auth/password-reset/forgot-password           | `forgotPassword({ email })`                  |
|                  | 验证重置令牌       | POST /auth/password-reset/verify-reset-token         | `verifyResetToken({ email, token })`         |
|                  | 重置密码           | POST /auth/password-reset/reset-password            | `resetPassword({ email, token, newPassword })`|
|                  | 检查密码强度       | POST /auth/password-reset/validate-password         | `validatePassword({ password })`             |

### 说明

- **后端API路径**：为主要RESTful接口，部分接口可能有额外参数或鉴权要求
- **前端SDK方法名**：为`sso-client-sdk`中可直接调用的方法，参数与后端API一一对应，类型安全
- **所有方法均支持TypeScript类型检查**，提供完整的IDE智能提示

## API 参考

### SSOClient

#### 构造函数

```javascript
new SSOClient(config)
```

**配置选项：**

- `baseUrl` (string): SSO服务的基础URL
- `redirectUri` (string, 可选): 回调地址
- `storage` (string, 可选): 存储方式，可选值：'localStorage' | 'sessionStorage' | 'memory'，默认：'localStorage'
- `autoRefresh` (boolean, 可选): 是否自动刷新令牌，默认：true
- `refreshThreshold` (number, 可选): 刷新阈值（秒），默认：300
- `onAuthChange` (function, 可选): 认证状态变化回调
- `onError` (function, 可选): 错误回调

#### 方法

##### SSO相关方法

###### login(options)

启动SSO登录流程。

```javascript
ssoClient.login({
  providerId: 'google',
  redirectTo: '/dashboard', // 可选
  state: 'custom-state'     // 可选
});
```

###### handleCallback(options)

处理OAuth回调。

```javascript
ssoClient.handleCallback({
  providerId: 'google',
  onSuccess: (user) => {
    console.log('登录成功:', user);
  },
  onError: (error) => {
    console.error('登录失败:', error);
  },
  redirectTo: '/dashboard' // 可选
});
```

###### getProviders()

获取可用的SSO提供商列表。

```javascript
const providers = await ssoClient.getProviders();
```

##### 传统登录相关方法

###### loginWithPassword(options)

使用邮箱密码登录。

```javascript
const user = await ssoClient.loginWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

###### register(options)

用户注册。

```javascript
const user = await ssoClient.register({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User' // 可选
});
```

##### 2FA（双因素认证）相关方法

###### setupTwoFactor()

获取2FA密钥、二维码、备用码。

```javascript
const twoFAInfo = await ssoClient.setupTwoFactor();
// twoFAInfo.qrCode, twoFAInfo.secret, twoFAInfo.backupCodes
```

###### enableTwoFactor({ secret, backupCodes, token })

启用2FA。

```javascript
await ssoClient.enableTwoFactor({ secret, backupCodes, token });
```

###### verifyTwoFactor({ token, backupCode })

验证2FA（TOTP或备用码）。

```javascript
await ssoClient.verifyTwoFactor({ token });
```

###### disableTwoFactor({ token })

禁用2FA。

```javascript
await ssoClient.disableTwoFactor({ token });
```

###### getTwoFactorSettings()

获取2FA设置。

```javascript
const settings = await ssoClient.getTwoFactorSettings();
```

###### regenerateBackupCodes({ token })

重新生成备用码。

```javascript
await ssoClient.regenerateBackupCodes({ token });
```

##### 邮箱验证相关方法

###### sendVerificationEmail({ email })

发送验证邮件。

```javascript
await ssoClient.sendVerificationEmail({ email: 'user@example.com' });
```

###### verifyEmail({ email, token })

验证邮箱。

```javascript
await ssoClient.verifyEmail({ email: 'user@example.com', token: 'xxxx' });
```

###### resendVerificationEmail({ email })

重新发送验证邮件。

```javascript
await ssoClient.resendVerificationEmail({ email: 'user@example.com' });
```

###### checkEmailVerificationStatus(email)

检查邮箱验证状态。

```javascript
const status = await ssoClient.checkEmailVerificationStatus('user@example.com');
```

##### 密码重置相关方法

###### forgotPassword({ email })

请求密码重置。

```javascript
await ssoClient.forgotPassword({ email: 'user@example.com' });
```

###### verifyResetToken({ email, token })

验证重置令牌。

```javascript
await ssoClient.verifyResetToken({ email: 'user@example.com', token: 'xxxx' });
```

###### resetPassword({ email, token, newPassword })

重置密码。

```javascript
await ssoClient.resetPassword({ email: 'user@example.com', token: 'xxxx', newPassword: 'newpass' });
```

###### validatePassword({ password })

检查密码强度。

```javascript
const strength = await ssoClient.validatePassword('password123');
```

##### 通用方法

###### getCurrentUser()

获取当前用户信息。

```javascript
const user = await ssoClient.getCurrentUser();
```

###### logout()

登出用户。

```javascript
ssoClient.logout();
```

###### refreshToken()

手动刷新令牌。

```javascript
const newToken = await ssoClient.refreshToken();
```

###### getAuthState()

获取当前认证状态。

```javascript
const authState = ssoClient.getAuthState();
// 返回: { user, isAuthenticated, isLoading, error }
```

###### onAuthChange(callback)

监听认证状态变化。

```javascript
const unsubscribe = ssoClient.onAuthChange((authState) => {
  console.log('认证状态变化:', authState);
});

// 取消监听
unsubscribe();
```

### React Hook

#### useSSO()

React Hook，提供认证状态和方法。

```tsx
const { 
  user, 
  isAuthenticated, 
  isLoading, 
  error, 
  login, 
  loginWithPassword,
  register,
  logout, 
  refreshToken,
  setupTwoFactor,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  getTwoFactorSettings,
  regenerateBackupCodes,
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  checkEmailVerificationStatus,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  validatePassword
} = useSSO();
```

## 配置

### 环境变量

```bash
# .env
VITE_SSO_BASE_URL=https://your-sso-service.com
VITE_SSO_REDIRECT_URI=http://localhost:3000/callback
```

### 生产环境配置

```javascript
const ssoClient = new SSOClient({
  baseUrl: process.env.VITE_SSO_BASE_URL,
  redirectUri: process.env.VITE_SSO_REDIRECT_URI,
  storage: 'localStorage',
  autoRefresh: true,
  refreshThreshold: 300,
  onAuthChange: (user) => console.log('认证状态变化:', user),
  onError: (error) => console.error('SSO错误:', error),
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['500', '502', '503', '504', '429']
  },
  timeout: 10000,
  debug: false,
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 100
  }
});
```

### 配置选项说明

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `baseUrl` | string | - | SSO服务器基础URL |
| `redirectUri` | string | - | OAuth回调地址 |
| `storage` | string | 'localStorage' | 存储方式 |
| `autoRefresh` | boolean | true | 自动刷新令牌 |
| `refreshThreshold` | number | 300 | 刷新阈值（秒） |
| `onAuthChange` | function | - | 认证状态变化回调 |
| `onError` | function | - | 错误处理回调 |
| `retry` | object | 见下方 | 重试配置 |
| `timeout` | number | 10000 | 请求超时（毫秒） |
| `debug` | boolean | false | 调试模式 |
| `cache` | object | 见下方 | 缓存配置 |

#### 重试配置

```typescript
retry: {
  maxRetries: 3,           // 最大重试次数
  retryDelay: 1000,        // 初始重试延迟（毫秒）
  backoffMultiplier: 2,    // 退避倍数（指数退避）
  retryableErrors: ['500', '502', '503', '504', '429'] // 可重试的HTTP状态码
}
```

#### 缓存配置

```typescript
cache: {
  enabled: true,           // 启用缓存
  ttl: 300,               // 缓存时间（秒）
  maxSize: 100            // 最大缓存条目数
}
```

## 错误处理

```javascript
try {
  const user = await ssoClient.loginWithPassword({
    email: 'user@example.com',
    password: 'password123'
  });
  
  if (user) {
    console.log('登录成功:', user);
  } else {
    console.log('登录失败');
  }
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    setError('网络连接失败，请检查网络设置');
  } else if (error.code === 'INVALID_CREDENTIALS') {
    setError('邮箱或密码错误');
  } else {
    setError('登录失败，请稍后重试');
  }
}
```

## 最佳实践

1. **错误处理**: 始终包装SSO操作在try-catch块中
2. **加载状态**: 为用户提供清晰的加载反馈
3. **路由保护**: 使用受保护的路由组件
4. **令牌管理**: 利用自动刷新功能
5. **用户体验**: 提供清晰的错误信息和重试选项
6. **混合登录**: 支持SSO和传统登录并存，提供多种登录选择
7. **2FA安全**: 建议高敏感操作强制2FA
8. **邮箱验证**: 注册后强制邮箱验证
9. **密码重置**: 提供找回密码入口

## 示例项目

查看 `examples/` 目录下的完整示例：

- [React使用指南](./examples/README.md)
- [Vue示例](./examples/vue-example.vue)
- [原生JavaScript示例](./examples/vanilla-example.js)

## 🚀 优化功能

查看详细的优化功能说明：

- [优化功能详解](./OPTIMIZATION_FEATURES.md) - 智能重试、缓存、验证等优化功能

## 📋 迭代路线图

查看完整的版本演进和功能规划：

- [迭代路线图](./ITERATION_ROADMAP.md) - 从v1.0到v4.0的完整迭代计划

## 许可证

MIT 