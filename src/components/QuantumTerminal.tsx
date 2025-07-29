/**
 * 🌌 Quantum Terminal - Rick's Revolutionary Terminal Interface
 * A symphony of layout, typography, and animation that transcends traditional terminals
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { QuantumLayout, useQuantumLayout } from '../engine/QuantumLayout';
import { FluidAnimator, useFluidAnimator, RickEasing } from '../engine/FluidAnimator';
import { ASCIIRenderer, useASCIIRenderer } from '../engine/ASCIIRenderer';

interface QuantumTerminalProps {
  width: number;
  height: number;
  theme: TerminalTheme;
  onCommand?: (command: string) => void;
  onResize?: (dimensions: { width: number; height: number }) => void;
}

interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  accent: string;
  fontFamily: string;
  fontSize: number;
}

interface CursorState {
  x: number;
  y: number;
  visible: boolean;
  blinking: boolean;
  type: 'block' | 'line' | 'underscore';
}

interface TerminalLine {
  id: string;
  content: string;
  timestamp: number;
  type: 'input' | 'output' | 'error' | 'system';
}

/**
 * Quantum Terminal Component - The Future of Command Interfaces
 */
export const QuantumTerminal: React.FC<QuantumTerminalProps> = ({
  width,
  height,
  theme,
  onCommand,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Terminal state
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    visible: true,
    blinking: true,
    type: 'block'
  });
  const [isActive, setIsActive] = useState(false);

  // Engine hooks
  const layout = useQuantumLayout({ width, height, x: 0, y: 0 });
  const animator = useFluidAnimator();
  const renderer = useASCIIRenderer();

  // Initialize terminal
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create rendering surface
    const surface = renderer.createSurface(
      'main-terminal',
      width,
      height,
      window.devicePixelRatio
    );

    // Replace canvas in DOM
    if (containerRef.current && canvasRef.current) {
      containerRef.current.replaceChild(surface.canvas, canvasRef.current);
      canvasRef.current = surface.canvas;
    }

    // Calculate font metrics
    const fontMetrics = renderer.calculateFontMetrics(
      theme.fontFamily,
      theme.fontSize,
      'normal'
    );

    // Initialize with welcome message
    addLine('Quantum Terminal initialized...', 'system');
    addLine('Rick Sanchez Engineering v2.0', 'system');
    addLine('Type "help" for available commands', 'system');
    addLine('', 'input');

    return () => {
      // Cleanup surface - use clearSurface instead of destroySurface
      try {
        renderer.clearSurface('main-terminal');
      } catch (error) {
        console.warn('Failed to clear surface:', error);
      }
    };
  }, [width, height, theme]);

  // Handle input changes
  const handleInputChange = useCallback((value: string) => {
    setCurrentInput(value);
    
    // Calculate cursor position
    const fontMetrics = renderer.calculateFontMetrics(
      theme.fontFamily,
      theme.fontSize
    );
    
    const newCursorX = value.length * fontMetrics.charWidth;
    const newCursorY = (lines.length) * fontMetrics.lineHeight;

    // Animate cursor to new position
    if (cursor.x !== newCursorX || cursor.y !== newCursorY) {
      animator.animateCursor(
        'main-cursor',
        canvasRef.current!,
        { x: cursor.x, y: cursor.y },
        { x: newCursorX, y: newCursorY },
        150
      );

      setCursor(prev => ({
        ...prev,
        x: newCursorX,
        y: newCursorY
      }));
    }

    // Re-render terminal
    renderTerminal();
  }, [cursor, lines, theme, renderer, animator]);

  // Handle command execution
  const handleCommand = useCallback((command: string) => {
    // Add command to history
    addLine(`$ ${command}`, 'input');

    // Process command
    if (command.trim()) {
      processCommand(command.trim());
      onCommand?.(command.trim());
    }

    // Clear input
    setCurrentInput('');
    
    // Move cursor to new line
    const fontMetrics = renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize);
    const newY = (lines.length + 1) * fontMetrics.lineHeight;
    
    animator.animateCursor(
      'main-cursor',
      canvasRef.current!,
      { x: cursor.x, y: cursor.y },
      { x: 0, y: newY },
      200
    );

    setCursor(prev => ({
      ...prev,
      x: 0,
      y: newY
    }));
  }, [lines, cursor, theme, onCommand, renderer, animator]);

  // Add line to terminal
  const addLine = useCallback((content: string, type: TerminalLine['type']) => {
    const newLine: TerminalLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      content,
      timestamp: Date.now(),
      type
    };

    setLines(prev => [...prev, newLine]);
  }, []);

  // Process terminal commands
  const processCommand = useCallback((command: string) => {
    const [cmd, ...args] = command.split(' ');

    switch (cmd.toLowerCase()) {
      case 'clear':
        setLines([]);
        break;

      case 'help':
        addLine('Available commands:', 'output');
        addLine('  help     - Show this help message', 'output');
        addLine('  clear    - Clear terminal screen', 'output');
        addLine('  echo     - Echo text back', 'output');
        addLine('  theme    - Change terminal theme', 'output');
        addLine('  cursor   - Change cursor style', 'output');
        addLine('  animate  - Test animations', 'output');
        break;

      case 'echo':
        addLine(args.join(' '), 'output');
        break;

      case 'theme':
        if (args[0]) {
          addLine(`Theme changed to: ${args[0]}`, 'output');
          // Theme changing logic would go here
        } else {
          addLine('Current theme: Quantum Dark', 'output');
        }
        break;

      case 'cursor':
        if (args[0]) {
          const newType = args[0] as CursorState['type'];
          if (['block', 'line', 'underscore'].includes(newType)) {
            setCursor(prev => ({ ...prev, type: newType }));
            addLine(`Cursor style changed to: ${newType}`, 'output');
          } else {
            addLine('Invalid cursor type. Use: block, line, or underscore', 'error');
          }
        } else {
          addLine(`Current cursor: ${cursor.type}`, 'output');
        }
        break;

      case 'animate':
        addLine('Testing animations...', 'output');
        // Test various animations
        if (canvasRef.current) {
          animator.pulse('test-pulse', canvasRef.current, 1.05, 800);
        }
        break;

      default:
        addLine(`Command not found: ${cmd}`, 'error');
        addLine('Type "help" for available commands', 'output');
    }
  }, [addLine, cursor.type, animator]);

  // Render terminal content
  const renderTerminal = useCallback(() => {
    if (!canvasRef.current) return;

    // Clear surface
    renderer.clearSurface('main-terminal');

    // Calculate font metrics
    const fontMetrics = renderer.calculateFontMetrics(
      theme.fontFamily,
      theme.fontSize
    );

    // Render background
    const surface = renderer.getSurfaceCanvas('main-terminal');
    if (surface) {
      const ctx = surface.getContext('2d')!;
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, width, height);
    }

    // Render all lines
    lines.forEach((line, index) => {
      const y = (index + 1) * fontMetrics.lineHeight;
      const color = getLineColor(line.type);

      renderer.renderText(
        'main-terminal',
        line.content,
        8, // Left padding
        y,
        {
          font: fontMetrics,
          color,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );
    });

    // Render current input
    if (currentInput || isActive) {
      const inputY = (lines.length + 1) * fontMetrics.lineHeight;
      const prompt = '$ ';
      
      // Render prompt
      renderer.renderText(
        'main-terminal',
        prompt,
        8,
        inputY,
        {
          font: fontMetrics,
          color: theme.accent,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );

      // Render input text
      if (currentInput) {
        renderer.renderText(
          'main-terminal',
          currentInput,
          8 + prompt.length * fontMetrics.charWidth,
          inputY,
          {
            font: fontMetrics,
            color: theme.foreground,
            antialiasing: true,
            subpixelRendering: true,
            hinting: 'full'
          }
        );
      }
    }

    // Render cursor
    renderCursor();
  }, [lines, currentInput, cursor, theme, isActive, width, height, renderer]);

  // Render cursor with animations
  const renderCursor = useCallback(() => {
    if (!cursor.visible || !isActive) return;

    const surface = renderer.getSurfaceCanvas('main-terminal');
    if (!surface) return;

    const ctx = surface.getContext('2d')!;
    const fontMetrics = renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize);
    
    // Calculate cursor position
    const promptWidth = 8 + 2 * fontMetrics.charWidth; // "$ " width
    const cursorX = promptWidth + cursor.x;
    const cursorY = cursor.y;

    // Set cursor style
    ctx.fillStyle = theme.cursor;

    // Render cursor based on type
    switch (cursor.type) {
      case 'block':
        ctx.fillRect(
          cursorX,
          cursorY - fontMetrics.ascent,
          fontMetrics.charWidth,
          fontMetrics.lineHeight
        );
        break;

      case 'line':
        ctx.fillRect(
          cursorX,
          cursorY - fontMetrics.ascent,
          2,
          fontMetrics.lineHeight
        );
        break;

      case 'underscore':
        ctx.fillRect(
          cursorX,
          cursorY - 2,
          fontMetrics.charWidth,
          2
        );
        break;
    }
  }, [cursor, theme, isActive, renderer]);

  // Get line color based on type
  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'input':
        return theme.accent;
      case 'output':
        return theme.foreground;
      case 'error':
        return '#ff4444';
      case 'system':
        return '#00ff88';
      default:
        return theme.foreground;
    }
  };

  // Handle focus and blur
  const handleFocus = useCallback(() => {
    setIsActive(true);
    setCursor(prev => ({ ...prev, visible: true, blinking: true }));
  }, []);

  const handleBlur = useCallback(() => {
    setIsActive(false);
    setCursor(prev => ({ ...prev, blinking: false }));
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleCommand(currentInput);
        break;

      case 'Backspace':
        e.preventDefault();
        const newInput = currentInput.slice(0, -1);
        setCurrentInput(newInput);
        handleInputChange(newInput);
        break;

      default:
        if (e.key.length === 1) {
          e.preventDefault();
          const newInput = currentInput + e.key;
          setCurrentInput(newInput);
          handleInputChange(newInput);
        }
    }
  }, [isActive, currentInput, handleCommand, handleInputChange]);

  // Cursor blinking animation
  useEffect(() => {
    if (!cursor.blinking || !isActive) return;

    const interval = setInterval(() => {
      setCursor(prev => ({ ...prev, visible: !prev.visible }));
    }, 530); // Standard cursor blink rate

    return () => clearInterval(interval);
  }, [cursor.blinking, isActive]);

  // Re-render when state changes
  useEffect(() => {
    renderTerminal();
  }, [renderTerminal]);

  // Handle container click to focus
  const handleContainerClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="quantum-terminal"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: theme.background,
        fontFamily: theme.fontFamily,
        fontSize: `${theme.fontSize}px`,
        overflow: 'hidden',
        cursor: 'text'
      }}
      onClick={handleContainerClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Hidden input for keyboard handling */}
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={(e) => {
          setCurrentInput(e.target.value);
          handleInputChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        aria-label="Terminal input"
      />
    </div>
  );
};

export default QuantumTerminal;