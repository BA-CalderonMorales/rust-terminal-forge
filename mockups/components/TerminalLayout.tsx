import React, { useState } from 'react';
import { Menu, X, FolderOpen, Terminal, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { FileExplorer } from './FileExplorer';
import { TerminalWindow } from './TerminalWindow';
import { StatusBar } from './StatusBar';
import { EmptyTerminalState } from './EmptyTerminalState';
import { ThemeSwitcher } from './ThemeSwitcher';

interface Tab {
  id: number;
  name: string;
  path: string;
}

export function TerminalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number | null>(0);
  const [nextTabId, setNextTabId] = useState(3);
  
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 0, name: 'bash', path: '~/projects/terminal-ui' },
    { id: 1, name: 'logs', path: '~/var/log' },
    { id: 2, name: 'server', path: '~/dev/server' }
  ]);

  const createNewTab = () => {
    const newTab: Tab = {
      id: nextTabId,
      name: `bash-${nextTabId}`,
      path: '~/projects'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    setNextTabId(prev => prev + 1);
  };

  const closeTab = (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tabs.length === 1) {
      // If this is the last tab, clear everything
      setTabs([]);
      setActiveTab(null);
      return;
    }

    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    // If we're closing the active tab, switch to another tab
    if (activeTab === tabId) {
      if (tabIndex > 0) {
        setActiveTab(newTabs[tabIndex - 1].id);
      } else {
        setActiveTab(newTabs[0].id);
      }
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="h-screen text-[var(--theme-text)] flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Header */}
      <div className="border-b transition-colors duration-200" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors"
              style={{ '--tw-bg-opacity': '0.1' } as React.CSSProperties}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
              <span className="font-medium hidden sm:block">Terminal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
            {/* New Tab Button in Header - visible when no tabs */}
            {tabs.length === 0 && (
              <Button
                onClick={createNewTab}
                size="sm"
                className="px-3 py-1.5 h-auto shadow-sm text-white transition-all duration-200"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                <Plus className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline text-xs">New Terminal</span>
              </Button>
            )}
            
            <div className="hidden sm:flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-30 w-80 lg:w-64 h-full border-r transition-all duration-300 ease-in-out`}
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <FileExplorer onClose={() => setSidebarOpen(false)} />
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
          {/* Tab Bar - Enhanced for mobile with full names and horizontal scrolling */}
          {tabs.length > 0 && (
            <div className="border-b px-2 py-1 transition-colors duration-200" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-1 overflow-x-auto terminal-scrollbar pb-1">
                <div className="flex items-center gap-1 min-w-max">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`group relative flex items-center gap-2 px-4 py-2 rounded-md font-medium whitespace-nowrap transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'shadow-sm'
                          : 'hover:bg-opacity-50'
                      }`}
                      style={{
                        backgroundColor: activeTab === tab.id ? 'var(--theme-surface-hover)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--theme-text)' : 'var(--theme-text-muted)'
                      }}
                    >
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-sm"
                      >
                        <Terminal className="w-3 h-3 flex-shrink-0" />
                        {/* Show full name on mobile and desktop */}
                        <span className="truncate max-w-32 sm:max-w-none">{tab.name}</span>
                      </button>
                      
                      {/* Close button - more prominent */}
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                          activeTab === tab.id
                            ? 'text-[var(--theme-text-muted)] hover:text-[var(--theme-error)]'
                            : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-error)] opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ backgroundColor: 'var(--theme-surface-hover)' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Tab Button - More Prominent */}
                <div className="flex-shrink-0 ml-2">
                  <Button
                    onClick={createNewTab}
                    variant="ghost"
                    size="sm"
                    className="border transition-all duration-200 hover:shadow-md"
                    style={{
                      color: 'var(--theme-text-muted)',
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline text-xs">New</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Window or Empty State */}
          <div className="flex-1 overflow-hidden">
            {tabs.length === 0 ? (
              <EmptyTerminalState onCreateTab={createNewTab} />
            ) : activeTabData ? (
              <TerminalWindow 
                tabName={activeTabData.name}
                path={activeTabData.path}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar activeSessionsCount={tabs.length} />
    </div>
  );
}