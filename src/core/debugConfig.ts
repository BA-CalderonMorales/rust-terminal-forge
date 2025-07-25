/**
 * Centralized debug configuration system for rust-terminal-forge
 * 
 * Supports configuration via:
 * - Environment variables
 * - Runtime settings
 * - Local storage (browser persistence)
 */

export enum DebugLevel {
  ERROR = 0,
  WARN = 1, 
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export enum DebugComponent {
  ALL = 'all',
  SECURE_EXECUTOR = 'secure_executor',
  COMMAND_PROCESSOR = 'command_processor', 
  PROCESS_EXECUTOR = 'process_executor',
  FILE_SYSTEM = 'file_system',
  SECURITY = 'security',
  TERMINAL = 'terminal',
  AUTH = 'auth',
  STORAGE = 'storage',
  NETWORK = 'network'
}

export interface DebugConfig {
  enabled: boolean;
  level: DebugLevel;
  components: Set<DebugComponent>;
  outputFormat: 'json' | 'text';
  includeTimestamp: boolean;
  includeStackTrace: boolean;
  maxLogSize: number;
  persistLogs: boolean;
  logToConsole: boolean;
  logToStorage: boolean;
  performanceTracing: boolean;
}

export class DebugConfiguration {
  private static instance: DebugConfiguration;
  private config: DebugConfig;
  private listeners: Set<(config: DebugConfig) => void> = new Set();

  private constructor() {
    this.config = this.loadConfiguration();
    
    // Listen for environment variable changes (in development)
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  static getInstance(): DebugConfiguration {
    if (!DebugConfiguration.instance) {
      DebugConfiguration.instance = new DebugConfiguration();
    }
    return DebugConfiguration.instance;
  }

  /**
   * Load configuration from multiple sources with priority:
   * 1. Runtime overrides
   * 2. Environment variables  
   * 3. Local storage
   * 4. Default configuration
   */
  private loadConfiguration(): DebugConfig {
    // Default configuration
    const defaultConfig: DebugConfig = {
      enabled: false,
      level: DebugLevel.WARN,
      components: new Set([DebugComponent.ALL]),
      outputFormat: 'text',
      includeTimestamp: true,
      includeStackTrace: false,
      maxLogSize: 1000,
      persistLogs: false,
      logToConsole: true,
      logToStorage: false,
      performanceTracing: false
    };

    // Load from environment variables
    const envConfig = this.loadFromEnvironment();
    
    // Load from local storage
    const storageConfig = this.loadFromStorage();
    
    // Merge configurations with priority
    return {
      ...defaultConfig,
      ...storageConfig,
      ...envConfig
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<DebugConfig> {
    const config: Partial<DebugConfig> = {};

    // Check for Node.js environment variables
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
        config.enabled = true;
      }
      if (process.env.DEBUG === 'false' || process.env.DEBUG === '0') {
        config.enabled = false;
      }

      if (process.env.DEBUG_LEVEL) {
        const level = parseInt(process.env.DEBUG_LEVEL);
        if (!isNaN(level) && level >= 0 && level <= 4) {
          config.level = level as DebugLevel;
        }
      }

      if (process.env.DEBUG_COMPONENTS) {
        const components = process.env.DEBUG_COMPONENTS.split(',')
          .map(c => c.trim().toLowerCase())
          .filter(c => Object.values(DebugComponent).includes(c as DebugComponent));
        if (components.length > 0) {
          config.components = new Set(components as DebugComponent[]);
        }
      }

      if (process.env.DEBUG_FORMAT === 'json') {
        config.outputFormat = 'json';
      }

      if (process.env.DEBUG_PERFORMANCE === 'true') {
        config.performanceTracing = true;
      }
    }

    // Check for browser URL parameters
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      
      if (params.has('debug')) {
        config.enabled = params.get('debug') !== 'false';
      }
      
      if (params.has('debug_level')) {
        const level = parseInt(params.get('debug_level') || '');
        if (!isNaN(level) && level >= 0 && level <= 4) {
          config.level = level as DebugLevel;
        }
      }
    }

    return config;
  }

  /**
   * Load configuration from local storage
   */
  private loadFromStorage(): Partial<DebugConfig> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const stored = localStorage.getItem('rust-terminal-forge-debug-config');
      if (!stored) {
        return {};
      }

      const parsed = JSON.parse(stored);
      
      // Convert components array back to Set
      if (parsed.components && Array.isArray(parsed.components)) {
        parsed.components = new Set(parsed.components);
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to load debug configuration from storage:', error);
      return {};
    }
  }

  /**
   * Save configuration to local storage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      // Convert Set to array for JSON serialization
      const configToSave = {
        ...this.config,
        components: Array.from(this.config.components)
      };

      localStorage.setItem('rust-terminal-forge-debug-config', JSON.stringify(configToSave));
    } catch (error) {
      console.warn('Failed to save debug configuration to storage:', error);
    }
  }

  /**
   * Handle storage change events
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'rust-terminal-forge-debug-config') {
      this.config = this.loadConfiguration();
      this.notifyListeners();
    }
  }

  /**
   * Get current debug configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config, components: new Set(this.config.components) };
  }

  /**
   * Update debug configuration
   */
  updateConfig(updates: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Enable/disable debug mode
   */
  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  /**
   * Set debug level
   */
  setLevel(level: DebugLevel): void {
    this.updateConfig({ level });
  }

  /**
   * Set debug components
   */
  setComponents(components: DebugComponent[]): void {
    this.updateConfig({ components: new Set(components) });
  }

  /**
   * Add debug component
   */
  addComponent(component: DebugComponent): void {
    const components = new Set(this.config.components);
    components.add(component);
    this.updateConfig({ components });
  }

  /**
   * Remove debug component
   */
  removeComponent(component: DebugComponent): void {
    const components = new Set(this.config.components);
    components.delete(component);
    if (components.size === 0) {
      components.add(DebugComponent.ALL);
    }
    this.updateConfig({ components });
  }

  /**
   * Check if debug is enabled for a component and level
   */
  isEnabled(component: DebugComponent, level: DebugLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }

    if (level > this.config.level) {
      return false;
    }

    if (this.config.components.has(DebugComponent.ALL)) {
      return true;
    }

    return this.config.components.has(component);
  }

  /**
   * Get debug level name
   */
  getLevelName(level: DebugLevel): string {
    return DebugLevel[level] || 'UNKNOWN';
  }

  /**
   * Add configuration change listener
   */
  addListener(listener: (config: DebugConfig) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove configuration change listener
   */
  removeListener(listener: (config: DebugConfig) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('Error in debug configuration listener:', error);
      }
    });
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rust-terminal-forge-debug-config');
    }
    this.config = this.loadConfiguration();
    this.notifyListeners();
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    const exportConfig = {
      ...this.config,
      components: Array.from(this.config.components)
    };
    return JSON.stringify(exportConfig, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(configJson: string): void {
    try {
      const imported = JSON.parse(configJson);
      if (imported.components && Array.isArray(imported.components)) {
        imported.components = new Set(imported.components);
      }
      this.updateConfig(imported);
    } catch (error) {
      throw new Error(`Invalid configuration JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const debugConfig = DebugConfiguration.getInstance();