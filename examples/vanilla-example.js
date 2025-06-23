// 原生JavaScript使用示例
// import { SSOClient } from '@tjsglion/sso-client-sdk';

// 模拟的 SSOClient（实际使用时从 SDK 导入）
class SSOClient {
  constructor(config) {
    this.config = config;
    this.providers = [
      { id: 'github', name: 'GitHub', type: 'oauth' },
      { id: 'google', name: 'Google', type: 'oauth' },
      { id: 'microsoft', name: 'Microsoft', type: 'oauth' }
    ];
  }

  async getProviders() {
    return this.providers;
  }

  async getCurrentUser() {
    return null; // 模拟未登录状态
  }

  async login(options) {
    console.log(`登录到 ${options.providerId}`);
    // 实际实现会跳转到 OAuth 页面
  }

  logout() {
    console.log('登出');
  }

  async handleCallback(options) {
    console.log('处理回调');
    return null;
  }

  onAuthChange(callback) {
    this.authCallback = callback;
  }
}

// 创建SSO客户端
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback',
  storage: 'localStorage',
  autoRefresh: true,
  refreshThreshold: 300,
  onAuthChange: (user) => {
    console.log('认证状态变化:', user);
    updateUI();
  },
  onError: (error) => {
    console.error('SSO错误:', error);
    showError(error.message);
  }
});

// DOM元素
const loginContainer = document.getElementById('login-container');
const userContainer = document.getElementById('user-container');
const errorContainer = document.getElementById('error-container');
const loadingContainer = document.getElementById('loading-container');

// 状态
let currentUser = null;
let isAuthenticated = false;
let providers = [];

// 初始化
async function init() {
  try {
    showLoading(true);
    
    // 获取提供商列表
    providers = await ssoClient.getProviders();
    
    // 检查当前用户
    currentUser = await ssoClient.getCurrentUser();
    isAuthenticated = !!currentUser;
    
    updateUI();
  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

// 更新UI
function updateUI() {
  if (isAuthenticated && currentUser) {
    showUserInfo();
  } else {
    showLoginOptions();
  }
}

// 显示用户信息
function showUserInfo() {
  loginContainer.style.display = 'none';
  userContainer.style.display = 'block';
  errorContainer.style.display = 'none';
  
  userContainer.innerHTML = `
    <h2>欢迎, ${currentUser.name}!</h2>
    <p>邮箱: ${currentUser.email}</p>
    <p>登录方式: ${currentUser.provider}</p>
    <button onclick="logout()" class="logout-btn">登出</button>
  `;
}

// 显示登录选项
function showLoginOptions() {
  loginContainer.style.display = 'block';
  userContainer.style.display = 'none';
  errorContainer.style.display = 'none';
  
  const providersHtml = providers
    .map(provider => `
      <button 
        onclick="login('${provider.id}')" 
        ${!provider.isActive ? 'disabled' : ''}
        class="login-btn"
      >
        <span class="provider-name">${provider.name.charAt(0).toUpperCase()}</span>
        使用 ${provider.name} 登录
      </button>
    `)
    .join('');
  
  loginContainer.innerHTML = `
    <h2>选择登录方式</h2>
    <div class="providers">
      ${providersHtml}
    </div>
  `;
}

// 显示错误
function showError(message) {
  errorContainer.style.display = 'block';
  errorContainer.innerHTML = `
    <div class="error">
      错误: ${message}
    </div>
  `;
}

// 显示加载状态
function showLoading(show) {
  loadingContainer.style.display = show ? 'block' : 'none';
}

// 登录方法
function login(providerId) {
  ssoClient.login({
    providerId,
    redirectTo: '/dashboard'
  });
}

// 登出方法
function logout() {
  ssoClient.logout();
  currentUser = null;
  isAuthenticated = false;
  updateUI();
}

// 处理OAuth回调
async function handleCallback() {
  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    try {
      showLoading(true);
      
      const user = await ssoClient.handleCallback({
        providerId: 'google', // 从URL或其他地方获取
        onSuccess: (user) => {
          console.log('登录成功:', user);
          // 可以在这里更新全局状态
        },
        onError: (error) => {
          console.error('登录失败:', error);
          showError(error.message);
        },
        redirectTo: '/dashboard'
      });
      
      if (user) {
        currentUser = user;
        isAuthenticated = true;
        updateUI();
      }
    } catch (error) {
      showError(error.message);
    } finally {
      showLoading(false);
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  init();
  handleCallback();
});

// 监听认证状态变化
ssoClient.onAuthChange((state) => {
  console.log('认证状态变化:', state);
  
  if (state.isAuthenticated) {
    // 用户已登录
    currentUser = state.user;
    isAuthenticated = true;
    updateUI();
  } else {
    // 用户已登出
    currentUser = null;
    isAuthenticated = false;
    updateUI();
  }
});

// 导出到全局作用域（用于HTML中的onclick）
window.login = login;
window.logout = logout;

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .providers {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 320px;
  }

  .login-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .login-btn:hover {
    background: #f9fafb;
  }

  .provider-name {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #6B7280;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }

  .error {
    color: red;
    padding: 1rem;
    border: 1px solid red;
    border-radius: 4px;
    margin: 1rem 0;
  }

  .logout-btn {
    background-color: #dc3545;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .logout-btn:hover {
    background-color: #c82333;
  }
`;
document.head.appendChild(style); 