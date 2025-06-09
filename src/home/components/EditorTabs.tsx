import React from 'react';
import { EditorSession } from '@/core/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface EditorTabsProps {
  editors: EditorSession[];
  activeEditorId: string;
  onSwitchEditor: (id: string) => void;
  onCloseEditor: (id: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  editors,
  activeEditorId,
  onSwitchEditor,
  onCloseEditor
}) => {
  if (editors.length === 0) return null;

  return (
    <div className="editor-tabs border-b border-green-600">
      <ScrollArea className="w-full">
        <div className="flex items-center min-w-max">
          {editors.map((editor) => (
            <div
              key={editor.id}
              className={`flex items-center border-r border-green-600 ${
                editor.id === activeEditorId
                  ? 'bg-green-900/30 text-green-300'
                  : 'bg-gray-800 text-green-500 hover:bg-gray-700'
              }`}
            >
              <button
                onClick={() => onSwitchEditor(editor.id)}
                className="px-3 py-2 font-mono text-sm transition-colors min-h-[48px] flex items-center whitespace-nowrap"
              >
                {editor.fileName}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseEditor(editor.id);
                }}
                className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors min-h-[48px] flex items-center"
                aria-label="Close editor"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
