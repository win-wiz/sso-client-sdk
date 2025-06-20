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
      <div class="providers">
        <button
          v-for="provider in providers"
          :key="provider.id"
          @click="login(provider.id)"
          :disabled="!provider.isActive"
          class="login-btn"
        >
          使用 {{ provider.name }} 登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { SSOClient } from '@your-org/sso-client';

// 状态
const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(true);
const error = ref(null);
const providers = ref([]);

// SSO客户端
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-server.com',
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
const login = (providerId: string) => {
  ssoClient.login({
    providerId,
    redirectTo: '/dashboard'
  });
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
    const providerList = await ssoClient.getProviders();
    providers.value = providerList;
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

.providers {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 300px;
  margin: 0 auto;
}

.login-btn, .logout-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.login-btn {
  background-color: #007bff;
  color: white;
}

.login-btn:hover {
  background-color: #0056b3;
}

.login-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style> 