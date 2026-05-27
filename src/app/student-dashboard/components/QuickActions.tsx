'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const QuickActions = () => {
  const actions: QuickAction[] = [
    { id: 'history', label: 'Tarix', icon: 'ClockIcon', href: '/transaction-history' },
    { id: 'courses', label: 'Kurslar', icon: 'BookOpenIcon', href: '/course-marketplace' },
    { id: 'learning', label: 'Mening Kurslarim', icon: 'AcademicCapIcon', href: '/learning-interface' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="flex flex-col items-center justify-center p-4 bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth"
        >
          <Icon name={action.icon as any} size={24} className="text-primary mb-2" />
          <span className="text-sm font-medium text-foreground text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
