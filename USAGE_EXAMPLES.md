# 使用示例

本文档提供 SSO 客户端 SDK 的详细使用示例。

## 📦 安装

```bash
npm install @win-wiz/sso-client-sdk
```

## 🚀 基础使用

### 1. 基本配置

```javascript
import { SSOClient } from '@win-wiz/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});
```

### 2. SSO 登录

```javascript
// 获取可用的 SSO 提供商
const providers = await ssoClient.getProviders();
console.log('可用提供商:', providers);

// 启动 SSO 登录
ssoClient.login({
  providerId: 'google',
  redirectTo: '/dashboard'
});

// 处理 OAuth 回调
const user = await ssoClient.handleCallback({
  providerId: 'google',
  onSuccess: (user) => {
    console.log('登录成功:', user);
    window.location.href = '/dashboard';
  },
  onError: (error) => {
    console.error('登录失败:', error);
  }
});
```

### 3. 传统登录

```javascript
// 邮箱密码登录
const user = await ssoClient.loginWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

if (user) {
  console.log('登录成功:', user);
} else {
  console.log('登录失败');
}

// 用户注册
const newUser = await ssoClient.register({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User'
});
```

### 4. 用户管理

```javascript
// 获取当前用户
const currentUser = await ssoClient.getCurrentUser();

// 登出
ssoClient.logout();

// 刷新令牌
const newToken = await ssoClient.refreshToken();
```

## 🔒 高级认证功能

### 1. 2FA 双因素认证

```javascript
// 设置 2FA
const twoFAInfo = await ssoClient.setupTwoFactor();
console.log('QR码:', twoFAInfo.qrCode);
console.log('密钥:', twoFAInfo.secret);
console.log('备用码:', twoFAInfo.backupCodes);

// 启用 2FA
await ssoClient.enableTwoFactor({
  secret: twoFAInfo.secret,
  backupCodes: twoFAInfo.backupCodes,
  token: '123456' // 用户输入的验证码
});

// 验证 2FA
await ssoClient.verifyTwoFactor({
  token: '123456'
});

// 禁用 2FA
await ssoClient.disableTwoFactor({
  token: '123456'
});

// 获取 2FA 设置
const settings = await ssoClient.getTwoFactorSettings();

// 重新生成备用码
const newBackupCodes = await ssoClient.regenerateBackupCodes();
```

### 2. 邮箱验证

```javascript
// 发送验证邮件
await ssoClient.sendVerificationEmail({
  email: 'user@example.com'
});

// 验证邮箱
await ssoClient.verifyEmail({
  email: 'user@example.com',
  token: 'verification-token'
});

// 重新发送验证邮件
await ssoClient.resendVerificationEmail({
  email: 'user@example.com'
});

// 检查验证状态
const status = await ssoClient.checkEmailVerificationStatus({
  email: 'user@example.com'
});
```

### 3. 密码重置

```javascript
// 请求密码重置
await ssoClient.forgotPassword({
  email: 'user@example.com'
});

// 验证重置令牌
const isValid = await ssoClient.verifyResetToken({
  email: 'user@example.com',
  token: 'reset-token'
});

// 重置密码
await ssoClient.resetPassword({
  email: 'user@example.com',
  token: 'reset-token',
  newPassword: 'new-password123'
});

// 验证密码强度
const validation = await ssoClient.validatePassword({
  password: 'new-password123'
});
```

## ⚡ 性能优化配置

### 1. 智能重试

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['500', '502', '503', '504', '429']
  }
});
```

### 2. 缓存配置

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  cache: {
    enabled: true,
    ttl: 300, // 5分钟
    maxSize: 100
  }
});
```

