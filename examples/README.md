# React 使用示例

本文档介绍如何在React项目中使用SSO客户端SDK，包括SSO登录、传统邮箱密码登录、2FA、邮箱验证、密码重置等。

## 功能对照表

### React Hook方法对照表

| 功能类别         | 具体功能           | React Hook方法名                                    | 使用示例                                    |
|------------------|-------------------|-----------------------------------------------------|---------------------------------------------|
| 传统登录         | 邮箱密码登录       | `loginWithPassword`                                 | `loginWithPassword({ email, password })`    |
|                  | 用户注册           | `register`                                          | `register({ email, password, name })`       |
| SSO登录          | SSO登录跳转        | `login`                                             | `login({ providerId: 'google' })`           |
|                  | SSO回调处理        | `handleCallback`                                    | `handleCallback({ providerId: 'google' })`  |
|                  | 获取SSO提供商      | `getProviders`                                      | `getProviders()`                           |
| 用户信息         | 获取当前用户       | `getCurrentUser`                                    | `getCurrentUser()`                         |
|                  | 登出               | `logout`                                            | `logout()`                                 |
| 令牌管理         | 刷新令牌           | `refreshToken`                                      | `refreshToken()`                           |
| 2FA（双因素认证）| 获取2FA设置        | `setupTwoFactor`                                    | `setupTwoFactor()`                         |
|                  | 启用2FA            | `enableTwoFactor`                                   | `enableTwoFactor({ secret, backupCodes, token })` |
|                  | 验证2FA            | `verifyTwoFactor`                                   | `verifyTwoFactor({ token })`                |
|                  | 禁用2FA            | `disableTwoFactor`                                  | `disableTwoFactor({ token })`               |
|                  | 获取2FA状态        | `getTwoFactorSettings`                              | `getTwoFactorSettings()`                    |
|                  | 备用码重置         | `regenerateBackupCodes`                             | `regenerateBackupCodes({ token })`          |
| 邮箱验证         | 发送验证邮件       | `sendVerificationEmail`                             | `sendVerificationEmail({ email })`          |
|                  | 验证邮箱           | `verifyEmail`                                       | `verifyEmail({ email, token })`             |
|                  | 重新发送验证邮件   | `resendVerificationEmail`                           | `resendVerificationEmail({ email })`        |
|                  | 查询邮箱验证状态   | `checkEmailVerificationStatus`                      | `checkEmailVerificationStatus(email)`       |
| 密码重置         | 请求密码重置       | `forgotPassword`                                    | `forgotPassword({ email })`                 |
|                  | 验证重置令牌       | `verifyResetToken`                                  | `verifyResetToken({ email, token })`        |
|                  | 重置密码           | `resetPassword`                                     | `resetPassword({ email, token, newPassword })`|
|                  | 检查密码强度       | `validatePassword`                                  | `validatePassword({ password })`            |

### 状态管理

| 状态属性         | 类型               | 说明                                                |
|------------------|-------------------|-----------------------------------------------------|
| `user`           | `User \| null`    | 当前用户信息                                        |
| `isAuthenticated`| `boolean`         | 是否已认证                                          |
| `isLoading`      | `boolean`         | 是否正在加载                                        |
| `error`          | `string \| null`  | 错误信息                                            |

## 安装

```bash
npm install @your-org/sso-client-sdk
# 或
yarn add @your-org/sso-client-sdk
```

## 基本使用

### 1. 初始化SSO客户端

```tsx
import { SSOClient } from '@your-org/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});
```

### 2. 创建登录组件

```tsx
import React, { useState } from 'react';
import { SSOClient } from '@your-org/sso-client-sdk';

const LoginComponent = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSSOLogin = async (providerId: string) => {
    try {
      setLoading(true);
      ssoClient.login({ providerId });
    } catch (error) {
      console.error('SSO登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await ssoClient.loginWithPassword({ email, password });
      if (user) {
        console.log('登录成功:', user);
      } else {
        console.log('登录失败');
      }
    } catch (error) {
      console.error('传统登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>选择登录方式</h2>
      
      {/* SSO登录 */}
      <div>
        <h3>第三方登录</h3>
        <button 
          onClick={() => handleSSOLogin('google')}
          disabled={loading}
        >
          {loading ? '登录中...' : '使用Google登录'}
        </button>
        <button 
          onClick={() => handleSSOLogin('github')}
          disabled={loading}
        >
          {loading ? '登录中...' : '使用GitHub登录'}
        </button>
      </div>

      {/* 传统登录 */}
      <div>
        <h3>邮箱密码登录</h3>
        <form onSubmit={handleLocalLogin}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

### 3. 处理回调

```tsx
import React, { useEffect, useState } from 'react';
import { SSOClient } from '@your-org/sso-client-sdk';

