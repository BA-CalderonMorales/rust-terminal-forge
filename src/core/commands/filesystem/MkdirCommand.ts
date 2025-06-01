
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class MkdirCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
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
}
