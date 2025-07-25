
// Secure command processor with input validation and path traversal protection
import { TerminalCommand } from './types';
import { SecurityUtils } from './securityUtils';
import { RateLimiter } from './rateLimiter';
import { debugLogger } from './debugLogger';
import { DebugComponent } from './debugConfig';
import { FileSystemManager } from './filesystem/FileSystemManager';
import { FileSystemCommands } from './commands/FileSystemCommands';
import { SystemCommands } from './commands/SystemCommands';
import { UtilityCommands } from './commands/UtilityCommands';
import { CargoCommands } from './commands/CargoCommands';
import { GeminiCommands } from './commands/GeminiCommands';
import { ClaudeCommands } from './commands/ClaudeCommands';
import { ClaudeCodeCommands } from './commands/ClaudeCodeCommands';
import { EnvironmentCommands } from './commands/EnvironmentCommands';
import { RustCommands } from './commands/RustCommands';
import { UnifiedAICommandManager } from './ai/UnifiedAICommandManager';

export class SecureCommandProcessor {
  private rateLimiter = new RateLimiter();
  private fileSystemManager = new FileSystemManager();
  private fileSystemCommands = new FileSystemCommands(this.fileSystemManager);
  private systemCommands = new SystemCommands();
  private utilityCommands = new UtilityCommands();
  private cargoCommands = new CargoCommands();
  private geminiCommands = new GeminiCommands();
  private claudeCommands = new ClaudeCommands();
  private claudeCodeCommands = new ClaudeCodeCommands();
  private environmentCommands = new EnvironmentCommands();
  private rustCommands = new RustCommands();
  private unifiedAIManager = new UnifiedAICommandManager();

