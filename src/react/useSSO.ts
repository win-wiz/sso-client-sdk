// React Hook for SSO Client
// 注意：使用此Hook需要安装React依赖

import { SSOClient } from '../core/SSOClient.js';
import { 
  SSOClientConfig, 
  User, 
  AuthState, 
  LoginOptions, 
  LocalLoginOptions, 
  RegisterOptions,
  TwoFactorSetupOptions,
  TwoFactorEnableOptions,
  TwoFactorVerifyOptions,
  TwoFactorDisableOptions,
  TwoFactorRegenerateOptions,
  TwoFactorSettings,
  EmailVerificationOptions,
  EmailVerifyOptions,
  EmailResendOptions,
  ForgotPasswordOptions,
  VerifyResetTokenOptions,
  ResetPasswordOptions,
  ValidatePasswordOptions,
  PasswordValidationResult,
  CallbackOptions 
} from '../types/index.js';

// 检查是否在React环境中
const isReactAvailable = typeof window !== 'undefined' && 'React' in window;

// 简化的React Hook实现
export function useSSO(config?: SSOClientConfig) {
  // 如果没有提供配置，使用默认配置
  const defaultConfig: SSOClientConfig = {
    baseUrl: 'https://your-sso-service.com',
    redirectUri: 'http://localhost:3000/callback',
    ...config
  };
  
  const client = new SSOClient(defaultConfig);
  
  return {
    // 状态
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
    
    // SSO方法
    getProviders: client.getProviders.bind(client),
    login: client.login.bind(client),
    handleCallback: client.handleCallback.bind(client),
    
    // 传统登录方法
    loginWithPassword: client.loginWithPassword.bind(client),
    register: client.register.bind(client),
    
    // 2FA相关方法
    setupTwoFactor: client.setupTwoFactor.bind(client),
    enableTwoFactor: client.enableTwoFactor.bind(client),
    verifyTwoFactor: client.verifyTwoFactor.bind(client),
    disableTwoFactor: client.disableTwoFactor.bind(client),
    getTwoFactorSettings: client.getTwoFactorSettings.bind(client),
    regenerateBackupCodes: client.regenerateBackupCodes.bind(client),
    
    // 邮箱验证方法
    sendVerificationEmail: client.sendVerificationEmail.bind(client),
    verifyEmail: client.verifyEmail.bind(client),
    resendVerificationEmail: client.resendVerificationEmail.bind(client),
    checkEmailVerificationStatus: client.checkEmailVerificationStatus.bind(client),
    
    // 密码重置方法
    forgotPassword: client.forgotPassword.bind(client),
    verifyResetToken: client.verifyResetToken.bind(client),
    resetPassword: client.resetPassword.bind(client),
    validatePassword: client.validatePassword.bind(client),
    
    // 通用方法
    getCurrentUser: client.getCurrentUser.bind(client),
    logout: client.logout.bind(client),
    refreshToken: client.refreshToken.bind(client),
    onAuthChange: client.onAuthChange.bind(client),
    
    // 客户端实例
    client
  };
}

// 导出React Hook的完整实现（需要React环境）
export function createReactHook() {
  // 这个函数返回真正的React Hook实现
  // 需要在有React的环境中调用
  return function useSSOReact(config?: SSOClientConfig) {
    // React Hook的完整实现
    // 这里需要React的useState, useEffect等
    throw new Error('请在React环境中使用此Hook');
  };
}

// 导出SSOProvider组件（简化版本）
export function SSOProvider({ 
  children, 
  ...config 
}: SSOClientConfig & { children: any }) {
  // 简化版本的Provider组件
  return children;
} 