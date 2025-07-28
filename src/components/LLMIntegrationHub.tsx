/**
 * 🧠 LLM Integration Hub - Multi-Provider AI Interface
 * Seamless integration with Claude, Gemini, OpenCode, and Qwen
 * Crystal-clear output rendering for all AI providers
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useASCIIRenderer } from '../engine/ASCIIRenderer';
import { useFluidAnimator } from '../engine/FluidAnimator';

interface LLMProvider {
  id: string;
  name: string;
  color: string;
  icon: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface LLMResponse {
  id: string;
  provider: string;
  content: string;
  type: 'text' | 'code' | 'markdown' | 'json' | 'error';
  timestamp: number;
  streaming: boolean;
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
  };
}

interface LLMIntegrationHubProps {
  width: number;
  height: number;
  theme: {
    background: string;
    foreground: string;
    accent: string;
    fontFamily: string;
    fontSize: number;
  };
  onProviderChange?: (provider: string) => void;
}

const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'claude',
    name: 'Claude',
    color: '#ff6b35',
    icon: 'C',
    endpoint: '/api/claude',
    status: 'connected'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    color: '#4285f4',
    icon: 'G',
    endpoint: '/api/gemini',
    status: 'connected'
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    color: '#00ff88',
    icon: 'O',
    endpoint: '/api/opencode',
    status: 'connected'
  },
  {
    id: 'qwen',
    name: 'Qwen',
    color: '#8b5cf6',
    icon: 'Q',
    endpoint: '/api/qwen',
    status: 'connected'
  }
];

/**
 * LLM Integration Hub - Rick's AI Command Center
 */
