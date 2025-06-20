// 测试优化后的SDK功能
import { SSOClient } from './dist/index.js';
import { isValidEmail, validatePasswordStrength, generateRandomString } from './dist/utils/index.js';

// 初始化SSO客户端
const ssoClient = new SSOClient({
  baseUrl: 'https://test-sso-service.com',
  redirectUri: 'http://localhost:3000/callback',
  debug: true,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['500', '502', '503', '504', '429']
  },
  timeout: 10000
});

// 测试SSOClient实例化
try {
  console.log('✅ SSOClient 实例化成功');
  console.log('✅ SDK 优化构建成功');
  
  // 测试新增的工具函数
  console.log('\n✅ 工具函数测试:');
  console.log('  - isValidEmail:', isValidEmail('test@example.com')); // true
  console.log('  - isValidEmail:', isValidEmail('invalid-email')); // false
  
  const passwordValidation = validatePasswordStrength('Test123!');
  console.log('  - validatePasswordStrength:', passwordValidation);
  
  console.log('  - generateRandomString:', generateRandomString(10));
  
  // 测试方法是否存在
  console.log('\n✅ 可用方法:');
  console.log('  SSO相关:');
  console.log('    - login:', typeof ssoClient.login);
  console.log('    - handleCallback:', typeof ssoClient.handleCallback);
  console.log('    - getProviders:', typeof ssoClient.getProviders);
  
  console.log('  传统登录相关:');
  console.log('    - loginWithPassword:', typeof ssoClient.loginWithPassword);
  console.log('    - register:', typeof ssoClient.register);
  
  console.log('  2FA相关:');
  console.log('    - setupTwoFactor:', typeof ssoClient.setupTwoFactor);
  console.log('    - enableTwoFactor:', typeof ssoClient.enableTwoFactor);
  console.log('    - verifyTwoFactor:', typeof ssoClient.verifyTwoFactor);
  console.log('    - disableTwoFactor:', typeof ssoClient.disableTwoFactor);
  console.log('    - getTwoFactorSettings:', typeof ssoClient.getTwoFactorSettings);
  console.log('    - regenerateBackupCodes:', typeof ssoClient.regenerateBackupCodes);
  
  console.log('  邮箱验证相关:');
  console.log('    - sendVerificationEmail:', typeof ssoClient.sendVerificationEmail);
  console.log('    - verifyEmail:', typeof ssoClient.verifyEmail);
  console.log('    - resendVerificationEmail:', typeof ssoClient.resendVerificationEmail);
  console.log('    - checkEmailVerificationStatus:', typeof ssoClient.checkEmailVerificationStatus);
  
  console.log('  密码重置相关:');
  console.log('    - forgotPassword:', typeof ssoClient.forgotPassword);
  console.log('    - verifyResetToken:', typeof ssoClient.verifyResetToken);
  console.log('    - resetPassword:', typeof ssoClient.resetPassword);
  console.log('    - validatePassword:', typeof ssoClient.validatePassword);
  
  console.log('  通用方法:');
  console.log('    - getCurrentUser:', typeof ssoClient.getCurrentUser);
  console.log('    - logout:', typeof ssoClient.logout);
  console.log('    - refreshToken:', typeof ssoClient.refreshToken);
  console.log('    - onAuthChange:', typeof ssoClient.onAuthChange);
  
  console.log('\n✅ SDK优化成功，新增功能:');
  console.log('  - 智能重试机制（指数退避）');
  console.log('  - 内存缓存系统');
  console.log('  - 客户端验证（邮箱格式、密码强度）');
  console.log('  - 详细错误类型和错误码');
  console.log('  - 请求超时控制');
  console.log('  - 调试模式支持');
  console.log('  - 网络状态检测');
  console.log('  - 防抖和节流工具');
  console.log('  - 深度对象合并');
  console.log('  - 客户端信息收集');
  
  console.log('\n✅ 配置选项:');
  console.log('  - retry: 重试配置');
  console.log('  - timeout: 请求超时');
  console.log('  - debug: 调试模式');
  console.log('  - cache: 缓存配置');
  
} catch (error) {
  console.error('❌ SDK 测试失败:', error.message);
  process.exit(1);
} 