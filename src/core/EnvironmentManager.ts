// Environment variable management for browser context
import { SecurityUtils } from './securityUtils';
import { SecureStorage } from './secureStorage';

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private variables: Map<string, string> = new Map();
  private encryptedKeys: Set<string> = new Set();

  private constructor() {
    this.loadFromStorage().catch(error => {
      console.warn('Failed to load environment variables:', error);
    });
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Get an environment variable with automatic decryption for sensitive data
   */
  async get(key: string): Promise<string | undefined> {
    // Check if this is encrypted sensitive data
    if (this.encryptedKeys.has(key)) {
      return await SecureStorage.get(`env_${key}`);
    }

    // Check browser globals first (for temporary variables)
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return (window as any)[key];
    }

    // Check stored variables
    return this.variables.get(key);
  }

  /**
   * Synchronous get for non-sensitive variables (backward compatibility)
   */
  getSync(key: string): string | undefined {
    if (this.encryptedKeys.has(key)) {
      console.warn(`Attempting sync access to encrypted variable: ${key}`);
      return undefined;
    }
    return this.variables.get(key);
  }

  /**
   * Set an environment variable with automatic encryption for sensitive data
   */
  async set(key: string, value: string, persist: boolean = true): Promise<void> {
    // Check if this is sensitive data
    if (this.isSensitive(key)) {
      SecurityUtils.logSecurityEvent('sensitive_env_var_set', { key });
      this.encryptedKeys.add(key);
      
      if (persist) {
        await SecureStorage.set(`env_${key}`, value);
        return;
      }
    }
    
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
   * Load variables from localStorage with encryption awareness
   */
  private async loadFromStorage(): Promise<void> {
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

      // Load encrypted keys metadata
      const encryptedKeysList = localStorage.getItem('terminal-encrypted-keys');
      if (encryptedKeysList) {
        this.encryptedKeys = new Set(JSON.parse(encryptedKeysList));
      }
    } catch (error) {
      console.warn('Failed to load environment variables from storage:', error);
      SecurityUtils.logSecurityEvent('env_load_error', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  /**
   * Save variables to localStorage with encryption tracking
   */
  private saveToStorage(): void {
    try {
      // Skip localStorage in test environment
      if (typeof localStorage === 'undefined' || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
        return;
      }
      
      const obj = Object.fromEntries(this.variables);
      localStorage.setItem('terminal-env-vars', JSON.stringify(obj));
      
      // Save encrypted keys metadata
      localStorage.setItem('terminal-encrypted-keys', JSON.stringify(Array.from(this.encryptedKeys)));
    } catch (error) {
      console.warn('Failed to save environment variables to storage:', error);
      SecurityUtils.logSecurityEvent('env_save_error', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  /**
   * Check if a key contains sensitive information (enhanced patterns)
   */
  private isSensitive(key: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /token/i,
      /secret/i,
      /password/i,
      /auth/i,
      /credential/i,
      /private[_-]?key/i,
      /sk[_-]/i,       // Stripe/OpenAI style keys
      /pk[_-]/i,       // Public keys that might be misclassified
      /access[_-]?key/i,
      /session[_-]?key/i,
      /jwt/i,
      /bearer/i,
      /oauth/i
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
   * Set Anthropic API key with validation and encryption
   */
  async setAnthropicApiKey(key: string): Promise<{ success: boolean; message: string }> {
    const validation = this.validateAnthropicApiKey(key);
    
    if (!validation.valid) {
      SecurityUtils.logSecurityEvent('invalid_api_key_attempt', { reason: validation.message });
      return { success: false, message: validation.message };
    }

    await this.set('ANTHROPIC_API_KEY', key, true);
    SecurityUtils.logSecurityEvent('api_key_set', { keyType: 'anthropic' });
    return { success: true, message: 'API key set and encrypted successfully' };
  }

  /**
   * Get Anthropic API key (async due to decryption)
   */
  async getAnthropicApiKey(): Promise<string | undefined> {
    return await this.get('ANTHROPIC_API_KEY');
  }

  /**
   * Check if Anthropic API key is configured
   */
  async hasAnthropicApiKey(): Promise<boolean> {
    const key = await this.getAnthropicApiKey();
    return !!key && this.validateAnthropicApiKey(key).valid;
  }

  /**
   * Enhanced method to get any variable with proper typing
   */
  getVariable(key: string): string | undefined {
    return this.getSync(key);
  }
}