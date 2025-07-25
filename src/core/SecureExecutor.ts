// Secure command executor with strict allowlisting and validation
import { TerminalCommand } from './types';
import { SecurityUtils } from './securityUtils';
import { ProcessExecutor } from './ProcessExecutor';
import { debugLogger } from './debugLogger';
import { DebugComponent } from './debugConfig';

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
      'HOME': typeof process !== 'undefined' ? process.env.HOME || '/home/user' : '/home/user',
      'USER': typeof process !== 'undefined' ? process.env.USER || 'user' : 'user',
      'PATH': typeof process !== 'undefined' ? process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/home/codespace/.cargo/bin' : '/usr/local/bin:/usr/bin:/bin',
      'CARGO_HOME': typeof process !== 'undefined' ? process.env.CARGO_HOME || '/home/codespace/.cargo' : '/home/codespace/.cargo',
      'RUSTUP_HOME': typeof process !== 'undefined' ? process.env.RUSTUP_HOME || '/home/codespace/.rustup' : '/home/codespace/.rustup',
      'RUST_BACKTRACE': '1', // Enable Rust backtraces for better debugging
      'CARGO_TERM_COLOR': 'always', // Force colored output from Cargo
      'TERM': 'xterm-256color', // Ensure good terminal support
      'COLORTERM': 'truecolor'
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
      allowedArgs: [
        '--version', '--help', '--explain', '--print', 'target-list', 'cfg',
        '--target', '--crate-type', '--crate-name', '--edition', '--emit',
        '--out-dir', '--opt-level', '--debug-info', '--codegen-units',
        '--rpath', '--test', '--bench', '--cap-lints', '--color',
        '--error-format', '--json', '--pretty', '--unpretty', '--verbose'
      ],
      requiresArgs: false,
      maxArgs: 20,
      description: 'Rust compiler with comprehensive options'
    },
    {
      command: 'rustup',
      allowedArgs: [
        '--version', '--help', 'show', 'update', 'self', 'install', 'uninstall',
        'toolchain', 'list', 'install', 'uninstall', 'link', 'update',
        'target', 'add', 'remove', 'list', 'component', 'add', 'remove', 'list',
        'override', 'set', 'unset', 'list', 'run', 'which', 'doc',
        '--toolchain', 'stable', 'beta', 'nightly', '--force', '--profile',
        'minimal', 'default', 'complete'
      ],
      requiresArgs: false,
      maxArgs: 15,
      description: 'Rust toolchain installer with comprehensive support'
    },
    {
      command: 'cargo',
      allowedArgs: [
        '--version', '--help', '--list', '--explain',
        'build', 'test', 'check', 'clean', 'doc', 'fmt', 'clippy', 'run',
        'new', 'init', 'add', 'remove', 'update', 'search', 'install', 'uninstall',
        'publish', 'package', 'tree', 'audit', 'fix', 'generate-lockfile',
        'locate-project', 'metadata', 'pkgid', 'report', 'verify-project',
        '--release', '--debug', '--target', '--features', '--all-features', 
        '--no-default-features', '--workspace', '--all', '--exclude',
        '--manifest-path', '--offline', '--frozen', '--locked', '--target-dir',
        '--color', '--quiet', '-q', '--verbose', '-v', '--jobs', '-j'
      ],
      requiresArgs: false,
      maxArgs: 25,
      description: 'Rust package manager with comprehensive command support'
    },
    {
      command: 'claude',
      allowedArgs: ['--help', '--version', '-p', '--print', '-c', '--continue', '-r', '--resume', 'update', 'mcp', '--add-dir', '--allowedTools', '--disallowedTools', '--output-format', '--verbose', '--model', '--permission-mode', '--dangerously-skip-permissions'],
      requiresArgs: false,
      maxArgs: 20,
      description: 'Claude Code CLI'
    },
    {
      command: 'claude-code',
      allowedArgs: ['--help', '--version', '-p', '--print', '-c', '--continue', '-r', '--resume', 'update', 'mcp', '--add-dir', '--allowedTools', '--disallowedTools', '--output-format', '--verbose', '--model', '--permission-mode', '--dangerously-skip-permissions', '--no-color', '--no-confirm', '--stream'],
      requiresArgs: false,
      maxArgs: 25,
      description: 'Claude Code CLI (real binary)'
    },
    {
      command: 'which',
      allowedArgs: ['claude-code', 'claude', 'node', 'npm', 'cargo', 'rustc', 'rustup', 'gemini'],
      requiresArgs: true,
      maxArgs: 1,
      description: 'Locate command path'
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
    const traceId = debugLogger.startTrace(DebugComponent.SECURE_EXECUTOR, 'executeCommand', {
      command,
      args,
      id,
      originalCommand
    });

    debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Starting command execution: ${originalCommand}`, {
      command,
      args: args.length,
      allowRealExecution: this.config.allowRealExecution
    });

    try {
      // Security validation
      const validation = this.validateExecution(command, args);
      if (!validation.isValid) {
        debugLogger.warn(DebugComponent.SECURE_EXECUTOR, `Command validation failed: ${validation.reason}`, {
          command: originalCommand,
          reason: validation.reason
        });

        SecurityUtils.logSecurityEvent('COMMAND_REJECTED', {
          command: originalCommand,
          reason: validation.reason
        });
        
        debugLogger.endTrace(traceId, { success: false, reason: validation.reason });
        
        return {
          id,
          command: originalCommand,
          output: `Security Error: ${validation.reason}`,
          timestamp,
          exitCode: 403
        };
      }

      debugLogger.debug(DebugComponent.SECURE_EXECUTOR, 'Command validation passed', {
        command,
        isAllowed: this.isCommandAllowed(command)
      });

      // Check if real execution is enabled and command is allowed
      if (this.config.allowRealExecution && this.isCommandAllowed(command)) {
        debugLogger.info(DebugComponent.SECURE_EXECUTOR, 'Executing command in real environment', { command });
        const result = await this.executeReal(command, args, id, originalCommand, timestamp);
        debugLogger.endTrace(traceId, { success: true, exitCode: result.exitCode, executionMode: 'real' });
        return result;
      } else {
        debugLogger.info(DebugComponent.SECURE_EXECUTOR, 'Executing command in simulated environment', {
          command,
          reason: !this.config.allowRealExecution ? 'Real execution disabled' : 'Command not allowed'
        });
        const result = await this.executeSimulated(command, args, id, originalCommand, timestamp);
        debugLogger.endTrace(traceId, { success: true, exitCode: result.exitCode, executionMode: 'simulated' });
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLogger.error(DebugComponent.SECURE_EXECUTOR, `Command execution error: ${errorMessage}`, {
        command: originalCommand,
        error,
        stackTrace: error instanceof Error ? error.stack : undefined
      });

      SecurityUtils.logSecurityEvent('EXECUTION_ERROR', {
        command: originalCommand,
        error: errorMessage
      });

      debugLogger.endTrace(traceId, { success: false, error: errorMessage });

      return {
        id,
        command: originalCommand,
        output: `Execution Error: ${errorMessage}`,
        timestamp,
        exitCode: 1
      };
    }
  }

  /**
   * Validate command execution against security rules
   */
  private validateExecution(command: string, args: string[]): { isValid: boolean; reason?: string } {
    debugLogger.trace(DebugComponent.SECURE_EXECUTOR, `Validating command execution`, {
      command,
      argsCount: args.length,
      args: args.slice(0, 5) // Only log first 5 args to avoid spam
    });

    // Check command name
    if (!SecurityUtils.validateCommand(command)) {
      debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Command failed format validation: ${command}`);
      return { isValid: false, reason: 'Invalid command format' };
    }

    // Check if command is in allowlist
    const allowlistEntry = SecureExecutor.COMMAND_ALLOWLIST.find(entry => entry.command === command);
    if (!allowlistEntry) {
      debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Command not in allowlist: ${command}`, {
        availableCommands: SecureExecutor.COMMAND_ALLOWLIST.map(entry => entry.command)
      });
      return { isValid: false, reason: 'Command not in allowlist' };
    }

    debugLogger.trace(DebugComponent.SECURE_EXECUTOR, `Found allowlist entry for command: ${command}`, {
      maxArgs: allowlistEntry.maxArgs,
      requiresArgs: allowlistEntry.requiresArgs,
      allowedArgsCount: allowlistEntry.allowedArgs.length
    });

    // Validate arguments
    if (args.length > allowlistEntry.maxArgs) {
      debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Too many arguments for command: ${command}`, {
        provided: args.length,
        maximum: allowlistEntry.maxArgs
      });
      return { isValid: false, reason: 'Too many arguments' };
    }

    if (allowlistEntry.requiresArgs && args.length === 0) {
      debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Command requires arguments but none provided: ${command}`);
      return { isValid: false, reason: 'Command requires arguments' };
    }

    // Validate each argument
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!this.validateArgument(arg, allowlistEntry.allowedArgs)) {
        debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Invalid argument at position ${i}: ${arg}`, {
          command,
          argumentIndex: i,
          allowedArgs: allowlistEntry.allowedArgs.slice(0, 10) // Limit to prevent spam
        });
        return { isValid: false, reason: `Invalid argument: ${arg}` };
      }
    }

    debugLogger.trace(DebugComponent.SECURE_EXECUTOR, `Command validation successful: ${command}`);
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
    const startTime = performance.now();
    
    debugLogger.info(DebugComponent.SECURE_EXECUTOR, `Starting real execution: ${originalCommand}`, {
      command,
      argsCount: args.length,
      timeout: this.config.timeoutMs,
      environment: Object.keys(this.config.environment)
    });

    // Log the execution attempt
    SecurityUtils.logSecurityEvent('REAL_EXECUTION', {
      command: originalCommand,
      timestamp
    });

    try {
      // Additional security validation for real execution
      debugLogger.trace(DebugComponent.SECURE_EXECUTOR, 'Performing additional security validation for real execution');
      const validation = ProcessExecutor.validateCommand(command, args);
      if (!validation.isValid) {
        debugLogger.warn(DebugComponent.SECURE_EXECUTOR, `Process executor validation failed: ${validation.reason}`, {
          command: originalCommand
        });
        return {
          id,
          command: originalCommand,
          output: `Security Error: ${validation.reason}`,
          timestamp,
          exitCode: 403
        };
      }

      debugLogger.debug(DebugComponent.SECURE_EXECUTOR, 'Calling ProcessExecutor.executeCommand', {
        command,
        timeout: this.config.timeoutMs,
        envVarCount: Object.keys(this.config.environment).length
      });

      // Execute the real command
      const result = await ProcessExecutor.executeCommand(command, args, {
        timeout: this.config.timeoutMs,
        env: this.config.environment
      });

      const executionTime = performance.now() - startTime;
      
      debugLogger.info(DebugComponent.SECURE_EXECUTOR, `Real execution completed: ${originalCommand}`, {
        exitCode: result.exitCode,
        executionTime: Math.round(executionTime),
        stdoutLength: result.stdout?.length || 0,
        stderrLength: result.stderr?.length || 0,
        success: result.exitCode === 0
      });

      // Combine stdout and stderr
      let output = result.stdout;
      if (result.stderr) {
        output += result.stderr ? `\n${result.stderr}` : '';
      }

      const terminalCommand = {
        id,
        command: originalCommand,
        output: output || '(No output)',
        timestamp,
        exitCode: result.exitCode
      };

      // Log execution result using the debugLogger's convenience method
      debugLogger.logCommandExecution(DebugComponent.SECURE_EXECUTOR, command, args, terminalCommand, executionTime);

      return terminalCommand;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      debugLogger.error(DebugComponent.SECURE_EXECUTOR, `Real execution failed: ${originalCommand}`, {
        error: errorMessage,
        executionTime: Math.round(executionTime),
        stackTrace: error instanceof Error ? error.stack : undefined
      });

      return {
        id,
        command: originalCommand,
        output: `Execution failed: ${errorMessage}`,
        timestamp,
        exitCode: 1
      };
    }
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
    const startTime = performance.now();
    
    debugLogger.info(DebugComponent.SECURE_EXECUTOR, `Starting simulated execution: ${originalCommand}`, {
      command,
      argsCount: args.length
    });

    const simulatedOutputs: Record<string, (args: string[]) => string> = {
      'gemini': (args) => this.simulateGemini(args),
      'rustc': (args) => this.simulateRustc(args),
      'rustup': (args) => this.simulateRustup(args),
      'cargo': (args) => this.simulateCargo(args),
      'claude': (args) => this.simulateClaude(args)
    };

    const outputGenerator = simulatedOutputs[command];
    const hasSimulation = !!outputGenerator;
    
    debugLogger.debug(DebugComponent.SECURE_EXECUTOR, `Using ${hasSimulation ? 'custom' : 'default'} simulation for command: ${command}`, {
      availableSimulations: Object.keys(simulatedOutputs)
    });

    const output = outputGenerator ? outputGenerator(args) : `${command}: command simulation not available`;
    const executionTime = performance.now() - startTime;

    const result = {
      id,
      command: originalCommand,
      output,
      timestamp,
      exitCode: 0
    };

    debugLogger.info(DebugComponent.SECURE_EXECUTOR, `Simulated execution completed: ${originalCommand}`, {
      executionTime: Math.round(executionTime),
      outputLength: output.length,
      hasCustomSimulation: hasSimulation
    });

    debugLogger.logCommandExecution(DebugComponent.SECURE_EXECUTOR, command, args, result, executionTime);

    return Promise.resolve(result);
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
   * Enhanced Cargo simulation with comprehensive command support
   */
  private simulateCargo(args: string[]): string {
    if (args.includes('--version')) {
      return 'cargo 1.88.0 (873a06493 2025-05-10)';
    }

    if (args.includes('--help')) {
      return `Cargo 1.88.0
Rust's package manager

USAGE:
    cargo [+toolchain] [OPTIONS] [COMMAND]

OPTIONS:
    -v, --verbose                Use verbose output (-vv very verbose/build.rs output)
    -q, --quiet                  Do not print cargo log messages
        --color <WHEN>           Coloring: auto, always, never
        --frozen                 Require Cargo.lock and cache are up to date
        --locked                 Require Cargo.lock is up to date
        --offline                Run without accessing the network

Some common cargo commands are (see all commands with --list):
    build, b    Compile the current package
    check, c    Analyze the current package and report errors, but don't build object files
    clean       Remove the target directory
    doc         Build this package's and its dependencies' documentation
    new         Create a new cargo package
    init        Create a new cargo package in an existing directory
    add         Add dependencies to a manifest file
    remove      Remove dependencies from a manifest file
    run, r      Run a binary or example of the local package
    test, t     Run the tests
    bench       Run the benchmarks
    update      Update dependencies listed in Cargo.lock
    search      Search registry for crates
    publish     Package and upload this package to the registry
    install     Install a Rust binary. Default location is $HOME/.cargo/bin
    uninstall   Uninstall a Rust binary`;
    }

    if (args.includes('--list')) {
      return `Installed Commands:
    build            Compile the current package
    check            Analyze the current package and report errors
    clean            Remove the target directory
    doc              Build this package's and its dependencies' documentation
    new              Create a new cargo package
    init             Create a new cargo package in an existing directory
    add              Add dependencies to a manifest file
    remove           Remove dependencies from a manifest file  
    run              Run a binary or example of the local package
    test             Run the tests
    bench            Run the benchmarks
    update           Update dependencies listed in Cargo.lock
    search           Search registry for crates
    publish          Package and upload this package to the registry
    install          Install a Rust binary
    uninstall        Uninstall a Rust binary
    fmt              Rustfmt (format code)
    clippy           Clippy (linter)
    tree             Display dependency tree
    audit            Audit dependencies for security vulnerabilities
    fix              Automatically fix lint warnings
    locate-project   Print the absolute path of the current Cargo.toml
    metadata         Output the resolved dependencies
    pkgid            Print a fully qualified package specification
    verify-project   Check correctness of crate manifest`;
    }

    // Build command with different options
    if (args.includes('build')) {
      const isRelease = args.includes('--release');
      const buildType = isRelease ? 'release [optimized]' : 'dev [unoptimized + debuginfo]';
      const time = isRelease ? '45.67s' : '2.34s';
      
      return `   Compiling rust-terminal-forge v0.1.0 (/workspaces/rust-terminal-forge)
    Finished ${buildType} target(s) in ${time}`;
    }

    // Check command
    if (args.includes('check')) {
      return `    Checking rust-terminal-forge v0.1.0 (/workspaces/rust-terminal-forge)
    Finished dev [unoptimized + debuginfo] target(s) in 0.45s`;
    }

    // Clean command
    if (args.includes('clean')) {
      return `   Removed 3 files, 45.2MB from target directory`;
    }

    // Run command
    if (args.includes('run')) {
      return `    Finished dev [unoptimized + debuginfo] target(s) in 0.12s
     Running \`target/debug/rust-terminal-forge\`
Hello, Rust Terminal Forge!
Application started successfully.`;
    }

    // Test command with comprehensive output
    if (args.includes('test')) {
      return `   Compiling rust-terminal-forge v0.1.0 (/workspaces/rust-terminal-forge)
    Finished test [unoptimized + debuginfo] target(s) in 1.23s
     Running unittests src/lib.rs (target/debug/deps/rust_terminal_forge-abc123)

running 8 tests
test core::commands::test_cargo_commands ... ok
test core::commands::test_rust_commands ... ok
test core::security::test_secure_execution ... ok
test core::security::test_command_validation ... ok
test core::security::test_input_sanitization ... ok
test terminal::test_command_processing ... ok
test terminal::test_environment_setup ... ok
test integration::test_rust_toolchain ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s`;
    }

    // New project command
    if (args.includes('new')) {
      const projectName = args[args.indexOf('new') + 1] || 'my-project';
      const projectType = args.includes('--lib') ? 'library' : 'binary (application)';
      
      return `     Created ${projectType} package \`${projectName}\` package`;
    }

    // Init command
    if (args.includes('init')) {
      const projectType = args.includes('--lib') ? 'library' : 'binary (application)';
      
      return `     Created ${projectType} package`;
    }

    // Add dependency command
    if (args.includes('add')) {
      const dependency = args[args.indexOf('add') + 1] || 'serde';
      
      return `    Updating crates.io index
      Adding ${dependency} v1.0 to dependencies.
                Features:
                + derive
                + std
                (and 3 more)`;
    }

    // Tree command
    if (args.includes('tree')) {
      return `rust-terminal-forge v0.1.0 (/workspaces/rust-terminal-forge)
├── tokio v1.0.0
├── warp v0.3.0
├── serde v1.0.0
│   └── serde_derive v1.0.0
├── serde_json v1.0.0
├── uuid v1.0.0
└── portable-pty v0.8.0`;
    }

    // Update command
    if (args.includes('update')) {
      return `    Updating crates.io index
    Updating tokio v1.0.0 -> v1.0.1
    Updating serde v1.0.0 -> v1.0.1`;
    }

    // Doc command
    if (args.includes('doc')) {
      const openFlag = args.includes('--open') ? '\n    Opening docs in browser...' : '';
      
      return `   Documenting rust-terminal-forge v0.1.0 (/workspaces/rust-terminal-forge)
    Finished dev [unoptimized + debuginfo] target(s) in 3.45s${openFlag}`;
    }

    // Fmt command
    if (args.includes('fmt')) {
      return `Diff in /workspaces/rust-terminal-forge/src/lib.rs at line 42:
-    let result=foo();
+    let result = foo();
`;
    }

    // Clippy command
    if (args.includes('clippy')) {
      return `    Checking rust-terminal-forge v0.1.0 (/workspaces/rust-terminal-forge)
    Finished dev [unoptimized + debuginfo] target(s) in 1.23s
warning: unused variable: \`result\`
 --> src/main.rs:42:9
   |
42 |     let result = process_command();
   |         ^^^^^^ help: if this is intentional, prefix it with an underscore: \`_result\`
   |
   = note: \`#[warn(unused_variables)]\` on by default

warning: \`rust-terminal-forge\` (bin "rust-terminal-forge") generated 1 warning`;
    }

    // Locate project command
    if (args.includes('locate-project')) {
      return `{"root":"/workspaces/rust-terminal-forge/Cargo.toml"}`;
    }

    // Metadata command
    if (args.includes('metadata')) {
      return `{"packages":[{"name":"rust-terminal-forge","version":"0.1.0","id":"rust-terminal-forge 0.1.0 (path+file:///workspaces/rust-terminal-forge)"}],"workspace_members":["rust-terminal-forge 0.1.0 (path+file:///workspaces/rust-terminal-forge)"],"resolve":{"nodes":[{"id":"rust-terminal-forge 0.1.0 (path+file:///workspaces/rust-terminal-forge)","dependencies":[]}],"root":"rust-terminal-forge 0.1.0 (path+file:///workspaces/rust-terminal-forge)"},"target_directory":"/workspaces/rust-terminal-forge/target","version":1,"workspace_root":"/workspaces/rust-terminal-forge","metadata":null}`;
    }

    // Search command
    if (args.includes('search')) {
      const query = args[args.indexOf('search') + 1] || 'serde';
      
      return `serde = "1.0.210"    # A generic serialization/deserialization framework
serde_json = "1.0.128"  # A JSON serialization file format
serde_derive = "1.0.210" # Macros 1.1 implementation of #[derive(Serialize, Deserialize)]
serde_yaml = "0.9.34"   # YAML data format for Serde`;
    }

    return 'Use "cargo --help" for usage information';
  }

  /**
   * Simulate Claude CLI responses
   */
  private simulateClaude(args: string[]): string {
    if (args.includes('--help')) {
      return `Claude Code - AI Assistant for Development

Usage: claude [OPTIONS] [PROMPT]

REPL Usage:
  claude                           Start interactive REPL
  claude "query"                   Start REPL with initial prompt
  
One-shot Usage:
  claude -p "query"                Query via SDK and exit
  claude -c                        Continue most recent conversation
  claude -r "<session-id>"         Resume session by ID

Commands:
  claude update                    Update to latest version
  claude mcp                       Configure Model Context Protocol servers

Options:
  --add-dir <PATH>           Add working directory
  --allowedTools <TOOLS>     Specify allowed tools (comma-separated)
  --disallowedTools <TOOLS>  Specify disallowed tools (comma-separated)
  -p, --print                Print response without interactive mode
  --output-format <FORMAT>   Set response output format (text, json)
  --verbose                  Enable detailed logging
  --model <MODEL>            Set specific model for session
  --permission-mode <MODE>   Set permission mode (strict, normal, loose)
  -c, --continue             Load most recent conversation
  -r, --resume <SESSION>     Resume specific session
  --dangerously-skip-permissions  Skip permission prompts (use with caution)
  --help                     Show this help message
  --version                  Show version information`;
    }

    if (args.includes('--version')) {
      return 'claude 0.8.1';
    }

    return 'Use "claude --help" for usage information';
  }

  /**
   * Get available commands for help display
   */
  static getAvailableCommands(): CommandAllowlist[] {
    return SecureExecutor.COMMAND_ALLOWLIST;
  }
}