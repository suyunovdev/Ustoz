'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Note {
  id: string;
  timestamp: string;
  content: string;
  videoTime: number;
}

interface NoteTakingProps {
  notes: Note[];
  currentTime: number;
  onAddNote: (content: string) => void;
  onSeek: (time: number) => void;
}

const NoteTaking = ({ notes, currentTime, onAddNote, onSeek }: NoteTakingProps) => {
  const [noteContent, setNoteContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteContent.trim()) {
      onAddNote(noteContent);
      setNoteContent('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-4">Eslatmalar</h3>
        
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Eslatma yozing... (joriy vaqt avtomatik saqlanadi)"
            className="w-full px-4 py-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Vaqt belgisi: {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
            </span>
            <button
              type="submit"
              disabled={!noteContent.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eslatma qo\'shish
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="PencilSquareIcon" size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Hali eslatmalar yo\'q</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 bg-card rounded-md shadow-warm space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSeek(note.videoTime)}
                  className="flex items-center space-x-2 text-primary hover:underline"
                >
                  <Icon name="PlayCircleIcon" size={16} />
                  <span className="text-sm font-data">{note.timestamp}</span>
                </button>
                <button className="p-1 hover:bg-muted rounded transition-smooth">
                  <Icon name="TrashIcon" size={16} className="text-muted-foreground hover:text-error" />
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {notes.length > 0 && (
        <button className="w-full px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-smooth">
          Eslatmalarni eksport qilish
        </button>
      )}
    </div>
  );
};

export default NoteTaking;