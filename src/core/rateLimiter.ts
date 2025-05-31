
// Rate limiter for command execution
export class RateLimiter {
  private commandCounts: Map<string, number[]> = new Map();
  private readonly maxCommands: number = 10;
  private readonly timeWindow: number = 1000; // 1 second

  /**
   * Check if command execution is allowed
   */
  isAllowed(sessionId: string): boolean {
    const now = Date.now();
    const commands = this.commandCounts.get(sessionId) || [];
    
    // Remove old commands outside the time window
    const recentCommands = commands.filter(timestamp => now - timestamp < this.timeWindow);
    
    // Update the commands list
    this.commandCounts.set(sessionId, recentCommands);
    
    // Check if limit is exceeded
    if (recentCommands.length >= this.maxCommands) {
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
  }
}
