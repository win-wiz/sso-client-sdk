import { ErrorReportingConfig, SSOError, ErrorContext } from '../types/index.js';
import { getClientInfo } from '../utils/index.js';

export class ErrorReporter {
  private config: ErrorReportingConfig;
  private isEnabled: boolean;

  constructor(config: ErrorReportingConfig) {
    this.config = Object.assign({
      enabled: false,
      sampleRate: 1.0
    }, config);
    this.isEnabled = this.config.enabled;
  }

  /**
   * 上报错误
   */
  report(error: SSOError, userId?: string, sessionId?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled || Math.random() > this.config.sampleRate) {
      return;
    }

    const context: ErrorContext = {
      timestamp: Date.now(),
      userAgent: getClientInfo().userAgent,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId,
      sessionId,
      metadata
    };

    // 调用自定义错误处理
    if (this.config.onError) {
      this.config.onError(error, context);
    }

    // 发送到错误上报端点
    if (this.config.endpoint) {
      this.sendToEndpoint(error, context);
    }
  }

  /**
   * 发送错误到端点
   */
  private async sendToEndpoint(error: SSOError, context: ErrorContext): Promise<void> {
    try {
      await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            code: error.code,
            status: error.status,
            stack: error.stack
          },
          context
        })
      });
    } catch (e) {
      // 静默处理上报失败
      console.warn('Error reporting failed:', e);
    }
  }

  /**
   * 启用/禁用错误上报
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
} 