
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class PwdCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(id: string, command: string, timestamp: string): TerminalCommand {
    return this.generateCommand(id, command, this.fileSystemManager.getDisplayPath(), timestamp);
  }
}
