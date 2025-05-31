
// Core command processor for terminal commands
import { TerminalCommand } from './types';

export class CommandProcessor {
  private currentPath: string = '/home/user/project';
  private fileSystem: Record<string, string[]> = {
    '/home/user/project': ['Cargo.toml', 'src/', 'target/', 'README.md'],
    '/home/user/project/src': ['main.rs', 'lib.rs'],
    '/home/user/project/target': ['debug/', 'release/']
  };

  processCommand(input: string): TerminalCommand {
    const command = input.trim();
    const parts = command.split(' ');
    const baseCommand = parts[0];
    const args = parts.slice(1);

    const id = Date.now().toString();
    const timestamp = new Date().toISOString();

    switch (baseCommand) {
      case 'pwd':
        return {
          id,
          command,
          output: this.currentPath,
          timestamp,
          exitCode: 0
        };

      case 'ls':
        const contents = this.fileSystem[this.currentPath] || [];
        return {
          id,
          command,
          output: contents.join('\n'),
          timestamp,
          exitCode: 0
        };

      case 'cd':
        return this.handleCd(args, id, command, timestamp);

      case 'cargo':
        return this.handleCargo(args, id, command, timestamp);

      case 'clear':
        return {
          id,
          command,
          output: '__CLEAR__',
          timestamp,
          exitCode: 0
        };

      case 'help':
        return {
          id,
          command,
          output: this.getHelpText(),
          timestamp,
          exitCode: 0
        };

      default:
        return {
          id,
          command,
          output: `bash: ${baseCommand}: command not found`,
          timestamp,
          exitCode: 127
        };
    }
  }

  private handleCd(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    const targetPath = args[0] || '/home/user';
    
    if (targetPath === '..') {
      const pathParts = this.currentPath.split('/');
      pathParts.pop();
      this.currentPath = pathParts.join('/') || '/';
    } else if (targetPath.startsWith('/')) {
      this.currentPath = targetPath;
    } else {
      this.currentPath = `${this.currentPath}/${targetPath}`.replace('//', '/');
    }

    return {
      id,
      command,
      output: '',
      timestamp,
      exitCode: 0
    };
  }

  private handleCargo(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    const subCommand = args[0];
    
    // Simulate cargo command execution
    const cargoCommands: Record<string, string> = {
      'build': 'Compiling rust-project v0.1.0\n   Finished dev [unoptimized + debuginfo] target(s) in 2.34s',
      'build --release': 'Compiling rust-project v0.1.0\n   Finished release [optimized] target(s) in 45.67s',
      'test': 'running 3 tests\ntest tests::test_one ... ok\ntest tests::test_two ... ok\ntest tests::test_three ... ok\n\ntest result: ok. 3 passed; 0 failed; 0 ignored',
      'check': 'Checking rust-project v0.1.0\n   Finished dev [unoptimized + debuginfo] target(s) in 0.45s',
      'clean': 'Removed target directory'
    };

    const fullArgs = args.join(' ');
    const output = cargoCommands[fullArgs] || cargoCommands[subCommand] || `error: no such subcommand: \`${subCommand}\``;
    const exitCode = cargoCommands[fullArgs] || cargoCommands[subCommand] ? 0 : 1;

    return {
      id,
      command,
      output,
      timestamp,
      exitCode
    };
  }

  private getHelpText(): string {
    return `Available commands:
  pwd        - Show current directory
  ls         - List directory contents
  cd <dir>   - Change directory
  cargo      - Rust package manager
    build    - Compile the current package
    test     - Run tests
    check    - Check code without building
    clean    - Remove target directory
  clear      - Clear terminal
  help       - Show this help message`;
  }

  getCurrentPath(): string {
    return this.currentPath;
  }
}
