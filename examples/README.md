# SSO Client SDK 使用示例

## 架构说明

本项目采用了**职责分离**的架构设计：

- **`@tjsglion/sso-client-sdk`**: 纯认证 SDK，负责 SSO 登录逻辑
- **`@tjsglion/sso-icons`**: 独立的图标包，负责 SSO 提供商图标展示

## 安装

### 基础安装（仅认证功能）
```bash
npm install @tjsglion/sso-client-sdk
```

### 完整安装（包含图标）
```bash
npm install @tjsglion/sso-client-sdk @tjsglion/sso-icons
```

## 使用示例

### 1. React 示例

#### 基础用法（无图标）
```tsx
import React from 'react';
import { useSSO } from '@tjsglion/sso-client-sdk';

const LoginButtons: React.FC = () => {
  const { providers, login, isLoading } = useSSO();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => login(provider.id)}
        >
          <span>{provider.name.charAt(0).toUpperCase()}</span>
          Continue with {provider.name}
        </button>
      ))}
    </div>
  );
};
```

#### 完整用法（包含图标）
```tsx
import React from 'react';
import { useSSO } from '@tjsglion/sso-client-sdk';
import { SSOIcon } from '@tjsglion/sso-icons';

const LoginButtons: React.FC = () => {
  const { providers, login, isLoading } = useSSO();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => login(provider.id)}
        >
          <SSOIcon 
            provider={provider}
            size={24}
            className="provider-icon"
          />
          Continue with {provider.name}
        </button>
      ))}
    </div>
  );
};
```

### 2. Vue 示例

#### 基础用法（无图标）
```vue
<template>
  <div>
    <button
      v-for="provider in providers"
      :key="provider.id"
      @click="login(provider.id)"
    >
      <span class="provider-name">{{ provider.name.charAt(0).toUpperCase() }}</span>
      Continue with {{ provider.name }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { SSOClient } from '@tjsglion/sso-client-sdk';

const providers = ref([]);
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

const login = (providerId) => {
  ssoClient.login({ providerId });
};

onMounted(async () => {
  providers.value = await ssoClient.getProviders();
});
</script>
```

#### 完整用法（包含图标）
```vue
<template>
  <div>
    <button
      v-for="provider in providers"
      :key="provider.id"
      @click="login(provider.id)"
    >
      <SSOIcon 
        :provider="provider"
        :size="24"
        class="provider-icon"
      />
      Continue with {{ provider.name }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { SSOClient } from '@tjsglion/sso-client-sdk';
import { SSOIcon } from '@tjsglion/sso-icons';

// ... 其余代码相同
</script>
```

### 3. Vanilla JavaScript 示例

```javascript
import { SSOClient } from '@tjsglion/sso-client-sdk';

const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback'
});

async function init() {
  const providers = await ssoClient.getProviders();
  
  providers.forEach(provider => {
    const button = document.createElement('button');
    button.innerHTML = `
      <span class="provider-name">${provider.name.charAt(0).toUpperCase()}</span>
      使用 ${provider.name} 登录
    `;
    button.onclick = () => ssoClient.login({ providerId: provider.id });
    document.body.appendChild(button);
  });
}

init();
```

## 图标系统

### 支持的提供商
- GitHub
- Google
- Microsoft
- Facebook
- Twitter/X
- Apple
- LinkedIn
- GitLab
- Bitbucket
- Auth0

### 自定义图标
```tsx
import { IconManager } from '@tjsglion/sso-icons';

const provider = {
  id: 'custom',
  name: 'Custom Provider',
  iconSvg: '<svg>...</svg>',
  iconBackgroundColor: '#FF0000',
  iconColor: '#FFFFFF'
};

const iconInfo = IconManager.getIconInfo(provider);
```

### 图标验证
```tsx
import { IconManager } from '@tjsglion/sso-icons';

const isValid = IconManager.validateSvgContent(svgContent);
const sanitized = IconManager.sanitizeSvg(svgContent);
```

## 配置选项

### SSOClient 配置
```typescript
const ssoClient = new SSOClient({
  baseUrl: 'https://your-sso-service.com',
  redirectUri: 'http://localhost:3000/callback',
  storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'
  autoRefresh: true,
  refreshThreshold: 300, // 秒
  onAuthChange: (user) => console.log('用户状态变化:', user),
  onError: (error) => console.error('错误:', error)
});
```

### SSOIcon 配置
```tsx
<SSOIcon 
  provider={provider}
  size={24} // 数字或字符串
  className="custom-class"
  style={{ borderRadius: '8px' }}
  onClick={(e) => console.log('图标点击')}
/>
```

## 最佳实践

1. **按需加载**: 如果不需要图标，只安装 SDK 包
2. **错误处理**: 始终处理认证错误
3. **状态管理**: 使用 SDK 提供的状态管理功能
4. **安全考虑**: 验证自定义 SVG 图标内容
5. **性能优化**: 图标包支持 Tree Shaking

## 迁移指南

### 从旧版本迁移
1. 移除旧的图标相关代码
2. 安装新的图标包（可选）
3. 更新导入语句
4. 使用新的图标组件

### 示例迁移
```tsx
// 旧版本
<button>
  <img src={provider.icon} alt={provider.name} />
  {provider.name}
</button>

// 新版本
<button>
  <SSOIcon provider={provider} size={24} />
  {provider.name}
</button>
``` 