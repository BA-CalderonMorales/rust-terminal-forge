/**
 * Tool Interface Components - NvChad-inspired design for all command tools
 * Responsive design optimized for mobile, tablet, and desktop
 */

import React, { useState, useEffect } from 'react';
import { themeManager } from '../theme';
import { VimCursor, CodeCursor, AICursor } from './TerminalCursor';

interface ToolInterfaceProps {
  tool: 'vim' | 'claude' | 'gemini' | 'qwen' | 'code';
  isActive: boolean;
  onClose?: () => void;
  className?: string;
}

interface VimEditorProps {
  fileName?: string;
  content?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
}

interface AIAssistantProps {
  provider: 'claude' | 'gemini' | 'qwen';
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
}

interface CodeEditorProps {
  language?: string;
  content?: string;
  onExecute?: (code: string) => void;
  onClose?: () => void;
}

// NvChad-inspired Vim Editor Interface
export const VimInterface: React.FC<VimEditorProps> = ({ 
  fileName = 'untitled.txt', 
  content = '',
  onSave,
  onClose 
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [editorContent, setEditorContent] = useState(content);
  const [mode, setMode] = useState<'normal' | 'insert' | 'visual'>('normal');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  return (
    <div 
      data-testid="vim-interface"
      className="nvchad-vim-style terminal-tool-interface"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: currentTheme.colors.background,
        color: currentTheme.colors.text,
        fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", monospace',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Vim Status Line - NvChad inspired */}
      <div style={{
        padding: '8px 16px',
        background: `linear-gradient(135deg, ${currentTheme.colors.backgroundSecondary}, ${currentTheme.colors.backgroundTertiary})`,
        borderBottom: `1px solid ${currentTheme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '4px 8px',
            background: mode === 'normal' ? currentTheme.colors.neonBlue : 
                       mode === 'insert' ? currentTheme.colors.neonGreen : currentTheme.colors.neonPink,
            color: currentTheme.colors.background,
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '10px',
            letterSpacing: '0.5px'
          }}>
            {mode.toUpperCase()}
          </div>
          <span style={{ color: currentTheme.colors.textSecondary }}>
            {fileName}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: currentTheme.colors.textMuted }}>
            {cursorPosition.line}:{cursorPosition.col}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentTheme.colors.textSecondary,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTheme.colors.error;
              e.currentTarget.style.color = currentTheme.colors.background;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = currentTheme.colors.textSecondary;
            }}
            title="Close (:q)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <textarea
            data-testid="vim-input"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: currentTheme.colors.text,
              fontFamily: 'inherit',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              lineHeight: '1.5',
              padding: '16px',
              paddingLeft: '64px', // Make room for line numbers
              resize: 'none',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              tabSize: 2
            }}
            spellCheck={false}
            placeholder="-- INSERT --"
          />
          
          {/* Vim Editor Area */}
          <div 
            data-testid="vim-editor"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            <VimCursor 
              mode={mode === 'insert' ? 'insert' : 'normal'} 
              position={cursorPosition}
            />
          </div>
        </div>
        
        {/* Line Numbers */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '48px',
          background: `linear-gradient(135deg, ${currentTheme.colors.backgroundSecondary}, ${currentTheme.colors.backgroundTertiary})`,
          borderRight: `1px solid ${currentTheme.colors.border}`,
          padding: '16px 8px',
          fontSize: '11px',
          color: currentTheme.colors.textMuted,
          textAlign: 'right',
          lineHeight: '1.5',
          pointerEvents: 'none',
          fontFamily: 'inherit'
        }}>
          {editorContent.split('\n').map((_, index) => (
            <div key={index} style={{ height: '21px' }}>
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Command Line */}
      <div style={{
        padding: '8px 16px',
        background: currentTheme.colors.backgroundSecondary,
        borderTop: `1px solid ${currentTheme.colors.border}`,
        fontSize: '12px',
        minHeight: '32px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ color: currentTheme.colors.textMuted }}>
          :w to save • :q to quit • :wq to save and quit
        </span>
      </div>
    </div>
  );
};

// AI Assistant Interface (Claude, Gemini, Qwen)
export const AIAssistantInterface: React.FC<AIAssistantProps> = ({ 
  provider, 
  conversation = [],
  onSendMessage,
  onClose 
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  const providerConfig = {
    claude: { name: 'Claude', icon: '🧠', color: currentTheme.colors.neonBlue },
    gemini: { name: 'Gemini', icon: '✨', color: currentTheme.colors.neonPurple },
    qwen: { name: 'Qwen', icon: '🚀', color: currentTheme.colors.neonPink }
  };

  const config = providerConfig[provider];

  return (
    <div 
      data-testid={`${provider}-interface`}
      className="professional-ai-interface consistent-ai-interface terminal-tool-interface"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: currentTheme.colors.background,
        color: currentTheme.colors.text,
        fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", monospace',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* AI Assistant Header */}
      <div style={{
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${currentTheme.colors.backgroundSecondary}, ${currentTheme.colors.backgroundTertiary})`,
        borderBottom: `1px solid ${currentTheme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${config.color}, ${currentTheme.colors.neonGreen})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            boxShadow: `0 0 12px ${config.color}40`
          }}>
            {config.icon}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {config.name} Assistant
            </div>
            <div style={{ fontSize: '11px', color: currentTheme.colors.textMuted }}>
              AI-powered coding assistant
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: currentTheme.colors.textSecondary,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            minWidth: '44px',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = currentTheme.colors.error;
            e.currentTarget.style.color = currentTheme.colors.background;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = currentTheme.colors.textSecondary;
          }}
        >
          ✕
        </button>
      </div>

      {/* Conversation Area */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {conversation.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: currentTheme.colors.textMuted,
            padding: '32px',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>
              {config.icon}
            </div>
            <div>Start a conversation with {config.name}</div>
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
              Ask questions, request code help, or get explanations
            </div>
          </div>
        ) : (
          conversation.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: '12px',
                alignItems: 'flex-start'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: msg.role === 'user' 
                  ? `linear-gradient(135deg, ${currentTheme.colors.neonGreen}, ${currentTheme.colors.neonBlue})`
                  : `linear-gradient(135deg, ${config.color}, ${currentTheme.colors.neonGreen})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? '👤' : config.icon}
              </div>
              <div style={{
                background: msg.role === 'user' 
                  ? `linear-gradient(135deg, ${currentTheme.colors.neonGreen}20, ${currentTheme.colors.neonBlue}20)`
                  : `linear-gradient(135deg, ${currentTheme.colors.backgroundSecondary}, ${currentTheme.colors.backgroundTertiary})`,
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '13px',
                lineHeight: '1.5',
                border: `1px solid ${currentTheme.colors.border}`,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div 
            data-testid="loading"
            className="consistent-loading"
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${config.color}, ${currentTheme.colors.neonGreen})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              {config.icon}
            </div>
            <div style={{
              padding: '12px 16px',
              background: currentTheme.colors.backgroundSecondary,
              borderRadius: '12px',
              border: `1px solid ${currentTheme.colors.border}`,
              color: currentTheme.colors.textMuted,
              fontSize: '13px',
              position: 'relative'
            }}>
              <span className="typing-animation">Thinking...</span>
              <AICursor isTyping={true} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        background: currentTheme.colors.backgroundSecondary,
        borderTop: `1px solid ${currentTheme.colors.border}`,
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Ask ${config.name} anything...`}
          style={{
            flex: 1,
            background: currentTheme.colors.background,
            border: `1px solid ${currentTheme.colors.border}`,
            borderRadius: '8px',
            padding: '12px',
            color: currentTheme.colors.text,
            fontSize: '13px',
            fontFamily: 'inherit',
            resize: 'none',
            minHeight: '44px',
            maxHeight: '120px',
            outline: 'none'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim() && onSendMessage) {
                onSendMessage(message.trim());
                setMessage('');
              }
            }
          }}
        />
        <button
          onClick={() => {
            if (message.trim() && onSendMessage) {
              onSendMessage(message.trim());
              setMessage('');
            }
          }}
          disabled={!message.trim() || isLoading}
          style={{
            padding: '12px 16px',
            background: message.trim() 
              ? `linear-gradient(135deg, ${config.color}, ${currentTheme.colors.neonGreen})`
              : currentTheme.colors.backgroundTertiary,
            border: 'none',
            borderRadius: '8px',
            color: message.trim() ? currentTheme.colors.background : currentTheme.colors.textMuted,
            fontSize: '13px',
            fontWeight: '600',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            minWidth: '60px',
            minHeight: '44px'
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        .typing-animation::after {
          content: '';
          animation: blink 1.5s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Code Editor Interface (for general coding)
export const CodeEditorInterface: React.FC<CodeEditorProps> = ({ 
  language = 'javascript',
  content = '',
  onExecute,
  onClose 
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [code, setCode] = useState(content);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  return (
    <div 
      data-testid="code-interface"
      className="mobile-optimized terminal-tool-interface"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: currentTheme.colors.background,
        color: currentTheme.colors.text,
        fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", monospace',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Code Editor Header */}
      <div style={{
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${currentTheme.colors.backgroundSecondary}, ${currentTheme.colors.backgroundTertiary})`,
        borderBottom: `1px solid ${currentTheme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '4px 8px',
            background: currentTheme.colors.neonPurple,
            color: currentTheme.colors.background,
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            {language.toUpperCase()}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            Code Editor
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              if (onExecute && code.trim()) {
                setIsRunning(true);
                onExecute(code);
                setTimeout(() => setIsRunning(false), 1000);
              }
            }}
            disabled={isRunning || !code.trim()}
            style={{
              padding: '8px 12px',
              background: code.trim() && !isRunning
                ? `linear-gradient(135deg, ${currentTheme.colors.neonGreen}, ${currentTheme.colors.neonBlue})`
                : currentTheme.colors.backgroundTertiary,
              border: 'none',
              borderRadius: '6px',
              color: code.trim() && !isRunning ? currentTheme.colors.background : currentTheme.colors.textMuted,
              fontSize: '12px',
              fontWeight: '600',
              cursor: code.trim() && !isRunning ? 'pointer' : 'not-allowed',
              minHeight: '44px',
              minWidth: '60px'
            }}
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? '⏳' : '▶️'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentTheme.colors.textSecondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Split View: Code + Output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
        {/* Code Area */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: window.innerWidth < 768 ? '50%' : 'auto'
        }}>
          <div style={{
            padding: '8px 16px',
            background: currentTheme.colors.backgroundTertiary,
            borderBottom: `1px solid ${currentTheme.colors.border}`,
            fontSize: '11px',
            color: currentTheme.colors.textMuted,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>CODE</span>
            <span>Ctrl+Enter to run</span>
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <textarea
              data-testid="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: currentTheme.colors.text,
                fontFamily: 'inherit',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                lineHeight: '1.5',
                padding: '16px',
                resize: 'none',
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                tabSize: 2
              }}
              placeholder={`// Write your ${language} code here...`}
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  e.preventDefault();
                  if (onExecute && code.trim()) {
                    onExecute(code);
                  }
                }
              }}
            />
            
            {/* Code Editor Features */}
            <div 
              data-testid="intellisense"
              style={{ position: 'absolute', top: 0, right: 0, pointerEvents: 'none' }}
            />
            <div 
              data-testid="debugger"
              style={{ position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
            />
            
            <CodeCursor 
              cursors={[{ line: 1, col: code.length % 80 }]} 
              currentLine={Math.ceil((code.length || 1) / 80)}
            />
          </div>
        </div>

        {/* Output Area */}
        <div style={{ 
          flex: window.innerWidth < 768 ? 1 : 0.4, 
          display: 'flex', 
          flexDirection: 'column',
          borderLeft: window.innerWidth >= 768 ? `1px solid ${currentTheme.colors.border}` : 'none',
          borderTop: window.innerWidth < 768 ? `1px solid ${currentTheme.colors.border}` : 'none',
          minHeight: window.innerWidth < 768 ? '50%' : 'auto'
        }}>
          <div style={{
            padding: '8px 16px',
            background: currentTheme.colors.backgroundTertiary,
            borderBottom: `1px solid ${currentTheme.colors.border}`,
            fontSize: '11px',
            color: currentTheme.colors.textMuted
          }}>
            OUTPUT
          </div>
          <div style={{
            flex: 1,
            padding: '16px',
            background: currentTheme.colors.backgroundSecondary,
            fontSize: '12px',
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            color: output ? currentTheme.colors.text : currentTheme.colors.textMuted
          }}>
            {output || 'Run code to see output...'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Tool Interface Component
export const ToolInterface: React.FC<ToolInterfaceProps> = ({ 
  tool, 
  isActive, 
  onClose,
  className = '' 
}) => {
  if (!isActive) return null;

  switch (tool) {
    case 'vim':
      return <VimInterface onClose={onClose} />;
    case 'claude':
      return <AIAssistantInterface provider="claude" onClose={onClose} />;
    case 'gemini':
      return <AIAssistantInterface provider="gemini" onClose={onClose} />;
    case 'qwen':
      return <AIAssistantInterface provider="qwen" onClose={onClose} />;
    case 'code':
      return <CodeEditorInterface onClose={onClose} />;
    default:
      return null;
  }
};