### 3. 超时控制

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  timeout: 10000 // 10秒
});
```

## 🏢 企业级功能

### 1. 性能监控

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  performance: {
    enabled: true,
    sampleRate: 1.0,
    maxEvents: 100,
    onMetrics: (metrics) => {
      console.log('性能指标:', metrics);
      // 发送到监控系统
      analytics.track('sso_performance', metrics);
    }
  }
});

// 获取性能监控器
const monitor = ssoClient.getPerformanceMonitor();
console.log('平均响应时间:', monitor.getAverageResponseTime());
console.log('成功率:', monitor.getSuccessRate());
```

### 2. 错误上报

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  errorReporting: {
    enabled: true,
    sampleRate: 1.0,
    endpoint: 'https://error-reporting.example.com/api/errors',
    onError: (error, context) => {
      console.log('错误上报:', { error, context });
      // 发送到错误监控系统
      errorReporter.captureException(error, context);
    }
  }
});
```

### 3. 多标签页同步

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  tabSync: {
    enabled: true,
    channel: 'sso-sync',
    onAuthChange: (event) => {
      console.log('标签页同步事件:', event);
      // 更新其他标签页的UI
      updateUI(event);
    }
  }
});
```

### 4. 离线支持

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  offline: {
    enabled: true,
    maxQueueSize: 50,
    retryInterval: 5000,
    onSync: (pendingActions) => {
      console.log('离线同步:', pendingActions);
      // 显示同步状态
      showSyncStatus(pendingActions.length);
    }
  }
});

// 获取离线管理器
const offlineManager = ssoClient.getOfflineManager();
console.log('待处理操作:', offlineManager.getPendingActions());
```

### 5. 插件系统

```javascript
// 定义插件
const analyticsPlugin = {
  name: 'analytics-plugin',
  version: '1.0.0',
  install: (client) => {
    // 监听登录事件
    client.on('login', (event) => {
      analytics.track('user_login', {
        method: event.data.method,
        userId: event.data.user.id
      });
    });
    
    // 监听登出事件
    client.on('logout', (event) => {
      analytics.track('user_logout', {
        userId: event.data.userId
      });
    });
  },
  uninstall: () => {
    console.log('分析插件已卸载');
  }
};

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  plugins: [analyticsPlugin]
});

// 动态安装插件
const pluginManager = ssoClient.getPluginManager();
pluginManager.install({
  name: 'custom-plugin',
  version: '1.0.0',
  install: (client) => {
    console.log('自定义插件已安装');
  }
});
```

## 🎯 React 集成

### 1. 基础 Hook 使用

```jsx
import React, { useState } from 'react';
import { useSSO } from '@win-wiz/sso-client-sdk/react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    loginWithPassword,
    register,
    logout 
  } = useSSO({
    baseUrl: 'https://your-sso-service.com'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginWithPassword({ email, password });
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleSSOLogin = () => {
    login({ providerId: 'google' });
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>欢迎, {user?.name}!</h1>
          <button onClick={logout}>登出</button>
        </div>
      ) : (
        <div>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
            />
            <button type="submit">登录</button>
          </form>
          <button onClick={handleSSOLogin}>使用Google登录</button>
        </div>
      )}
    </div>
  );
}
```

### 2. 高级 Hook 使用

```jsx
import React from 'react';
import { useSSO } from '@win-wiz/sso-client-sdk/react';

function App() {
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
  } = useSSO({
    baseUrl: 'https://your-sso-service.com',
    performance: { enabled: true },
    errorReporting: { enabled: true },
    tabSync: { enabled: true },
    offline: { enabled: true }
  });

  // 使用所有可用的方法...
  
  return (
    <div>
      {/* 你的应用UI */}
    </div>
  );
}
```

## 🎨 Vue 集成

### 1. Vue 3 Composition API

```vue
<template>
  <div>
    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else-if="isAuthenticated">
      <h1>欢迎, {{ user?.name }}!</h1>
      <button @click="logout">登出</button>
    </div>
    <div v-else>
      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="邮箱" />
        <input v-model="password" type="password" placeholder="密码" />
        <button type="submit">登录</button>
      </form>
      <button @click="handleSSOLogin">使用Google登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { SSOClient } from '@win-wiz/sso-client-sdk';

