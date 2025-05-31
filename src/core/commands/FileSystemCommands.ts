import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';
import { FileSystemManager } from '../filesystem/FileSystemManager';

export class FileSystemCommands extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handlePwd(id: string, command: string, timestamp: string): TerminalCommand {
    return this.generateCommand(id, command, this.fileSystemManager.getCurrentPath(), timestamp);
  }

  handleLs(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    // Collect all flags from arguments
    const flags = new Set<string>();
    const nonFlagArgs: string[] = [];
    
    for (const arg of args) {
      if (arg.startsWith('-')) {
        // Handle combined flags like -lah
        const flagChars = arg.slice(1);
        for (const char of flagChars) {
          flags.add('-' + char);
        }
      } else {
        nonFlagArgs.push(arg);
      }
    }
    
    const showAll = flags.has('-a') || flags.has('-A');
    const longFormat = flags.has('-l');
    const humanReadable = flags.has('-h');
    
    const targetPath = nonFlagArgs[0] || this.fileSystemManager.getCurrentPath();
    const normalizedPath = this.fileSystemManager.normalizePath(targetPath);
    
    if (!this.fileSystemManager.validatePath(normalizedPath)) {
      return this.generateCommand(id, command, `ls: cannot access '${targetPath}': Permission denied`, timestamp, 1);
    }

    const contents = this.fileSystemManager.getDirectoryContents(normalizedPath);
    
    if (contents.length === 0) {
      return this.generateCommand(id, command, '', timestamp);
    }

    let output: string;
    
    if (longFormat) {
      const formatSize = (size: number | undefined) => {
        if (!size) return '     4096';
        if (humanReadable) {
          if (size < 1024) return size.toString().padStart(8);
          if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}K`.padStart(8);
          return `${(size / (1024 * 1024)).toFixed(1)}M`.padStart(8);
        }
        return size.toString().padStart(8);
      };

      const lines = contents.map(item => {
        const size = formatSize(item.size);
        return `${item.permissions} 1 user user ${size} ${item.lastModified} ${item.name}`;
      });
      
      const totalSize = contents.reduce((sum, item) => sum + (item.size || 4096), 0);
      const totalDisplay = humanReadable && totalSize >= 1024 
        ? `${Math.ceil(totalSize / 1024)}K`
        : Math.ceil(totalSize / 1024).toString();
      
      output = `total ${totalDisplay}\n${lines.join('\n')}`;
    } else {
      const names = contents.map(item => item.name);
      const columns = 4;
      const rows = Math.ceil(names.length / columns);
      const columnWidth = Math.max(...names.map(name => name.length)) + 2;
      
      const formattedLines: string[] = [];
      for (let row = 0; row < rows; row++) {
        const rowItems: string[] = [];
        for (let col = 0; col < columns; col++) {
          const index = row + col * rows;
          if (index < names.length) {
            rowItems.push(names[index].padEnd(columnWidth));
          }
        }
        formattedLines.push(rowItems.join('').trimEnd());
      }
      
      output = formattedLines.join('\n');
    }

    return this.generateCommand(id, command, output, timestamp);
  }

  handleCd(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      this.fileSystemManager.setCurrentPath(this.fileSystemManager.getHomeDirectory());
      return this.generateCommand(id, command, '', timestamp);
    }

    const targetPath = args[0];
    
    // Handle special case for "." (current directory)
    if (targetPath === '.') {
      // Stay in current directory - no change needed
      return this.generateCommand(id, command, '', timestamp);
    }
    
    const normalizedPath = this.fileSystemManager.normalizePath(targetPath);
    
    if (!this.fileSystemManager.validatePath(normalizedPath)) {
      return this.generateCommand(id, command, `cd: ${targetPath}: Permission denied`, timestamp, 1);
    }

    // Check if the target path exists by trying to get its contents
    const contents = this.fileSystemManager.getDirectoryContents(normalizedPath);
    if (contents === undefined || contents === null) {
      return this.generateCommand(id, command, `cd: ${targetPath}: No such file or directory`, timestamp, 1);
    }

    this.fileSystemManager.setCurrentPath(normalizedPath);
    return this.generateCommand(id, command, '', timestamp);
  }

  handleMkdir(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'mkdir: missing operand', timestamp, 1);
    }

    const dirName = args[0];
    const fullPath = this.fileSystemManager.normalizePath(dirName);
    
    if (!this.fileSystemManager.validatePath(fullPath)) {
      return this.generateCommand(id, command, `mkdir: cannot create directory '${dirName}': Permission denied`, timestamp, 1);
    }

    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const exists = currentContents.some(item => item.name === dirName);
    if (exists) {
      return this.generateCommand(id, command, `mkdir: cannot create directory '${dirName}': File exists`, timestamp, 1);
    }

    this.fileSystemManager.addFileSystemNode(this.fileSystemManager.getCurrentPath(), {
      type: 'directory',
      name: dirName,
      permissions: 'drwxr-xr-x',
      lastModified: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });

    this.fileSystemManager.createDirectory(fullPath);

    return this.generateCommand(id, command, '', timestamp);
  }

  handleTouch(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'touch: missing file operand', timestamp, 1);
    }

    const fileName = args[0];
    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const existingFile = currentContents.find(item => item.name === fileName);
    
    if (existingFile) {
      this.fileSystemManager.updateFileTimestamp(this.fileSystemManager.getCurrentPath(), fileName);
    } else {
      this.fileSystemManager.addFileSystemNode(this.fileSystemManager.getCurrentPath(), {
        type: 'file',
        name: fileName,
        size: 0,
        permissions: '-rw-r--r--',
        lastModified: new Date().toISOString().slice(0, 16).replace('T', ' ')
      });
    }

    return this.generateCommand(id, command, '', timestamp);
  }

  handleCat(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'cat: missing file operand', timestamp, 1);
    }

    const fileName = args[0];
    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const file = currentContents?.find(item => item.name === fileName && item.type === 'file');
    
    if (!file) {
      return this.generateCommand(id, command, `cat: ${fileName}: No such file or directory`, timestamp, 1);
    }

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

    return this.generateCommand(id, command, content, timestamp);
  }

  handleFind(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'find: missing operand', timestamp, 1);
    }

    const searchPath = args[0] === '.' ? this.fileSystemManager.getCurrentPath() : args[0];
    const normalizedPath = this.fileSystemManager.normalizePath(searchPath);
    
    if (!this.fileSystemManager.validatePath(normalizedPath)) {
      return this.generateCommand(id, command, `find: '${searchPath}': Permission denied`, timestamp, 1);
    }

    // Parse arguments for options like -name, -type
    let namePattern = '';
    let typeFilter = '';
    
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '-name' && i + 1 < args.length) {
        namePattern = args[i + 1].replace(/\*/g, '.*').replace(/\?/g, '.');
        i++; // Skip the pattern argument
      } else if (args[i] === '-type' && i + 1 < args.length) {
        typeFilter = args[i + 1];
        i++; // Skip the type argument
      }
    }

    const results: string[] = [];
    this.findRecursive(normalizedPath, namePattern, typeFilter, results);

    return this.generateCommand(id, command, results.join('\n'), timestamp);
  }

  private findRecursive(path: string, namePattern: string, typeFilter: string, results: string[]): void {
    const contents = this.fileSystemManager.getDirectoryContents(path);
    if (!contents) return;

    // Add current directory if it matches
    if (path !== this.fileSystemManager.getCurrentPath()) {
      results.push(path);
    }

    for (const item of contents) {
      const itemPath = `${path}/${item.name}`;
      
      // Check if item matches filters
      let matches = true;
      
      if (namePattern) {
        const regex = new RegExp(namePattern);
        matches = matches && regex.test(item.name);
      }
      
      if (typeFilter) {
        matches = matches && ((typeFilter === 'f' && item.type === 'file') || 
                              (typeFilter === 'd' && item.type === 'directory'));
      }
      
      if (matches) {
        results.push(itemPath);
      }
      
      // Recursively search directories
      if (item.type === 'directory') {
        this.findRecursive(itemPath, namePattern, typeFilter, results);
      }
    }
  }

  handleGrep(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'grep: missing operand', timestamp, 1);
    }

    if (args.length < 2) {
      return this.generateCommand(id, command, 'grep: missing file operand', timestamp, 1);
    }

    const pattern = args[0];
    const fileName = args[1];
    
    // Check for flags
    const flags = new Set<string>();
    let patternIndex = 0;
    let fileIndex = 1;
    
    // Handle flags like -i, -n, -v
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('-')) {
        const flagChars = args[i].slice(1);
        for (const char of flagChars) {
          flags.add(char);
        }
      } else if (patternIndex === i) {
        patternIndex = i;
      } else if (fileIndex === i) {
        fileIndex = i;
        break;
      }
    }

    const actualPattern = args[patternIndex];
    const actualFileName = args[fileIndex];
    
    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const file = currentContents?.find(item => item.name === actualFileName && item.type === 'file');
    
    if (!file) {
      return this.generateCommand(id, command, `grep: ${actualFileName}: No such file or directory`, timestamp, 1);
    }

    // Get file content (simplified for demo)
    let content = '';
    if (actualFileName.endsWith('.rs')) {
      content = `fn main() {\n    println!("Hello, world!");\n}`;
    } else if (actualFileName.endsWith('.toml')) {
      content = `[package]\nname = "rust-project"\nversion = "0.1.0"\nedition = "2021"`;
    } else if (actualFileName.endsWith('.md')) {
      content = `# Rust Terminal Forge\n\nA secure terminal emulator built with Rust and React.`;
    } else {
      content = `Content of ${actualFileName}`;
    }

    const lines = content.split('\n');
    const matchedLines: string[] = [];
    
    const caseInsensitive = flags.has('i');
    const showLineNumbers = flags.has('n');
    const invertMatch = flags.has('v');
    
    const regex = new RegExp(actualPattern, caseInsensitive ? 'i' : '');
    
    lines.forEach((line, index) => {
      const matches = regex.test(line);
      const shouldInclude = invertMatch ? !matches : matches;
      
      if (shouldInclude) {
        const lineNumber = index + 1;
        const output = showLineNumbers ? `${lineNumber}:${line}` : line;
        matchedLines.push(output);
      }
    });

    if (matchedLines.length === 0) {
      return this.generateCommand(id, command, '', timestamp, 1);
    }

    return this.generateCommand(id, command, matchedLines.join('\n'), timestamp);
  }
}
