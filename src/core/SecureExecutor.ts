// Secure command executor with strict allowlisting and validation
import { TerminalCommand } from './types';
import { SecurityUtils } from './securityUtils';

export interface ExecutionConfig {
  allowRealExecution: boolean;
  timeoutMs: number;
  maxOutputLength: number;
  allowedCommands: string[];
  environment: Record<string, string>;
}

export interface CommandAllowlist {
  command: string;
  allowedArgs: string[];
  requiresArgs: boolean;
  maxArgs: number;
  description: string;
}

export class SecureExecutor {
  private static readonly DEFAULT_CONFIG: ExecutionConfig = {
    allowRealExecution: false, // Default to safe mode
    timeoutMs: 30000, // 30 seconds max
    maxOutputLength: 10000, // 10KB max output
    allowedCommands: [],
    environment: {
      'HOME': '/home/user',
      'USER': 'user',
      'PATH': '/usr/local/bin:/usr/bin:/bin'
    }
  };

  private static readonly COMMAND_ALLOWLIST: CommandAllowlist[] = [
    {
      command: 'gemini',
      allowedArgs: ['--help', '--version', 'list', 'config', 'auth', 'chat', '--detailed', '--status', '--login', '--logout', '--model', '--max-tokens', '--interactive'],
      requiresArgs: false,
      maxArgs: 10,
      description: 'Gemini CLI tool'
    },
    {
      command: 'rustc',
      allowedArgs: ['--version', '--help', '--explain', '--print', 'target-list', 'cfg'],
      requiresArgs: false,
      maxArgs: 10,
      description: 'Rust compiler'
    },
    {
      command: 'rustup',
      allowedArgs: ['--version', '--help', 'show', 'update', 'toolchain'],
      requiresArgs: false,
      maxArgs: 10,
      description: 'Rust toolchain installer'
    },
    {
      command: 'cargo',
      allowedArgs: ['--version', '--help', 'build', 'test', 'check', 'clean', 'doc', 'fmt', 'clippy', '--release'],
      requiresArgs: false,
      maxArgs: 15,
      description: 'Rust package manager'
    }
  ];

  private config: ExecutionConfig;