const CallbackComponent = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setLoading(true);
      
      await ssoClient.handleCallback({
        providerId: 'google', // 根据实际提供商调整
        onSuccess: (user) => {
          console.log('登录成功:', user);
          // 重定向到主页或仪表板
          window.location.href = '/dashboard';
        },
        onError: (error) => {
          setError(error.message);
        }
      });
    } catch (error) {
      setError('回调处理失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>正在处理登录...</div>;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return <div>登录成功，正在跳转...</div>;
};
```

### 4. 用户状态管理

```tsx
import React, { useState, useEffect } from 'react';
import { SSOClient } from '@your-org/sso-client-sdk';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await ssoClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('用户未登录');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ssoClient.logout();
    setUser(null);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h2>用户信息</h2>
      <p>姓名: {user.name}</p>
      <p>邮箱: {user.email}</p>
      <p>登录方式: {user.loginType}</p>
      <button onClick={handleLogout}>登出</button>
    </div>
  );
};
```

### 5. 用户注册组件

```tsx
import React, { useState } from 'react';
import { SSOClient } from '@your-org/sso-client-sdk';

const RegisterComponent = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await ssoClient.register({ email, password, name });
      if (user) {
        console.log('注册成功:', user);
        // 注册成功后自动登录
      } else {
        console.log('注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>用户注册</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </div>
  );
};
```

### 6. 使用React Hook（可选）

```tsx
import React from 'react';
import { useSSO } from '@your-org/sso-client-sdk/react';

const App = () => {
  const { user, isAuthenticated, isLoading, login, loginWithPassword, register, logout } = useSSO();

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>请登录</h1>
        <button onClick={() => login('google')}>
          使用Google登录
        </button>
        <button onClick={() => loginWithPassword({ email: 'user@example.com', password: 'password' })}>
          邮箱密码登录
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>欢迎, {user?.name}!</h1>
      <p>登录方式: {user?.loginType}</p>
      <button onClick={logout}>登出</button>
    </div>
  );
};
```

### 7. 2FA（双因素认证）

```tsx
// 获取2FA设置（二维码、密钥、备用码）
const twoFAInfo = await ssoClient.setupTwoFactor();
// twoFAInfo.qrCode, twoFAInfo.secret, twoFAInfo.backupCodes

// 启用2FA
await ssoClient.enableTwoFactor({ secret, backupCodes, token });

// 验证2FA（TOTP或备用码）
await ssoClient.verifyTwoFactor({ token });
await ssoClient.verifyTwoFactor({ backupCode });

// 禁用2FA
await ssoClient.disableTwoFactor({ token });

// 获取2FA设置
const settings = await ssoClient.getTwoFactorSettings();

// 重新生成备用码
await ssoClient.regenerateBackupCodes({ token });
```

### 8. 邮箱验证

```tsx
// 发送验证邮件
await ssoClient.sendVerificationEmail({ email: 'user@example.com' });

// 验证邮箱
await ssoClient.verifyEmail({ email: 'user@example.com', token: 'xxxx' });

// 重新发送验证邮件
await ssoClient.resendVerificationEmail({ email: 'user@example.com' });

// 检查邮箱验证状态
const status = await ssoClient.checkEmailVerificationStatus('user@example.com');
```

### 9. 密码重置

```tsx
// 请求密码重置
await ssoClient.forgotPassword({ email: 'user@example.com' });

// 验证重置令牌
await ssoClient.verifyResetToken({ email: 'user@example.com', token: 'xxxx' });

// 重置密码
await ssoClient.resetPassword({ email: 'user@example.com', token: 'xxxx', newPassword: 'newpass' });

