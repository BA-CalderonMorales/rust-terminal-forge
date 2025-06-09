
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class CatCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'cat: missing file operand', timestamp, 1);
    }

    const fileName = args[0];
    const filePath = this.fileSystemManager.normalizePath(fileName);
    const content = this.fileSystemManager.readFile(filePath);

    if (content === null) {
      return this.generateCommand(id, command, `cat: ${fileName}: No such file or directory`, timestamp, 1);
    }

    return this.generateCommand(id, command, content, timestamp);
  }
}
