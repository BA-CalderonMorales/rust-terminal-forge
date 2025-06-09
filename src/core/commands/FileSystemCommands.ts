
import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';
import { FileSystemManager } from '../filesystem/FileSystemManager';
import { PwdCommand } from './filesystem/PwdCommand';
import { LsCommand } from './filesystem/LsCommand';
import { CdCommand } from './filesystem/CdCommand';
import { MkdirCommand } from './filesystem/MkdirCommand';
import { TouchCommand } from './filesystem/TouchCommand';
import { CatCommand } from './filesystem/CatCommand';
import { FindCommand } from './filesystem/FindCommand';
import { GrepCommand } from './filesystem/GrepCommand';
import { VimCommand } from './filesystem/VimCommand';

export class FileSystemCommands extends BaseCommandHandler {
  private pwdCommand: PwdCommand;
  private lsCommand: LsCommand;
  private cdCommand: CdCommand;
  private mkdirCommand: MkdirCommand;
  private touchCommand: TouchCommand;
  private catCommand: CatCommand;
  private findCommand: FindCommand;
  private grepCommand: GrepCommand;
  private vimCommand: VimCommand;

  constructor(private fileSystemManager: FileSystemManager) {
    super();
    this.pwdCommand = new PwdCommand(fileSystemManager);
    this.lsCommand = new LsCommand(fileSystemManager);
    this.cdCommand = new CdCommand(fileSystemManager);
    this.mkdirCommand = new MkdirCommand(fileSystemManager);
    this.touchCommand = new TouchCommand(fileSystemManager);
    this.catCommand = new CatCommand(fileSystemManager);
    this.findCommand = new FindCommand(fileSystemManager);
    this.grepCommand = new GrepCommand(fileSystemManager);
    this.vimCommand = new VimCommand(fileSystemManager);
  }

  handlePwd(id: string, command: string, timestamp: string): TerminalCommand {
    return this.pwdCommand.handle(id, command, timestamp);
  }

  handleLs(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.lsCommand.handle(args, id, command, timestamp);
  }

  handleCd(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.cdCommand.handle(args, id, command, timestamp);
  }

  handleMkdir(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.mkdirCommand.handle(args, id, command, timestamp);
  }

  handleTouch(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.touchCommand.handle(args, id, command, timestamp);
  }

  handleCat(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.catCommand.handle(args, id, command, timestamp);
  }

  handleFind(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.findCommand.handle(args, id, command, timestamp);
  }

  handleGrep(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.grepCommand.handle(args, id, command, timestamp);
  }

  handleVim(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    return this.vimCommand.handle(args, id, command, timestamp);
  }
}
