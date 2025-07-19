import { describe, it, expect, beforeEach } from 'vitest';
import { SecureExecutor } from '../src/core/SecureExecutor';
import { SecureCommandProcessor } from '../src/core/SecureCommandProcessor';
import { GeminiCommands } from '../src/core/commands/GeminiCommands';
import { RustCommands } from '../src/core/commands/RustCommands';

let secureExecutor: SecureExecutor;
let geminiCommands: GeminiCommands;
let rustCommands: RustCommands;
const ts = '2024-01-01T00:00:00Z';

beforeEach(() => {
  secureExecutor = new SecureExecutor();
  geminiCommands = new GeminiCommands();
  rustCommands = new RustCommands();
});

describe('SecureExecutor', () => {
  it('validates command allowlist', async () => {
    const result = await secureExecutor.executeCommand('gemini', ['--help'], '1', 'gemini --help', ts);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('Gemini CLI');
  });

  it('rejects non-allowlisted commands', async () => {
    const result = await secureExecutor.executeCommand('rm', ['-rf', '/'], '1', 'rm -rf /', ts);
    expect(result.exitCode).toBe(403);
    expect(result.output).toContain('Security Error');
  });

  it('validates argument count', async () => {
    const manyArgs = Array(20).fill('arg');
    const result = await secureExecutor.executeCommand('gemini', manyArgs, '1', 'gemini with many args', ts);
    expect(result.exitCode).toBe(403);
    expect(result.output).toContain('Too many arguments');
  });

  it('gets available commands', () => {
    const commands = SecureExecutor.getAvailableCommands();
    expect(commands).toHaveLength(7); // Updated count: gemini, rustc, rustup, cargo, claude, claude-code, which
    expect(commands.some(cmd => cmd.command === 'gemini')).toBe(true);
    expect(commands.some(cmd => cmd.command === 'rustc')).toBe(true);
    expect(commands.some(cmd => cmd.command === 'claude-code')).toBe(true);
    expect(commands.some(cmd => cmd.command === 'which')).toBe(true);
  });

  it('allows claude-code command with valid arguments', async () => {
    const processor = new SecureCommandProcessor();
    const result = await processor.processCommand('claude-code --help');
    // Should provide help text regardless of whether real claude-code is installed
    expect(result.output).toContain('Claude Code');
    // If claude-code isn't installed, it should provide installation instructions (exit code 1)
    // If it is installed, it should show help (exit code 0)
    expect([0, 1]).toContain(result.exitCode);
  });

  it('handles claude-code version command', async () => {
    const processor = new SecureCommandProcessor();
    const result = await processor.processCommand('claude-code --version');
    // Should handle version command regardless of installation status
    expect(result.output.length).toBeGreaterThan(0);
    expect([0, 1]).toContain(result.exitCode);
  });
});

describe('GeminiCommands', () => {
  it('shows help by default', async () => {
    const result = await geminiCommands.handleGemini([], '1', 'gemini', ts);
    expect(result.output).toContain('Gemini CLI');
    expect(result.output).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });

  it('shows version', async () => {
    const result = await geminiCommands.handleGemini(['--version'], '1', 'gemini --version', ts);
    expect(result.output).toContain('Gemini CLI v1.0.0');
    expect(result.exitCode).toBe(0);
  });

  it('lists available models', async () => {
    const result = await geminiCommands.handleGeminiList([], '1', 'gemini list', ts);
    expect(result.output).toContain('gemini-pro');
    expect(result.output).toContain('gemini-pro-vision');
    expect(result.exitCode).toBe(0);
  });

  it('shows detailed model information', async () => {
    const result = await geminiCommands.handleGeminiList(['--detailed'], '1', 'gemini list --detailed', ts);
    expect(result.output).toContain('Context Length:');
    expect(result.output).toContain('Description:');
    expect(result.exitCode).toBe(0);
  });

  it('handles authentication status', async () => {
    const result = await geminiCommands.handleGeminiAuth(['--status'], '1', 'gemini auth --status', ts);
    expect(result.output).toContain('Authentication Status:');
    expect(result.exitCode).toBe(0);
  });

  it('handles chat with message', async () => {
    const result = await geminiCommands.handleGeminiChat(['Hello'], '1', 'gemini chat Hello', ts);
    expect(result.output).toContain('Hello');
    expect(result.exitCode).toBe(0);
  });

  it('handles chat help', async () => {
    const result = await geminiCommands.handleGeminiChat(['--help'], '1', 'gemini chat --help', ts);
    expect(result.output).toContain('Gemini Chat');
    expect(result.output).toContain('Usage:');
    expect(result.exitCode).toBe(0);
  });

  it('handles chat without message', async () => {
    const result = await geminiCommands.handleGeminiChat(['--max-tokens', '1000'], '1', 'gemini chat --max-tokens 1000', ts);
    expect(result.output).toContain('No message provided');
    expect(result.exitCode).toBe(1);
  });

  it('responds to rust-related queries', async () => {
    const result = await geminiCommands.handleGeminiChat(['Tell me about Rust programming'], '1', 'gemini chat Tell me about Rust programming', ts);
    expect(result.output).toContain('Rust');
    expect(result.exitCode).toBe(0);
  });

  it('checks real execution mode', () => {
    expect(geminiCommands.isRealExecutionEnabled()).toBe(false);
    geminiCommands.enableRealExecution();
    expect(geminiCommands.isRealExecutionEnabled()).toBe(true);
  });
});

