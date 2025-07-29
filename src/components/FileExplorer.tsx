import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, File, X } from 'lucide-react';
import { Button } from './ui/button';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
}

const mockFileSystem: FileNode[] = [
  {
    name: 'projects',
    type: 'folder',
    expanded: true,
    children: [
      {
        name: 'terminal-ui',
        type: 'folder',
        expanded: true,
        children: [
          { name: 'src', type: 'folder', children: [
            { name: 'components', type: 'folder', children: [
              { name: 'Terminal.tsx', type: 'file' },
              { name: 'FileExplorer.tsx', type: 'file' },
              { name: 'StatusBar.tsx', type: 'file' }
            ]},
            { name: 'hooks', type: 'folder', children: [
              { name: 'useTerminal.ts', type: 'file' }
            ]},
            { name: 'App.tsx', type: 'file' },
            { name: 'index.tsx', type: 'file' }
          ]},
          { name: 'public', type: 'folder', children: [
            { name: 'index.html', type: 'file' },
            { name: 'favicon.ico', type: 'file' }
          ]},
          { name: 'package.json', type: 'file' },
          { name: 'README.md', type: 'file' },
          { name: 'tsconfig.json', type: 'file' }
        ]
      },
      {
        name: 'notes',
        type: 'folder',
        children: [
          { name: 'meeting-notes.md', type: 'file' },
          { name: 'ideas.txt', type: 'file' }
        ]
      }
    ]
  },
  {
    name: 'Documents',
    type: 'folder',
    children: [
      { name: 'resume.pdf', type: 'file' },
      { name: 'presentation.pptx', type: 'file' }
    ]
  },
  {
    name: 'Desktop',
    type: 'folder',
    children: [
      { name: 'screenshot.png', type: 'file' },
      { name: 'todo.txt', type: 'file' }
    ]
  }
];

interface FileExplorerProps {
  onClose: () => void;
}

export function FileExplorer({ onClose }: FileExplorerProps) {
  const [fileSystem, setFileSystem] = useState<FileNode[]>(mockFileSystem);

  const toggleFolder = (path: number[]) => {
    setFileSystem(prev => {
      const newFileSystem = [...prev];
      let current: FileNode[] = newFileSystem;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children!;
      }
      
      const targetNode = current[path[path.length - 1]];
      if (targetNode.type === 'folder') {
        targetNode.expanded = !targetNode.expanded;
      }
      
      return newFileSystem;
    });
  };

  const renderFileNode = (node: FileNode, depth: number, path: number[]) => {
    const isFolder = node.type === 'folder';
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.name}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-[var(--theme-surface-hover)] cursor-pointer text-sm transition-colors`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => isFolder && toggleFolder(path)}
        >
          {isFolder ? (
            <>
              {hasChildren && (
                node.expanded ? 
                  <ChevronDown className="w-3 h-3 text-[var(--theme-text-muted)] flex-shrink-0" /> :
                  <ChevronRight className="w-3 h-3 text-[var(--theme-text-muted)] flex-shrink-0" />
              )}
              {node.expanded ? 
                <FolderOpen className="w-4 h-4 text-[var(--theme-accent)] flex-shrink-0" /> :
                <Folder className="w-4 h-4 text-[var(--theme-accent)] flex-shrink-0" />
              }
            </>
          ) : (
            <File className="w-4 h-4 text-[var(--theme-text-muted)] flex-shrink-0 ml-3" />
          )}
          <span className="text-[var(--theme-text-secondary)] truncate">{node.name}</span>
        </div>
        
        {isFolder && node.expanded && node.children && (
          <div>
            {node.children.map((child, index) => 
              renderFileNode(child, depth + 1, [...path, index])
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between transition-colors" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
          <span className="font-medium text-sm text-[var(--theme-text)]">Explorer</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)] p-1 transition-colors"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 terminal-scrollbar">
        {fileSystem.map((node, index) => 
          renderFileNode(node, 0, [index])
        )}
      </div>
    </div>
  );
}