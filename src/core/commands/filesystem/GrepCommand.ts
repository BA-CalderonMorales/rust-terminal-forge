
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class GrepCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    if (args.length === 0) {
      return this.generateCommand(id, command, 'grep: missing operand', timestamp, 1);
    }

    if (args.length < 2) {
      return this.generateCommand(id, command, 'grep: missing file operand', timestamp, 1);
    }

    const pattern = args[0];
    const fileName = args[1];
    
    // Check for flags
    const flags = new Set<string>();
    let patternIndex = 0;
    let fileIndex = 1;
    
    // Handle flags like -i, -n, -v
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('-')) {
        const flagChars = args[i].slice(1);
        for (const char of flagChars) {
          flags.add(char);
        }
      } else if (patternIndex === i) {
        patternIndex = i;
      } else if (fileIndex === i) {
        fileIndex = i;
        break;
      }
    }

    const actualPattern = args[patternIndex];
    const actualFileName = args[fileIndex];
    
    const currentContents = this.fileSystemManager.getDirectoryContents(this.fileSystemManager.getCurrentPath());
    const file = currentContents?.find(item => item.name === actualFileName && item.type === 'file');
    
    if (!file) {
      return this.generateCommand(id, command, `grep: ${actualFileName}: No such file or directory`, timestamp, 1);
    }

    // Get file content (simplified for demo)
    let content = '';
    if (actualFileName.endsWith('.rs')) {
      content = `fn main() {\n    println!("Hello, world!");\n}`;
    } else if (actualFileName.endsWith('.toml')) {
      content = `[package]\nname = "rust-project"\nversion = "0.1.0"\nedition = "2021"`;
    } else if (actualFileName.endsWith('.md')) {
      content = `# Rust Terminal Forge\n\nA secure terminal emulator built with Rust and React.`;
    } else {
      content = `Content of ${actualFileName}`;
    }

    const lines = content.split('\n');
    const matchedLines: string[] = [];
    
    const caseInsensitive = flags.has('i');
    const showLineNumbers = flags.has('n');
    const invertMatch = flags.has('v');
    
    const regex = new RegExp(actualPattern, caseInsensitive ? 'i' : '');
    
    lines.forEach((line, index) => {
      const matches = regex.test(line);
      const shouldInclude = invertMatch ? !matches : matches;
      
      if (shouldInclude) {
        const lineNumber = index + 1;
        const output = showLineNumbers ? `${lineNumber}:${line}` : line;
        matchedLines.push(output);
      }
    });

    if (matchedLines.length === 0) {
      return this.generateCommand(id, command, '', timestamp, 1);
    }

    return this.generateCommand(id, command, matchedLines.join('\n'), timestamp);
  }
}
