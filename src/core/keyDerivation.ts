
// Secure key derivation for user-specific encryption
export class KeyDerivation {
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 256;
  private static readonly ITERATIONS = 100000;

  /**
   * Generate a unique salt for each user
   */
  static generateSalt(): Uint8Array {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    }
    throw new Error('Crypto API not available');
  }

  /**
   * Derive encryption key from user credentials
   */
  static async deriveUserKey(username: string, userSalt: Uint8Array): Promise<CryptoKey> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    // Use username as base for key derivation (in production, this would be a user password)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(username + '-rust-terminal-2024'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: userSalt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Store user salt securely
   */
  static storeSalt(username: string, salt: Uint8Array): void {
    const saltB64 = btoa(String.fromCharCode(...salt));
    localStorage.setItem(`rust-terminal-salt-${username}`, saltB64);
  }

  /**
   * Retrieve user salt
   */
  static getSalt(username: string): Uint8Array | null {
    const saltB64 = localStorage.getItem(`rust-terminal-salt-${username}`);
    if (!saltB64) return null;
    
    return new Uint8Array(
      atob(saltB64).split('').map(char => char.charCodeAt(0))
    );
  }
}
