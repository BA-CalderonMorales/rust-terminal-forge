
import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';

export class SystemCommands extends BaseCommandHandler {
  handleEcho(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    const output = args.join(' ');
    return this.generateCommand(id, command, output, timestamp);
  }

  handleWhoami(id: string, command: string, timestamp: string): TerminalCommand {
    return this.generateCommand(id, command, 'user', timestamp);
  }

  handleDate(id: string, command: string, timestamp: string): TerminalCommand {
    const now = new Date();
    const output = now.toString();
    return this.generateCommand(id, command, output, timestamp);
  }

  handleEnv(id: string, command: string, timestamp: string): TerminalCommand {
    const envVars = [
      'HOME=/home/user',
      'PATH=/usr/local/bin:/usr/bin:/bin',
      'USER=user',
      'SHELL=/bin/bash',
      'LANG=en_US.UTF-8',
      'TERM=xterm-256color'
    ];
    
    return this.generateCommand(id, command, envVars.join('\n'), timestamp);
  }

  handleWhich(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'which: missing operand', timestamp, 1);
    }

    const commandName = args[0];
    const builtinCommands = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'history', 'alias', 'cargo', 'clear', 'help', 'echo', 'whoami', 'date', 'env', 'which'];
    
    if (builtinCommands.includes(commandName)) {
      return this.generateCommand(id, command, `/usr/bin/${commandName}`, timestamp);
    }

    return this.generateCommand(id, command, `which: no ${commandName} in (/usr/local/bin:/usr/bin:/bin)`, timestamp, 1);
  }
}
