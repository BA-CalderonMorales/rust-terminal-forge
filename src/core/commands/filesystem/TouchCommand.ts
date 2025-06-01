
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class TouchCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
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
}
