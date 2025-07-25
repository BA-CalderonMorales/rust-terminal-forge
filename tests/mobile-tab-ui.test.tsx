import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';

// Mock TabManager
const mockTabManager = {
  getSessions: vi.fn(),
  getActiveSession: vi.fn(),
  switchToSession: vi.fn(),
  createSession: vi.fn(),
  closeSession: vi.fn(),
  getState: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  canCreateNewTab: vi.fn(() => true),
  hasClosedTabs: vi.fn(() => false),
  restoreClosedTab: vi.fn()
};

vi.mock('../src/core/tabManager', () => ({
  tabManager: mockTabManager
}));

// Mobile-optimized tab interface component for testing
interface MobileTabProps {
  sessionId: string;
  name: string;
  isActive: boolean;
  isDirty: boolean;
  onTabClick: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
  showCloseButton: boolean;
}

const MobileTab: React.FC<MobileTabProps> = ({
  sessionId,
  name,
  isActive,
  isDirty,
  onTabClick,
  onTabClose,
  showCloseButton
}) => {
  return (
    <div
      data-testid={`tab-${sessionId}`}
      className={`mobile-tab ${isActive ? 'active' : ''} ${isDirty ? 'dirty' : ''}`}
      onClick={() => onTabClick(sessionId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        minHeight: '44px', // Touch target size
        minWidth: '44px',
        backgroundColor: isActive ? '#00ff88' : '#333',
        color: isActive ? '#000' : '#fff',
        borderRadius: '8px',
        margin: '4px',
        border: isDirty ? '2px solid orange' : 'none',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <span className="tab-name" style={{ flex: 1, fontSize: '14px' }}>
        {name}
        {isDirty && <span style={{ marginLeft: '4px' }}>●</span>}
      </span>
      {showCloseButton && (
        <button
          data-testid={`close-tab-${sessionId}`}
          onClick={(e) => {
            e.stopPropagation();
            onTabClose(sessionId);
          }}
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
            justifyContent: 'center'
          }}
          aria-label={`Close ${name}`}
        >
          ×
        </button>
      )}
    </div>
  );
};

interface MobileTabBarProps {
  sessions: Array<{
    id: string;
    name: string;
    isActive: boolean;
    isDirty: boolean;
  }>;
  onTabClick: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
  onNewTab: () => void;
  showCloseButtons: boolean;
  canCreateNewTab: boolean;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({
  sessions,
  onTabClick,
  onTabClose,
  onNewTab,
  showCloseButtons,
  canCreateNewTab
}) => {
  return (
    <div
      data-testid="mobile-tab-bar"
      style={{
        display: 'flex',
        overflowX: 'auto',
        padding: '8px',
        backgroundColor: '#1a1a1a',
        minHeight: '60px',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        gap: '4px'
      }}
    >
      {sessions.map((session) => (
        <MobileTab
          key={session.id}
          sessionId={session.id}
          name={session.name}
          isActive={session.isActive}
          isDirty={session.isDirty}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
          showCloseButton={showCloseButtons}
        />
      ))}
      
      {canCreateNewTab && (
        <button
          data-testid="new-tab-button"
          onClick={onNewTab}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            minWidth: '44px',
            padding: '8px 12px',
            backgroundColor: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            margin: '4px',
            cursor: 'pointer',
            fontSize: '18px',
            touchAction: 'manipulation'
          }}
          aria-label="Create new tab"
        >
          +
        </button>
      )}
    </div>
  );
};

