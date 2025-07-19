import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';
import { EnvironmentManager } from '../EnvironmentManager';

export class EnvironmentCommands extends BaseCommandHandler {
  private envManager: EnvironmentManager;

  constructor() {
    super();
    this.envManager = EnvironmentManager.getInstance();
  }

  async handleEnv(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help') || args.length === 0) {
      const helpText = `Environment Variable Management

Usage: env [COMMAND] [OPTIONS]

Commands:
  list              List all environment variables
  get VAR           Get value of environment variable
  set VAR VALUE     Set environment variable
  unset VAR         Remove environment variable
  clear             Clear all environment variables

Options:
  --help            Show this help message

Examples:
  env list
  env get ANTHROPIC_API_KEY
  env set ANTHROPIC_API_KEY "sk-ant-your-key-here"
  env unset TEMP_VAR
  env clear

Note: Sensitive values (API keys, tokens) are masked in output.`;

      return this.generateCommand(id, command, helpText, timestamp);
    }

    const subCommand = args[0];
    const subArgs = args.slice(1);

    switch (subCommand) {
      case 'list':
        return this.handleList(id, command, timestamp);
      case 'get':
        return this.handleGet(subArgs, id, command, timestamp);
      case 'set':
        return this.handleSet(subArgs, id, command, timestamp);
      case 'unset':
        return this.handleUnset(subArgs, id, command, timestamp);
      case 'clear':
        return this.handleClear(id, command, timestamp);
      default:
        return this.generateCommand(id, command, `Unknown env command: ${subCommand}. Use "env --help" for usage.`, timestamp, 1);
    }
  }

  private handleList(id: string, command: string, timestamp: string): TerminalCommand {
    const variables = this.envManager.list();
    
    if (variables.length === 0) {
      return this.generateCommand(id, command, 'No environment variables set.', timestamp);
    }

    const output = variables
      .map(({ key, value }) => `${key}=${value}`)
      .join('\n');

    return this.generateCommand(id, command, output, timestamp);
  }

  private handleGet(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'Usage: env get VAR_NAME', timestamp, 1);
    }

    const varName = args[0];
    const value = this.envManager.get(varName);

    if (value === undefined) {
      return this.generateCommand(id, command, `Environment variable '${varName}' not found.`, timestamp, 1);
    }

    // Mask sensitive values
    const displayValue = this.isSensitive(varName) ? this.maskValue(value) : value;
    return this.generateCommand(id, command, `${varName}=${displayValue}`, timestamp);
  }

  private handleSet(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length < 2) {
      return this.generateCommand(id, command, 'Usage: env set VAR_NAME "value"', timestamp, 1);
    }

    const varName = args[0];
    const value = args.slice(1).join(' ').replace(/^["'](.*)["']$/, '$1'); // Remove quotes

    // Special handling for Anthropic API key
    if (varName === 'ANTHROPIC_API_KEY') {
      const result = this.envManager.setAnthropicApiKey(value);
      if (result.success) {
        return this.generateCommand(id, command, `✅ ${varName} set successfully.`, timestamp);
      } else {
        return this.generateCommand(id, command, `❌ ${result.message}`, timestamp, 1);
      }
    }

    this.envManager.set(varName, value);
    return this.generateCommand(id, command, `✅ Environment variable '${varName}' set.`, timestamp);
  }

  private handleUnset(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'Usage: env unset VAR_NAME', timestamp, 1);
    }

    const varName = args[0];
    const existed = this.envManager.delete(varName);

    if (existed) {
      return this.generateCommand(id, command, `✅ Environment variable '${varName}' removed.`, timestamp);
    } else {
      return this.generateCommand(id, command, `Environment variable '${varName}' was not set.`, timestamp, 1);
    }
  }

  private handleClear(id: string, command: string, timestamp: string): TerminalCommand {
    this.envManager.clear();
    return this.generateCommand(id, command, 'All environment variables cleared.', timestamp);
  }

  private isSensitive(key: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /token/i,
      /secret/i,
      /password/i,
      /auth/i,
      /credential/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  private maskValue(value: string): string {
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }
}