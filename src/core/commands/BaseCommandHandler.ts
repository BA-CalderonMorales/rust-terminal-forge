
import { TerminalCommand } from '../types';
import { SecurityUtils } from '../securityUtils';

export abstract class BaseCommandHandler {
  protected generateCommand(
    id: string,
    command: string,
    output: string,
    timestamp: string,
    exitCode: number = 0
  ): TerminalCommand {
    return {
      id,
      command,
      output,
      timestamp,
      exitCode
    };
  }

  protected generateSecureId(): string {
    return SecurityUtils.generateSecureId();
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  protected levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  protected suggestCommand(command: string): string {
    const commands = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'find', 'grep', 'vim', 'echo', 'whoami', 'date', 'env', 'which', 'history', 'alias', 'cargo', 'clear', 'help'];
    const suggestions = commands.filter(cmd => 
      cmd.includes(command) || 
      this.levenshteinDistance(cmd, command) <= 2
    );
    
    return suggestions.length > 0 ? suggestions.join(', ') : 'Type "help" for available commands';
  }
}
