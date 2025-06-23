// SSO提供商信息
export interface SSOProvider {
  id: string;
  name: string;
  type: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  iconSvg?: string;
  iconBackgroundColor?: string;
  iconColor?: string;
}

// 用户信息
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified?: string;
  provider?: string;
  loginType?: 'local' | 'sso';
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

// 认证状态
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 错误类型
export interface SSOError extends Error {
  code: string;
  status?: number;
  retryable?: boolean;
  details?: any;
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// SDK配置选项
export interface SSOClientConfig {
  baseUrl: string;
  redirectUri?: string;
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
  autoRefresh?: boolean;
  refreshThreshold?: number; // 秒
  onAuthChange?: (user: User | null) => void;
  onError?: (error: SSOError) => void;
  retry?: RetryConfig;
  timeout?: number; // 请求超时时间（毫秒）
  debug?: boolean; // 调试模式
  cache?: CacheConfig;
  performance?: PerformanceConfig;
  errorReporting?: ErrorReportingConfig;
  tabSync?: TabSyncConfig;
  offline?: OfflineConfig;
  plugins?: SSOPlugin[];
  i18n?: I18nConfig;
}

// 登录选项
export interface LoginOptions {
  providerId: string;
  redirectTo?: string;
  state?: string;
}

// 传统登录选项
export interface LocalLoginOptions {
  email: string;
  password: string;
}

// 用户注册选项
export interface RegisterOptions {
  email: string;
  password: string;
  name?: string;
}

// 2FA相关选项
export interface TwoFactorSetupOptions {
  // 设置2FA时不需要参数
}

export interface TwoFactorEnableOptions {
  secret: string;
  backupCodes: string[];
  token: string;
}

export interface TwoFactorVerifyOptions {
  token?: string;
  backupCode?: string;
}

export interface TwoFactorDisableOptions {
  token: string;
}

export interface TwoFactorRegenerateOptions {
  token: string;
}

// 2FA设置信息
export interface TwoFactorSettings {
  enabled: boolean;
  secret?: string;
  totpUrl?: string;
  qrCode?: string;
  backupCodes?: string[];
  createdAt?: string;
}

// 邮箱验证选项
export interface EmailVerificationOptions {
  email: string;
}

export interface EmailVerifyOptions {
  email: string;
  token: string;
}

export interface EmailResendOptions {
  email: string;
}

// 密码重置选项
export interface ForgotPasswordOptions {
  email: string;
}

export interface VerifyResetTokenOptions {
  email: string;
  token: string;
}

export interface ResetPasswordOptions {
  email: string;
  token: string;
  newPassword: string;
}

export interface ValidatePasswordOptions {
  password: string;
}

// 密码验证结果
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

// 回调处理选项
export interface CallbackOptions {
  providerId: string;
  onSuccess?: (user: User) => void;
  onError?: (error: SSOError) => void;
  redirectTo?: string;
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: string;
}

// 令牌信息
export interface TokenInfo {
  token: string;
  refreshToken?: string;
  expiresAt: number;
}

// 登录结果
export interface LoginResult {
  user: User;
  token: string;
  sessionId?: string;
  redirectUrl?: string;
}

// 请求选项
export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: boolean;
}

// 缓存配置
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // 缓存时间（秒）
  maxSize: number; // 最大缓存条目数
}

// 性能监控配置
export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 采样率 0-1
  maxEvents: number; // 最大事件数量
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

// 性能指标
export interface PerformanceMetrics {
  timestamp: number;
  type: 'login' | 'logout' | 'refresh' | 'api_call';
  duration: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, any>;
}

// 错误上报配置
export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  sampleRate: number;
  onError?: (error: SSOError, context: ErrorContext) => void;
}

// 错误上下文
export interface ErrorContext {
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// 多标签页同步配置
export interface TabSyncConfig {
  enabled: boolean;
  channel: string;
  onAuthChange?: (event: TabSyncEvent) => void;
}

// 标签页同步事件
export interface TabSyncEvent {
  type: 'login' | 'logout' | 'token_refresh';
  userId?: string;
  timestamp: number;
  source: string;
}

// 离线支持配置
export interface OfflineConfig {
  enabled: boolean;
  maxQueueSize: number;
  retryInterval: number;
  onSync?: (pendingActions: PendingAction[]) => void;
}

// 待处理操作
export interface PendingAction {
  id: string;
  type: 'login' | 'logout' | 'refresh';
  data: any;
  timestamp: number;
  retryCount: number;
}

// 插件接口
export interface SSOPlugin {
  name: string;
  version: string;
  install: (client: any) => void;
  uninstall?: () => void;
}

// 国际化配置
export interface I18nConfig {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, Record<string, string>>;
}

// 事件类型
export interface SSOEvent {
  type: string;
  data: any;
  timestamp: number;
}

// 事件监听器
export interface EventListener {
  event: string;
  handler: (event: SSOEvent) => void;
  once?: boolean;
}

// 中间件接口
export interface SSOMiddleware {
  name: string;
  before?: (request: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  after?: (response: Response, request: RequestOptions) => Response | Promise<Response>;
  error?: (error: SSOError, request: RequestOptions) => SSOError | Promise<SSOError>;
}

// 存储适配器接口
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 网络适配器接口
export interface NetworkAdapter {
  request(options: RequestOptions): Promise<Response>;
  isOnline(): Promise<boolean>;
  onOnline(callback: () => void): void;
  onOffline(callback: () => void): void;
}

export interface SSOClient {
  baseUrl: string;
  redirectUri: string;
  providers: SSOProvider[];
  // ... 其他配置
}

export interface SSOUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
}

export interface AuthResponse {
  user: SSOUser;
  accessToken: string;
  refreshToken?: string;
}

// 新增图标相关类型
export interface IconInfo {
  type: 'svg';
  content: string;
  backgroundColor?: string;
  color?: string;
}

export type DefaultIconKey = 'github' | 'google' | 'facebook' | 'twitter' | 'linkedin' | 'microsoft';

// React 组件props类型
export interface SSOIconProps {
  provider: SSOProvider;
  size?: number | string;
  className?: string;
  style?: Record<string, any>;
  onClick?: (event: any) => void;
} 