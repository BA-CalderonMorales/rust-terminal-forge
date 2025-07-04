
import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';

export class UtilityCommands extends BaseCommandHandler {
  private commandHistory: string[] = [];
  private aliases: Map<string, string> = new Map([
    ['ll', 'ls -la'],
    ['la', 'ls -a'],
    ['..', 'cd ..']
  ]);

  addToHistory(command: string): void {
    this.commandHistory.push(command);
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory.slice(-1000);
    }
  }

  expandAliases(command: string): string {
    const parts = command.split(' ');
    const baseCommand = parts[0];
    
    if (this.aliases.has(baseCommand)) {
      const aliasCommand = this.aliases.get(baseCommand)!;
      return `${aliasCommand} ${parts.slice(1).join(' ')}`.trim();
    }
    
    return command;
  }

  handleHistory(id: string, command: string, timestamp: string): TerminalCommand {
    const args = command.split(/\s+/).slice(1);
    if (args.includes('-c')) {
      this.commandHistory = [];
      return this.generateCommand(id, command, '', timestamp);
    }

    let count = 50;
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && args[nIndex + 1]) {
      const parsed = parseInt(args[nIndex + 1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        count = parsed;
      }
    }

    const startIndex = Math.max(0, this.commandHistory.length - count);
    const historyOutput = this.commandHistory
      .slice(-count)
      .map((cmd, index) => `${(startIndex + index + 1).toString().padStart(4)}: ${cmd}`)
      .join('\n');

    return this.generateCommand(id, command, historyOutput, timestamp);
  }

  handleAlias(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      const aliasOutput = Array.from(this.aliases.entries())
        .map(([alias, cmd]) => `alias ${alias}='${cmd}'`)
        .join('\n');
      
      return this.generateCommand(id, command, aliasOutput, timestamp);
    }

    const aliasDefinition = args.join(' ');
    const match = aliasDefinition.match(/^(\w+)=(.+)$/);
    
    if (match) {
      const [, aliasName, aliasCommand] = match;
      this.aliases.set(aliasName, aliasCommand.replace(/['"]/g, ''));
      return this.generateCommand(id, command, '', timestamp);
    }

    return this.generateCommand(id, command, 'alias: invalid alias definition', timestamp, 1);
  }

  handleClear(id: string, command: string, timestamp: string): TerminalCommand {
    return this.generateCommand(id, command, '__CLEAR__', timestamp);
  }

  handleHelp(id: string, command: string, timestamp: string): TerminalCommand {
    const helpText = `Available commands:
  pwd        - Show current directory
  ls [-lah]  - List directory contents
  cd <dir>   - Change directory (supports: ., .., -, ~, absolute and relative paths)
  mkdir      - Create directory
  touch      - Create or update file
  cat        - Display file contents
  vim <file> - View file in read-only mode
  echo       - Display text
  whoami     - Show current user
  date       - Show current date and time
  env        - Show environment variables
  uptime     - Show how long the system has been running
  hostname   - Display host name
  which      - Locate a command
  history    - Show command history
    -c       - Clear command history
    -n <num> - Show last <num> entries
  alias      - Show or set command aliases
  clear      - Clear terminal
  help       - Show this help message

Rust Development:
  cargo      - Rust package manager
    build    - Compile the current package
    test     - Run tests
    check    - Check code without building
    clean    - Remove target directory
    doc      - Generate documentation
    fmt      - Format code
    clippy   - Run linter
  rustc      - Rust compiler
    --version - Show compiler version
    --help    - Show compiler help
  rustup     - Rust toolchain manager
    show      - Show active toolchain
    update    - Update toolchains
  rust-dev   - Extended Rust development tools
    new       - Create new Rust project
    init      - Initialize project in current directory
    fmt       - Format all Rust files
    clippy    - Run comprehensive linting
    doc       - Generate documentation

Gemini AI:
  gemini     - Gemini CLI tool
    --help    - Show Gemini help
    --version - Show Gemini version
    list      - List available models
    auth      - Manage authentication
    chat      - Interactive chat with Gemini

Navigation examples:
  cd .       - Stay in current directory
  cd ..      - Go up one level
  cd -       - Go to previous directory
  cd ~       - Go to home directory
  cd /path   - Go to absolute path
  cd folder  - Go to subfolder

Security Notice:
  All commands run in a secure, sandboxed environment.
  Real command execution is available for approved tools only.`;

    return this.generateCommand(id, command, helpText, timestamp);
  }
}
