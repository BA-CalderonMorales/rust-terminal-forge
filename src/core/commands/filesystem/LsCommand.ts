
import { TerminalCommand } from '../../types';
import { BaseCommandHandler } from '../BaseCommandHandler';
import { FileSystemManager } from '../../filesystem/FileSystemManager';

export class LsCommand extends BaseCommandHandler {
  constructor(private fileSystemManager: FileSystemManager) {
    super();
  }

  handle(args: string[], id: string, command: string, timestamp: string): TerminalCommand {
    // Collect all flags from arguments
    const flags = new Set<string>();
    const nonFlagArgs: string[] = [];
    
    for (const arg of args) {
      if (arg.startsWith('-')) {
        // Handle combined flags like -lah
        const flagChars = arg.slice(1);
        for (const char of flagChars) {
          flags.add('-' + char);
        }
      } else {
        nonFlagArgs.push(arg);
      }
    }
    
    const showAll = flags.has('-a') || flags.has('-A');
    const longFormat = flags.has('-l');
    const humanReadable = flags.has('-h');
    
    const targetPath = nonFlagArgs[0] || this.fileSystemManager.getCurrentPath();
    const normalizedPath = this.fileSystemManager.normalizePath(targetPath);
    
    if (!this.fileSystemManager.validatePath(normalizedPath)) {
      return this.generateCommand(id, command, `ls: cannot access '${targetPath}': Permission denied`, timestamp, 1);
    }

    const contents = this.fileSystemManager.getDirectoryContents(normalizedPath);
    
    if (contents.length === 0) {
      return this.generateCommand(id, command, '', timestamp);
    }

    let output: string;
    
    if (longFormat) {
      const formatSize = (size: number | undefined) => {
        if (!size) return '     4096';
        if (humanReadable) {
          if (size < 1024) return size.toString().padStart(8);
          if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}K`.padStart(8);
          return `${(size / (1024 * 1024)).toFixed(1)}M`.padStart(8);
        }
        return size.toString().padStart(8);
      };

      const lines = contents.map(item => {
        const size = formatSize(item.size);
        return `${item.permissions} 1 user user ${size} ${item.lastModified} ${item.name}`;
      });
      
      const totalSize = contents.reduce((sum, item) => sum + (item.size || 4096), 0);
      const totalDisplay = humanReadable && totalSize >= 1024 
        ? `${Math.ceil(totalSize / 1024)}K`
        : Math.ceil(totalSize / 1024).toString();
      
      output = `total ${totalDisplay}\n${lines.join('\n')}`;
    } else {
      const names = contents.map(item => item.name);
      const columns = 4;
      const rows = Math.ceil(names.length / columns);
      const columnWidth = Math.max(...names.map(name => name.length)) + 2;
      
      const formattedLines: string[] = [];
      for (let row = 0; row < rows; row++) {
        const rowItems: string[] = [];
        for (let col = 0; col < columns; col++) {
          const index = row + col * rows;
          if (index < names.length) {
            rowItems.push(names[index].padEnd(columnWidth));
          }
        }
        formattedLines.push(rowItems.join('').trimEnd());
      }
      
      output = formattedLines.join('\n');
    }

    return this.generateCommand(id, command, output, timestamp);
  }
}
