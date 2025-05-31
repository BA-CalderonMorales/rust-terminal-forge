// Secure command processor with input validation and path traversal protection
import { TerminalCommand } from './types';

interface FileSystemNode {
  type: 'file' | 'directory';
  name: string;
  size?: number;
  permissions: string;
  lastModified: string;
}

interface FileSystem {
  [path: string]: FileSystemNode[];
}

export class SecureCommandProcessor {
  private currentPath: string = '/home/user/project';
  private readonly homeDirectory: string = '/home/user';
  private readonly allowedPaths: Set<string> = new Set([
    '/home/user',
    '/home/user/project',
    '/home/user/project/src',
    '/home/user/project/target',
    '/home/user/documents',
    '/tmp'
  ]);

  private fileSystem: FileSystem = {
    '/home/user': [
      { type: 'directory', name: 'project', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:30' },
      { type: 'directory', name: 'documents', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 09:15' },
      { type: 'file', name: '.bashrc', size: 1024, permissions: '-rw-r--r--', lastModified: '2024-01-10 14:20' }
    ],
    '/home/user/project': [
      { type: 'file', name: 'Cargo.toml', size: 456, permissions: '-rw-r--r--', lastModified: '2024-01-15 10:30' },
      { type: 'directory', name: 'src', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:25' },
      { type: 'directory', name: 'target', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:28' },
      { type: 'file', name: 'README.md', size: 2048, permissions: '-rw-r--r--', lastModified: '2024-01-15 09:45' }
    ],
    '/home/user/project/src': [
      { type: 'file', name: 'main.rs', size: 1536, permissions: '-rw-r--r--', lastModified: '2024-01-15 10:25' },
      { type: 'file', name: 'lib.rs', size: 512, permissions: '-rw-r--r--', lastModified: '2024-01-15 09:30' }
    ],
    '/home/user/project/target': [
      { type: 'directory', name: 'debug', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:28' },
      { type: 'directory', name: 'release', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:00' }
    ],
    '/home/user/documents': [
      { type: 'file', name: 'notes.txt', size: 1024, permissions: '-rw-r--r--', lastModified: '2024-01-14 16:20' }
    ]
  };

  private commandHistory: string[] = [];
  private aliases: Map<string, string> = new Map([
    ['ll', 'ls -la'],
    ['la', 'ls -a'],
    ['..', 'cd ..']
  ]);

  processCommand(input: string): TerminalCommand {
    const sanitizedInput = this.sanitizeInput(input.trim());
    const command = this.expandAliases(sanitizedInput);
    const parts = this.parseCommand(command);
    const baseCommand = parts[0];
    const args = parts.slice(1);

    const id = this.generateSecureId();
    const timestamp = new Date().toISOString();

    // Add to command history
    this.commandHistory.push(command);
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory.slice(-1000);
    }

    try {
      switch (baseCommand) {
        case 'pwd':
          return this.handlePwd(id, command, timestamp);
        case 'ls':
          return this.handleLs(args, id, command, timestamp);
        case 'cd':
          return this.handleCd(args, id, command, timestamp);
        case 'mkdir':
          return this.handleMkdir(args, id, command, timestamp);
        case 'touch':
          return this.handleTouch(args, id, command, timestamp);
        case 'cat':
          return this.handleCat(args, id, command, timestamp);
        case 'history':
          return this.handleHistory(id, command, timestamp);
        case 'alias':
          return this.handleAlias(args, id, command, timestamp);
        case 'cargo':
          return this.handleCargo(args, id, command, timestamp);
        case 'clear':
          return this.handleClear(id, command, timestamp);
        case 'help':
          return this.handleHelp(id, command, timestamp);
        default:
          return {
            id,
            command,
            output: `bash: ${baseCommand}: command not found\n\nDid you mean:\n${this.suggestCommand(baseCommand)}`,
            timestamp,
            exitCode: 127
          };
      }
    } catch (error) {
      return {
        id,
        command,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp,
        exitCode: 1
      };
    }
  }

  private sanitizeInput(input: string): string {
    // Remove dangerous characters and sequences
    return input
      .replace(/[;&|`$(){}[\]]/g, '')
      .replace(/\.\.\//g, '')
      .replace(/\/\.\./g, '')
      .trim();
  }

  private expandAliases(command: string): string {
    const parts = command.split(' ');
    const baseCommand = parts[0];
    
    if (this.aliases.has(baseCommand)) {
      const aliasCommand = this.aliases.get(baseCommand)!;
      return `${aliasCommand} ${parts.slice(1).join(' ')}`.trim();
    }
    
    return command;
  }

  private parseCommand(command: string): string[] {
    // Simple command parsing - can be enhanced for complex shell syntax
    return command.split(/\s+/).filter(part => part.length > 0);
  }

  private generateSecureId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private validatePath(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.allowedPaths.has(normalizedPath) || 
           Array.from(this.allowedPaths).some(allowed => normalizedPath.startsWith(allowed + '/'));
  }

  private normalizePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    
    if (path === '~') {
      return this.homeDirectory;
    }
    
    if (path.startsWith('~/')) {
      return path.replace('~', this.homeDirectory);
    }
    
    // Handle relative paths
    const parts = this.currentPath.split('/').concat(path.split('/'));
    const normalized: string[] = [];
    
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        normalized.pop();
      } else {
        normalized.push(part);
      }
    }
    
    return '/' + normalized.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  private handlePwd(id: string, command: string, timestamp: string): TerminalCommand {
    return {
      id,
      command,
      output: this.currentPath,
      timestamp,
      exitCode: 0
    };
  }

  private handleLs(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
    
    const targetPath = args.find(arg => !arg.startsWith('-')) || this.currentPath;
    const normalizedPath = this.normalizePath(targetPath);
    
    if (!this.validatePath(normalizedPath)) {
      return {
        id,
        command,
        output: `ls: cannot access '${targetPath}': Permission denied`,
        timestamp,
        exitCode: 1
      };
    }

    const contents = this.fileSystem[normalizedPath] || [];
    
    if (contents.length === 0) {
      return {
        id,
        command,
        output: '',
        timestamp,
        exitCode: 0
      };
    }

    let output: string;
    
    if (longFormat) {
      const lines = contents.map(item => {
        const size = item.size ? item.size.toString().padStart(8) : '     4096';
        return `${item.permissions} 1 user user ${size} ${item.lastModified} ${item.name}`;
      });
      output = `total ${contents.length}\n${lines.join('\n')}`;
    } else {
      output = contents.map(item => item.name).join('  ');
    }

    return {
      id,
      command,
      output,
      timestamp,
      exitCode: 0
    };
  }

  private handleCd(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      this.currentPath = this.homeDirectory;
      return {
        id,
        command,
        output: '',
        timestamp,
        exitCode: 0
      };
    }

    const targetPath = args[0];
    const normalizedPath = this.normalizePath(targetPath);
    
    if (!this.validatePath(normalizedPath)) {
      return {
        id,
        command,
        output: `cd: ${targetPath}: Permission denied`,
        timestamp,
        exitCode: 1
      };
    }

    if (!this.fileSystem[normalizedPath]) {
      return {
        id,
        command,
        output: `cd: ${targetPath}: No such file or directory`,
        timestamp,
        exitCode: 1
      };
    }

    this.currentPath = normalizedPath;
    return {
      id,
      command,
      output: '',
      timestamp,
      exitCode: 0
    };
  }

  private handleMkdir(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return {
        id,
        command,
        output: 'mkdir: missing operand',
        timestamp,
        exitCode: 1
      };
    }

    const dirName = args[0];
    const fullPath = this.normalizePath(dirName);
    
    if (!this.validatePath(fullPath)) {
      return {
        id,
        command,
        output: `mkdir: cannot create directory '${dirName}': Permission denied`,
        timestamp,
        exitCode: 1
      };
    }

    // Add directory to current path's contents
    if (!this.fileSystem[this.currentPath]) {
      this.fileSystem[this.currentPath] = [];
    }

    const exists = this.fileSystem[this.currentPath].some(item => item.name === dirName);
    if (exists) {
      return {
        id,
        command,
        output: `mkdir: cannot create directory '${dirName}': File exists`,
        timestamp,
        exitCode: 1
      };
    }

    this.fileSystem[this.currentPath].push({
      type: 'directory',
      name: dirName,
      permissions: 'drwxr-xr-x',
      lastModified: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });

    // Create empty directory entry
    this.fileSystem[fullPath] = [];

    return {
      id,
      command,
      output: '',
      timestamp,
      exitCode: 0
    };
  }

  private handleTouch(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return {
        id,
        command,
        output: 'touch: missing file operand',
        timestamp,
        exitCode: 1
      };
    }

    const fileName = args[0];
    
    if (!this.fileSystem[this.currentPath]) {
      this.fileSystem[this.currentPath] = [];
    }

    const existingFile = this.fileSystem[this.currentPath].find(item => item.name === fileName);
    if (existingFile) {
      existingFile.lastModified = new Date().toISOString().slice(0, 16).replace('T', ' ');
    } else {
      this.fileSystem[this.currentPath].push({
        type: 'file',
        name: fileName,
        size: 0,
        permissions: '-rw-r--r--',
        lastModified: new Date().toISOString().slice(0, 16).replace('T', ' ')
      });
    }

    return {
      id,
      command,
      output: '',
      timestamp,
      exitCode: 0
    };
  }

  private handleCat(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return {
        id,
        command,
        output: 'cat: missing file operand',
        timestamp,
        exitCode: 1
      };
    }

    const fileName = args[0];
    const file = this.fileSystem[this.currentPath]?.find(item => item.name === fileName && item.type === 'file');
    
    if (!file) {
      return {
        id,
        command,
        output: `cat: ${fileName}: No such file or directory`,
        timestamp,
        exitCode: 1
      };
    }

    // Simulate file content based on file type
    let content = '';
    if (fileName.endsWith('.rs')) {
      content = `fn main() {\n    println!("Hello, world!");\n}`;
    } else if (fileName.endsWith('.toml')) {
      content = `[package]\nname = "rust-project"\nversion = "0.1.0"\nedition = "2021"`;
    } else if (fileName.endsWith('.md')) {
      content = `# Rust Terminal Forge\n\nA secure terminal emulator built with Rust and React.`;
    } else {
      content = `Content of ${fileName}`;
    }

    return {
      id,
      command,
      output: content,
      timestamp,
      exitCode: 0
    };
  }

  private handleHistory(id: string, command: string, timestamp: string): TerminalCommand {
    const historyOutput = this.commandHistory
      .slice(-50) // Show last 50 commands
      .map((cmd, index) => `${(this.commandHistory.length - 50 + index + 1).toString().padStart(4)}: ${cmd}`)
      .join('\n');

    return {
      id,
      command,
      output: historyOutput,
      timestamp,
      exitCode: 0
    };
  }

  private handleAlias(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      const aliasOutput = Array.from(this.aliases.entries())
        .map(([alias, cmd]) => `alias ${alias}='${cmd}'`)
        .join('\n');
      
      return {
        id,
        command,
        output: aliasOutput,
        timestamp,
        exitCode: 0
      };
    }

    const aliasDefinition = args.join(' ');
    const match = aliasDefinition.match(/^(\w+)=(.+)$/);
    
    if (match) {
      const [, aliasName, aliasCommand] = match;
      this.aliases.set(aliasName, aliasCommand.replace(/['"]/g, ''));
      return {
        id,
        command,
        output: '',
        timestamp,
        exitCode: 0
      };
    }

    return {
      id,
      command,
      output: 'alias: invalid alias definition',
      timestamp,
      exitCode: 1
    };
  }

  private handleCargo(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    const subCommand = args[0];
    
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

  private handleClear(id: string, command: string, timestamp: string): TerminalCommand {
    return {
      id,
      command,
      output: '__CLEAR__',
      timestamp,
      exitCode: 0
    };
  }

  private handleHelp(id: string, command: string, timestamp: string): TerminalCommand {
    const helpText = `Available commands:
  pwd        - Show current directory
  ls [-la]   - List directory contents
  cd <dir>   - Change directory (supports: ., .., ~, absolute and relative paths)
  mkdir      - Create directory
  touch      - Create or update file
  cat        - Display file contents
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

    return {
      id,
      command,
      output: helpText,
      timestamp,
      exitCode: 0
    };
  }

  private suggestCommand(command: string): string {
    const commands = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'history', 'alias', 'cargo', 'clear', 'help'];
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
    return this.currentPath;
  }

  getFileSystem(): FileSystem {
    return { ...this.fileSystem };
  }
}
