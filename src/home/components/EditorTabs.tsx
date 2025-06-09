import React from 'react';
import { EditorSession } from '../viewModel';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EditorTabsProps {
  sessions: EditorSession[];
  activeId: string;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ sessions, activeId, onSwitch, onClose }) => {
  if (sessions.length === 0) return null;

  return (
    <div className="editor-tabs flex border-b border-green-600">
      {sessions.map(s => (
        <div
          key={s.id}
          className={`flex items-center px-3 py-2 font-mono text-sm cursor-pointer ${
            s.id === activeId ? 'bg-green-900/30 text-green-300' : 'bg-gray-800 text-green-500'
          }`}
          onClick={() => onSwitch(s.id)}
        >
          {s.fileName}
          <Button
            onClick={e => {
              e.stopPropagation();
              onClose(s.id);
            }}
            variant="ghost"
            size="icon"
            className="ml-2 h-4 w-4 text-red-400 hover:text-red-300"
            aria-label="Close editor"
          >
            <X size={12} />
          </Button>
        </div>
      ))}
    </div>
  );
};
