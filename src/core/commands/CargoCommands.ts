
import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';

export class CargoCommands extends BaseCommandHandler {
  handleCargo(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    const subCommand = args[0];
    
    const cargoCommands: Record<string, string> = {
      'build': 'Compiling rust-project v0.1.0\n   Finished dev [unoptimized + debuginfo] target(s) in 2.34s',
      'build --release': 'Compiling rust-project v0.1.0\n   Finished release [optimized] target(s) in 45.67s',
      'test': 'running 3 tests\ntest tests::test_one ... ok\ntest tests::test_two ... ok\ntest tests::test_three ... ok\n\ntest result: ok. 3 passed; 0 failed; 0 ignored',
      'check': 'Checking rust-project v0.1.0\n   Finished dev [unoptimized + debuginfo] target(s) in 0.45s',
      'clean': 'Removed target directory'
    };

    const fullArgs = args.join(' ');
    const output = cargoCommands[fullArgs] || cargoCommands[subCommand] || `error: no such subcommand: \`${subCommand}\``;
    const exitCode = cargoCommands[fullArgs] || cargoCommands[subCommand] ? 0 : 1;

    return this.generateCommand(id, command, output, timestamp, exitCode);
  }
}
