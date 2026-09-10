'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatNumber } from '@/lib/i18n/format';
import type { RatingDistribution } from './types';

interface Review {
  id: string;
  userName: string;
  userImage: string;
  userImageAlt: string;
  rating: number;
  date: string;
  rawDate: string;
  comment: string;
  helpful: number;
}

interface CourseReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution[];
}

const CourseReviews = ({ reviews, averageRating, totalReviews, distribution }: CourseReviewsProps) => {
  const { t, locale } = useI18n();
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
    }
    return b.helpful - a.helpful;
  });

  // Sharh umuman yo'q — bo'sh holat
  if (totalReviews === 0) {
    return (
      <div className="bg-card rounded-md shadow-warm p-10 text-center space-y-3">
        <Icon name="ChatBubbleLeftRightIcon" size={44} className="text-muted-foreground mx-auto" />
        <h2 className="text-xl font-heading font-semibold text-foreground">{t('courseDetails.reviewsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('courseDetails.noReviews')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">{t('courseDetails.reviewsTitle')}</h2>

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border">
        {/* Average Rating */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="text-5xl font-heading font-bold text-foreground">{averageRating.toFixed(1)}</div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="StarIcon"
                size={24}
                variant={star <= Math.round(averageRating) ? 'solid' : 'outline'}
                className={star <= Math.round(averageRating) ? 'text-accent' : 'text-muted-foreground'}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{formatNumber(totalReviews, locale)} {t('courseDetails.ratings')}</p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {distribution.map((dist) => (
            <div key={dist.stars} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-16">
                <span className="text-sm font-medium text-foreground">{dist.stars}</span>
                <Icon name="StarIcon" size={14} variant="solid" className="text-accent" />
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-smooth"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {dist.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">{t('courseDetails.sortBy')}</span>
        <button
          onClick={() => setSortBy('recent')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-smooth ${
            sortBy === 'recent' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {t('courseDetails.newest')}
        </button>
        <button
          onClick={() => setSortBy('helpful')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-smooth ${
            sortBy === 'helpful' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {t('courseDetails.helpful')}
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <div key={review.id} className="p-4 bg-muted rounded-md space-y-3">
            {/* User Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar src={review.userImage} name={review.userName} size={40} />
                <div>
                  <p className="font-semibold text-foreground">{review.userName}</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          name="StarIcon"
                          size={14}
                          variant={star <= review.rating ? 'solid' : 'outline'}
                          className={star <= review.rating ? 'text-accent' : 'text-muted-foreground'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment */}
            <p className="text-foreground leading-relaxed">{review.comment}</p>

            {/* Helpful */}
            <div className="flex items-center space-x-4 pt-2">
              <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-smooth">
                <Icon name="HandThumbUpIcon" size={16} />
                <span>{t('courseDetails.helpful')} ({review.helpful})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseReviews;