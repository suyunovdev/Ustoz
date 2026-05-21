'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Topic {
  id: string;
  order: number;
  title: string;
  duration: string;
  hasQuiz: boolean;
  isExpanded: boolean;
}

interface CourseOutlinePanelProps {
  topics: Topic[];
  onTopicSelect: (topicId: string) => void;
  onTopicReorder: (topics: Topic[]) => void;
  onAddTopic: () => void;
  onTopicTitleChange: (topicId: string, newTitle: string) => void;
  onDeleteTopic: (topicId: string) => void;
  selectedTopicId: string | null;
}

const CourseOutlinePanel = ({
  topics,
  onTopicSelect,
  onTopicReorder,
  onAddTopic,
  onTopicTitleChange,
  onDeleteTopic,
  selectedTopicId
}: CourseOutlinePanelProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTopics = [...topics];
    const draggedTopic = newTopics[draggedIndex];
    newTopics.splice(draggedIndex, 1);
    newTopics.splice(index, 0, draggedTopic);

    const reorderedTopics = newTopics.map((topic, idx) => ({
      ...topic,
      order: idx + 1
    }));

    onTopicReorder(reorderedTopics);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const startEditing = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    setEditingTopicId(topic.id);
    setEditingTitle(topic.title);
  };

  const commitEdit = () => {
    if (editingTopicId && editingTitle.trim()) {
      onTopicTitleChange(editingTopicId, editingTitle.trim());
    }
    setEditingTopicId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setEditingTopicId(null);
      setEditingTitle('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-md shadow-warm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground">Kurs Mavzulari</h3>
        <button
          onClick={onAddTopic}
          className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
          aria-label="Yangi mavzu qo'shish"
        >
          <Icon name="PlusIcon" size={20} />
          <span className="font-medium hidden sm:inline">Qo'shish</span>
        </button>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">Hali mavzu yo'q.</p>
            <p className="text-muted-foreground text-sm mt-1">"Qo'shish" tugmasini bosing.</p>
          </div>
        ) : (
          topics.map((topic, index) => {
            const isSelected = topic.id === selectedTopicId;
            const isEditing = topic.id === editingTopicId;
            return (
              <div
                key={topic.id}
                draggable={!isEditing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => !isEditing && onTopicSelect(topic.id)}
                className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-smooth group ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-warm'
                    : 'bg-muted hover:bg-muted/80'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <Icon name="Bars3Icon" size={20} className="cursor-move flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-data text-sm flex-shrink-0">{topic.order}.</span>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-background text-foreground text-sm px-2 py-0.5 rounded border border-primary outline-none min-w-0"
                      />
                    ) : (
                      <h4 className="font-medium truncate text-sm">{topic.title}</h4>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="caption text-xs opacity-80">{topic.duration}</span>
                    {topic.hasQuiz && (
                      <span className="flex items-center space-x-1 caption text-xs opacity-80">
                        <Icon name="AcademicCapIcon" size={14} />
                        <span>Test</span>
                      </span>
                    )}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={(e) => startEditing(e, topic)}
                    className={`p-1 rounded hover:bg-black/10 transition-smooth ${isSelected ? 'opacity-80' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Nomini o'zgartirish"
                  >
                    <Icon name="PencilIcon" size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic.id); }}
                    className={`p-1 rounded hover:bg-red-500/20 transition-smooth ${isSelected ? 'opacity-80' : 'opacity-0 group-hover:opacity-100'}`}
                    title="O'chirish"
                  >
                    <Icon name="TrashIcon" size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Jami mavzular:</span>
          <span className="font-data font-medium text-foreground">{topics.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CourseOutlinePanel;