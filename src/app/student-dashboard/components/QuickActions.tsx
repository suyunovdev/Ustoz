'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
}

const QuickActions = () => {
  const actions: QuickAction[] = [
    { id: 'bookmarks', label: 'Saqlangan', icon: 'BookmarkIcon', href: '/bookmarks', count: 12 },
    { id: 'history', label: 'Tarix', icon: 'ClockIcon', href: '/purchase-history' },
    { id: 'profile', label: 'Profil', icon: 'UserCircleIcon', href: '/profile' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="relative flex flex-col items-center justify-center p-4 bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth"
        >
          {action.count !== undefined && (
            <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs font-data font-medium rounded-full">
              {action.count}
            </span>
          )}
          <Icon name={action.icon as any} size={24} className="text-primary mb-2" />
          <span className="text-sm font-medium text-foreground text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;