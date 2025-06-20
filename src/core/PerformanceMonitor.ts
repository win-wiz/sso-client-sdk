import { PerformanceConfig, PerformanceMetrics } from '../types/index.js';

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private events: PerformanceMetrics[] = [];
  private isEnabled: boolean;

  constructor(config: PerformanceConfig) {
    this.config = Object.assign({
      enabled: false,
      sampleRate: 1.0,
      maxEvents: 100
    }, config);
    this.isEnabled = this.config.enabled;
  }

  /**
   * 记录性能指标
   */
  record(type: PerformanceMetrics['type'], duration: number, success: boolean, errorCode?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled || Math.random() > this.config.sampleRate) {
      return;
    }

    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      type,
      duration,
      success,
      errorCode,
      metadata
    };

    this.events.push(metric);

    // 限制事件数量
    if (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }

    // 调用回调
    if (this.config.onMetrics) {
      this.config.onMetrics(metric);
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.events];
  }

  /**
   * 获取特定类型的指标
   */
  getMetricsByType(type: PerformanceMetrics['type']): PerformanceMetrics[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * 计算平均响应时间
   */
  getAverageResponseTime(type?: PerformanceMetrics['type']): number {
    const metrics = type ? this.getMetricsByType(type) : this.events;
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }

  /**
   * 计算成功率
   */
  getSuccessRate(type?: PerformanceMetrics['type']): number {
    const metrics = type ? this.getMetricsByType(type) : this.events;
    if (metrics.length === 0) return 0;

    const successCount = metrics.filter(metric => metric.success).length;
    return successCount / metrics.length;
  }

  /**
   * 清除指标
   */
  clear(): void {
    this.events = [];
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
} 