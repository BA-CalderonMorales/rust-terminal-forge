
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
    const historyOutput = this.commandHistory
      .slice(-50)
      .map((cmd, index) => `${(this.commandHistory.length - 50 + index + 1).toString().padStart(4)}: ${cmd}`)
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
  cd <dir>   - Change directory (supports: ., .., ~, absolute and relative paths)
  mkdir      - Create directory
  touch      - Create or update file
  cat        - Display file contents
  echo       - Display text
  whoami     - Show current user
  date       - Show current date and time
  env        - Show environment variables
  which      - Locate a command
  history    - Show command history
  alias      - Show or set command aliases
  cargo      - Rust package manager
    build    - Compile the current package
    test     - Run tests
    check    - Check code without building
    clean    - Remove target directory
  clear      - Clear terminal
  help       - Show this help message

Navigation examples:
  cd .       - Stay in current directory
  cd ..      - Go up one level
  cd ~       - Go to home directory
  cd /path   - Go to absolute path
  cd folder  - Go to subfolder`;

    return this.generateCommand(id, command, helpText, timestamp);
  }
}