const email = ref('');
const password = ref('');
const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const error = ref(null);

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com'
});

const handleLogin = async () => {
  try {
    isLoading.value = true;
    const result = await ssoClient.loginWithPassword({
      email: email.value,
      password: password.value
    });
    if (result) {
      user.value = result;
      isAuthenticated.value = true;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleSSOLogin = () => {
  ssoClient.login({ providerId: 'google' });
};

const logout = () => {
  ssoClient.logout();
  user.value = null;
  isAuthenticated.value = false;
};
</script>
```

## 🔧 工具函数

### 1. 验证函数

```javascript
import { isValidEmail, validatePasswordStrength } from '@win-wiz/sso-client-sdk/utils';

// 验证邮箱格式
console.log(isValidEmail('user@example.com')); // true
console.log(isValidEmail('invalid-email')); // false

// 验证密码强度
const result = validatePasswordStrength('Test123!');
console.log(result);
// {
//   isValid: true,
//   score: 4,
//   feedback: ['密码长度足够', '包含大小写字母', '包含数字', '包含特殊字符']
// }
```

### 2. 工具函数

```javascript
import { 
  debounce, 
  throttle, 
  deepMerge, 
  generateRandomString,
  getClientInfo 
} from '@win-wiz/sso-client-sdk/utils';

// 防抖
const debouncedSearch = debounce((query) => {
  console.log('搜索:', query);
}, 300);

// 节流
const throttledScroll = throttle(() => {
  console.log('滚动事件');
}, 100);

// 深度合并
const merged = deepMerge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 }, e: 4 }
);

// 生成随机字符串
const randomString = generateRandomString(10);

// 获取客户端信息
const clientInfo = getClientInfo();
```

## 🚨 错误处理

### 1. 错误类型

```javascript
import { SSOError } from '@win-wiz/sso-client-sdk';

try {
  await ssoClient.loginWithPassword({ email, password });
} catch (error) {
  if (error instanceof SSOError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        console.log('邮箱或密码错误');
        break;
      case 'ACCOUNT_LOCKED':
        console.log('账户已被锁定');
        break;
      case 'NETWORK_ERROR':
        console.log('网络连接失败');
        break;
      default:
        console.log('未知错误:', error.message);
    }
  }
}
```

### 2. 全局错误处理

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  onError: (error) => {
    console.error('SSO错误:', error);
    
    // 根据错误类型处理
    if (error.code === 'TOKEN_EXPIRED') {
      // 重定向到登录页
      window.location.href = '/login';
    } else if (error.code === 'NETWORK_ERROR') {
      // 显示网络错误提示
      showNetworkError();
    } else {
      // 显示通用错误提示
      showErrorMessage(error.message);
    }
  }
});
```

## 📊 监控和分析

### 1. 性能监控

```javascript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  performance: {
    enabled: true,
    onMetrics: (metrics) => {
      // 发送到分析系统
      analytics.track('sso_performance', {
        type: metrics.type,
        duration: metrics.duration,
        success: metrics.success,
        errorCode: metrics.errorCode
      });
    }
  }
});
```

### 2. 用户行为跟踪

```javascript
// 监听认证事件
ssoClient.on('login', (event) => {
  analytics.track('user_login', {
    method: event.data.method,
    userId: event.data.user.id,
    timestamp: event.timestamp
  });
});

ssoClient.on('logout', (event) => {
  analytics.track('user_logout', {
    userId: event.data.userId,
    timestamp: event.timestamp
  });
});

ssoClient.on('error', (event) => {
  analytics.track('sso_error', {
    code: event.data.code,
    message: event.data.message,
    timestamp: event.timestamp
  });
});
```

---

这些示例涵盖了 SDK 的主要功能。更多详细信息请参考 [API 文档](./docs/api.md)。 