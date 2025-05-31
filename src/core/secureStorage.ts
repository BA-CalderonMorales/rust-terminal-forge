
// Secure storage with user-derived encryption keys
import { SecurityUtils } from './securityUtils';
import { KeyDerivation } from './keyDerivation';

export class SecureStorage {
  private static prefix = 'rust-terminal-';
  private static currentUsername: string | null = null;
  private static userKey: CryptoKey | null = null;

  /**
   * Initialize secure storage for a user
   */
  static async initializeForUser(username: string): Promise<void> {
    this.currentUsername = username;
    
    let salt = KeyDerivation.getSalt(username);
    if (!salt) {
      salt = KeyDerivation.generateSalt();
      KeyDerivation.storeSalt(username, salt);
    }

    this.userKey = await KeyDerivation.deriveUserKey(username, salt);
  }

  /**
   * Clear user session
   */
  static clearUserSession(): void {
    this.currentUsername = null;
    this.userKey = null;
  }

  static async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (!this.userKey || !this.currentUsername) {
        console.warn('No user key available, storing data unencrypted');
        localStorage.setItem(this.prefix + key, serialized);
        return;
      }

      const encrypted = await this.encryptWithUserKey(serialized);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      if (!this.userKey || !this.currentUsername) {
        console.warn('No user key available, reading unencrypted data');
        return JSON.parse(item);
      }

      const decrypted = await this.decryptWithUserKey(item);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to read from secure storage:', error);
      return null;
    }
  }

  private static async encryptWithUserKey(data: string): Promise<string> {
    if (!this.userKey) throw new Error('No user key available');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.userKey,
      new TextEncoder().encode(data)
    );

    // Combine iv + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private static async decryptWithUserKey(encryptedData: string): Promise<string> {
    if (!this.userKey) throw new Error('No user key available');

    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.userKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
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
