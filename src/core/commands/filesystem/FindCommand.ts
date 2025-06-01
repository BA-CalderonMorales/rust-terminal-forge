
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class FindCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
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
}
