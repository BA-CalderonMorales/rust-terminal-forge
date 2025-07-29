import React, { useState } from 'react';
import { Menu, X, FolderOpen, Terminal, Plus } from 'lucide-react';
import { ProfessionalThemeSwitcher } from './ProfessionalThemeSwitcher';
import { ProfessionalTerminalWindow } from './ProfessionalTerminalWindow';

interface Tab {
  id: number;
  name: string;
  path: string;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
}

const mockFileStructure: FileItem[] = [
  {
    name: 'projects',
    type: 'folder',
    path: '~/projects',
    children: [
      { name: 'terminal-ui', type: 'folder', path: '~/projects/terminal-ui' },
      { name: 'rust-server', type: 'folder', path: '~/projects/rust-server' },
      { name: 'README.md', type: 'file', path: '~/projects/README.md' }
    ]
  },
  {
    name: 'Documents',
    type: 'folder', 
    path: '~/Documents',
    children: [
      { name: 'notes.txt', type: 'file', path: '~/Documents/notes.txt' },
      { name: 'scripts', type: 'folder', path: '~/Documents/scripts' }
    ]
  },
  { name: '.bashrc', type: 'file', path: '~/.bashrc' },
  { name: '.vimrc', type: 'file', path: '~/.vimrc' }
];

function FileExplorer({ onClose }: { onClose: () => void }) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['~/projects']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileItem = (item: FileItem, depth = 0) => (
    <div key={item.path}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--theme-surface-hover)] cursor-pointer transition-colors duration-200"
        style={{ paddingLeft: `${12 + depth * 16}px`, color: 'var(--theme-text-secondary)' }}
        onClick={() => item.type === 'folder' ? toggleFolder(item.path) : undefined}
      >
        {item.type === 'folder' ? (
          <>
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {expandedFolders.has(item.path) ? '▼' : '▶'}
            </span>
            <FolderOpen className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
          </>
        ) : (
          <>
            <span className="w-3" />
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'var(--theme-text-muted)' }} />
            </div>
          </>
        )}
        <span>{item.name}</span>
      </div>
      
      {item.type === 'folder' && expandedFolders.has(item.path) && item.children && (
        <div>
          {item.children.map(child => renderFileItem(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        <h2 className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>Explorer</h2>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded hover:bg-[var(--theme-surface-hover)] transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto terminal-scrollbar">
        <div className="py-2">
          {mockFileStructure.map(item => renderFileItem(item))}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ activeSessionsCount }: { activeSessionsCount: number }) {
  return (
    <div 
      className="flex items-center justify-between px-4 py-2 text-xs border-t"
      style={{ 
        backgroundColor: 'var(--theme-surface)', 
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text-muted)'
      }}
    >
      <div className="flex items-center gap-4">
        <span>Terminal Ready</span>
        <span>Sessions: {activeSessionsCount}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Rust Terminal Forge</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-success)' }} />
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}

function EmptyTerminalState({ onCreateTab }: { onCreateTab: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Terminal className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--theme-text-muted)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--theme-text)' }}>No Terminal Sessions</h3>
        <p className="mb-6 max-w-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Get started by creating a new terminal session to run commands and interact with your system.
        </p>
        <button
          onClick={onCreateTab}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          style={{ 
            backgroundColor: 'var(--theme-primary)', 
            color: 'var(--theme-text)' 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-primary)';
          }}
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          New Terminal
        </button>
      </div>
    </div>
  );
}

export function ProfessionalTerminalLayout() {
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
      setTabs([]);
      setActiveTab(null);
      return;
    }

    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

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
    <div className="h-screen flex flex-col overflow-hidden" style={{ 
      backgroundColor: 'var(--theme-background)',
      color: 'var(--theme-text)'
    }}>
      {/* Header */}
      <div className="border-b transition-colors duration-200" style={{ 
        backgroundColor: 'var(--theme-surface)', 
        borderColor: 'var(--theme-border)' 
      }}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded hover:bg-[var(--theme-surface-hover)] transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
              <span className="font-medium hidden sm:block">Terminal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Switcher - Hidden by default, accessible via dropdown */}
            <ProfessionalThemeSwitcher />
            
            {/* New Tab Button in Header - visible when no tabs */}
            {tabs.length === 0 && (
              <button
                onClick={createNewTab}
                className="px-3 py-1.5 h-auto shadow-sm text-white transition-all duration-200 rounded text-sm"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                <Plus className="w-3 h-3 mr-1 inline" />
                <span className="hidden sm:inline">New Terminal</span>
              </button>
            )}
            
            {/* macOS-style window controls */}
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
          {/* Tab Bar */}
          {tabs.length > 0 && (
            <div className="border-b px-2 py-1 transition-colors duration-200" style={{ 
              backgroundColor: 'var(--theme-surface)', 
              borderColor: 'var(--theme-border)' 
            }}>
              <div className="flex items-center gap-1 overflow-x-auto terminal-scrollbar pb-1">
                <div className="flex items-center gap-1 min-w-max">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`group relative flex items-center gap-2 px-4 py-2 rounded-md font-medium whitespace-nowrap transition-all duration-200`}
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
                        <span className="truncate max-w-32 sm:max-w-none">{tab.name}</span>
                      </button>
                      
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                          activeTab === tab.id
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ 
                          color: 'var(--theme-text-muted)',
                          backgroundColor: 'var(--theme-surface-hover)' 
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--theme-error)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--theme-text-muted)';
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Tab Button */}
                <div className="flex-shrink-0 ml-2">
                  <button
                    onClick={createNewTab}
                    className="border transition-all duration-200 hover:shadow-md px-3 py-2 rounded text-sm"
                    style={{
                      color: 'var(--theme-text-muted)',
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--theme-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1 inline" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Window or Empty State */}
          <div className="flex-1 overflow-hidden">
            {tabs.length === 0 ? (
              <EmptyTerminalState onCreateTab={createNewTab} />
            ) : activeTabData ? (
              <ProfessionalTerminalWindow 
                tabName={activeTabData.name}
                path={activeTabData.path}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar activeSessionsCount={tabs.length} />
      
      <style>{`
        .terminal-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-track {
          background: var(--theme-surface);
        }
        
        .terminal-scrollbar::-webkit-scrollbar-thumb {
          background: var(--theme-border);
          border-radius: 2px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--theme-text-muted);
        }
      `}</style>
    </div>
  );
}