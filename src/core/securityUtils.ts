
// Enhanced security utilities with comprehensive validation
import { InputValidator } from './validation';

export class SecurityUtils {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  /**
   * Generate cryptographically secure random ID with entropy check
   */
  static generateSecureId(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Check if we have sufficient entropy
      const entropyCheck = new Uint8Array(4);
      crypto.getRandomValues(entropyCheck);
      
      if (entropyCheck.every(byte => byte === 0)) {
        console.warn('Low entropy detected, using fallback');
        return this.generateFallbackId();
      }

      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    return this.generateFallbackId();
  }

  private static generateFallbackId(): string {
    console.warn('Crypto API not available, using fallback random generation');
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
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
   * Enhanced input sanitization using validation schemas
   */
  static sanitizeInput(input: string): string {
    return InputValidator.sanitizeInput(input);
  }

  /**
   * Validate command input with comprehensive checks
   */
  static validateCommand(command: string): boolean {
    const validation = InputValidator.validateCommand(command);
    return validation.isValid;
  }

  /**
   * Validate username with security rules
   */
  static validateUsername(username: string): boolean {
    const validation = InputValidator.validateUsername(username);
    return validation.isValid;
  }

  /**
   * Validate file paths to prevent traversal
   */
  static validatePath(path: string): boolean {
    const validation = InputValidator.validatePath(path);
    return validation.isValid;
  }

  /**
   * Security audit log
   */
  static logSecurityEvent(event: string, details: Record<string, unknown>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      details: details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'test-environment',
      url: typeof window !== 'undefined' ? window.location.href : 'test-environment'
    };
    
    console.warn(`Security Event: ${event}`, logData);
  }
}
