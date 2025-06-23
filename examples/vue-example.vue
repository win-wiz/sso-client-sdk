<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="isLoading">加载中...</div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      错误: {{ error }}
    </div>
    
    <!-- 已登录状态 -->
    <div v-else-if="isAuthenticated && user" class="user-info">
      <h2>欢迎, {{ user.name }}!</h2>
      <p>邮箱: {{ user.email }}</p>
      <p>登录方式: {{ user.provider }}</p>
      <button @click="logout" class="logout-btn">登出</button>
    </div>
    
    <!-- 未登录状态 -->
    <div v-else class="login-section">
      <h2>选择登录方式</h2>
      <div class="sso-buttons-container">
        <button
          v-for="provider in providers"
          :key="provider.id"
          class="sso-login-button"
          @click="login(provider.id)"
        >
          <!-- 方案1：使用图标包（推荐） -->
          <!-- 
          <SSOIcon 
            :provider="provider"
            :size="24"
            class="provider-icon"
          />
          -->
          
          <!-- 方案2：简单文字显示（如果不想使用图标包） -->
          <span class="provider-name">{{ provider.name.charAt(0).toUpperCase() }}</span>
          
          <span>Continue with {{ provider.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 模拟的 SSOClient（实际使用时从 SDK 导入）
class SSOClient {
  constructor(config: any) {
    this.config = config;
  }
  
  async getProviders() {
    return [
      { id: 'github', name: 'GitHub', type: 'oauth' },
      { id: 'google', name: 'Google', type: 'oauth' },
      { id: 'microsoft', name: 'Microsoft', type: 'oauth' }
    ];
  }
  
  async getCurrentUser() {
    return null; // 模拟未登录状态
  }
  
  async login(providerId: string) {
    console.log(`登录到 ${providerId}`);
  }
  
  logout() {
    console.log('登出');
  }
}

// 状态
const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(true);
const error = ref(null);
const providers = ref([]);

// SSO客户端
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback',
  storage: 'localStorage',
  autoRefresh: true,
  refreshThreshold: 300,
  onAuthChange: (newUser) => {
    user.value = newUser;
    isAuthenticated.value = !!newUser;
    console.log('认证状态变化:', newUser);
  },
  onError: (err) => {
    error.value = err.message;
    console.error('SSO错误:', err);
  }
});

// 登录方法
const login = async (providerId: string) => {
  await ssoClient.login(providerId);
};

// 登出方法
const logout = () => {
  ssoClient.logout();
  user.value = null;
  isAuthenticated.value = false;
};

// 获取提供商列表
const loadProviders = async () => {
  try {
    providers.value = await ssoClient.getProviders();
  } catch (err) {
    error.value = err.message;
  }
};

// 初始化
onMounted(async () => {
  try {
    // 获取提供商列表
    await loadProviders();
    
    // 检查当前用户
    const currentUser = await ssoClient.getCurrentUser();
    if (currentUser) {
      user.value = currentUser;
      isAuthenticated.value = true;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.error {
  color: red;
  padding: 1rem;
  border: 1px solid red;
  border-radius: 4px;
  margin: 1rem 0;
}

.user-info {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 1rem 0;
}

.login-section {
  text-align: center;
  padding: 2rem;
}

.sso-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.sso-login-button {
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

.sso-login-button:hover {
  background: #f9fafb;
}

.provider-icon {
  width: 24px;
  height: 24px;
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

.logout-btn {
  background-color: #dc3545;
  color: white;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style> 