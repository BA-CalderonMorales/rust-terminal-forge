import React, { useEffect, useRef, useState } from 'react';
import { TerminalSession, TabState } from '../core/types';
import { tabManager } from '../core/tabManager';
import { GestureHandler, hapticFeedback } from '../core/gestureNavigation';

interface MobileTabProps {
  session: TerminalSession;
  isActive: boolean;
  onTabClick: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
  showCloseButton: boolean;
}

const MobileTab: React.FC<MobileTabProps> = ({
  session,
  isActive,
  onTabClick,
  onTabClose,
  showCloseButton
}) => {
  const handleClick = () => {
    hapticFeedback.cyberpunkPulse();
    onTabClick(session.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.medium();
    onTabClose(session.id);
  };

  return (
    <div
      data-testid={`tab-${session.id}`}
      className={`mobile-tab ${isActive ? 'active' : ''} ${session.isDirty ? 'dirty' : ''}`}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        minHeight: '44px', // Touch target size (WCAG AA compliance)
        minWidth: '80px',
        maxWidth: '200px',
        backgroundColor: isActive ? '#00ff88' : '#2a2a2a',
        color: isActive ? '#000' : '#e1e1e1',
        borderRadius: '8px',
        margin: '2px 4px',
        border: session.isDirty ? '2px solid #ffaa00' : '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 4px 8px rgba(0, 255, 136, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.3)',
        flex: '0 0 auto' // Prevent flex shrinking
      }}
    >
      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <span 
          style={{ 
            fontSize: '14px',
            fontWeight: isActive ? '600' : '400',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1
          }}
        >
          {session.name}
        </span>
        
        {/* Professional status indicator without emoji */}
        {session.isDirty && (
          <span 
            className="text-icon"
            style={{
              marginLeft: '6px',
              color: '#ffaa00',
              fontSize: '12px',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite'
            }}
            title={`${session.processCount} active processes`}
          >
            •
          </span>
        )}
        
        {/* Process count badge */}
        {session.processCount > 0 && (
          <span
            style={{
              marginLeft: '4px',
              backgroundColor: '#ffaa00',
              color: '#000',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '10px',
              padding: '2px 6px',
              minWidth: '16px',
              textAlign: 'center'
            }}
          >
            {session.processCount}
          </span>
        )}
      </div>

      {/* Close button */}
      {showCloseButton && (
        <button
          data-testid={`close-tab-${session.id}`}
          onClick={handleClose}
          style={{
            marginLeft: '8px',
            padding: '4px',
            minHeight: '32px',
            minWidth: '32px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label={`Close ${session.name}`}
        >
          <span className="text-icon text-icon--close" />
        </button>
      )}

      {/* Active indicator */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#00ff88',
            animation: 'glow 2s infinite'
          }}
        />
      )}
    </div>
  );
};

interface MobileTabBarProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onTabClick: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
  onNewTab: () => void;
  settings: TabState['settings'];
  canCreateNewTab: boolean;
  hasClosedTabs: boolean;
  onRestoreTab: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  sessions,
  activeSessionId,
  onTabClick,
  onTabClose,
  onNewTab,
  settings,
  canCreateNewTab,
  hasClosedTabs,
  onRestoreTab
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Check scroll shadows
  const updateScrollShadows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollShadows();
    container.addEventListener('scroll', updateScrollShadows, { passive: true });
    
    const resizeObserver = new ResizeObserver(updateScrollShadows);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollShadows);
      resizeObserver.disconnect();
    };
  }, [sessions.length]);

  // Auto-scroll to active tab
  useEffect(() => {
    if (!activeSessionId) return;
    
    const activeTab = document.querySelector(`[data-testid="tab-${activeSessionId}"]`);
    if (activeTab && scrollContainerRef.current) {
      activeTab.scrollIntoView({ 
        behavior: 'smooth', 
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeSessionId]);

  const handleNewTab = () => {
    hapticFeedback.terminalBoot();
    onNewTab();
  };

  const handleRestoreTab = () => {
    hapticFeedback.synthwaveRipple();
    onRestoreTab();
  };

  return (
    <div
      data-testid="mobile-tab-bar"
      style={{
        position: 'relative',
        background: 'var(--terminal-gradient-header)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
        boxShadow: '0 1px 3px rgba(0, 255, 136, 0.1), inset 0 1px 0 rgba(0, 255, 136, 0.05)',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Left scroll shadow */}
      {showLeftShadow && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '16px',
            background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.8) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      )}

      {/* Right scroll shadow */}
      {showRightShadow && (
        <div
          style={{
            position: 'absolute',
            right: canCreateNewTab || hasClosedTabs ? '100px' : '16px',
            top: 0,
            bottom: 0,
            width: '16px',
            background: 'linear-gradient(270deg, rgba(26, 26, 26, 0.8) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      )}

      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          flex: 1,
          padding: '4px 8px',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          gap: '2px'
        }}
        className="hide-scrollbar"
      >
        {sessions.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: '14px',
              fontStyle: 'italic',
              minHeight: '44px'
            }}
          >
            No terminal sessions
          </div>
        ) : (
          sessions.map((session) => (
            <MobileTab
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              showCloseButton={settings.showCloseButtons}
            />
          ))
        )}
      </div>

      {/* Action buttons container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          gap: '4px',
          flexShrink: 0,
          background: 'var(--terminal-gradient-header)',
          borderLeft: sessions.length > 0 ? '1px solid rgba(0, 255, 136, 0.2)' : 'none',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)'
        }}
      >
        {/* Restore tab button */}
        {hasClosedTabs && (
          <button
            data-testid="restore-tab-button"
            onClick={handleRestoreTab}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
              minWidth: '40px',
              padding: '8px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              touchAction: 'manipulation',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#444';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#333';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Restore closed tab"
            title="Restore recently closed tab"
          >
            <span className="text-icon">⟲</span>
          </button>
        )}

        {/* New tab button */}
        {canCreateNewTab && (
          <button
            data-testid="new-tab-button"
            onClick={handleNewTab}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
              minWidth: '40px',
              padding: '8px',
              backgroundColor: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              touchAction: 'manipulation',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 255, 136, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00d470';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 255, 136, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00ff88';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 255, 136, 0.3)';
            }}
            aria-label="Create new terminal"
            title="Create new terminal tab"
          >
            <span className="text-icon text-icon--add" />
          </button>
        )}
      </div>

      {/* CSS for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 4px rgba(0, 255, 136, 0.6); }
          50% { box-shadow: 0 0 8px rgba(0, 255, 136, 0.8); }
        }
        
        /* Mobile-specific optimizations */
        @media (max-width: 768px) {
          .mobile-tab {
            min-width: 100px;
            max-width: 160px;
          }
        }
        
        /* Touch device optimizations */
        @media (pointer: coarse) {
          .mobile-tab {
            min-height: 48px; /* Larger touch targets */
          }
          
          .mobile-tab button {
            min-height: 36px;
            min-width: 36px;
          }
        }
        
        /* High DPI optimizations */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .mobile-tab {
            border-width: 0.5px;
          }
        }
      `}</style>
      
    </div>
  );
};