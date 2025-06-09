
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
    const filePath = this.fileSystemManager.normalizePath(fileName);
    const existingContent = this.fileSystemManager.readFile(filePath);

    if (existingContent === null) {
      this.fileSystemManager.writeFile(filePath, '');
    } else {
      this.fileSystemManager.updateFileTimestamp(
        filePath.substring(0, filePath.lastIndexOf('/')) || '/',
        fileName
      );
    }

    return this.generateCommand(id, command, '', timestamp);
  }
}
