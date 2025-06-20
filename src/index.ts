import { SSOClient } from './core/SSOClient.js';
import { useSSO } from './react/useSSO.js';

export { SSOClient, useSSO };

// 类型导出
export type {
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
  LoginResult
} from './types/index.js';

// 工具函数
export * from './utils/index.js';

// 默认导出
export default SSOClient; 