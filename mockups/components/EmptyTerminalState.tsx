import React from 'react';
import { Terminal, Plus, Code, FolderOpen } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyTerminalStateProps {
  onCreateTab: () => void;
}

export function EmptyTerminalState({ onCreateTab }: EmptyTerminalStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-8">
      <div className="max-w-md text-center space-y-6">
        {/* Icon and Title */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
            <Terminal className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">No Terminal Sessions</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Create your first terminal session to start running commands and exploring your workspace.
            </p>
          </div>
        </div>

        {/* Primary Action */}
        <Button
          onClick={onCreateTab}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Terminal
        </Button>

        {/* Secondary Actions */}
        <div className="pt-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Quick Actions</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <Code className="w-3 h-3 mr-2" />
              Open Project
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <FolderOpen className="w-3 h-3 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="pt-6 text-xs text-slate-500 space-y-1">
          <p>💡 Tip: Use Ctrl+Shift+T to quickly create new tabs</p>
          <p>🔧 Use the file explorer to navigate your workspace</p>
        </div>
      </div>
    </div>
  );
}