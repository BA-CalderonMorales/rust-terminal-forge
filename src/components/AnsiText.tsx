import React from 'react';
import { AnsiParser, AnsiSegment } from '../utils/ansiParser';

interface AnsiTextProps {
  children: string;
  className?: string;
}

export const AnsiText: React.FC<AnsiTextProps> = ({ children, className = '' }) => {
  const segments = React.useMemo(() => {
    if (!children) return [];
    try {
      const parsed = AnsiParser.parseAnsi(children);
      console.log('🎨 AnsiText parsed segments:', parsed.length, 'from text length:', children.length);
      return parsed;
    } catch (error) {
      console.error('Error parsing ANSI:', error);
      // Fallback to plain text
      return [{ text: children, styles: {} }];
    }
  }, [children]);

  if (!children) return null;

  // If no ANSI sequences detected, render as plain text
  if (!AnsiParser.hasAnsi(children)) {
    console.log('🎨 No ANSI detected, rendering as plain text');
    return <span className={className} style={{ color: '#f8f8f2' }}>{children}</span>;
  }

  console.log('🎨 Rendering', segments.length, 'ANSI segments');

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        <span
          key={index}
          style={{
            color: segment.styles.color || '#f8f8f2', // Default terminal text color
            backgroundColor: segment.styles.backgroundColor || 'transparent',
            fontWeight: segment.styles.bold ? 'bold' : 'normal',
            fontStyle: segment.styles.italic ? 'italic' : 'normal',
            textDecoration: segment.styles.underline ? 'underline' : 'none',
            opacity: segment.styles.dim ? 0.6 : 1,
          }}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
};

// Alternative component for when you want to handle line breaks
export const AnsiTextBlock: React.FC<AnsiTextProps> = ({ children, className = '' }) => {
  const lines = children.split('\n');
  
  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex}>
          <AnsiText>{line}</AnsiText>
        </div>
      ))}
    </div>
  );
};