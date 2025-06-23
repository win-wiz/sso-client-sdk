import React, { useState, useEffect } from 'react';
import { SSOClient } from '../src';
import type { SSOProvider, User } from '../src/types';

// 初始化SSO客户端
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback',
  storage: 'localStorage',
  autoRefresh: true,
  refreshThreshold: 300,
  onAuthChange: (user) => {
    console.log('认证状态变化:', user);
  },
  onError: (error) => {
    console.error('SSO错误:', error);
  }
});

// 简化的图标组件
const SSOIcon = ({ provider, size = 24 }: { provider: SSOProvider; size?: number }) => {
  if (provider.iconSvg) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: provider.iconBackgroundColor || '#FFFFFF',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: provider.iconSvg }}
        title={`${provider.name} Login`}
      />
    );
  }

  const letter = provider.name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#6B7280',
        color: 'white',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      }}
      title={`${provider.name} Login`}
    >
      {letter}
    </div>
  );
};

// 登录按钮组件
const LoginButtons: React.FC = () => {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 获取可用的SSO提供商
      const availableProviders = await ssoClient.getProviders();
      setProviders(availableProviders);
    } catch (err) {
      setError('获取登录提供商失败');
      console.error('Failed to fetch providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (providerId: string) => {
    try {
      await ssoClient.login({ providerId });
    } catch (err) {
      setError('登录失败');
      console.error('Login failed:', err);
    }
  };

  if (isLoading) {
    return <div>正在加载登录选项...</div>;
  }

  if (error) {
    return (
      <div>
        <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>
        <button onClick={loadProviders}>重试</button>
      </div>
    );
  }

  return (
    <div className="sso-buttons-container">
      <h3>选择登录方式</h3>
      {providers.map(provider => (
        <button
          key={provider.id}
          className="sso-login-button"
          onClick={() => handleLogin(provider.id)}
          disabled={!provider.isActive}
        >
          <SSOIcon provider={provider} size={24} />
          <span>使用 {provider.name} 登录</span>
        </button>
      ))}

      <style>{`
        .sso-buttons-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 320px;
          padding: 20px;
        }

        .sso-login-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          font-size: 14px;
        }

        .sso-login-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .sso-login-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

// 用户信息组件
const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const currentUser = await ssoClient.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.log('用户未登录');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    ssoClient.logout();
    setUser(null);
  };

  if (isLoading) {
    return <div>检查登录状态...</div>;
  }

  if (!user) {
    return <LoginButtons />;
  }

  return (
    <div className="user-profile">
      <h2>欢迎, {user.name}!</h2>
      <div className="user-info">
        <p><strong>邮箱:</strong> {user.email}</p>
        <p><strong>登录方式:</strong> {user.provider || '未知'}</p>
        {user.image && (
          <img 
            src={user.image} 
            alt={user.name} 
            style={{ width: 48, height: 48, borderRadius: '50%' }}
          />
        )}
      </div>
      <button onClick={handleLogout} className="logout-btn">
        登出
      </button>

      <style>{`
        .user-profile {
          padding: 20px;
          max-width: 400px;
        }

        .user-info {
          margin: 16px 0;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .logout-btn {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .logout-btn:hover {
          background-color: #c82333;
        }
      `}</style>
    </div>
  );
};

// 回调处理组件
const CallbackHandler: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理登录...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const providerId = urlParams.get('provider') || 'google';

      const user = await ssoClient.handleCallback({
        providerId,
        onSuccess: (user) => {
          console.log('登录成功:', user);
          setStatus('success');
          setMessage('登录成功！正在跳转...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        },
        onError: (error) => {
          console.error('登录失败:', error);
          setStatus('error');
          setMessage(`登录失败: ${error.message}`);
        }
      });

      if (user) {
        setStatus('success');
        setMessage('登录成功！正在跳转...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('处理登录回调时发生错误');
      console.error('Callback error:', error);
    }
  };

  return (
    <div className="callback-handler">
      <div className={`status-message ${status}`}>
        {message}
      </div>
      {status === 'error' && (
        <button onClick={() => window.location.href = '/login'}>
          返回登录页面
        </button>
      )}

      <style>{`
        .callback-handler {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 20px;
        }

        .status-message {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
        }

        .status-message.loading {
          background: #e3f2fd;
          color: #1976d2;
        }

        .status-message.success {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .status-message.error {
          background: #ffebee;
          color: #c62828;
        }
      `}</style>
    </div>
  );
};

// 主应用组件
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'callback' | 'dashboard'>('login');

  useEffect(() => {
    if (window.location.pathname === '/callback') {
      setCurrentPage('callback');
    } else if (window.location.pathname === '/dashboard') {
      setCurrentPage('dashboard');
    }
  }, []);

  switch (currentPage) {
    case 'callback':
      return <CallbackHandler />;
    case 'dashboard':
      return <UserProfile />;
    default:
      return <LoginButtons />;
  }
};

export default App; 