  async processCommand(input: string, sessionId: string = 'default'): Promise<TerminalCommand> {
    const traceId = debugLogger.startTrace(DebugComponent.COMMAND_PROCESSOR, 'processCommand', {
      input: input.substring(0, 100), // Limit logged input to prevent spam
      sessionId
    });

    debugLogger.debug(DebugComponent.COMMAND_PROCESSOR, `Processing command input: ${input}`, {
      sessionId,
      inputLength: input.length
    });

    // Rate limiting check
    const rateLimitStatus = this.rateLimiter.isAllowed(sessionId);
    debugLogger.trace(DebugComponent.COMMAND_PROCESSOR, `Rate limit check: ${rateLimitStatus}`, { sessionId });
    
    if (!rateLimitStatus) {
      const remaining = this.rateLimiter.getRemainingCommands(sessionId);
      debugLogger.warn(DebugComponent.COMMAND_PROCESSOR, `Rate limit exceeded for session: ${sessionId}`, {
        remainingCommands: remaining
      });
      
      debugLogger.endTrace(traceId, { success: false, reason: 'Rate limit exceeded' });
      
      return {
        id: SecurityUtils.generateSecureId(),
        command: input,
        output: `Rate limit exceeded. Try again later. Remaining commands: ${remaining}`,
        timestamp: new Date().toISOString(),
        exitCode: 429
      };
    }

    // Input validation
    const isValidCommand = SecurityUtils.validateCommand(input);
    debugLogger.trace(DebugComponent.COMMAND_PROCESSOR, `Input validation: ${isValidCommand}`, {
      inputLength: input.length,
      hasSpecialChars: /[<>|&;]/.test(input)
    });
    
    if (!isValidCommand) {
      debugLogger.warn(DebugComponent.COMMAND_PROCESSOR, `Invalid command input: ${input}`, {
        reason: 'Contains forbidden characters or exceeds length limit'
      });
      
      debugLogger.endTrace(traceId, { success: false, reason: 'Invalid command input' });
      
      return {
        id: SecurityUtils.generateSecureId(),
        command: input,
        output: 'Invalid command: contains forbidden characters or exceeds length limit',
        timestamp: new Date().toISOString(),
        exitCode: 400
      };
    }

    const sanitizedInput = SecurityUtils.sanitizeInput(input.trim());
    const command = this.utilityCommands.expandAliases(sanitizedInput);
    const parts = this.parseCommand(command);
    const baseCommand = parts[0];
    const args = parts.slice(1);

    debugLogger.debug(DebugComponent.COMMAND_PROCESSOR, `Command parsed successfully`, {
      original: input,
      sanitized: sanitizedInput,
      expanded: command,
      baseCommand,
      argsCount: args.length
    });

    const id = SecurityUtils.generateSecureId();
    const timestamp = new Date().toISOString();

    // Add to command history
    this.utilityCommands.addToHistory(command);
    debugLogger.trace(DebugComponent.COMMAND_PROCESSOR, 'Command added to history');

    try {
      const result = await this.executeCommand(baseCommand, args, id, command, timestamp);
      
      debugLogger.info(DebugComponent.COMMAND_PROCESSOR, `Command processing completed: ${baseCommand}`, {
        exitCode: result.exitCode,
        outputLength: result.output?.length || 0,
        success: result.exitCode === 0
      });
      
      debugLogger.endTrace(traceId, { 
        success: true, 
        exitCode: result.exitCode,
        baseCommand,
        outputLength: result.output?.length || 0
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      debugLogger.error(DebugComponent.COMMAND_PROCESSOR, `Command processing error: ${errorMessage}`, {
        command,
        error,
        stackTrace: error instanceof Error ? error.stack : undefined
      });
      
      debugLogger.endTrace(traceId, { success: false, error: errorMessage });
      
      return {
        id,
        command,
        output: `Error: ${errorMessage}`,
        timestamp,
        exitCode: 1
      };
    }
  }

  private async executeCommand(baseCommand: string, args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    debugLogger.debug(DebugComponent.COMMAND_PROCESSOR, `Executing command: ${baseCommand}`, {
      baseCommand,
      argsCount: args.length,
      fullCommand: command
    });

    switch (baseCommand) {
      // File system commands
      case 'pwd':
        return this.fileSystemCommands.handlePwd(id, command, timestamp);
      case 'ls':
        return this.fileSystemCommands.handleLs(args, id, command, timestamp);
      case 'cd':
        return this.fileSystemCommands.handleCd(args, id, command, timestamp);
      case 'mkdir':
        return this.fileSystemCommands.handleMkdir(args, id, command, timestamp);
      case 'touch':
        return this.fileSystemCommands.handleTouch(args, id, command, timestamp);
      case 'cat':
        return this.fileSystemCommands.handleCat(args, id, command, timestamp);
      case 'find':
        return this.fileSystemCommands.handleFind(args, id, command, timestamp);
      case 'grep':
        return this.fileSystemCommands.handleGrep(args, id, command, timestamp);
      case 'vim':
        return this.fileSystemCommands.handleVim(args, id, command, timestamp);
      
      // System commands
      case 'echo':
        return this.systemCommands.handleEcho(args, id, command, timestamp);
      case 'whoami':
        return this.systemCommands.handleWhoami(id, command, timestamp);
      case 'date':
        return this.systemCommands.handleDate(id, command, timestamp);
      case 'env':
        return await this.environmentCommands.handleEnv(args, id, command, timestamp);
      case 'uptime':
        return this.systemCommands.handleUptime(id, command, timestamp);
      case 'hostname':
        return this.systemCommands.handleHostname(id, command, timestamp);
      case 'which':
        return this.systemCommands.handleWhich(args, id, command, timestamp);
      
      // Utility commands
      case 'history':
        return this.utilityCommands.handleHistory(id, command, timestamp);
      case 'alias':
        return this.utilityCommands.handleAlias(args, id, command, timestamp);
      case 'clear':
        return this.utilityCommands.handleClear(id, command, timestamp);
      case 'help':
        return this.utilityCommands.handleHelp(id, command, timestamp);
      
      // Rust development commands
      case 'cargo':
        return await this.rustCommands.handleCargo(args, id, command, timestamp);
      case 'rustc':
        return await this.rustCommands.handleRustc(args, id, command, timestamp);
      case 'rustup':
        return await this.rustCommands.handleRustup(args, id, command, timestamp);
      case 'rust-dev':
        return await this.rustCommands.handleRustDev(args, id, command, timestamp);
      
      // Gemini CLI commands
      case 'gemini':
        return await this.handleGeminiCommand(args, id, command, timestamp);
      
      // Claude CLI commands
      case 'claude':
        return await this.handleClaudeCommand(args, id, command, timestamp);
      
      // Claude CLI commands (mapped from claude-code)
      case 'claude-code':
        return await this.claudeCodeCommands.handleClaude(args, id, command, timestamp);
      
      // Unified AI Interface - supports all providers
      case 'ai':
        return await this.unifiedAIManager.handleAICommand(args, id, command, timestamp);
      
      // Legacy cargo support (for backward compatibility)
      case 'cargo-legacy':
        return this.cargoCommands.handleCargo(args, id, command, timestamp);
      
      default:
        return {
          id,
          command,
          output: `bash: ${baseCommand}: command not found\n\nDid you mean:\n${this.suggestCommand(baseCommand)}`,
          timestamp,
          exitCode: 127
        };
    }
  }

  /**
   * Handle Gemini command routing
   */
  private async handleGeminiCommand(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.length === 0 || args.includes('--help')) {
      return await this.geminiCommands.handleGemini(args, id, command, timestamp);
    }

    const subCommand = args[0];
    const subArgs = args.slice(1);

    switch (subCommand) {
      case 'auth':
        return await this.geminiCommands.handleGeminiAuth(subArgs, id, command, timestamp);
      case 'chat':
        return await this.geminiCommands.handleGeminiChat(subArgs, id, command, timestamp);
      case 'list':
        return await this.geminiCommands.handleGeminiList(subArgs, id, command, timestamp);
      default:
        return await this.geminiCommands.handleGemini(args, id, command, timestamp);
    }
  }

  /**
   * Handle Claude command routing
   */
  private async handleClaudeCommand(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.length === 0 || args.includes('--help')) {
      return await this.claudeCommands.handleClaude(args, id, command, timestamp);
    }

    const subCommand = args[0];
    const subArgs = args.slice(1);

    switch (subCommand) {
      case 'auth':
        return await this.claudeCommands.handleClaudeAuth(subArgs, id, command, timestamp);
      case 'chat':
        return await this.claudeCommands.handleClaudeChat(subArgs, id, command, timestamp);
      case 'exec':
        return await this.claudeCommands.handleClaudeExec(subArgs, id, command, timestamp);
      case 'run':
        return await this.claudeCommands.handleClaudeRun(subArgs, id, command, timestamp);
      case 'clear':
        this.claudeCommands.clearHistory();
        return {
          id,
          command,
          output: 'Claude conversation history cleared',
          timestamp,
          exitCode: 0
        };
      default:
        return await this.claudeCommands.handleClaude(args, id, command, timestamp);
    }
  }

