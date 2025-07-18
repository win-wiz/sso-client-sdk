// 简单的SDK测试
import { SSOClient } from './dist/index.js';

// 测试SSOClient实例化
try {
  const ssoClient = new SSOClient({
    baseUrl: 'https://test-sso-service.com',
    redirectUri: 'http://localhost:3000/callback'
  });
  
  console.log('✅ SSOClient 实例化成功');
  console.log('✅ SDK 构建成功，可以正常使用');
  
  // 测试方法是否存在
  console.log('✅ 可用方法:');
  console.log('  - login:', typeof ssoClient.login);
  console.log('  - handleCallback:', typeof ssoClient.handleCallback);
  console.log('  - getCurrentUser:', typeof ssoClient.getCurrentUser);
  console.log('  - logout:', typeof ssoClient.logout);
  console.log('  - refreshToken:', typeof ssoClient.refreshToken);
  console.log('  - getProviders:', typeof ssoClient.getProviders);
  
} catch (error) {
  console.error('❌ SDK 测试失败:', error.message);
  process.exit(1);
} 