import { TabSyncConfig, TabSyncEvent } from '../types/index.js';

export class TabSync {
  private config: TabSyncConfig;
  private channel: BroadcastChannel | null = null;
  private isEnabled: boolean;

  constructor(config: TabSyncConfig) {
    this.config = Object.assign({
      enabled: false,
      channel: 'sso-sync'
    }, config);
    this.isEnabled = this.config.enabled;
    this.init();
  }

  /**
   * 初始化广播通道
   */
  private init(): void {
    if (!this.isEnabled || typeof BroadcastChannel === 'undefined') {
      return;
    }

    try {
      this.channel = new BroadcastChannel(this.config.channel);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch (error) {
      console.warn('BroadcastChannel not supported, tab sync disabled');
      this.isEnabled = false;
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: TabSyncEvent): void {
    if (this.config.onAuthChange) {
      this.config.onAuthChange(event);
    }
  }

  /**
   * 发送同步事件
   */
  broadcast(type: TabSyncEvent['type'], userId?: string): void {
    if (!this.isEnabled || !this.channel) {
      return;
    }

    const event: TabSyncEvent = {
      type,
      userId,
      timestamp: Date.now(),
      source: this.generateSourceId()
    };

    try {
      this.channel.postMessage(event);
    } catch (error) {
      console.warn('Failed to broadcast tab sync event:', error);
    }
  }

  /**
   * 生成源标识
   */
  private generateSourceId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 关闭广播通道
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  /**
   * 启用/禁用标签页同步
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled && !this.channel) {
      this.init();
    } else if (!enabled && this.channel) {
      this.destroy();
    }
  }
} 