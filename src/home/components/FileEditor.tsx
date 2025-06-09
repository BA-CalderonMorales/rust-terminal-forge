import React from 'react';
import { EditorSession } from '../viewModel';
import { Button } from '@/components/ui/button';

interface FileEditorProps {
  session: EditorSession;
  onChange: (content: string) => void;
  onSave: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ session, onChange, onSave }) => {
  return (
    <div className="file-editor flex flex-col h-full">
      <textarea
        className="flex-1 bg-black text-green-400 font-mono p-2"
        value={session.content}
        onChange={e => onChange(e.target.value)}
      />
      <Button onClick={onSave} className="self-end m-2" size="sm">
        Save
      </Button>
    </div>
  );
};
