import { TerminalCommand } from '../../types';
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
    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const file = currentContents?.find(item => item.name === fileName && item.type === 'file');

    if (!file) {
      return this.generateCommand(id, command, `vim: ${fileName}: No such file or directory`, timestamp, 1);
    }

    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const exists = currentContents?.some(item => item.name === fileName && item.type === 'file');

    if (!exists) {
      return this.generateCommand(id, command, `vim: ${fileName}: No such file or directory`, timestamp, 1);
    }

    return this.generateCommand(id, command, `__OPEN_EDITOR__${fileName}`, timestamp);
  }
}