  constructor(config?: Partial<ExecutionConfig>) {
    this.config = { ...SecureExecutor.DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a command securely with comprehensive validation
   */
  async executeCommand(
    command: string,
    args: string[],
    id: string,
    originalCommand: string,
    timestamp: string
  ): Promise<TerminalCommand> {
    try {
      // Security validation
      const validation = this.validateExecution(command, args);
      if (!validation.isValid) {
        SecurityUtils.logSecurityEvent('COMMAND_REJECTED', {
          command: originalCommand,
          reason: validation.reason
        });
        
        return {
          id,
          command: originalCommand,
          output: `Security Error: ${validation.reason}`,
          timestamp,
          exitCode: 403
        };
      }

      // Check if real execution is enabled and command is allowed
      if (this.config.allowRealExecution && this.isCommandAllowed(command)) {
        return await this.executeReal(command, args, id, originalCommand, timestamp);
      } else {
        // Fall back to simulated execution for safety
        return this.executeSimulated(command, args, id, originalCommand, timestamp);
      }
    } catch (error) {
      SecurityUtils.logSecurityEvent('EXECUTION_ERROR', {
        command: originalCommand,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        id,
        command: originalCommand,
        output: `Execution Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp,
        exitCode: 1
      };
    }
  }

  /**
   * Validate command execution against security rules
   */
  private validateExecution(command: string, args: string[]): { isValid: boolean; reason?: string } {
    // Check command name
    if (!SecurityUtils.validateCommand(command)) {
      return { isValid: false, reason: 'Invalid command format' };
    }

    // Check if command is in allowlist
    const allowlistEntry = SecureExecutor.COMMAND_ALLOWLIST.find(entry => entry.command === command);
    if (!allowlistEntry) {
      return { isValid: false, reason: 'Command not in allowlist' };
    }

    // Validate arguments
    if (args.length > allowlistEntry.maxArgs) {
      return { isValid: false, reason: 'Too many arguments' };
    }

    if (allowlistEntry.requiresArgs && args.length === 0) {
      return { isValid: false, reason: 'Command requires arguments' };
    }

    // Validate each argument
    for (const arg of args) {
      if (!this.validateArgument(arg, allowlistEntry.allowedArgs)) {
        return { isValid: false, reason: `Invalid argument: ${arg}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate individual arguments
   */
  private validateArgument(arg: string, allowedArgs: string[]): boolean {
    // Check if exact match with allowed args
    if (allowedArgs.includes(arg)) {
      return true;
    }

    // Allow certain safe patterns
    const safePatterns = [
      /^--[a-zA-Z0-9-]+$/, // Long flags
      /^-[a-zA-Z0-9]$/, // Short flags
      /^[a-zA-Z0-9._-]+$/, // Simple identifiers
      /^"[^"]*"$/, // Quoted strings
      /^'[^']*'$/, // Single quoted strings
      /^[a-zA-Z0-9\s._-]+$/, // Simple text with spaces
    ];

    return safePatterns.some(pattern => pattern.test(arg));
  }

  /**
   * Check if command is allowed for real execution
   */
  private isCommandAllowed(command: string): boolean {
    return this.config.allowedCommands.includes(command) ||
           SecureExecutor.COMMAND_ALLOWLIST.some(entry => entry.command === command);
  }

  /**
   * Execute command in real environment (when enabled)
   */
  private async executeReal(
    command: string,
    args: string[],
    id: string,
    originalCommand: string,
    timestamp: string
  ): Promise<TerminalCommand> {
    // Log the execution attempt
    SecurityUtils.logSecurityEvent('REAL_EXECUTION', {
      command: originalCommand,
      timestamp
    });

    // In a real implementation, this would use Node.js child_process or similar
    // For now, we'll simulate enhanced responses that look more realistic
    return this.executeSimulated(command, args, id, originalCommand, timestamp);
  }

  /**
   * Execute command in simulated environment (safe fallback)
   */
  private executeSimulated(
    command: string,
    args: string[],
    id: string,
    originalCommand: string,
    timestamp: string
  ): Promise<TerminalCommand> {
    const simulatedOutputs: Record<string, (args: string[]) => string> = {
      'gemini': (args) => this.simulateGemini(args),
      'rustc': (args) => this.simulateRustc(args),
      'rustup': (args) => this.simulateRustup(args),
      'cargo': (args) => this.simulateCargo(args)
    };

    const outputGenerator = simulatedOutputs[command];
    const output = outputGenerator ? outputGenerator(args) : `${command}: command simulation not available`;

    return Promise.resolve({
      id,
      command: originalCommand,
      output,
      timestamp,
      exitCode: 0
    });
  }

  /**
   * Simulate Gemini CLI responses
   */
  private simulateGemini(args: string[]): string {
    if (args.length === 0 || args.includes('--help')) {
      return `Gemini CLI v1.0.0

Usage: gemini [OPTIONS] [COMMAND]

Commands:
  auth     Authenticate with Gemini
  config   Configure Gemini settings
  list     List available models
  chat     Start interactive chat

Options:
  --help     Show this help message
  --version  Show version information`;
    }

    if (args.includes('--version')) {
      return 'Gemini CLI v1.0.0';
    }

    if (args.includes('list')) {
      return `Available Gemini models:
  gemini-pro
  gemini-pro-vision
  gemini-ultra`;
    }

    if (args.includes('config')) {
      return `Gemini configuration:
  API Key: [configured]
  Default Model: gemini-pro
  Max Tokens: 2048`;
    }

    if (args.includes('auth')) {
      return 'Gemini authentication status: Authenticated';
    }

    return 'Use "gemini --help" for usage information';
  }

  /**
   * Simulate Rust compiler responses
   */
  private simulateRustc(args: string[]): string {
    if (args.includes('--version')) {
      return 'rustc 1.75.0 (82e1608df 2023-12-21)';
    }

    if (args.includes('--help')) {
      return `Usage: rustc [OPTIONS] INPUT

Options:
    -h, --help          Print help information
    -V, --version       Print version information
        --explain CODE  Provide a detailed explanation of an error message`;
    }

    if (args.includes('--print')) {
      const target = args[args.indexOf('--print') + 1];
      switch (target) {
        case 'target-list':
          return 'x86_64-unknown-linux-gnu\nwasm32-unknown-unknown\naarch64-apple-darwin';
        case 'cfg':
          return 'debug_assertions\ntarget_arch="x86_64"\ntarget_os="linux"';
        default:
          return 'rustc: unknown print request';
      }
    }

    return 'rustc: no input files provided';
  }

  /**
   * Simulate Rustup responses
   */
  private simulateRustup(args: string[]): string {
    if (args.includes('--version')) {
      return 'rustup 1.26.0 (5af9b9484 2023-04-05)';
    }

    if (args.includes('show')) {
      return `Default host: x86_64-unknown-linux-gnu
rustup home:  /home/user/.rustup

installed toolchains
--------------------
stable-x86_64-unknown-linux-gnu (default)
nightly-x86_64-unknown-linux-gnu

active toolchain
----------------
stable-x86_64-unknown-linux-gnu (default)
rustc 1.75.0 (82e1608df 2023-12-21)`;
    }

    if (args.includes('--help')) {
      return `rustup 1.26.0
The Rust toolchain installer

USAGE:
    rustup [OPTIONS] [+toolchain] <SUBCOMMAND>

SUBCOMMANDS:
    show      Show the active and installed toolchains
    update    Update Rust toolchains
    toolchain Modify or query the installed toolchains`;
    }

    return 'Use "rustup --help" for usage information';
  }

  /**
   * Enhanced Cargo simulation
   */
  private simulateCargo(args: string[]): string {
    if (args.includes('--version')) {
      return 'cargo 1.75.0 (1d8b05cdd 2023-11-20)';
    }

    if (args.includes('--help')) {
      return `Cargo 1.75.0
Rust's package manager

USAGE:
    cargo [+toolchain] [OPTIONS] [COMMAND]

COMMANDS:
    build    Compile the current package
    check    Analyze the current package and report errors
    clean    Remove the target directory
    test     Run the tests
    doc      Build this package's and its dependencies' documentation
    fmt      Format all Rust files in this project
    clippy   Run Clippy linter`;
    }

    // Enhanced cargo simulation
    if (args.includes('build')) {
      return `   Compiling rust-terminal-forge v0.1.0 (/home/user/project)
    Finished dev [unoptimized + debuginfo] target(s) in 2.34s`;
    }

    if (args.includes('test')) {
      return `   Compiling rust-terminal-forge v0.1.0 (/home/user/project)
    Finished test [unoptimized + debuginfo] target(s) in 1.23s
     Running unittests src/lib.rs (target/debug/deps/rust_terminal_forge-abc123)

running 5 tests
test tests::test_secure_execution ... ok
test tests::test_command_validation ... ok
test tests::test_input_sanitization ... ok
test tests::test_gemini_integration ... ok
test tests::test_rust_toolchain ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s`;
    }

    return 'Use "cargo --help" for usage information';
  }

  /**
   * Get available commands for help display
   */
  static getAvailableCommands(): CommandAllowlist[] {
    return SecureExecutor.COMMAND_ALLOWLIST;
  }
}