  private parseCommand(command: string): string[] {
    const parts = command.split(/\s+/).filter(part => part.length > 0);
    const result: string[] = [];
    
    for (const part of parts) {
      // Handle long flags (--flag) or flags with equals (--flag=value) or single char flags (-f)
      if (part.startsWith('-') && part.length > 2 && !part.startsWith('--') && !part.includes('=')) {
        // This is a combined short flag like -abc, split into -a -b -c
        const flags = part.slice(1);
        for (const flag of flags) {
          result.push(`-${flag}`);
        }
      } else {
        // This is a single argument: command, long flag (--help), single flag (-h), or value
        result.push(part);
      }
    }
    
    return result;
  }

  private suggestCommand(command: string): string {
    const commands = [
      'pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'find', 'grep', 'vim', 
      'echo', 'whoami', 'date', 'env', 'uptime', 'hostname', 'which', 
      'history', 'alias', 'cargo', 'rustc', 'rustup', 'rust-dev',
      'gemini', 'claude', 'claude-code', 'ai', 'clear', 'help'
    ];
    const suggestions = commands.filter(cmd => 
      cmd.includes(command) || 
      this.levenshteinDistance(cmd, command) <= 2
    );
    
    return suggestions.length > 0 ? suggestions.join(', ') : 'Type "help" for available commands';
  }

  private levenshteinDistance(a: string, b: string): number {
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

  getCurrentPath(): string {
    return this.fileSystemManager.getCurrentPath();
  }

  getFileSystem() {
    return this.fileSystemManager.getFileSystem();
  }
}