// 检查密码强度
const strength = await ssoClient.validatePassword({ password: 'password123' });
```

## 完整示例

### App.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { SSOClient } from '@your-org/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await ssoClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('用户未登录');
    }
  };

  const handleSSOLogin = (providerId: string) => {
    ssoClient.login({ providerId });
  };

  const handleLocalLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const user = await ssoClient.loginWithPassword({ email, password });
      if (user) {
        setUser(user);
        setShowLogin(false);
      }
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const user = await ssoClient.register({ email, password, name });
      if (user) {
        setUser(user);
        setShowRegister(false);
      }
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ssoClient.logout();
    setUser(null);
  };

  // 检查是否在回调页面
  if (window.location.pathname === '/callback') {
    return <CallbackPage />;
  }

  return (
    <div>
      <header>
        <h1>我的应用</h1>
        {user && (
          <div>
            <span>欢迎, {user.name}!</span>
            <span>登录方式: {user.loginType}</span>
            <button onClick={handleLogout}>登出</button>
          </div>
        )}
      </header>

      <main>
        {!user ? (
          <div>
            <h2>请登录或注册</h2>
            
            {/* SSO登录 */}
            <div>
              <h3>第三方登录</h3>
              <button onClick={() => handleSSOLogin('google')}>
                使用Google登录
              </button>
              <button onClick={() => handleSSOLogin('github')}>
                使用GitHub登录
              </button>
            </div>

            {/* 传统登录 */}
            <div>
              <h3>邮箱密码登录</h3>
              <button onClick={() => setShowLogin(!showLogin)}>
                {showLogin ? '隐藏登录' : '显示登录'}
              </button>
              {showLogin && (
                <LoginForm onSubmit={handleLocalLogin} loading={loading} />
              )}
            </div>

            {/* 用户注册 */}
            <div>
              <h3>用户注册</h3>
              <button onClick={() => setShowRegister(!showRegister)}>
                {showRegister ? '隐藏注册' : '显示注册'}
              </button>
              {showRegister && (
                <RegisterForm onSubmit={handleRegister} loading={loading} />
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2>用户信息</h2>
            <p>姓名: {user.name}</p>
            <p>邮箱: {user.email}</p>
            <p>ID: {user.id}</p>
            <p>登录方式: {user.loginType}</p>
          </div>
        )}
      </main>
    </div>
  );
}

// 登录表单组件
function LoginForm({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void, loading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

// 注册表单组件
function RegisterForm({ onSubmit, loading }: { onSubmit: (email: string, password: string, name: string) => void, loading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  );
}

// 回调页面组件
function CallbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      await ssoClient.handleCallback({
        providerId: 'google',
        onSuccess: (user) => {
          console.log('登录成功:', user);
          window.location.href = '/';
        },
        onError: (error) => {
          setError(error.message);
        }
      });
    } catch (error) {
      setError('回调处理失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>正在处理登录...</div>;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return <div>登录成功，正在跳转...</div>;
}

export default App;
```

## 路由配置

### React Router 示例

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SSOClient } from '@your-org/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await ssoClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // 用户未登录
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 配置选项

### SSOClient 配置

```tsx
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',        // SSO服务地址
  redirectUri: 'http://localhost:3000/callback',  // 回调地址
  storage: 'localStorage',                        // 存储方式: 'localStorage' | 'sessionStorage' | 'memory'
  autoRefresh: true,                              // 自动刷新令牌
  refreshThreshold: 300,                          // 刷新阈值（秒）
  onAuthChange: (user) => {                       // 认证状态变化回调
    console.log('认证状态变化:', user);
  },
  onError: (error) => {                           // 错误回调
    console.error('SSO错误:', error);
  }
});
```

## 错误处理

```tsx
const handleLogin = async (email: string, password: string) => {
  try {
    setLoading(true);
    const user = await ssoClient.loginWithPassword({ email, password });
    if (user) {
      console.log('登录成功:', user);
    } else {
      setError('登录失败');
    }
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      setError('网络连接失败，请检查网络设置');
    } else if (error.code === 'INVALID_CREDENTIALS') {
      setError('邮箱或密码错误');
    } else if (error.code === 'ACCOUNT_LOCKED') {
      setError('账户已被锁定，请稍后再试');
    } else {
      setError('登录失败，请稍后重试');
    }
  } finally {
    setLoading(false);
  }
};
```

## 最佳实践

1. **错误处理**: 始终包装SSO操作在try-catch块中
2. **加载状态**: 为用户提供清晰的加载反馈
3. **路由保护**: 使用受保护的路由组件
4. **令牌管理**: 利用自动刷新功能
5. **用户体验**: 提供清晰的错误信息和重试选项
6. **混合登录**: 支持SSO和传统登录并存，提供多种登录选择
7. **表单验证**: 在客户端进行基本的表单验证
8. **安全考虑**: 不要在客户端存储敏感信息

## 注意事项

- 确保在生产环境中使用HTTPS
- 正确配置CORS和回调URL
- 处理令牌过期和刷新
- 考虑多标签页的认证状态同步
- 实现适当的错误边界处理
- 支持渐进式增强，优先使用SSO，降级到传统登录 