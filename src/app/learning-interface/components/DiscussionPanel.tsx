'use client';

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface DiscussionPanelProps {
  topicId: string;
}

const DiscussionPanel = ({ topicId }: DiscussionPanelProps) => {
  const { t } = useI18n();
  const [newComment, setNewComment] = useState('');

  const mockDiscussions = [
  {
    id: '1',
    userName: 'Dilshod Karimov',
    userImage: "https://img.rocket.new/generatedImages/rocket_gen_img_19ac9a241-1763294570516.png",
    userImageAlt: 'User Dilshod Karimov profile photo',
    timestamp: '2 soat oldin',
    comment: 'Visual Studio Code ni qanday sozlash kerak? Qaysi kengaytmalar kerak?',
    replies: 2,
    likes: 5
  },
  {
    id: '2',
    userName: 'Malika Abdullayeva',
    userImage: "https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png",
    userImageAlt: 'User Malika Abdullayeva profile photo',
    timestamp: '5 soat oldin',
    comment: 'Ajoyib tushuntirish! Hamma narsa tushunarli bo\'ldi. Rahmat!',
    replies: 0,
    likes: 12
  }];


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      // Handle comment submission
      setNewComment('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-4">{t('learning.discussion')}</h3>
        
        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("learning.commentPlaceholder")}
            className="w-full px-4 py-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed">

              Yuborish
            </button>
          </div>
        </form>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {mockDiscussions.map((discussion) =>
        <div key={discussion.id} className="p-4 bg-card rounded-md shadow-warm space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <AppImage
                src={discussion.userImage}
                alt={discussion.userImageAlt}
                className="w-full h-full object-cover" />

              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-foreground">{discussion.userName}</p>
                  <span className="text-xs text-muted-foreground">{discussion.timestamp}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{discussion.comment}</p>
                
                <div className="flex items-center space-x-4 mt-3">
                  <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-smooth">
                    <Icon name="HandThumbUpIcon" size={16} />
                    <span>{discussion.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-smooth">
                    <Icon name="ChatBubbleLeftIcon" size={16} />
                    <span>{t('learning.reply')}</span>
                  </button>
                  {discussion.replies > 0 &&
                <span className="text-xs text-muted-foreground">
                      {discussion.replies} {t('learning.repliesCount')}
                    </span>
                }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

};

export default DiscussionPanel;