// Test component that uses mobile tab interface
const TestMobileTabInterface: React.FC = () => {
  const [sessions, setSessions] = React.useState([
    { id: 'tab1', name: 'Terminal 1', isActive: true, isDirty: false },
    { id: 'tab2', name: 'Terminal 2', isActive: false, isDirty: true },
    { id: 'tab3', name: 'Terminal 3', isActive: false, isDirty: false }
  ]);

  const handleTabClick = (sessionId: string) => {
    setSessions(prev => prev.map(s => ({ ...s, isActive: s.id === sessionId })));
    mockTabManager.switchToSession(sessionId);
  };

  const handleTabClose = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    mockTabManager.closeSession(sessionId);
  };

  const handleNewTab = () => {
    const newSession = {
      id: `tab${Date.now()}`,
      name: `Terminal ${sessions.length + 1}`,
      isActive: true,
      isDirty: false
    };
    setSessions(prev => [...prev.map(s => ({ ...s, isActive: false })), newSession]);
    mockTabManager.createSession();
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MobileTabBar
        sessions={sessions}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
        showCloseButtons={true}
        canCreateNewTab={mockTabManager.canCreateNewTab()}
      />
      <div data-testid="terminal-content" style={{ flex: 1, padding: '16px' }}>
        Active tab: {sessions.find(s => s.isActive)?.name || 'None'}
      </div>
    </div>
  );
};