export const LLMIntegrationHub: React.FC<LLMIntegrationHubProps> = ({
  width,
  height,
  theme,
  onProviderChange
}) => {
  const [providers] = useState<LLMProvider[]>(DEFAULT_PROVIDERS);
  const [activeProvider, setActiveProvider] = useState<string>('claude');
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const providerCanvasRef = useRef<HTMLCanvasElement>(null);

  const renderer = useASCIIRenderer();
  const animator = useFluidAnimator();

  // Initialize rendering surfaces
  useEffect(() => {
    // Create output surface
    const outputSurface = renderer.createSurface(
      'llm-output',
      width,
      height - 100,
      window.devicePixelRatio
    );

    // Create provider selector surface
    const providerSurface = renderer.createSurface(
      'llm-providers',
      width,
      60,
      window.devicePixelRatio
    );

    // Replace canvases in DOM
    if (containerRef.current) {
      if (outputCanvasRef.current) {
        containerRef.current.replaceChild(outputSurface.canvas, outputCanvasRef.current);
        outputCanvasRef.current = outputSurface.canvas;
      }
      
      if (providerCanvasRef.current) {
        containerRef.current.replaceChild(providerSurface.canvas, providerCanvasRef.current);
        providerCanvasRef.current = providerSurface.canvas;
      }
    }

    return () => {
      renderer.destroySurface('llm-output');
      renderer.destroySurface('llm-providers');
    };
  }, [width, height, renderer]);

  // Render provider selector
  const renderProviderSelector = useCallback(() => {
    if (!providerCanvasRef.current) return;

    renderer.clearSurface('llm-providers');
    
    const fontMetrics = renderer.calculateFontMetrics(
      theme.fontFamily,
      theme.fontSize,
      'bold'
    );

    let currentX = 20;
    const y = 35;

    providers.forEach((provider, index) => {
      const isActive = provider.id === activeProvider;
      const backgroundColor = isActive ? provider.color : 'transparent';
      const textColor = isActive ? '#000000' : provider.color;

      // Render provider button background
      if (isActive) {
        const surface = renderer.getSurfaceCanvas('llm-providers');
        if (surface) {
          const ctx = surface.getContext('2d')!;
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(
            currentX - 8,
            y - fontMetrics.ascent - 4,
            provider.name.length * fontMetrics.charWidth + 16,
            fontMetrics.lineHeight + 8
          );
        }
      }

      // Render provider icon and name
      const providerText = `[${provider.icon}] ${provider.name}`;
      renderer.renderText(
        'llm-providers',
        providerText,
        currentX,
        y,
        {
          font: fontMetrics,
          color: textColor,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );

      // Render status indicator
      const statusColor = provider.status === 'connected' ? '#00ff88' : 
                         provider.status === 'error' ? '#ff4444' : '#ffaa00';
      
      const statusX = currentX + providerText.length * fontMetrics.charWidth + 10;
      renderer.renderText(
        'llm-providers',
        '●',
        statusX,
        y,
        {
          font: fontMetrics,
          color: statusColor,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );

      currentX += (providerText.length + 5) * fontMetrics.charWidth + 30;
    });
  }, [providers, activeProvider, theme, renderer]);

  // Render LLM responses
  const renderResponses = useCallback(() => {
    if (!outputCanvasRef.current) return;

    renderer.clearSurface('llm-output');

    const fontMetrics = renderer.calculateFontMetrics(
      theme.fontFamily,
      theme.fontSize
    );

    let currentY = fontMetrics.lineHeight + 10;
    const leftPadding = 15;
    const maxWidth = width - 30;

    responses.forEach((response) => {
      const provider = providers.find(p => p.id === response.provider);
      if (!provider) return;

      // Render provider header
      const headerText = `[${provider.name}] ${new Date(response.timestamp).toLocaleTimeString()}`;
      renderer.renderText(
        'llm-output',
        headerText,
        leftPadding,
        currentY,
        {
          font: fontMetrics,
          color: provider.color,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );

      currentY += fontMetrics.lineHeight + 5;

      // Render response content based on type
      switch (response.type) {
        case 'code':
          currentY = renderCodeBlock(response.content, leftPadding + 20, currentY, maxWidth - 40);
          break;

        case 'markdown':
          currentY = renderMarkdown(response.content, leftPadding + 20, currentY, maxWidth - 40);
          break;

        case 'json':
          currentY = renderJSON(response.content, leftPadding + 20, currentY, maxWidth - 40);
          break;

        case 'error':
          currentY = renderError(response.content, leftPadding + 20, currentY, maxWidth - 40);
          break;

        default:
          currentY = renderText(response.content, leftPadding + 20, currentY, maxWidth - 40);
      }

      // Render metadata if available
      if (response.metadata) {
        const metadataText = `Model: ${response.metadata.model || 'unknown'} | ` +
                           `Tokens: ${response.metadata.tokens || 0} | ` +
                           `Latency: ${response.metadata.latency || 0}ms`;
        
        renderer.renderText(
          'llm-output',
          metadataText,
          leftPadding,
          currentY + 10,
          {
            font: renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize - 2),
            color: '#888888',
            antialiasing: true,
            subpixelRendering: true,
            hinting: 'full'
          }
        );

        currentY += fontMetrics.lineHeight + 5;
      }

      currentY += fontMetrics.lineHeight; // Extra spacing between responses
    });

    // Render streaming indicator
    if (isStreaming) {
      const streamingText = 'Generating response...';
      renderer.renderText(
        'llm-output',
        streamingText,
        leftPadding,
        currentY,
        {
          font: fontMetrics,
          color: theme.accent,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );

      // Animate streaming indicator
      if (outputCanvasRef.current) {
        animator.pulse('streaming-indicator', outputCanvasRef.current, 1.05, 1000);
      }
    }
  }, [responses, isStreaming, providers, theme, width, renderer, animator]);

  // Render code block with syntax highlighting
  const renderCodeBlock = (code: string, x: number, y: number, maxWidth: number): number => {
    const fontMetrics = renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize);
    const lines = code.split('\n');
    let currentY = y;

    // Render code background
    const surface = renderer.getSurfaceCanvas('llm-output');
    if (surface) {
      const ctx = surface.getContext('2d')!;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(
        x - 10,
        y - fontMetrics.ascent,
        maxWidth,
        lines.length * fontMetrics.lineHeight + 10
      );
    }

    // Render each line with basic syntax highlighting
    lines.forEach((line) => {
      const highlightedLine = applySyntaxHighlighting(line);
      renderer.renderWithColors(
        'llm-output',
        highlightedLine,
        x,
        currentY,
        {
          font: fontMetrics,
          color: theme.foreground,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );
      currentY += fontMetrics.lineHeight;
    });

    return currentY + 10;
  };

  // Render markdown content
  const renderMarkdown = (markdown: string, x: number, y: number, maxWidth: number): number => {
    const fontMetrics = renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize);
    const lines = markdown.split('\n');
    let currentY = y;

    lines.forEach((line) => {
      let color = theme.foreground;
      let processedLine = line;

      // Basic markdown highlighting
      if (line.startsWith('# ')) {
        color = theme.accent;
        processedLine = line.substring(2);
      } else if (line.startsWith('## ')) {
        color = theme.accent;
        processedLine = line.substring(3);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        color = '#00ff88';
      } else if (line.includes('`')) {
        color = '#ffaa00';
      }

      renderer.renderText(
        'llm-output',
        processedLine,
        x,
        currentY,
        {
          font: fontMetrics,
          color,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );
      currentY += fontMetrics.lineHeight;
    });

    return currentY + 10;
  };

  // Render JSON with formatting
  const renderJSON = (jsonString: string, x: number, y: number, maxWidth: number): number => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      return renderCodeBlock(formatted, x, y, maxWidth);
    } catch {
      return renderText(jsonString, x, y, maxWidth);
    }
  };

  // Render error message
  const renderError = (error: string, x: number, y: number, maxWidth: number): number => {
    const fontMetrics = renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize);
    
    renderer.renderText(
      'llm-output',
      `ERROR: ${error}`,
      x,
      y,
      {
        font: fontMetrics,
        color: '#ff4444',
        antialiasing: true,
        subpixelRendering: true,
        hinting: 'full'
      }
    );

    return y + fontMetrics.lineHeight + 10;
  };

  // Render plain text with word wrapping
  const renderText = (text: string, x: number, y: number, maxWidth: number): number => {
    const fontMetrics = renderer.calculateFontMetrics(theme.fontFamily, theme.fontSize);
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const lineWidth = testLine.length * fontMetrics.charWidth;

      if (lineWidth > maxWidth && currentLine) {
        // Render current line
        renderer.renderText(
          'llm-output',
          currentLine,
          x,
          currentY,
          {
            font: fontMetrics,
            color: theme.foreground,
            antialiasing: true,
            subpixelRendering: true,
            hinting: 'full'
          }
        );
        
        currentY += fontMetrics.lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    // Render final line
    if (currentLine) {
      renderer.renderText(
        'llm-output',
        currentLine,
        x,
        currentY,
        {
          font: fontMetrics,
          color: theme.foreground,
          antialiasing: true,
          subpixelRendering: true,
          hinting: 'full'
        }
      );
      currentY += fontMetrics.lineHeight;
    }

    return currentY + 10;
  };

  // Apply basic syntax highlighting
  const applySyntaxHighlighting = (line: string): string => {
    // Simple syntax highlighting with ANSI color codes
    return line
      .replace(/\b(function|const|let|var|if|else|for|while|return)\b/g, '\\033[34m$1\\033[0m')
      .replace(/\b(true|false|null|undefined)\b/g, '\\033[35m$1\\033[0m')
      .replace(/("[^"]*")/g, '\\033[32m$1\\033[0m')
      .replace(/(\/\/.*$)/gm, '\\033[37m$1\\033[0m')
      .replace(/\b(\d+)\b/g, '\\033[33m$1\\033[0m');
  };

  // Handle provider selection
  const handleProviderClick = useCallback((providerId: string) => {
    setActiveProvider(providerId);
    onProviderChange?.(providerId);

    // Animate provider switch
    if (providerCanvasRef.current) {
      animator.pulse('provider-switch', providerCanvasRef.current, 1.02, 300);
    }
  }, [onProviderChange, animator]);

  // Send message to LLM
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsStreaming(true);
    
    try {
      const provider = providers.find(p => p.id === activeProvider);
      if (!provider) throw new Error('Provider not found');

      // Simulate API call (replace with actual implementation)
      const response = await simulateLLMResponse(provider, message);
      
      setResponses(prev => [...prev, response]);
    } catch (error) {
      const errorResponse: LLMResponse = {
        id: `error-${Date.now()}`,
        provider: activeProvider,
        content: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        timestamp: Date.now(),
        streaming: false
      };
      
      setResponses(prev => [...prev, errorResponse]);
    } finally {
      setIsStreaming(false);
    }
  }, [activeProvider, providers]);

  // Simulate LLM response (replace with actual API calls)
  const simulateLLMResponse = async (provider: LLMProvider, message: string): Promise<LLMResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = {
          claude: `Claude response to: "${message}"\n\nThis is a simulated response from Claude AI. In a real implementation, this would be the actual response from the Claude API.`,
          gemini: `Gemini analysis of: "${message}"\n\n1. Understanding your query\n2. Processing with multimodal capabilities\n3. Generating comprehensive response`,
          opencode: `// OpenCode solution for: ${message}\nfunction solution() {\n  return "Generated code response";\n}`,
          qwen: `通义千问回复: "${message}"\n\n这是来自通义千问的模拟回复。实际实现中，这将是真实的API响应。`
        };

        resolve({
          id: `response-${Date.now()}`,
          provider: provider.id,
          content: responses[provider.id as keyof typeof responses] || 'Default response',
          type: provider.id === 'opencode' ? 'code' : 'text',
          timestamp: Date.now(),
          streaming: false,
          metadata: {
            model: `${provider.name}-3.5`,
            tokens: Math.floor(Math.random() * 1000) + 100,
            latency: Math.floor(Math.random() * 2000) + 500
          }
        });
      }, 1000 + Math.random() * 2000); // Simulate network delay
    });
  };

  // Re-render when state changes
  useEffect(() => {
    renderProviderSelector();
  }, [renderProviderSelector]);

  useEffect(() => {
    renderResponses();
  }, [renderResponses]);

  // Handle input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  }, [input, sendMessage]);

  return (
    <div
      ref={containerRef}
      className="llm-integration-hub"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.background,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Provider Selector */}
      <div
        style={{
          height: '60px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          const rect = providerCanvasRef.current?.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - rect.left;
            const providerIndex = Math.floor(x / (width / providers.length));
            if (providerIndex >= 0 && providerIndex < providers.length) {
              handleProviderClick(providers[providerIndex].id);
            }
          }
        }}
      >
        <canvas
          ref={providerCanvasRef}
          style={{
            display: 'block',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* Output Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={outputCanvasRef}
          style={{
            display: 'block',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        style={{
          height: '40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${providers.find(p => p.id === activeProvider)?.name}...`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: theme.foreground,
            fontSize: `${theme.fontSize}px`,
            fontFamily: theme.fontFamily,
            outline: 'none'
          }}
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          style={{
            background: theme.accent,
            color: theme.background,
            border: 'none',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: `${theme.fontSize - 2}px`,
            fontFamily: theme.fontFamily,
            cursor: 'pointer',
            opacity: !input.trim() || isStreaming ? 0.5 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default LLMIntegrationHub;