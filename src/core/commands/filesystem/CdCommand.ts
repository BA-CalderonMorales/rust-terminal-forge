
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class CdCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      this.fileSystemManager.setCurrentPath(this.fileSystemManager.getHomeDirectory());
      return this.generateCommand(id, command, '', timestamp);
    }

    const targetPath = args[0];
    
    // Custom behavior: cd . goes up one level, cd .. goes up two levels
    if (targetPath === '.') {
      // Go up one directory level
      const currentPath = this.fileSystemManager.getCurrentPath();
      const pathParts = currentPath.split('/').filter(part => part !== '');
      if (pathParts.length > 0) {
        pathParts.pop(); // Remove last directory
        const newPath = '/' + pathParts.join('/');
        const normalizedNewPath = newPath === '/' ? '/home/user' : newPath;
        
        if (this.fileSystemManager.validatePath(normalizedNewPath)) {
          this.fileSystemManager.setCurrentPath(normalizedNewPath);
          return this.generateCommand(id, command, '', timestamp);
        }
      }
      // If we can't go up, stay in current directory
      return this.generateCommand(id, command, '', timestamp);
    }
    
    if (targetPath === '..') {
      // Go up two directory levels
      const currentPath = this.fileSystemManager.getCurrentPath();
      const pathParts = currentPath.split('/').filter(part => part !== '');
      if (pathParts.length >= 2) {
        pathParts.pop(); // Remove last directory
        pathParts.pop(); // Remove second-to-last directory
        const newPath = '/' + pathParts.join('/');
        const normalizedNewPath = newPath === '/' ? '/home/user' : newPath;
        
        if (this.fileSystemManager.validatePath(normalizedNewPath)) {
          this.fileSystemManager.setCurrentPath(normalizedNewPath);
          return this.generateCommand(id, command, '', timestamp);
        }
      } else if (pathParts.length === 1) {
        // If only one level deep, go to root of allowed area
        const normalizedNewPath = '/home/user';
        if (this.fileSystemManager.validatePath(normalizedNewPath)) {
          this.fileSystemManager.setCurrentPath(normalizedNewPath);
          return this.generateCommand(id, command, '', timestamp);
        }
      }
      // If we can't go up two levels, stay in current directory
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
}
