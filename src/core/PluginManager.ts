import { SSOPlugin } from '../types/index.js';

export class PluginManager {
  private plugins: Map<string, SSOPlugin> = new Map();
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  /**
   * 安装插件
   */
  install(plugin: SSOPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already installed`);
      return;
    }

    try {
      plugin.install(this.client);
      this.plugins.set(plugin.name, plugin);
      console.log(`Plugin ${plugin.name} installed successfully`);
    } catch (error) {
      console.error(`Failed to install plugin ${plugin.name}:`, error);
    }
  }

  /**
   * 卸载插件
   */
  uninstall(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    try {
      if (plugin.uninstall) {
        plugin.uninstall();
      }
      this.plugins.delete(pluginName);
      console.log(`Plugin ${pluginName} uninstalled successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginName}:`, error);
      return false;
    }
  }

  /**
   * 获取已安装的插件
   */
  getInstalledPlugins(): SSOPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 检查插件是否已安装
   */
  isInstalled(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * 获取插件
   */
  getPlugin(pluginName: string): SSOPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * 清除所有插件
   */
  clear(): void {
    for (const [name] of this.plugins) {
      this.uninstall(name);
    }
  }
} 