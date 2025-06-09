import React, { useState } from 'react';
import { EditorSession } from '../../core/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface FileEditorProps {
  session: EditorSession;
  onSave: (content: string) => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ session, onSave }) => {
  const [content, setContent] = useState(session.content);

  return (
    <div className="flex flex-col h-full">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 font-mono bg-black text-green-300"
      />
      <div className="mt-2">
        <Button size="sm" onClick={() => onSave(content)}>
          Save
        </Button>
      </div>
    </div>
  );
};
