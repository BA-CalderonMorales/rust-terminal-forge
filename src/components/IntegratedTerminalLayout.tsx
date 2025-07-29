/**
 * Integrated Terminal Layout - Professional Design with Existing Functionality
 * Combines mockup layout with real terminal components while preserving socket communication
 */

import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, FolderOpen, Terminal, Plus } from 'lucide-react';
import { RealTerminal } from './RealTerminal';
import { ProfessionalThemeSwitcher } from './ProfessionalThemeSwitcher';
import { useProfessionalTheme } from './ProfessionalThemeProvider';
import { Button } from './ui/button';

interface TerminalTab {
  id: number;
  name: string;
  path: string;
  isActive: boolean;
}

interface IntegratedTerminalLayoutProps {
  className?: string;
}

export const IntegratedTerminalLayout: React.FC<IntegratedTerminalLayoutProps> = ({ 
  className = '' 
}) => {
  const { currentTheme } = useProfessionalTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number | null>(0);
  const [nextTabId, setNextTabId] = useState(3);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 0, name: 'main', path: '~/projects/rust-terminal-forge', isActive: true },
    { id: 1, name: 'logs', path: '~/var/log', isActive: false },
    { id: 2, name: 'dev', path: '~/dev/server', isActive: false }
  ]);

  // Mobile-friendly touch handling
  const [touchStartX, setTouchStartX] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const createNewTab = () => {
    const newTab: TerminalTab = {
      id: nextTabId,
      name: `terminal-${nextTabId}`,
      path: '~/projects',
      isActive: false
    };
    
    // Set all tabs to inactive
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: false })));
    
    // Add new tab and make it active
    setTabs(prev => [...prev, { ...newTab, isActive: true }]);
    setActiveTab(newTab.id);
    setNextTabId(prev => prev + 1);
  };

  const closeTab = (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tabs.length === 1) {
      // If this is the last tab, just clear the active state
      setTabs([]);
      setActiveTab(null);
      return;
    }

    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    // If we're closing the active tab, switch to another tab
    if (activeTab === tabId && newTabs.length > 0) {
      const nextActiveTab = tabIndex > 0 ? newTabs[tabIndex - 1] : newTabs[0];
      setActiveTab(nextActiveTab.id);
      setTabs(prev => prev.map(tab => 
        tab.id === nextActiveTab.id 
          ? { ...tab, isActive: true }
          : { ...tab, isActive: false }
      ));
    }
  };

  const switchTab = (tabId: number) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, isActive: true }
        : { ...tab, isActive: false }
    ));
    setActiveTab(tabId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchStartX - touchX;
    
    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - close sidebar
        setSidebarOpen(false);
      } else {
        // Swipe right - open sidebar
        setSidebarOpen(true);
      }
      setTouchStartX(0);
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Professional empty state when no tabs
  const EmptyTerminalState = () => (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center border-2"
        style={{ 
          borderColor: currentTheme.colors.border,
          backgroundColor: currentTheme.colors.surface 
        }}
      >
        <Terminal className="w-8 h-8" style={{ color: currentTheme.colors.primary }} />
      </div>
      
      <div className="space-y-2">
        <h3 
          className="text-lg font-semibold"
          style={{ color: currentTheme.colors.text }}
        >
          No Terminal Sessions
        </h3>
        <p 
          className="text-sm max-w-md"
          style={{ color: currentTheme.colors.textMuted }}
        >
          Create a new terminal session to get started with your development workflow.
        </p>
      </div>
      
      <Button
        onClick={createNewTab}
        className="px-6 py-2 rounded-md font-medium transition-all duration-200"
        style={{
          backgroundColor: currentTheme.colors.primary,
          color: currentTheme.colors.background,
          border: 'none'
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        New Terminal
      </Button>
    </div>
  );

  return (
    <div 
      className={`h-screen flex flex-col overflow-hidden ${className}`}
      style={{ backgroundColor: currentTheme.colors.background }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Professional Header */}
      <div 
        className="border-b transition-colors duration-200 flex-shrink-0"
        style={{ 
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between min-h-[56px]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden transition-colors p-2"
              style={{ 
                color: currentTheme.colors.textMuted,
                backgroundColor: 'transparent'
              }}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
              <span 
                className="font-semibold hidden sm:block"
                style={{ color: currentTheme.colors.text }}
              >
                Rust Terminal Forge
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ProfessionalThemeSwitcher />
            
            {/* Window Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#fbbf24' }}
              />
              <button
                className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#10b981' }}
              />
              <button
                className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#ef4444' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div 
          ref={sidebarRef}
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative z-30 w-80 lg:w-64 h-full border-r transition-all duration-300 ease-in-out`}
          style={{ 
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border
          }}
        >
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: currentTheme.colors.border }}>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
              <span className="font-medium text-sm" style={{ color: currentTheme.colors.text }}>Explorer</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 transition-colors"
              style={{ color: currentTheme.colors.textMuted }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          {/* File Explorer Integration */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {/* Quick Access */}
              <div>
                <h4 className="text-xs font-medium mb-2" style={{ color: currentTheme.colors.textMuted }}>
                  QUICK ACCESS
                </h4>
                <div className="space-y-1">
                  <button 
                    className="w-full text-left px-2 py-1 rounded text-sm transition-colors"
                    style={{ color: currentTheme.colors.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ~/projects/rust-terminal-forge
                  </button>
                  <button 
                    className="w-full text-left px-2 py-1 rounded text-sm transition-colors"
                    style={{ color: currentTheme.colors.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ~/dev/workspace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Bar */}
          {tabs.length > 0 && (
            <div 
              className="border-b px-2 py-1 transition-colors duration-200 flex-shrink-0"
              style={{ 
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border
              }}
            >
              <div className="flex items-center gap-1 overflow-x-auto">
                <div className="flex items-center gap-1 min-w-max flex-1">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className="group relative flex items-center gap-2 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-all duration-200 min-w-0"
                      style={{
                        backgroundColor: tab.isActive ? currentTheme.colors.surfaceHover : 'transparent',
                        color: tab.isActive ? currentTheme.colors.text : currentTheme.colors.textMuted
                      }}
                    >
                      <button
                        onClick={() => switchTab(tab.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-sm"
                      >
                        <Terminal className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-24 sm:max-w-none">{tab.name}</span>
                      </button>
                      
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                          tab.isActive
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ 
                          color: currentTheme.colors.textMuted,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = currentTheme.colors.error;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = currentTheme.colors.textMuted;
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Tab Button */}
                <div className="flex-shrink-0 ml-2">
                  <Button
                    onClick={createNewTab}
                    variant="ghost"
                    size="sm"
                    className="border transition-all duration-200 p-2"
                    style={{
                      color: currentTheme.colors.textMuted,
                      borderColor: currentTheme.colors.border,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Content */}
          <div className="flex-1 overflow-hidden">
            {tabs.length === 0 ? (
              <EmptyTerminalState />
            ) : activeTabData ? (
              <div className="h-full" style={{ backgroundColor: currentTheme.colors.terminal }}>
                <RealTerminal className="h-full" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Status Bar Integration */}
      <div 
        className="border-t flex-shrink-0"
        style={{ 
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border
        }}
      >
        <div className="px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span style={{ color: currentTheme.colors.textMuted }}>
              Sessions: {tabs.length}
            </span>
            <span style={{ color: currentTheme.colors.textMuted }}>
              Active: {activeTabData?.name || 'None'}
            </span>
            {activeTabData && (
              <span style={{ color: currentTheme.colors.textSecondary }}>
                {activeTabData.path}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span style={{ color: currentTheme.colors.primary }}>
              {currentTheme.name}
            </span>
            <span style={{ color: currentTheme.colors.textMuted }}>
              Rust Terminal Forge
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedTerminalLayout;