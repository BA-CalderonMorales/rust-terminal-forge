
// Enhanced rate limiter for command execution with security features
export class RateLimiter {
  private commandCounts: Map<string, number[]> = new Map();
  private suspiciousActivity: Map<string, number> = new Map();
  private blockedSessions: Set<string> = new Set();
  private readonly maxCommands: number = 15;
  private readonly timeWindow: number = 1000; // 1 second
  private readonly suspiciousThreshold: number = 5;
  private readonly blockDuration: number = 60000; // 1 minute

  /**
   * Check if command execution is allowed with enhanced security
   */
  isAllowed(sessionId: string, command?: string): boolean {
    const now = Date.now();
    
    // Check if session is blocked
    if (this.blockedSessions.has(sessionId)) {
      return false;
    }

    const commands = this.commandCounts.get(sessionId) || [];
    
    // Remove old commands outside the time window
    const recentCommands = commands.filter(timestamp => now - timestamp < this.timeWindow);
    
    // Update the commands list
    this.commandCounts.set(sessionId, recentCommands);
    
    // Check for suspicious activity patterns
    if (command && this.isSuspiciousCommand(command)) {
      this.trackSuspiciousActivity(sessionId);
    }
    
    // Check if limit is exceeded
    if (recentCommands.length >= this.maxCommands) {
      this.trackSuspiciousActivity(sessionId);
      return false;
    }
    
    // Add current command
    recentCommands.push(now);
    this.commandCounts.set(sessionId, recentCommands);
    
    return true;
  }

  /**
   * Get remaining commands in current window
   */
  getRemainingCommands(sessionId: string): number {
    const commands = this.commandCounts.get(sessionId) || [];
    const now = Date.now();
    const recentCommands = commands.filter(timestamp => now - timestamp < this.timeWindow);
    
    return Math.max(0, this.maxCommands - recentCommands.length);
  }

  /**
   * Clear rate limit for session
   */
  clear(sessionId: string): void {
    this.commandCounts.delete(sessionId);
    this.suspiciousActivity.delete(sessionId);
    this.blockedSessions.delete(sessionId);
  }

  /**
   * Check for suspicious command patterns
   */
  private isSuspiciousCommand(command: string): boolean {
    const suspiciousPatterns = [
      /rm\s+-rf/,
      /sudo/,
      /passwd/,
      /\.\./,
      /eval/,
      /exec/,
      /<script/i,
      /javascript:/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(command));
  }

  /**
   * Track suspicious activity and block if threshold exceeded
   */
  private trackSuspiciousActivity(sessionId: string): void {
    const current = this.suspiciousActivity.get(sessionId) || 0;
    const updated = current + 1;
    
    this.suspiciousActivity.set(sessionId, updated);
    
    if (updated >= this.suspiciousThreshold) {
      this.blockedSessions.add(sessionId);
      console.warn(`Session ${sessionId} blocked due to suspicious activity`);
      
      // Auto-unblock after duration
      setTimeout(() => {
        this.blockedSessions.delete(sessionId);
        this.suspiciousActivity.delete(sessionId);
      }, this.blockDuration);
    }
  }

  /**
   * Check if session is currently blocked
   */
  isBlocked(sessionId: string): boolean {
    return this.blockedSessions.has(sessionId);
  }
}
