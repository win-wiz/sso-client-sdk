import { OfflineConfig, PendingAction } from '../types/index.js';

export class OfflineManager {
  private config: OfflineConfig;
  private queue: PendingAction[] = [];
  private isOnline: boolean = true;
  private syncTimer?: NodeJS.Timeout;
  private isEnabled: boolean;

  constructor(config: OfflineConfig) {
    this.config = Object.assign({
      enabled: false,
      maxQueueSize: 50,
      retryInterval: 5000
    }, config);
    this.isEnabled = this.config.enabled;
    this.init();
  }

  /**
   * 初始化离线管理器
   */
  private init(): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      return;
    }

    // 监听网络状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopSyncTimer();
    });

    // 检查初始网络状态
    this.isOnline = navigator.onLine;
  }

  /**
   * 添加待处理操作
   */
  addAction(type: PendingAction['type'], data: any): string {
    if (!this.isEnabled) {
      return '';
    }

    const action: PendingAction = {
      id: this.generateActionId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(action);

    // 限制队列大小
    if (this.queue.length > this.config.maxQueueSize) {
      this.queue.shift();
    }

    // 如果在线，立即处理
    if (this.isOnline) {
      this.processQueue();
    }

    return action.id;
  }

  /**
   * 处理队列中的操作
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const actions = [...this.queue];
    this.queue = [];

    for (const action of actions) {
      try {
        await this.executeAction(action);
      } catch (error) {
        // 重新加入队列
        action.retryCount++;
        if (action.retryCount < 3) {
          this.queue.push(action);
        }
      }
    }

    // 如果还有未处理的操作，启动定时器
    if (this.queue.length > 0) {
      this.startSyncTimer();
    }
  }

  /**
   * 执行操作
   */
  private async executeAction(action: PendingAction): Promise<void> {
    // 这里应该调用实际的API
    // 暂时只是模拟
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 启动同步定时器
   */
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.processQueue();
    }, this.config.retryInterval);
  }

  /**
   * 停止同步定时器
   */
  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * 生成操作ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取待处理操作
   */
  getPendingActions(): PendingAction[] {
    return [...this.queue];
  }

  /**
   * 清除队列
   */
  clearQueue(): void {
    this.queue = [];
    this.stopSyncTimer();
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopSyncTimer();
    this.queue = [];
  }

  /**
   * 启用/禁用离线支持
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.destroy();
    }
  }
} 