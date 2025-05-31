
// Security utilities for cryptographic operations
export class SecurityUtils {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  /**
   * Generate cryptographically secure random ID
   */
  static generateSecureId(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for environments without crypto API
    console.warn('Crypto API not available, using fallback random generation');
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encryptData(data: string, password: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      console.warn('Encryption not available, storing data unencrypted');
      return data;
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(password, salt);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        this.encoder.encode(data)
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed, storing data unencrypted:', error);
      return data;
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decryptData(encryptedData: string, password: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return encryptedData;
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      const key = await this.deriveKey(password, salt);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return this.decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed, returning data as-is:', error);
      return encryptedData;
    }
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitizeInput(input: string): string {
    return input
      // Remove dangerous characters
      .replace(/[<>'"&]/g, '')
      // Remove control characters
      .replace(/[\x00-\x1f\x7f]/g, '')
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      // Limit length
      .substring(0, 1000)
      // Normalize unicode
      .normalize('NFKC');
  }

  /**
   * Validate command input
   */
  static validateCommand(command: string): boolean {
    const sanitized = this.sanitizeInput(command);
    
    // Check length
    if (sanitized.length === 0 || sanitized.length > 1000) {
      return false;
    }

    // Allow only alphanumeric, spaces, and common shell characters
    const allowedPattern = /^[a-zA-Z0-9\s\-_.\/~]+$/;
    return allowedPattern.test(sanitized);
  }
}
