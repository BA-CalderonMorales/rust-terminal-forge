// CSRF Protection for API endpoints
import { SecurityUtils } from './securityUtils';

export class CSRFProtection {
  private static tokens: Map<string, { token: string; timestamp: number }> = new Map();
  private static readonly TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a new CSRF token for a session
   */
  static generateToken(sessionId: string): string {
    const token = SecurityUtils.generateSecureId().substring(0, this.TOKEN_LENGTH);
    this.tokens.set(sessionId, {
      token,
      timestamp: Date.now()
    });
    
    SecurityUtils.logSecurityEvent('csrf_token_generated', { sessionId });
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(sessionId: string, providedToken: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored) {
      SecurityUtils.logSecurityEvent('csrf_token_missing', { sessionId });
      return false;
    }

    // Check if token has expired
    if (Date.now() - stored.timestamp > this.TOKEN_LIFETIME) {
      this.tokens.delete(sessionId);
      SecurityUtils.logSecurityEvent('csrf_token_expired', { sessionId });
      return false;
    }

    // Validate token
    if (stored.token !== providedToken) {
      SecurityUtils.logSecurityEvent('csrf_token_invalid', { sessionId });
      return false;
    }

    return true;
  }

  /**
   * Refresh token (generate new one and invalidate old)
   */
  static refreshToken(sessionId: string): string {
    this.tokens.delete(sessionId);
    return this.generateToken(sessionId);
  }

  /**
   * Clear expired tokens (cleanup)
   */
  static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now - data.timestamp > this.TOKEN_LIFETIME) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Clear all tokens for a session
   */
  static clearSession(sessionId: string): void {
    this.tokens.delete(sessionId);
  }
}

// Auto cleanup expired tokens every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    CSRFProtection.cleanupExpiredTokens();
  }, 5 * 60 * 1000);
}