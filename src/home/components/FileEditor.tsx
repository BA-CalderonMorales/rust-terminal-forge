import React, { useState } from 'react';
import { EditorSession } from '@/core/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface FileEditorProps {
  editor: EditorSession;
  onSave: (id: string, content: string) => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ editor, onSave }) => {
  const isMobile = useIsMobile();
  const [content, setContent] = useState(editor.content);
  const [mode, setMode] = useState<'insert' | 'normal'>('insert');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMobile) return;
    if (mode === 'normal') {
      if (e.key === 'i') {
        setMode('insert');
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Escape') {
      setMode('normal');
      e.preventDefault();
    }
  };

  return (
    <div className="editor-container flex flex-col h-full">
      <textarea
        className="flex-1 bg-black text-green-300 font-mono p-2 outline-none resize-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="p-2 bg-gray-800 text-green-400 font-mono text-xs flex justify-between">
        <span>{mode === 'insert' ? '-- INSERT --' : ''}</span>
        <button onClick={() => onSave(editor.id, content)} className="hover:underline">
          Save
        </button>
      </div>
    </div>
  );
};
