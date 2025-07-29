// ANSI escape sequence parser for terminal output
export interface AnsiSegment {
  text: string;
  styles: {
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    dim?: boolean;
  };
}

export class AnsiParser {
  private static readonly ANSI_COLORS = {
    30: '#2e3436', // black
    31: '#cc0000', // red  
    32: '#4e9a06', // green
    33: '#c4a000', // yellow
    34: '#3465a4', // blue
    35: '#75507b', // magenta
    36: '#06989a', // cyan
    37: '#d3d7cf', // white
    90: '#555753', // bright black (gray)
    91: '#ef2929', // bright red
    92: '#8ae234', // bright green
    93: '#fce94f', // bright yellow
    94: '#729fcf', // bright blue
    95: '#ad7fa8', // bright magenta
    96: '#34e2e2', // bright cyan
    97: '#eeeeec', // bright white
  };

  private static readonly ANSI_BG_COLORS = {
    40: '#2e3436', // black
    41: '#cc0000', // red
    42: '#4e9a06', // green
    43: '#c4a000', // yellow
    44: '#3465a4', // blue
    45: '#75507b', // magenta
    46: '#06989a', // cyan
    47: '#d3d7cf', // white
    100: '#555753', // bright black (gray)
    101: '#ef2929', // bright red
    102: '#8ae234', // bright green
    103: '#fce94f', // bright yellow
    104: '#729fcf', // bright blue
    105: '#ad7fa8', // bright magenta
    106: '#34e2e2', // bright cyan
    107: '#eeeeec', // bright white
  };

  /**
   * Parse ANSI escape sequences and return styled segments
   */
  static parseAnsi(text: string): AnsiSegment[] {
    const segments: AnsiSegment[] = [];
    let currentStyles = {
      color: undefined as string | undefined,
      backgroundColor: undefined as string | undefined,
      bold: false,
      italic: false,
      underline: false,
      dim: false,
    };

    // First, clean up common control sequences that don't affect display
    let cleanText = text
      // Strip cursor positioning and movements
      .replace(/\x1b\[[0-9]*;?[0-9]*[HfABCDEFGhijklmnpqrstuv]/g, '')
      // Strip clear screen/line sequences
      .replace(/\x1b\[[0-9]*[JK]/g, '')
      // Strip other common control sequences
      .replace(/\x1b\[[0-9]*[dlmst]/g, '')
      // Strip bracketed paste mode
      .replace(/\x1b\[\?[0-9]*[hl]/g, '')
      // Strip OSC sequences (title setting, etc.)
      .replace(/\x1b\][0-9;]*\x07/g, '')
      .replace(/\x1b\][0-9;]*\x1b\\/g, '');

    // Handle carriage returns - keep only text after the last \r on each line
    cleanText = cleanText.replace(/^[^\r\n]*\r(?!\n)/gm, '');

    // Split by ANSI color/style sequences only
    const ansiRegex = /\x1b\[[0-9;]*m/g;
    let lastIndex = 0;
    let match;

    while ((match = ansiRegex.exec(cleanText)) !== null) {
      // Add text before the escape sequence
      const textBefore = cleanText.slice(lastIndex, match.index);
      if (textBefore) {
        segments.push({
          text: textBefore,
          styles: { ...currentStyles }
        });
      }

      // Parse the escape sequence
      const escapeCode = match[0];
      currentStyles = this.parseEscapeCode(escapeCode, currentStyles);

      lastIndex = ansiRegex.lastIndex;
    }

    // Add remaining text
    const remainingText = cleanText.slice(lastIndex);
    if (remainingText) {
      segments.push({
        text: remainingText,
        styles: { ...currentStyles }
      });
    }

    return segments.filter(segment => segment.text.length > 0);
  }

  /**
   * Parse individual escape code and update styles
   */
  private static parseEscapeCode(
    escapeCode: string, 
    currentStyles: AnsiSegment['styles']
  ): { color: string | undefined; backgroundColor: string | undefined; bold: boolean; italic: boolean; underline: boolean; dim: boolean; } {
    const newStyles = { 
      color: currentStyles.color,
      backgroundColor: currentStyles.backgroundColor, 
      bold: currentStyles.bold || false,
      italic: currentStyles.italic || false,
      underline: currentStyles.underline || false,
      dim: currentStyles.dim || false
    };
    
    // Extract the numeric codes
    const codes = escapeCode.slice(2, -1).split(';').map(code => parseInt(code) || 0);

    for (const code of codes) {
      switch (code) {
        case 0: // Reset all
          newStyles.color = undefined;
          newStyles.backgroundColor = undefined;
          newStyles.bold = false;
          newStyles.italic = false;
          newStyles.underline = false;
          newStyles.dim = false;
          break;
        case 1: // Bold
          newStyles.bold = true;
          break;
        case 2: // Dim
          newStyles.dim = true;
          break;
        case 3: // Italic
          newStyles.italic = true;
          break;
        case 4: // Underline
          newStyles.underline = true;
          break;
        case 22: // Normal intensity (turn off bold/dim)
          newStyles.bold = false;
          newStyles.dim = false;
          break;
        case 23: // Not italic
          newStyles.italic = false;
          break;
        case 24: // Not underlined
          newStyles.underline = false;
          break;
        case 39: // Default foreground color
          newStyles.color = undefined;
          break;
        case 49: // Default background color
          newStyles.backgroundColor = undefined;
          break;
        default:
          // Foreground colors
          if (this.ANSI_COLORS[code]) {
            newStyles.color = this.ANSI_COLORS[code];
          }
          // Background colors
          if (this.ANSI_BG_COLORS[code]) {
            newStyles.backgroundColor = this.ANSI_BG_COLORS[code];
          }
          break;
      }
    }

    return newStyles;
  }

  /**
   * Strip all ANSI escape sequences from text
   */
  static stripAnsi(text: string): string {
    return text
      .replace(/\x1b\[[0-9;]*m/g, '') // Color sequences
      .replace(/\x1b\[[0-9]*;?[0-9]*[HfABCDEFGhijklmnpqrstuv]/g, '') // Cursor/positioning
      .replace(/\x1b\[[0-9]*[JK]/g, '') // Clear sequences
      .replace(/\x1b\[[0-9]*[dlmst]/g, '') // Other control sequences
      .replace(/\x1b\[\?[0-9]*[hl]/g, '') // Mode sequences
      .replace(/\x1b\][0-9;]*\x07/g, '') // OSC sequences
      .replace(/\x1b\][0-9;]*\x1b\\/g, ''); // OSC with string terminator
  }

  /**
   * Convert parsed segments back to plain text
   */
  static segmentsToText(segments: AnsiSegment[]): string {
    return segments.map(segment => segment.text).join('');
  }

  /**
   * Check if text contains ANSI escape sequences
   */
  static hasAnsi(text: string): boolean {
    return /\x1b\[/.test(text);
  }
}