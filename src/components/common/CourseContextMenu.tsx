'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface MenuAction {
  id: string;
  label: string;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick: () => void;
}

interface CourseContextMenuProps {
  actions: MenuAction[];
  triggerLabel?: string;
  triggerIcon?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

const CourseContextMenu = ({ 
  actions, 
  triggerLabel = 'Actions',
  triggerIcon = 'EllipsisVerticalIcon',
  position = 'bottom-right'
}: CourseContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleActionClick = (action: MenuAction) => {
    action.onClick();
    setIsOpen(false);
  };

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'text-success hover:bg-success hover:text-success-foreground';
      case 'warning':
        return 'text-warning hover:bg-warning hover:text-warning-foreground';
      case 'destructive':
        return 'text-destructive hover:bg-destructive hover:text-destructive-foreground';
      default:
        return 'text-foreground hover:bg-muted';
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return 'top-full left-0 mt-2';
      case 'bottom-right':
        return 'top-full right-0 mt-2';
      case 'top-left':
        return 'bottom-full left-0 mb-2';
      case 'top-right':
        return 'bottom-full right-0 mb-2';
      default:
        return 'top-full right-0 mt-2';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-md text-foreground hover:bg-muted transition-smooth"
        aria-label={triggerLabel}
        aria-expanded={isOpen}
      >
        <Icon name={triggerIcon as any} size={20} />
        {triggerLabel && <span className="font-medium hidden sm:inline">{triggerLabel}</span>}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute ${getPositionStyles()} w-56 bg-popover rounded-md shadow-warm-lg border border-border z-200 overflow-hidden`}
        >
          <div className="py-2">
            {actions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-smooth ${getVariantStyles(action.variant)} ${
                  index !== actions.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Icon name={action.icon as any} size={20} />
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Action Sheet */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-300 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-heading font-semibold">{triggerLabel}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-muted transition-smooth"
              aria-label="Close menu"
            >
              <Icon name="XMarkIcon" size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`w-full flex items-center space-x-3 px-4 py-4 rounded-md transition-smooth ${getVariantStyles(action.variant)}`}
              >
                <Icon name={action.icon as any} size={24} />
                <span className="font-medium text-lg">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContextMenu;