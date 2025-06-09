import { TerminalCommand, OPEN_EDITOR_PREFIX } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class VimCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'vim: missing file operand', timestamp, 1);
    }

    const fileName = args[0];
    const filePath = this.fileSystemManager.normalizePath(fileName);
    const content = this.fileSystemManager.readFile(filePath);

    if (content === null) {
      return this.generateCommand(id, command, `vim: ${fileName}: No such file or directory`, timestamp, 1);
    }

    return this.generateCommand(id, command, `${OPEN_EDITOR_PREFIX}${filePath}`, timestamp);
  }
}
