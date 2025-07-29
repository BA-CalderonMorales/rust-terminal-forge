// Environment variable management for browser context
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private variables: Map<string, string> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Get an environment variable
   */
  get(key: string): string | undefined {
    // Check browser globals first (for temporary variables)
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return (window as any)[key];
    }

    // Check stored variables
    return this.variables.get(key);
  }

  /**
   * Set an environment variable
   */
  set(key: string, value: string, persist: boolean = true): void {
    this.variables.set(key, value);
    
    if (persist) {
      this.saveToStorage();
    }
  }

  /**
   * Delete an environment variable
   */
  delete(key: string): boolean {
    const result = this.variables.delete(key);
    this.saveToStorage();
    return result;
  }

  /**
   * List all environment variables
   */
  list(): Array<{ key: string; value: string }> {
    return Array.from(this.variables.entries()).map(([key, value]) => ({
      key,
      value: this.isSensitive(key) ? this.maskValue(value) : value
    }));
  }

  /**
   * Check if an environment variable exists
   */
  has(key: string): boolean {
    return this.variables.has(key) || 
           (typeof window !== 'undefined' && !!(window as any)[key]);
  }

  /**
   * Clear all environment variables
   */
  clear(): void {
    this.variables.clear();
    this.saveToStorage();
  }

  /**
   * Load variables from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Skip localStorage in test environment
      if (typeof localStorage === 'undefined' || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
        return;
      }
      
      const stored = localStorage.getItem('terminal-env-vars');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.variables = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load environment variables from storage:', error);
    }
  }

  /**
   * Save variables to localStorage
   */
  private saveToStorage(): void {
    try {
      // Skip localStorage in test environment
      if (typeof localStorage === 'undefined' || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
        return;
      }
      
      const obj = Object.fromEntries(this.variables);
      localStorage.setItem('terminal-env-vars', JSON.stringify(obj));
    } catch (error) {
      console.warn('Failed to save environment variables to storage:', error);
    }
  }

  /**
   * Check if a key contains sensitive information
   */
  private isSensitive(key: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /token/i,
      /secret/i,
      /password/i,
      /auth/i,
      /credential/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  /**
   * Mask sensitive values for display
   */
  private maskValue(value: string): string {
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }

  /**
   * Validate Anthropic API key format
   */
  validateAnthropicApiKey(key: string): { valid: boolean; message: string } {
    if (!key) {
      return { valid: false, message: 'API key is required' };
    }

    if (!key.startsWith('sk-ant-')) {
      return { valid: false, message: 'API key must start with "sk-ant-"' };
    }

    if (key.length < 20) {
      return { valid: false, message: 'API key appears to be too short' };
    }

    // Basic format validation
    if (!/^sk-ant-[a-zA-Z0-9_-]+$/.test(key)) {
      return { valid: false, message: 'API key contains invalid characters' };
    }

    return { valid: true, message: 'API key format is valid' };
  }

  /**
   * Set Anthropic API key with validation
   */
  setAnthropicApiKey(key: string): { success: boolean; message: string } {
    const validation = this.validateAnthropicApiKey(key);
    
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    this.set('ANTHROPIC_API_KEY', key, true);
    return { success: true, message: 'API key set successfully' };
  }

  /**
   * Get Anthropic API key
   */
  getAnthropicApiKey(): string | undefined {
    return this.get('ANTHROPIC_API_KEY');
  }

  /**
   * Check if Anthropic API key is configured
   */
  hasAnthropicApiKey(): boolean {
    const key = this.getAnthropicApiKey();
    return !!key && this.validateAnthropicApiKey(key).valid;
  }
}