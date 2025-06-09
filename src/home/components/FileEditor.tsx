import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FileEditorProps {
  open: boolean;
  fileName: string;
  initialContent: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ open, fileName, initialContent, onSave, onClose }) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editing {fileName}</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full h-80 bg-black text-green-400 font-mono p-2 border border-green-700 outline-none"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