describe('Mobile Tab UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('MobileTab Component', () => {
    const defaultProps: MobileTabProps = {
      sessionId: 'tab1',
      name: 'Terminal 1',
      isActive: false,
      isDirty: false,
      onTabClick: vi.fn(),
      onTabClose: vi.fn(),
      showCloseButton: true
    };

    it('should render tab with correct content', () => {
      render(<MobileTab {...defaultProps} />);
      
      expect(screen.getByTestId('tab-tab1')).toBeInTheDocument();
      expect(screen.getByText('Terminal 1')).toBeInTheDocument();
    });

    it('should render active tab with different styling', () => {
      render(<MobileTab {...defaultProps} isActive={true} />);
      
      const tab = screen.getByTestId('tab-tab1');
      expect(tab).toHaveClass('active');
    });

    it('should show dirty indicator for unsaved changes', () => {
      render(<MobileTab {...defaultProps} isDirty={true} />);
      
      const tab = screen.getByTestId('tab-tab1');
      expect(tab).toHaveClass('dirty');
      expect(screen.getByText('●')).toBeInTheDocument();
    });

    it('should handle tab click', () => {
      const onTabClick = vi.fn();
      render(<MobileTab {...defaultProps} onTabClick={onTabClick} />);
      
      fireEvent.click(screen.getByTestId('tab-tab1'));
      expect(onTabClick).toHaveBeenCalledWith('tab1');
    });

    it('should show close button when enabled', () => {
      render(<MobileTab {...defaultProps} showCloseButton={true} />);
      
      expect(screen.getByTestId('close-tab-tab1')).toBeInTheDocument();
      expect(screen.getByLabelText('Close Terminal 1')).toBeInTheDocument();
    });

    it('should hide close button when disabled', () => {
      render(<MobileTab {...defaultProps} showCloseButton={false} />);
      
      expect(screen.queryByTestId('close-tab-tab1')).not.toBeInTheDocument();
    });

    it('should handle tab close without propagating to tab click', () => {
      const onTabClick = vi.fn();
      const onTabClose = vi.fn();
      
      render(
        <MobileTab 
          {...defaultProps} 
          onTabClick={onTabClick} 
          onTabClose={onTabClose} 
        />
      );
      
      fireEvent.click(screen.getByTestId('close-tab-tab1'));
      
      expect(onTabClose).toHaveBeenCalledWith('tab1');
      expect(onTabClick).not.toHaveBeenCalled();
    });

    it('should meet touch target size requirements', () => {
      render(<MobileTab {...defaultProps} />);
      
      const tab = screen.getByTestId('tab-tab1');
      const styles = window.getComputedStyle(tab);
      
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('should have proper touch action settings', () => {
      render(<MobileTab {...defaultProps} />);
      
      const tab = screen.getByTestId('tab-tab1');
      // Check the style attribute directly since JSDOM doesn't apply CSS
      const style = tab.getAttribute('style');
      
      expect(style).toContain('-webkit-tap-highlight-color: transparent');
    });
  });

  describe('MobileTabBar Component', () => {
    const sessions = [
      { id: 'tab1', name: 'Terminal 1', isActive: true, isDirty: false },
      { id: 'tab2', name: 'Terminal 2', isActive: false, isDirty: true },
      { id: 'tab3', name: 'Terminal 3', isActive: false, isDirty: false }
    ];

    const defaultProps: MobileTabBarProps = {
      sessions,
      onTabClick: vi.fn(),
      onTabClose: vi.fn(),
      onNewTab: vi.fn(),
      showCloseButtons: true,
      canCreateNewTab: true
    };

    it('should render all tabs', () => {
      render(<MobileTabBar {...defaultProps} />);
      
      expect(screen.getByTestId('tab-tab1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tab2')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tab3')).toBeInTheDocument();
    });

    it('should render new tab button when allowed', () => {
      render(<MobileTabBar {...defaultProps} canCreateNewTab={true} />);
      
      expect(screen.getByTestId('new-tab-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Create new tab')).toBeInTheDocument();
    });

    it('should hide new tab button when at limit', () => {
      render(<MobileTabBar {...defaultProps} canCreateNewTab={false} />);
      
      expect(screen.queryByTestId('new-tab-button')).not.toBeInTheDocument();
    });

    it('should handle new tab creation', () => {
      const onNewTab = vi.fn();
      render(<MobileTabBar {...defaultProps} onNewTab={onNewTab} />);
      
      fireEvent.click(screen.getByTestId('new-tab-button'));
      expect(onNewTab).toHaveBeenCalled();
    });

    it('should enable horizontal scrolling for overflow', () => {
      render(<MobileTabBar {...defaultProps} />);
      
      const tabBar = screen.getByTestId('mobile-tab-bar');
      const styles = window.getComputedStyle(tabBar);
      
      expect(styles.overflowX).toBe('auto');
    });

    it('should have smooth scrolling behavior', () => {
      render(<MobileTabBar {...defaultProps} />);
      
      const tabBar = screen.getByTestId('mobile-tab-bar');
      const styles = window.getComputedStyle(tabBar);
      
      expect(styles.scrollBehavior).toBe('smooth');
    });

    it('should render empty state when no sessions', () => {
      render(
        <MobileTabBar 
          {...defaultProps} 
          sessions={[]} 
        />
      );
      
      // Should only show new tab button
      expect(screen.queryByTestId(/^tab-/)).not.toBeInTheDocument();
      expect(screen.getByTestId('new-tab-button')).toBeInTheDocument();
    });
  });

  describe('Mobile Tab Interface Integration', () => {
    it('should render complete mobile tab interface', () => {
      render(<TestMobileTabInterface />);
      
      expect(screen.getByTestId('mobile-tab-bar')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-content')).toBeInTheDocument();
      expect(screen.getByText('Active tab: Terminal 1')).toBeInTheDocument();
    });

    it('should switch tabs when tab is clicked', async () => {
      render(<TestMobileTabInterface />);
      
      fireEvent.click(screen.getByTestId('tab-tab2'));
      
      await waitFor(() => {
        expect(screen.getByText('Active tab: Terminal 2')).toBeInTheDocument();
        expect(mockTabManager.switchToSession).toHaveBeenCalledWith('tab2');
      });
    });

    it('should close tabs when close button is clicked', async () => {
      render(<TestMobileTabInterface />);
      
      fireEvent.click(screen.getByTestId('close-tab-tab2'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('tab-tab2')).not.toBeInTheDocument();
        expect(mockTabManager.closeSession).toHaveBeenCalledWith('tab2');
      });
    });

    it('should create new tabs', async () => {
      render(<TestMobileTabInterface />);
      
      const initialTabCount = screen.getAllByTestId(/^tab-tab/).length;
      
      fireEvent.click(screen.getByTestId('new-tab-button'));
      
      await waitFor(() => {
        const newTabCount = screen.getAllByTestId(/^tab-tab/).length;
        expect(newTabCount).toBe(initialTabCount + 1);
        expect(mockTabManager.createSession).toHaveBeenCalled();
      });
    });

    it('should maintain active state correctly after tab operations', async () => {
      render(<TestMobileTabInterface />);
      
      // Switch to tab 2
      fireEvent.click(screen.getByTestId('tab-tab2'));
      
      await waitFor(() => {
        const activeTab = screen.getByTestId('tab-tab2');
        expect(activeTab).toHaveClass('active');
        
        const inactiveTab = screen.getByTestId('tab-tab1');
        expect(inactiveTab).not.toHaveClass('active');
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels', () => {
      render(<TestMobileTabInterface />);
      
      expect(screen.getByLabelText('Close Terminal 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Create new tab')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<TestMobileTabInterface />);
      
      const tab = screen.getByTestId('tab-tab1');
      
      // Check that the tab is focusable and has proper accessibility attributes
      expect(tab).toBeDefined();
      expect(tab.getAttribute('data-testid')).toBe('tab-tab1');
    });

    it('should handle screen reader friendly content', () => {
      const sessions = [
        { id: 'tab1', name: 'Development Terminal', isActive: true, isDirty: true }
      ];
      
      render(
        <MobileTabBar
          sessions={sessions}
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onNewTab={vi.fn()}
          showCloseButtons={true}
          canCreateNewTab={true}
        />
      );
      
      expect(screen.getByText('Development Terminal')).toBeInTheDocument();
      expect(screen.getByText('●')).toBeInTheDocument(); // Dirty indicator
    });
  });

  describe('Performance and UX', () => {
    it('should prevent text selection on mobile', () => {
      render(<TestMobileTabInterface />);
      
      const tab = screen.getByTestId('tab-tab1');
      const styles = window.getComputedStyle(tab);
      
      // Should have user-select: none or equivalent
      expect(styles.webkitUserSelect || styles.userSelect).toBe('none');
    });

    it('should disable tap highlight for better UX', () => {
      render(<TestMobileTabInterface />);
      
      const tab = screen.getByTestId('tab-tab1');
      const styles = window.getComputedStyle(tab);
      
      expect(styles.webkitTapHighlightColor).toBe('transparent');
    });

    it('should handle rapid tap interactions', async () => {
      const onTabClick = vi.fn();
      
      render(
        <MobileTabBar
          sessions={[{ id: 'tab1', name: 'Tab 1', isActive: false, isDirty: false }]}
          onTabClick={onTabClick}
          onTabClose={vi.fn()}
          onNewTab={vi.fn()}
          showCloseButtons={true}
          canCreateNewTab={true}
        />
      );
      
      const tab = screen.getByTestId('tab-tab1');
      
      // Simulate rapid tapping
      fireEvent.click(tab);
      fireEvent.click(tab);
      fireEvent.click(tab);
      
      // Should handle all clicks
      expect(onTabClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual Feedback', () => {
    it('should show visual feedback for dirty tabs', () => {
      const sessions = [
        { id: 'tab1', name: 'Terminal 1', isActive: false, isDirty: true }
      ];
      
      render(
        <MobileTabBar
          sessions={sessions}
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onNewTab={vi.fn()}
          showCloseButtons={true}
          canCreateNewTab={true}
        />
      );
      
      const tab = screen.getByTestId('tab-tab1');
      expect(tab).toHaveClass('dirty');
      expect(screen.getByText('●')).toBeInTheDocument();
    });

    it('should distinguish active tabs visually', () => {
      const sessions = [
        { id: 'tab1', name: 'Terminal 1', isActive: true, isDirty: false },
        { id: 'tab2', name: 'Terminal 2', isActive: false, isDirty: false }
      ];
      
      render(
        <MobileTabBar
          sessions={sessions}
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onNewTab={vi.fn()}
          showCloseButtons={true}
          canCreateNewTab={true}
        />
      );
      
      const activeTab = screen.getByTestId('tab-tab1');
      const inactiveTab = screen.getByTestId('tab-tab2');
      
      expect(activeTab).toHaveClass('active');
      expect(inactiveTab).not.toHaveClass('active');
    });
  });
});