// 工具函数集合

import { SSOError, RetryConfig, RequestOptions, CacheConfig } from '../types/index.js';

/**
 * 检查是否在浏览器环境中
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 生成随机state参数
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 解析URL参数
 */
export function parseUrlParams(url?: string): Record<string, string> {
  const searchParams = url ? new URL(url).searchParams : new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * 构建查询字符串
 */
export function buildQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建SSO错误
 */
export function createSSOError(
  message: string, 
  code: string, 
  status?: number, 
  retryable: boolean = false,
  details?: any
): SSOError {
  const error = new Error(message) as SSOError;
  error.code = code;
  error.status = status;
  error.retryable = retryable;
  error.details = details;
  return error;
}

/**
 * 带重试的请求函数
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestOptions = {}, 
  retryConfig: RetryConfig
): Promise<Response> {
  const { maxRetries, retryDelay, backoffMultiplier, retryableErrors } = retryConfig;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 检查是否需要重试
      if (!response.ok && retryableErrors.includes(response.status.toString())) {
        throw createSSOError(
          `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status,
          true
        );
      }

      return response;
    } catch (error: any) {
      lastError = error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break;
      }

      // 检查是否应该重试
      if (error.name === 'AbortError' || 
          (error instanceof Error && 'code' in error && retryableErrors.includes((error as any).code))) {
        const delayTime = retryDelay * Math.pow(backoffMultiplier, attempt);
        await delay(delayTime);
        continue;
      }

      // 不可重试的错误，直接抛出
      throw error;
    }
  }

  throw lastError!;
}

/**
 * 简单的内存缓存实现
 */
export class SimpleCache {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize;
  }

  set(key: string, value: any, ttl: number): void {
    // 清理过期项
    this.cleanup();

    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('密码长度至少8位');
  } else {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('需要包含小写字母');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('需要包含大写字母');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('需要包含数字');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('需要包含特殊字符');
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key] as Record<string, any>) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

/**
 * 获取客户端信息
 */
export function getClientInfo(): {
  userAgent: string;
  language: string;
  timezone: string;
  screenSize: string;
} {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'unknown',
      language: 'unknown',
      timezone: 'unknown',
      screenSize: 'unknown'
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenSize: `${screen.width}x${screen.height}`
  };
}

/**
 * 格式化错误信息
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return '未知错误';
}

/**
 * 检查网络状态
 */
export function checkNetworkStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      resolve(false);
      return;
    }

    // 尝试请求一个小的资源来检查网络连接
    fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
} 