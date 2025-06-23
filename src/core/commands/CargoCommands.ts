
import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';

interface CargoResponse {
  output: string;
  exitCode: number;
}

export class CargoCommands extends BaseCommandHandler {
  async handleCargo(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    try {
      const res = await fetch('/api/cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args }),
      });

      const data: CargoResponse = await res.json();
      const code = res.ok ? data.exitCode : 1;
      return this.generateCommand(id, command, data.output, timestamp, code);
    } catch (err) {
      return this.generateCommand(id, command, String(err), timestamp, 1);
    }
  }
}
