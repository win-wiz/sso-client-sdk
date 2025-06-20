import { 
  SSOClientConfig, 
  SSOProvider, 
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
  CallbackOptions,
  ApiResponse,
  TokenInfo,
  LoginResult,
  SSOError,
  SSOEvent,
  EventListener
} from '../types/index.js';
import { createSSOError, fetchWithRetry, SimpleCache, isValidEmail, validatePasswordStrength } from '../utils/index.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { ErrorReporter } from './ErrorReporter.js';
import { TabSync } from './TabSync.js';
import { OfflineManager } from './OfflineManager.js';
import { PluginManager } from './PluginManager.js';

// 存储接口
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// 内存存储实现
class MemoryStorage implements Storage {
  private data: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }
}

export class SSOClient {
  private config: SSOClientConfig;
  private storage: Storage;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };
  private refreshTimer?: NodeJS.Timeout;
  private cache: SimpleCache;
  
  // 企业级功能
  private performanceMonitor: PerformanceMonitor;
  private errorReporter: ErrorReporter;
  private tabSync: TabSync;
  private offlineManager: OfflineManager;
  private pluginManager: PluginManager;
  
  // 事件系统
  private eventListeners: Map<string, EventListener[]> = new Map();

  constructor(config: SSOClientConfig) {
    this.config = {
      storage: 'localStorage',
      autoRefresh: true,
      refreshThreshold: 300, // 5分钟
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['500', '502', '503', '504', '429']
      },
      timeout: 10000,
      debug: false,
      cache: {
        enabled: true,
        ttl: 300,
        maxSize: 100
      },
      performance: {
        enabled: false,
        sampleRate: 1.0,
        maxEvents: 100
      },
      errorReporting: {
        enabled: false,
        sampleRate: 1.0
      },
      tabSync: {
        enabled: false,
        channel: 'sso-sync'
      },
      offline: {
        enabled: false,
        maxQueueSize: 50,
        retryInterval: 5000
      },
      plugins: [],
      ...config
    };

    // 初始化存储
    this.storage = this.initStorage();
    
    // 初始化缓存
    this.cache = new SimpleCache(this.config.cache!);
    
    // 初始化企业级功能
    this.performanceMonitor = new PerformanceMonitor(this.config.performance!);
    this.errorReporter = new ErrorReporter(this.config.errorReporting!);
    this.tabSync = new TabSync(this.config.tabSync!);
    this.offlineManager = new OfflineManager(this.config.offline!);
    this.pluginManager = new PluginManager(this);
    
    // 安装插件
    if (this.config.plugins) {
      this.config.plugins.forEach(plugin => {
        this.pluginManager.install(plugin);
      });
    }
    
    // 初始化认证状态
    this.initAuthState();
  }

  // 错误转换辅助函数
  private convertToSSOError(error: any, defaultCode: string = 'UNKNOWN_ERROR'): SSOError {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as SSOError;
    }
    
    const message = error?.message || error?.toString() || '未知错误';
    return createSSOError(message, defaultCode);
  }

  // 性能监控包装器
  private async withPerformanceMonitoring<T>(
    type: 'login' | 'logout' | 'refresh' | 'api_call',
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operation();
      this.performanceMonitor.record(type, Date.now() - startTime, true, undefined, metadata);
      return result;
    } catch (error) {
      const ssoError = this.convertToSSOError(error);
      this.performanceMonitor.record(type, Date.now() - startTime, false, ssoError.code, metadata);
      throw ssoError;
    }
  }

  // 事件系统
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    const eventData: SSOEvent = {
      type: event,
      data,
      timestamp: Date.now()
    };

    listeners.forEach(listener => {
      try {
        listener.handler(eventData);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });

    // 移除一次性监听器
    const remainingListeners = listeners.filter(listener => !listener.once);
    this.eventListeners.set(event, remainingListeners);
  }

  /**
   * 添加事件监听器
   */
  on(event: string, handler: (event: SSOEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listener: EventListener = { event, handler };
    this.eventListeners.get(event)!.push(listener);
    
    // 返回取消监听的函数
    return () => {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * 添加一次性事件监听器
   */
  once(event: string, handler: (event: SSOEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listener: EventListener = { event, handler, once: true };
    this.eventListeners.get(event)!.push(listener);
    
    return () => {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private initStorage(): Storage {
    switch (this.config.storage) {
      case 'localStorage':
        return typeof window !== 'undefined' ? window.localStorage : new MemoryStorage();
      case 'sessionStorage':
        return typeof window !== 'undefined' ? window.sessionStorage : new MemoryStorage();
      case 'memory':
      default:
        return new MemoryStorage();
    }
  }

  private initAuthState(): void {
    // 从存储中恢复令牌
    const token = this.storage.getItem('sso_token');
    if (token) {
      this.validateToken(token);
    }
  }

  // 获取SSO提供商列表
  async getProviders(): Promise<SSOProvider[]> {
    return this.withPerformanceMonitoring('api_call', async () => {
      try {
        // 检查缓存
        const cached = this.cache.get('providers');
        if (cached) {
          return cached;
        }

        const response = await fetchWithRetry(
          `${this.config.baseUrl}/sso/providers`,
          { method: 'GET' },
          this.config.retry!
        );
        
        const result: ApiResponse<SSOProvider[]> = await response.json();
        
        if (result.code === 200 && result.data) {
          // 缓存结果
          this.cache.set('providers', result.data, 300);
          return result.data;
        }
        throw createSSOError(result.message || '获取提供商失败', 'PROVIDERS_FETCH_ERROR');
      } catch (error) {
        this.handleError(this.convertToSSOError(error, 'PROVIDERS_FETCH_ERROR'));
        throw error;
      }
    }, { endpoint: '/sso/providers' });
  }

  // 跳转到SSO登录
  login(options: LoginOptions): void {
    const { providerId, redirectTo, state } = options;
    
    // 保存重定向地址
    if (redirectTo) {
      this.storage.setItem('sso_redirect_after_login', redirectTo);
    }

    // 生成state参数
    const loginState = state || this.generateState();
    this.storage.setItem('sso_state', loginState);

    // 跳转到登录页面
    const loginUrl = `${this.config.baseUrl}/sso/login/${providerId}?state=${loginState}`;
    window.location.href = loginUrl;
  }

  // 传统邮箱密码登录
  async loginWithPassword(options: LocalLoginOptions): Promise<User | null> {
    return this.withPerformanceMonitoring('login', async () => {
      try {
        this.setLoading(true);
        this.clearError();

        const { email, password } = options;

        // 客户端验证
        if (!isValidEmail(email)) {
          throw createSSOError('邮箱格式不正确', 'INVALID_EMAIL');
        }

        const response = await fetchWithRetry(
          `${this.config.baseUrl}/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { email, password }
          },
          this.config.retry!
        );

        const result: ApiResponse<LoginResult> = await response.json();

        if (result.code === 200 && result.data) {
          const { user, token } = result.data;
          
          // 保存令牌
          this.saveToken(token);
          
          // 更新认证状态
          this.updateAuthState(user, true);
          
          // 广播标签页同步事件
          this.tabSync.broadcast('login', user.id);
          
          // 触发事件
          this.emit('login', { user, method: 'password' });
          
          return user;
        } else {
          throw createSSOError(result.message || '登录失败', 'LOGIN_ERROR');
        }
      } catch (error) {
        this.handleError(this.convertToSSOError(error, 'LOGIN_ERROR'));
        return null;
      } finally {
        this.setLoading(false);
      }
    }, { method: 'password', email: options.email });
  }

  // 用户注册
  async register(options: RegisterOptions): Promise<User | null> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email, password, name } = options;

      // 客户端验证
      if (!isValidEmail(email)) {
        throw createSSOError('邮箱格式不正确', 'INVALID_EMAIL');
      }

      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw createSSOError(
          `密码强度不足: ${passwordValidation.feedback.join(', ')}`,
          'WEAK_PASSWORD'
        );
      }

      const response = await fetchWithRetry(
        `${this.config.baseUrl}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { email, password, name }
        },
        this.config.retry!
      );

      const result: ApiResponse<LoginResult> = await response.json();

      if (result.code === 200 && result.data) {
        const { user, token } = result.data;
        
        // 保存令牌
        this.saveToken(token);
        
        // 更新认证状态
        this.updateAuthState(user, true);
        
        return user;
      } else {
        throw createSSOError(result.message || '注册失败', 'REGISTER_ERROR');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'REGISTER_ERROR'));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // ==================== 2FA 相关方法 ====================

  // 设置2FA
  async setupTwoFactor(): Promise<TwoFactorSettings | null> {
    try {
      this.setLoading(true);
      this.clearError();

      const token = this.storage.getItem('sso_token');
      if (!token) {
        throw new Error('用户未登录');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result: ApiResponse<TwoFactorSettings> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '2FA设置失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, '2FA_SETUP_ERROR'));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // 启用2FA
  async enableTwoFactor(options: TwoFactorEnableOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { secret, backupCodes, token } = options;
      const authToken = this.storage.getItem('sso_token');
      
      if (!authToken) {
        throw new Error('用户未登录');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret, backupCodes, token }),
      });

      const result: ApiResponse<{ enabled: boolean }> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data.enabled;
      } else {
        throw new Error(result.message || '2FA启用失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, '2FA_ENABLE_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 验证2FA
  async verifyTwoFactor(options: TwoFactorVerifyOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { token, backupCode } = options;
      const authToken = this.storage.getItem('sso_token');
      
      if (!authToken) {
        throw new Error('用户未登录');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, backupCode }),
      });

      const result: ApiResponse<{ verified: boolean }> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data.verified;
      } else {
        throw new Error(result.message || '2FA验证失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, '2FA_VERIFY_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 禁用2FA
  async disableTwoFactor(options: TwoFactorDisableOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { token } = options;
      const authToken = this.storage.getItem('sso_token');
      
      if (!authToken) {
        throw new Error('用户未登录');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result: ApiResponse<{ enabled: boolean }> = await response.json();

      if (result.code === 200 && result.data) {
        return !result.data.enabled;
      } else {
        throw new Error(result.message || '2FA禁用失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, '2FA_DISABLE_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 获取2FA设置
  async getTwoFactorSettings(): Promise<TwoFactorSettings | null> {
    try {
      this.setLoading(true);
      this.clearError();

      const token = this.storage.getItem('sso_token');
      if (!token) {
        throw new Error('用户未登录');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/2fa/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<TwoFactorSettings> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '获取2FA设置失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, '2FA_SETTINGS_FETCH_ERROR'));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // 重新生成备用码
  async regenerateBackupCodes(options: TwoFactorRegenerateOptions): Promise<TwoFactorSettings | null> {
    try {
      this.setLoading(true);
      this.clearError();

      const { token } = options;
      const authToken = this.storage.getItem('sso_token');
      
      if (!authToken) {
        throw new Error('用户未登录');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/2fa/regenerate-backup-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result: ApiResponse<TwoFactorSettings> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '备用码重新生成失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, '2FA_BACKUP_CODES_REGENERATE_ERROR'));
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // ==================== 邮箱验证相关方法 ====================

  // 发送验证邮件
  async sendVerificationEmail(options: EmailVerificationOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/email-verification/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result: ApiResponse<{ email: string }> = await response.json();

      if (result.code === 200 && result.data) {
        return true;
      } else {
        throw new Error(result.message || '发送验证邮件失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'EMAIL_VERIFICATION_SEND_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 验证邮箱
  async verifyEmail(options: EmailVerifyOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email, token } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/email-verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      });

      const result: ApiResponse<{ email: string; verified: boolean }> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data.verified;
      } else {
        throw new Error(result.message || '邮箱验证失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'EMAIL_VERIFICATION_VERIFY_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 重新发送验证邮件
  async resendVerificationEmail(options: EmailResendOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/email-verification/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result: ApiResponse<{ email: string }> = await response.json();

      if (result.code === 200 && result.data) {
        return true;
      } else {
        throw new Error(result.message || '重新发送验证邮件失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'EMAIL_VERIFICATION_RESEND_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 检查邮箱验证状态
  async checkEmailVerificationStatus(email: string): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const response = await fetch(`${this.config.baseUrl}/auth/email-verification/status/${encodeURIComponent(email)}`);

      const result: ApiResponse<{ email: string; verified: boolean }> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data.verified;
      } else {
        throw new Error(result.message || '获取验证状态失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'EMAIL_VERIFICATION_STATUS_FETCH_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // ==================== 密码重置相关方法 ====================

  // 请求密码重置
  async forgotPassword(options: ForgotPasswordOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/password-reset/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result: ApiResponse<{ email: string }> = await response.json();

      if (result.code === 200 && result.data) {
        return true;
      } else {
        throw new Error(result.message || '请求密码重置失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'PASSWORD_RESET_FORGOT_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 验证重置令牌
  async verifyResetToken(options: VerifyResetTokenOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email, token } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/password-reset/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      });

      const result: ApiResponse<{ email: string; valid: boolean }> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data.valid;
      } else {
        throw new Error(result.message || '验证重置令牌失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'PASSWORD_RESET_VERIFY_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 重置密码
  async resetPassword(options: ResetPasswordOptions): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      const { email, token, newPassword } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/password-reset/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const result: ApiResponse<{ email: string }> = await response.json();

      if (result.code === 200 && result.data) {
        return true;
      } else {
        throw new Error(result.message || '密码重置失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'PASSWORD_RESET_RESET_ERROR'));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 验证密码强度
  async validatePassword(options: ValidatePasswordOptions): Promise<PasswordValidationResult> {
    try {
      this.setLoading(true);
      this.clearError();

      const { password } = options;

      const response = await fetch(`${this.config.baseUrl}/auth/password-reset/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result: ApiResponse<PasswordValidationResult> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '密码强度验证失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'PASSWORD_RESET_VALIDATE_ERROR'));
      return { isValid: false, errors: ['验证失败'] };
    } finally {
      this.setLoading(false);
    }
  }

  // 处理OAuth回调
  async handleCallback(options: CallbackOptions): Promise<User | null> {
    const { providerId, onSuccess, onError, redirectTo } = options;
    
    try {
      this.setLoading(true);

      // 获取URL参数
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw createSSOError(`OAuth错误: ${error}`, 'OAUTH_ERROR');
      }

      if (!code) {
        throw createSSOError('缺少授权码', 'MISSING_CODE');
      }

      // 验证state参数
      const savedState = this.storage.getItem('sso_state');
      if (state !== savedState) {
        throw createSSOError('State参数不匹配', 'STATE_MISMATCH');
      }

      // 处理回调
      const response = await fetchWithRetry(
        `${this.config.baseUrl}/sso/callback/${providerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { code, state }
        },
        this.config.retry!
      );

      const result: ApiResponse<{ user: User; token: string }> = await response.json();

      if (result.code === 200 && result.data) {
        const { user, token } = result.data;
        
        // 保存令牌
        this.saveToken(token);
        
        // 更新认证状态
        this.updateAuthState(user, true);
        
        // 清理临时数据
        this.storage.removeItem('sso_state');
        
        // 调用成功回调
        if (onSuccess) {
          onSuccess(user);
        }

        // 重定向
        const redirectAfterLogin = this.storage.getItem('sso_redirect_after_login');
        const finalRedirect = redirectTo || redirectAfterLogin || '/';
        
        if (redirectAfterLogin) {
          this.storage.removeItem('sso_redirect_after_login');
        }

        window.location.href = finalRedirect;
        
        return user;
      } else {
        throw createSSOError(result.message || '登录失败', 'CALLBACK_ERROR');
      }
    } catch (error) {
      const ssoError = error instanceof Error ? 
        createSSOError(error.message, 'CALLBACK_ERROR') : 
        createSSOError('回调处理失败', 'CALLBACK_ERROR');
      
      this.handleError(ssoError);
      if (onError) {
        onError(ssoError);
      }
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.storage.getItem('sso_token');
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.config.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<{ user: User }> = await response.json();

      if (result.code === 200 && result.data) {
        const user = result.data.user;
        this.updateAuthState(user, true);
        return user;
      } else if (result.code === 401) {
        // 令牌无效，清除认证状态
        this.logout();
        return null;
      } else {
        throw new Error(result.message || '获取用户信息失败');
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'USER_INFO_FETCH_ERROR'));
      return null;
    }
  }

  // 验证令牌
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse = await response.json();

      if (result.code === 200) {
        // 令牌有效，获取用户信息
        await this.getCurrentUser();
        return true;
      } else {
        // 令牌无效
        this.logout();
        return false;
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'TOKEN_VALIDATION_ERROR'));
      return false;
    }
  }

  // 刷新令牌
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.storage.getItem('sso_refresh_token');
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${this.config.baseUrl}/sso/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result: ApiResponse<TokenInfo> = await response.json();

      if (result.code === 200 && result.data) {
        const { token, refreshToken: newRefreshToken, expiresAt } = result.data;
        
        // 保存新令牌
        this.saveToken(token);
        if (newRefreshToken) {
          this.storage.setItem('sso_refresh_token', newRefreshToken);
        }
        
        return token;
      } else {
        // 刷新失败，清除认证状态
        this.logout();
        return null;
      }
    } catch (error) {
      this.handleError(this.convertToSSOError(error, 'TOKEN_REFRESH_ERROR'));
      return null;
    }
  }

  // 登出
  logout(): void {
    try {
      // 调用后端登出接口
      const token = this.storage.getItem('sso_token');
      if (token) {
        fetch(`${this.config.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {
          // 忽略登出API错误
        });
      }
    } catch (error) {
      // 忽略错误
    } finally {
      // 清除存储的令牌
      this.storage.removeItem('sso_token');
      this.storage.removeItem('sso_refresh_token');
      this.storage.removeItem('sso_state');
      this.storage.removeItem('sso_redirect_after_login');

      // 清除定时器
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }

      // 更新认证状态
      this.updateAuthState(null, false);

      // 重定向到登录页面
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  // 获取认证状态
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // 监听认证状态变化
  onAuthChange(callback: (state: AuthState) => void): () => void {
    // 这里可以实现一个简单的事件系统
    // 为了简化，我们返回一个空函数
    return () => {};
  }

  // 生成随机state参数
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // 保存令牌
  private saveToken(token: string): void {
    this.storage.setItem('sso_token', token);
    
    // 设置自动刷新
    if (this.config.autoRefresh) {
      this.setupAutoRefresh();
    }
  }

  // 设置自动刷新
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const threshold = this.config.refreshThreshold || 300;
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, threshold * 1000);
  }

  // 更新认证状态
  private updateAuthState(user: User | null, isAuthenticated: boolean): void {
    this.authState = {
      user,
      isAuthenticated,
      isLoading: false,
      error: null
    };

    // 调用配置的回调
    if (this.config.onAuthChange) {
      this.config.onAuthChange(user);
    }
  }

  // 设置加载状态
  private setLoading(isLoading: boolean): void {
    this.authState.isLoading = isLoading;
  }

  // 清除错误
  private clearError(): void {
    this.authState.error = null;
  }

  // 处理错误
  private handleError(error: SSOError): void {
    this.authState.error = error.message;
    
    // 错误上报
    this.errorReporter.report(error, this.authState.user?.id);
    
    if (this.config.debug) {
      console.error('[SSO Client Debug]', error);
    }
    
    if (this.config.onError) {
      this.config.onError(error);
    }
    
    // 触发错误事件
    this.emit('error', error);
  }

  // 获取企业级功能实例
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  getErrorReporter(): ErrorReporter {
    return this.errorReporter;
  }

  getTabSync(): TabSync {
    return this.tabSync;
  }

  getOfflineManager(): OfflineManager {
    return this.offlineManager;
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  // 销毁客户端
  destroy(): void {
    // 清除定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // 销毁企业级功能
    this.tabSync.destroy();
    this.offlineManager.destroy();
    this.pluginManager.clear();
    
    // 清除事件监听器
    this.eventListeners.clear();
    
    // 清除缓存
    this.cache.clear();
  }
} 