describe('RustCommands', () => {
  it('handles cargo version', async () => {
    const result = await rustCommands.handleCargo(['--version'], '1', 'cargo --version', ts);
    expect(result.output).toContain('cargo 1.75.0');
    expect(result.exitCode).toBe(0);
  });

  it('handles cargo build', async () => {
    const result = await rustCommands.handleCargo(['build'], '1', 'cargo build', ts);
    expect(result.output).toContain('Compiling');
    expect(result.output).toContain('Finished');
    expect(result.exitCode).toBe(0);
  });

  it('handles cargo test', async () => {
    const result = await rustCommands.handleCargo(['test'], '1', 'cargo test', ts);
    expect(result.output).toContain('running');
    expect(result.output).toContain('test result: ok');
    expect(result.exitCode).toBe(0);
  });

  it('handles rustc version', async () => {
    const result = await rustCommands.handleRustc(['--version'], '1', 'rustc --version', ts);
    expect(result.output).toContain('rustc 1.75.0');
    expect(result.exitCode).toBe(0);
  });

  it('handles rustup show', async () => {
    const result = await rustCommands.handleRustup(['show'], '1', 'rustup show', ts);
    expect(result.output).toContain('Default host:');
    expect(result.output).toContain('active toolchain');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev new project', async () => {
    const result = await rustCommands.handleRustDev(['new', 'my-project'], '1', 'rust-dev new my-project', ts);
    expect(result.output).toContain('Created binary package');
    expect(result.output).toContain('my-project');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev new library', async () => {
    const result = await rustCommands.handleRustDev(['new', '--lib', 'my-lib'], '1', 'rust-dev new --lib my-lib', ts);
    expect(result.output).toContain('Created library package');
    expect(result.output).toContain('lib.rs');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev init', async () => {
    const result = await rustCommands.handleRustDev(['init'], '1', 'rust-dev init', ts);
    expect(result.output).toContain('Created binary package');
    expect(result.output).toContain('Cargo.toml');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev fmt', async () => {
    const result = await rustCommands.handleRustDev(['fmt'], '1', 'rust-dev fmt', ts);
    expect(result.output).toContain('Formatting');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev fmt check', async () => {
    const result = await rustCommands.handleRustDev(['fmt', '--check'], '1', 'rust-dev fmt --check', ts);
    expect(result.output).toContain('properly formatted');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev clippy', async () => {
    const result = await rustCommands.handleRustDev(['clippy'], '1', 'rust-dev clippy', ts);
    expect(result.output).toContain('Checking');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev doc', async () => {
    const result = await rustCommands.handleRustDev(['doc'], '1', 'rust-dev doc', ts);
    expect(result.output).toContain('Documenting');
    expect(result.output).toContain('target/doc');
    expect(result.exitCode).toBe(0);
  });

  it('handles rust-dev doc with open', async () => {
    const result = await rustCommands.handleRustDev(['doc', '--open'], '1', 'rust-dev doc --open', ts);
    expect(result.output).toContain('Opening documentation');
    expect(result.exitCode).toBe(0);
  });

  it('handles unknown rust-dev subcommand', async () => {
    const result = await rustCommands.handleRustDev(['unknown'], '1', 'rust-dev unknown', ts);
    expect(result.output).toContain('unknown subcommand');
    expect(result.exitCode).toBe(1);
  });

  it('handles rust-dev new without project name', async () => {
    const result = await rustCommands.handleRustDev(['new'], '1', 'rust-dev new', ts);
    expect(result.output).toContain('project name required');
    expect(result.exitCode).toBe(1);
  });

  it('gets rust development help', () => {
    const help = rustCommands.getRustDevHelp();
    expect(help).toContain('Core Rust Tools:');
    expect(help).toContain('rustc');
    expect(help).toContain('cargo');
    expect(help).toContain('rust-dev');
  });

  it('checks real execution mode', () => {
    expect(rustCommands.isRealExecutionEnabled()).toBe(false);
    rustCommands.enableRealExecution();
    expect(rustCommands.isRealExecutionEnabled()).toBe(true);
  });
});

describe('Command Integration', () => {
  it('handles gemini command variations', async () => {
    const commands = [
      { cmd: 'gemini', args: ['--help'] },
      { cmd: 'gemini', args: ['--version'] },
      { cmd: 'gemini', args: ['list'] },
      { cmd: 'gemini', args: ['auth', '--status'] },
      { cmd: 'gemini', args: ['chat', 'Hello', 'world'] }
    ];

    for (const { cmd, args } of commands) {
      const result = await secureExecutor.executeCommand(cmd, args, '1', `${cmd} ${args.join(' ')}`, ts);
      expect(result.exitCode).toBe(0);
    }
  });

  it('handles rust command variations', async () => {
    const commands = [
      { cmd: 'cargo', args: ['--version'] },
      { cmd: 'rustc', args: ['--version'] },
      { cmd: 'rustup', args: ['show'] }
    ];

    for (const { cmd, args } of commands) {
      const result = await secureExecutor.executeCommand(cmd, args, '1', `${cmd} ${args.join(' ')}`, ts);
      expect(result.exitCode).toBe(0);
    }
  });

  it('maintains security boundaries', async () => {
    const dangerousCommands = [
      { cmd: 'rm', args: ['-rf', '/'] },
      { cmd: 'curl', args: ['malicious.com'] },
      { cmd: 'wget', args: ['evil.script'] },
      { cmd: 'python', args: ['-c', 'import os; os.system("rm -rf /")'] }
    ];

    for (const { cmd, args } of dangerousCommands) {
      const result = await secureExecutor.executeCommand(cmd, args, '1', `${cmd} ${args.join(' ')}`, ts);
      expect(result.exitCode).toBe(403);
      expect(result.output).toContain('Security Error');
    }
  });
});