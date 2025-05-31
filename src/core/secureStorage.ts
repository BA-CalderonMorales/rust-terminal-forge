
// Secure storage with encryption for sensitive data
import { SecurityUtils } from './securityUtils';

export class SecureStorage {
  private static prefix = 'rust-terminal-';
  private static encryptionPassword = 'rust-terminal-2024'; // In production, this should be user-derived

  static async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = await SecurityUtils.encryptData(serialized, this.encryptionPassword);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const decrypted = await SecurityUtils.decryptData(item, this.encryptionPassword);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to read from secure storage:', error);
      return null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}
